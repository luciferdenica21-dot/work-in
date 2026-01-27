import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all chats (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('userId', 'email phone city firstName lastName')
      .sort({ lastUpdate: -1 });

    const formattedChats = chats.map(chat => {
      // Проверяем, удалось ли найти пользователя через populate
      const isUserPopulated = chat.userId && typeof chat.userId === 'object';

      return {
        chatId: chat._id,
        // Если пользователь удален, берем сохраненный ID из базы или 'Unknown'
        userId: isUserPopulated ? chat.userId._id : (chat.userId || 'Deleted User'),
        userEmail: chat.userEmail,
        userInfo: isUserPopulated ? {
          email: chat.userId.email,
          phone: chat.userId.phone,
          city: chat.userId.city,
          firstName: chat.userId.firstName,
          lastName: chat.userId.lastName
        } : null,
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        unread: chat.unread,
        orders: chat.orders
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.error('Ошибка в GET /api/chats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start or get a chat with a user (admin only)
router.post('/start', protect, admin, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(userId).select('email phone city firstName lastName');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let chat = await Chat.findOne({ userId: user._id }).populate('userId', 'email phone city firstName lastName');
    if (!chat) {
      chat = await Chat.create({
        userId: user._id,
        userEmail: user.email,
        lastMessage: '',
        unread: false,
      });
      await chat.populate('userId', 'email phone city firstName lastName');
    }

    const isUserPopulated = chat.userId && typeof chat.userId === 'object';

    res.json({
      chatId: chat._id,
      userId: isUserPopulated ? chat.userId._id : chat.userId,
      userEmail: chat.userEmail,
      userInfo: isUserPopulated ? {
        email: chat.userId.email,
        phone: chat.userId.phone,
        city: chat.userId.city,
        firstName: chat.userId.firstName,
        lastName: chat.userId.lastName
      } : null,
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
      unread: chat.unread,
      orders: chat.orders
    });
  } catch (error) {
    console.error('Ошибка в POST /api/chats/start:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's own chat
router.get('/my-chat', protect, async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.user._id })
      .populate('userId', 'email phone city firstName lastName');

    if (!chat) {
      // Create chat if doesn't exist
      chat = await Chat.create({
        userId: req.user._id,
        userEmail: req.user.email,
        lastMessage: '',
        unread: false
      });
      // Повторно загружаем данные пользователя после создания
      await chat.populate('userId', 'email phone city firstName lastName');
    }

    const isUserPopulated = chat.userId && typeof chat.userId === 'object';

    res.json({
      chatId: chat._id,
      userId: isUserPopulated ? chat.userId._id : chat.userId,
      userEmail: chat.userEmail,
      userInfo: isUserPopulated ? {
        email: chat.userId.email,
        phone: chat.userId.phone,
        city: chat.userId.city,
        firstName: chat.userId.firstName,
        lastName: chat.userId.lastName
      } : null,
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
      unread: chat.unread,
      orders: chat.orders
    });
  } catch (error) {
    console.error('Ошибка в GET /my-chat:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Проверка прав: админ или владелец чата
    if (req.user.role !== 'admin' && chat.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark chat as read
router.patch('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (req.user.role !== 'admin' && chat.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chat.unread = false;
    await chat.save();

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Очистка чата (удалить все сообщения) (только админ)
router.delete('/:chatId/messages', protect, admin, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chatId });

    chat.lastMessage = '';
    chat.unread = false;
    chat.lastUpdate = new Date();
    await chat.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${chatId}`).emit('chat-cleared', { chatId });
      io.emit('chat-cleared', { chatId });
    }

    res.json({ message: 'Chat cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Удаление чата (только админ)
router.delete('/:chatId', protect, admin, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Удаляем сам чат
    const chat = await Chat.findByIdAndDelete(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Удаляем все сообщения, связанные с этим чатом
    await Message.deleteMany({ chatId });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${chatId}`).emit('chat-deleted', { chatId });
      io.emit('chat-deleted', { chatId });
    }

    res.json({ message: 'Chat and messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Удаление отдельного сообщения (только админ)
router.delete('/message/:messageId', protect, admin, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;