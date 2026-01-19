import express from 'express';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { protect } from '../middleware/auth.js';

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
    if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
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

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;