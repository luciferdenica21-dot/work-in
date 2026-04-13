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
import { sendTelegram } from './config/telegram.js';
import { supabase } from './config/supabase.js';

/* global process */

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Простое отслеживание онлайн-пользователей (все роли)
// Ключ: userId, Значение: количество активных соединений (вкладки/устройства)
const onlineUsers = new Map();

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
  console.log(`User connected: ${socket.userId} (${socket.role})`);
  
  // Учитываем онлайн только для роли "user" (клиенты сайта)
  if (socket.role === 'user') {
    const current = onlineUsers.get(socket.userId) || 0;
    onlineUsers.set(socket.userId, current + 1);
    io.emit('user-online', { userId: socket.userId });
  }
  // Админу отправляем снимок всех онлайн-пользователей
  if (socket.role === 'admin') {
    socket.emit('online-users', Array.from(onlineUsers.keys()));
  }

  socket.on('join-chat', async (chatId) => {
    try {
      socket.join(`chat-${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    } catch (error) {
      console.error('Join chat error:', error);
    }
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
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

      io.to(`chat-${chatId}`).emit('new-message', message);
      if (socket.role !== 'admin') {
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
});
