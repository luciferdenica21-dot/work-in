import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { signaturesAPI } from '../config/api';
import { filesAPI } from '../config/api';

const SignaturePad = ({ onChange }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const start = (e) => { drawing.current = true; last.current = getPos(e); };
    const move = (e) => {
      if (!drawing.current) return;
      const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last.current = p;
      onChange?.(canvas.toDataURL('image/png'));
    };
    const end = () => { drawing.current = false; onChange?.(canvas.toDataURL('image/png')); };
    const preventScroll = (e) => { if (drawing.current) e.preventDefault(); };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: true });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [onChange]);
  return (
    <div className="border border-gray-300 rounded bg-white">
      <canvas ref={canvasRef} width={600} height={200} />
    </div>
  );
};

export default function SignDocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sig, setSig] = useState('');
  const [signPos, setSignPos] = useState(null);
  const [sending, setSending] = useState(false);
  const previewRef = useRef(null);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      const qx = sp.get('x'); const qy = sp.get('y'); const qw = sp.get('w'); const qh = sp.get('h');
      if (qx && qy && qw && qh) {
        const nx = parseFloat(qx); const ny = parseFloat(qy); const nw = parseFloat(qw); const nh = parseFloat(qh);
        if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nw) && Number.isFinite(nh)) {
          setSignPos({ x: nx, y: ny, w: nw, h: nh, page: 1 });
        }
      }
    } catch { /* ignore */ }
  }, [location.search]);
  const placeBox = (e) => {
    if (!previewRef.current) return;
    const r = previewRef.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const nx = Math.max(0, Math.min(1, px / r.width));
    const ny = Math.max(0, Math.min(1, py / r.height));
    const nw = Math.min(0.35, 140 / r.width);
    const nh = Math.min(0.2, 40 / r.height);
    setSignPos({ x: nx, y: ny, w: nw, h: nh, page: 1 });
  };
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
      alert('Документ подписан и отправлен менеджеру');
      navigate('/dashboard');
    } catch {
    } finally {
      setSending(false);
    }
  };
  if (loading) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">Загрузка...</div>;
  if (!data) return <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center">Не найдено</div>;
  const fileUrl = filesAPI.getFileUrl(data?.file?.url);
  const isPdf = String(data?.file?.type || '').includes('pdf') || String(fileUrl).toLowerCase().endsWith('.pdf');
  const isImage = String(data?.file?.type || '').startsWith('image/');
  return (
    <div className="min-h-screen bg-[#050a18] text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-xl font-semibold">Подписание документа</div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div ref={previewRef} onClick={placeBox} className="relative w-full h-[70vh] bg-white rounded overflow-hidden" style={{ touchAction: 'manipulation' }}>
            {isPdf ? (
              <iframe title="doc" src={fileUrl} className="absolute inset-0 w-full h-full bg-white" />
            ) : isImage ? (
              <img alt="doc" src={fileUrl} className="absolute inset-0 w-full h-full object-contain bg-white" />
            ) : (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center text-blue-300 underline">Открыть документ</a>
            )}
            {data?.managerSignatureUrl && signPos && signPos.x != null && signPos.y != null && signPos.w && signPos.h && (
              <div
                className="absolute border-2 border-purple-600 bg-purple-500/20 rounded"
                style={{
                  left: `${(signPos.x - signPos.w / 2) * 100}%`,
                  top: `${(signPos.y - signPos.h / 2) * 100}%`,
                  width: `${signPos.w * 100}%`,
                  height: `${signPos.h * 100}%`
                }}
              >
                <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">
                  Место подписи
                </div>
                <img alt="manager-sign" src={filesAPI.getFileUrl(data.managerSignatureUrl)} className="absolute inset-0 w-full h-full object-contain" />
                {sig && (
                  <img alt="client-sign" src={sig} className="absolute inset-0 w-full h-full object-contain opacity-90" />
                )}
              </div>
            )}
          </div>
        </div>
        {!data?.clientSignatureUrl ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
            <div className="text-sm text-white/80">Ваша подпись</div>
            <SignaturePad onChange={setSig} />
            <div className="flex justify-end">
              <button disabled={!sig || sending} onClick={submit} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">Подписать и отправить</button>
            </div>
          </div>
        ) : (
          <div className="text-green-300">Документ уже подписан</div>
        )}
      </div>
    </div>
  );
}
