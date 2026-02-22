import { analyticsAPI, authAPI } from './api';

const genSessionId = () => {
  try {
    const existing = sessionStorage.getItem('session_id');
    if (existing) return existing;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('session_id', id);
    return id;
  } catch {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
};

export const initAnalyticsTracker = () => {
  const sessionId = genSessionId();
  const path = window.location.pathname;

  const send = (payload) => {
    try {
      analyticsAPI.sendEvent({
        sessionId,
        path,
        ...payload
      }).catch((err) => { 
        try { console.warn('Analytics send failed:', err?.message || err); } catch { void 0; }
      });
    } catch { void 0; }
  };

  send({ action: 'visit', timestamp: new Date().toISOString() });

  try {
    authAPI.me().then((user) => {
      if (user && user._id) {
        analyticsAPI.bindSession(sessionId).catch(() => {});
      }
    }).catch(() => {});
  } catch { void 0; }

  const sectionTimers = new Map();
  const serviceTimers = new Map();

  const startTimer = (map, key) => {
    map.set(key, performance.now());
  };
  const stopTimer = (map, key) => {
    const start = map.get(key);
    if (start != null) {
      map.delete(key);
      return Math.max(0, Math.round(performance.now() - start));
    }
    return 0;
  };

  const handleClick = (e) => {
    try {
      const target = e.target;
      const sectionEl = target.closest('[data-section]');
      const section = sectionEl?.getAttribute('data-section') || '';
      const element = target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '');
      const text = (target.innerText || '').slice(0, 80);
      send({ action: 'click', section, element, details: { text } });
    } catch { void 0; }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      const duration = stopTimer(sectionTimers, 'site');
      if (duration > 0) {
        send({ action: 'section_close', section: 'site', durationMs: duration });
      }
    } else {
      startTimer(sectionTimers, 'site');
    }
  };

  startTimer(sectionTimers, 'site');
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', () => {
    const duration = stopTimer(sectionTimers, 'site');
    if (duration > 0) {
      send({ action: 'section_close', section: 'site', durationMs: duration });
    }
  });

  document.addEventListener('click', handleClick, { capture: true });

  const api = {
    sectionOpen: (section) => {
      startTimer(sectionTimers, section);
      send({ action: 'section_open', section });
    },
    sectionClose: (section) => {
      const duration = stopTimer(sectionTimers, section);
      send({ action: 'section_close', section, durationMs: duration });
    },
    serviceOpen: (serviceKey) => {
      startTimer(serviceTimers, serviceKey);
      send({ action: 'service_open', serviceKey });
    },
    serviceClose: (serviceKey) => {
      const duration = stopTimer(serviceTimers, serviceKey);
      send({ action: 'service_close', serviceKey, durationMs: duration });
    },
    dispose: () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };

  window.__analyticsTracker = api;
  return api;
};
