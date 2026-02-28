import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { signaturesAPI } from '../config/api';
import { filesAPI } from '../config/api';

const useDrawing = (onChange) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const r0 = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r0.width * dpr));
    c.height = Math.max(1, Math.round(r0.height * dpr));
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#111';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const getPos = (e) => {
      const r = c.getBoundingClientRect();
      const sx = (c.width / dpr) / r.width;
      const sy = (c.height / dpr) / r.height;
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };
    const start = (e) => {
      e.preventDefault();
      drawing.current = true;
      last.current = getPos(e);
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
      const baseR = 2;
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, baseR + pressure, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      onChange?.(c.toDataURL('image/png'));
    };
    const move = (e) => {
      if (!drawing.current) return;
      e.preventDefault();
      const p = getPos(e);
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
      const baseW = 4;
      ctx.lineWidth = baseW * pressure;
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      onChange?.(c.toDataURL('image/png'));
    };
    const end = () => {
      drawing.current = false;
      onChange?.(c.toDataURL('image/png'));
    };
    c.addEventListener('pointerdown', start, { passive: false });
    c.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      c.removeEventListener('pointerdown', start);
      c.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [onChange]);
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    onChange?.('');
  };
  return { canvasRef, clear };
};

export default function SignDocumentView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sig, setSig] = useState('');
  const [signPos, setSignPos] = useState(null);
  const [sending, setSending] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const previewRef = useRef(null);
  const [scale, setScale] = useState(1);
  const pdfContainerRef = useRef(null);
  const [pdfReady, setPdfReady] = useState(false);
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const [renderTick, setRenderTick] = useState(0);
  const { canvasRef, clear } = useDrawing(setSig);
  // Клиент не меняет координаты — используем координаты, заданные администратором
  useEffect(() => {
    let active = true;
    signaturesAPI.get(id).then(d => { if (active) { setData(d); setSignPos(d?.managerSignPos || null); setLoading(false); } }).catch(() => { setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const submit = async () => {
    if (!sig) return;
    setSending(true);
    try {
      // рассчитываем абсолютные пиксели не нужны: отправим те же нормализованные координаты
      await signaturesAPI.clientSign(id, sig, signPos || null);
      try {
        const fresh = await signaturesAPI.get(id);
        setData(fresh);
      } catch { void 0; }
      alert(t('sign_sent_success'));
    } catch {
      void 0;
    } finally {
      setSending(false);
      setShowSignModal(false);
    }
  };
  const reject = async () => {
    setSending(true);
    try {
      await signaturesAPI.reject(id);
      alert(t('reject_success'));
      navigate('/dashboard');
    } catch {
      void 0;
    } finally {
      setSending(false);
    }
  };
  const previewUrl = filesAPI.getFileUrl(data?.finalPdfUrl || data?.file?.url);
  const isPdf = (data?.finalPdfUrl ? true : (String(data?.file?.type || '').includes('pdf') || String(previewUrl).toLowerCase().endsWith('.pdf')));
  const isImage = !isPdf && String(data?.file?.type || '').startsWith('image/');
  useEffect(() => {
    const onResize = () => setRenderTick((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadPdfJs = async () => {
      if (!isPdf || !previewUrl) return;
      try {
        if (!window.pdfjsLib) {
          const s1 = document.createElement('script');
          s1.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
          const s2 = document.createElement('script');
          s2.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          await new Promise((r, j) => { s1.onload = r; s1.onerror = j; document.head.appendChild(s1); });
          await new Promise((r, j) => { s2.onload = r; s2.onerror = j; document.head.appendChild(s2); });
        }
        if (cancelled) return;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        const resp = await fetch(previewUrl);
        const buf = await resp.arrayBuffer();
        const doc = await window.pdfjsLib.getDocument({ data: buf }).promise;
        const cont = pdfContainerRef.current;
        if (!cont) return;
        cont.innerHTML = '';
        const parent = previewRef.current;
        const containerWidth = Math.max(320, Math.floor((parent?.clientWidth || cont.clientWidth || 600)));
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: fitScale * scale });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${containerWidth}px`;
          const div = document.createElement('div');
          div.style.position = 'relative';
          div.style.width = `${containerWidth}px`;
          div.style.height = `${viewport.height}px`;
          div.appendChild(canvas);
          cont.appendChild(div);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) {
          setPdfReady(true);
        }
      } catch {
        setPdfReady(false);
      }
    };
    loadPdfJs();
    return () => { cancelled = true; };
  }, [isPdf, previewUrl, scale, isMobile, renderTick]);
  if (loading) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">{t('loading')}</div>;
  if (!data) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">{t('not_found')}</div>;
  return (
    <div className="min-h-screen bg-[#050a18] text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">{t('sign_document_title')}</div>
          <div className="flex gap-2">
            <a href={previewUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">{t('view')}</a>
            {!data?.clientSignatureUrl && (
              <>
                <button onClick={() => setShowSignModal(true)} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{t('sign')}</button>
                <button onClick={reject} disabled={sending} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{t('reject')}</button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/70 text-xs">{t('scale')}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScale(s => Math.max(0.6, +(s - 0.1).toFixed(2)))}
                className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
                aria-label="Zoom out"
              >−</button>
              <div className="text-white/80 text-xs w-12 text-center">{Math.round(scale * 100)}%</div>
              <button
                type="button"
                onClick={() => setScale(s => Math.min(2, +(s + 0.1).toFixed(2)))}
                className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
                aria-label="Zoom in"
              >+</button>
            </div>
          </div>
          
          <div className="relative w-full h-[70vh] bg-white rounded overflow-auto" style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch', overflowX: 'hidden' }}>
            <div ref={previewRef} className="relative" style={{ width: '100%', minHeight: '100%' }}>
              {isPdf ? (
                <div className="absolute inset-0">
                  {!pdfReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-black/60">{t('loading')}</div>
                  )}
                  <div ref={pdfContainerRef} className="absolute inset-0 overflow-auto" />
                </div>
              ) : isImage ? (
                <img alt="doc" src={previewUrl} className="absolute inset-0 w-full h-full object-contain bg-white" />
              ) : (
                <iframe title="doc" src={previewUrl} className="absolute inset-0 w-full h-full bg-white" />
              )}
              {signPos && signPos.x != null && signPos.y != null && signPos.w && signPos.h && (
                <div
                  className="absolute border-2 border-purple-600 bg-purple-500/20 rounded"
                  style={{
                    left: `${(signPos.x) * 100}%`,
                    top: `${(signPos.y) * 100}%`,
                    width: `${signPos.w * 100}%`,
                    height: `${signPos.h * 100}%`
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">{t('sign_place_label')}</div>
                  {data?.managerSignatureUrl && (<img alt="manager-sign" src={filesAPI.getFileUrl(data.managerSignatureUrl)} className="absolute inset-0 w-full h-full object-contain" />)}
                  {data?.clientSignatureUrl && (<img alt="client-sign" src={filesAPI.getFileUrl(data.clientSignatureUrl)} className="absolute inset-0 w-full h-full object-contain" />)}
                </div>
              )}
            </div>
          </div>
        </div>
        {data?.clientSignatureUrl ? (
          <div className="text-green-300">{t('doc_already_signed')}</div>
        ) : null}
      </div>
      {showSignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowSignModal(false)} />
          <div className="relative w-full max-w-xl bg-[#0a0f1f] border border-white/10 rounded-2xl p-4">
            <div className="text-white font-semibold mb-2">{t('sign_draw_label')}</div>
            <div className="relative border border-white/10 rounded bg-white">
              <canvas ref={canvasRef} width={800} height={240} className="w-full h-48" style={{ touchAction: 'none' }} />
              <button type="button" onClick={clear} className="absolute bottom-2 right-2 text-xs px-3 py-1 rounded bg-white/80 text-black hover:bg-white">{t('clear')}</button>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowSignModal(false)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">{t('cancel')}</button>
              <button disabled={!sig || sending} onClick={submit} className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">{t('sign')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
