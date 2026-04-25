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

    const real = req.headers['x-real-ip'];
    if (real) return String(real).trim();

    const fwd = req.headers['x-forwarded-for'];
    if (fwd) {
      const first = String(fwd).split(',')[0]?.trim();
      if (first) return first;
    }

    const raw = req.ip || req.connection?.remoteAddress || '';
    const ip = String(raw).trim();
    if (!ip) return '';
    if (ip === '::1') return '127.0.0.1';
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

const _siteCacheGet = (map, key, ttlMs) => {
  const v = map.get(key);
  if (!v) return null;
  if (!v.ts || !v.data) return null;
  if (Date.now() - v.ts > ttlMs) return null;
  return v.data;
};

const _siteCacheSet = (map, key, data) => {
  map.set(key, { ts: Date.now(), data });
  try {
    if (map.size > 50) {
      const firstKey = map.keys().next().value;
      if (firstKey) map.delete(firstKey);
    }
  } catch { void 0; }
};

const getRangeStartIso = (days) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
  return start.toISOString();
};

const isAdminPath = (p) => {
  const s = String(p || '');
  return s === '/manager' || s.startsWith('/manager/');
};

const fetchSiteRows = async (startIso) => {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('session_id,action,path,section,duration_ms,timestamp,details')
    .gte('timestamp', startIso)
    .in('action', ['visit', 'section_close'])
    .order('timestamp', { ascending: true })
    .limit(50000);
  if (!error) return data || [];

  const { data: data2, error: error2 } = await supabase
    .from('analytics_events')
    .select('sessionId,action,path,section,durationMs,timestamp,details')
    .gte('timestamp', startIso)
    .in('action', ['visit', 'section_close'])
    .order('timestamp', { ascending: true })
    .limit(50000);
  if (error2) throw error2;
  return data2 || [];
};

const buildSessionsFromRows = (rows) => {
  const sessions = new Map();
  for (const r of rows || []) {
    const action = r.action;
    const path = r.path;
    if (isAdminPath(path)) continue;
    const sessionId = r.session_id ?? r.sessionId ?? '';
    if (!sessionId) continue;

    const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0;
    if (!Number.isFinite(ts) || ts <= 0) continue;

    const section = r.section || '';
    const durationMs = Number(r.duration_ms ?? r.durationMs ?? 0) || 0;
    const details = r.details && typeof r.details === 'object' ? r.details : {};
    const ip = details?.ip ? String(details.ip) : '';
    const ua = details?.ua ? String(details.ua) : '';

    const existing = sessions.get(sessionId) || { sessionId, firstTs: ts, lastTs: ts, ip: '', ua: '', totalDurationMs: 0 };
    existing.firstTs = Math.min(existing.firstTs || ts, ts);
    existing.lastTs = Math.max(existing.lastTs || ts, ts);
    if (!existing.ip && ip) existing.ip = ip;
    if (!existing.ua && ua) existing.ua = ua;
    if (action === 'section_close' && section === 'site') {
      existing.totalDurationMs += Math.max(0, durationMs);
    }
    sessions.set(sessionId, existing);
  }
  return sessions;
};

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
    const startIso = getRangeStartIso(days);

    let rows = null;
    {
      rows = await fetchSiteRows(startIso);
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

    const sessions = buildSessionsFromRows(rows);

    const dayBuckets = new Map();
    const overallIps = new Set();
    let totalVisits = 0;
    let totalTimeMs = 0;
    let noIpVisits = 0;

    const visitors = new Map();

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
      else noIpVisits += 1;

      const visitorKey = `${s.ip || 'no_ip'}|${s.ua || ''}`;
      const v = visitors.get(visitorKey) || {
        key: visitorKey,
        ip: s.ip || '',
        ua: s.ua || '',
        visits: 0,
        totalTimeMs: 0,
        lastSeen: 0
      };
      v.visits += 1;
      v.totalTimeMs += Math.max(0, Number(s.totalDurationMs) || 0);
      v.lastSeen = Math.max(v.lastSeen || 0, Number(s.lastTs) || 0, Number(s.firstTs) || 0);
      visitors.set(visitorKey, v);
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
    const devices = visitors.size;

    const topVisitors = Array.from(visitors.values())
      .map((v) => ({
        key: v.key,
        ip: v.ip,
        ua: v.ua,
        visits: v.visits,
        totalTimeMs: v.totalTimeMs,
        avgTimeMs: v.visits ? Math.round(v.totalTimeMs / v.visits) : 0,
        lastSeen: v.lastSeen ? new Date(v.lastSeen).toISOString() : null
      }))
      .sort((a, b) => (b.visits - a.visits) || (b.totalTimeMs - a.totalTimeMs))
      .slice(0, 50);

    const payload = {
      rangeDays: days,
      totals: {
        visits: totalVisits,
        devices,
        uniqueIps,
        repeatVisits,
        noIpVisits,
        totalTimeMs,
        avgTimeMs
      },
      series,
      visitors: topVisitors
    };

    _siteStatsCache = { key: cacheKey, ts: nowTs, data: payload };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const _siteVisitorsCache = new Map();

router.get('/site-visitors', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const daysRaw = Number(req.query?.days);
    const days = Number.isFinite(daysRaw) ? Math.min(120, Math.max(1, Math.floor(daysRaw))) : 30;
    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(1000, Math.max(20, Math.floor(limitRaw))) : 200;
    const offsetRaw = Number(req.query?.offset);
    const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;

    const includeNoIp = String(req.query?.includeNoIp || '') === '1';
    const cacheKey = `d:${days}|l:${limit}|o:${offset}|n:${includeNoIp ? 1 : 0}`;
    const cached = _siteCacheGet(_siteVisitorsCache, cacheKey, 15000);
    if (cached) return res.json(cached);

    const startIso = getRangeStartIso(days);
    const rows = await fetchSiteRows(startIso);
    const sessions = buildSessionsFromRows(rows);

    const ipsMap = new Map();
    let noIpVisits = 0;

    for (const s of sessions.values()) {
      const ipKey = s.ip || 'NO_IP';
      if (ipKey === 'NO_IP') noIpVisits += 1;
      const g = ipsMap.get(ipKey) || { ip: s.ip || '', visits: 0, totalTimeMs: 0, lastSeen: 0, uas: new Set() };
      g.visits += 1;
      g.totalTimeMs += Math.max(0, Number(s.totalDurationMs) || 0);
      g.lastSeen = Math.max(g.lastSeen || 0, Number(s.lastTs) || 0, Number(s.firstTs) || 0);
      if (s.ua) g.uas.add(s.ua);
      ipsMap.set(ipKey, g);
    }

    const all = Array.from(ipsMap.entries())
      .filter(([k]) => includeNoIp || k !== 'NO_IP')
      .map(([k, v]) => ({
        key: k,
        ip: v.ip,
        visits: v.visits,
        totalTimeMs: v.totalTimeMs,
        avgTimeMs: v.visits ? Math.round(v.totalTimeMs / v.visits) : 0,
        devices: v.uas.size,
        lastSeen: v.lastSeen ? new Date(v.lastSeen).toISOString() : null
      }))
      .sort((a, b) => (Number(b.lastSeen ? Date.parse(b.lastSeen) : 0) - Number(a.lastSeen ? Date.parse(a.lastSeen) : 0)));

    const totalRows = all.length;
    const page = all.slice(offset, offset + limit);

    const payload = {
      rangeDays: days,
      totals: {
        ips: all.filter((x) => x.key !== 'NO_IP').length,
        visits: sessions.size,
        noIpVisits
      },
      offset,
      limit,
      totalRows,
      visitors: page
    };

    _siteCacheSet(_siteVisitorsCache, cacheKey, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const _siteVisitorHistoryCache = new Map();

router.get('/site-visitor-history', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const ipParam = String(req.query?.ip || '').trim();
    if (!ipParam) return res.status(400).json({ message: 'ip is required' });

    const daysRaw = Number(req.query?.days);
    const days = Number.isFinite(daysRaw) ? Math.min(120, Math.max(1, Math.floor(daysRaw))) : 30;
    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(2000, Math.max(20, Math.floor(limitRaw))) : 200;
    const offsetRaw = Number(req.query?.offset);
    const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;

    const cacheKey = `ip:${ipParam}|d:${days}|l:${limit}|o:${offset}`;
    const cached = _siteCacheGet(_siteVisitorHistoryCache, cacheKey, 15000);
    if (cached) return res.json(cached);

    const startIso = getRangeStartIso(days);
    const rows = await fetchSiteRows(startIso);
    const sessions = buildSessionsFromRows(rows);

    const wantKey = ipParam === 'NO_IP' ? 'NO_IP' : ipParam;
    const list = Array.from(sessions.values())
      .filter((s) => (s.ip || 'NO_IP') === wantKey)
      .sort((a, b) => (Number(b.lastTs) - Number(a.lastTs)));

    const totalVisits = list.length;
    const page = list.slice(offset, offset + limit).map((s) => ({
      sessionId: s.sessionId,
      start: s.firstTs ? new Date(s.firstTs).toISOString() : null,
      end: s.lastTs ? new Date(s.lastTs).toISOString() : null,
      durationMs: Math.max(0, Number(s.totalDurationMs) || 0),
      ua: s.ua || ''
    }));

    const payload = {
      ip: wantKey,
      rangeDays: days,
      offset,
      limit,
      totalVisits,
      visits: page
    };

    _siteCacheSet(_siteVisitorHistoryCache, cacheKey, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
