import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const getCookie = (name) => {
  const parts = String(document.cookie || '').split(';');
  for (const raw of parts) {
    const idx = raw.indexOf('=');
    if (idx < 0) continue;
    const k = raw.slice(0, idx).trim();
    if (k !== name) continue;
    return decodeURIComponent(raw.slice(idx + 1));
  }
  return null;
};

const setCookie = (name, value) => {
  const secure = window.location.protocol === 'https:';
  const base = `${name}=${encodeURIComponent(String(value))}; Path=/; SameSite=Lax`;
  document.cookie = secure ? `${base}; Secure` : base;
};

const deleteCookie = (name) => {
  const secure = window.location.protocol === 'https:';
  const base = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = secure ? `${base}; Secure` : base;
};

const cookieStorage = {
  getItem: (key) => getCookie(key),
  setItem: (key, value) => setCookie(key, value),
  removeItem: (key) => deleteCookie(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: cookieStorage
  }
});
