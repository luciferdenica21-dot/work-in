import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

const TermsInfo = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  // modal controlled via global events

  useEffect(() => {
    const onOpen = () => {
      setOpen(false);
    };
    const onClose = () => {};
    const onTermsOpen = () => setOpen(true);
    const onTermsClose = () => setOpen(false);
    const onTermsToggle = () => setOpen((v) => !v);
    window.addEventListener('chatwidget:open', onOpen);
    window.addEventListener('chatwidget:close', onClose);
    window.addEventListener('useterms:open', onTermsOpen);
    window.addEventListener('useterms:close', onTermsClose);
    window.addEventListener('useterms:toggle', onTermsToggle);
    return () => {
      window.removeEventListener('chatwidget:open', onOpen);
      window.removeEventListener('chatwidget:close', onClose);
      window.removeEventListener('useterms:open', onTermsOpen);
      window.removeEventListener('useterms:close', onTermsClose);
      window.removeEventListener('useterms:toggle', onTermsToggle);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Floating icon removed; modal opens via global events */}

      {open && (
        <div className="fixed inset-0 z-[520]">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[530] mx-auto my-12 md:my-12 w-[92%] max-w-[760px] rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[85vh] overflow-hidden">
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

              <div className="mt-6 space-y-6 text-white/80 leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
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
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S5_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S5_TEXT')}
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S6_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S6_TEXT')}
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">{t('TERMS_S7_TITLE')}</div>
                  <p className="mt-2 text-sm">
                    {t('TERMS_S7_TEXT')}
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
