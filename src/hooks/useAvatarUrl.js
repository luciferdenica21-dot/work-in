import { useEffect, useState } from 'react';
import { gravatarUrl, supabaseProfileAvatarUrl } from '../utils/avatar';
import { filesAPI } from '../config/api';
// NOTE: uses filesAPI from config/api (not utils/avatar) for correct URL resolution

export const useAvatarUrl = (email, directUrl, avatarType = 'gravatar', customAvatarUrl = '') => {
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

  // Приоритет в зависимости от типа аватарки:
  // - 'custom': custom_avatar_url > gravatar > Supabase OAuth > email initial
  // - 'gravatar': gravatar > Supabase OAuth > email initial  
  // - 'email': email photo (Supabase OAuth) > gravatar > email initial
  // - или directUrl из БД

  if (directUrl) return directUrl;

  const e = String(email || '').trim().toLowerCase();
  const customUrl = customAvatarUrl ? (filesAPI.getFileUrl(customAvatarUrl) || customAvatarUrl) : '';

  if (avatarType === 'custom' && customUrl) {
    return customUrl;
  }

  if (avatarType === 'email' && supabaseUrl) {
    return supabaseUrl;
  }

  if (avatarType === 'gravatar' || !avatarType) {
    if (supabaseUrl) return supabaseUrl;
    return e ? gravatarUrl(e) : '';
  }

  // Fallback
  if (supabaseUrl) return supabaseUrl;
  return e ? gravatarUrl(e) : '';
};
