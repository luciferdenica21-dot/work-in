import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../config/api';
import { chatsAPI, messagesAPI, ordersAPI, filesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { 
  LogOut, Send, ChevronLeft, User, Mail, Phone, MapPin,
  Plus, Trash2, X, FileText, Info, Settings, MessageSquare, 
  CheckCircle, XCircle, Download, Paperclip, Bell, Search, Filter, Clock, BookOpen, Users
} from 'lucide-react';

const ManagerPanel = ({ user }) => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('all'); 
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('chats'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [scripts, setScripts] = useState(() => {
    const saved = localStorage.getItem('manager_scripts');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?' },
      { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.' }
    ];
  });
  const [newScript, setNewScript] = useState({ title: '', text: '' });
  const [showScriptMenu, setShowScriptMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('manager_scripts', JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?._id) initSocket(user._id, 'admin', user.email);
    return () => disconnectSocket();
  }, [user]);

  const loadChats = async () => {
    try {
      const data = await chatsAPI.getAll();
      setChats(data || []);
    } catch (error) { console.error('Error loading chats:', error); }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data || []);
    } catch (error) { console.error('Error loading orders:', error); }
  };

  useEffect(() => {
    loadChats();
    loadOrders();
    const interval = setInterval(() => {
        loadChats();
        loadOrders();
    }, 5000);

    const socket = getSocket();
    if (socket) {
      socket.on('new-chat-message', (payload) => {
        loadChats();
        if (payload.chatId === activeId) {
          setMessages(prev => {
            const exists = prev.find(m => (m._id || m.id) === (payload.message._id || payload.message.id));
            if (exists) return prev;
            return [...prev, payload.message];
          });
        }
      });
      socket.on('message-deleted', ({ messageId }) => {
        setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
      });
      return () => {
        socket.off('new-chat-message');
        socket.off('message-deleted');
        clearInterval(interval);
      };
    }
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    if (!activeId || activeTab !== 'chats') { setMessages([]); return; }
    const loadMessages = async () => {
      try {
        const msgs = await chatsAPI.getMessages(activeId);
        setMessages(msgs || []);
        await chatsAPI.markAsRead(activeId);
        setChats(prev => prev.map(c => c.chatId === activeId ? { ...c, unread: false } : c));
        const socket = getSocket();
        if (socket) socket.emit('join-chat', activeId);
      } catch (error) { console.error(error); }
    };
    loadMessages();
  }, [activeId, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation(); 
    if (!window.confirm("Удалить этот чат и всю историю?")) return;
    
    try {
      await chatsAPI.delete(chatId); 
      const socket = getSocket();
      if (socket) socket.emit('delete-chat', { chatId });
      setChats(prev => prev.filter(c => c.chatId !== chatId));
      if (activeId === chatId) setActiveId(null);
    } catch (err) { 
      console.error('Ошибка удаления чата:', err);
      alert('Не удалось удалить чат на сервере');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Удалить это сообщение?")) return;
    
    try {
      await messagesAPI.delete(msgId);
      const socket = getSocket();
      if (socket) {
        socket.emit('delete-message', { chatId: activeId, messageId: msgId });
      }
      setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
    } catch (err) { 
      console.error('Ошибка удаления сообщения:', err);
      alert('Не удалось удалить сообщение на сервере');
    }
  };

  const handleDeleteOrder = async (chatId, orderIndex) => {
    if (!window.confirm("Удалить заказ?")) return;
    try {
      await ordersAPI.delete(chatId, orderIndex);
      loadOrders();
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении");
    }
  };

  const handleUpdateOrderStatus = async (chatId, orderIndex, status) => {
    try {
      await ordersAPI.updateStatus(chatId, orderIndex, status);
      loadOrders();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    setUploading(true);
    try {
      await filesAPI.upload(file, activeId);
      const msgs = await chatsAPI.getMessages(activeId);
      setMessages(msgs || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const executeSend = async (textOverride) => {
    const textToSend = textOverride || inputText;
    if (!activeId || !textToSend.trim()) return;
    try {
      const socket = getSocket();
      const tempId = Date.now().toString();
      const newMessage = {
        _id: tempId,
        senderId: 'manager',
        text: textToSend,
        createdAt: new Date().toISOString()
      };

      if (socket) {
        socket.emit('send-message', { chatId: activeId, text: textToSend });
      } else {
        await messagesAPI.send(activeId, textToSend);
      }

      setMessages(prev => [...prev, newMessage]);
      if (!textOverride) setInputText("");
      loadChats();
    } catch (err) { console.error(err); }
  };

  const downloadOrdersPDF = () => {
    window.print();
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

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.userEmail?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q));
    }
    return filtered;
  }, [chats, searchQuery]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
    return result;
  }, [orders, filterStatus]);

  const registeredUsers = useMemo(() => {
    const userMap = new Map();
    chats.forEach(c => {
      if (c.chatId && !userMap.has(c.chatId)) {
        userMap.set(c.chatId, { id: c.chatId, email: c.userEmail || 'Пользователь' });
      }
    });
    orders.forEach(o => {
      if (o.chatId && userMap.has(o.chatId)) {
        const existing = userMap.get(o.chatId);
        userMap.set(o.chatId, { 
          ...existing, 
          name: `${o.firstName} ${o.lastName}`,
          phone: o.contact 
        });
      }
    });
    return Array.from(userMap.values());
  }, [chats, orders]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, color: theme.textMain, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      
      {/* ЛЕВОЕ МЕНЮ (SIDEBAR) */}
      <div className="no-print" style={{ 
        width: '80px', 
        display: isMobile && activeId ? 'none' : 'flex', 
        background: theme.sidebar, 
        borderRight: `1px solid ${theme.border}`, 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '30px 0', 
        gap: '24px' 
      }}>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          background: 'linear-gradient(to bottom right, #38bdf8, #1e40af)', 
          borderRadius: '14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '10px'
        }}>
          <User color="#fff" size={20}/>
        </div>
        <button onClick={() => setActiveTab('chats')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'chats' ? theme.accent : theme.textMuted }} title="Чаты"><MessageSquare/></button>
        <button onClick={() => {setActiveTab('users'); setActiveId(null)}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'users' ? theme.accent : theme.textMuted }} title="Все пользователи"><Users/></button>
        <button onClick={() => {setActiveTab('orders'); setActiveId(null)}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'orders' ? theme.accent : theme.textMuted }} title="Заказы"><FileText/></button>
        <button onClick={() => setActiveTab('scripts')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'scripts' ? theme.accent : theme.textMuted }} title="Скрипты"><BookOpen/></button>
        <div style={{ flex: 1 }} />
        <button onClick={() => { removeToken(); navigate('/'); }} style={{ background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer' }}><LogOut/></button>
      </div>

      {activeTab === 'chats' && (
        <>
          <div className="no-print" style={{ 
            width: isMobile ? (activeId ? '0' : 'calc(100% - 80px)') : '380px', 
            display: isMobile && activeId ? 'none' : 'flex', 
            background: theme.sidebar, 
            borderRight: `1px solid ${theme.border}`, 
            flexDirection: 'column' 
          }}>
            <div style={{ padding: '30px', borderBottom: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '11px', fontWeight: 800, color: theme.accent, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>МЕССЕНДЖЕР</h2>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                <input 
                  placeholder="Поиск..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: `1px solid ${theme.border}`, 
                    borderRadius: '12px', 
                    padding: '12px 12px 12px 42px', 
                    color: '#fff', 
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {filteredChats.map(c => (
                <div 
                  key={c.chatId} 
                  onClick={() => setActiveId(c.chatId)} 
                  className="chat-item" 
                  style={{ 
                    padding: '16px', 
                    borderRadius: '1.2rem', 
                    marginBottom: '8px', 
                    cursor: 'pointer', 
                    background: activeId === c.chatId ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                    position: 'relative',
                    border: `1px solid ${activeId === c.chatId ? 'rgba(56, 189, 248, 0.2)' : 'transparent'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{c.userEmail?.split('@')[0]}</div>
                    <div className="chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Trash2 size={16} className="hover-btn" onClick={(e) => handleDeleteChat(e, c.chatId)} style={{ color: theme.danger, opacity: isMobile ? 1 : 0, transition: '0.2s' }} />
                      {c.unread && <div style={{ width: '8px', height: '8px', background: theme.accent, borderRadius: '50%' }} />}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: isMobile && !activeId ? 'none' : 'flex', flexDirection: 'column', background: theme.bg }}>
            {activeId ? (
              <>
                <div style={{ padding: '24px 30px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 10, 10, 0.5)', backdropFilter: 'blur(10px)' }}>
                  {isMobile && <ChevronLeft onClick={() => setActiveId(null)} color={theme.accent} />}
                  <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.05em' }}>{chats.find(c => c.chatId === activeId)?.userEmail}</div>
                </div>
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map(m => {
                    const isMan = m.senderId === 'manager';
                    const mid = m._id || m.id;
                    return (
                      <div key={mid} className="msg-wrapper" style={{ alignSelf: isMan ? 'flex-end' : 'flex-start', maxWidth: '80%', position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isMan ? 'row' : 'row-reverse' }}>
                        {isMan && (
                          <button onClick={() => handleDeleteMessage(mid)} className="hover-btn" style={{ background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', opacity: isMobile ? 0.7 : 0, padding: '5px' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <div style={{ 
                          padding: '14px 20px', 
                          borderRadius: isMan ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                          fontSize: '13px', 
                          background: isMan ? theme.accent : theme.card, 
                          color: isMan ? '#000' : '#fff',
                          border: isMan ? 'none' : `1px solid ${theme.border}`,
                          boxShadow: isMan ? '0 4px 15px rgba(56, 189, 248, 0.2)' : 'none'
                        }}>
                          {m.text && <p style={{ margin: 0, lineHeight: '1.5' }}>{m.text}</p>}
                          {m.attachments && m.attachments.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {m.attachments.map((att, idx) => {
                                const fileUrl = filesAPI.getFileUrl(att.filename);
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename);
                                return (
                                  <div key={idx}>
                                    {isImage ? (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={fileUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                      </a>
                                    ) : (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMan ? '#000' : theme.accent, textDecoration: 'none', fontSize: '12px', fontWeight: 700, background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <Download size={14} />
                                        <span>{att.originalName || 'Скачать файл'}</span>
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '24px 30px', background: theme.sidebar, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '15px', alignItems: 'center', position: 'relative' }}>
                  {showScriptMenu && (
                    <div style={{ position: 'absolute', bottom: '90px', left: '30px', background: '#0a0a0a', border: `1px solid ${theme.border}`, borderRadius: '1.5rem', padding: '15px', width: '280px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(20px)' }}>
                      <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>БЫСТРЫЕ ОТВЕТЫ</div>
                      {scripts.map(s => (
                        <div key={s.id} onClick={() => { executeSend(s.text); setShowScriptMenu(false); }} style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', marginBottom: '4px' }} className="script-item-hover">{s.title}</div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setShowScriptMenu(!showScriptMenu)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', width: '45px', height: '45px', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20}/></button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', width: '45px', height: '45px', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uploading ? <div className="spinner" /> : <Paperclip size={20} />}
                  </button>
                  <input 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && executeSend()} 
                    placeholder="Напишите сообщение..." 
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '14px 20px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                  />
                  <button onClick={() => executeSend()} style={{ background: theme.accent, border: 'none', borderRadius: '14px', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)' }}>
                    <Send size={22} color="#000" />
                  </button>
                </div>
              </>
            ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '14px', fontWeight: 300, letterSpacing: '0.1em' }}>ВЫБЕРИТЕ ЧАТ ДЛЯ НАЧАЛА ОБЩЕНИЯ</div>}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div style={{ flex: 1, padding: isMobile ? '30px 20px' : '60px 40px', overflowY: 'auto', background: theme.bg }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.1em', color: theme.textMain, textTransform: 'uppercase' }}>УПРАВЛЕНИЕ ЗАКАЗАМИ</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ background: theme.sidebar, color: '#fff', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px 16px', fontSize: '13px', outline: 'none' }}
              >
                <option value="all">Все статусы</option>
                <option value="new">Новые</option>
                <option value="accepted">Приняты</option>
                <option value="declined">Отклонены</option>
              </select>
              <button onClick={downloadOrdersPDF} style={{ background: theme.accent, color: '#000', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                <Download size={18} /> Печать PDF
              </button>
            </div>
          </div>

          <div id="orders-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: theme.textMuted }}>
                <FileText size={48} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
                <p style={{ fontSize: '14px', fontWeight: 300 }}>Заказов не найдено</p>
              </div>
            ) : (
              filteredOrders.map((o, idx) => (
                <div key={`${o.chatId}-${idx}`} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, letterSpacing: '0.1em' }}>ЗАКАЗ КЛИЕНТА</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.accent }}>{o.userEmail}</div>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleUpdateOrderStatus(o.chatId, idx, 'accepted')} style={{ background: o.status === 'accepted' ? theme.success : 'transparent', border: `1px solid ${theme.success}`, color: o.status === 'accepted' ? '#000' : theme.success, padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>ПРИНЯТЬ</button>
                      <button onClick={() => handleUpdateOrderStatus(o.chatId, idx, 'declined')} style={{ background: o.status === 'declined' ? theme.danger : 'transparent', border: `1px solid ${theme.danger}`, color: o.status === 'declined' ? '#fff' : theme.danger, padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>ОТКЛОНИТЬ</button>
                      <button onClick={() => handleDeleteOrder(o.chatId, idx)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, color: theme.textMuted, padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                    <div className="only-print" style={{ fontWeight: 800 }}>СТАТУС: {o.status?.toUpperCase()}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: `1px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800 }}>ВЫБРАННЫЕ УСЛУГИ:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {o.services?.map((s, i) => (
                          <span key={i} style={{ fontSize: '11px', background: `rgba(56, 189, 248, 0.1)`, color: theme.accent, padding: '6px 12px', borderRadius: '8px', border: `1px solid rgba(56, 189, 248, 0.2)`, fontWeight: 700 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: `1px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800 }}>ДАННЫЕ КЛИЕНТА:</div>
                      <div style={{ fontSize: '14px', color: theme.textMain, fontWeight: 800 }}>{o.firstName} {o.lastName}</div>
                      <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '6px' }}>{o.contact}</div>
                    </div>
                  </div>

                  {o.comment && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '1.5rem', border: `1px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '10px', fontWeight: 800 }}>КОММЕНТАРИЙ:</div>
                      <div style={{ fontSize: '13px', color: theme.textMain, fontStyle: 'italic', lineHeight: '1.6', fontWeight: 300 }}>"{o.comment}"</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ flex: 1, padding: isMobile ? '30px 20px' : '60px 40px', overflowY: 'auto', background: theme.bg }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.1em', color: theme.textMain, textTransform: 'uppercase', marginBottom: '40px' }}>ПОЛЬЗОВАТЕЛИ САЙТА</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {registeredUsers.map(u => (
              <div key={u.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '54px', height: '54px', background: 'linear-gradient(to bottom right, #38bdf8, #1e40af)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User color="#fff" size={24}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || u.email.split('@')[0]}</div>
                  <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{u.email}</div>
                  {u.phone && <div style={{ fontSize: '11px', color: theme.accent, marginTop: '6px', fontWeight: 700 }}>{u.phone}</div>}
                </div>
                <button onClick={() => { setActiveId(u.id); setActiveTab('chats'); }} style={{ background: 'rgba(56, 189, 248, 0.1)', border: `1px solid rgba(56, 189, 248, 0.2)`, color: theme.accent, borderRadius: '12px', padding: '12px', cursor: 'pointer' }}><MessageSquare size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scripts' && (
        <div style={{ flex: 1, padding: isMobile ? '30px 20px' : '60px 40px', overflowY: 'auto', background: theme.bg }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.1em', color: theme.textMain, textTransform: 'uppercase', marginBottom: '40px' }}>БЫСТРЫЕ ОТВЕТЫ</h2>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '30px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ДОБАВИТЬ НОВЫЙ СКРИПТ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input value={newScript.title} onChange={e => setNewScript({...newScript, title: e.target.value})} placeholder="Заголовок (напр. Оплата)" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '14px', outline: 'none' }} />
              <textarea value={newScript.text} onChange={e => setNewScript({...newScript, text: e.target.value})} placeholder="Текст сообщения..." rows="4" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '14px', color: '#fff', resize: 'none', fontSize: '14px', outline: 'none' }} />
              <button onClick={() => { if(!newScript.title || !newScript.text) return; setScripts([...scripts, { ...newScript, id: Date.now() }]); setNewScript({ title: '', text: '' }); }} style={{ background: theme.accent, color: '#000', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 900, cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>СОХРАНИТЬ СКРИПТ</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {scripts.map(s => (
              <div key={s.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '2rem', padding: '24px', position: 'relative' }}>
                <button onClick={() => setScripts(scripts.filter(item => item.id !== s.id))} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', opacity: 0.6 }}><X size={18}/></button>
                <div style={{ fontWeight: 800, color: theme.accent, marginBottom: '12px', fontSize: '15px', textTransform: 'uppercase' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, lineHeight: '1.6', fontWeight: 300 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .chat-item:hover .hover-btn, .msg-wrapper:hover .hover-btn { opacity: 1 !important; }
        .script-item-hover:hover { background: rgba(56, 189, 248, 0.15); color: ${theme.accent}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 10px; }
        .spinner { width: 20px; height: 20px; border: 2px solid rgba(56,189,248,0.2); border-top-color: ${theme.accent}; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .only-print { display: none; }
        @media print {
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          body, html { background: #fff !important; color: #000 !important; }
          #orders-print-area { display: block !important; }
          #orders-print-area > div { 
            break-inside: avoid; 
            border: 1px solid #ddd !important; 
            margin-bottom: 20px !important;
            background: #fff !important;
            color: #000 !important;
            padding: 20px !important;
            border-radius: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagerPanel;