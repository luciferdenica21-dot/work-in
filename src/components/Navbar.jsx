import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import OrderButton from './OrderButton';
import OrderSidebar from './OrderSidebar';

const Navbar = ({ setIsOrderOpen, setIsAuthOpen, user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showOrderAuthPrompt, setShowOrderAuthPrompt] = useState(false);

  const servicesList = [
    "S1_T", "S2_T", "S3_T", "S4_T", "S5_T", "S6_T", "S7_T", "S8_T", "S9_T", "S10_T"
  ];

  const contactLinks = [
    { name: 'Telegram', url: 'https://t.me/ConnectorGe', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg> },
    { name: 'WhatsApp', url: 'https://wa.me/+995591160685', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /></svg> },
    { name: 'Gmail', url: 'mailto:useconnector@gmail.com', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg> }
  ];

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768 && isOpen) {
        // no-op
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const handleMobileClick = (e, targetId) => {
    setIsOpen(false);
    setIsServicesOpen(false);
    setIsContactOpen(false);
    if (targetId.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(targetId === '#' ? 'body' : targetId);
      if (element) {
        const offset = 80;
        window.scrollTo({
          top: targetId === '#' ? 0 : element.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset,
          behavior: 'smooth'
        });
      }
    }
  };

  const navigate = useNavigate();
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  const handleRequireAuthForOrder = () => {
    setShowOrderAuthPrompt(true);
  };

  return (
    <>
      <nav className="bg-[#0a0a0a]/90 backdrop-blur-md fixed top-0 left-0 right-0 w-full md:sticky z-[120] text-white text-sm border-b border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center z-10">
              <a href="#" className="flex items-center gap-2 group">
                <img src="/img/logo.png" alt="logo" className="w-[50px] h-[50px] object-contain" />
                <span className="text-s font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">CONNECTOR</span>
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-12">
              <a href="#" className="relative font-medium tracking-widest hover:text-blue-400 transition-all group uppercase">{t('ГЛАВНАЯ')}<span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full"></span></a>
              
              <div className="relative group/dropdown">
                <button className="relative font-medium tracking-widest hover:text-blue-400 transition-all flex items-center gap-1 cursor-default uppercase">
                  {t('УСЛУГИ')}
                  <svg className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover/dropdown:w-full"></span>
                </button>
                <div className="absolute left-0 mt-2 w-72 bg-[#0a0a0a] border border-blue-500/20 rounded-xl py-4 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 z-[60] shadow-2xl backdrop-blur-xl">
                  {servicesList.map((sKey) => (
                    <a 
                        key={sKey} 
                        href={`#services?service=${t(sKey)}`} 
                        className="block px-6 py-2 text-[10px] uppercase tracking-widest text-white/70 hover:text-blue-400 hover:bg-white/5 transition-colors"
                        onClick={() => { window.location.hash = `services?service=${t(sKey)}`; }}
                    >
                        {t(sKey)}
                    </a>
                  ))}
                </div>
              </div>

              <div className="relative group/dropdown">
                <button className="relative font-medium tracking-widest hover:text-blue-400 transition-all flex items-center gap-1 cursor-default uppercase">
                  {t('КОНТАКТЫ')}
                  <svg className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover/dropdown:w-full"></span>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-[#0a0a0a] border border-blue-500/20 rounded-xl py-4 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 z-[60] shadow-2xl backdrop-blur-xl">
                  {contactLinks.map((contact) => (
                    <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-2 text-[10px] uppercase tracking-widest text-white/70 hover:text-blue-400">{contact.icon}{contact.name}</a>
                  ))}
                </div>
              </div>

              <OrderButton 
                user={user} 
                setIsOrderOpen={setIsOrderOpen} 
                setIsAuthOpen={setIsAuthOpen}
                onRequireAuth={handleRequireAuthForOrder}
                className="hidden md:block translate-y-[2px] bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95 transition-all duration-300"
              />
              
              
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('useterms:open'))}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:from-sky-600 hover:to-blue-700 active:scale-95 transition-all"
                title={t('HOW_IT_WORKS_BTN')}
              >
                {t('HOW_IT_WORKS_BTN')}
              </button>
              
              <div className="hidden md:block">
                <select onChange={changeLanguage} value={i18n.language} className="bg-transparent border border-blue-500/30 rounded-lg px-2 py-1 outline-none text-xs cursor-pointer">
                  <option value="ru" className="bg-[#0a0a0a]">RU</option>
                  <option value="en" className="bg-[#0a0a0a]">ENG</option>
                  <option value="ka" className="bg-[#0a0a0a]">GEO</option>
                </select>
              </div>

              {user ? (
                <>
                  {user.role !== 'admin' && (
                    <button onClick={() => navigate('/dashboard')} className="hidden md:flex items-center gap-2 px-4 py-2 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all group">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                  )}
                  <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all group">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:border-blue-500/50 transition-all group">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => {
                  const next = !isOpen;
                  setIsOpen(next);
                  if (next) {
                    setIsServicesOpen(true);
                    setIsContactOpen(true);
                  }
                }}
                className="md:hidden text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div
            className="md:hidden fixed top-20 left-0 right-0 bottom-0 bg-[#000]/70 backdrop-blur-xl z-[110]"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div className={`md:hidden fixed left-0 right-0 top-20 bottom-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out z-[120] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="px-4 pt-2 pb-6 h-full flex flex-col overflow-y-auto">
            <div className="space-y-2 text-center overflow-y-auto">
              <button onClick={() => setIsServicesOpen(!isServicesOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-4 text-sm font-bold uppercase tracking-widest text-white/80 border-b border-white/5">
                {t('УСЛУГИ')}
                <svg className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`bg-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isServicesOpen ? 'max-h-[500px] my-2' : 'max-h-0'}`}>
                {servicesList.map((sKey) => (
                  <a 
                    key={sKey} 
                    href={`#services?service=${t(sKey)}`} 
                      className="group block px-6 py-3 text-[11px] uppercase tracking-widest text-white/80 hover:text-blue-400 text-center transition-transform duration-200 transform hover:scale-[1.03] relative"
                    onClick={(e) => { 
                      handleMobileClick(e, '#services');
                      window.location.hash = `services?service=${t(sKey)}`;
                    }}
                  >
                    {t(sKey)}
                    <span className="pointer-events-none absolute left-6 right-6 bottom-1 h-[2px] bg-blue-500 w-0 transition-all duration-200 group-hover:w-[calc(100%-3rem)]" />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-center overflow-y-auto">
              <button onClick={() => setIsContactOpen(!isContactOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-4 text-sm font-bold uppercase tracking-widest text-white/80 border-b border-white/5">
                {t('КОНТАКТЫ')}
                <svg className={`w-4 h-4 transition-transform ${isContactOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`bg-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isContactOpen ? 'max-h-[500px] my-2' : 'max-h-0'}`}>
                {contactLinks.map((contact) => (
                  <a
                    key={contact.name}
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 px-6 py-3 text-[11px] uppercase tracking-widest text-white/80 hover:text-blue-400 transition-transform duration-200 transform hover:scale-[1.03] relative"
                  >
                    {contact.icon}{contact.name}
                    <span className="pointer-events-none absolute left-6 right-6 bottom-1 h-[2px] bg-blue-500 w-0 transition-all duration-200 group-hover:w-[calc(100%-3rem)]" />
                  </a>
                ))}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('useterms:open'))}
                  className="w-full px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95 transition-all"
                >
                  {t('HOW_IT_WORKS_BTN')}
                </button>
              </div>
            </div>
          </div>
        </div>

      </nav>

      {showOrderAuthPrompt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowOrderAuthPrompt(false)}
          />
          <div className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="text-white text-sm font-bold uppercase tracking-widest">
              {t('Уведомление')}
            </div>
            <div className="mt-3 text-white/70 text-sm leading-relaxed">
              {t('Чтобы заказать услугу, сначала войдите')}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOrderAuthPrompt(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-colors"
              >
                {t('Отмена')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOrderAuthPrompt(false);
                  if (typeof setIsAuthOpen === 'function') setIsAuthOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {t('Войти')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/40 backdrop-blur-lg border-t border-blue-500/20 px-2 py-3">
        <div className="grid grid-cols-5 items-center justify-items-center">
          
          {/* ГЛАВНАЯ */}
          <a href="#" onClick={(e) => handleMobileClick(e, '#')} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </a>

          {/* КАБИНЕТ */}
          {user && user.role !== 'admin' ? (
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1 text-blue-400/30 translate-y-1.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}

          {/* ЗАКАЗАТЬ */}
          <OrderButton 
            user={user} 
            setIsOrderOpen={setIsOrderOpen} 
            setIsAuthOpen={setIsAuthOpen}
            onRequireAuth={handleRequireAuthForOrder}
            className="text-blue-400"
          />

          {/* СМЕНА ЯЗЫКА */}
          <div className="flex flex-col items-center gap-1 relative text-blue-400 translate-y-1.5">
            <Languages className="w-6 h-6" />
            <select onChange={changeLanguage} value={i18n.language} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="ka">GE</option>
            </select>
          </div>

          {/* ВОЙТИ / ВЫЙТИ */}
          {user ? (
            <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400 translate-y-1.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="flex flex-col items-center gap-1 text-blue-400 translate-y-1.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 5 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;
