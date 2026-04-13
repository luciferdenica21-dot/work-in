import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, admin, async (req, res) => {
  try {
    const body = req.body || {};
    const createdAtIso = body.createdAt ? new Date(body.createdAt).toISOString() : new Date().toISOString();
    const row = {
      id: randomUUID(),
      owner_id: req.user._id,
      created_at: createdAtIso,
      totals: body.totals || { chats: 0, messages: 0, orders: 0 },
      users: Array.isArray(body.users) ? body.users : []
    };
    const { data: inserted, error } = await supabase
      .from('backup_snapshots')
      .insert(row)
      .select('id,created_at')
      .single();
    if (error) throw error;
    res.status(201).json({ id: inserted.id, createdAt: inserted.created_at });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('backup_snapshots')
      .select('id,created_at,totals')
      .eq('owner_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json((items || []).map((d) => ({ id: d.id, createdAt: d.created_at, totals: d.totals })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/latest', protect, admin, async (req, res) => {
  try {
    const { data: doc, error } = await supabase
      .from('backup_snapshots')
      .select('id,owner_id,created_at,totals,users')
      .eq('owner_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({
      _id: doc.id,
      ownerId: doc.owner_id,
      createdAt: doc.created_at,
      totals: doc.totals,
      users: doc.users
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', protect, admin, async (req, res) => {
  try {
    const { data: doc, error } = await supabase
      .from('backup_snapshots')
      .select('id,owner_id,created_at,totals,users')
      .eq('id', req.params.id)
      .eq('owner_id', req.user._id)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({
      _id: doc.id,
      ownerId: doc.owner_id,
      createdAt: doc.created_at,
      totals: doc.totals,
      users: doc.users
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { data: deleted, error } = await supabase
      .from('backup_snapshots')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', req.user._id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
