import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../config/api';
import { chatsAPI, messagesAPI, ordersAPI, filesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { 
  LogOut, Send, ChevronLeft, User, Mail, Phone, MapPin,
  Plus, Trash2, X, FileText, Info, Settings, MessageSquare, 
  CheckCircle, XCircle, Download, Paperclip, Bell, Search, Filter
} from 'lucide-react';

const ManagerPanel = ({ user }) => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
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

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000);
    const socket = getSocket();
    if (socket) {
      socket.on('new-chat-message', loadChats);
      // Слушаем удаление сообщений глобально
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
  }, []);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
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
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- УЛУЧШЕННЫЕ ФУНКЦИИ УДАЛЕНИЯ ---
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation(); // Чтобы не открылся чат при клике
    if (!window.confirm("Удалить этот чат и всю историю?")) return;
    
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('delete-chat', { chatId });
      }
      // Локальное обновление
      setChats(prev => prev.filter(c => c.chatId !== chatId));
      if (activeId === chatId) setActiveId(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Удалить это сообщение?")) return;
    
    try {
      const socket = getSocket();
      if (socket) {
        // Отправляем запрос на удаление через сокет
        socket.emit('delete-message', { chatId: activeId, messageId: msgId });
      }
      // Мгновенное локальное удаление для плавности
      setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
    } catch (err) { console.error(err); }
  };

  const executeSend = async (textOverride) => {
    const textToSend = textOverride || inputText;
    if (!activeId || !textToSend.trim()) return;
    try {
      const socket = getSocket();
      if (socket) socket.emit('send-message', { chatId: activeId, text: textToSend });
      else await messagesAPI.send(activeId, textToSend);
      if (!textOverride) setInputText("");
    } catch (err) { console.error(err); }
  };

  const theme = {
    bg: '#020617', sidebar: '#0f172a', card: 'rgba(30, 41, 59, 0.5)',
    accent: '#38bdf8', border: 'rgba(56, 189, 248, 0.1)',
    textMain: '#f8fafc', textMuted: '#94a3b8', danger: '#ef4444'
  };

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.userEmail?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q));
    }
    return filtered;
  }, [chats, searchQuery]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, color: theme.textMain, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      
      {/* ЛЕВОЕ МЕНЮ */}
      <div style={{ width: isMobile ? '60px' : '80px', display: isMobile && activeId ? 'none' : 'flex', background: '#020617', borderRight: `1px solid ${theme.border}`, flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
        <div style={{ width: '36px', height: '36px', background: theme.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User color="#000" size={20}/></div>
        <button onClick={() => setActiveTab('chats')} style={{ background: 'transparent', border: 'none', color: activeTab === 'chats' ? theme.accent : theme.textMuted }}><MessageSquare/></button>
        <button onClick={() => {setActiveTab('orders'); setActiveId(null)}} style={{ background: 'transparent', border: 'none', color: activeTab === 'orders' ? theme.accent : theme.textMuted }}><FileText/></button>
        <div style={{ flex: 1 }} />
        <button onClick={() => { removeToken(); navigate('/'); }} style={{ background: 'transparent', border: 'none', color: theme.danger }}><LogOut/></button>
      </div>

      {/* СПИСОК ЧАТОВ */}
      <div style={{ width: isMobile ? (activeId ? '0' : 'calc(100% - 60px)') : '380px', display: isMobile && activeId ? 'none' : 'flex', background: theme.sidebar, borderRight: `1px solid ${theme.border}`, flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: theme.accent, marginBottom: '16px' }}>МЕССЕНДЖЕР</h2>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
            <input placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px 10px 10px 35px', color: '#fff', fontSize: '13px' }} />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {filteredChats.map(c => (
            <div 
              key={c.chatId} onClick={() => setActiveId(c.chatId)} 
              className="chat-item"
              style={{ padding: '14px', borderRadius: '14px', marginBottom: '8px', cursor: 'pointer', background: activeId === c.chatId ? 'rgba(56, 189, 248, 0.1)' : 'transparent', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.userEmail?.split('@')[0]}</div>
                <div className="chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 
                    size={16} 
                    className="hover-btn" 
                    onClick={(e) => handleDeleteChat(e, c.chatId)} 
                    style={{ color: theme.danger, opacity: isMobile ? 1 : 0, transition: '0.2s' }} 
                  />
                  {c.unread && <div style={{ width: '8px', height: '8px', background: theme.accent, borderRadius: '50%' }} />}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ОКНО СООБЩЕНИЙ */}
      <div style={{ flex: 1, display: isMobile && !activeId ? 'none' : 'flex', flexDirection: 'column' }}>
        {activeId ? (
          <>
            <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isMobile && <ChevronLeft onClick={() => setActiveId(null)} />}
              <div style={{ fontWeight: 700 }}>{chats.find(c => c.chatId === activeId)?.userEmail}</div>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(m => {
                const isMan = m.senderId === 'manager';
                const mid = m._id || m.id;
                return (
                  <div key={mid} className="msg-wrapper" style={{ alignSelf: isMan ? 'flex-end' : 'flex-start', maxWidth: '80%', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMan ? 'row' : 'row-reverse' }}>
                    {isMan && (
                      <button onClick={() => handleDeleteMessage(mid)} className="hover-btn" style={{ background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', opacity: isMobile ? 0.7 : 0, padding: '5px' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div style={{ padding: '12px 16px', borderRadius: '16px', fontSize: '13px', background: isMan ? theme.accent : theme.card, color: isMan ? '#000' : '#fff' }}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '20px', background: theme.sidebar, display: 'flex', gap: '10px' }}>
              <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && executeSend()} placeholder="Напишите сообщение..." style={{ flex: 1, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px 15px', color: '#fff' }} />
              <button onClick={() => executeSend()} style={{ background: theme.accent, border: 'none', borderRadius: '12px', width: '48px', cursor: 'pointer' }}><Send size={20} color="#000" /></button>
            </div>
          </>
        ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>Выберите чат</div>}
      </div>

      <style>{`
        .chat-item:hover .hover-btn, .msg-wrapper:hover .hover-btn { opacity: 1 !important; }
        ::-webkit-scrollbar { width: 0px; }
        * { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
};

export default ManagerPanel;