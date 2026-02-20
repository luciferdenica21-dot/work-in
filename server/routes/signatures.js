import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SignatureRequest from '../models/SignatureRequest.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { protect, admin } from '../middleware/auth.js';

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

router.post('/', protect, admin, async (req, res) => {
  try {
    const { chatId, file, managerSignatureDataUrl } = req.body || {};
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
      status: sigUrl ? 'manager_signed' : 'created'
    });
    res.status(201).json({ id: doc._id, link: `/sign/${doc._id}` });
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
    const { signatureDataUrl } = req.body || {};
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
    doc.status = 'completed';
    doc.updatedAt = new Date();
    await doc.save();
    const message = await Message.create({
      chatId: doc.chatId,
      text: 'Документ подписан клиентом',
      senderId: req.user._id.toString(),
      senderEmail: req.user.email,
      attachments: [
        ...(doc.file?.url ? [{ filename: path.basename(doc.file.url), originalName: doc.file.name || 'document', mimetype: doc.file.type || '', size: doc.file.size || 0, url: doc.file.url }] : []),
        ...(doc.managerSignatureUrl ? [{ filename: path.basename(doc.managerSignatureUrl), originalName: 'Подпись менеджера', mimetype: 'image/png', size: 0, url: doc.managerSignatureUrl }] : []),
        ...(doc.clientSignatureUrl ? [{ filename: path.basename(doc.clientSignatureUrl), originalName: 'Подпись клиента', mimetype: 'image/png', size: 0, url: doc.clientSignatureUrl }] : [])
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

export default router;
