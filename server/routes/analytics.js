import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/events', async (req, res) => {
  try {
    const { sessionId, action, path, section, element, serviceKey, details, durationMs, timestamp } = req.body || {};
    if (!action) return res.status(400).json({ message: 'action is required' });
    const eventRow = {
      id: randomUUID(),
      user_id: req.user?._id || null,
      session_id: sessionId || '',
      action,
      path: path || req.originalUrl,
      section: section || '',
      element: element || '',
      service_key: serviceKey || '',
      details: details || {},
      duration_ms: Number(durationMs) || 0,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
      .from('analytics_events')
      .insert(eventRow)
      .select('id')
      .single();
    if (error) throw error;

    res.json({ success: true, eventId: inserted.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/bind-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
    const { data: updated, error } = await supabase
      .from('analytics_events')
      .update({ user_id: req.user._id, updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select('id');
    if (error) throw error;
    const count = (updated || []).length;
    res.json({ success: true, matched: count, modified: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const userId = req.params.userId;
    const { data: rows, error } = await supabase
      .from('analytics_events')
      .select('id,session_id,action,path,section,element,service_key,details,duration_ms,timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5000);
    if (error) throw error;

    const events = rows || [];

    const visitsEvents = events.filter((e) => e.action === 'visit');
    const lastVisit = visitsEvents.reduce((acc, e) => {
      const t = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      return Math.max(acc, t);
    }, 0);

    const clicksBySectionMap = new Map();
    const timeBySectionMap = new Map();
    const timeByServiceMap = new Map();

    for (const e of events) {
      if (e.action === 'click') {
        const key = e.section || '';
        clicksBySectionMap.set(key, (clicksBySectionMap.get(key) || 0) + 1);
      }
      if (e.action === 'section_close') {
        const key = e.section || '';
        timeBySectionMap.set(key, (timeBySectionMap.get(key) || 0) + (Number(e.duration_ms) || 0));
      }
      if (e.action === 'service_close') {
        const key = e.service_key || '';
        timeByServiceMap.set(key, (timeByServiceMap.get(key) || 0) + (Number(e.duration_ms) || 0));
      }
    }

    const recentEvents = events.slice(0, 100);

    res.json({
      visits: visitsEvents.length
        ? [{ _id: null, total: visitsEvents.length, lastVisit: lastVisit ? new Date(lastVisit).toISOString() : null }]
        : [],
      clicksBySection: Array.from(clicksBySectionMap.entries()).map(([k, v]) => ({ _id: k, count: v })),
      timeBySection: Array.from(timeBySectionMap.entries()).map(([k, v]) => ({ _id: k, durationMs: v })),
      timeByService: Array.from(timeByServiceMap.entries()).map(([k, v]) => ({ _id: k, durationMs: v })),
      recentEvents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
