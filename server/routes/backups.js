import express from 'express';
import BackupSnapshot from '../models/BackupSnapshot.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, admin, async (req, res) => {
  try {
    const body = req.body || {};
    const doc = await BackupSnapshot.create({
      ownerId: req.user._id,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      totals: body.totals || { chats: 0, messages: 0, orders: 0 },
      users: Array.isArray(body.users) ? body.users : []
    });
    res.status(201).json({ id: doc._id, createdAt: doc.createdAt });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const items = await BackupSnapshot.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(items.map(d => ({ id: d._id, createdAt: d.createdAt, totals: d.totals })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/latest', protect, admin, async (req, res) => {
  try {
    const doc = await BackupSnapshot.findOne({ ownerId: req.user._id }).sort({ createdAt: -1 });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', protect, admin, async (req, res) => {
  try {
    const doc = await BackupSnapshot.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const del = await BackupSnapshot.deleteOne({ _id: req.params.id, ownerId: req.user._id });
    if (!del.deletedCount) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
