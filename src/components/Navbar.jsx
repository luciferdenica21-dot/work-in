import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OrderButton from './OrderButton';
import OrderSidebar from './OrderSidebar';

const Navbar = ({ setIsOrderOpen, setIsAuthOpen, user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const servicesList = [
    "S1_T", "S2_T", "S3_T", "S4_T", "S5_T", "S6_T", "S7_T", "S8_T", "S9_T", "S10_T"
  ];

  const contactLinks = [
    { name: 'Telegram', url: 'https://t.me/@MichaelPiliaev', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg> },
    { name: 'WhatsApp', url: 'https://wa.me/+995593450833', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /></svg> },
    { name: 'Instagram', url: 'https://instagram.com/connector', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3" /><line x1="16.5" y1="7.5" x2="16.5" y2="7.501" /></svg> },
    { name: 'Gmail', url: 'mailto:luciferdenica21@gmail.com', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg> }
  ];

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768 && isOpen) {
        setIsScrolling(window.scrollY > 10);
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

  return (
    <>
      <nav className="bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50 text-white text-sm border-b border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
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
                    <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-2 text-[10px] uppercase tracking-widest text-white/70 hover:text-blue-400 hover:bg-white/5 transition-colors">{contact.icon}{contact.name}</a>
                  ))}
                </div>
              </div>

              <OrderButton 
                user={user} 
                setIsOrderOpen={setIsOrderOpen} 
                className="hidden md:block translate-y-[2px] bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-95 transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
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
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </button>
                  )}
                  <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all group">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:border-blue-500/50 transition-all group">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              )}

              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden absolute w-full bg-[#0a0a0ae0] border-b border-blue-500/20 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
          <div className="px-4 pt-2 pb-6 space-y-1">
            <div>
              <button onClick={() => setIsServicesOpen(!isServicesOpen)} className="w-full flex items-center justify-between px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-white/70 border-b border-white/5">
                {t('УСЛУГИ')}
                <svg className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`bg-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isServicesOpen ? 'max-h-[500px] my-2' : 'max-h-0'}`}>
                {servicesList.map((sKey) => (
                  <a 
                    key={sKey} 
                    href={`#services?service=${t(sKey)}`} 
                    className="block px-6 py-3 text-[9px] uppercase tracking-widest text-white/50 hover:text-blue-400"
                    onClick={(e) => { 
                      handleMobileClick(e, '#services');
                      window.location.hash = `services?service=${t(sKey)}`;
                    }}
                  >
                    {t(sKey)}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <button onClick={() => setIsContactOpen(!isContactOpen)} className="w-full flex items-center justify-between px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-white/70 border-b border-white/5">
                {t('КОНТАКТЫ')}
                <svg className={`w-4 h-4 transition-transform ${isContactOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`bg-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isContactOpen ? 'max-h-[500px] my-2' : 'max-h-0'}`}>
                {contactLinks.map((contact) => (
                  <a key={contact.name} href={contact.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 text-[9px] uppercase tracking-widest text-white/50 hover:text-blue-400">{contact.icon}{contact.name}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

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
            className="text-blue-400"
          />

          {/* СМЕНА ЯЗЫКА */}
          <div className="flex flex-col items-center gap-1 relative text-blue-400 translate-y-1.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
{ /* ... */ }
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <select onChange={changeLanguage} value={i18n.language} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="ka">KA</option>
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