import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import OrderButton from './OrderButton';

const LOCKED_KEYS = ['S2', 'S7'];

const SERVICES_IMGS = {
  S1: '/gallery/Гибочные работы по металлам.jpg',
  S2: '/gallery/Жидкостная окраска.jpg',
  S3: '/gallery/Лазерная гравировка.jpg',
  S4: '/gallery/Лазерная резка металлов.jpg',
  S5: '/gallery/Лазерная резка неметаллических материалов.jpg',
  S6: '/gallery/Порошковая окраска.jpg',
  S7: '/gallery/Продажа материалов.jpg',
  S8: '/gallery/Сварка.jpg',
  S9: '/gallery/Токарные работы.jpg',
  S10: '/gallery/ЧПУ фрезеровка и раскрой листовых материалов.jpg',
};

const KEYS = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'];

const Services = ({ user, setIsAuthOpen, setIsOrderOpen, onRequireAuthForOrder }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const [selectedKey, setSelectedKey] = useState(null);
  const pushedRef = React.useRef(false);

  const isLocked = selectedKey ? LOCKED_KEYS.includes(selectedKey) : false;

  const handleRequireAuthForOrder = (opts) => {
    if (typeof onRequireAuthForOrder === 'function') {
      onRequireAuthForOrder(opts);
      return;
    }
    if (typeof setIsAuthOpen === 'function') setIsAuthOpen(true);
  };

  useEffect(() => {
    const fromState = location?.state?.serviceKey;
    if (!fromState) return;
    if (!KEYS.includes(fromState)) return;
    const raf = requestAnimationFrame(() => setSelectedKey(fromState));
    return () => cancelAnimationFrame(raf);
  }, [location?.state?.serviceKey]);

  useEffect(() => {
    const handleServiceOpen = (e) => {
      const key = e.detail?.key;
      if (key && KEYS.includes(key)) setSelectedKey(key);
    };
    window.addEventListener('service:open', handleServiceOpen);
    return () => window.removeEventListener('service:open', handleServiceOpen);
  }, []);

  useEffect(() => {
    if (!selectedKey) {
      pushedRef.current = false;
      return;
    }
    try {
      const st = window.history.state || {};
      if (st && st.__overlay !== 'service') {
        window.history.pushState({ ...st, __overlay: 'service', serviceKey: selectedKey }, '', window.location.href);
        pushedRef.current = true;
      }
    } catch { void 0; }
  }, [selectedKey]);

  useEffect(() => {
    const onPop = () => {
      if (selectedKey) setSelectedKey(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [selectedKey]);

  const requestCloseService = () => {
    try {
      if (pushedRef.current && window.history.state && window.history.state.__overlay === 'service') {
        pushedRef.current = false;
        window.history.back();
        return;
      }
    } catch { void 0; }
    setSelectedKey(null);
  };

  useEffect(() => {
    const onServicesClose = () => {
      setSelectedKey(null);
      if (typeof setIsOrderOpen === 'function') setIsOrderOpen(false);
      if (typeof setIsAuthOpen === 'function') setIsAuthOpen(false);
    };
    window.addEventListener('services:close', onServicesClose);
    return () => window.removeEventListener('services:close', onServicesClose);
  }, []);

  useEffect(() => {
    try {
      const tracker = window.__analyticsTracker;
      if (tracker) tracker.sectionOpen('services');
      return () => { try { window.__analyticsTracker?.sectionClose('services'); } catch { void 0; } };
    } catch { void 0; }
  }, []);

  useEffect(() => {
    try {
      if (selectedKey) window.__analyticsTracker?.serviceOpen(selectedKey);
      return () => { try { if (selectedKey) window.__analyticsTracker?.serviceClose(selectedKey); } catch { void 0; } };
    } catch { void 0; }
  }, [selectedKey]);

  return (
    <section id="services" className="relative pt-14 md:pt-16 pb-24 px-4 bg-[#050505]" data-section="services">
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-3 max-w-7xl mx-auto tablet-grid-services">
        {KEYS.map((key) => {
          const locked = LOCKED_KEYS.includes(key);

          return (
            <div
              key={key}
              aria-disabled={locked ? 'true' : 'false'}
              onClick={() => { if (!locked) setSelectedKey(key); }}
              className={`group relative overflow-hidden rounded-[2rem] bg-[#0a0a0a] border border-white/10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] ${locked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="h-[320px] lg:h-[260px] relative">
                <img
                  src={SERVICES_IMGS[key]}
                  alt={t(`${key}_T`)}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105${locked ? ' filter blur-md' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center px-6">
                    <div className="px-4 py-2 rounded-xl bg-black/60 text-white text-sm md:text-base font-semibold text-center">
                      {t('service_soon')}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-4">
                  <h3 className="text-white font-light text-sm lg:text-[11px] tracking-[0.2em] uppercase leading-tight group-hover:text-cyan-400 transition-colors">
                    {t(`${key}_T`)}
                  </h3>
                  <div className="w-8 group-hover:w-full h-[1px] bg-cyan-500 mt-4 lg:mt-3 transition-all duration-500 opacity-60"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedKey && (
        <div
          className="fixed inset-0 z-[90] flex justify-center items-start animate-fadeIn overflow-hidden"
          style={{
            paddingTop: 'calc(5rem + 1rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button type="button" className="fixed inset-0 z-0 bg-[#050505]/95 backdrop-blur-3xl" onClick={requestCloseService} aria-label={t('Закрыть')} />

          <div
            className="relative z-10 w-full max-w-6xl xl:max-w-[92rem] 2xl:max-w-[104rem] px-4"
            style={{
              height: 'calc(100svh - 5rem - 1rem - 5.75rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
              maxHeight: 'calc(100svh - 5rem - 1rem - 5.75rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="bg-white/[0.03] rounded-[2rem] border border-white/5 shadow-inner overflow-hidden flex flex-col h-full">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 md:p-10">
                <div className="md:flow-root">
                  <div className="relative w-full h-[180px] sm:h-[220px] md:w-[320px] md:h-[220px] lg:w-[420px] lg:h-[280px] rounded-[2rem] overflow-hidden border border-white/10 md:float-left md:mr-8 lg:mr-10 md:mb-6">
                    <img
                      src={SERVICES_IMGS[selectedKey]}
                      alt={t(`${selectedKey}_T`)}
                      className={`w-full h-full object-cover${isLocked ? ' filter blur-md' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-4 py-2 rounded-xl bg-black/60 text-white text-sm md:text-lg font-semibold">
                          {t('service_soon')}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-white/80 text-sm md:text-lg font-light leading-relaxed whitespace-pre-line text-left">
                    {t(`${selectedKey}_D`)}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 px-4 py-3 md:px-8 md:py-4 flex items-center justify-start md:justify-end gap-2 bg-[#0a0a0a]/40 backdrop-blur-lg">
                <button
                  type="button"
                  onClick={requestCloseService}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/80 hover:bg-white/15 transition-colors text-xs font-bold uppercase tracking-[0.08em]"
                >
                  {t('Закрыть')}
                </button>
                <OrderButton
                  user={user}
                  setIsOrderOpen={setIsOrderOpen}
                  setIsAuthOpen={setIsAuthOpen}
                  onRequireAuth={handleRequireAuthForOrder}
                  variant="cta"
                  labelKey="Оформить заказ"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.08em] shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all duration-300"
                  locked={isLocked}
                  serviceKey={selectedKey}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
