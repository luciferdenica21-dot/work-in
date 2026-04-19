import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

const toUserInfo = (row) => {
  if (!row) return null;
  return {
    email: row.email,
    phone: row.phone || '',
    city: row.city || '',
    firstName: row.first_name || '',
    lastName: row.last_name || ''
  };
};

const toChatResponse = (chatRow, userRow) => {
  const userInfo = toUserInfo(userRow);
  return {
    chatId: chatRow.id,
    userId: chatRow.user_id || 'Deleted User',
    userEmail: chatRow.user_email,
    userInfo,
    lastMessage: chatRow.last_message || '',
    lastUpdate: chatRow.last_update,
    unread: !!chatRow.unread,
    unreadByClient: !!chatRow.unread_by_client,
    orders: chatRow.orders || []
  };
};

const toMessage = (row) => ({
  _id: row.id,
  chatId: row.chat_id,
  text: row.text,
  senderId: row.sender_id,
  senderEmail: row.sender_email || '',
  attachments: row.attachments || [],
  createdAt: row.created_at
});

// Get all chats (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id,user_id,user_email,last_message,last_update,unread,unread_by_client,orders')
      .order('last_update', { ascending: false });
    if (error) throw error;

    const userIds = Array.from(new Set((chats || []).map((c) => c.user_id).filter(Boolean)));
    let usersById = new Map();
    if (userIds.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id,email,phone,city,first_name,last_name')
        .in('id', userIds);
      if (uErr) throw uErr;
      usersById = new Map((users || []).map((u) => [u.id, u]));
    }

    res.json((chats || []).map((c) => toChatResponse(c, usersById.get(c.user_id))));
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

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id,email,phone,city,first_name,last_name')
      .eq('id', userId)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id,user_email,last_message,last_update,unread,unread_by_client,orders')
      .eq('user_id', userId)
      .maybeSingle();
    if (chatErr) throw chatErr;

    if (!chat) {
      const nowIso = new Date().toISOString();
      const chatRow = {
        id: randomUUID(),
        user_id: userId,
        user_email: user.email,
        last_message: '',
        last_update: nowIso,
        unread: false,
        unread_by_client: false,
        orders: [],
        created_at: nowIso,
        updated_at: nowIso
      };
      const { data: created, error: createErr } = await supabase
        .from('chats')
        .insert(chatRow)
        .select('id,user_id,user_email,last_message,last_update,unread,unread_by_client,orders')
        .single();
      if (createErr) throw createErr;
      chat = created;
    }

    res.json(toChatResponse(chat, user));
  } catch (error) {
    console.error('Ошибка в POST /api/chats/start:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's own chat
router.get('/my-chat', protect, async (req, res) => {
  try {
    let { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id,user_email,last_message,last_update,unread,unread_by_client,orders')
      .eq('user_id', req.user._id)
      .maybeSingle();
    if (chatErr) throw chatErr;

    if (!chat) {
      const nowIso = new Date().toISOString();
      const chatRow = {
        id: randomUUID(),
        user_id: req.user._id,
        user_email: req.user.email,
        last_message: '',
        last_update: nowIso,
        unread: false,
        unread_by_client: false,
        orders: [],
        created_at: nowIso,
        updated_at: nowIso
      };
      const { data: created, error: createErr } = await supabase
        .from('chats')
        .insert(chatRow)
        .select('id,user_id,user_email,last_message,last_update,unread,unread_by_client,orders')
        .single();
      if (createErr) throw createErr;
      chat = created;
    }

    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id,email,phone,city,first_name,last_name')
      .eq('id', chat.user_id)
      .maybeSingle();
    if (uErr) throw uErr;

    res.json(toChatResponse(chat, user));
  } catch (error) {
    console.error('Ошибка в GET /my-chat:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Проверка прав: админ или владелец чата
    if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (msgErr) throw msgErr;

    res.json((messages || []).map(toMessage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark chat as read
router.patch('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { error: updErr } = await supabase
      .from('chats')
      .update({ unread: false, unread_by_client: false, updated_at: new Date().toISOString() })
      .eq('id', chatId);
    if (updErr) throw updErr;

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Очистка чата (удалить все сообщения) (только админ)
router.delete('/:chatId/messages', protect, admin, async (req, res) => {
  try {
    const { chatId } = req.params;

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const { error: msgDelErr } = await supabase.from('messages').delete().eq('chat_id', chatId);
    if (msgDelErr) throw msgDelErr;

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('chats')
      .update({ last_message: '', unread: false, last_update: nowIso, updated_at: nowIso })
      .eq('id', chatId);
    if (updErr) throw updErr;

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

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const { error: msgDelErr } = await supabase.from('messages').delete().eq('chat_id', chatId);
    if (msgDelErr) throw msgDelErr;

    const { error: chatDelErr } = await supabase.from('chats').delete().eq('id', chatId);
    if (chatDelErr) throw chatDelErr;

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
    const { data: deleted, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', req.params.messageId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
