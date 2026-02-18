import './i18n';
import { useState, useEffect, lazy, Suspense } from 'react' 
import { useTranslation } from 'react-i18next'; 
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import './App.css'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Contact from './components/Contact';
import OrderSidebar from './components/OrderSidebar';
import AuthModal from './components/AuthModal';
import ChatWidget from './components/ChatWidget';
const ManagerPanel = lazy(() => import('./components/ManagerPanelPro'));
import ClientDashboard from './components/ClientDashboard';
import TermsInfo from './components/TermsInfo';
import { authAPI, getToken, removeToken } from './config/api';
import { initAnalyticsTracker } from './config/analyticsTracker';

function App() {
  const { i18n } = useTranslation(); 
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const touchStart = useRef({ x: 0, y: 0, t: 0 });

 useEffect(() => {
  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ИСПРАВЛЕНО: me() вместо getMe()
      const userData = await authAPI.me(); 
      setUser(userData);
      setUserRole(userData.role);
    } catch (error) {
      console.error("Auth check failed:", error);
      removeToken();
      setUser(null);
      setUserRole(null);
    } finally {
      // ВАЖНО: всегда выключаем загрузку в конце
      setLoading(false); 
    }
  };

  checkAuth();
}, []);

 useEffect(() => {
   try {
     initAnalyticsTracker();
   } catch { void 0; }
 }, []);

 useEffect(() => {
   try {
     const sid = sessionStorage.getItem('session_id');
     if (user && sid) {
       import('./config/api').then(({ analyticsAPI }) => {
         analyticsAPI.bindSession(sid).catch(() => {});
       });
     }
   } catch { void 0; }
 }, [user]);

 const MobileSwipeBack = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const startRef = useRef({ x: 0, y: 0, t: 0 });
   const enabled = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
   useEffect(() => {
     if (!enabled) return;
     const pushGuard = () => {
       try {
         const url = location.pathname + location.search + location.hash;
         window.history.pushState({ guard: true }, '', url);
       } catch { /* ignore */ }
     };
     // Добавляем защитный слой от выхода из сайта кнопкой/жестом "назад" на мобильных
     pushGuard();
     const onPop = () => {
       const idx = (window.history && window.history.state && typeof window.history.state.idx === 'number') ? window.history.state.idx : 0;
       // Если в истории роутера ещё есть шаги — позволяем обычный back.
       // Если это край и браузер хочет выйти с сайта — возвращаем защитный state.
       if (idx <= 0) {
         pushGuard();
       }
     };
     window.addEventListener('popstate', onPop);
     return () => {
       window.removeEventListener('popstate', onPop);
     };
   }, [enabled, location.pathname, location.search, location.hash]);
   useEffect(() => {
     if (!enabled) return;
     const onStart = (e) => {
       const t = e.touches && e.touches[0];
       if (!t) return;
       // Игнорируем край у экрана (системные жесты)
       if (t.clientX < 24 || (window.innerWidth - t.clientX) < 24) return;
       startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
     };
     const onEnd = (e) => {
       const t = e.changedTouches && e.changedTouches[0];
       if (!t) return;
       const dx = t.clientX - startRef.current.x;
       const dy = t.clientY - startRef.current.y;
       const dt = Date.now() - startRef.current.t;
       // Свайп влево: короткий, почти горизонтальный
       if (dt < 500 && Math.abs(dy) < 70 && dx < -60) {
         const idx = (window.history && window.history.state && typeof window.history.state.idx === 'number') ? window.history.state.idx : 0;
         if (idx > 0) {
           e.preventDefault?.();
           try { navigate(-1); } catch { /* ignore */ }
         }
       }
     };
     document.addEventListener('touchstart', onStart, { passive: true });
     document.addEventListener('touchend', onEnd, { passive: false });
     return () => {
       document.removeEventListener('touchstart', onStart);
       document.removeEventListener('touchend', onEnd);
     };
   }, [navigate, location.pathname, enabled]);
   return null;
 };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setUserRole(userData.role);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setUserRole(null);
  };

  if (loading) return (
    <div style={{ background: '#050a18', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
    </div>
  );

  const MainSite = () => (
    <div className={`min-h-screen flex flex-col ${i18n.language === 'ka' ? 'font-georgian' : 'font-sans'}`} data-section="site">
      <Navbar 
        setIsOrderOpen={setIsOrderOpen} 
        isOrderOpen={isOrderOpen} 
        setIsAuthOpen={setIsAuthOpen}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        <Hero />
       <Services 
  user={user} 
  setIsAuthOpen={setIsAuthOpen} 
  setIsOrderOpen={setIsOrderOpen} // Передаем функцию управления
  isOrderOpen={isOrderOpen}       // Передаем текущее состояние
  onLogout={handleLogout} 
/>
        <Contact />
      </main>
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      
      <OrderSidebar 
        isOrderOpen={isOrderOpen} 
        setIsOrderOpen={setIsOrderOpen} 
        user={user} 
        setIsAuthOpen={setIsAuthOpen} 
      />
      
      {user && userRole !== 'admin' && <ChatWidget user={user} />}
      <TermsInfo />
    </div>
  );

  return (
   <Router>
     <MobileSwipeBack />
  <Routes>
    <Route 
      path="/" 
      element={
        user && userRole === 'admin' 
          ? <Navigate to="/manager" replace />
          : <MainSite />
      } 
    />
    <Route 
      path="/manager" 
      element={
        loading ? (
          null
        ) : user && userRole === 'admin' ? (
          <Suspense fallback={<div style={{ background: '#050a18', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div></div>}>
            <ManagerPanel user={user} />
          </Suspense>
        ) : (
          <Navigate to="/" replace />
        )
      } 
    />
    <Route 
      path="/dashboard" 
      element={
        loading ? (
          null
        ) : user && userRole === 'user' ? (
          <>
            <ClientDashboard user={user} onLogout={handleLogout} />
            <TermsInfo />
          </>
        ) : (
          <Navigate to="/" replace />
        )
      } 
    />
  </Routes>
</Router>
  );
}



export default App;
