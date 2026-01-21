import express from 'express';
import Chat from '../models/Chat.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ (Добавлено для менеджера)
router.get('/', protect, admin, async (req, res) => {
  try {
    const chats = await Chat.find({ 'orders.0': { $exists: true } });
    let allOrders = [];
    chats.forEach(chat => {
      chat.orders.forEach((order, index) => {
        allOrders.push({ 
          ...order.toObject(), 
          chatId: chat._id, 
          orderIndex: index // Индекс важен для удаления/обновления
        });
      });
    });
    res.json(allOrders.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// СОЗДАНИЕ ЗАКАЗА
router.post('/', protect, async (req, res) => {
  try {
    const { firstName, lastName, contact, services, comment } = req.body;
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
      status: 'new', // ИСПОЛЬЗУЕМ 'new' ВМЕСТО 'pending' ДЛЯ ВАЛИДАЦИИ
      createdAt: new Date()
    };

    chat.orders.push(newOrder);
    chat.lastMessage = 'Новый заказ оформлен';
    chat.unread = true;
    await chat.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ОСТАЛЬНЫЕ РОУТЫ (update/delete) ОСТАЮТСЯ КАК В ВАШЕМ ФАЙЛЕ
router.put('/:chatId/:orderIndex/status', protect, admin, async (req, res) => {
    /* Ваш существующий код обновления */
    const { chatId, orderIndex } = req.params;
    const { status } = req.body;
    if (!['new', 'accepted', 'declined'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.orders[orderIndex]) return res.status(404).json({ message: 'Not found' });
    chat.orders[orderIndex].status = status;
    await chat.save();
    res.json({ message: 'Updated' });
});

router.delete('/:chatId/:orderIndex', protect, admin, async (req, res) => {
    /* Ваш существующий код удаления */
    const { chatId, orderIndex } = req.params;
    const chat = await Chat.findById(chatId);
    if (chat) {
        chat.orders.splice(orderIndex, 1);
        await chat.save();
    }
    res.json({ message: 'Deleted' });
});

export default router;