import express from 'express';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const getUserIdFromAuth = (req) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length).trim();
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded?.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
};

router.post('/events', async (req, res) => {
  try {
    const { sessionId, action, path, section, element, serviceKey, details, durationMs, timestamp } = req.body || {};
    if (!action) return res.status(400).json({ message: 'action is required' });
    const userId = req.user?._id || getUserIdFromAuth(req) || null;
    const eventRow = {
      id: randomUUID(),
      user_id: userId,
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

    let insertedId = null;
    {
      const { data: inserted, error } = await supabase
        .from('analytics_events')
        .insert(eventRow)
        .select('id')
        .single();
      if (!error) insertedId = inserted?.id || null;
      if (error) {
        const fallbackRow = {
          id: eventRow.id,
          userId: eventRow.user_id,
          sessionId: eventRow.session_id,
          action: eventRow.action,
          path: eventRow.path,
          section: eventRow.section,
          element: eventRow.element,
          serviceKey: eventRow.service_key,
          details: eventRow.details,
          durationMs: eventRow.duration_ms,
          timestamp: eventRow.timestamp,
          createdAt: eventRow.created_at,
          updatedAt: eventRow.updated_at
        };
        const { data: inserted2, error: error2 } = await supabase
          .from('analytics_events')
          .insert(fallbackRow)
          .select('id')
          .single();
        if (error2) throw error2;
        insertedId = inserted2?.id || null;
      }
    }

    res.json({ success: true, eventId: insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/bind-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
    let updatedRows = null;
    {
      const { data: updated, error } = await supabase
        .from('analytics_events')
        .update({ user_id: req.user._id, updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .is('user_id', null)
        .select('id');
      if (!error) updatedRows = updated || [];
      if (error) {
        const { data: updated2, error: error2 } = await supabase
          .from('analytics_events')
          .update({ userId: req.user._id, updatedAt: new Date().toISOString() })
          .eq('sessionId', sessionId)
          .is('userId', null)
          .select('id');
        if (error2) throw error2;
        updatedRows = updated2 || [];
      }
    }
    const count = (updatedRows || []).length;
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
    let rows = null;
    {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id,session_id,action,path,section,element,service_key,details,duration_ms,timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(5000);
      if (!error) rows = data || [];
      if (error) {
        const { data: data2, error: error2 } = await supabase
          .from('analytics_events')
          .select('id,sessionId,action,path,section,element,serviceKey,details,durationMs,timestamp')
          .eq('userId', userId)
          .order('timestamp', { ascending: false })
          .limit(5000);
        if (error2) throw error2;
        rows = data2 || [];
      }
    }

    const events = (rows || []).map((r) => ({
      id: r.id,
      session_id: r.session_id ?? r.sessionId ?? '',
      action: r.action,
      path: r.path,
      section: r.section,
      element: r.element,
      service_key: r.service_key ?? r.serviceKey ?? '',
      details: r.details || {},
      duration_ms: r.duration_ms ?? r.durationMs ?? 0,
      timestamp: r.timestamp
    }));

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
