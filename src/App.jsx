import './i18n';
import { useState, useEffect, lazy, Suspense } from 'react' 
import { useTranslation } from 'react-i18next'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

 useEffect(() => {
   const isCoarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
   if (!isCoarse) return;
   const onTouchStart = (e) => {
     const t = e.touches && e.touches[0];
     if (!t) return;
     touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
   };
   const onTouchEnd = (e) => {
     const t = e.changedTouches && e.changedTouches[0];
     if (!t) return;
     const dx = t.clientX - touchStart.current.x;
     const dy = t.clientY - touchStart.current.y;
     const dt = Date.now() - touchStart.current.t;
     if (dt < 600 && Math.abs(dy) < 80 && dx < -60) {
       if (window.history.length > 1) {
         window.history.back();
       }
     }
   };
   document.addEventListener('touchstart', onTouchStart, { passive: true });
   document.addEventListener('touchend', onTouchEnd, { passive: true });
   return () => {
     document.removeEventListener('touchstart', onTouchStart);
     document.removeEventListener('touchend', onTouchEnd);
   };
 }, []);

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
