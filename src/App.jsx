import './i18n';
import { useState, useEffect } from 'react' 
import { useTranslation } from 'react-i18next'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Contact from './components/Contact';
import OrderSidebar from './components/OrderSidebar';
import AuthModal from './components/AuthModal';
import ChatWidget from './components/ChatWidget';
import ManagerPanel from './components/ManagerPanelPro';
import ClientDashboard from './components/ClientDashboard';
import TermsInfo from './components/TermsInfo';
import { authAPI, getToken, removeToken } from './config/api';

function App() {
  const { i18n } = useTranslation(); 
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
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
    <div className={`min-h-screen flex flex-col ${i18n.language === 'ka' ? 'font-georgian' : 'font-sans'}`}>
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
    <Route path="/" element={<MainSite />} />
    <Route 
      path="/manager" 
      element={
        loading ? (
          /* Пока идет загрузка, ничего не рендерим или показываем спиннер */
          null 
        ) : user && userRole === 'admin' ? (
          <ManagerPanel user={user} />
        ) : (
          /* Только если загрузка завершена и юзера нет — редирект */
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
