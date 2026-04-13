import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

/* global process */

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const { data: row, error } = await supabase
        .from('users')
        .select('id,email,login,role,phone,city,first_name,last_name,quick_scripts,created_at,updated_at')
        .eq('id', decoded.id)
        .maybeSingle();
      if (error) throw error;

      if (!row) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = {
        _id: row.id,
        email: row.email,
        login: row.login,
        role: row.role,
        phone: row.phone || '',
        city: row.city || '',
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        quickScripts: row.quick_scripts || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};
