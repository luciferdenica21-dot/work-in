import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

const TermsInfo = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed bottom-24 left-6 md:bottom-8 md:left-8 z-[200]">
        <button
          aria-label="Use Terms"
          onClick={() => setOpen((v) => !v)}
          className={`w-9 h-9 md:w-14 md:h-14 rounded-full shadow-2xl transition-all relative flex items-center justify-center
          ${isMobile && scrolled ? 'bg-blue-600 text-white opacity-100' : 'bg-blue-600/30 text-white opacity-80'} hover:bg-blue-600 hover:opacity-100 hover:scale-110`}
        >
          <span className="absolute inset-0 rounded-full ring-2 ring-blue-400/40" />
          <FileText className="w-4 h-4 md:w-6 md:h-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[210]">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[211] mx-auto mt-12 md:mt-24 w-[92%] max-w-[760px] rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[70vh] md:max-h-none overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white text-lg md:text-2xl font-bold uppercase tracking-[0.2em]">
                    {t('TERMS_TITLE')}
                  </h2>
                  <div className="w-14 h-[2px] bg-blue-500 mt-3" />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mt-6 space-y-6 text-white/80 leading-relaxed overflow-y-auto max-h-[52vh] md:max-h-none pr-2">
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S1_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S1_TEXT')}
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S2_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S2_TEXT')}
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S3_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S3_TEXT')}
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S4_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S4_TEXT')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default TermsInfo;
