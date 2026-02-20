import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sig, setSig] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let active = true;
    signaturesAPI.get(id).then(d => { if (active) { setData(d); setLoading(false); } }).catch(() => { setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const submit = async () => {
    if (!sig) return;
    setSending(true);
    try {
      await signaturesAPI.clientSign(id, sig);
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
          {isPdf ? (
            <iframe title="doc" src={fileUrl} className="w-full h-[70vh] bg-white rounded" />
          ) : isImage ? (
            <img alt="doc" src={fileUrl} className="max-w-full rounded bg-white" />
          ) : (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">Открыть документ</a>
          )}
          {data?.managerSignatureUrl && (
            <div className="mt-3">
              <div className="text-sm text-white/70 mb-2">Подпись менеджера</div>
              <img alt="manager-sign" src={filesAPI.getFileUrl(data.managerSignatureUrl)} className="bg-white rounded inline-block max-h-32" />
            </div>
          )}
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
