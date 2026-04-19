import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

const ensureChatForUser = async ({ userId, userEmail }) => {
  const { data: existing, error: findErr } = await supabase
    .from('chats')
    .select('id,user_id,user_email,orders,last_update')
    .eq('user_id', userId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const chatRow = {
    id: randomUUID(),
    user_id: userId,
    user_email: userEmail,
    last_message: '',
    last_update: nowIso,
    unread: false,
    orders: [],
    created_at: nowIso,
    updated_at: nowIso
  };
  const { data: created, error: createErr } = await supabase
    .from('chats')
    .insert(chatRow)
    .select('id,user_id,user_email,orders,last_update')
    .single();
  if (createErr) throw createErr;
  return created;
};

// ПОЛУЧИТЬ ВСЕ ЗАКАЗЫ (Добавлено для менеджера)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id,orders')
      .not('orders', 'is', null);
    if (error) throw error;

    let allOrders = [];
    (chats || []).forEach(chat => {
      const orders = Array.isArray(chat.orders) ? chat.orders : [];
      orders.forEach((order, index) => {
        allOrders.push({ 
          ...(order || {}), 
          chatId: chat.id, 
          orderIndex: index // Индекс важен для удаления/обновления
        });
      });
    });
    res.json(allOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
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
    
    const { firstName, lastName, contact, phone, city, services, comment, files, aiSession } = req.body;
    
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
    let chat = await ensureChatForUser({ userId: req.user._id, userEmail: req.user.email });
    console.log('Chat for order:', chat.id);

    const normalizedFiles = Array.isArray(files)
      ? files.map((f) => ({
          id: f?.id,
          name: f?.name || f?.originalName || f?.filename || '',
          type: f?.type || f?.mimetype || '',
          size: f?.size ?? null,
          url: f?.url || f?.fileUrl || f?.path || ''
        }))
      : [];

    const newOrder = {
      firstName: firstName || '',
      lastName: lastName || '',
      contact: contact || '',
      phone: phone || '',
      city: city || '',
      services: services || [], // Используем правильные значения по умолчанию
      comment: comment || '',
      files: normalizedFiles, // Сохраняем файлы к заказу
      aiSession: aiSession && typeof aiSession === 'object' ? aiSession : null,
      status: 'new', // ИСПОЛЬЗУЕМ 'new' ВМЕСТО 'pending' ДЛЯ ВАЛИДАЦИИ
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating order:', newOrder);

    const existingOrders = Array.isArray(chat.orders) ? chat.orders : [];
    const updatedOrders = [...existingOrders, newOrder];
    const nowIso = new Date().toISOString();

    console.log('Saving chat with new order...');
    const { error: updErr } = await supabase
      .from('chats')
      .update({ orders: updatedOrders, last_update: nowIso, updated_at: nowIso })
      .eq('id', chat.id);
    if (updErr) throw updErr;
    
    const io = req.app.get('io');
    if (io) {
      io.emit('order-created', { chatId: chat.id.toString(), order: newOrder });
    }
    
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
      
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id,orders')
        .eq('id', chatId)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      const orders = Array.isArray(chat.orders) ? chat.orders : [];
      if (!orders[orderIdx]) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      console.log('Updating order:', orders[orderIdx]);
      orders[orderIdx] = { ...(orders[orderIdx] || {}), status };
      const nowIso = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('chats')
        .update({ orders, updated_at: nowIso })
        .eq('id', chatId);
      if (updErr) throw updErr;
      
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
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id,user_id,orders')
        .eq('id', chatId)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Проверяем права: админ может удалять любой, клиент - только свои
      if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Проверяем существование заказа
      const orders = Array.isArray(chat.orders) ? chat.orders : [];
      if (!orders[orderIdx]) {
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log('Deleting order:', orders[orderIdx]);

      // Удаляем заказ
      orders.splice(orderIdx, 1);
      const nowIso = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('chats')
        .update({ orders, updated_at: nowIso })
        .eq('id', chatId);
      if (updErr) throw updErr;

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

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,orders')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    const orders = Array.isArray(chat.orders) ? chat.orders : [];
    if (!orders[orderIdx]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = { ...(orders[orderIdx] || {}) };
    if (typeof managerComment === 'string') order.managerComment = managerComment;
    if (priceGel !== undefined) order.priceGel = Number(priceGel) || 0;
    if (priceUsd !== undefined) order.priceUsd = Number(priceUsd) || 0;
    if (priceEur !== undefined) order.priceEur = Number(priceEur) || 0;
    if (managerDate !== undefined) {
      order.managerDate = managerDate ? new Date(managerDate) : null;
    }

    orders[orderIdx] = order;
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('chats')
      .update({ orders, last_update: nowIso, updated_at: nowIso })
      .eq('id', chatId);
    if (updErr) throw updErr;

    const responseOrder = { 
      ...order, 
      chatId: chat.id, 
      orderIndex: orderIdx 
    };
    res.json(responseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:chatId/:orderIndex/details', protect, admin, async (req, res) => {
  try {
    const { chatId, orderIndex } = req.params;
    const orderIdx = parseInt(orderIndex);

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,orders')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    const orders = Array.isArray(chat.orders) ? chat.orders : [];
    if (!orders[orderIdx]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = { ...(orders[orderIdx] || {}) };
    order.managerComment = '';
    order.priceGel = 0;
    order.priceUsd = 0;
    order.priceEur = 0;
    order.managerDate = null;
    orders[orderIdx] = order;
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('chats')
      .update({ orders, last_update: nowIso, updated_at: nowIso })
      .eq('id', chatId);
    if (updErr) throw updErr;

    res.json({ message: 'Cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
