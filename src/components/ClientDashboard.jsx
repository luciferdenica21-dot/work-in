import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, chatsAPI, ordersAPI } from '../config/api';
import { 
  User, Mail, Phone, MapPin, LogOut, Edit2, 
  FileText, MessageSquare, Package, CheckCircle, 
  XCircle, Clock, ArrowLeft, Settings
} from 'lucide-react';

const ClientDashboard = ({ user: initialUser, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [chat, setChat] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    city: user?.city || ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile
        const userData = await authAPI.getMe();
        setUser(userData);
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          city: userData.city || ''
        });

        // Load chat
        const chatData = await chatsAPI.getMyChat();
        setChat(chatData);
        setOrders(chatData.orders || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const updated = await authAPI.updateProfile(profileData);
      setUser(updated);
      setEditingProfile(false);
      alert('Профиль обновлен');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ошибка обновления профиля');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'declined':
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-yellow-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return 'Принят';
      case 'declined':
        return 'Отклонен';
      default:
        return 'Ожидает';
    }
  };

  const theme = {
    bg: '#020617',
    sidebar: '#0f172a',
    card: 'rgba(30, 41, 59, 0.5)',
    accent: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.1)',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    danger: '#ef4444',
    success: '#10b981'
  };

  if (loading) {
    return (
      <div style={{ background: theme.bg, color: theme.textMain, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .dashboard-header { padding: 15px 20px !important; }
            .header-title { display: none; }
            .dashboard-container { flex-direction: column !important; padding: 20px 15px !important; gap: 20px !important; }
            .sidebar-area { width: 100% !important; }
            .chat-link-content { flex-direction: column; gap: 15px; text-align: center; }
            .chat-link-content button { width: 100%; }
          }
        `}
      </style>
      
      {/* Header */}
      <div className="dashboard-header" style={{ background: theme.sidebar, borderBottom: `1px solid ${theme.border}`, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>На главную</span>
          </button>
          <div className="header-title" style={{ width: '1px', height: '24px', background: theme.border }}></div>
          <h1 className="header-title" style={{ fontSize: '24px', fontWeight: 800, color: theme.accent, margin: 0 }}>ЛИЧНЫЙ КАБИНЕТ</h1>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.danger}`,
            color: theme.danger,
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '14px' }}>Выйти</span>
        </button>
      </div>

      <div className="dashboard-container" style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', gap: '40px' }}>
        {/* Sidebar */}
        <div className="sidebar-area" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Card */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', background: theme.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={30} color="#000" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: theme.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: theme.accent,
                    flexShrink: 0
                  }}
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {editingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Имя"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: theme.textMain,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  placeholder="Фамилия"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: theme.textMain,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Телефон"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: theme.textMain,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  placeholder="Город"
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: theme.textMain,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleUpdateProfile}
                    style={{
                      flex: 1,
                      background: theme.accent,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#000',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        phone: user?.phone || '',
                        city: user?.city || ''
                      });
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '10px',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textMuted }}>
                    <Phone size={16} />
                    {user.phone}
                  </div>
                )}
                {user?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textMuted }}>
                    <MapPin size={16} />
                    {user.city}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textMuted }}>
                  <Mail size={16} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Статистика
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: theme.textMuted }}>Заказов</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: theme.accent }}>{orders.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: theme.textMuted }}>Новых</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: theme.accent }}>
                  {orders.filter(o => o.status === 'new').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: theme.textMuted }}>Принятых</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: theme.success }}>
                  {orders.filter(o => o.status === 'accepted').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Orders */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.accent, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={24} />
                МОИ ЗАКАЗЫ
              </h2>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div style={{ fontSize: '16px' }}>У вас пока нет заказов</div>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    marginTop: '20px',
                    background: theme.accent,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Создать заказ
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map((order, index) => (
                  <div
                    key={index}
                    style={{
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {getStatusIcon(order.status)}
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textMain }}>
                            Заказ #{index + 1}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: order.status === 'accepted' ? `${theme.success}33` : 
                                   order.status === 'declined' ? `${theme.danger}33` : 
                                   `${theme.textMuted}33`,
                        color: order.status === 'accepted' ? theme.success : 
                               order.status === 'declined' ? theme.danger : 
                               theme.textMuted,
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        {getStatusText(order.status)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '8px' }}>Услуги:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {order.services?.map((service, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: `${theme.accent}22`,
                              border: `1px solid ${theme.accent}44`,
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              color: theme.accent
                            }}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {order.comment && (
                      <div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Комментарий:</div>
                        <div style={{ fontSize: '14px', color: theme.textMain, background: `${theme.bg}`, padding: '12px', borderRadius: '8px', wordBreak: 'break-word' }}>
                          {order.comment}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Контакты:</div>
                        <div style={{ color: theme.textMain, wordBreak: 'break-all' }}>{order.contact}</div>
                      </div>
                      {(order.firstName || order.lastName) && (
                        <div>
                          <div style={{ fontSize: '12px', color: theme.textMuted }}>Имя:</div>
                          <div style={{ color: theme.textMain }}>{order.firstName} {order.lastName}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Link */}
          {chat && (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
              <div className="chat-link-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.accent, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <MessageSquare size={24} />
                    ЧАТ С ПОДДЕРЖКОЙ
                  </h2>
                  <div style={{ fontSize: '14px', color: theme.textMuted }}>
                    Свяжитесь с нами через виджет чата на главной странице
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: theme.accent,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Открыть чат
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;