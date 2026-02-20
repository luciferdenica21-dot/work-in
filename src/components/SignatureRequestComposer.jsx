import React, { useRef, useState, useEffect } from 'react';
import { filesAPI, signaturesAPI } from '../config/api';

const SignaturePad = ({ onChange }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [empty, setEmpty] = useState(true);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      }
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const start = (e) => {
      drawing.current = true;
      const p = getPos(e);
      last.current = p;
    };
    const move = (e) => {
      if (!drawing.current) return;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      setEmpty(false);
      onChange?.(canvas.toDataURL('image/png'));
    };
    const end = () => {
      drawing.current = false;
      onChange?.(canvas.toDataURL('image/png'));
    };
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
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange?.('');
  };
  return (
    <div className="space-y-2">
      <div className="border border-white/20 rounded-lg bg-white">
        <canvas ref={canvasRef} width={600} height={180} />
      </div>
      <div className="flex gap-2">
        <button onClick={clear} className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white hover:bg-white/15">Очистить</button>
        <div className="text-xs text-white/60">{empty ? 'Подпись пуста' : 'Подпись добавлена'}</div>
      </div>
    </div>
  );
};

export default function SignatureRequestComposer({ chatId, onClose, onSent }) {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [signData, setSignData] = useState('');
  const [loading, setLoading] = useState(false);
  const canSend = !!uploaded?.url && !!signData;
  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const res = await filesAPI.upload(f, null);
      setUploaded({ url: res.fileUrl, name: res.fileName, type: res.fileType, size: res.fileSize });
    } catch {
      setUploaded(null);
    } finally {
      setLoading(false);
    }
  };
  const send = async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      const payload = { chatId, file: uploaded, managerSignatureDataUrl: signData };
      const res = await signaturesAPI.create(payload);
      onSent?.(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-0 sm:top-10 mx-auto w-full max-w-2xl bg-[#0b1020] border border-white/10 rounded-none sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">Отправить документ на подпись</div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">✕</button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-white/80 text-sm">Загрузите документ</div>
            <input type="file" onChange={onFileChange} className="block w-full text-white/80" />
            {uploaded?.url && (
              <div className="text-xs text-white/60 break-all">Файл: {uploaded.name} • {uploaded.type} • {Math.round((uploaded.size||0)/1024)} KB</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-white/80 text-sm">Подпись менеджера</div>
            <SignaturePad onChange={setSignData} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">Отмена</button>
            <button disabled={!canSend || loading} onClick={send} className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 disabled:opacity-60">Отправить клиенту</button>
          </div>
        </div>
      </div>
    </div>
  );
}
