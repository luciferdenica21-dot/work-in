import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';
import fileRoutes from './routes/files.js';
import backupRoutes from './routes/backups.js';
import signatureRoutes from './routes/signatures.js';
import aiRoutes from './routes/ai.js';
import { sendTelegram } from './config/telegram.js';
import { supabase } from './config/supabase.js';

/* global process */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const server = http.createServer(app);

// Обновленный список разрешенных адресов для работы на VPS
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://185.247.94.156',
  'http://connector.ge',
  'https://connector.ge',
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/files', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/chats/:id/read', async (req, res) => {
  try {
    const chatId = req.params.id;
    const { data: updated, error } = await supabase
      .from('chats')
      .update({ unread: false, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return res.status(404).json({ message: 'Chat not found' });

    io.to(`chat-${chatId}`).emit('chat-read', { chatId });
    return res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Простое отслеживание онлайн-пользователей (все роли)
// Ключ: userId, Значение: количество активных соединений (вкладки/устройства)
const onlineUsers = new Map();
let supportOnlineCount = 0;

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  const role = socket.handshake.auth.role;
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  socket.userId = userId;
  socket.role = role;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId} (${socket.role})`);

  
  // Учитываем онлайн только для роли "user" (клиенты сайта)
  if (socket.role === 'user') {
    const current = onlineUsers.get(socket.userId) || 0;
    onlineUsers.set(socket.userId, current + 1);
    io.emit('user-online', { userId: socket.userId });
  }
  // Админу отправляем снимок всех онлайн-пользователей
  if (socket.role === 'admin') {
    socket.emit('online-users', Array.from(onlineUsers.keys()));
    supportOnlineCount += 1;
    io.emit('support-status', { online: true });
  }
  if (socket.role === 'user') {
    socket.emit('support-status', { online: supportOnlineCount > 0 });
  }

socket.on('join-chat', async (chatId) => {
  try {
    socket.join(`chat-${chatId}`);
    console.log(`📱 User ${socket.userId} (${socket.role}) JOINED chat-${chatId}`);
  } catch (error) {

      console.error('Join chat error:', error);
    }
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  socket.on('typing', (payload) => {
    try {
      const chatId = payload?.chatId;
      const isTyping = !!payload?.isTyping;
      if (!chatId) return;
      io.to(`chat-${chatId}`).emit('typing', { chatId, role: socket.role, isTyping });
    } catch (error) {
      console.error('Typing error:', error);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const { chatId, text } = data;
      if (!chatId || !text) return;

      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id,user_id,unread')
        .eq('id', chatId)
        .maybeSingle();
      if (chatErr) throw chatErr;
      if (!chat) return;

      const senderId = socket.role === 'admin' ? 'manager' : socket.userId;

      const nowIso = new Date().toISOString();
      const messageRow = {
        id: randomUUID(),
        chat_id: chatId,
        text: String(text),
        sender_id: String(senderId),
        sender_email: String(socket.handshake.auth.email || ''),
        attachments: [],
        created_at: nowIso
      };

      const { data: inserted, error: insErr } = await supabase
        .from('messages')
        .insert(messageRow)
        .select('id,chat_id,text,sender_id,sender_email,attachments,created_at')
        .single();
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from('chats')
        .update({
          last_message: String(text),
          last_update: nowIso,
          unread: socket.role !== 'admin',
          updated_at: nowIso
        })
        .eq('id', chatId);
      if (updErr) throw updErr;

      const message = {
        _id: inserted.id,
        chatId: inserted.chat_id,
        text: inserted.text,
        senderId: inserted.sender_id,
        senderEmail: inserted.sender_email || '',
        attachments: inserted.attachments || [],
        createdAt: inserted.created_at
      };

console.log(`📤 EMIT new-message to chat-${chatId} → ${message._id?.slice(0,8)} from ${senderId}`);
  io.to(`chat-${chatId}`).emit('new-message', message);
  if (socket.role !== 'admin') {
    console.log(`📤 EMIT new-chat-message globally → ${message._id?.slice(0,8)}`);
    io.emit('new-chat-message', { chatId, message });
  }


      const senderType = socket.role === 'admin' ? 'Менеджер' : 'Клиент';
      sendTelegram([
        '💬 Новое сообщение',
        `От: ${senderType} (${socket.handshake.auth.email || socket.userId})`,
        `Чат: ${chatId}`,
        `Текст: ${text}`
      ].join('\n'));
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('mark-read', async (chatId) => {
    try {
      if (socket.role !== 'admin') return;
      const { data: updated, error } = await supabase
        .from('chats')
        .update({ unread: false, updated_at: new Date().toISOString() })
        .eq('id', chatId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (updated) io.to(`chat-${chatId}`).emit('chat-read', { chatId });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    if (socket.role === 'admin') {
      supportOnlineCount = Math.max(0, supportOnlineCount - 1);
      io.emit('support-status', { online: supportOnlineCount > 0 });
    }
    if (socket.role === 'user') {
      const current = onlineUsers.get(socket.userId) || 0;
      if (current <= 1) {
        onlineUsers.delete(socket.userId);
        io.emit('user-offline', { userId: socket.userId });
      } else {
        onlineUsers.set(socket.userId, current - 1);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
// Явное указание 0.0.0.0 для приема внешних подключений на VPS
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  // Создаём таблицу analytics_events если не существует
  (async () => {
    try {
      // Проверяем есть ли таблица
      const { error: checkErr } = await supabase
        .from('analytics_events')
        .select('id')
        .limit(1);

      if (checkErr && checkErr.code === '42P01') {
        // Таблица не существует — создаём через SQL
        const { error: sqlErr } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS analytics_events (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID,
              session_id TEXT NOT NULL DEFAULT '',
              action TEXT NOT NULL,
              path TEXT NOT NULL DEFAULT '/',
              section TEXT NOT NULL DEFAULT '',
              element TEXT NOT NULL DEFAULT '',
              service_key TEXT NOT NULL DEFAULT '',
              details JSONB NOT NULL DEFAULT '{}',
              duration_ms INTEGER NOT NULL DEFAULT 0,
              timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp DESC);
            ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
          `
        });
        if (sqlErr) {
          console.warn('analytics_events table creation via RPC failed:', sqlErr.message);
          console.warn('Please run supabase_setup.sql manually in Supabase Dashboard → SQL Editor');
        } else {
          console.log('analytics_events table created successfully');
        }
      } else if (!checkErr) {
        console.log('analytics_events table OK');
      }

      // Добавляем колонки для аватара если нет
      try {
        await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'gravatar';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT NOT NULL DEFAULT '';
          `
        });
      } catch { void 0; }

    } catch (e) {
      console.warn('DB init check failed:', e.message);
    }
  })();
});
