import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';
import { sendTelegram } from '../config/telegram.js';

const router = express.Router();

const toMessage = (row) => ({
  _id: row.id,
  chatId: row.chat_id,
  text: row.text,
  senderId: row.sender_id,
  senderEmail: row.sender_email || '',
  attachments: row.attachments || [],
  createdAt: row.created_at
});

const isAiLogText = (text) => {
  const s = String(text || '').trim();
  if (!s) return true;
  return (
    s.startsWith('🤖') ||
    s.startsWith('✅') ||
    s.startsWith('➕') ||
    s.startsWith('➖')
  );
};

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ message: 'ChatId and text are required' });
    }

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', chatId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access
    // Исправлено: добавлена проверка на существование chat.userId перед вызовом toString()
    if (req.user.role !== 'admin' && String(chat.user_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const senderId = req.user.role === 'admin' ? 'manager' : req.user._id.toString();

    const nowIso = new Date().toISOString();
    const msgRow = {
      id: randomUUID(),
      chat_id: chatId,
      text: String(text),
      sender_id: String(senderId),
      sender_email: String(req.user.email || ''),
      attachments: [],
      created_at: nowIso
    };

    const { data: inserted, error: insErr } = await supabase
      .from('messages')
      .insert(msgRow)
      .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
      .single();
    if (insErr) throw insErr;

    const aiLog = isAiLogText(text);
    const updatePayload = aiLog
      ? { last_update: nowIso, updated_at: nowIso }
      : { last_message: String(text), last_update: nowIso, unread: req.user.role !== 'admin', updated_at: nowIso };

    // Update chat
    const { error: updErr } = await supabase
      .from('chats')
      .update(updatePayload)
      .eq('id', chatId);
    if (updErr) throw updErr;

    const isSystemToSkipTelegram =
      aiLog || String(text || '').trim().startsWith('👤') || String(text || '').trim().startsWith('📎');
    const shouldSendTelegram = req.user.role !== 'admin' && !isSystemToSkipTelegram;
    if (shouldSendTelegram) {
      const tgText = [
        '💬 Новое сообщение',
        `От: Клиент (${req.user.email || req.user._id})`,
        `Чат: ${chatId}`,
        `Текст: ${text}`
      ].join('\n');
      sendTelegram(tgText);
    }

    const mapped = toMessage(inserted);
    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${chatId}`).emit('new-message', mapped);
      if (req.user.role !== 'admin') {
        io.emit('new-chat-message', { chatId: chatId.toString(), message: mapped });
      }
    }

    res.status(201).json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .select('id,chat_id,sender_id')
      .eq('id', messageId)
      .maybeSingle();
    if (msgErr) throw msgErr;
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id,user_id')
      .eq('id', message.chat_id)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Admin can delete any message
    if (req.user.role !== 'admin') {
      // User must own chat and be sender of message
      if (String(chat.user_id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (String(message.sender_id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { error: delErr } = await supabase.from('messages').delete().eq('id', messageId);
    if (delErr) throw delErr;

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${message.chat_id}`).emit('message-deleted', { messageId });
      io.emit('message-deleted', { messageId });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
