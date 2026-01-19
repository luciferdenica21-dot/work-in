import express from 'express';
import Chat from '../models/Chat.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Create order
router.post('/', protect, async (req, res) => {
  try {
    const { firstName, lastName, contact, services, comment } = req.body;

    if (!services || services.length === 0) {
      return res.status(400).json({ message: 'At least one service is required' });
    }

    let chat = await Chat.findOne({ userId: req.user._id });

    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        userEmail: req.user.email,
        lastMessage: 'Новый заказ оформлен',
        unread: true
      });
    }

    const newOrder = {
      firstName: firstName || '',
      lastName: lastName || '',
      contact: contact || '',
      services: services,
      comment: comment || '',
      status: 'new',
      createdAt: new Date()
    };

    chat.orders.push(newOrder);
    chat.lastMessage = 'Новый заказ оформлен';
    chat.lastUpdate = new Date();
    chat.unread = true;
    await chat.save();

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (admin only)
router.put('/:chatId/:orderIndex/status', protect, admin, async (req, res) => {
  try {
    const { chatId, orderIndex } = req.params;
    const { status } = req.body;

    if (!['new', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.orders[orderIndex]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    chat.orders[orderIndex].status = status;
    await chat.save();

    res.json({ message: 'Order status updated', order: chat.orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete order (admin only)
router.delete('/:chatId/:orderIndex', protect, admin, async (req, res) => {
  try {
    const { chatId, orderIndex } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.orders[orderIndex]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    chat.orders.splice(orderIndex, 1);
    await chat.save();

    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;