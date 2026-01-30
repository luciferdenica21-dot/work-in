import React from 'react';

const Contact = () => {
  const contacts = [
    {
      name: 'Telegram',
      url: 'https://t.me/https://t.me/ConnectorGe',
      color: 'hover:bg-[#229ED9] hover:shadow-[0_0_30px_rgba(34,158,217,0.6)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-7 md:h-7">
          <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/+995591160685',
      color: 'hover:bg-[#25D366] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-7 md:h-7">
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
        </svg>
      ),
    },
    {
      name: 'Gmail',
      url: 'mailto:useconnector@gmail.com',
      color: 'hover:bg-[#EA4335] hover:shadow-[0_0_30px_rgba(234,67,53,0.6)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-7 md:h-7">
          <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
          <path d="M3 7l9 6l9 -6" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>
        {`
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
          /* Красивая неоновая тень для иконок */
          .neon-icon-border {
            border: 1px solid rgba(56, 189, 248, 0.5);
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.2);
          }
        `}
      </style>

      <section id="contact" className="relative bg-[#0a0a0a] py-4 md:py-32 px-4 overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50% 20%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex justify-center items-center">
             
             
            <div className="flex flex-row flex-wrap justify-center items-center gap-8 md:gap-20 p-3 md:p-10">
              {contacts.map((contact, index) => (
                <a
                  key={contact.name}
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={contact.name}
                  className={`
                    reveal-on-scroll
                    group relative flex items-center justify-center
                    w-12 h-12 md:w-24 md:h-24
                    bg-white/[0.02] backdrop-blur-2xl 
                    rounded-xl md:rounded-[2rem]
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    text-white/40
                    hover:text-white hover:-translate-y-3 hover:scale-110
                    neon-icon-border
                    ${contact.color}
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                    {contact.icon}
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-[inherit]"></div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative bg-[#050505] text-white/20 text-center py-8 md:py-16 border-t border-white/[0.02]">
        <div className="reveal-on-scroll">
          <p className="footer-glow text-[10px] md:text-sm font-bold tracking-[0.3em] uppercase transition-all duration-500">
            &copy; {new Date().getFullYear()} <span className="text-white/40">Connector Official By PHOENIX.</span>. All rights reserved.
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-500/10"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/10"></div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Contact;