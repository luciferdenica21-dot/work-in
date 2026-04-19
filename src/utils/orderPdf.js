import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';

const b64ToBytes = (b64) => {
  const bin = atob(String(b64 || ''));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
};

const bytesToB64 = (bytes) => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk)
    bin += String.fromCharCode.apply(null, Array.from(u8.slice(i, i + chunk)));
  return btoa(bin);
};

const loadFont = async (doc, lang) => {
  try {
    const cacheKey = `smart_pdf_font_ttf_v3_${lang}`;
    const sample = lang === 'ka' ? 'აბ' : 'БЯ';
    const validate = (f) => { try { f.encodeText(sample); return true; } catch { return false; } };

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      doc.registerFontkit(fontkit);
      const f = await doc.embedFont(b64ToBytes(cached));
      if (validate(f)) return f;
      try { localStorage.removeItem(cacheKey); } catch { void 0; }
    }

    const base = (import.meta?.env?.BASE_URL || '/').replace(/\/?$/, '/');
    const urls = lang === 'ka'
      ? [`${base}fonts/NotoSansGeorgian-Regular.ttf`, `${base}fonts/noto-sans-georgian.ttf`]
      : [`${base}fonts/Roboto-Regular.ttf`, `${base}fonts/roboto-regular.ttf`,
         'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const bytes = await res.arrayBuffer();
        doc.registerFontkit(fontkit);
        const f = await doc.embedFont(bytes);
        if (!validate(f)) continue;
        try { localStorage.setItem(cacheKey, bytesToB64(bytes)); } catch { void 0; }
        return f;
      } catch { void 0; }
    }
  } catch { void 0; }
  return doc.embedFont(StandardFonts.Helvetica);
};

const SVC_MAP = {
  svc_bending: 'smart_svc_bending', svc_laser_engraving: 'smart_svc_laser_engraving',
  svc_laser_cut_metal: 'smart_svc_laser_cut_metal', svc_laser_cut_nonmetal: 'smart_svc_laser_cut_nonmetal',
  svc_powder_paint: 'smart_svc_powder_paint', svc_welding: 'smart_svc_welding',
  svc_mech: 'smart_svc_mech', svc_cnc: 'smart_svc_cnc',
  svc_liquid_paint: 'smart_svc_liquid_paint', svc_materials: 'smart_svc_materials'
};

export const buildOrderPdfForLang = async (lang, { brief, selectedServices, answers, stepData }, i18n) => {
  const doc = await PDFDocument.create();
  const font = await loadFont(doc, lang);
  let page = doc.addPage([595.28, 841.89]);
  const fs = 10, ts = 16, ss = 12, m = 50;
  const mw = 595.28 - m * 2;
  let y = 841.89 - m;

  const san = (s) => { const str = String(s || ''); let o = ''; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); o += c <= 0x7f ? str[i] : '?'; } return o; };
  const sw = (t, sz) => { try { return font.widthOfTextAtSize(t, sz); } catch { return font.widthOfTextAtSize(san(t), sz); } };
  const draw = (t, opts) => { try { page.drawText(t, opts); } catch { page.drawText(san(t), opts); } };
  const line = (text, size = fs) => {
    const words = String(text || '').split(' '); let row = '';
    for (const w of words) {
      const next = row ? `${row} ${w}` : w;
      if (sw(next, size) > mw && row) { draw(row, { x: m, y, size, font, color: rgb(0,0,0) }); y -= size * 1.4; row = w; }
      else row = next;
    }
    if (row) { draw(row, { x: m, y, size, font, color: rgb(0,0,0) }); y -= size * 1.4; }
    if (y < m + 40) { page = doc.addPage([595.28, 841.89]); y = 841.89 - m; }
  };
  const section = (title) => {
    y -= 10;
    page.drawRectangle({ x: m, y: y - 2, width: mw, height: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 15; line(title, ss); y -= 5;
  };

  const fixed = i18n.getFixedT(lang === 'en' ? 'en' : lang === 'ka' ? 'ka' : 'ru');
  const stepTitle = (k) => {
    if (k === 'services_select') return fixed('smart_summary_order_desc');
    if (k === 'brief_form') return fixed('smart_fill_brief');
    if (k === 'q_deadline') return fixed('smart_q_deadline');
    if (k === 'q_quantity') return fixed('smart_q_quantity');
    return k;
  };
  const opts = {
    asap: fixed('smart_deadline_asap'), week: fixed('smart_deadline_week'), month: fixed('smart_deadline_month'),
    metal: fixed('smart_material_metal'), plastic: fixed('smart_material_plastic'), wood: fixed('smart_material_wood'),
    '1': fixed('smart_qty_1'), '2_10': fixed('smart_qty_2_10'), '10_plus': fixed('smart_qty_10_plus')
  };

  line(fixed('smart_summary_pdf_title'), ts);
  y -= 10; line(new Date().toLocaleString(), 8); y -= 10;

  section(fixed('smart_summary_section_client'));
  line(`${fixed('smart_brief_first_name')}: ${String(brief?.firstName || '')}`);
  line(`${fixed('smart_brief_last_name')}: ${String(brief?.lastName || '')}`);
  line(`${fixed('smart_brief_email')}: ${String(brief?.email || '')}`);
  line(`${fixed('smart_brief_phone')}: ${String(brief?.phone || '')}`);

  section(fixed('smart_summary_section_services'));
  (selectedServices || []).forEach((sid) => line(`• ${fixed(SVC_MAP[String(sid)] || String(sid))}`));
  if (!(selectedServices || []).length) line(fixed('smart_no'));

  section(fixed('smart_summary_section_comments'));
  const aLabels = { deadline: fixed('smart_q_deadline'), material: fixed('smart_q_material'), quantity: fixed('smart_q_quantity') };
  let hasC = false;
  ['deadline', 'quantity', 'material'].forEach((k) => {
    const v = (answers || {})[k]; if (v == null) return;
    const val = v && typeof v === 'object' && v.type === 'custom' ? String(v.text || '') : (opts[String(v)] || String(v ?? ''));
    if (!String(val).trim()) return;
    line(`• ${aLabels[k]}: ${val}`); hasC = true;
  });
  const sd = stepData && typeof stepData === 'object' ? stepData : {};
  Object.entries(sd).forEach(([k, v]) => {
    if (k === 'q_deadline' || k === 'q_quantity') return;
    const w = String(v?.wishes || '').trim(); if (!w) return;
    line(`• ${stepTitle(k)}: ${w}`); hasC = true;
  });
  if (!hasC) line(fixed('smart_no'));

  section(fixed('smart_summary_section_files'));
  let hasF = false;
  Object.entries(sd).forEach(([k, v]) => {
    const ff = Array.isArray(v?.files) ? v.files : []; if (!ff.length) return;
    const safeStep = String(k).replace(/[^a-zA-Z0-9_-]+/g, '_');
    const slug = String(stepTitle(k)).replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60);
    const folder = slug ? `${safeStep}_${slug}` : safeStep;
    ff.forEach((f) => {
      const fname = String(f?.name || ''); if (!fname) return;
      line(`• ${fname} (${fixed('smart_summary_file_service')}: ${stepTitle(k)}) — attachments/${folder}/`);
      hasF = true;
    });
  });
  if (!hasF) line(fixed('smart_no'));

  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
};

export const buildOrderSummaryZip = async ({ brief, selectedServices, answers, stepData }, i18n) => {
  const params = { brief, selectedServices, answers, stepData };
  const [ru, en, ka] = await Promise.all([
    buildOrderPdfForLang('ru', params, i18n),
    buildOrderPdfForLang('en', params, i18n),
    buildOrderPdfForLang('ka', params, i18n),
  ]);
  const zip = new JSZip();
  zip.file('order_summary_ru.pdf', ru);
  zip.file('order_summary_en.pdf', en);
  zip.file('order_summary_ka.pdf', ka);
  return zip;
};
