import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import { Buffer } from 'buffer';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect, admin } from '../middleware/auth.js';
// lazy import in composeFinalPdf to avoid startup failure if dependency is missing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const toSignatureDoc = (row) => ({
  _id: row.id,
  ownerId: row.owner_id,
  chatId: row.chat_id,
  file: row.file || { name: '', type: '', size: 0, url: '' },
  managerSignatureUrl: row.manager_signature_url || '',
  clientSignatureUrl: row.client_signature_url || '',
  finalPdfUrl: row.final_pdf_url || '',
  managerSignPos: row.manager_sign_pos || null,
  clientSignPos: row.client_sign_pos || null,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const toMessage = (row) => ({
  _id: row.id,
  chatId: row.chat_id,
  text: row.text,
  senderId: row.sender_id,
  senderEmail: row.sender_email || '',
  attachments: row.attachments || [],
  createdAt: row.created_at
});

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
  try {
    const raw = String(urlPath || '');
    const normalized = raw.replace(/\\/g, '/').trim();
    const uploadsIdx = normalized.indexOf('/uploads/');
    let rel = normalized;
    if (uploadsIdx >= 0) {
      // keep from 'uploads/...'
      rel = normalized.slice(uploadsIdx + 1);
    } else {
      rel = normalized.replace(/^\/+/, '');
    }
    return path.join(__dirname, '..', rel);
  } catch {
    return path.join(__dirname, '..', 'uploads', 'invalid_path');
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
    const placeImageBottomLeftLastPage = async (imgUrl, widthPct = 0.25, heightPct = 0.12, leftPct = 0.05, bottomPct = 0.05, offsetXPct = 0) => {
      if (!imgUrl) return;
      const fpath = buildPathFromUrl(imgUrl);
      if (!fs.existsSync(fpath)) return;
      const img = await embedImage(fpath);
      const pageCount = typeof pdfDoc.getPageCount === 'function' ? pdfDoc.getPageCount() : 1;
      const idx = Math.max(0, pageCount - 1);
      let page;
      try {
        page = pdfDoc.getPage(idx);
      } catch {
        page = defaultPage;
      }
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const w = Math.max(24, Math.min(pageWidth, widthPct * pageWidth));
      const h = Math.max(12, Math.min(pageHeight, heightPct * pageHeight));
      const x = Math.max(0, Math.min(pageWidth - w, (leftPct + offsetXPct) * pageWidth));
      const y = Math.max(0, Math.min(pageHeight - h, bottomPct * pageHeight));
      page.drawImage(img, { x, y, width: w, height: h });
    };
    if (doc.clientSignatureUrl) {
      await placeImageBottomLeftLastPage(doc.clientSignatureUrl, 0.25, 0.12, 0.05, 0.05, 0.00);
    }
    if (doc.managerSignatureUrl) {
      await placeImageBottomLeftLastPage(doc.managerSignatureUrl, 0.25, 0.12, 0.05, 0.05, 0.28);
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
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const sigUrl = managerSignatureDataUrl ? await saveDataUrlPng(managerSignatureDataUrl) : '';
    const nowIso = new Date().toISOString();
    const row = {
      id: randomUUID(),
      owner_id: req.user._id,
      chat_id: chatId,
      file: {
        name: file.name || '',
        type: file.type || '',
        size: file.size || 0,
        url: file.url
      },
      manager_signature_url: sigUrl,
      client_signature_url: '',
      final_pdf_url: '',
      manager_sign_pos: managerSignPos || null,
      client_sign_pos: null,
      status: sigUrl ? 'manager_signed' : 'created',
      created_at: nowIso,
      updated_at: nowIso
    };
    const { data: docRow, error: docErr } = await supabase
      .from('signature_requests')
      .insert(row)
      .select('id,status')
      .single();
    if (docErr) throw docErr;
    // Optionally create a chat message with the document and clickable link
    const link = `${process.env.CLIENT_URL || ''}/sign/${docRow.id}`;
    if (!saveOnly) {
      const text = `Документ на подпись: ${link}`;
      const attachment = {
        filename: path.basename(file.url),
        originalName: 'Документ',
        mimetype: file.type || '',
        size: file.size || 0,
        url: file.url
      };
      const messageRow = {
        id: randomUUID(),
        chat_id: chatId,
        text,
        sender_id: 'manager',
        sender_email: req.user.email || '',
        attachments: [attachment],
        created_at: nowIso
      };
      const { data: insertedMsg, error: msgErr } = await supabase
        .from('messages')
        .insert(messageRow)
        .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
        .single();
      if (msgErr) throw msgErr;

      const { error: updChatErr } = await supabase
        .from('chats')
        .update({ unread: true, last_message: text, last_update: nowIso, updated_at: nowIso })
        .eq('id', chatId);
      if (updChatErr) throw updChatErr;

      const io = req.app.get('io');
      if (io) {
        const message = toMessage(insertedMsg);
        io.to(`chat-${chatId}`).emit('new-message', message);
        io.emit('new-chat-message', { chatId: chatId.toString(), message });
      }
    }
    res.status(201).json({ id: docRow.id, link: `/sign/${docRow.id}`, status: docRow.status, saveOnly: !!saveOnly });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query || {};
    const lim = Math.max(1, Math.min(500, Number(limit) || 100));

    const { data: rows, error } = await supabase
      .from('signature_requests')
      .select('id,owner_id,chat_id,file,manager_signature_url,client_signature_url,final_pdf_url,manager_sign_pos,client_sign_pos,status,created_at,updated_at')
      .eq('owner_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(lim);
    if (error) throw error;

    let items = (rows || []).map(toSignatureDoc);
    if (status) {
      if (status === 'pending') {
        items = items.filter((d) => d.status === 'created' || d.status === 'manager_signed');
      } else if (['created', 'manager_signed', 'completed', 'rejected'].includes(status)) {
        items = items.filter((d) => d.status === status);
      }
    }
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { data: row, error: docErr } = await supabase
      .from('signature_requests')
      .select('id,owner_id,chat_id,file,manager_signature_url,client_signature_url,final_pdf_url,manager_sign_pos,client_sign_pos,status,created_at,updated_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (docErr) throw docErr;
    const doc = row ? toSignatureDoc(row) : null;
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', doc.chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
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
    const { data: row, error: docErr } = await supabase
      .from('signature_requests')
      .select('id,owner_id,chat_id,file,manager_signature_url,client_signature_url,final_pdf_url,manager_sign_pos,client_sign_pos,status,created_at,updated_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (docErr) throw docErr;
    if (!row) return res.status(404).json({ message: 'Not found' });
    let doc = toSignatureDoc(row);
    const sigUrl = await saveDataUrlPng(signatureDataUrl);
    doc.managerSignatureUrl = sigUrl;
    doc.status = 'manager_signed';
    doc.updatedAt = new Date();
    const finalPdfUrl = await composeFinalPdf(doc);
    if (finalPdfUrl) {
      doc.finalPdfUrl = finalPdfUrl;
      doc.file = {
        name: 'Документ',
        type: 'application/pdf',
        size: 0,
        url: finalPdfUrl
      };
    }
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('signature_requests')
      .update({
        manager_signature_url: doc.managerSignatureUrl,
        final_pdf_url: doc.finalPdfUrl || '',
        file: doc.file,
        status: doc.status,
        updated_at: nowIso
      })
      .eq('id', req.params.id);
    if (updErr) throw updErr;
    res.json({ ok: true, finalPdfUrl: doc.finalPdfUrl || '' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/client-sign', protect, async (req, res) => {
  try {
    const { signatureDataUrl, clientSignPos } = req.body || {};
    const { data: row, error: docErr } = await supabase
      .from('signature_requests')
      .select('id,owner_id,chat_id,file,manager_signature_url,client_signature_url,final_pdf_url,manager_sign_pos,client_sign_pos,status,created_at,updated_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (docErr) throw docErr;
    if (!row) return res.status(404).json({ message: 'Not found' });
    let doc = toSignatureDoc(row);

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', doc.chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role === 'admin') return res.status(400).json({ message: 'Client only' });
    if (String(chat.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (doc.status === 'completed' || doc.clientSignatureUrl) {
      return res.status(409).json({ message: 'Already signed' });
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
      doc.file = {
        name: 'Документ',
        type: 'application/pdf',
        size: 0,
        url: finalPdfUrl
      };
    }
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('signature_requests')
      .update({
        client_signature_url: doc.clientSignatureUrl,
        client_sign_pos: doc.clientSignPos,
        final_pdf_url: doc.finalPdfUrl || '',
        file: doc.file,
        status: doc.status,
        updated_at: nowIso
      })
      .eq('id', req.params.id);
    if (updErr) throw updErr;

    const messageRow = {
      id: randomUUID(),
      chat_id: doc.chatId,
      text: 'Документ подписан клиентом',
      sender_id: req.user._id.toString(),
      sender_email: req.user.email || '',
      attachments: [
        ...(finalPdfUrl ? [{ filename: path.basename(finalPdfUrl), originalName: 'Документ', mimetype: 'application/pdf', size: 0, url: finalPdfUrl }] : [
          ...(doc.file?.url ? [{ filename: path.basename(doc.file.url), originalName: doc.file.name || 'document', mimetype: doc.file.type || '', size: doc.file.size || 0, url: doc.file.url }] : []),
          ...(doc.managerSignatureUrl ? [{ filename: path.basename(doc.managerSignatureUrl), originalName: 'Подпись менеджера', mimetype: 'image/png', size: 0, url: doc.managerSignatureUrl }] : []),
          ...(doc.clientSignatureUrl ? [{ filename: path.basename(doc.clientSignatureUrl), originalName: 'Подпись клиента', mimetype: 'image/png', size: 0, url: doc.clientSignatureUrl }] : [])
        ])
      ],
      created_at: nowIso
    };

    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert(messageRow)
      .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
      .single();
    if (msgErr) throw msgErr;

    const { error: updChatErr } = await supabase
      .from('chats')
      .update({ unread: true, last_message: 'Документ подписан клиентом', last_update: nowIso, updated_at: nowIso })
      .eq('id', doc.chatId);
    if (updChatErr) throw updChatErr;

    const io = req.app.get('io');
    if (io) {
      const message = toMessage(insertedMsg);
      io.to(`chat-${doc.chatId}`).emit('new-message', message);
      io.emit('new-chat-message', { chatId: doc.chatId.toString(), message });
    }
    res.json({ ok: true, finalPdfUrl: doc.finalPdfUrl || '' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/reject', protect, async (req, res) => {
  try {
    const { data: row, error: docErr } = await supabase
      .from('signature_requests')
      .select('id,owner_id,chat_id,file,manager_signature_url,client_signature_url,final_pdf_url,manager_sign_pos,client_sign_pos,status,created_at,updated_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (docErr) throw docErr;
    if (!row) return res.status(404).json({ message: 'Not found' });
    const doc = toSignatureDoc(row);

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', doc.chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (req.user.role === 'admin') return res.status(400).json({ message: 'Client only' });
    if (String(chat.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('signature_requests')
      .update({ status: 'rejected', updated_at: nowIso })
      .eq('id', req.params.id);
    if (updErr) throw updErr;

    const messageRow = {
      id: randomUUID(),
      chat_id: doc.chatId,
      text: 'Документ отклонён клиентом',
      sender_id: req.user._id.toString(),
      sender_email: req.user.email || '',
      attachments: [],
      created_at: nowIso
    };
    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert(messageRow)
      .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
      .single();
    if (msgErr) throw msgErr;

    const { error: updChatErr } = await supabase
      .from('chats')
      .update({ unread: true, last_message: 'Документ отклонён клиентом', last_update: nowIso, updated_at: nowIso })
      .eq('id', doc.chatId);
    if (updChatErr) throw updChatErr;

    const io = req.app.get('io');
    if (io) {
      const message = toMessage(insertedMsg);
      io.to(`chat-${doc.chatId}`).emit('new-message', message);
      io.emit('new-chat-message', { chatId: doc.chatId.toString(), message });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
