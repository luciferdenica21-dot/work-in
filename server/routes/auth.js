import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { protect, admin } from '../middleware/auth.js';

/* global process */

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { email, login, password, phone, city, firstName, lastName } = req.body; 

    if (!email || !password || !login) {
      return res.status(400).json({ message: 'Email, login and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { login }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email,
      login,
      password,
      phone: phone || '',
      city: city || '',
      firstName: firstName || '',
      lastName: lastName || ''
    });

    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      email: user.email,
      login: user.login,
      role: user.role, // Добавлено: передаем роль на фронтенд
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ЛОГИН
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const identifier = String(email).trim();
    const normalizedEmail = identifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { login: identifier }]
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        login: user.login,
        role: user.role, // Добавлено: теперь фронтенд увидит, что это admin
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ПОЛУЧЕНИЕ ДАННЫХ О СЕБЕ
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ОБНОВЛЕНИЕ ПРОФИЛЯ (данные о себе)
router.put('/me', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, city } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phone = phone ?? user.phone;
    user.city = city ?? user.city;

    await user.save();

    const updated = await User.findById(req.user._id).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ПОЛУЧЕНИЕ КОНКРЕТНОГО ПОЛЬЗОВАТЕЛЯ (для админа)
router.get('/users/:userId', protect, async (req, res) => {
  try {
    // Проверка что это админ или запрашивает себя
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (только для админа)
router.get('/users', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (только для админа)
router.delete('/users/:userId', protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const chat = await Chat.findOneAndDelete({ userId: user._id });
    if (chat?._id) {
      await Message.deleteMany({ chatId: chat._id.toString() });
    }

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;