import React, { useEffect } from 'react';

const Contact = () => {
  const contacts = [
    {
      name: 'Telegram',
      url: 'https://t.me/ConnectorGe',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/+995591160685',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
        </svg>
      ),
    },
    {
      name: 'Gmail',
      url: 'mailto:useconnector@gmail.com',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
          <path d="M3 7l9 6l9 -6" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/connectorge',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/connectorge',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      ),
    },
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@connectorge',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    try {
      const tracker = window.__analyticsTracker;
      if (tracker) tracker.sectionOpen('contact');
      return () => {
        const t = window.__analyticsTracker;
        if (t) t.sectionClose('contact');
      };
    } catch { void 0; }
  }, []);

  return (
    <>
      <style>{`
        @keyframes scrollReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal-on-scroll {
          view-timeline-name: --section;
          view-timeline-axis: block;
          animation-timeline: --section;
          animation-name: scrollReveal;
          animation-range: entry 10% cover 30%;
          animation-fill-mode: both;
        }
        .footer-glow {
          text-shadow: 0 0 10px rgba(255,255,255,0.3), 0 0 20px rgba(56,189,248,0.2);
          transition: all 0.5s ease;
        }
        .footer-glow:hover {
          text-shadow: 0 0 15px rgba(255,255,255,0.5), 0 0 30px rgba(56,189,248,0.4);
          color: white;
        }
      `}</style>

      <section id="contact" className="relative bg-[#0a0a0a] py-12 md:py-24 px-4 overflow-hidden" data-section="contact">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.08),transparent_70%)]"></div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-8">

          {/* Копирайт — над иконками */}
          <div className="reveal-on-scroll text-center">
            <p className="footer-glow text-[10px] md:text-sm font-bold tracking-[0.3em] uppercase text-white/20 transition-all duration-500">
              &copy; {new Date().getFullYear()} <span className="text-white/40">Connector Official By PHOENIX.</span>. All rights reserved.
            </p>
            <div className="mt-3 flex justify-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-500/10"></div>
              <div className="w-1 h-1 rounded-full bg-blue-500/30"></div>
              <div className="w-1 h-1 rounded-full bg-blue-500/10"></div>
            </div>
          </div>

          {/* Иконки контактов — стиль как в бургере */}
          <div className="flex items-center justify-center gap-8">
            {contacts.map((contact) => (
              <a
                key={contact.name}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                title={contact.name}
                className="reveal-on-scroll text-white/70 hover:text-blue-400 transition-colors"
              >
                {contact.icon}
              </a>
            ))}
          </div>

        </div>
      </section>

      <footer className="relative bg-[#050505] border-t border-white/[0.02] py-4"></footer>
    </>
  );
};

export default Contact;
