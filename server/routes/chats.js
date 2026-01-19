import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all chats (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('userId', 'email phone city firstName lastName')
      .sort({ lastUpdate: -1 });

    res.json(chats.map(chat => ({
      chatId: chat._id,
      userId: chat.userId._id || chat.userId,
      userEmail: chat.userEmail,
      userInfo: chat.userId && typeof chat.userId === 'object' ? {
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
    })));
  } catch (error) {
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
      await chat.populate('userId', 'email phone city firstName lastName');
    }

    res.json({
      chatId: chat._id,
      userId: chat.userId._id || chat.userId,
      userEmail: chat.userEmail,
      userInfo: chat.userId && typeof chat.userId === 'object' ? {
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
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Users can only access their own chat, admins can access any chat
    if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
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
router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only admin can mark as read
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    chat.unread = false;
    await chat.save();

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;