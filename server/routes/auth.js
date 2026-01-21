import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

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

    const user = await User.findOne({ email });

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

export default router;