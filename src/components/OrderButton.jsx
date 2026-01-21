import React from 'react';
import { useTranslation } from 'react-i18next';

const OrderButton = ({ user, setIsOrderOpen, setIsAuthOpen, className }) => {
  const { t } = useTranslation();

  const handleOrderClick = () => {
    if (user) {
      setIsOrderOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <button 
      onClick={handleOrderClick} 
      className={`focus:outline-none flex items-center justify-center ${className}`}
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
          {t("Заказать")}
        </span>
      </div>

      {/* Десктопная версия (текст кнопки) */}
      <span className="hidden md:inline">
        {t("Оформить заказ")}
      </span>
    </button>
  );
};

export default OrderButton;