import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersAPI, authAPI, filesAPI } from '../config/api';

const OrderSidebar = ({ 
  isOrderOpen, 
  setIsOrderOpen, 
  brandGradient,
  user           
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
  
  // Состояние для файлов
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Состояние для модалки успеха
  const [showSuccess, setShowSuccess] = useState(false);

  // ВАЖНО: Сбрасываем успех только при НОВОМ открытии, если до этого всё было успешно
  useEffect(() => {
    if (isOrderOpen) {
      if (showSuccess) {
          setShowSuccess(false);
      }
      
      // Загрузка полной информации о пользователе
      const loadUserData = async () => {
        if (user && user._id) {
          try {
            // Получаем полную информацию о текущем пользователе
            const userData = await authAPI.me();
            
            // Автозаполнение всеми доступными данными
            setFirstName(prev => prev || userData.firstName || user.firstName || '');
            setLastName(prev => prev || userData.lastName || user.lastName || '');
            
            // Приоритет: телефон > email > другой контакт
            setContact(prev => {
              if (prev) return prev;
              if (userData.phone) return userData.phone;
              if (user.phone) return user.phone;
              if (userData.email) return userData.email;
              if (user.email) return user.email;
              return '';
            });
            
            console.log('Данные пользователя загружены:', userData);
          } catch (error) {
            console.log('Не удалось загрузить данные пользователя, используем базовые:', error);
            
            // Fallback на базовые данные из user prop
            setFirstName(prev => prev || user.firstName || '');
            setLastName(prev => prev || user.lastName || '');
            
            setContact(prev => {
              if (prev) return prev;
              if (user.phone) return user.phone;
              if (user.email) return user.email;
              return '';
            });
          }
        } else {
          // Сброс полей если нет пользователя
          setFirstName('');
          setLastName('');
          setContact('');
        }
      };
      
      loadUserData();
      try {
        const tracker = window.__analyticsTracker;
        if (tracker) tracker.sectionOpen('order');
      } catch { void 0; }
    }
    return () => {
      try {
        const t = window.__analyticsTracker;
        if (t && isOrderOpen) t.sectionClose('order');
      } catch { void 0; }
    };
  }, [isOrderOpen, user, authAPI]);

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

  // Функция форматирования размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Обработка загрузки файлов
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    console.log('=== CLIENT FILE UPLOAD ===');
    console.log('Files selected:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));

    // Проверка размера файлов (фото/видео до 100MB каждый, остальные до 10MB)
    const oversizedFiles = files.filter((file) => {
      const type = String(file?.type || '');
      const isMedia = type.startsWith('image/') || type.startsWith('video/');
      const maxSizeMb = isMedia ? 100 : 10;
      return file.size > maxSizeMb * 1024 * 1024;
    });
    if (oversizedFiles.length > 0) {
      console.log('ERROR: Files too large:', oversizedFiles);
      alert(`Файлы слишком большие. Максимальный размер: фото/видео 100MB, остальные 10MB. Проблемные файлы: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploadingFiles(prev => [...prev, ...files.map(f => ({ 
      id: Date.now() + Math.random(), 
      name: f.name, 
      size: f.size,
      type: f.type 
    }))]);

    try {
      console.log('Starting file upload...');
      const uploadPromises = files.map(async (file) => {
        console.log('Uploading file:', file.name);
        
        // Загружаем файл без привязки к чату (для заказа)
        const result = await filesAPI.upload(file, null);
        console.log('Upload result for', file.name, ':', result);
        
        return {
          id: result.messageId || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.fileUrl,
          originalFile: file
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedFiles);
      setAttachedFiles(prev => [...prev, ...uploadedFiles]);
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('=== CLIENT UPLOAD ERROR ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      alert('Ошибка загрузки файлов: ' + error.message);
    } finally {
      setUploadingFiles([]);
    }
  };

  // Удаление файла
  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (chosenServices.length === 0) {
      console.log('ERROR: No services selected');
      return; // Просто прерываем выполнение без алерта
    }
    
    console.log('=== CLIENT ORDER SUBMISSION ===');
    console.log('Chosen services:', chosenServices);
    console.log('Form data:', {
      firstName: firstName,
      lastName: lastName,
      contact: contact,
      comment: comment,
      attachedFiles: attachedFiles
    });
    
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
        totalAmount: 0,
        // Добавляем файлы к заказу
        files: attachedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url
        }))
      };
      
      console.log('Sending order data:', orderData);

      const result = await ordersAPI.create(orderData);
      console.log('Order created successfully:', result);
      
      setShowSuccess(true);
      setChosenServices([]);
      setTempSelection([]);
      setComment("");
      setFirstName("");
      setLastName("");
      setContact("");
      setAttachedFiles([]); // Очищаем файлы после успешной отправки
    } catch (error) {
      console.error('=== CLIENT ORDER ERROR ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      alert(t('Ошибка при создании заказа') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOrderOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" data-section="order">
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

                {/* Загрузка файлов */}
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Прикрепить файлы")}</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles.length > 0}
                    className="w-full bg-white/5 border border-dashed border-white/20 rounded-xl px-4 py-4 text-left flex items-center justify-center group transition-all hover:border-blue-500/50 disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white/40 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-white/40 text-sm group-hover:text-white transition-colors">
                        {uploadingFiles.length > 0 ? `${t("Загрузка...")} (${uploadingFiles.length})` : t("Нажмите для выбора файлов")}
                      </span>
                    </div>
                  </button>
                  
                  {/* Отображение загружаемых файлов */}
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadingFiles.map(file => (
                        <div key={file.id} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-t border-blue-500"></div>
                          <span className="text-white/60 text-sm">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Отображение прикрепленных файлов */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      {attachedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {file.type?.startsWith('image/') ? (
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              ) : file.type?.includes('pdf') ? (
                                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{file.name}</p>
                              <p className="text-white/40 text-xs">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="flex-shrink-0 p-1 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
