import React from 'react';
import { useTranslation } from 'react-i18next';

const OrderButton = ({ user, setIsOrderOpen, setIsAuthOpen, onRequireAuth, className, locked = false }) => {
  const { t } = useTranslation();

  const handleOrderClick = () => {
    if (locked) return;
    if (user) {
      setIsOrderOpen(true);
    } else {
      if (typeof onRequireAuth === 'function') {
        onRequireAuth();
        return;
      }
      if (typeof setIsAuthOpen === 'function') {
        setIsAuthOpen(true);
      }
    }
  };

  return (
    <button 
      onClick={handleOrderClick} 
      className={`focus:outline-none flex items-center justify-center ${className} ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
      title={locked ? t('service_soon') : undefined}
    >
      {/* Мобильная версия: стиль как у остальных иконок в нижней панели */}
      <div className="flex flex-col items-center md:hidden translate-y-1.5">
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="M9 14l2 2 4-4"></path>
        </svg>
        <span className="text-[8px] font-bold uppercase tracking-tight mt-1">
          {t("Заказать")} {locked && <svg className="inline w-3 h-3 ml-1 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="7" y="11" width="10" height="8" rx="2"/><path d="M12 7a3 3 0 0 1 3 3v1H9v-1a3 3 0 0 1 3-3z"/></svg>}
        </span>
      </div>

      {/* Десктопная версия (текст кнопки) */}
      <span className="hidden md:inline">
        <span className="inline-flex items-center gap-2">
          {t("Оформить заказ")}
          {locked && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="7" y="11" width="10" height="8" rx="2"/><path d="M12 7a3 3 0 0 1 3 3v1H9v-1a3 3 0 0 1 3-3z"/></svg>}
        </span>
      </span>
    </button>
  );
};

export default OrderButton;
