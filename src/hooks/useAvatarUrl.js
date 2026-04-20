import { useEffect, useState } from 'react';
import { gravatarUrl, supabaseProfileAvatarUrl } from '../utils/avatar';
import { filesAPI } from '../config/api';

export const useAvatarUrl = (email, directUrl, avatarType = 'gravatar', customAvatarUrl = '') => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');

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

  // Обработка кастомного аватара
  useEffect(() => {
    if (customAvatarUrl) {
      // Если это уже полный URL (загруженный файл)
      if (customAvatarUrl.startsWith('http') || customAvatarUrl.startsWith('/')) {
        setCustomUrl(customAvatarUrl);
      } else {
        // Если это путь к файлу, получаем полный URL
        const fullUrl = filesAPI.getFileUrl(customAvatarUrl);
        setCustomUrl(fullUrl);
      }
    } else {
      setCustomUrl('');
    }
  }, [customAvatarUrl]);

  // Приоритет в зависимости от типа аватарки:
  // - 'custom': custom_avatar_url > gravatar > Supabase OAuth > email initial
  // - 'gravatar': gravatar > Supabase OAuth > email initial  
  // - 'email': email photo (Supabase OAuth) > gravatar > email initial
  // - или directUrl из БД

  if (directUrl) return directUrl;

  const e = String(email || '').trim().toLowerCase();

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
