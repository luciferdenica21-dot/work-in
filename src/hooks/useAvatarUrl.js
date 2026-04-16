import { useEffect, useState } from 'react';
import { gravatarUrl, supabaseProfileAvatarUrl } from '../utils/avatar';

export const useAvatarUrl = (email, directUrl) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');

  useEffect(() => {
    // Если есть прямой URL из БД — Supabase не нужен
    if (directUrl) return;

    let active = true;
    const e = String(email || '').trim().toLowerCase();
    if (!e) return () => { active = false; };

    supabaseProfileAvatarUrl(e).then((u) => {
      if (active) setSupabaseUrl(u || '');
    }).catch(() => {});

    return () => { active = false; };
  }, [email, directUrl]);

  // Приоритет: directUrl из БД > Supabase OAuth > Gravatar
  if (directUrl) return directUrl;
  if (supabaseUrl) return supabaseUrl;
  const e = String(email || '').trim().toLowerCase();
  return e ? gravatarUrl(e) : '';
};
