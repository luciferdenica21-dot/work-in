import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, chatsAPI, ordersAPI, filesAPI } from '../config/api';
import ChatWidget from './ChatWidget';
import { 
  User, Mail, Phone, MapPin, LogOut, Edit2, 
  FileText, MessageSquare, Package, CheckCircle, 
  XCircle, Clock, ArrowLeft, Settings, Trash2
} from 'lucide-react';

const ClientDashboard = ({ user: initialUser }) => {
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
        const userData = await authAPI.me();
        setUser(userData);
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          city: userData.city || ''
        });

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
  }, [authAPI, chatsAPI]);

  const handleUpdateProfile = async () => {
    try {
      const updated = await authAPI.updateProfile(profileData);
      setUser(updated);
      setEditingProfile(false);
      alert(t('profile_updated_success'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('profile_updated_error'));
    }
  };

  const handleDeleteOrder = async (orderIndex) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }

    try {
      if (!chat?.chatId) {
        throw new Error('Chat not loaded');
      }

      await ordersAPI.delete(chat.chatId, orderIndex);
      
      // Обновляем локальный список заказов
      const newOrders = orders.filter((_, idx) => idx !== orderIndex);
      setOrders(newOrders);
      
      // Обновляем данные чата
      const updatedChat = await chatsAPI.getMyChat();
      setChat(updatedChat);
      setOrders(updatedChat.orders || []);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Ошибка при удалении заказа: ' + error.message);
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
        return t('status_accepted');
      case 'declined':
        return t('status_declined');
      default:
        return t('status_pending');
    }
  };

  const getAbsoluteFileUrl = (fileUrl) => {
    return filesAPI.getFileUrl(fileUrl);
  };

  const renderOrderFile = (file) => {
    const url = getAbsoluteFileUrl(file.url);
    if (!url) return null;

    if (file.type?.startsWith('image/')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <img
            src={url}
            alt={file.name}
            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '14px', border: `1px solid ${theme.border}` }}
          />
        </a>
      );
    }

    if (file.type?.startsWith('video/')) {
      return (
        <video
          src={url}
          controls
          style={{ width: '100%', height: '180px', borderRadius: '14px', border: `1px solid ${theme.border}` }}
        />
      );
    }

    if (file.type?.startsWith('audio/')) {
      return (
        <audio
          src={url}
          controls
          style={{ width: '100%' }}
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.accent, fontSize: '12px', fontWeight: 700, textDecoration: 'underline' }}
      >
        <FileText size={16} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
      </a>
    );
  };

  const theme = {
    bg: '#050505',
    sidebar: '#0a0a0a',
    card: 'rgba(255, 255, 255, 0.03)',
    accent: '#38bdf8',
    border: 'rgba(255, 255, 255, 0.1)',
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
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 100, 
      overflowY: 'auto', 
      background: theme.bg, 
      color: theme.textMain, 
      fontFamily: 'Inter, sans-serif' 
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#050505', opacity: 0.95, backdropFilter: 'blur(40px)' }} />
      
      <style>
        {`
          @media (max-width: 768px) {
            .dashboard-header { padding: 0 15px !important; height: 60px !important; }
            .header-logo { width: 35px !important; height: 35px !important; }
            .header-brand-text { font-size: 11px !important; letter-spacing: 0.15em !important; }
            .header-title { font-size: 14px !important; letter-spacing: 0.1em !important; }
            .back-btn-text { display: none; }
            .dashboard-container { flex-direction: column !important; padding: 80px 15px 40px !important; gap: 20px !important; }
            .sidebar-area { width: 100% !important; }
            .order-card-header { flex-direction: column !important; align-items: flex-start !important; gap: 15px !important; }
            .order-status-badge { align-self: flex-start !important; }
            .chat-link-content { flex-direction: column; gap: 20px; text-align: center; }
            .chat-link-content button { width: 100%; }
            .stats-container { grid-template-columns: 1fr !important; }
            .card-padding { padding: 20px !important; border-radius: 1.5rem !important; }
            .order-grid { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
      
      <div className="dashboard-header" style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        background: 'rgba(10, 10, 10, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid rgba(56, 189, 248, 0.2)`, 
        padding: '0 40px', 
        height: '80px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} />
            <span className="back-btn-text" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('back_to_home')}</span>
          </button>
        </div>
      </div>

      <div className="dashboard-container" style={{ display: 'flex', maxWidth: '1280px', margin: '0 auto', padding: '120px 20px 60px', gap: '30px' }}>
        <div className="sidebar-area" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-padding" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '50px', height: '50px', background: 'linear-gradient(to bottom right, #38bdf8, #1e40af)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={24} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: theme.accent,
                    flexShrink: 0
                  }}
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {editingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder={t('placeholder_first_name')}
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px', color: theme.textMain, outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder={t('placeholder_last_name')}
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px', color: theme.textMain, outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
                <input
                  type="tel"
                  placeholder={t('placeholder_phone')}
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px', color: theme.textMain, outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder={t('placeholder_city')}
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px', color: theme.textMain, outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={handleUpdateProfile} style={{ flex: 1, background: '#38bdf8', border: 'none', borderRadius: '12px', padding: '12px', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: '12px' }}>{t('save')}</button>
                  <button onClick={() => { setEditingProfile(false); setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '', city: user?.city || '' }); }} style={{ flex: 1, background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px', color: theme.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>{t('cancel')}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: theme.textMuted }}>
                    <Phone size={14} className="text-blue-400" /> {user.phone}
                  </div>
                )}
                {user?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: theme.textMuted }}>
                    <MapPin size={14} className="text-blue-400" /> {user.city}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: theme.textMuted }}>
                  <Mail size={14} className="text-blue-400" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card-padding" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '30px' }}>
            <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{t('statistics')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: theme.textMuted }}>{t('stat_orders')}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: theme.accent }}>{orders.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: theme.textMuted }}>{t('stat_new')}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: theme.accent }}> {orders.filter(o => o.status === 'new').length} </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: theme.textMuted }}>{t('stat_accepted')}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: theme.success }}> {orders.filter(o => o.status === 'accepted').length} </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-padding" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '3rem', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={22} color={theme.accent} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: theme.accent, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                <MessageSquare size={24} />
                {t('my_orders')}
              </h2>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                <FileText size={48} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
                <p style={{ fontSize: '14px', fontWeight: 300 }}>{t('no_orders')}</p>
                <button onClick={() => navigate('/')} style={{ background: '#38bdf8', border: 'none', borderRadius: '12px', padding: '14px 28px', color: '#000', cursor: 'pointer', fontWeight: 800, marginTop: '24px', fontSize: '12px', textTransform: 'uppercase' }}>{t('make_order')}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order, idx) => (
                  <div key={idx} className="card-padding" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '24px' }}>
                    <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>{t('order_number')} #{idx + 1}</div>
                        <div style={{ fontSize: '13px', color: theme.textMuted }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="order-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${order.status === 'accepted' ? theme.success : order.status === 'declined' ? theme.danger : theme.accent}15`, padding: '8px 16px', borderRadius: '10px', border: `1px solid ${order.status === 'accepted' ? theme.success : order.status === 'declined' ? theme.danger : theme.accent}30` }}>
                          {getStatusIcon(order.status)}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: order.status === 'accepted' ? theme.success : order.status === 'declined' ? theme.danger : theme.accent }}>
                            {getStatusText(order.status).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Кнопка удаления заказа */}
                        <button
                          onClick={() => handleDeleteOrder(idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: theme.danger,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Удалить заказ"
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="order-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>{t('selected_services')}:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {order.services?.map((s, i) => (
                            <span key={i} style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.1)', color: theme.accent, padding: '5px 12px', borderRadius: '8px', border: `1px solid rgba(56, 189, 248, 0.2)`, fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>{t('client_data')}:</div>
                        <div style={{ fontSize: '14px', color: theme.textMain, fontWeight: 700 }}>{order.firstName} {order.lastName}</div>
                        <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '6px' }}>{order.contact}</div>
                      </div>
                    </div>

                    {order.comment && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '10px', fontWeight: 800 }}>{t("Комментарий к заказу")}:</div>
                        <div style={{ fontSize: '13px', color: theme.textMain, fontStyle: 'italic', lineHeight: '1.6', fontWeight: 300 }}>"{order.comment}"</div>
                      </div>
                    )}

                    {order.files && order.files.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
<div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>
  {t('Файлы заказа:')}
</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                          {order.files.map((file) => (
                            <div key={file.id || file.url || file.name}>
                              {renderOrderFile(file)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(order.managerDate || order.priceGel || order.priceUsd || order.priceEur || order.managerComment) && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
  <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>
    {t('Примечание менеджера:')}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
    {order.managerDate && (
      <div style={{ fontSize: '12px', color: theme.textMain }}>
        <span style={{ color: theme.textMuted, fontSize: '11px' }}>{t('Дата: ')}</span>
        {new Date(order.managerDate).toLocaleDateString()}
      </div>
    )}
    {(order.priceGel || order.priceUsd || order.priceEur) && (
      <div style={{ fontSize: '12px', color: theme.textMain }}>
        <span style={{ color: theme.textMuted, fontSize: '11px' }}>{t('Цена: ')}</span>
        {[order.priceGel ? `₾ ${order.priceGel}` : null, order.priceUsd ? `$ ${order.priceUsd}` : null, order.priceEur ? `€ ${order.priceEur}` : null].filter(Boolean).join(' / ')}
      </div>
    )}
  </div>
  {order.managerComment && (
    <div style={{ fontSize: '13px', color: theme.textMain, marginTop: '10px' }}>
      <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800 }}>{t('Комментарий:')}</div>
      <div style={{ lineHeight: '1.6', fontWeight: 300 }}>{order.managerComment}</div>
    </div>
  )}
</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!chat && (
            <div className="card-padding" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1e293b 100%)', border: `1px solid rgba(56, 189, 248, 0.2)`, borderRadius: '2rem', padding: '30px' }}>
              <div className="chat-link-content" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: theme.accent, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <MessageSquare size={24} />
                    {t('support_chat')}
                  </h2>
                  <div style={{ fontSize: '13px', color: theme.textMuted, fontWeight: 300 }}>
                    {t('support_chat_description')}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: '#38bdf8',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {t('open_chat')}
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatWidget user={user} />
    </div>
  );
};

export default ClientDashboard;
