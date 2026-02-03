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
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('User:', req.user._id, req.user.email);
    console.log('Request body:', req.body);
    
    const { firstName, lastName, contact, services, comment, files } = req.body;
    
    // Валидация обязательных полей
    if (!services || !Array.isArray(services) || services.length === 0) {
      console.log('ERROR: No services provided');
      return res.status(400).json({ message: 'Services are required' });
    }
    
    if (!contact) {
      console.log('ERROR: No contact provided');
      return res.status(400).json({ message: 'Contact is required' });
    }
    
    console.log('Finding chat for user:', req.user._id);
    let chat = await Chat.findOne({ userId: req.user._id });

    if (!chat) {
      console.log('Creating new chat for user:', req.user._id);
      chat = await Chat.create({
        userId: req.user._id,
        userEmail: req.user.email,
        lastMessage: 'Новый заказ оформлен',
        unread: true
      });
      console.log('New chat created:', chat._id);
    } else {
      console.log('Found existing chat:', chat._id);
    }

    const newOrder = {
      firstName: firstName || '',
      lastName: lastName || '',
      contact: contact || '',
      services: services || [], // Используем правильные значения по умолчанию
      comment: comment || '',
      files: files || [], // Сохраняем файлы к заказу
      status: 'new', // ИСПОЛЬЗУЕМ 'new' ВМЕСТО 'pending' ДЛЯ ВАЛИДАЦИИ
      createdAt: new Date()
    };
    
    console.log('Creating order:', newOrder);

    chat.orders.push(newOrder);
    chat.lastMessage = 'Новый заказ оформлен';
    chat.unread = true;
    
    console.log('Saving chat with new order...');
    await chat.save();
    
    console.log('Order created successfully:', newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ОСТАЛЬНЫЕ РОУТЫ (update/delete) ОСТАЮТСЯ КАК В ВАШЕМ ФАЙЛЕ
router.put('/:chatId/:orderIndex/status', protect, admin, async (req, res) => {
    try {
      console.log('=== UPDATE ORDER STATUS ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      
      const { chatId, orderIndex } = req.params;
      const { status } = req.body;
      
      // Конвертируем orderIndex в число
      const orderIdx = parseInt(orderIndex);
      
      if (!['new', 'accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      if (!chat.orders[orderIdx]) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      console.log('Updating order:', chat.orders[orderIdx]);
      chat.orders[orderIdx].status = status;
      await chat.save();
      
      console.log('Order status updated successfully');
      res.json({ message: 'Updated' });
    } catch (error) {
      console.error('=== UPDATE ORDER STATUS ERROR ===');
      console.error('Error:', error);
      res.status(500).json({ message: error.message });
    }
});

router.delete('/:chatId/:orderIndex', protect, async (req, res) => {
    try {
      console.log('=== DELETE ORDER ===');
      console.log('Params:', req.params);
      
      const { chatId, orderIndex } = req.params;
      
      // Конвертируем orderIndex в число
      const orderIdx = parseInt(orderIndex);
      
      // Находим чат
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Проверяем права: админ может удалять любой, клиент - только свои
      if (req.user.role !== 'admin' && chat.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Проверяем существование заказа
      if (!chat.orders[orderIdx]) {
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log('Deleting order:', chat.orders[orderIdx]);

      // Удаляем заказ
      chat.orders.splice(orderIdx, 1);
      await chat.save();

      console.log('Order deleted successfully');
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('=== DELETE ORDER ERROR ===');
      console.error('Error:', error);
      res.status(500).json({ message: error.message });
    }
});

router.put('/:chatId/:orderIndex/details', protect, admin, async (req, res) => {
  try {
    const { chatId, orderIndex } = req.params;
    const orderIdx = parseInt(orderIndex);
    const { managerComment, priceGel, priceUsd, priceEur, managerDate } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!chat.orders[orderIdx]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = chat.orders[orderIdx];
    if (typeof managerComment === 'string') order.managerComment = managerComment;
    if (priceGel !== undefined) order.priceGel = Number(priceGel) || 0;
    if (priceUsd !== undefined) order.priceUsd = Number(priceUsd) || 0;
    if (priceEur !== undefined) order.priceEur = Number(priceEur) || 0;
    if (managerDate !== undefined) {
      order.managerDate = managerDate ? new Date(managerDate) : null;
    }

    chat.lastUpdate = new Date();
    await chat.save();

    const responseOrder = { 
      ...order.toObject(), 
      chatId: chat._id, 
      orderIndex: orderIdx 
    };
    res.json(responseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
