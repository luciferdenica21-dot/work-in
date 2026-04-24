import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';

const Hero = () => {
  const { t } = useTranslation();

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

  const handleServiceClick = (key) => {
    window.dispatchEvent(new CustomEvent('service:open', { detail: { key } }));
  };

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUa = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTelegram = /Telegram/i.test(ua);
  const heroOffsetStyle = isMobileUa && isTelegram ? { marginTop: 'calc(5rem + 16px)' } : undefined;

  return (
    <header 
      ref={sectionRef} 
      className="relative text-center text-white bg-[#050505] overflow-hidden min-h-[100svh] md:min-h-[100vh] flex items-center md:items-start justify-center pt-20 md:pt-14 lg:pt-16 pb-20 md:pb-10"
      data-section="hero"
      style={heroOffsetStyle}
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

      <div className="hero-content relative z-10 container mx-auto px-4 flex flex-col items-center md:-mt-4 lg:-mt-6 xl:-mt-8">
        
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 md:mb-6 lg:mb-4 tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 px-4 leading-tight">
          {t("HERE_YOU_CAN_ORDER")}
        </h1>

        <div className="hero-services-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-6 md:gap-4 lg:gap-5 max-w-[1100px] lg:max-w-[1280px] mx-auto mb-6 md:mb-8 lg:mb-6 px-2 md:px-6">
          {services.map((service) => {
            const colSpanClassName = service.colSpanClassName || '';

            if (service.disabled) {
              return (
                <div
                  key={service.key}
                  aria-disabled="true"
                  className={`${colSpanClassName} hero-service-card relative flex flex-col items-center justify-center p-2 md:p-4 lg:p-4 rounded-[0.75rem] md:rounded-[1.25rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl cursor-default`}
                >
                  <div className="mb-1 md:mb-2 text-blue-400">
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
              >
                <div className="mb-1 md:mb-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-500 transform group-hover:scale-105">
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

        <div className="flex justify-center mt-1 md:mt-2">
          <a
            href="https://wa.me/+995591160685"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 lg:px-7 lg:py-3 rounded-xl md:rounded-2xl bg-[#25D366] text-white font-bold uppercase tracking-widest text-xs md:text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] active:scale-95"
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            {t("CONTACT_WHATSAPP")}
            
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </a>
        </div>
      </div>

      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.8) 100%);
        }

        @media (min-width: 768px) and (max-width: 1366px) and (pointer: coarse) {
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
      `}</style>
    </header>
  );
};

export default Hero;
