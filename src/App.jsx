import './i18n';
import { useState, useEffect, lazy, Suspense } from 'react' 
import { useTranslation } from 'react-i18next'; 
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import './App.css'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
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
  const pendingOrderRef = useRef({ open: false, serviceKey: null });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.me(); 
      setUser(userData);
      setUserRole(userData.role);
    } catch (error) {
      console.error("Auth check failed:", error);
      removeToken();
      setUser(null);
      setUserRole(null);
    } finally {
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

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setUserRole(userData.role);
    if (pendingOrderRef.current?.open) {
      const svc = pendingOrderRef.current?.serviceKey || null;
      pendingOrderRef.current = { open: false, serviceKey: null };
      setIsOrderOpen(true);
      if (svc) {
        window.dispatchEvent(new CustomEvent('order:prefill', { detail: { serviceKey: svc } }));
      }
    }
  };

  const handleRequireAuthForOrder = (opts) => {
    pendingOrderRef.current = { open: true, serviceKey: opts?.serviceKey || null };
    setIsAuthOpen(true);
  };

  useEffect(() => {
    if (!user) return;
    if (!pendingOrderRef.current?.open) return;
    const svc = pendingOrderRef.current?.serviceKey || null;
    pendingOrderRef.current = { open: false, serviceKey: null };
    setIsOrderOpen(true);
    if (svc) {
      window.dispatchEvent(new CustomEvent('order:prefill', { detail: { serviceKey: svc } }));
    }
  }, [user]);

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

  const MainLayout = ({ children }) => (
    <div className={`min-h-screen flex flex-col ${i18n.language === 'ka' ? 'font-georgian' : 'font-sans'}`} data-section="site">
      <Navbar
        setIsOrderOpen={setIsOrderOpen}
        setIsAuthOpen={setIsAuthOpen}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        {children}
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
              : (
                  <MainLayout>
                    <Hero
                      user={user}
                      setIsOrderOpen={setIsOrderOpen}
                      setIsAuthOpen={setIsAuthOpen}
                      onRequireAuthForOrder={handleRequireAuthForOrder}
                    />
                  </MainLayout>
                )
          } 
        />
        <Route
          path="/services"
          element={
            user && userRole === 'admin'
              ? <Navigate to="/manager" replace />
              : (
                  <MainLayout>
                    <Services
                      user={user}
                      setIsAuthOpen={setIsAuthOpen}
                      setIsOrderOpen={setIsOrderOpen}
                      onRequireAuthForOrder={handleRequireAuthForOrder}
                    />
                  </MainLayout>
                )
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
      {/* ChatWidget вне роутов — не размонтируется при навигации */}
      {user && userRole === 'user' && <ChatWidget user={user} />}
    </Router>
  );
}



export default App;
