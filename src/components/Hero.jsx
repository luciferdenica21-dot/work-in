import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();

  const steps = [
    { 
      id: 1, 
      title: t("STEP_1_TITLE"), 
      items: [t("STEP_1_TEXT")],
    },
    { 
      id: 2, 
      title: t("STEP_2_TITLE"), 
      items: [t("STEP_2_TEXT")],
    },
    { 
      id: 3, 
      title: t("STEP_3_TITLE"), 
      items: [t("STEP_3_TEXT")],
    },
    { 
      id: 4, 
      title: t("STEP_4_TITLE"), 
      items: [t("STEP_4_TEXT")],
    }
  ];

  const [activeId, setActiveId] = useState(null);
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

  const toggleStep = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  const handleMouseEnter = (id) => {
    if (window.innerWidth >= 768) {
      setActiveId(id);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setActiveId(null);
    }
  };

  return (
    <header 
      ref={sectionRef} 
      className={`relative text-center text-white bg-[#050505] overflow-hidden min-h-[85vh] flex items-center transition-all duration-700 ease-in-out ${activeId ? "py-4 md:py-6" : "py-8 md:py-12"}`}
      data-section="hero"
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

      <div className="relative z-10 container mx-auto px-4">
        
        <div className={`max-w-[800px] mx-auto mb-6 transform transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${activeId ? "md:scale-95 md:mb-2" : "hover:scale-[1.02]"}`}>
          <svg viewBox="0 0 300 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <text x="50%" y="45" textAnchor="middle" fill="white" className="text-[42px] font-black tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>
              CONNECTOR
            </text>
            <text x="50%" y="65" textAnchor="middle" fill="white" textLength="255" lengthAdjust="spacingAndGlyphs" className="text-[9px] uppercase tracking-[0.2em] opacity-80" style={{ fontFamily: 'Arial, sans-serif' }}>
              {t("HERO_SUBTITLE")}
            </text>
          </svg>
        </div>

        <p className={`max-w-2xl mx-auto text-sm md:text-base mb-8 leading-relaxed font-light text-gray-300/90 transition-all duration-1000 ease-in-out ${activeId ? "md:opacity-40 md:mb-2" : "opacity-100"}`}>
           {t("HERO_DESCRIPTION")}
        </p>

        <section 
          onMouseLeave={handleMouseLeave}
          className={`relative max-w-3xl mx-auto transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) p-6 md:p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl ${activeId ? "mt-4" : "mt-12"}`}
        >
          
          <div className="inline-block mb-10 bg-white/5 backdrop-blur-md px-8 py-2 border border-white/10 rounded-full shadow-[0_0_15px_rgba(0,149,255,0.1)]">
            <h4 className="text-[10px] font-bold tracking-[0.4em] uppercase text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">
              {t("HERO_STEPS_TITLE")}
            </h4>
          </div>

          <div className={`absolute left-1/2 -translate-x-1/2 w-[70%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent transition-all duration-700 ${activeId ? "top-[100px] md:top-[110px]" : "top-[110px] md:top-[120px]"}`}></div>

          <div className="flex justify-between items-center relative z-20 mb-2">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  onMouseEnter={() => handleMouseEnter(step.id)}
                  className={`
                    group relative w-10 h-10 md:w-12 md:h-12 rounded-xl border transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex items-center justify-center
                    ${activeId === step.id 
                      ? "border-blue-500 bg-blue-600/20 shadow-[0_0_25px_rgba(37,99,235,0.5)] rotate-45" 
                      : "border-white/10 bg-white/5 hover:border-blue-500/40 hover:rotate-45"
                    }
                  `}
                >
                  <span className={`transition-all duration-700 font-black text-base ${activeId === step.id ? "-rotate-45 text-white" : "group-hover:-rotate-45 text-white/30"}`}>
                    {step.id}
                  </span>
                </button>
              </div>
            ))}
          </div>

          <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeId ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`${activeId === step.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 hidden"} transition-all duration-500 p-4 rounded-2xl bg-blue-500/[0.05] border border-blue-500/20 text-left`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-400">
                    {step.title}
                  </h5>
                  <div className="h-[1px] flex-grow mx-3 bg-blue-500/20"></div>
                  <button onClick={() => setActiveId(null)} className="text-white/20 hover:text-white text-xs">✕</button>
                </div>
                <p className="text-xs md:text-sm font-light text-gray-200 leading-tight italic">
                  "{step.items[0]}"
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style >{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.8) 100%);
        }
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </header>
  );
};

export default Hero;
