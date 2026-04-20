import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
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

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedLogin = String(login).trim();

    const { data: exists, error: existsErr } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${normalizedEmail},login.eq.${normalizedLogin}`)
      .limit(1);
    if (existsErr) throw existsErr;
    if (exists && exists.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const nowIso = new Date().toISOString();

    const userRow = {
      id: randomUUID(),
      email: normalizedEmail,
      login: normalizedLogin,
      password_hash: passwordHash,
      role: 'user',
      phone: phone || '',
      city: city || '',
      first_name: firstName || '',
      last_name: lastName || '',
      quick_scripts: [],
      created_at: nowIso,
      updated_at: nowIso
    };

    const { data: created, error: createErr } = await supabase
      .from('users')
      .insert(userRow)
      .select('id,email,login,role')
      .single();
    if (createErr) throw createErr;

    const token = generateToken(created.id);
    res.status(201).json({
      _id: created.id,
      email: created.email,
      login: created.login,
      role: created.role,
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

    const { data: row, error: findErr } = await supabase
      .from('users')
      .select('id,email,login,role,password_hash')
      .or(`email.eq.${normalizedEmail},login.eq.${identifier}`)
      .maybeSingle();
    if (findErr) throw findErr;

    if (row && (await bcrypt.compare(String(password), row.password_hash || ''))) {
      res.json({
        _id: row.id,
        email: row.email,
        login: row.login,
        role: row.role,
        token: generateToken(row.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/supabase', async (req, res) => {
  try {
    const { access_token } = req.body || {};
    if (!access_token) return res.status(400).json({ message: 'access_token is required' });

    const { data: u, error: uErr } = await supabase.auth.getUser(String(access_token));
    if (uErr) return res.status(401).json({ message: uErr.message });
    const authUser = u?.user;
    if (!authUser?.id) return res.status(401).json({ message: 'Invalid Supabase session' });

    const normalizedEmail = String(authUser.email || '').trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ message: 'Supabase user has no email' });

    const { data: existing, error: exErr } = await supabase
      .from('users')
      .select('id,email,login,role')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (exErr) throw exErr;

    let row = existing;
    if (row && (!row.login || String(row.login).trim() === '')) {
      const nowIso = new Date().toISOString();
      const { data: updated, error: updErr } = await supabase
        .from('users')
        .update({ login: normalizedEmail, updated_at: nowIso })
        .eq('id', row.id)
        .select('id,email,login,role')
        .maybeSingle();
      if (!updErr && updated) row = updated;
    }
    if (!row) {
      const nowIso = new Date().toISOString();
      const passwordHash = await bcrypt.hash(randomUUID(), 10);
      const baseLogin = normalizedEmail;
      let login = baseLogin;

      const makeInsert = async () => {
        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            id: randomUUID(),
            email: normalizedEmail,
            login,
            password_hash: passwordHash,
            role: 'user',
            phone: '',
            city: '',
            first_name: '',
            last_name: '',
            quick_scripts: [],
            created_at: nowIso,
            updated_at: nowIso
          })
          .select('id,email,login,role')
          .single();
        if (createErr) throw createErr;
        return created;
      };

      try {
        row = await makeInsert();
      } catch (e) {
        const code = e?.code || e?.details?.code;
        if (String(code) === '23505') {
          const { data: byEmail, error: byEmailErr } = await supabase
            .from('users')
            .select('id,email,login,role')
            .eq('email', normalizedEmail)
            .maybeSingle();
          if (byEmailErr) throw byEmailErr;
          if (byEmail) {
            row = byEmail;
          } else {
            login = `${String(baseLogin).split('@')[0]}_${Date.now().toString(36)}`;
            row = await makeInsert();
          }
        } else {
          throw e;
        }
      }
    }

    res.json({
      _id: row.id,
      email: row.email,
      login: row.login,
      role: row.role,
      token: generateToken(row.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ПОЛУЧЕНИЕ ДАННЫХ О СЕБЕ
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ОБНОВЛЕНИЕ ПРОФИЛЯ (данные о себе)
router.put('/me', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, quickScripts, avatarType, customAvatarUrl } = req.body;

    const update = {};
    if (firstName !== undefined) update.first_name = firstName ?? '';
    if (lastName !== undefined) update.last_name = lastName ?? '';
    if (phone !== undefined) update.phone = phone ?? '';
    if (city !== undefined) update.city = city ?? '';
    if (avatarType !== undefined) update.avatar_type = avatarType ?? 'gravatar';
    if (customAvatarUrl !== undefined) update.custom_avatar_url = customAvatarUrl ?? '';
    if (Array.isArray(quickScripts)) {
      update.quick_scripts = quickScripts
        .filter(s => s && typeof s.title === 'string' && typeof s.text === 'string')
        .map(s => ({
          id: String(s.id || Date.now().toString(36)),
          title: String(s.title),
          text: String(s.text),
          titleByLang: s.titleByLang && typeof s.titleByLang === 'object'
            ? { ru: String(s.titleByLang.ru || ''), en: String(s.titleByLang.en || ''), ka: String(s.titleByLang.ka || '') }
            : { ru: String(s.title || ''), en: '', ka: '' },
          textByLang: s.textByLang && typeof s.textByLang === 'object'
            ? { ru: String(s.textByLang.ru || ''), en: String(s.textByLang.en || ''), ka: String(s.textByLang.ka || '') }
            : { ru: String(s.text || ''), en: '', ka: '' },
          files: Array.isArray(s.files)
            ? s.files
                .filter(f => f && typeof f.url === 'string')
                .map(f => ({
                  name: String(f.name || ''),
                  type: String(f.type || ''),
                  size: Number(f.size) || 0,
                  url: String(f.url)
                }))
            : []
        }));
    }
    update.updated_at = new Date().toISOString();

    const { data: updated, error: updErr } = await supabase
      .from('users')
      .update(update)
      .eq('id', req.user._id)
      .select('id,email,login,role,phone,city,first_name,last_name,avatar_type,custom_avatar_url,quick_scripts,created_at,updated_at')
      .maybeSingle();
    if (updErr) throw updErr;
    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: updated.id,
      email: updated.email,
      login: updated.login,
      role: updated.role,
      phone: updated.phone || '',
      city: updated.city || '',
      firstName: updated.first_name || '',
      lastName: updated.last_name || '',
      avatarType: updated.avatar_type || 'gravatar',
      customAvatarUrl: updated.custom_avatar_url || '',
      quickScripts: updated.quick_scripts || [],
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    });
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
    
    const { data: row, error } = await supabase
      .from('users')
      .select('id,email,login,role,phone,city,first_name,last_name,avatar_type,custom_avatar_url,quick_scripts,created_at,updated_at')
      .eq('id', req.params.userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      _id: row.id,
      email: row.email,
      login: row.login,
      role: row.role,
      phone: row.phone || '',
      city: row.city || '',
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      avatarType: row.avatar_type || 'gravatar',
      customAvatarUrl: row.custom_avatar_url || '',
      quickScripts: row.quick_scripts || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
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
    
    const { data: rows, error } = await supabase
      .from('users')
      .select('id,email,login,role,phone,city,first_name,last_name,avatar_type,custom_avatar_url,quick_scripts,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json((rows || []).map((r) => ({
      _id: r.id,
      email: r.email,
      login: r.login,
      role: r.role,
      phone: r.phone || '',
      city: r.city || '',
      firstName: r.first_name || '',
      lastName: r.last_name || '',
      avatarType: r.avatar_type || 'gravatar',
      customAvatarUrl: r.custom_avatar_url || '',
      quickScripts: r.quick_scripts || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (только для админа)
router.delete('/users/:userId', protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (chatErr) throw chatErr;
    if (chat?.id) {
      const { error: msgDelErr } = await supabase.from('messages').delete().eq('chat_id', chat.id);
      if (msgDelErr) throw msgDelErr;
      const { error: chatDelErr } = await supabase.from('chats').delete().eq('id', chat.id);
      if (chatDelErr) throw chatDelErr;
    }

    const { error: userDelErr } = await supabase.from('users').delete().eq('id', userId);
    if (userDelErr) throw userDelErr;

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
