import React, { useRef, useState, useEffect, useMemo } from 'react';
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

export default function SignatureRequestComposer({ chatId, onClose, onSent, onSaveToScripts }) {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [signData, setSignData] = useState('');
  const [loading, setLoading] = useState(false);
  const [signBox, setSignBox] = useState(null); // {x,y,w,h} в нормализованных координатах 0..1
  const canSend = !!uploaded?.url && !!signData;
  const previewUrl = useMemo(() => (uploaded?.url ? filesAPI.getFileUrl(uploaded.url) : ''), [uploaded]);
  const isPdf = useMemo(() => {
    const t = String(uploaded?.type || '');
    return t.includes('pdf') || String(previewUrl).toLowerCase().endsWith('.pdf');
  }, [uploaded, previewUrl]);
  const isImage = useMemo(() => String(uploaded?.type || '').startsWith('image/'), [uploaded]);
  const previewRef = useRef(null);
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
      const payload = { chatId, file: uploaded, managerSignatureDataUrl: signData, managerSignPos: signBox || null };
      const res = await signaturesAPI.create(payload);
      onSent?.(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const saveAsQuickScript = () => {
    if (!canSend) return;
    const payload = { file: uploaded, managerSignatureDataUrl: signData, managerSignPos: signBox || null };
    const text = `__SIGNREQ__:${JSON.stringify(payload)}`;
    const title = uploaded?.name ? `Подписать: ${uploaded.name}` : 'Подписать документ';
    onSaveToScripts?.({ title, text });
  };
  const placeBox = (e) => {
    if (!previewRef.current) return;
    const r = previewRef.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const nx = Math.max(0, Math.min(1, px / r.width));
    const ny = Math.max(0, Math.min(1, py / r.height));
    const nw = Math.min(0.35, 140 / r.width); // ориентировочно 140px
    const nh = Math.min(0.2, 40 / r.height);  // ориентировочно 40px
    setSignBox({ x: nx, y: ny, w: nw, h: nh, page: 1 });
  };
  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-0 sm:top-6 mx-auto w-full max-w-2xl bg-[#0b1020] border border-white/10 rounded-none sm:rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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
          {uploaded?.url && (
            <div className="space-y-2">
              <div className="text-white/80 text-sm">Предпросмотр</div>
              <div className="relative bg-white/5 border border-white/10 rounded-lg p-2">
                <div
                  ref={previewRef}
                  onClick={placeBox}
                  className="relative w-full h-[55vh] bg-white rounded overflow-hidden"
                  style={{ touchAction: 'manipulation' }}
                >
                  {isPdf ? (
                    <iframe title="doc" src={previewUrl} className="absolute inset-0 w-full h-full bg-white" />
                  ) : isImage ? (
                    <img alt="doc" src={previewUrl} className="absolute inset-0 w-full h-full object-contain bg-white" />
                  ) : (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center text-blue-300 underline">Открыть документ</a>
                  )}
                  {signBox && (
                    <div
                      className="absolute border-2 border-purple-600 bg-purple-500/20 rounded"
                      style={{
                        left: `${(signBox.x - signBox.w / 2) * 100}%`,
                        top: `${(signBox.y - signBox.h / 2) * 100}%`,
                        width: `${signBox.w * 100}%`,
                        height: `${signBox.h * 100}%`
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">
                        Место подписи
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-white/60 mt-1">Нажмите по предпросмотру, чтобы указать место подписи</div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-white/80 text-sm">Подпись менеджера</div>
            <SignaturePad onChange={setSignData} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button disabled={!canSend || loading} onClick={saveAsQuickScript} className="px-4 py-2 rounded-lg bg-purple-600/70 text-white hover:bg-purple-600 disabled:opacity-60">Сохранить в быстрые скрипты</button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">Отмена</button>
            <button disabled={!canSend || loading} onClick={send} className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 disabled:opacity-60">Отправить клиенту</button>
          </div>
        </div>
      </div>
    </div>
  );
}
