import { useEffect, useState } from 'react';
import { gravatarUrl, supabaseProfileAvatarUrl } from '../utils/avatar';

export const useAvatarUrl = (email) => {
  const [state, setState] = useState({ email: '', url: '' });

  useEffect(() => {
    let active = true;
    const e = String(email || '').trim().toLowerCase();
    if (!e) return () => { active = false; };
    supabaseProfileAvatarUrl(e).then((u) => {
      if (!active) return;
      setState({ email: e, url: u || '' });
    }).catch(() => { void 0; });
    return () => { active = false; };
  }, [email]);

  const e = String(email || '').trim().toLowerCase();
  const fallback = gravatarUrl(e);
  const override = state.email === e ? state.url : '';
  return override || fallback;
};
