import React, { useState } from 'react';
import { FileText } from 'lucide-react';

const TermsInfo = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Use Terms"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-3 md:bottom-6 md:left-6 z-[130] flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/[0.03] border border-blue-500/30 backdrop-blur-xl text-white/70 hover:text-white hover:border-blue-500/60 shadow-[0_0_20px_rgba(34,158,217,0.15)] hover:shadow-[0_0_30px_rgba(34,158,217,0.35)] transition-all"
      >
        <FileText className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[140]">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[141] mx-auto mt-16 md:mt-24 w-[92%] max-w-[760px] rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white text-lg md:text-2xl font-bold uppercase tracking-[0.2em]">
                    КАК РАБОТАЕТ CONNECTOR
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

              <div className="mt-6 space-y-6 text-white/80 leading-relaxed">
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">01. РЕГИСТРАЦИЯ</div>
                  <p className="mt-2 text-sm">
                    Создайте личный кабинет за 1 минуту. Это позволит вам отслеживать статус ваших заказов в реальном времени, хранить историю переписки и загруженные чертежи.
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">02. КОНСУЛЬТАЦИЯ</div>
                  <p className="mt-2 text-sm">
                    Есть вопросы? Напишите нам в встроенный чат или выберите удобную соцсеть (Telegram, WhatsApp) прямо на сайте. Мы поможем определиться с материалом или технологией.
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">03. ОФОРМЛЕНИЕ ЗАКАЗА</div>
                  <p className="mt-2 text-sm">
                    Выберите нужную услугу в форме «Оформить заказ», прикрепите файлы (чертежи/макеты) и оставьте комментарий.
                  </p>
                </div>
                <div>
                  <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">04. ОБРАБОТКА МЕНЕДЖЕРОМ</div>
                  <p className="mt-2 text-sm">
                    Ваша заявка мгновенно попадает к менеджеру. Мы проанализируем техническую возможность, рассчитаем стоимость и обязательно свяжемся с вами для подтверждения деталей.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TermsInfo;
