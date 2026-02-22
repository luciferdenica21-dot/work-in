import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import { Buffer } from 'buffer';
import SignatureRequest from '../models/SignatureRequest.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { protect, admin } from '../middleware/auth.js';
// lazy import in composeFinalPdf to avoid startup failure if dependency is missing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const saveDataUrlPng = async (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  const m = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!m) return '';
  const buf = Buffer.from(m[1], 'base64');
  const dir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = `sig_${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
  const filePath = path.join(dir, name);
  await fs.promises.writeFile(filePath, buf);
  return `/uploads/${name}`;
};

const buildPathFromUrl = (urlPath) => {
  const fname = urlPath.replace(/^\/+/, '');
  return path.join(__dirname, '..', fname);
};

const sanitizeName = (s) => {
  try {
    const n = (s || '').normalize('NFC');
    return n.replace(/[^\u0020-\u007E\u00A0-\u00BF\u0100-\u024F\u0400-\u04FF\u10A0-\u10FF\u1C90-\u1CBF0-9A-Za-zА-Яа-яა-ჰ.\-_()\s]/g, '').trim() || 'document';
  } catch {
    return 'document';
  }
};

const composeFinalPdf = async (doc) => {
  try {
    const { PDFDocument } = await import('pdf-lib');
    if (!doc?.file?.url) return null;
    const srcPath = buildPathFromUrl(doc.file.url);
    if (!fs.existsSync(srcPath)) return null;
    const outName = `signed_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    const outPath = path.join(__dirname, '../uploads', outName);
    const srcBytes = await fs.promises.readFile(srcPath);
    const isPdf = String(doc.file.type || '').includes('pdf') || srcPath.toLowerCase().endsWith('.pdf');
    let pdfDoc;
    let defaultPage;
    if (isPdf) {
      pdfDoc = await PDFDocument.load(srcBytes);
      defaultPage = pdfDoc.getPage(0);
    } else {
      pdfDoc = await PDFDocument.create();
      defaultPage = pdfDoc.addPage();
      // try embed image as background
      const isImg = String(doc.file.type || '').startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(srcPath);
      if (isImg) {
        const imgBytes = srcBytes;
        let img;
        if (doc.file.type?.includes('png') || srcPath.toLowerCase().endsWith('.png')) {
          img = await pdfDoc.embedPng(imgBytes);
        } else {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        const { width, height } = img.size();
        defaultPage.setSize(width, height);
        defaultPage.drawImage(img, { x: 0, y: 0, width, height });
      } else {
        // Fallback: empty white A4
        defaultPage.setSize(595.28, 841.89);
      }
    }
    const embedImage = async (filePath) => {
      const b = await fs.promises.readFile(filePath);
      if (filePath.toLowerCase().endsWith('.png')) {
        return await pdfDoc.embedPng(b);
      } else {
        return await pdfDoc.embedJpg(b);
      }
    };
    const placeImage = async (imgUrl, pos) => {
      if (!imgUrl || !pos) return;
      let page = defaultPage;
      const pageNum = Number(pos.page);
      if (pdfDoc && Number.isFinite(pageNum) && pageNum >= 1) {
        const idx = Math.max(0, Math.min((pdfDoc.getPageCount?.() || 1) - 1, Math.floor(pageNum - 1)));
        try {
          page = pdfDoc.getPage(idx);
        } catch {
          page = defaultPage;
        }
      }
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const fpath = buildPathFromUrl(imgUrl);
      if (!fs.existsSync(fpath)) return;
      const img = await embedImage(fpath);
      const nx = Number(pos.x);
      const ny = Number(pos.y);
      const nw = Number(pos.w);
      const nh = Number(pos.h);
      const w = (Number.isFinite(nw) ? nw : 0.2) * pageWidth;
      const h = (Number.isFinite(nh) ? nh : 0.1) * pageHeight;
      const x = Math.max(0, Math.min(pageWidth - w, (Number.isFinite(nx) ? nx : 0) * pageWidth));
      const y = Math.max(0, Math.min(pageHeight - h, (1 - (Number.isFinite(ny) ? ny : 0)) * pageHeight - h));
      page.drawImage(img, { x, y, width: w, height: h });
    };
    if (doc.managerSignatureUrl && doc.managerSignPos) {
      await placeImage(doc.managerSignatureUrl, doc.managerSignPos);
    }
    if (doc.clientSignatureUrl) {
      const cpos = doc.clientSignPos || doc.managerSignPos || null;
      if (cpos) {
        await placeImage(doc.clientSignatureUrl, cpos);
      }
    }
    const outBytes = await pdfDoc.save();
    await fs.promises.writeFile(outPath, outBytes);
    return `/uploads/${outName}`;
  } catch (e) {
    console.error('composeFinalPdf error', e);
    return null;
  }
};

router.post('/', protect, admin, async (req, res) => {
  try {
    const { chatId, file, managerSignatureDataUrl, managerSignPos, saveOnly } = req.body || {};
    if (!chatId || !file || !file.url) return res.status(400).json({ message: 'chatId and file are required' });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const sigUrl = managerSignatureDataUrl ? await saveDataUrlPng(managerSignatureDataUrl) : '';
    const doc = await SignatureRequest.create({
      ownerId: req.user._id,
      chatId,
      file: {
        name: file.name || '',
        type: file.type || '',
        size: file.size || 0,
        url: file.url
      },
      managerSignatureUrl: sigUrl,
      managerSignPos: managerSignPos || null,
      status: sigUrl ? 'manager_signed' : 'created'
    });
    // Optionally create a chat message with the document and clickable link
    const link = `${process.env.CLIENT_URL || ''}/sign/${doc._id}`;
    if (!saveOnly) {
      const text = `Документ на подпись: ${link}`;
      const attachment = {
        filename: path.basename(doc.file.url),
        originalName: sanitizeName(doc.file.name || 'document'),
        mimetype: doc.file.type || '',
        size: doc.file.size || 0,
        url: doc.file.url
      };
      const message = await Message.create({
        chatId,
        text,
        senderId: 'manager',
        senderEmail: req.user.email,
        attachments: [attachment]
      });
      chat.unread = true;
      chat.lastMessage = text;
      chat.lastUpdate = new Date();
      await chat.save();
      const io = req.app.get('io');
      if (io) {
        io.to(`chat-${chatId}`).emit('new-message', message);
        io.emit('new-chat-message', { chatId: chatId.toString(), message: message.toObject() });
      }
    }
    res.status(201).json({ id: doc._id, link: `/sign/${doc._id}`, status: doc.status, saveOnly: !!saveOnly });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query || {};
    const q = { ownerId: req.user._id };
    if (status) {
      if (status === 'pending') {
        q.status = { $in: ['created', 'manager_signed'] };
      } else if (['created', 'manager_signed', 'completed', 'rejected'].includes(status)) {
        q.status = status;
      }
    }
    const items = await SignatureRequest.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(500, Number(limit) || 100)));
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await SignatureRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const chat = await Chat.findById(doc.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/manager-sign', protect, admin, async (req, res) => {
  try {
    const { signatureDataUrl } = req.body || {};
    const doc = await SignatureRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const sigUrl = await saveDataUrlPng(signatureDataUrl);
    doc.managerSignatureUrl = sigUrl;
    doc.status = 'manager_signed';
    doc.updatedAt = new Date();
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/client-sign', protect, async (req, res) => {
  try {
    const { signatureDataUrl, clientSignPos } = req.body || {};
    const doc = await SignatureRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const chat = await Chat.findById(doc.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role === 'admin') return res.status(400).json({ message: 'Client only' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const sigUrl = await saveDataUrlPng(signatureDataUrl);
    doc.clientSignatureUrl = sigUrl;
    if (clientSignPos) {
      doc.clientSignPos = clientSignPos;
    }
    doc.status = 'completed';
    doc.updatedAt = new Date();
    // Compose final pdf
    const finalPdfUrl = await composeFinalPdf(doc);
    if (finalPdfUrl) {
      doc.finalPdfUrl = finalPdfUrl;
    }
    await doc.save();
    const message = await Message.create({
      chatId: doc.chatId,
      text: 'Документ подписан клиентом',
      senderId: req.user._id.toString(),
      senderEmail: req.user.email,
      attachments: [
        ...(finalPdfUrl ? [{ filename: path.basename(finalPdfUrl), originalName: 'Подписанный документ.pdf', mimetype: 'application/pdf', size: 0, url: finalPdfUrl }] : [
          ...(doc.file?.url ? [{ filename: path.basename(doc.file.url), originalName: doc.file.name || 'document', mimetype: doc.file.type || '', size: doc.file.size || 0, url: doc.file.url }] : []),
          ...(doc.managerSignatureUrl ? [{ filename: path.basename(doc.managerSignatureUrl), originalName: 'Подпись менеджера', mimetype: 'image/png', size: 0, url: doc.managerSignatureUrl }] : []),
          ...(doc.clientSignatureUrl ? [{ filename: path.basename(doc.clientSignatureUrl), originalName: 'Подпись клиента', mimetype: 'image/png', size: 0, url: doc.clientSignatureUrl }] : [])
        ])
      ]
    });
    chat.unread = true;
    chat.lastMessage = 'Документ подписан клиентом';
    chat.lastUpdate = new Date();
    await chat.save();
    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${doc.chatId}`).emit('new-message', message);
      io.emit('new-chat-message', { chatId: doc.chatId.toString(), message: message.toObject() });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/reject', protect, async (req, res) => {
  try {
    const doc = await SignatureRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const chat = await Chat.findById(doc.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role === 'admin') return res.status(400).json({ message: 'Client only' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    doc.status = 'rejected';
    doc.updatedAt = new Date();
    await doc.save();
    const message = await Message.create({
      chatId: doc.chatId,
      text: 'Документ отклонён клиентом',
      senderId: req.user._id.toString(),
      senderEmail: req.user.email,
      attachments: []
    });
    chat.unread = true;
    chat.lastMessage = 'Документ отклонён клиентом';
    chat.lastUpdate = new Date();
    await chat.save();
    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${doc.chatId}`).emit('new-message', message);
      io.emit('new-chat-message', { chatId: doc.chatId.toString(), message: message.toObject() });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
