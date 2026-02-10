import express from 'express';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { protect } from '../middleware/auth.js';
import { sendTelegram } from '../config/telegram.js';

const router = express.Router();

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ message: 'ChatId and text are required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access
    // Исправлено: добавлена проверка на существование chat.userId перед вызовом toString()
    if (req.user.role !== 'admin' && chat.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const senderId = req.user.role === 'admin' ? 'manager' : req.user._id.toString();

    const message = await Message.create({
      chatId,
      text,
      senderId,
      senderEmail: req.user.email
    });

    // Update chat
    chat.lastMessage = text;
    chat.lastUpdate = new Date();
    if (req.user.role === 'admin') {
      chat.unread = false; // Admin messages don't mark as unread
    } else {
      chat.unread = true; // User messages mark as unread for admin
    }
    await chat.save();

    const senderType = req.user.role === 'admin' ? 'Менеджер' : 'Клиент';
    const tgText = [
      '💬 Новое сообщение',
      `От: ${senderType} (${req.user.email || req.user._id})`,
      `Чат: ${chatId}`,
      `Текст: ${text}`
    ].join('\n');
    sendTelegram(tgText);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chat = await Chat.findById(message.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Admin can delete any message
    if (req.user.role !== 'admin') {
      // User must own chat and be sender of message
      if (chat.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (message.senderId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${message.chatId}`).emit('message-deleted', { messageId });
      io.emit('message-deleted', { messageId });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
