import React, { useRef, useState, useMemo } from 'react';
import { filesAPI, signaturesAPI } from '../config/api';

export default function SignatureRequestComposer({ chatId, onClose, onSent, onSaveToScripts }) {
  const [uploaded, setUploaded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signBox, setSignBox] = useState(null); // {x,y,w,h} в нормализованных координатах 0..1
  const [savingDraft, setSavingDraft] = useState(false);
  const canSend = !!uploaded?.url; // разрешаем отправку даже без подписи менеджера
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
    setLoading(true);
    try {
      const res = await filesAPI.upload(f, null);
      setUploaded({ url: res.fileUrl, name: res.fileName, type: res.fileType, size: res.fileSize });
    } catch {
      void 0;
      setUploaded(null);
    } finally {
      setLoading(false);
    }
  };
  const send = async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      const payload = { chatId, file: uploaded, managerSignPos: signBox || null };
      const res = await signaturesAPI.create(payload);
      onSent?.(res);
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  };
  const saveToScripts = async () => {
    if (!uploaded?.url) return;
    try {
      const title = `Подпись: ${uploaded.name || 'документ'}`;
      const SIGNATURE_MARKER = '__SIGNREQ__:';
      const body = {
        file: uploaded,
        managerSignatureDataUrl: null,
        managerSignPos: signBox || null
      };
      const text = SIGNATURE_MARKER + JSON.stringify(body);
      onSaveToScripts?.({ title, text });
    } catch {
      void 0;
    }
  };
  const saveDraft = async () => {
    if (!uploaded?.url) return;
    setSavingDraft(true);
    try {
      await signaturesAPI.create({ chatId, file: uploaded, managerSignPos: signBox || null, saveOnly: true });
      onSent?.({ saved: true });
    } catch {
      void 0;
    } finally {
      setSavingDraft(false);
    }
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
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] text-white/60 mb-1">X (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={signBox ? Math.round(signBox.x * 100) : ''}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(0, Number(e.target.value || 0)));
                      setSignBox((sb) => sb ? { ...sb, x: v / 100 } : { x: v / 100, y: 0.5, w: 0.2, h: 0.1, page: 1 });
                    }}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-white/60 mb-1">Y (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={signBox ? Math.round(signBox.y * 100) : ''}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(0, Number(e.target.value || 0)));
                      setSignBox((sb) => sb ? { ...sb, y: v / 100 } : { x: 0.5, y: v / 100, w: 0.2, h: 0.1, page: 1 });
                    }}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-white/60 mb-1">Ширина (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    step={1}
                    value={signBox ? Math.round(signBox.w * 100) : ''}
                    onChange={(e) => {
                      const v = Math.min(80, Math.max(5, Number(e.target.value || 0)));
                      setSignBox((sb) => sb ? { ...sb, w: v / 100 } : { x: 0.5, y: 0.5, w: v / 100, h: 0.1, page: 1 });
                    }}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-white/60 mb-1">Высота (%)</label>
                  <input
                    type="number"
                    min={3}
                    max={40}
                    step={1}
                    value={signBox ? Math.round(signBox.h * 100) : ''}
                    onChange={(e) => {
                      const v = Math.min(40, Math.max(3, Number(e.target.value || 0)));
                      setSignBox((sb) => sb ? { ...sb, h: v / 100 } : { x: 0.5, y: 0.5, w: 0.2, h: v / 100, page: 1 });
                    }}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-white/60 mb-1">Страница</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={signBox ? Math.max(1, Number(signBox.page || 1)) : 1}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value || 1));
                      setSignBox((sb) => sb ? { ...sb, page: v } : { x: 0.5, y: 0.5, w: 0.2, h: 0.1, page: v });
                    }}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
                <div className="col-span-2 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => setSignBox(null)}
                    className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  >
                    Сбросить место
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button onClick={saveToScripts} disabled={!uploaded?.url} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-60">Сохранить в быстрые скрипты</button>
            <button disabled={!uploaded?.url || savingDraft} onClick={saveDraft} className="px-4 py-2 rounded-lg bg-purple-600/70 text-white hover:bg-purple-600 disabled:opacity-60">Сохранить как ожидает подписи</button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15">Отмена</button>
            <button disabled={!uploaded?.url || loading} onClick={send} className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 disabled:opacity-60">Отправить клиенту</button>
          </div>
        </div>
      </div>
    </div>
  );
}
