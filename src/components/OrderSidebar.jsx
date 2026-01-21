import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../config/api';

const OrderSidebar = ({ 
  isOrderOpen, 
  setIsOrderOpen, 
  brandGradient,
  user,           
  setIsAuthOpen   
}) => {
  const { t } = useTranslation();

  const [chosenServices, setChosenServices] = useState([]);
  const [tempSelection, setTempSelection] = useState([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Состояние для модалки успеха
  const [showSuccess, setShowSuccess] = useState(false);

  // ВАЖНО: Сбрасываем успех только при НОВОМ открытии, если до этого всё было успешно
  useEffect(() => {
    if (isOrderOpen) {
      if (showSuccess) {
          setShowSuccess(false);
      }
      
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setContact(user.phone || '');
      }
    }
  }, [isOrderOpen, user]);

  const services = [
    "S1_T", "S2_T", "S3_T", "S4_T", "S5_T", "S6_T", "S7_T", "S8_T", "S9_T", "S10_T"
  ];

  const toggleService = (service) => {
    setTempSelection(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service) 
        : [...prev, service]
    );
  };

  const confirmSelection = () => {
    setChosenServices(tempSelection);
    setIsSelectorOpen(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (chosenServices.length === 0) {
      return; // Просто прерываем выполнение без алерта
    }
    setLoading(true);
    try {
      const serviceTitles = chosenServices.map(s => t(s));

      const orderData = {
        items: chosenServices.map(s => ({
          title: t(s),
          quantity: 1
        })),
        services: serviceTitles,
        firstName: firstName,
        lastName: lastName,
        contact: contact,
        comment: comment, 
        totalAmount: 0
      };

      await ordersAPI.create(orderData);
      setShowSuccess(true);
      setChosenServices([]);
      setTempSelection([]);
      setComment("");
    } catch (error) {
      console.error('Order failed:', error);
      alert(t('Ошибка при создании заказа'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOrderOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOrderOpen(false)}
      />
      
      <div className="relative w-full max-w-[500px] bg-[#0A0A0B] h-full shadow-2xl border-l border-white/5 flex flex-col animate-slideLeft">
        <button 
          onClick={() => setIsOrderOpen(false)}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-grow overflow-y-auto px-8 pt-20 pb-8 custom-scrollbar">
          {showSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{t("Заказ принят!")}</h2>
              <p className="text-white/60 font-light leading-relaxed">
                {t("Спасибо за доверие. Мы свяжемся с вами в ближайшее время для уточнения деталей.")}
              </p>
              <button 
                onClick={() => setIsOrderOpen(false)}
                className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white ${brandGradient || 'bg-blue-600'}`}
              >
                {t("Закрыть")}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-2">{t("Оформить заказ")}</h2>
                <div className="w-12 h-1 bg-blue-500"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
  <div className="flex items-center gap-2">
    <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Выбранные услуги")} *</label>
    {chosenServices.length === 0 && (
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={t("Обязательно для выбора")}></span>
    )}
  </div>
  <button 
    type="button" 
    onClick={() => {
      setTempSelection(chosenServices);
      setIsSelectorOpen(true);
    }}
    className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-left flex items-center justify-between group transition-all ${
      chosenServices.length === 0 ? 'border-red-500/30 hover:border-red-500/50' : 'border-white/10 hover:border-blue-500/50'
    }`}
  >
    <span className={chosenServices.length ? "text-white text-sm" : "text-white/20 text-sm"}>
      {chosenServices.length ? `${t("Выбрано")}: ${chosenServices.length}` : t("Добавить услуги")}
    </span>
    <svg className="w-5 h-5 text-white/20 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
                  {chosenServices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {chosenServices.map(s => (
                        <span key={s} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 uppercase tracking-wider">
                          {t(s)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Имя")}</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("Имя")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Фамилия")}</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("Фамилия")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Контактные данные")} *</label>
                  <input 
                    type="text" 
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("Телефон или Email")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Комментарий к заказу")}</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("Опишите детали проекта...")}
                    rows="4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10 resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className={`w-full py-5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${brandGradient || 'bg-blue-600'} disabled:opacity-50`}
                  >
                    {loading ? t("...") : t("Подтвердить заказ")}
                  </button>
                  <p className="text-center text-[8px] text-white/20 uppercase tracking-widest mt-4">
                    {t("Нажимая кнопку, вы соглашаетесь с условиями обслуживания")}
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Селектор услуг (Выпадающий список) */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSelectorOpen(false)} />
          <div className="relative w-full max-w-[400px] bg-[#0A0A0B] border border-white/10 rounded-3xl p-8 shadow-2xl animate-modalEnter">
            <button 
              onClick={() => setIsSelectorOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-8">{t("Выберите услуги")}</h3>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {services.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleService(s)}
                    className={`w-full p-4 rounded-xl border transition-all text-left uppercase tracking-widest text-[10px] ${
                      tempSelection.includes(s) 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {t(s)}
                  </button>
                ))}
              </div>
              <div className="pt-6">
                <button 
                  onClick={confirmSelection}
                  className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white ${brandGradient || 'bg-blue-600'}`}
                >
                  {t("Подтвердить выбор")} ({tempSelection.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSidebar;