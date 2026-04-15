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
import SignDocumentView from './components/SignDocumentView';
import { authAPI, getToken, removeToken, setToken } from './config/api';
import { initAnalyticsTracker } from './config/analyticsTracker';
import { supabase } from './config/supabaseClient';

function App() {
  const { i18n } = useTranslation(); 
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pendingOrderRef = useRef(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // removed unused touchStart

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
    if (pendingOrderRef.current) {
      pendingOrderRef.current = false;
      setIsOrderOpen(true);
    }
  };

  const handleRequireAuthForOrder = () => {
    pendingOrderRef.current = true;
    setIsAuthOpen(true);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setUserRole(null);
  };

  const AuthCallback = () => {
    const navigate = useNavigate();
    const [authError, setAuthError] = useState('');

    useEffect(() => {
      const run = async () => {
        try {
          const url = new URL(window.location.href);
          const errDesc = url.searchParams.get('error_description') || url.searchParams.get('error');
          if (errDesc) {
            setAuthError(String(errDesc));
            return;
          }

          const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
          const hashAccessToken = hashParams.get('access_token');
          if (hashAccessToken) {
            try { window.history.replaceState({}, document.title, url.pathname + url.search); } catch { void 0; }
            const exchanged = await authAPI.supabaseExchange(hashAccessToken);
            setToken(exchanged.token);

            const me = await authAPI.me();
            setUser(me);
            setUserRole(me.role);

            if (me.role === 'admin') {
              navigate('/manager', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
            return;
          }

          const code = url.searchParams.get('code');
          if (code) {
            const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exErr) throw exErr;
          }

          let { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          let accessToken = data?.session?.access_token;
          if (!accessToken) {
            accessToken = await new Promise((resolve) => {
              const sub = supabase.auth.onAuthStateChange((_event, session) => {
                if (session?.access_token) {
                  sub.data.subscription.unsubscribe();
                  resolve(session.access_token);
                }
              });
              setTimeout(() => {
                sub.data.subscription.unsubscribe();
                resolve('');
              }, 2500);
            });
          }

          if (!accessToken) {
            navigate('/', { replace: true });
            return;
          }

          const exchanged = await authAPI.supabaseExchange(accessToken);
          setToken(exchanged.token);

          const me = await authAPI.me();
          setUser(me);
          setUserRole(me.role);

          if (me.role === 'admin') {
            navigate('/manager', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } catch (e) {
          console.error('Supabase callback error:', e);
          removeToken();
          setUser(null);
          setUserRole(null);
          setAuthError(String(e?.message || e));
        }
      };
      run();
    }, [navigate]);

    if (authError) {
      return (
        <div style={{ background: '#050a18', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Ошибка входа</div>
            <div style={{ opacity: 0.8, wordBreak: 'break-word' }}>{authError}</div>
            <button
              onClick={() => navigate('/', { replace: true })}
              style={{ marginTop: 16, background: '#2563eb', color: 'white', padding: '10px 14px', borderRadius: 10 }}
            >
              На главную
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ background: '#050a18', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
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
        onRequireAuthForOrder={handleRequireAuthForOrder}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        <Hero />
       <Services 
  user={user} 
  setIsAuthOpen={setIsAuthOpen} 
  setIsOrderOpen={setIsOrderOpen}
  isOrderOpen={isOrderOpen}
  onLogout={handleLogout}
  onRequireAuthForOrder={handleRequireAuthForOrder}
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
    <Route path="/auth/callback" element={<AuthCallback />} />
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
    <Route path="/sign/:id" element={<SignDocumentView />} />
  </Routes>
</Router>
  );
}



export default App;
