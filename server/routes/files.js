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

// Upload file to message
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { chatId, messageId } = req.body;

    // If messageId provided, add to existing message
    if (messageId) {
      const message = await Message.findById(messageId);
      if (!message) {
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
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      });
      await message.save();

      return res.json({
        message: 'File uploaded',
        attachment: message.attachments[message.attachments.length - 1]
      });
    }

    // If chatId provided, create new message with file
    if (chatId) {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const senderId = req.user.role === 'admin' ? 'manager' : req.user._id.toString();
      const fileUrl = `/uploads/${req.file.filename}`;

      const message = await Message.create({
        chatId,
        text: `📎 ${req.file.originalname}`,
        senderId,
        senderEmail: req.user.email,
        attachments: [{
          filename: req.file.filename,
          originalName: req.file.originalname,
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

      return res.status(201).json(message);
    }

    res.status(400).json({ message: 'chatId or messageId is required' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

export default router;