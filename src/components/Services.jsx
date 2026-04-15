import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

const Services = ({ user, setIsAuthOpen, onLogout, setIsOrderOpen, onRequireAuthForOrder }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [selectedKey, setSelectedKey] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showOrderAuthPrompt, setShowOrderAuthPrompt] = useState(false);

  const isLocked = selectedKey ? LOCKED_KEYS.includes(selectedKey) : false;

  const contactLinks = [
    { name: 'Telegram', url: 'https://t.me/ConnectorGe', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg> },
    { name: 'WhatsApp', url: 'https://wa.me/+995591160685', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /></svg> },
    { name: 'Gmail', url: 'mailto:useconnector@gmail.com', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg> },
  ];

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleRequireAuthForOrder = () => {
    if (typeof onRequireAuthForOrder === 'function') {
      onRequireAuthForOrder();
    } else {
      setShowOrderAuthPrompt(true);
    }
  };

  useEffect(() => {
    const handleServiceOpen = (e) => {
      if (e.detail?.key) setSelectedKey(e.detail.key);
    };
    window.addEventListener('service:open', handleServiceOpen);
    return () => window.removeEventListener('service:open', handleServiceOpen);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('service=')) {
        const titleFromUrl = decodeURIComponent(hash.split('service=')[1]).trim().toLowerCase();
        const found = KEYS.find(k => t(`${k}_T`).trim().toLowerCase() === titleFromUrl);
        if (found) {
          setSelectedKey(found);
          window.history.replaceState(null, null, '#services');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [i18n.language]);

  useEffect(() => {
    const onServicesClose = () => {
      setSelectedKey(null);
      setIsOpen(false);
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
      return () => { try { window.__analyticsTracker?.sectionClose('services'); } catch {} };
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (selectedKey) window.__analyticsTracker?.serviceOpen(selectedKey);
      return () => { try { if (selectedKey) window.__analyticsTracker?.serviceClose(selectedKey); } catch {} };
    } catch {}
  }, [selectedKey]);

  const handleGoHome = () => {
    setSelectedKey(null);
    setIsOpen(false);
    if (typeof setIsOrderOpen === 'function') setIsOrderOpen(false);
    if (typeof setIsAuthOpen === 'function') setIsAuthOpen(false);
    window.dispatchEvent(new Event('useterms:close'));
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="services" className="relative py-24 px-4 bg-[#050505]" data-section="services">
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {KEYS.map((key) => (
          <div
            key={key}
            onClick={() => setSelectedKey(key)}
            className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#0a0a0a] border border-white/10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <div className="h-[340px] relative">
              <img src={SERVICES_IMGS[key]} alt={t(`${key}_T`)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white font-light text-sm tracking-[0.2em] uppercase leading-tight group-hover:text-cyan-400 transition-colors">
                  {t(`${key}_T`)}
                </h3>
                <div className="w-8 group-hover:w-full h-[1px] bg-cyan-500 mt-4 transition-all duration-500 opacity-60"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedKey && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black flex justify-center items-start animate-fadeIn scrollbar-hide">
          <div className="fixed inset-0 z-0 bg-[#050505]/95 backdrop-blur-3xl" />

          <nav className="bg-[#0a0a0a] fixed top-0 left-0 right-0 z-[500] text-white text-sm border-b border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] tablet-nav">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center z-10">
                  <button onClick={handleGoHome} className="flex items-center gap-2 group">
                    <img src="/img/logo.png" alt="logo" className="w-[50px] h-[50px] object-contain" />
                    <span className="text-s font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">CONNECTOR</span>
                  </button>
                </div>

                <div className="hidden md:flex items-center space-x-12">
                  <button onClick={handleGoHome} className="relative font-medium tracking-widest hover:text-blue-400 transition-all group uppercase">
                    {t('ГЛАВНАЯ')}<span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full"></span>
                  </button>

                  <div className="relative group/dropdown">
                    <button className="relative font-medium tracking-widest hover:text-blue-400 transition-all flex items-center gap-1 cursor-default uppercase">
                      {t('УСЛУГИ')}
                      <svg className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover/dropdown:w-full"></span>
                    </button>
                    <div className="absolute left-0 mt-2 w-72 bg-[#0a0a0a] border border-blue-500/20 rounded-xl py-4 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 z-[120] shadow-2xl backdrop-blur-xl">
                      {KEYS.map((k) => (
                        <button key={k} onClick={() => setSelectedKey(k)} className="block w-full text-left px-6 py-2 text-[10px] uppercase tracking-widest text-white/70 hover:text-blue-400 hover:bg-white/5 transition-colors">{t(`${k}_T`)}</button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group/dropdown">
                    <button className="relative font-medium tracking-widest hover:text-blue-400 transition-all flex items-center gap-1 cursor-default uppercase">
                      {t('КОНТАКТЫ')}
                      <svg className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover/dropdown:w-full"></span>
                    </button>
                    <div className="absolute left-0 mt-4 w-52 bg-[#0d0d0d] border border-blue-500/20 rounded-2xl p-4 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 z-[120] shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                      <div className="text-[9px] uppercase tracking-widest text-blue-400/60 mb-3 text-center">{t('КОНТАКТЫ')}</div>
                      <div className="grid grid-cols-3 gap-3">
                        {contactLinks.map((contact) => (
                          <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" title={contact.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-blue-500/10 text-white/60 hover:text-blue-400 transition-all">
                            {contact.icon}
                            <span className="text-[8px] uppercase tracking-wide">{contact.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <OrderButton
                    user={user}
                    setIsOrderOpen={setIsOrderOpen}
                    setIsAuthOpen={setIsAuthOpen}
                    onRequireAuth={handleRequireAuthForOrder}
                    className="hidden md:block translate-y-[2px] bg-blue-500 text-white px-6 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95 transition-all duration-300"
                    locked={isLocked}
                  />
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                  <button type="button" onClick={() => window.dispatchEvent(new Event('useterms:open'))} className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-blue-500/30 text-white text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-700/20 shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:from-blue-500/30 active:scale-95 transition-all">
                    {t('HOW_IT_WORKS_BTN')}
                  </button>
                  <div className="hidden md:block">
                    <select onChange={changeLanguage} value={i18n.language} className="bg-transparent border border-blue-500/30 rounded-lg px-2 py-2 outline-none text-xs cursor-pointer">
                      <option value="ru" className="bg-[#0a0a0a]">RU</option>
                      <option value="en" className="bg-[#0a0a0a]">ENG</option>
                      <option value="ka" className="bg-[#0a0a0a]">GEO</option>
                    </select>
                  </div>
                  {user ? (
                    <>
                      {user.role !== 'admin' && (
                        <button onClick={() => navigate('/dashboard')} className="hidden md:flex items-center gap-2 px-4 py-1 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </button>
                      )}
                      <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-1 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsAuthOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                  )}
                  <button onClick={() => setIsOpen(p => !p)} className="md:hidden text-white p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
                  </button>
                </div>
              </div>
            </div>

            {isOpen && <div className="md:hidden fixed top-20 left-0 right-0 bottom-16 bg-black/70 z-[510]" onClick={() => setIsOpen(false)} />}
            <div className={`md:hidden fixed left-0 right-0 top-20 bottom-16 bg-[#0a0a0a] border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out z-[520] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="px-4 pt-2 pb-6 h-full flex flex-col overflow-y-auto gap-4">
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 border-b border-white/5 mb-1 text-center">{t('УСЛУГИ')}</div>
                  <div className="bg-white/5 rounded-xl">
                    {KEYS.map((k) => (
                      <button key={k} onClick={() => { setSelectedKey(k); setIsOpen(false); }} className="block w-full px-6 py-3 text-[11px] uppercase tracking-widest text-white/80 hover:text-blue-400 text-center transition-colors">
                        {t(`${k}_T`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 border-b border-white/5 mb-1 text-center">{t('КОНТАКТЫ')}</div>
                  <div className="flex items-center justify-center gap-6 py-3">
                    {contactLinks.map((contact) => (
                      <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" title={contact.name} className="text-white/70 hover:text-blue-400 transition-colors">{contact.icon}</a>
                    ))}
                  </div>
                </div>
                <div className="mt-auto">
                  <button type="button" onClick={() => window.dispatchEvent(new Event('useterms:open'))} className="w-full px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-blue-500/40 text-white bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-700/20 active:scale-95 transition-all">
                    {t('HOW_IT_WORKS_BTN')}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="relative z-10 w-full max-w-5xl mt-32 px-4 pb-32 text-center">
            <div className="flex flex-col gap-8">
              <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10">
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
              <div className="bg-white/[0.03] p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-inner mb-12 flex flex-col items-start gap-8">
                <div className="text-white/80 text-sm md:text-lg font-light leading-relaxed whitespace-pre-line text-left">
                  {t(`${selectedKey}_D`)}
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[120] bg-[#0a0a0a]/40 backdrop-blur-lg border-t border-blue-500/20 px-2 py-3">
            <div className="grid grid-cols-5 items-center justify-items-center">
              <button onClick={handleGoHome} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" />
                </svg>
              </button>
              {user && user.role !== 'admin' ? (
                <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1 text-blue-400/30 translate-y-1.5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <OrderButton user={user} setIsOrderOpen={setIsOrderOpen} setIsAuthOpen={setIsAuthOpen} onRequireAuth={handleRequireAuthForOrder} className="text-blue-400" locked={isLocked} />
              <div className="flex flex-col items-center gap-1 relative text-blue-400 translate-y-1.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <select onChange={changeLanguage} value={i18n.language} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
                  <option value="ru">RU</option><option value="en">EN</option><option value="ka">KA</option>
                </select>
              </div>
              {user ? (
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400 translate-y-1.5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 5 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrderAuthPrompt && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowOrderAuthPrompt(false)} />
          <div className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="text-white text-sm font-bold uppercase tracking-widest">{t('Уведомление')}</div>
            <div className="mt-3 text-white/70 text-sm leading-relaxed">{t('Чтобы заказать услугу, сначала войдите')}</div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowOrderAuthPrompt(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-colors">{t('Отмена')}</button>
              <button type="button" onClick={() => { setShowOrderAuthPrompt(false); if (typeof setIsAuthOpen === 'function') setIsAuthOpen(true); }} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">{t('Войти')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
