import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import OrderButton from './OrderButton';
import { useLocation, useNavigate } from 'react-router-dom';

const Hero = ({ user, setIsOrderOpen, setIsAuthOpen, onRequireAuthForOrder }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const iconClassName = "w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24";

  const services = [
    {
      key: 'S1',
      icon: <img src="/servicesicons/bending.svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S3',
      icon: <img src="/servicesicons/laser%20(2).svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S4',
      icon: <img src="/servicesicons/laser%20(1).svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S5',
      icon: <img src="/servicesicons/laser.svg" alt="" className={`${iconClassName} brightness-0 invert`} draggable="false" />,
    },
    {
      key: 'S6',
      icon: <img src="/servicesicons/spray-gun.svg" alt="" className={`${iconClassName} brightness-0 invert`} draggable="false" />,
    },
    {
      key: 'S8',
      icon: <img src="/servicesicons/welding.svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S9',
      colSpanClassName: 'lg:col-span-2',
      icon: <img src="/servicesicons/lathe-machine%20(1).svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S10',
      colSpanClassName: 'lg:col-span-2',
      icon: <img src="/servicesicons/milling-machine%20(2).svg" alt="" className={iconClassName} draggable="false" />,
    },
    {
      key: 'S11',
      disabled: true,
      colSpanClassName: 'col-span-2 md:col-span-1 lg:col-span-2',
      icon: <img src="/servicesicons/design-thinking.svg" alt="" className={iconClassName} draggable="false" />,
    },
  ];

  const [scrollY, setScrollY] = useState(0);
  const [heroLayout, setHeroLayout] = useState('default');
  const sectionRef = useRef(null);

  useEffect(() => {
    try {
      const tracker = window.__analyticsTracker;
      if (tracker) tracker.sectionOpen('hero');
      return () => {
        const t = window.__analyticsTracker;
        if (t) t.sectionClose('hero');
      };
    } catch { void 0; }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (location?.pathname !== '/') return;
    if (heroLayout !== 'mobilePortrait') return;

    const prevHtmlOverflowY = document.documentElement.style.overflowY;
    const prevBodyOverflowY = document.body.style.overflowY;

    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';

    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflowY;
      document.body.style.overflowY = prevBodyOverflowY;
    };
  }, [heroLayout, location?.pathname]);

  useEffect(() => {
    const updateLayout = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;

      const isShortLandscape = isLandscape && width <= 900 && height <= 520;
      const isMobilePortrait = !isLandscape && width < 768;

      setHeroLayout(isShortLandscape ? 'shortLandscape' : isMobilePortrait ? 'mobilePortrait' : 'default');
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);

  const handleServiceClick = (key) => {
    if (location?.pathname === '/services') {
      window.dispatchEvent(new CustomEvent('service:open', { detail: { key } }));
      return;
    }
    navigate('/services', { state: { serviceKey: key } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUa = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTelegram = /Telegram/i.test(ua);
  const heroOffsetStyle = isMobileUa && isTelegram ? { marginTop: 'calc(5rem + 16px)' } : undefined;
  const heroHeaderStyle =
    heroLayout === 'shortLandscape'
      ? {
          ...heroOffsetStyle,
          alignItems: 'center',
          paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))',
        }
      : heroLayout === 'mobilePortrait'
        ? {
            ...heroOffsetStyle,
            alignItems: 'flex-start',
            paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(9.25rem + env(safe-area-inset-bottom, 0px))',
          }
        : heroOffsetStyle;

  const heroContentStyle =
    heroLayout === 'shortLandscape'
      ? {
          position: 'relative',
          top: '10vh',
          width: '100%',
          transform: 'none',
        }
      : heroLayout === 'mobilePortrait'
        ? {
            position: 'relative',
            top: '4vh',
            width: '100%',
            transform: 'none',
        }
      : undefined;

  const heroTitleStyle =
    heroLayout === 'shortLandscape'
      ? { marginTop: '1.25rem' }
      : heroLayout === 'mobilePortrait'
        ? { fontSize: '1.1rem', marginBottom: '0.75rem' }
        : undefined;

  const heroGridStyle =
    heroLayout === 'shortLandscape'
      ? {
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          columnGap: '0.35rem',
          rowGap: '0.25rem',
          marginBottom: '0.75rem',
          paddingLeft: 0,
          paddingRight: 0,
        }
      : heroLayout === 'mobilePortrait'
        ? {
            columnGap: '0.5rem',
            rowGap: '0.4rem',
            marginBottom: '0.55rem',
          }
        : undefined;

  const heroCardStyle =
    heroLayout === 'shortLandscape'
      ? { padding: '0.2rem' }
      : heroLayout === 'mobilePortrait'
        ? { padding: '0.3rem' }
        : undefined;

  const heroIconWrapStyle =
    heroLayout === 'shortLandscape'
      ? { marginBottom: '0.1rem', transform: 'scale(0.78)', transformOrigin: 'center' }
      : heroLayout === 'mobilePortrait'
        ? { transform: 'scale(0.78)', transformOrigin: 'center' }
        : undefined;

  const heroWhatsappStyle =
    heroLayout === 'shortLandscape'
      ? { padding: '0.5rem 0.9rem', fontSize: '0.62rem', whiteSpace: 'nowrap', lineHeight: '1' }
      : heroLayout === 'mobilePortrait'
        ? { padding: '0.6rem 1rem', fontSize: '0.72rem', whiteSpace: 'nowrap', lineHeight: '1' }
        : undefined;

  const heroWhatsappWrapStyle =
    undefined;

  const heroCtaTrackingClassName =
    heroLayout === 'default' ? 'tracking-widest' : 'tracking-[0.08em]';

  return (
    <header 
      ref={sectionRef} 
      className="relative text-center text-white bg-[#050505] overflow-hidden min-h-[100svh] md:min-h-[100vh] flex items-center md:items-start justify-center pt-20 md:pt-14 lg:pt-16 pb-20 md:pb-10"
      data-section="hero"
      data-hero-layout={heroLayout}
      style={heroHeaderStyle}
    >
      
      <div 
        className="absolute inset-0 z-0 transition-transform duration-300 ease-out"
        style={{ 
          backgroundImage: "url('/img/blurbg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          filter: 'brightness(0.3) blur(4px)'
        }}
      ></div>

      <div className="absolute inset-0 z-[1] bg-radial-gradient from-transparent via-[#050505]/60 to-[#050505]"></div>

      <div
        className="hero-content relative z-10 container mx-auto px-4 flex flex-col items-center md:-mt-4 lg:-mt-6 xl:-mt-8"
        style={heroContentStyle}
      >
        
        <h1
          className="text-xl md:text-2xl lg:text-3xl font-black mb-4 md:mb-6 lg:mb-4 tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 px-4 leading-tight"
          style={heroTitleStyle}
        >
          {t("HERE_YOU_CAN_ORDER")}
        </h1>

        <div
          className="hero-services-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-6 md:gap-4 lg:gap-5 max-w-[1100px] lg:max-w-[1280px] mx-auto mb-6 md:mb-8 lg:mb-6 px-2 md:px-6"
          style={heroGridStyle}
        >
          {services.map((service) => {
            const colSpanClassName = service.colSpanClassName || '';

            if (service.disabled) {
              return (
                <div
                  key={service.key}
                  aria-disabled="true"
                  className={`${colSpanClassName} hero-service-card relative flex flex-col items-center justify-center p-2 md:p-4 lg:p-4 rounded-[0.75rem] md:rounded-[1.25rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl cursor-default`}
                  style={heroCardStyle}
                >
                  <div className="mb-1 md:mb-2 text-blue-400" style={heroIconWrapStyle}>
                    {service.icon}
                  </div>
                  <span className="text-[7px] md:text-[9px] lg:text-[10px] font-semibold tracking-[0.02em] md:tracking-[0.05em] uppercase text-gray-400 text-center leading-tight">
                    {t(`${service.key}_T`)}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={service.key}
                onClick={() => handleServiceClick(service.key)}
                className={`${colSpanClassName} hero-service-card group relative flex flex-col items-center justify-center p-2 md:p-4 lg:p-4 rounded-[0.75rem] md:rounded-[1.25rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.08] hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]`}
                style={heroCardStyle}
              >
                <div className="mb-1 md:mb-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-500 transform group-hover:scale-105" style={heroIconWrapStyle}>
                  {service.icon}
                </div>
                <span className="text-[7px] md:text-[9px] lg:text-[10px] font-semibold tracking-[0.02em] md:tracking-[0.05em] uppercase text-gray-400 group-hover:text-white transition-colors duration-500 text-center leading-tight">
                  {t(`${service.key}_T`)}
                </span>

                <div className="absolute inset-0 rounded-[0.75rem] md:rounded-[1.25rem] bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2 mt-1 md:mt-2" style={heroWhatsappWrapStyle}>
          <a
            href="https://wa.me/+995591160685"
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex items-center justify-center gap-2 px-5 py-2 md:px-6 md:py-2.5 rounded-xl bg-[#25D366] text-white font-bold uppercase ${heroCtaTrackingClassName} text-[10px] md:text-xs whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] active:scale-95 w-full max-w-[280px]`}
            style={heroWhatsappStyle}
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            {t("CONTACT_WHATSAPP")}
            
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </a>

          <OrderButton
            user={user}
            setIsOrderOpen={setIsOrderOpen}
            setIsAuthOpen={setIsAuthOpen}
            onRequireAuth={onRequireAuthForOrder}
            variant="cta"
            labelKey="ORDER_ON_SITE"
            className={`bg-blue-600 text-white px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase ${heroCtaTrackingClassName} shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all duration-300 w-full max-w-[280px] whitespace-nowrap`}
            style={heroWhatsappStyle}
          />
        </div>
      </div>

      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.8) 100%);
        }

        @media (min-width: 768px) and (max-width: 1366px) and (min-height: 700px) and (pointer: coarse) {
          header[data-section="hero"] {
            min-height: 100svh;
            align-items: center;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          .hero-content {
            margin-top: 0 !important;
          }

          .hero-services-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.25rem;
          }

          .hero-service-card {
            padding: 1.25rem;
          }
        }

        @media (min-width: 768px) and (max-width: 1366px) and (max-height: 820px) and (pointer: coarse) {
          .hero-services-grid {
            gap: 1rem;
          }

          .hero-service-card {
            padding: 1rem;
          }
        }

        @media (max-height: 430px) and (max-width: 900px) and (orientation: landscape) {
          header[data-section="hero"] {
            align-items: flex-start;
            padding-top: calc(3.75rem + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(5.75rem + env(safe-area-inset-bottom, 0px)) !important;
          }

          .hero-services-grid {
            column-gap: 0.35rem !important;
            row-gap: 0.15rem !important;
            margin-bottom: 0.4rem !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .hero-service-card {
            padding: 0.2rem !important;
          }

          .hero-service-card > div:first-child {
            margin-bottom: 0.1rem !important;
          }

          .hero-content h1 {
            margin-bottom: 0.4rem !important;
          }

          a[href^="https://wa.me/"] {
            margin-top: 0 !important;
            padding: 0.5rem 0.9rem !important;
          }
        }

        @media (max-width: 430px) and (max-height: 740px) {
          header[data-section="hero"] {
            align-items: flex-start;
            padding-top: calc(5.5rem + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(9.25rem + env(safe-area-inset-bottom, 0px)) !important;
          }

          .hero-content h1 {
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
          }

          .hero-services-grid {
            gap-x: 0.5rem;
            gap-y: 0.4rem !important;
            margin-bottom: 0.55rem !important;
          }

          .hero-service-card {
            padding: 0.3rem !important;
          }

        }

      `}</style>
    </header>
  );
};

export default Hero;
