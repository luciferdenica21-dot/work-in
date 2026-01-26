import React, { useState } from 'react';
import { authAPI, setToken } from '../config/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(''); 
  const [login, setLogin] = useState(''); // Состояние для нового поля login
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      let userData;
      let fullUserData;
      
      if (isLogin) {
        userData = await authAPI.login({ email, password }); 
        setToken(userData.token);
        onClose();

        fullUserData = await authAPI.me();
        
        if (userData.role === 'admin') {
          navigate('/manager');
        }
        
        if (onAuthSuccess) {
          onAuthSuccess(fullUserData);
        }
      } else {
        // Проверка всех обязательных полей, включая login
        if (!email || !login || !password || !confirmPassword || !phone || !city || !firstName || !lastName) {
          setError('Все поля обязательны для заполнения');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }
        
        userData = await authAPI.register({
          email,
          login, // Теперь login отправляется на сервер
          password,
          phone,
          city,
          firstName,
          lastName
        });
        setToken(userData.token);
        onClose();

        fullUserData = await authAPI.me();
        
        if (onAuthSuccess) {
          onAuthSuccess(fullUserData);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ошибка: проверьте данные входа.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setLogin(''); // Сброс логина
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPhone('');
    setCity('');
    setFirstName('');
    setLastName('');
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0f1d] border border-white/10 w-full max-w-md rounded-4xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-light text-white mb-8 text-center uppercase tracking-[0.3em]">
          {isLogin ? t("Вход") : t("Регистрация")}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">
              {isLogin ? t("Логин или Email") : t("Email")} *
            </label>
            <input 
              type={isLogin ? "text" : "email"} 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Новое поле ввода логина для регистрации */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Логин")} *</label>
              <input 
                type="text" 
                required={!isLogin}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          )}
          
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Имя")} *</label>
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Фамилия")} *</label>
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Телефон")} *</label>
                <input 
                  type="tel" 
                  required={!isLogin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+995 123 456 789"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Город")} *</label>
                <input 
                  type="text" 
                  required={!isLogin}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Пароль")} *</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-white/60 hover:text-white text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">{t("Повторить пароль")} *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-white/60 hover:text-white text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {error && <p className="text-red-500 text-[10px] uppercase text-center font-bold tracking-wider">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            {loading ? "..." : (isLogin ? t("Войти") : t("Создать аккаунт"))}
          </button>
        </form>
        
        <button 
          onClick={toggleMode}
          className="w-full mt-6 text-white/40 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
        >
          {isLogin ? t("Нет аккаунта? Создать") : t("Уже есть аккаунт? Войти")}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;