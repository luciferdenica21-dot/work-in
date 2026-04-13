import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { upload } from '../middleware/upload.js';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const toMessage = (row) => ({
  _id: row.id,
  chatId: row.chat_id,
  text: row.text,
  senderId: row.sender_id,
  senderEmail: row.sender_email || '',
  attachments: row.attachments || [],
  createdAt: row.created_at
});

const sanitizeName = (s) => {
  try {
    const n = (s || '').normalize('NFC');
    return n.replace(/[^\u0020-\u007E\u00A0-\u00BF\u0100-\u024F\u0400-\u04FF\u10A0-\u10FF\u1C90-\u1CBF0-9A-Za-zА-Яа-яა-ჰ.\-_()\s]/g, '').trim() || 'document';
  } catch {
    return 'document';
  }
};

// Upload file to message
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    console.log('=== FILE UPLOAD REQUEST ===');
    console.log('User:', req.user._id, req.user.email);
    console.log('File info:', {
      originalname: req.file?.originalname,
      filename: req.file?.filename,
      size: req.file?.size,
      mimetype: req.file?.mimetype
    });
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { chatId, messageId } = req.body;
    console.log('Processing upload for chatId:', chatId, 'messageId:', messageId);
    
    // Преобразуем строковые значения
    const parsedChatId = chatId === 'undefined' || chatId === 'null' || !chatId ? null : chatId;
    const parsedMessageId = messageId === 'undefined' || messageId === 'null' || !messageId ? null : messageId;

    // If messageId provided, add to existing message
    if (parsedMessageId) {
      const { data: message, error: msgErr } = await supabase
        .from('messages')
        .select('id,chat_id,attachments')
        .eq('id', parsedMessageId)
        .maybeSingle();
      if (msgErr) throw msgErr;
      if (!message) {
        console.log('ERROR: Message not found');
        return res.status(404).json({ message: 'Message not found' });
      }

      // Check access
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id,user_id')
        .eq('id', message.chat_id)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat) return res.status(404).json({ message: 'Chat not found' });
      if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const attachments = Array.isArray(message.attachments) ? message.attachments : [];
      attachments.push({
        filename: req.file.filename,
        originalName: sanitizeName(req.file.originalname),
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      });

      const { data: updated, error: updErr } = await supabase
        .from('messages')
        .update({ attachments })
        .eq('id', parsedMessageId)
        .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
        .single();
      if (updErr) throw updErr;

      const io = req.app.get('io');
      if (io) {
        const mapped = toMessage(updated);
        io.to(`chat-${updated.chat_id}`).emit('new-message', mapped);
        io.emit('new-chat-message', { chatId: updated.chat_id.toString(), message: mapped });
      }

      return res.json({
        message: 'File uploaded',
        attachment: attachments[attachments.length - 1]
      });
    }

    // If chatId provided, create new message with file
    if (parsedChatId) {
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id,user_id')
        .eq('id', parsedChatId)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const senderId = req.user.role === 'admin' ? 'manager' : req.user._id.toString();
      const fileUrl = `/uploads/${req.file.filename}`;

      const nowIso = new Date().toISOString();
      const msgRow = {
        id: randomUUID(),
        chat_id: parsedChatId,
        text: `📎 Отправлен файл: ${sanitizeName(req.file.originalname)}`,
        sender_id: senderId,
        sender_email: req.user.email || '',
        attachments: [{
          filename: req.file.filename,
          originalName: sanitizeName(req.file.originalname),
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl
        }],
        created_at: nowIso
      };
      const { data: message, error: msgErr } = await supabase
        .from('messages')
        .insert(msgRow)
        .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
        .single();
      if (msgErr) throw msgErr;

      // Update chat
      const { error: updChatErr } = await supabase
        .from('chats')
        .update({
          last_message: `📎 ${req.file.originalname}`,
          last_update: nowIso,
          unread: req.user.role !== 'admin',
          updated_at: nowIso
        })
        .eq('id', parsedChatId);
      if (updChatErr) throw updChatErr;

      const io = req.app.get('io');
      if (io) {
        const mapped = toMessage(message);
        io.to(`chat-${parsedChatId}`).emit('new-message', mapped);
        io.emit('new-chat-message', { chatId: parsedChatId.toString(), message: mapped });
      }

      // Возвращаем правильный формат для клиента
      return res.status(201).json({
        messageId: message.id,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        message: toMessage(message)
      });
    }

    // Если нет chatId, просто загружаем файл (для заказов)
    const fileUrl = `/uploads/${req.file.filename}`;
    
    return res.status(201).json({
      messageId: `file_${new Date().getTime()}`,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('=== FILE UPLOAD ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: error.message,
      error: 'File upload failed'
    });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

export default router;
