import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, Link } from 'react-router-dom';
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

const SEO_SERVICE_KEYS = ['S1','S2','S3','S4','S5','S6','S8','S9','S10'];

const SERVICE_SLUG_BY_KEY = {
  S1: 'metal-bending',
  S2: 'liquid-coating',
  S3: 'laser-engraving',
  S4: 'laser-cutting-metals',
  S5: 'laser-cutting-nonmetals',
  S6: 'powder-coating',
  S8: 'welding',
  S9: 'turning',
  S10: 'cnc-milling',
};

const SERVICE_KEY_BY_SLUG = Object.entries(SERVICE_SLUG_BY_KEY).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

const pickLang = (langRaw) => {
  const lang = String(langRaw || '').toLowerCase();
  if (lang.startsWith('ka')) return 'ka';
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('en')) return 'en';
  return 'en';
};

const upsertMeta = (selector, attrs) => {
  try {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.startsWith('meta[')) {
        const mName = selector.match(/name="([^"]+)"/);
        const mProp = selector.match(/property="([^"]+)"/);
        if (mName?.[1]) el.setAttribute('name', mName[1]);
        if (mProp?.[1]) el.setAttribute('property', mProp[1]);
      }
      document.head.appendChild(el);
    }
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
  } catch { void 0; }
};

const upsertLink = (rel, hreflang, href) => {
  try {
    const q = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    let el = document.head.querySelector(q);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  } catch { void 0; }
};

const upsertJsonLd = (id, obj) => {
  try {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(obj);
  } catch { void 0; }
};

const buildServiceSeo = ({ lang, serviceName }) => {
  if (lang === 'ka') {
    const title = `${serviceName} თბილისში — CONNECTOR`;
    const description = `${serviceName} თბილისში, საქართველოში. წარმოების სერვისები: ნახაზების მიღება, სწრაფი შეთავაზება, ხარისხიანი შესრულება.`;
    const keywords = `${serviceName}, თბილისი, საქართველო, წარმოება, სერვისები, ლაზერული ჭრა, CNC, შედუღება, შეღებვა`;
    return { title, description, keywords, ogTitle: title, locale: 'ka_GE' };
  }
  if (lang === 'ru') {
    const title = `${serviceName} в Тбилиси — CONNECTOR`;
    const description = `${serviceName} в Тбилиси, Грузия. Производственные услуги: принимаем чертежи, быстрый расчет, качественное изготовление.`;
    const keywords = `${serviceName}, Тбилиси, Грузия, производство, услуги, лазерная резка, ЧПУ, сварка, окраска`;
    return { title, description, keywords, ogTitle: title, locale: 'ru_RU' };
  }
  const title = `${serviceName} in Tbilisi — CONNECTOR`;
  const description = `${serviceName} in Tbilisi, Georgia. Manufacturing services: drawings accepted, fast quote, reliable quality.`;
  const keywords = `${serviceName}, Tbilisi, Georgia, manufacturing, services, laser cutting, CNC, welding, coating`;
  return { title, description, keywords, ogTitle: title, locale: 'en_US' };
};

const buildServicesSeo = ({ lang }) => {
  if (lang === 'ka') {
    return {
      title: 'CONNECTOR — სერვისები თბილისში',
      description: 'CONNECTOR — წარმოების სერვისები თბილისში, საქართველოში: ლაზერული ჭრა და გრავირება, CNC ფრეზირება, ტოკარული სამუშაოები, მეტალის მოხრა, შედუღება, ფხვნილისებრი შეღებვა.',
      keywords: 'ლაზერული ჭრა თბილისი, CNC ფრეზირება თბილისი, ლაზერული გრავირება საქართველო, ტოკარული სამუშაოები, შედუღება, მეტალის მოხრა, ფხვნილისებრი შეღებვა, წარმოების სერვისები თბილისი',
      ogTitle: 'CONNECTOR — სერვისები თბილისში',
      locale: 'ka_GE'
    };
  }
  if (lang === 'ru') {
    return {
      title: 'CONNECTOR — услуги производства в Тбилиси',
      description: 'CONNECTOR — производственные услуги в Тбилиси (Грузия): лазерная резка и гравировка, ЧПУ фрезеровка, токарные работы, гибка металла, сварка, порошковая окраска.',
      keywords: 'лазерная резка Тбилиси, гравировка Грузия, ЧПУ фрезеровка Тбилиси, токарные работы, сварка, гибка металла, порошковая окраска, производственные услуги',
      ogTitle: 'CONNECTOR — услуги производства в Тбилиси',
      locale: 'ru_RU'
    };
  }
  return {
    title: 'CONNECTOR — manufacturing services in Tbilisi',
    description: 'CONNECTOR — manufacturing services in Tbilisi, Georgia: laser cutting & engraving, CNC milling, turning, metal bending, welding, powder coating.',
    keywords: 'laser cutting Tbilisi, engraving Georgia, CNC milling Tbilisi, turning services, metal bending, welding, powder coating, manufacturing services',
    ogTitle: 'CONNECTOR — manufacturing services in Tbilisi',
    locale: 'en_US'
  };
};

const Services = ({ user, setIsAuthOpen, setIsOrderOpen, onRequireAuthForOrder }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = pickLang(i18n?.language);
  const langQuery = lang ? `?lang=${encodeURIComponent(lang)}` : '';

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
    const seo = buildServicesSeo({ lang });
    const origin = 'https://www.connector.ge';
    const url = `${origin}/services?lang=${encodeURIComponent(lang)}`;
    document.documentElement.lang = lang;
    document.title = seo.title;
    upsertMeta('meta[name="description"]', { content: seo.description });
    upsertMeta('meta[name="keywords"]', { content: seo.keywords });
    upsertMeta('meta[property="og:title"]', { content: seo.ogTitle });
    upsertMeta('meta[property="og:description"]', { content: seo.description });
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertMeta('meta[property="og:locale"]', { content: seo.locale });
    upsertMeta('meta[name="twitter:title"]', { content: seo.ogTitle });
    upsertMeta('meta[name="twitter:description"]', { content: seo.description });
    upsertLink('canonical', null, url);
    upsertLink('alternate', 'ka', `${origin}/services?lang=ka`);
    upsertLink('alternate', 'ru', `${origin}/services?lang=ru`);
    upsertLink('alternate', 'en', `${origin}/services?lang=en`);
    upsertLink('alternate', 'x-default', `${origin}/services`);
  }, [lang]);

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
  }, [setIsAuthOpen, setIsOrderOpen]);

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
          const slug = SERVICE_SLUG_BY_KEY[key] || '';
          const href = slug ? `/services/${slug}${langQuery}` : `/services${langQuery}`;

          return (
            <div
              key={key}
              aria-disabled={locked ? 'true' : 'false'}
              onClick={() => { if (!locked) setSelectedKey(key); }}
              className={`group relative overflow-hidden rounded-[2rem] bg-[#0a0a0a] border border-white/10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] ${locked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {!locked && slug ? (
                <a
                  href={href}
                  onClick={(e) => { e.preventDefault(); setSelectedKey(key); }}
                  className="absolute inset-0 z-[1]"
                  aria-label={t(`${key}_T`)}
                />
              ) : null}
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

export const ServiceSeoPage = ({ user, setIsAuthOpen, setIsOrderOpen, onRequireAuthForOrder }) => {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const lang = pickLang(i18n?.language);
  const serviceKey = SERVICE_KEY_BY_SLUG[String(slug || '').toLowerCase()] || '';
  const serviceName = serviceKey ? String(t(`${serviceKey}_T`)) : '';
  const isLocked = serviceKey ? LOCKED_KEYS.includes(serviceKey) : false;

  useEffect(() => {
    if (!serviceKey) return;
    const seo = buildServiceSeo({ lang, serviceName });
    const origin = 'https://www.connector.ge';
    const url = `${origin}/services/${encodeURIComponent(String(slug))}?lang=${encodeURIComponent(lang)}`;

    document.documentElement.lang = lang;
    document.title = seo.title;
    upsertMeta('meta[name="description"]', { content: seo.description });
    upsertMeta('meta[name="keywords"]', { content: seo.keywords });
    upsertMeta('meta[property="og:title"]', { content: seo.ogTitle });
    upsertMeta('meta[property="og:description"]', { content: seo.description });
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertMeta('meta[property="og:locale"]', { content: seo.locale });
    upsertMeta('meta[name="twitter:title"]', { content: seo.ogTitle });
    upsertMeta('meta[name="twitter:description"]', { content: seo.description });

    upsertLink('canonical', null, url);
    upsertLink('alternate', 'ka', `${origin}/services/${encodeURIComponent(String(slug))}?lang=ka`);
    upsertLink('alternate', 'ru', `${origin}/services/${encodeURIComponent(String(slug))}?lang=ru`);
    upsertLink('alternate', 'en', `${origin}/services/${encodeURIComponent(String(slug))}?lang=en`);
    upsertLink('alternate', 'x-default', `${origin}/services/${encodeURIComponent(String(slug))}`);

    upsertJsonLd('ld-service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: serviceName,
      areaServed: [
        { '@type': 'City', name: 'Tbilisi' },
        { '@type': 'Country', name: 'Georgia' }
      ],
      provider: {
        '@type': 'LocalBusiness',
        name: 'CONNECTOR',
        url: origin,
        telephone: '+995591160685',
        email: 'useconnector@gmail.com',
        address: { '@type': 'PostalAddress', addressLocality: 'Tbilisi', addressCountry: 'GE' }
      }
    });
  }, [lang, serviceKey, serviceName, slug]);

  if (!serviceKey || !SEO_SERVICE_KEYS.includes(serviceKey)) {
    const homeHref = `/?lang=${encodeURIComponent(lang)}`;
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-white/70 text-center">
          <div className="text-xl font-semibold text-white">{t('not_found')}</div>
          <div className="mt-3">
            <Link to={homeHref} className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
              {t('back_to_home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const requestOrder = () => {
    if (typeof onRequireAuthForOrder === 'function' && !user) {
      onRequireAuthForOrder({ serviceKey });
      return;
    }
    if (!user && typeof setIsAuthOpen === 'function') {
      setIsAuthOpen(true);
      return;
    }
    if (typeof setIsOrderOpen === 'function') setIsOrderOpen(true);
    try {
      window.dispatchEvent(new CustomEvent('order:prefill', { detail: { serviceKey } }));
    } catch { void 0; }
  };

  const origin = 'https://www.connector.ge';
  const serviceUrl = `${origin}/services/${encodeURIComponent(String(slug))}?lang=${encodeURIComponent(lang)}`;
  const homeHref = `/?lang=${encodeURIComponent(lang)}`;
  const servicesHref = `/services?lang=${encodeURIComponent(lang)}`;

  return (
    <section className="relative pt-20 pb-20 px-4 bg-[#050505]">
      <div className="max-w-5xl mx-auto">
        <div className="text-white/60 text-sm">
          <Link to={homeHref} className="hover:text-white">{t('ГЛАВНАЯ')}</Link>
          <span className="mx-2">/</span>
          <Link to={servicesHref} className="hover:text-white">{t('УСЛУГИ')}</Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="rounded-3xl overflow-hidden border border-white/10">
            <img
              src={SERVICES_IMGS[serviceKey]}
              alt={serviceName}
              className={`w-full h-[260px] md:h-[360px] object-cover${isLocked ? ' filter blur-md' : ''}`}
            />
          </div>
          <div>
            <h1 className="text-white text-3xl md:text-4xl font-semibold leading-tight">{serviceName}</h1>
            <div className="mt-4 text-white/80 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {t(`${serviceKey}_D`)}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={requestOrder}
                disabled={isLocked}
                className={`px-5 py-3 rounded-2xl font-semibold ${isLocked ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {t('Оформить заказ')}
              </button>
              <a
                href={serviceUrl}
                className="text-white/50 hover:text-white/70 text-sm underline underline-offset-4"
              >
                {serviceUrl}
              </a>
            </div>
            {isLocked ? (
              <div className="mt-3 text-white/50 text-sm">{t('service_soon')}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-10">
          <div className="text-white/70 text-sm mb-3">{t('УСЛУГИ')}</div>
          <div className="flex flex-wrap gap-2">
            {SEO_SERVICE_KEYS.map((k) => {
              const s = SERVICE_SLUG_BY_KEY[k];
              const name = String(t(`${k}_T`));
              return (
                <Link
                  key={k}
                  to={`/services/${s}?lang=${encodeURIComponent(lang)}`}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-sm"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
