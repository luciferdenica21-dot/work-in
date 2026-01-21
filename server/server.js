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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Раздача статических файлов
app.use('/api/files', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Роут для пометки чата прочитанным (исправляет 404 в админке)
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io for real-time chat
io.use((socket, next) => {
  // Simple authentication check via query params
  // In production, use proper JWT auth here
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

  // Join chat room
  socket.on('join-chat', async (chatId) => {
    try {
      socket.join(`chat-${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    } catch (error) {
      console.error('Join chat error:', error);
    }
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Send message
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

      // Update chat
      chat.lastMessage = text;
      chat.lastUpdate = new Date();
      if (socket.role !== 'admin') {
        chat.unread = true;
      } else {
        chat.unread = false;
      }
      await chat.save();

      // Emit to all in chat room
      io.to(`chat-${chatId}`).emit('new-message', message);

      // Notify admin if user sent message
      if (socket.role !== 'admin') {
        io.emit('new-chat-message', {
          chatId,
          message: message.toObject()
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark chat as read
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});