import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { upload } from '../middleware/upload.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const sanitizeName = (s) => {
  try {
    const n = (s || '').normalize('NFC');
    return n.replace(/[^\u0020-\u007E\u00A0-\u00BF\u0100-\u024F\u0400-\u04FF\u10A0-\u10FF\u1C90-\u1CBF0-9A-Za-zА-Яа-яა-ჰ\.\-_\(\)\s]/g, '').trim() || 'document';
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
      const message = await Message.findById(parsedMessageId);
      if (!message) {
        console.log('ERROR: Message not found');
        return res.status(404).json({ message: 'Message not found' });
      }

      // Check access
      const chat = await Chat.findById(message.chatId);
      if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      message.attachments.push({
        filename: req.file.filename,
        originalName: sanitizeName(req.file.originalname),
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      });
      await message.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`chat-${message.chatId}`).emit('new-message', message);
        io.emit('new-chat-message', { chatId: message.chatId.toString(), message: message.toObject() });
      }

      return res.json({
        message: 'File uploaded',
        attachment: message.attachments[message.attachments.length - 1]
      });
    }

    // If chatId provided, create new message with file
    if (parsedChatId) {
      const chat = await Chat.findById(parsedChatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const senderId = req.user.role === 'admin' ? 'manager' : req.user._id.toString();
      const fileUrl = `/uploads/${req.file.filename}`;

      const message = await Message.create({
        chatId: parsedChatId,
        text: `📎 Отправлен файл: ${sanitizeName(req.file.originalname)}`,
        senderId,
        senderEmail: req.user.email,
        attachments: [{
          filename: req.file.filename,
          originalName: sanitizeName(req.file.originalname),
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl
        }]
      });

      // Update chat
      chat.lastMessage = `📎 ${req.file.originalname}`;
      chat.lastUpdate = new Date();
      if (req.user.role !== 'admin') {
        chat.unread = true;
      }
      await chat.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`chat-${parsedChatId}`).emit('new-message', message);
        io.emit('new-chat-message', { chatId: parsedChatId.toString(), message: message.toObject() });
      }

      // Возвращаем правильный формат для клиента
      return res.status(201).json({
        messageId: message._id,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        message: message
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
