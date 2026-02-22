import React, { useEffect, useRef, useState } from 'react';
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
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const getPos = (e) => {
      const r = c.getBoundingClientRect();
      const sx = c.width / r.width;
      const sy = c.height / r.height;
      if (e.touches && e.touches[0]) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };
    const start = (e) => { drawing.current = true; last.current = getPos(e); };
    const move = (e) => {
      if (!drawing.current) return;
      const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last.current = p;
      onChange?.(c.toDataURL('image/png'));
    };
    const end = () => { drawing.current = false; onChange?.(c.toDataURL('image/png')); };
    const preventScroll = (e) => { if (drawing.current) e.preventDefault(); };
    c.addEventListener('mousedown', start);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    c.addEventListener('touchstart', start, { passive: true });
    c.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    c.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      c.removeEventListener('mousedown', start);
      c.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      c.removeEventListener('touchstart', start);
      c.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      c.removeEventListener('touchmove', preventScroll);
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sig, setSig] = useState('');
  const [signPos, setSignPos] = useState(null);
  const [sending, setSending] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const previewRef = useRef(null);
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
      alert('Документ подписан и отправлен менеджеру');
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
      alert('Вы отклонили документ. Менеджер уведомлён.');
      navigate('/dashboard');
    } catch {
      void 0;
    } finally {
      setSending(false);
    }
  };
  if (loading) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">Загрузка...</div>;
  if (!data) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">Не найдено</div>;
  const previewUrl = filesAPI.getFileUrl(data?.finalPdfUrl || data?.file?.url);
  const isPdf = (data?.finalPdfUrl ? true : (String(data?.file?.type || '').includes('pdf') || String(previewUrl).toLowerCase().endsWith('.pdf')));
  const isImage = !isPdf && String(data?.file?.type || '').startsWith('image/');
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  return (
    <div className="min-h-screen bg-[#050a18] text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">Подписание документа</div>
          <div className="flex gap-2">
            <a href={previewUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">Просмотреть</a>
            {!data?.clientSignatureUrl && (
              <>
                <button onClick={() => setShowSignModal(true)} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Подписать</button>
                <button onClick={reject} disabled={sending} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">Отклонить</button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div ref={previewRef} className="relative w-full h-[70vh] bg-white rounded overflow-auto" style={{ touchAction: 'manipulation' }}>
            {isPdf ? (
              isMobile ? (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center text-blue-600 underline">Открыть PDF</a>
              ) : (
                <iframe title="doc" src={previewUrl} className="absolute inset-0 w-full h-full bg-white" />
              )
            ) : isImage ? (
              <img alt="doc" src={previewUrl} className="absolute inset-0 w-full h-full object-contain bg-white" />
            ) : (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center text-blue-300 underline">Открыть документ</a>
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
                <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">Место подписи</div>
                {data?.managerSignatureUrl && (<img alt="manager-sign" src={filesAPI.getFileUrl(data.managerSignatureUrl)} className="absolute inset-0 w-full h-full object-contain" />)}
                {data?.clientSignatureUrl && (<img alt="client-sign" src={filesAPI.getFileUrl(data.clientSignatureUrl)} className="absolute inset-0 w-full h-full object-contain" />)}
              </div>
            )}
          </div>
        </div>
        {data?.clientSignatureUrl ? (
          <div className="text-green-300">Документ уже подписан</div>
        ) : null}
      </div>
      {showSignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowSignModal(false)} />
          <div className="relative w-full max-w-xl bg-[#0a0f1f] border border-white/10 rounded-2xl p-4">
            <div className="text-white font-semibold mb-2">Подпишите</div>
            <div className="relative border border-white/10 rounded bg-white">
              <canvas ref={canvasRef} width={800} height={240} className="w-full h-48" />
              <button type="button" onClick={clear} className="absolute bottom-2 right-2 text-xs px-3 py-1 rounded bg-white/80 text-black hover:bg-white">Очистить</button>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowSignModal(false)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">Отмена</button>
              <button disabled={!sig || sending} onClick={submit} className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">Подписать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
