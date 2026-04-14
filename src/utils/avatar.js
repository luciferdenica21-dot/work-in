import { supabase } from '../config/supabaseClient';

const md5 = (string) => {
  const str = String(string);
  const x = [];
  const k = [];
  let a;
  let b;
  let c;
  let d;

  const add32 = (aa, bb) => (aa + bb) & 0xFFFFFFFF;

  const cmn = (q, aa, bb, xx, ss, tt) => add32(((aa + q + xx + tt) << ss) | ((aa + q + xx + tt) >>> (32 - ss)), bb);
  const ff = (aa, bb, cc, dd, xx, ss, tt) => cmn((bb & cc) | (~bb & dd), aa, bb, xx, ss, tt);
  const gg = (aa, bb, cc, dd, xx, ss, tt) => cmn((bb & dd) | (cc & ~dd), aa, bb, xx, ss, tt);
  const hh = (aa, bb, cc, dd, xx, ss, tt) => cmn(bb ^ cc ^ dd, aa, bb, xx, ss, tt);
  const ii = (aa, bb, cc, dd, xx, ss, tt) => cmn(cc ^ (bb | ~dd), aa, bb, xx, ss, tt);

  const toHex = (num) => {
    let s = '';
    for (let j = 0; j < 4; j++) {
      s += (`0${((num >> (j * 8)) & 0xFF).toString(16)}`).slice(-2);
    }
    return s;
  };

  const utf8 = unescape(encodeURIComponent(str));
  const n = utf8.length;
  for (let i = 0; i < n; i++) x[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
  x[n >> 2] |= 0x80 << ((n % 4) * 8);
  x[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;

  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

  a = 1732584193;
  b = -271733879;
  c = -1732584194;
  d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, x[i + 0], 7, k[0]);
    d = ff(d, a, b, c, x[i + 1], 12, k[1]);
    c = ff(c, d, a, b, x[i + 2], 17, k[2]);
    b = ff(b, c, d, a, x[i + 3], 22, k[3]);
    a = ff(a, b, c, d, x[i + 4], 7, k[4]);
    d = ff(d, a, b, c, x[i + 5], 12, k[5]);
    c = ff(c, d, a, b, x[i + 6], 17, k[6]);
    b = ff(b, c, d, a, x[i + 7], 22, k[7]);
    a = ff(a, b, c, d, x[i + 8], 7, k[8]);
    d = ff(d, a, b, c, x[i + 9], 12, k[9]);
    c = ff(c, d, a, b, x[i + 10], 17, k[10]);
    b = ff(b, c, d, a, x[i + 11], 22, k[11]);
    a = ff(a, b, c, d, x[i + 12], 7, k[12]);
    d = ff(d, a, b, c, x[i + 13], 12, k[13]);
    c = ff(c, d, a, b, x[i + 14], 17, k[14]);
    b = ff(b, c, d, a, x[i + 15], 22, k[15]);

    a = gg(a, b, c, d, x[i + 1], 5, k[16]);
    d = gg(d, a, b, c, x[i + 6], 9, k[17]);
    c = gg(c, d, a, b, x[i + 11], 14, k[18]);
    b = gg(b, c, d, a, x[i + 0], 20, k[19]);
    a = gg(a, b, c, d, x[i + 5], 5, k[20]);
    d = gg(d, a, b, c, x[i + 10], 9, k[21]);
    c = gg(c, d, a, b, x[i + 15], 14, k[22]);
    b = gg(b, c, d, a, x[i + 4], 20, k[23]);
    a = gg(a, b, c, d, x[i + 9], 5, k[24]);
    d = gg(d, a, b, c, x[i + 14], 9, k[25]);
    c = gg(c, d, a, b, x[i + 3], 14, k[26]);
    b = gg(b, c, d, a, x[i + 8], 20, k[27]);
    a = gg(a, b, c, d, x[i + 13], 5, k[28]);
    d = gg(d, a, b, c, x[i + 2], 9, k[29]);
    c = gg(c, d, a, b, x[i + 7], 14, k[30]);
    b = gg(b, c, d, a, x[i + 12], 20, k[31]);

    a = hh(a, b, c, d, x[i + 5], 4, k[32]);
    d = hh(d, a, b, c, x[i + 8], 11, k[33]);
    c = hh(c, d, a, b, x[i + 11], 16, k[34]);
    b = hh(b, c, d, a, x[i + 14], 23, k[35]);
    a = hh(a, b, c, d, x[i + 1], 4, k[36]);
    d = hh(d, a, b, c, x[i + 4], 11, k[37]);
    c = hh(c, d, a, b, x[i + 7], 16, k[38]);
    b = hh(b, c, d, a, x[i + 10], 23, k[39]);
    a = hh(a, b, c, d, x[i + 13], 4, k[40]);
    d = hh(d, a, b, c, x[i + 0], 11, k[41]);
    c = hh(c, d, a, b, x[i + 3], 16, k[42]);
    b = hh(b, c, d, a, x[i + 6], 23, k[43]);
    a = hh(a, b, c, d, x[i + 9], 4, k[44]);
    d = hh(d, a, b, c, x[i + 12], 11, k[45]);
    c = hh(c, d, a, b, x[i + 15], 16, k[46]);
    b = hh(b, c, d, a, x[i + 2], 23, k[47]);

    a = ii(a, b, c, d, x[i + 0], 6, k[48]);
    d = ii(d, a, b, c, x[i + 7], 10, k[49]);
    c = ii(c, d, a, b, x[i + 14], 15, k[50]);
    b = ii(b, c, d, a, x[i + 5], 21, k[51]);
    a = ii(a, b, c, d, x[i + 12], 6, k[52]);
    d = ii(d, a, b, c, x[i + 3], 10, k[53]);
    c = ii(c, d, a, b, x[i + 10], 15, k[54]);
    b = ii(b, c, d, a, x[i + 1], 21, k[55]);
    a = ii(a, b, c, d, x[i + 8], 6, k[56]);
    d = ii(d, a, b, c, x[i + 15], 10, k[57]);
    c = ii(c, d, a, b, x[i + 6], 15, k[58]);
    b = ii(b, c, d, a, x[i + 13], 21, k[59]);
    a = ii(a, b, c, d, x[i + 4], 6, k[60]);
    d = ii(d, a, b, c, x[i + 11], 10, k[61]);
    c = ii(c, d, a, b, x[i + 2], 15, k[62]);
    b = ii(b, c, d, a, x[i + 9], 21, k[63]);

    a = add32(a, aa);
    b = add32(b, bb);
    c = add32(c, cc);
    d = add32(d, dd);
  }

  return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
};

export const gravatarUrl = (email) => {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return '';
  const hash = md5(e);
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=256`;
};

export const supabaseProfileAvatarUrl = async (email) => {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return '';
  try {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;
    const ue = String(u?.email || '').trim().toLowerCase();
    if (!u || !ue || ue !== e) return '';

    const meta = u.user_metadata || {};
    const fromMeta = meta.avatar_url || meta.picture || meta.picture_url;
    if (fromMeta) return String(fromMeta);

    const id0 = (u.identities || [])[0];
    const idData = id0?.identity_data || {};
    const fromId = idData.avatar_url || idData.picture || idData.picture_url;
    if (fromId) return String(fromId);

    return '';
  } catch {
    return '';
  }
};
