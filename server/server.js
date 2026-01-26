import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import orderRoutes from './routes/orders.js';
import fileRoutes from './routes/files.js';
import Message from './models/Message.js';
import Chat from './models/Chat.js';

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

connectDB();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/files', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/chats/:id/read', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (chat) {
      chat.unread = false;
      await chat.save();
      io.to(`chat-${req.params.id}`).emit('chat-read', { chatId: req.params.id });
      return res.json({ success: true });
    }
    res.status(404).json({ message: 'Chat not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', fileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

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
      const chat = await Chat.findById(chatId);
      if (!chat) return;
      const senderId = socket.role === 'admin' ? 'manager' : socket.userId;
      const message = await Message.create({
        chatId,
        text,
        senderId,
        senderEmail: socket.handshake.auth.email || ''
      });
      chat.lastMessage = text;
      chat.lastUpdate = new Date();
      chat.unread = socket.role !== 'admin';
      await chat.save();
      io.to(`chat-${chatId}`).emit('new-message', message);
      if (socket.role !== 'admin') {
        io.emit('new-chat-message', { chatId, message: message.toObject() });
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('mark-read', async (chatId) => {
    try {
      if (socket.role !== 'admin') return;
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.unread = false;
        await chat.save();
        io.to(`chat-${chatId}`).emit('chat-read', { chatId });
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 5000;
// Явное указание 0.0.0.0 для приема внешних подключений на VPS
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});