import express from 'express';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const getClientIp = (req) => {
  try {
    const cf = req.headers['cf-connecting-ip'];
    if (cf) return String(cf).trim();

    const fwd = req.headers['x-forwarded-for'];
    if (fwd) {
      const first = String(fwd).split(',')[0]?.trim();
      if (first) return first;
    }

    const raw = req.ip || req.connection?.remoteAddress || '';
    const ip = String(raw).trim();
    if (!ip) return '';
    return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
  } catch {
    return '';
  }
};

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
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 300) : '';
    const safeDetails = (details && typeof details === 'object' && !Array.isArray(details))
      ? { ...details }
      : (details != null ? { value: details } : {});
    if (!safeDetails.ip && ip) safeDetails.ip = ip;
    if (!safeDetails.ua && ua) safeDetails.ua = ua;

    const eventRow = {
      id: randomUUID(),
      user_id: userId,
      session_id: sessionId || '',
      action,
      path: path || req.originalUrl,
      section: section || '',
      element: element || '',
      service_key: serviceKey || '',
      details: safeDetails,
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

let _siteStatsCache = { key: '', ts: 0, data: null };

router.get('/site-stats', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const daysRaw = Number(req.query?.days);
    const days = Number.isFinite(daysRaw) ? Math.min(60, Math.max(1, Math.floor(daysRaw))) : 14;
    const cacheKey = `d:${days}`;
    const nowTs = Date.now();
    if (_siteStatsCache.key === cacheKey && _siteStatsCache.data && nowTs - _siteStatsCache.ts < 15000) {
      return res.json(_siteStatsCache.data);
    }

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
    const startIso = start.toISOString();

    let rows = null;
    {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('session_id,sessionId,action,path,section,duration_ms,durationMs,timestamp,details')
        .gte('timestamp', startIso)
        .in('action', ['visit', 'section_close'])
        .order('timestamp', { ascending: true })
        .limit(50000);
      if (!error) rows = data || [];
      if (error) {
        const { data: data2, error: error2 } = await supabase
          .from('analytics_events')
          .select('session_id,sessionId,action,path,section,duration_ms,durationMs,timestamp,details')
          .gte('timestamp', startIso)
          .in('action', ['visit', 'section_close'])
          .order('timestamp', { ascending: true })
          .limit(50000);
        if (error2) throw error2;
        rows = data2 || [];
      }
    }

    const toDayKey = (d) => {
      try {
        const dt = new Date(d);
        if (!Number.isFinite(dt.getTime())) return '';
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dt.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      } catch {
        return '';
      }
    };

    const isAdminPath = (p) => {
      const s = String(p || '');
      return s === '/manager' || s.startsWith('/manager/');
    };

    const sessions = new Map();

    for (const r of rows || []) {
      const action = r.action;
      const path = r.path;
      if (isAdminPath(path)) continue;
      const sessionId = r.session_id ?? r.sessionId ?? '';
      if (!sessionId) continue;
      const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0;
      if (!Number.isFinite(ts) || ts <= 0) continue;
      const durationMs = Number(r.duration_ms ?? r.durationMs ?? 0) || 0;
      const section = r.section || '';
      const details = r.details && typeof r.details === 'object' ? r.details : {};
      const ip = details?.ip ? String(details.ip) : '';

      const existing = sessions.get(sessionId) || { sessionId, firstTs: 0, ip: '', totalDurationMs: 0 };
      if (action === 'visit') {
        if (!existing.firstTs || ts < existing.firstTs) existing.firstTs = ts;
        if (!existing.ip && ip) existing.ip = ip;
      }
      if (action === 'section_close' && section === 'site') {
        existing.totalDurationMs += Math.max(0, durationMs);
        if (!existing.firstTs) existing.firstTs = ts;
        if (!existing.ip && ip) existing.ip = ip;
      }
      sessions.set(sessionId, existing);
    }

    const dayBuckets = new Map();
    const overallIps = new Set();
    let totalVisits = 0;
    let totalTimeMs = 0;

    for (const s of sessions.values()) {
      const dayKey = toDayKey(new Date(s.firstTs));
      if (!dayKey) continue;
      const bucket = dayBuckets.get(dayKey) || { day: dayKey, visits: 0, uniqueIps: new Set(), totalTimeMs: 0 };
      bucket.visits += 1;
      if (s.ip) bucket.uniqueIps.add(s.ip);
      bucket.totalTimeMs += Math.max(0, Number(s.totalDurationMs) || 0);
      dayBuckets.set(dayKey, bucket);

      totalVisits += 1;
      totalTimeMs += Math.max(0, Number(s.totalDurationMs) || 0);
      if (s.ip) overallIps.add(s.ip);
    }

    const series = [];
    for (let i = 0; i < days; i++) {
      const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1 - i), 0, 0, 0, 0));
      const key = toDayKey(dt);
      const b = dayBuckets.get(key);
      series.push({
        day: key,
        visits: b ? b.visits : 0,
        uniqueIps: b ? b.uniqueIps.size : 0,
        totalTimeMs: b ? b.totalTimeMs : 0,
        avgTimeMs: b && b.visits ? Math.round(b.totalTimeMs / b.visits) : 0
      });
    }

    const uniqueIps = overallIps.size;
    const repeatVisits = Math.max(0, totalVisits - uniqueIps);
    const avgTimeMs = totalVisits ? Math.round(totalTimeMs / totalVisits) : 0;

    const payload = {
      rangeDays: days,
      totals: {
        visits: totalVisits,
        uniqueIps,
        repeatVisits,
        totalTimeMs,
        avgTimeMs
      },
      series
    };

    _siteStatsCache = { key: cacheKey, ts: nowTs, data: payload };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
