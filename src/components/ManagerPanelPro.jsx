import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../config/api';
import { chatsAPI, messagesAPI, ordersAPI, filesAPI, authAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { 
  LogOut, Send, ChevronLeft, User, Mail, Phone, MapPin, Edit, Save, X,
  Plus, Trash2, FileText, Info, Settings, MessageSquare, 
  CheckCircle, XCircle, Download, Paperclip, Bell, Search, Filter, Clock, 
  BookOpen, Users, Home, Package, MessageCircle, Code, Shield, Database, Menu,
  Eye, EyeOff, Upload, RefreshCw, AlertCircle, TrendingUp, Activity, Calendar, ChevronDown, Pin, CheckSquare, Square
 } from 'lucide-react';

const ManagerPanelPro = ({ user }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Функция форматирования размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return '未知大小';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const getAbsoluteFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    return filesAPI.getFileUrl(fileUrl);
  };

  const escapeCsvValue = (value) => {
    const s = value == null ? '' : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadTextFile = (filename, content, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) => {
    const s = value == null ? '' : String(value);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const buildOrderPdfHtml = (ordersList) => {
    const list = Array.isArray(ordersList) ? ordersList : [];
    const safeList = list.map(formatOrderForExport);

    const blocks = safeList.map((o) => {
      const client = [o.firstName, o.lastName].filter(Boolean).join(' ');
      const services = (o.services || []).join(', ');
      const fileBlocks = (o.files || []).map((f) => {
        const url = f?.url;
        const name = f?.name || 'file';
        const type = f?.type || '';
        if (!url) return '';

        const isImage = (typeof type === 'string' && type.startsWith('image/')) ||
          /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);

        if (isImage) {
          return `
            <div class="photo">
              <div class="photo-name">${escapeHtml(name)}</div>
              <img class="photo-img" src="${escapeHtml(url)}" alt="${escapeHtml(name)}" />
            </div>
          `;
        }

        return `
          <div class="file-row">
            <span class="k">Файл:</span>
            <span class="v">${escapeHtml(name)}</span>
          </div>
        `;
      }).filter(Boolean).join('');

      return `
        <div class="order">
          <div class="row"><span class="k">Статус:</span><span class="v">${escapeHtml(o.status || '')}</span></div>
          <div class="row"><span class="k">Chat:</span><span class="v">${escapeHtml(o.chatId || '')}</span></div>
          <div class="row"><span class="k">№:</span><span class="v">${escapeHtml(o.orderIndex ?? '')}</span></div>
          <div class="row"><span class="k">Клиент:</span><span class="v">${escapeHtml(client)}</span></div>
          <div class="row"><span class="k">Контакт:</span><span class="v">${escapeHtml(o.contact || '')}</span></div>
          <div class="row"><span class="k">Телефон:</span><span class="v">${escapeHtml(o.phone || '')}</span></div>
          <div class="row"><span class="k">Город:</span><span class="v">${escapeHtml(o.city || '')}</span></div>
          <div class="row"><span class="k">Услуги:</span><span class="v">${escapeHtml(services || '')}</span></div>
          ${o.comment ? `<div class="row"><span class="k">Комментарий:</span><span class="v">${escapeHtml(o.comment)}</span></div>` : ''}
          ${fileBlocks ? `<div class="photos">${fileBlocks}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Orders Export</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .wrap { padding: 14px; }
            h1 { margin: 0 0 8px 0; font-size: 16px; }
            .meta { margin-bottom: 10px; font-size: 11px; color: #555; }
            .orders { display: flex; flex-direction: column; gap: 16px; }

            .order { page-break-inside: avoid; }
            .row { margin: 2px 0; font-size: 12px; line-height: 1.4; }
            .k { font-weight: 700; margin-right: 6px; }
            .v { font-weight: 400; }
            .photos { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
            .photo-name { font-size: 11px; color: #444; margin-bottom: 6px; word-break: break-word; }
            .photo-img { width: 100%; max-width: 680px; height: auto; border-radius: 10px; display: block; }
            .file-row { margin-top: 6px; font-size: 11px; color: #444; }
            @media print { .wrap { padding: 10mm; } }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>Заказ</h1>
            <div class="meta">Сформировано: ${escapeHtml(new Date().toLocaleString())}</div>
            <div class="orders">${blocks}</div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadOrdersPdf = (ordersList) => {
    const html = buildOrderPdfHtml(ordersList);
    const w = window.open('', '_blank');
    if (!w) {
      alert('Разрешите открытие всплывающих окон для скачивания PDF');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 300);
  };

  const formatOrderForExport = (order) => {
    const safe = order || {};
    return {
      chatId: safe.chatId,
      orderIndex: safe.orderIndex,
      status: safe.status,
      createdAt: safe.createdAt,
      firstName: safe.firstName,
      lastName: safe.lastName,
      contact: safe.contact,
      phone: safe.phone,
      city: safe.city,
      services: safe.services || [],
      comment: safe.comment || safe.comments || safe.note || safe.message || '',
      files: (safe.files || []).map((f) => ({
        id: f?.id,
        name: f?.name,
        type: f?.type,
        size: f?.size,
        url: getAbsoluteFileUrl(f?.url),
      })),
    };
  };

  const downloadOrder = (order, format) => {
    const safe = formatOrderForExport(order);
    const baseName = `order_${safe.chatId || 'chat'}_${safe.orderIndex ?? 'idx'}`;

    if (format === 'json') {
      downloadTextFile(`${baseName}.json`, JSON.stringify(safe, null, 2), 'application/json;charset=utf-8');
      return;
    }

    if (format === 'txt') {
      const lines = [
        `Chat ID: ${safe.chatId || ''}`,
        `Order Index: ${safe.orderIndex ?? ''}`,
        `Status: ${safe.status || ''}`,
        `Created: ${safe.createdAt || ''}`,
        `Client: ${[safe.firstName, safe.lastName].filter(Boolean).join(' ')}`,
        `Contact: ${safe.contact || ''}`,
        `Phone: ${safe.phone || ''}`,
        `City: ${safe.city || ''}`,
        `Services: ${(safe.services || []).join(', ')}`,
        `Comment: ${safe.comment || ''}`,
        `Files:`,
        ...(safe.files || []).map((f) => `- ${f.name || ''} (${f.type || ''}, ${f.size || ''}) ${f.url || ''}`),
      ];
      downloadTextFile(`${baseName}.txt`, lines.join('\n'));
      return;
    }

    if (format === 'csv') {
      const row = {
        chatId: safe.chatId,
        orderIndex: safe.orderIndex,
        status: safe.status,
        createdAt: safe.createdAt,
        firstName: safe.firstName,
        lastName: safe.lastName,
        contact: safe.contact,
        phone: safe.phone,
        city: safe.city,
        services: (safe.services || []).join('|'),
        comment: safe.comment,
        files: (safe.files || []).map((f) => f.url).filter(Boolean).join('|'),
      };
      const headers = Object.keys(row);
      const csv = [
        headers.join(','),
        headers.map((h) => escapeCsvValue(row[h])).join(','),
      ].join('\n');
      downloadTextFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
    }
  };

  const downloadOrdersList = (ordersList, format) => {
    const list = Array.isArray(ordersList) ? ordersList : [];
    const safeList = list.map(formatOrderForExport);
    const baseName = `orders_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      downloadTextFile(`${baseName}.json`, JSON.stringify(safeList, null, 2), 'application/json;charset=utf-8');
      return;
    }

    if (format === 'txt') {
      const txt = safeList.map((o) => {
        const client = [o.firstName, o.lastName].filter(Boolean).join(' ');
        return [
          `# ${o.chatId || ''} / ${o.orderIndex ?? ''}`,
          `Status: ${o.status || ''}`,
          `Client: ${client}`,
          `Contact: ${o.contact || ''}`,
          `Services: ${(o.services || []).join(', ')}`,
          `Files: ${(o.files || []).map((f) => f.url).filter(Boolean).join(', ')}`,
        ].join('\n');
      }).join('\n\n');
      downloadTextFile(`${baseName}.txt`, txt);
      return;
    }

    if (format === 'csv') {
      const headers = [
        'chatId','orderIndex','status','createdAt','firstName','lastName','contact','phone','city','services','comment','files'
      ];
      const rows = safeList.map((o) => {
        const row = {
          chatId: o.chatId,
          orderIndex: o.orderIndex,
          status: o.status,
          createdAt: o.createdAt,
          firstName: o.firstName,
          lastName: o.lastName,
          contact: o.contact,
          phone: o.phone,
          city: o.city,
          services: (o.services || []).join('|'),
          comment: o.comment,
          files: (o.files || []).map((f) => f.url).filter(Boolean).join('|'),
        };
        return headers.map((h) => escapeCsvValue(row[h])).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadTextFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
    }
  };

  const renderFileContent = (msg) => {
    const url = getAbsoluteFileUrl(msg.fileUrl);
    if (!url) return null;

    if (msg.fileType?.startsWith('image/')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={msg.fileName || 'image'}
            className="w-full h-32 object-cover rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </a>
      );
    }

    if (msg.fileType?.startsWith('video/')) {
      return (
        <video
          src={url}
          controls
          className="w-full h-40 rounded-lg border border-white/10"
        />
      );
    }

    if (msg.fileType?.startsWith('audio/')) {
      return (
        <audio
          src={url}
          controls
          className="w-full"
        />
      );
    }

    return null;
  };

  const renderOrderFile = (file) => {
    const url = getAbsoluteFileUrl(file?.url);
    if (!url) return null;

    if (file.type?.startsWith('image/')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={url}
            alt={file.name}
            className="w-full h-28 object-cover rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </a>
      );
    }

    if (file.type?.startsWith('video/')) {
      return (
        <video
          src={url}
          controls
          className="w-full h-36 rounded-lg border border-white/10"
        />
      );
    }

    if (file.type?.startsWith('audio/')) {
      return (
        <audio
          src={url}
          controls
          className="w-full"
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline text-xs"
      >
        <FileText className="w-4 h-4" />
        <span className="truncate">{file.name}</span>
      </a>
    );
  };
  const [chats, setChats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('all'); 
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileChatListOpen, setMobileChatListOpen] = useState(true);
  const [chatActionsOpen, setChatActionsOpen] = useState(false);
  const [systemOverviewOpen, setSystemOverviewOpen] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pinnedOrder, setPinnedOrder] = useState(null);
  const [seenOrders, setSeenOrders] = useState(() => {
    try {
      const raw = localStorage.getItem('manager_seen_orders');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Управление сайтом
  const [siteContent, setSiteContent] = useState({
    heroTitle: 'PROMYSHLENNOE KACHESTVO DLYA VASHIH ZADACH',
    heroDescription: 'Need unique parts, interior accessories, or custom products for your business?',
    metaTitle: 'CONNECTOR - Промышленное качество',
    metaDescription: 'Уникальные детали и кастомные изделия для вашего бизнеса'
  });

  const [services, setServices] = useState([
    { id: 'S1_T', name: '3D печать', description: 'Высокоточная 3D печать', active: true },
    { id: 'S2_T', name: 'Лазерная резка', description: 'Прецизионная лазерная резка', active: true },
    { id: 'S3_T', name: 'Фрезеровка', description: 'CNC фрезеровка материалов', active: true }
  ]);

  const [scripts, setScripts] = useState(() => {
    const saved = localStorage.getItem('manager_scripts');
    if (!saved) {
      return [
        { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?' },
        { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.' }
      ];
    }

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [
        { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?' },
        { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.' }
      ];
    } catch {
      return [
      { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?' },
      { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.' }
      ];
    }
  });

  const [newScript, setNewScript] = useState({ title: '', text: '' });
  const [editingScriptId, setEditingScriptId] = useState(null);
  const [showScriptMenu, setShowScriptMenu] = useState(false);
  const [scriptSearch, setScriptSearch] = useState('');
  const [scriptEditorOpen, setScriptEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('manager_scripts', JSON.stringify(scripts));
    } catch {
      // ignore
    }
  }, [scripts]);

  const getClientChat = (clientId) => {
    if (!clientId) return null;
    return chats.find((c) => String(c?.userId) === String(clientId)) || null;
  };

  const getClientOrders = (clientId) => {
    const chat = getClientChat(clientId);
    if (!chat?.chatId) return [];
    return (orders || []).filter((o) => String(o?.chatId) === String(chat.chatId));
  };

  const getOrderKey = (order) => {
    const chatId = order?.chatId;
    const orderIndex = order?.orderIndex;
    if (chatId == null || orderIndex == null) return '';
    return `${chatId}:${orderIndex}`;
  };

  const markOrderSeen = (order) => {
    const key = getOrderKey(order);
    if (!key) return;
    setSeenOrders((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const openChatWithOrder = (order) => {
    if (!order?.chatId) return;
    setPinnedOrder(order);
    markOrderSeen(order);
    setActiveSection('chats');
    setActiveId(order.chatId);
    setMobileChatListOpen(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('manager_seen_orders', JSON.stringify(seenOrders));
    } catch {
      // ignore
    }
  }, [seenOrders]);

  const openClientInfo = (client) => {
    if (!client) return;
    setSelectedClient(client);
  };

  const handleDeleteClient = async (clientId) => {
    if (!clientId) return;
    if (!window.confirm('Удалить клиента?')) return;

    try {
      await authAPI.deleteUser(clientId);
      setAllUsers((prev) => (prev || []).filter((u) => String(u?.id) !== String(clientId)));

      const chat = getClientChat(clientId);
      if (chat?.chatId) {
        setChats((prev) => (prev || []).filter((c) => String(c?.chatId) !== String(chat.chatId)));
        setOrders((prev) => (prev || []).filter((o) => String(o?.chatId) !== String(chat.chatId)));
        if (String(activeId) === String(chat.chatId)) {
          setActiveId(null);
          setMessages([]);
        }
      }

      if (String(selectedClient?.id) === String(clientId)) {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error('Ошибка удаления клиента:', err);
      alert('Не удалось удалить клиента');
    }
  };

  // Навигационные пункты для админа - только основные
  const navItems = [
    { id: 'dashboard', label: 'Панель управления', icon: Home },
    { id: 'chats', label: 'Чаты', icon: MessageCircle },
    { id: 'orders', label: 'Заказы', icon: Package },
    { id: 'clients', label: 'Клиенты', icon: Users },
    { id: 'scripts', label: 'Скрипты', icon: Code }
  ];


  const brandGradient = "bg-gradient-to-r from-blue-600 to-cyan-500";

  // Загрузка данных
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
    } catch (error) { 
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Сначала получаем реальных пользователей с сайта
      let realUsers = [];
      try {
        const usersData = await authAPI.getUsers() || [];
        realUsers = usersData;
      } catch {
        console.log('Users API not available, using chat/order data');
      }

      const usersMap = new Map();
      
      // Добавляем реальных пользователей
      realUsers.forEach(user => {
        usersMap.set(user._id || user.id, {
          id: user._id || user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || 'User',
          lastName: user.lastName || user.name?.split(' ')[1] || '',
          phone: user.phone || '',
          role: user.role || 'user',
          status: user.status || 'offline',
          lastSeen: user.lastSeen || new Date(),
          createdAt: user.createdAt || new Date(),
          ordersCount: 0,
          unreadCount: 0
        });
      });
      
      // Добавляем пользователей из чатов
      chats.forEach(chat => {
        if (chat.userId && !usersMap.has(chat.userId)) {
          usersMap.set(chat.userId, {
            id: chat.userId,
            email: chat.userEmail || 'unknown@example.com',
            firstName: chat.userEmail?.split('@')[0] || 'User',
            lastName: '',
            phone: '',
            role: 'user',
            status: chat.unread ? 'online' : 'offline',
            lastSeen: chat.lastMessageTime || new Date(),
            createdAt: new Date(),
            ordersCount: 0,
            unreadCount: chat.unread ? 1 : 0
          });
        }
      });

      // Обновляем статистику из заказов
      orders.forEach(order => {
        if (order.userId && usersMap.has(order.userId)) {
          const user = usersMap.get(order.userId);
          user.firstName = order.firstName || user.firstName;
          user.lastName = order.lastName || user.lastName;
          user.phone = order.contact || user.phone;
          user.ordersCount = (user.ordersCount || 0) + 1;
        }
      });

      setAllUsers(Array.from(usersMap.values()));
    } catch (error) { 
      console.error('Error loading users:', error); 
      setAllUsers([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadChats(), loadOrders()]);
        await loadAllUsers();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    
    const initSocketConnection = () => {
      try {
        initSocket(user._id, 'admin', user.email);
        
        const socket = getSocket();
        if (socket) {
          socket.on('new-chat-message', (payload) => {
            console.log('=== NEW CHAT MESSAGE ===');
            console.log('Payload:', payload);
            
            loadChats();
            if (payload.chatId === activeId) {
              setMessages(prev => {
                const exists = prev.find(m => (m._id || m.id) === (payload.message._id || payload.message.id));
                if (exists) return prev;
                
                // Если сообщение содержит файл, используем правильные поля
                const message = {
                  ...payload.message,
                  fileName: payload.message.fileName || payload.message.attachments?.[0]?.originalName,
                  fileSize: payload.message.fileSize || payload.message.attachments?.[0]?.size,
                  fileType: payload.message.fileType || payload.message.attachments?.[0]?.mimetype,
                  fileUrl: payload.message.fileUrl || payload.message.attachments?.[0]?.url
                };
                
                console.log('Processed message:', message);
                
                return [...prev, message];
              });
            }
          });
          
          socket.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
          });
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocketConnection();
    
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('new-chat-message');
        socket.off('message-deleted');
      }
      disconnectSocket();
    };
  }, [user._id, activeId]);

  useEffect(() => {
    if (!activeId || activeSection !== 'chats') { 
      setMessages([]); 
      return; 
    }
    
    const loadMessages = async () => {
      try {
        const msgs = await chatsAPI.getMessages(activeId);
        console.log('=== LOADED MESSAGES ===');
        console.log('Raw messages:', msgs);
        
        // Преобразуем сообщения с attachments в правильный формат
        const processedMessages = (msgs || []).map(msg => {
          console.log('Processing message:', msg);
          
          // Проверяем разные форматы файлов
          if (msg.attachments && msg.attachments.length > 0) {
            const attachment = msg.attachments[0];
            console.log('Found attachment:', attachment);
            
            return {
              ...msg,
              fileName: attachment.originalName || attachment.filename,
              fileSize: attachment.size,
              fileType: attachment.mimetype || attachment.type,
              fileUrl: attachment.url
            };
          }
          
          // Проверяем прямые поля файла
          if (msg.fileName || msg.fileUrl) {
            console.log('Found direct file fields:', {
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              fileType: msg.fileType,
              fileUrl: msg.fileUrl
            });
            
            return {
              ...msg,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              fileType: msg.fileType,
              fileUrl: msg.fileUrl
            };
          }
          
          return msg;
        });
        
        console.log('Processed messages:', processedMessages);
        setMessages(processedMessages);
        
        // Отмечаем как прочитанные
        await chatsAPI.markAsRead(activeId);
        setChats(prev => prev.map(c => c.chatId === activeId ? { ...c, unread: false } : c));
        
        const socket = getSocket();
        if (socket) {
          socket.emit('join-chat', activeId);
        }
      } catch (error) { 
        console.error('Error loading messages:', error);
      }
    };
    
    loadMessages();
  }, [activeId, activeSection]);

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

      // Сначала добавляем сообщение в UI для мгновенного отображения
      setMessages(prev => [...prev, newMessage]);
      if (!textOverride) setInputText("");

      // Затем отправляем через Socket.io или API
      if (socket && socket.connected) {
        socket.emit('send-message', { chatId: activeId, text: textToSend });
      } else {
        // Fallback на API если Socket не работает
        await messagesAPI.send(activeId, textToSend);
      }

      // Обновляем список чатов
      loadChats();
    } catch (err) { 
      console.error('Error sending message:', err);
      alert('Ошибка отправки сообщения');
    }
  };

  const handleSendScript = (script) => {
    if (!activeId) {
      alert('Выберите чат для отправки сообщения');
      return;
    }
    executeSend(script.text);
    setShowScriptMenu(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) {
      alert('Выберите файл и откройте чат');
      return;
    }

    // Проверка размера файла (фото/видео до 100MB, остальные до 10MB)
    const isMedia = String(file.type || '').startsWith('image/') || String(file.type || '').startsWith('video/');
    const maxSizeMb = isMedia ? 100 : 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Файл слишком большой. Максимальный размер: ${maxSizeMb}MB`);
      return;
    }

    setUploading(true);
    try {
      // Показываем индикатор загрузки файла
      const tempFileId = 'uploading_' + Date.now();
      const tempMessage = {
        _id: tempFileId,
        senderId: 'manager',
        text: `📎 Загрузка файла: ${file.name} (${formatFileSize(file.size)})...`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isUploading: true,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // Используем правильный multipart API
      const result = await filesAPI.upload(file, activeId);

      // Убираем индикатор загрузки
      setMessages(prev => prev.filter(m => m._id !== tempFileId));

      const serverMessage = result?.message;
      if (serverMessage && (serverMessage._id || serverMessage.id)) {
        const normalized = {
          ...serverMessage,
          fileName: serverMessage.fileName || serverMessage.attachments?.[0]?.originalName,
          fileSize: serverMessage.fileSize || serverMessage.attachments?.[0]?.size,
          fileType: serverMessage.fileType || serverMessage.attachments?.[0]?.mimetype,
          fileUrl: serverMessage.fileUrl || serverMessage.attachments?.[0]?.url
        };
        setMessages(prev => {
          const id = normalized._id || normalized.id;
          if (prev.some(m => (m._id || m.id) === id)) return prev;
          return [...prev, normalized];
        });
      }
      
      // Обновляем список чатов
      loadChats();
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Убираем индикатор загрузки
      setMessages(prev => prev.filter(m => !m.isUploading));
      
      // Показываем сообщение об ошибке
      alert(`Ошибка загрузки файла: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setUploading(false);
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Удалить это сообщение?")) return;
    
    try {
      // Сначала удаляем из UI для мгновенного отклика
      setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
      
      // Затем пытаемся удалить на сервере
      await messagesAPI.delete(msgId);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('delete-message', { chatId: activeId, messageId: msgId });
      }
    } catch (err) { 
      console.error('Ошибка удаления сообщения:', err);
      alert('Не удалось удалить сообщение');
      // Откатываем изменения если ошибка
      loadChats();
    }
  }; // eslint-disable-line no-unused-vars

  // eslint-disable-next-line no-unused-vars
  const _handleDeleteMessage = handleDeleteMessage;

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    if (!window.confirm(`Удалить ${selectedMessages.size} сообщений?`)) return;

    try {
      const ids = Array.from(selectedMessages);
      setMessages(prev => prev.filter(m => !ids.includes(m._id || m.id)));
      setSelectedMessages(new Set());

      // Удаляем на сервере
      await Promise.all(ids.map(id => messagesAPI.delete(id).catch(() => null)));

      const socket = getSocket();
      if (socket) {
        ids.forEach(id => {
          socket.emit('delete-message', { chatId: activeId, messageId: id });
        });
      }
    } catch (err) {
      console.error('Ошибка удаления сообщений:', err);
      alert('Не удалось удалить сообщения');
      loadChats();
    }
  };

  const handlePinMessage = (msg) => {
    if (pinnedMessage && (pinnedMessage._id || pinnedMessage.id) === (msg._id || msg.id)) {
      setPinnedMessage(null);
    } else {
      setPinnedMessage(msg);
    }
  };

  const handleMessageMouseDown = (msg) => {
    const timer = setTimeout(() => {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        const msgId = msg._id || msg.id;
        if (newSet.has(msgId)) {
          newSet.delete(msgId);
        } else {
          newSet.add(msgId);
        }
        return newSet;
      });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMessageMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const toggleMessageSelection = (msgId) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        newSet.add(msgId);
      }
      return newSet;
    });
  };

  const handleClearChat = async () => {
    if (!activeId) return;
    if (!window.confirm('Очистить чат? Будут удалены все сообщения.')) return;

    try {
      setMessages([]);
      await chatsAPI.clearMessages(activeId);
      loadChats();
    } catch (err) {
      console.error('Ошибка очистки чата:', err);
      alert('Не удалось очистить чат');
      loadChats();
    }
  };

  const handleDeleteChat = async () => {
    if (!activeId) return;
    if (!window.confirm('Удалить чат? Будут удалены чат и все сообщения.')) return;

    const deletingId = activeId;
    try {
      setMessages([]);
      setActiveId(null);
      await chatsAPI.deleteChat(deletingId);
      loadChats();
    } catch (err) {
      console.error('Ошибка удаления чата:', err);
      alert('Не удалось удалить чат');
      setActiveId(deletingId);
      loadChats();
    }
  };

  const handleUpdateOrderStatus = async (chatId, orderIndex, status) => {
    try {
      console.log('Updating order status:', { chatId, orderIndex, status });
      await ordersAPI.updateStatus(chatId, orderIndex, status);
      loadOrders();
    } catch (err) { 
      console.error('Error updating order status:', err); 
      alert('Ошибка обновления статуса: ' + err.message);
    }
  };

  const handleDeleteOrder = async (chatId, orderIndex) => {
    if (!window.confirm("Удалить заказ?")) return;
    try {
      console.log('Deleting order:', { chatId, orderIndex });
      
      // Сначала удаляем из UI
      setOrders(prev => prev.filter(order => !(order.chatId === chatId && order.orderIndex === orderIndex)));
      
      // Затем пытаемся удалить на сервере
      await ordersAPI.delete(chatId, orderIndex);
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении заказа: " + err.message);
      // Откатываем изменения если ошибка
      loadOrders();
    }
  };

  const handleDeleteScript = (scriptId) => {
    if (!window.confirm("Удалить скрипт?")) return;
    try {
      setScripts((prev) => (prev || []).filter((s) => s.id !== scriptId));
    } catch (err) {
      console.error('Ошибка удаления скрипта:', err);
      alert('Не удалось удалить скрипт');
    }
  };

  const handleSaveScript = () => {
    if (!newScript.title || !newScript.text) return;

    const payload = { ...newScript, title: String(newScript.title).trim(), text: String(newScript.text).trim() };

    setScripts((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (editingScriptId) {
        return list.map((s) => (s.id === editingScriptId ? { ...payload, id: editingScriptId } : s));
      }
      return [...list, { ...payload, id: Date.now() }];
    });

    if (editingScriptId) setEditingScriptId(null);
    setNewScript({ title: '', text: '' });
  };

  const handleEditScript = (s) => {
    setNewScript({ title: s.title, text: s.text });
    setEditingScriptId(s.id);
  };

  const openNewScript = () => {
    setEditingScriptId(null);
    setNewScript({ title: '', text: '' });
    setScriptEditorOpen(true);
  };

  const openEditScript = (s) => {
    handleEditScript(s);
    setScriptEditorOpen(true);
  };

  const closeScriptEditor = () => {
    setScriptEditorOpen(false);
    setEditingScriptId(null);
    setNewScript({ title: '', text: '' });
  };

  const handleSaveSiteContent = async () => {
    try {
      // Здесь будет API для сохранения контента сайта
      alert('Контент сайта сохранен!');
    } catch (error) {
      console.error('Error saving site content:', error);
      alert('Ошибка сохранения контента');
    }
  };

  const handleSaveService = () => {
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
    }
  };

  const handleDeleteService = (serviceId) => {
    if (!window.confirm("Удалить услугу?")) return;
    setServices(services.filter(s => s.id !== serviceId));
  };

  const handleAddService = () => {
    const newService = {
      id: `S${services.length + 1}_T`,
      name: 'Новая услуга',
      description: 'Описание новой услуги',
      active: true
    };
    setServices([...services, newService]);
  };

  const startChat = async (userId) => {
    try {
      const userChat = chats.find(chat => String(chat.userId) === String(userId));
      if (userChat) {
        setActiveId(userChat.chatId);
        setActiveSection('chats');
        return;
      }

      const created = await chatsAPI.startChat(userId);
      if (created?.chatId) {
        setChats((prev) => {
          const exists = prev.some(c => String(c.chatId) === String(created.chatId));
          if (exists) return prev;
          return [created, ...prev];
        });
        setActiveId(created.chatId);
        setActiveSection('chats');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Ошибка при открытии чата');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a18] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Загрузка панели управления...</p>
        </div>
      </div>
    );
  }

  const unreadMessagesCount = (chats || []).reduce((sum, c) => {
    if (typeof c?.unread === 'number') return sum + c.unread;
    return sum + (c?.unread ? 1 : 0);
  }, 0);

  const newOrders = (orders || []).filter((o) => o?.status === 'new');
  const unseenNewOrdersCount = newOrders.filter((o) => !seenOrders.includes(getOrderKey(o))).length;

  const adminLabel = (
    user?.name ||
    user?.login ||
    user?.username ||
    user?.email?.split('@')?.[0] ||
    'Admin'
  );

  return (
    <div className={`min-h-screen flex flex-col ${i18n.language === 'ka' ? 'font-georgian' : 'font-sans'} bg-[#050a18] text-white`}>

      {error && (
        <div className="fixed inset-0 z-[9999] bg-[#050a18] flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            <div className="text-red-400 text-xl mb-4">Произошла ошибка</div>
            <p className="text-white mb-4">{error.message}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )}
      
      {/* Навигация */}
      <nav className="fixed top-0 w-full z-50 bg-[#050a18]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип */}
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-xl ${brandGradient} flex items-center justify-center`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CONNECTOR</h1>
                <p className="text-xs text-blue-400">Панель управления</p>
              </div>
            </div>

            {/* Desktop навигация */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      activeSection === item.id
                        ? `${brandGradient} text-white shadow-lg`
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Правая часть навигации */}
            <div className="flex items-center space-x-3">
              {/* Статистика для десктопа */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">{allUsers.filter(u => u.status === 'online').length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">{orders.filter(o => o.status === 'new').length}</span>
                </div>
              </div>

              {/* Выход */}
              <button
                onClick={() => { removeToken(); navigate('/'); }}
                className="hidden lg:flex p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Мобильное меню */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile меню */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div
                className="fixed inset-0 bg-black/95 z-30"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed left-0 right-0 top-16 z-40 px-4 py-6">
                <div className="mx-auto max-w-sm bg-[#050a18]/95 border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-sm font-semibold text-white">Меню</div>
                    <div className="text-xs text-white/60">Навигация по панели</div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all text-base ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                              : 'text-gray-200 hover:text-white hover:bg-white/5 border border-white/10'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-center">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        removeToken();
                        navigate('/');
                      }}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all text-base text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/20"
                      title="Выйти"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-center">Выйти</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Основной контент */}
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* На мобилке показываем иконки меню (как в бургере) НАД обзором */}
              <div className="lg:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex flex-col items-center space-y-1 p-3 rounded-lg text-sm transition-all ${
                          activeSection === item.id
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setSystemOverviewOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
                type="button"
              >
                <h2 className="text-lg sm:text-2xl font-bold text-white">Обзор системы</h2>
                <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${systemOverviewOpen ? 'rotate-180' : ''}`} />
              </button>

              {systemOverviewOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveSection('chats')}
                    className="text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-300">Новые сообщения</div>
                        <div className="text-2xl font-bold text-white">{unreadMessagesCount}</div>
                        <div className={`mt-1 text-xs ${unreadMessagesCount ? 'text-yellow-300' : 'text-green-300'}`}>
                          {unreadMessagesCount ? 'Не просмотрено' : 'Просмотрено'}
                        </div>
                      </div>
                      <Bell className={`w-7 h-7 ${unreadMessagesCount ? 'text-yellow-400' : 'text-green-400'}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-300">Новые заказы</div>
                        <div className="text-2xl font-bold text-white">{newOrders.length}</div>
                        <div className={`mt-1 text-xs ${unseenNewOrdersCount ? 'text-yellow-300' : 'text-green-300'}`}>
                          {unseenNewOrdersCount ? `Не просмотрено: ${unseenNewOrdersCount}` : 'Просмотрено'}
                        </div>
                      </div>
                      <Package className={`w-7 h-7 ${unseenNewOrdersCount ? 'text-yellow-400' : 'text-green-400'}`} />
                    </div>
                  </button>
                </div>
              )}

              {/* Desktop: большие карточки */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-300">Всего клиентов</p>
                      <p className="text-3xl font-bold text-white">{allUsers.length}</p>
                      <p className="text-xs text-blue-400 mt-1">{allUsers.filter(u => u.status === 'online').length} онлайн</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-300">Активные чаты</p>
                      <p className="text-3xl font-bold text-white">{chats.filter(c => c.status === 'active').length}</p>
                      <p className="text-xs text-green-400 mt-1">+{Math.floor(Math.random() * 10)} за день</p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-300">Новые заказы</p>
                      <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'new').length}</p>
                      <p className="text-xs text-yellow-400 mt-1">Требуют внимания</p>
                    </div>
                    <Package className="w-10 h-10 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300">Скрипты</p>
                      <p className="text-3xl font-bold text-white">{scripts.length}</p>
                      <p className="text-xs text-purple-400 mt-1">быстрых ответов</p>
                    </div>
                    <Code className="w-10 h-10 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Mobile: горизонтальные маленькие иконки */}
              <div className="sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-bold text-white">{allUsers.length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Клиенты</div>
                    <div className="text-[10px] text-blue-400">{allUsers.filter(u => u.status === 'online').length} онлайн</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <span className="text-lg font-bold text-white">{chats.filter(c => c.status === 'active').length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Активные чаты</div>
                    <div className="text-[10px] text-green-400">+{Math.floor(Math.random() * 10)} за день</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Package className="w-5 h-5 text-yellow-400" />
                      <span className="text-lg font-bold text-white">{orders.filter(o => o.status === 'new').length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Новые заказы</div>
                    <div className="text-[10px] text-yellow-400">Требуют внимания</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Code className="w-5 h-5 text-purple-400" />
                      <span className="text-lg font-bold text-white">{scripts.length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Скрипты</div>
                    <div className="text-[10px] text-purple-400">быстрых ответов</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Клиенты */}
          {activeSection === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Управление клиентами</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск клиентов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full sm:w-64"
                    />
                  </div>
                  <button className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center justify-center space-x-2`}>
                    <Plus className="w-4 h-4" />
                    <span>Добавить клиента</span>
                  </button>
                </div>
              </div>

              {(() => {
                const filteredClients = allUsers.filter(user => 
                  user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <>
                    {/* Mobile: карточки */}
                    <div className="md:hidden grid grid-cols-1 gap-3">
                      {filteredClients.map(client => (
                        <div key={client.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-full ${brandGradient} flex items-center justify-center shrink-0`}>
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-xs text-gray-400 truncate">{client.email}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {client.status === 'online' ? 'Онлайн' : 'Офлайн'}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                              <div className="text-gray-400">Телефон</div>
                              <div className="text-gray-200">{client.phone || 'Не указан'}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                              <div className="text-gray-400">Заказы</div>
                              <div className="text-gray-200">{client.ordersCount || 0}</div>
                            </div>
                          </div>
                          {client.unreadCount > 0 && (
                            <div className="mt-2 text-xs text-blue-400">{client.unreadCount} новых сообщений</div>
                          )}

                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              onClick={() => startChat(client.id)}
                              className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30"
                              title="Начать чат"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openClientInfo(client)}
                              className="px-3 py-2 rounded-lg bg-white/5 text-gray-200 border border-white/10"
                              title="Информация"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet: таблица */}
                    <div className="hidden md:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Клиент</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Контакты</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Статистика</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {filteredClients.map(client => (
                              <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full ${brandGradient} flex items-center justify-center mr-3`}>
                                      <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-white">
                                        {client.firstName} {client.lastName}
                                      </div>
                                      <div className="text-sm text-gray-400">{client.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-300">{client.phone || 'Не указан'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-300">{client.ordersCount || 0} заказов</div>
                                  {client.unreadCount > 0 && (
                                    <div className="text-xs text-blue-400">{client.unreadCount} новых сообщений</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    client.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {client.status === 'online' ? 'Онлайн' : 'Офлайн'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => {
                                        startChat(client.id);
                                      }}
                                      className="text-blue-400 hover:text-blue-300 p-1"
                                      title="Начать чат"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => openClientInfo(client)}
                                      className="text-gray-400 hover:text-gray-300 p-1"
                                      title="Информация"
                                    >
                                      <Info className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClient(client.id)}
                                      className="text-red-400 hover:text-red-300 p-1"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {selectedClient && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                          <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white font-semibold truncate">
                                {selectedClient.firstName} {selectedClient.lastName}
                              </div>
                              <div className="text-xs text-gray-400 truncate">{selectedClient.email}</div>
                            </div>
                            <button
                              onClick={() => setSelectedClient(null)}
                              className="p-2 rounded-lg text-white hover:bg-white/10"
                              title="Закрыть"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="text-xs text-gray-400">Телефон</div>
                                <div className="text-gray-200">{selectedClient.phone || 'Не указан'}</div>
                              </div>
                              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="text-xs text-gray-400">Город</div>
                                <div className="text-gray-200">{selectedClient.city || 'Не указан'}</div>
                              </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs text-gray-400">Заказы</div>
                                  <div className="text-sm text-gray-200">
                                    {getClientOrders(selectedClient.id).length}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteClient(selectedClient.id)}
                                  className="px-3 py-2 rounded-lg text-white border border-red-400/40 hover:bg-red-500/10 transition-colors text-xs"
                                >
                                  Удалить клиента
                                </button>
                              </div>

                              {getClientOrders(selectedClient.id).length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {getClientOrders(selectedClient.id).slice(0, 10).map((o, idx) => (
                                    <div key={`${o.chatId}-${o.orderIndex}-${idx}`} className="bg-black/20 border border-white/10 rounded-lg p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-xs text-gray-200">
                                          #{o.orderIndex}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                                        </div>
                                      </div>
                                      <div className="mt-2 text-xs text-gray-300">
                                        {(o.services || []).join(', ')}
                                      </div>
                                      {o.comment && (
                                        <div className="mt-2 text-xs text-gray-400 italic">"{o.comment}"</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Чаты */}
          {activeSection === 'chats' && (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100dvh-8rem)] lg:h-[calc(100vh-8rem)]">
              {/* Мобильная кнопка переключения списка чатов */}
              <div className="lg:hidden flex justify-between items-center mb-3">
                <button
                  onClick={() => {
                    setChatActionsOpen(false);
                    if (activeId) {
                      setActiveId(null);
                      setMobileChatListOpen(true);
                      return;
                    }
                    setActiveSection('dashboard');
                  }}
                  className="p-2 rounded-lg text-white hover:bg-white/10"
                  title="Назад"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setChatActionsOpen(false);
                    setMobileChatListOpen(!mobileChatListOpen);
                  }}
                  className="p-2 bg-white/10 rounded-lg text-white"
                  title={mobileChatListOpen ? 'Скрыть список' : 'Показать список'}
                >
                  {mobileChatListOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                </button>
              </div>

              {/* Список чатов - мобильный и десктоп */}
              <div className={`${mobileChatListOpen ? 'block' : 'hidden'} lg:block flex-1 lg:flex-none w-full lg:w-80 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden`}>
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white hidden lg:block">Чаты</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск чатов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(100%-5rem)]">
                  {chats.filter(chat => 
                    chat.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(chat => (
                    <div
                      key={chat.chatId}
                      onClick={() => {
                        setChatActionsOpen(false);
                        setActiveId(chat.chatId);
                        setMobileChatListOpen(false); // Закрываем список на мобильных
                      }}
                      className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
                        activeId === chat.chatId ? 'bg-blue-600/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {chat.userEmail?.split('@')[0] || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(chat.lastUpdate || chat.lastMessageTime || chat.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 truncate">
                        {chat.lastMessage || 'Нет сообщений'}
                      </div>
                      {chat.unread && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                            {chat.unread} новых
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Область чата */}
              <div className={`flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${activeId ? 'flex' : 'hidden lg:flex'} flex-col`}>
                {activeId ? (
                  <>
                    {/* Заголовок чата */}
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {chats.find(c => c.chatId === activeId)?.userEmail?.split('@')[0] || 'Chat'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {chats.find(c => c.chatId === activeId)?.userEmail}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                            <Shield className="w-4 h-4 text-blue-300" />
                            <span className="text-xs text-white/80 max-w-[120px] truncate">{adminLabel}</span>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => setChatActionsOpen((v) => !v)}
                              className="p-2 rounded-lg text-white hover:bg-white/10 border border-white/10"
                              title="Настройки"
                            >
                              <Settings className="w-4 h-4" />
                            </button>

                            {chatActionsOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setChatActionsOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-44 bg-[#050a18]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                  <button
                                    onClick={() => {
                                      setChatActionsOpen(false);
                                      handleClearChat();
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                                    type="button"
                                  >
                                    Очистить чат
                                  </button>
                                  <button
                                    onClick={() => {
                                      setChatActionsOpen(false);
                                      handleDeleteChat();
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/10"
                                    type="button"
                                  >
                                    Удалить чат
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setChatActionsOpen(false);
                              setActiveId(null);
                              setMobileChatListOpen(true);
                            }}
                            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
                            title="Назад"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {pinnedOrder && String(pinnedOrder.chatId) === String(activeId) && (
                      <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-gray-400">Заказ прикреплён</div>
                            <div className="text-sm font-semibold text-white truncate">
                              #{pinnedOrder.orderIndex} · {(pinnedOrder.services || []).join(', ') || 'Заказ'}
                            </div>
                            {pinnedOrder.comment && (
                              <div className="mt-1 text-xs text-gray-300 italic line-clamp-2">"{pinnedOrder.comment}"</div>
                            )}
                          </div>
                          <button
                            onClick={() => setPinnedOrder(null)}
                            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                            title="Открепить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {pinnedMessage && (
                      <div className="p-4 border-b border-white/10 bg-blue-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-blue-300 flex items-center gap-1">
                              <Pin className="w-3 h-3" />
                              Прикреплённое сообщение
                            </div>
                            <div className="text-sm text-white mt-1 line-clamp-3">
                              {pinnedMessage.text}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(pinnedMessage.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setPinnedMessage(null)}
                            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                            title="Открепить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMessages.size > 0 && (
                      <div className="p-3 border-b border-white/10 bg-red-500/10 flex items-center justify-between">
                        <span className="text-sm text-red-300">
                          Выбрано: {selectedMessages.size}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMessages(new Set())}
                            className="px-3 py-1 text-xs bg-white/10 rounded-lg text-white hover:bg-white/20"
                          >
                            Отменить
                          </button>
                          <button
                            onClick={handleDeleteSelectedMessages}
                            className="px-3 py-1 text-xs bg-red-600 rounded-lg text-white hover:bg-red-700"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Сообщения */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map(msg => (
                        <div key={msg._id || msg.id} className={`flex ${msg.senderId === 'manager' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`min-w-0 max-w-[90%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.senderId === 'manager' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white/10 text-white'
                          } ${selectedMessages.has(msg._id || msg.id) ? 'ring-2 ring-blue-400' : ''}`}
                            onMouseDown={() => handleMessageMouseDown(msg)}
                            onMouseUp={handleMessageMouseUp}
                            onMouseLeave={handleMessageMouseUp}
                            onTouchStart={() => handleMessageMouseDown(msg)}
                            onTouchEnd={handleMessageMouseUp}
                          >
                            {msg.isUploading ? (
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                              </div>
                            ) : (
                              <>
                                {(!msg.fileName || (((!msg.fileType?.startsWith('image/') && !msg.fileType?.startsWith('video/')) && (msg.text && !msg.text.startsWith('📎'))))) && (
                                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                )}
                                {msg.fileName && (
                                  <div className="mt-2">
                                    {/* Визуальная карточка файла */}
                                    <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors cursor-pointer group"
                                         onClick={() => {
                                           // Формируем правильный URL для файла
                                           const url = msg.fileUrl ? getAbsoluteFileUrl(msg.fileUrl) : '';
                                           
                                           console.log('File URL:', url);
                                           
                                           // Для изображений открываем в новом окне
                                           if (msg.fileType?.startsWith('image/')) {
                                             window.open(url, '_blank');
                                           } else {
                                             // Для других файлов создаем ссылку для скачивания
                                             const link = document.createElement('a');
                                             link.href = url;
                                             link.download = msg.fileName;
                                             link.target = '_blank';
                                             document.body.appendChild(link);
                                             link.click();
                                             document.body.removeChild(link);
                                           }
                                         }}>
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                          {msg.fileType?.startsWith('image/') ? (
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                              <FileText className="w-5 h-5 text-blue-400" />
                                            </div>
                                          ) : msg.fileType?.includes('pdf') ? (
                                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                              <FileText className="w-5 h-5 text-red-400" />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                                              <FileText className="w-5 h-5 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-white truncate group-hover:text-blue-300">
                                              {msg.fileName}
                                            </p>
                                            <Download className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
                                          </div>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-gray-400">
                                              {msg.fileSize ? formatFileSize(msg.fileSize) : '未知大小'}
                                            </span>
                                            {msg.fileType && (
                                              <span className="text-xs text-gray-500">
                                                {msg.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Превью для изображений */}
                                      {msg.fileUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden bg-black/20">
                                          {renderFileContent(msg)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs opacity-70 mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                              </>
                            )}
                            {!msg.isUploading && (
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => toggleMessageSelection(msg._id || msg.id)}
                                  className="text-white/60 hover:text-white"
                                  title={selectedMessages.has(msg._id || msg.id) ? 'Снять выделение' : 'Выделить'}
                                >
                                  {selectedMessages.has(msg._id || msg.id) ? (
                                    <CheckSquare className="w-3 h-3 text-blue-400" />
                                  ) : (
                                    <Square className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handlePinMessage(msg)}
                                  className="text-white/60 hover:text-white"
                                  title={pinnedMessage && (pinnedMessage._id || pinnedMessage.id) === (msg._id || msg.id) ? 'Открепить' : 'Прикрепить'}
                                >
                                  <Pin className={`w-3 h-3 ${pinnedMessage && (pinnedMessage._id || pinnedMessage.id) === (msg._id || msg.id) ? 'text-blue-400' : ''}`} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Поле ввода */}
                    <div className="p-4 border-t border-white/10 relative">
                      <div className="flex items-end space-x-2">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Введите сообщение..."
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                          rows={1}
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => setShowScriptMenu((v) => !v)}
                          disabled={!activeId}
                          className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-50"
                          title="Скрипты"
                        >
                          <Code className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!activeId || uploading}
                          className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-50"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => executeSend()}
                          disabled={!inputText.trim() || !activeId || uploading}
                          className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Меню скриптов */}
                      {showScriptMenu && (
                        <>
                          <div className="lg:hidden">
                            <div
                              className="fixed inset-0 bg-black/70 backdrop-blur-[1px] z-40"
                              onClick={() => {
                                setShowScriptMenu(false);
                                setScriptSearch('');
                              }}
                            />
                            <div className="fixed inset-x-0 bottom-0 z-50 bg-[#050a18]/95 border-t border-white/10 rounded-t-2xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-white">Быстрые ответы</div>
                                <button
                                  onClick={() => {
                                    setShowScriptMenu(false);
                                    setScriptSearch('');
                                  }}
                                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                                  aria-label="Закрыть"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="mt-3">
                                <input
                                  value={scriptSearch}
                                  onChange={(e) => setScriptSearch(e.target.value)}
                                  placeholder="Поиск по скриптам..."
                                  className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2">
                                {(scripts || [])
                                  .filter((s) => {
                                    const q = scriptSearch.trim().toLowerCase();
                                    if (!q) return true;
                                    return (
                                      String(s?.title || '').toLowerCase().includes(q) ||
                                      String(s?.text || '').toLowerCase().includes(q)
                                    );
                                  })
                                  .map((script) => (
                                    <button
                                      key={script.id}
                                      onClick={() => handleSendScript(script)}
                                      className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl active:scale-[0.99] transition"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-base font-semibold text-white truncate">{script.title}</div>
                                          <div className="mt-1 text-sm text-white/60 line-clamp-2">{script.text}</div>
                                        </div>
                                        <div className="shrink-0 text-xs text-blue-300/80">Отправить</div>
                                      </div>
                                    </button>
                                  ))}

                                {(scripts || []).length === 0 && (
                                  <div className="py-8 text-center text-sm text-white/60">
                                    Нет скриптов
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden lg:block absolute bottom-full left-0 mb-2 w-64 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-600 px-2 py-1">Быстрые ответы</div>
                              {scripts.map(script => (
                                <button
                                  key={script.id}
                                  onClick={() => handleSendScript(script)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <div className="font-medium">{script.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{script.text}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">Выберите чат для начала общения</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Заказы */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Управление заказами</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-slate-900/80 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option className="bg-slate-900 text-white" value="all">Все заказы</option>
                    <option className="bg-slate-900 text-white" value="new">Новые</option>
                    <option className="bg-slate-900 text-white" value="accepted">Принятые</option>
                    <option className="bg-slate-900 text-white" value="declined">Отклоненные</option>
                  </select>
                  <div className="flex items-stretch gap-2">
                    <button
                      onClick={() => {
                        const filtered = orders.filter(order => filterStatus === 'all' || order.status === filterStatus);
                        downloadOrdersList(filtered, 'json');
                      }}
                      className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center justify-center space-x-2`}
                    >
                      <Download className="w-4 h-4" />
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        const filtered = orders.filter(order => filterStatus === 'all' || order.status === filterStatus);
                        downloadOrdersPdf(filtered);
                      }}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5 font-medium"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.filter(order => 
                  filterStatus === 'all' || order.status === filterStatus
                ).map((order, idx) => (
                  <div
                    key={`${order.chatId}-${idx}`}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                    onClick={() => markOrderSeen(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') markOrderSeen(order);
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'new' ? 'Новый' :
                         order.status === 'accepted' ? 'Принят' : 'Отклонен'}
                        </span>

                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          seenOrders.includes(getOrderKey(order))
                            ? 'border-green-500/30 text-green-300 bg-green-500/10'
                            : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                        }`}>
                          {seenOrders.includes(getOrderKey(order)) ? 'Просмотрено' : 'Не просмотрено'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openChatWithOrder(order);
                          }}
                          className="px-3 py-2 sm:px-3 sm:py-2 rounded-lg text-white border border-blue-400/30 hover:bg-blue-500/10 transition-colors text-xs"
                          title="Связаться с клиентом"
                        >
                          Связаться
                        </button>
                        <select
                          value={order.status || 'new'}
                          onChange={(e) => handleUpdateOrderStatus(order.chatId, order.orderIndex, e.target.value)}
                          className="bg-slate-900/80 border border-white/20 rounded-lg px-3 py-2 sm:px-2 sm:py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                          title="Статус заказа"
                        >
                          <option className="bg-slate-900 text-white" value="new">Новый</option>
                          <option className="bg-slate-900 text-white" value="accepted">Принят</option>
                          <option className="bg-slate-900 text-white" value="declined">Отклонен</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadOrder(order, 'json');
                          }}
                          className="p-3 sm:p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Скачать JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadOrdersPdf([order]);
                          }}
                          className="px-3 py-2 sm:px-3 sm:py-2 rounded-lg text-white border border-white/20 hover:bg-white/10 transition-colors text-xs"
                          title="Скачать PDF"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.chatId, order.orderIndex)}
                          className="p-3 sm:p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Удалить заказ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400">Клиент</p>
                        <p className="text-sm font-medium text-white">
                          {order.firstName} {order.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{order.contact}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Услуги</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.services?.slice(0, 2).map((service, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                              {service}
                            </span>
                          ))}
                          {order.services?.length > 2 && (
                            <span className="text-xs text-gray-400">+{order.services.length - 2}</span>
                          )}
                        </div>
                      </div>

                      {order.comment && (
                        <div>
                          <p className="text-xs text-gray-400">Комментарий</p>
                          <p className="text-xs text-gray-300 italic">"{order.comment}"</p>
                        </div>
                      )}

                      {order.files && order.files.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Файлы заказа</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {order.files.map((file) => (
                              <div key={file.id || file.url || file.name}>
                                {renderOrderFile(file)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2" />
                    </div>
                  </div>
                ))}
              </div>

              {orders.filter(order => 
                filterStatus === 'all' || order.status === filterStatus
              ).length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Заказы не найдены</p>
                </div>
              )}
            </div>
          )}

          {/* Скрипты */}
          {activeSection === 'scripts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Быстрые ответы</h2>
                <button
                  onClick={openNewScript}
                  className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center space-x-2 w-full sm:w-auto justify-center`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить скрипт</span>
                </button>
              </div>

              <div className="lg:hidden">
                <div className="space-y-3">
                  {(scripts || []).map((script) => (
                    <div key={script.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-white truncate">{script.title}</div>
                          <div className="mt-1 text-sm text-white/60 line-clamp-2">{script.text}</div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => openEditScript(script)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-blue-300 hover:bg-white/10"
                            aria-label="Редактировать"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScript(script.id)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-red-300 hover:bg-white/10"
                            aria-label="Удалить"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(scripts || []).length === 0 && (
                    <div className="text-center py-10 text-white/60">
                      Скриптов пока нет
                    </div>
                  )}
                </div>

                {scriptEditorOpen && (
                  <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/70" onClick={closeScriptEditor} />
                    <div className="absolute inset-x-0 bottom-0 bg-[#050a18]/95 border-t border-white/10 rounded-t-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {editingScriptId ? 'Редактировать скрипт' : 'Новый скрипт'}
                        </div>
                        <button
                          onClick={closeScriptEditor}
                          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                          aria-label="Закрыть"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          value={newScript.title}
                          onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                          placeholder="Название"
                          className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                          value={newScript.text}
                          onChange={(e) => setNewScript({ ...newScript, text: e.target.value })}
                          placeholder="Текст ответа..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={closeScriptEditor}
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => {
                              if (!newScript.title || !newScript.text) return;
                              handleSaveScript();
                              closeScriptEditor();
                            }}
                            disabled={!newScript.title || !newScript.text}
                            className={`px-4 py-3 rounded-xl ${brandGradient} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {editingScriptId ? 'Обновить' : 'Сохранить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Форма добавления/редактирования */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingScriptId ? 'Редактировать скрипт' : 'Новый скрипт'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Заголовок</label>
                    <input
                      type="text"
                      value={newScript.title}
                      onChange={(e) => setNewScript({...newScript, title: e.target.value})}
                      placeholder="Название скрипта"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Текст ответа</label>
                    <textarea
                      value={newScript.text}
                      onChange={(e) => setNewScript({...newScript, text: e.target.value})}
                      placeholder="Текст быстрого ответа..."
                      rows={3}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSaveScript}
                      disabled={!newScript.title || !newScript.text}
                      className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto`}
                    >
                      {editingScriptId ? 'Обновить' : 'Сохранить'}
                    </button>
                    {editingScriptId && (
                      <button
                        onClick={() => {
                          setEditingScriptId(null);
                          setNewScript({ title: '', text: '' });
                        }}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 w-full sm:w-auto"
                      >
                        Отмена
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Список скриптов */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map(script => (
                  <div key={script.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-white">{script.title}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditScript(script)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScript(script.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{script.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Управление сайтом */}
          {activeSection === 'site' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Управление сайтом</h2>

              {/* Редактирование контента */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Основной контент</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Главный заголовок</label>
                    <input
                      type="text"
                      value={siteContent.heroTitle}
                      onChange={(e) => setSiteContent({...siteContent, heroTitle: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
                    <textarea
                      value={siteContent.heroDescription}
                      onChange={(e) => setSiteContent({...siteContent, heroDescription: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveSiteContent}
                    className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium w-full sm:w-auto`}
                  >
                    Сохранить контент
                  </button>
                </div>
              </div>

              {/* Управление услугами */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-white">Услуги</h3>
                  <button
                    onClick={handleAddService}
                    className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center space-x-2 w-full sm:w-auto justify-center`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить услугу</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-white/5 rounded-lg p-4">
                      {editingService?.id === service.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingService.name}
                            onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                          />
                          <input
                            type="text"
                            value={editingService.description}
                            onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveService}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingService(null)}
                              className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{service.name}</h4>
                            <p className="text-sm text-gray-400">{service.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingService(service)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO настройки */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">SEO настройки</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={siteContent.metaTitle}
                      onChange={(e) => setSiteContent({...siteContent, metaTitle: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
                    <textarea
                      value={siteContent.metaDescription}
                      onChange={(e) => setSiteContent({...siteContent, metaDescription: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Настройки */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Настройки системы</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Общие настройки */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Общие настройки</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Уведомления</span>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Автосохранение</span>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Темная тема</span>
                      <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Безопасность */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Безопасность</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Смена пароля</label>
                      <input
                        type="password"
                        placeholder="Новый пароль"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Подтвердите пароль"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button className={`w-full py-2 ${brandGradient} rounded-lg text-white font-medium`}>
                      Обновить пароль
                    </button>
                  </div>
                </div>

                {/* Резервное копирование */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Резервное копирование</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">Последнее копирование: 2 часа назад</p>
                    </div>
                    <button className={`w-full py-2 ${brandGradient} rounded-lg text-white font-medium`}>
                      Создать резервную копию
                    </button>
                    <button className="w-full py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
                      Скачать последнюю копию
                    </button>
                  </div>
                </div>

                {/* Система */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Система</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Версия</span>
                      <span className="text-sm text-white">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">База данных</span>
                      <span className="text-sm text-green-400">Подключена</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Socket.io</span>
                      <span className="text-sm text-green-400">Активен</span>
                    </div>
                    <button className="w-full py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
                      Перезагрузить систему
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Остальные разделы - заглушки */}
          {activeSection !== 'dashboard' && activeSection !== 'clients' && 
           activeSection !== 'chats' && activeSection !== 'orders' && 
           activeSection !== 'scripts' && activeSection !== 'site' && 
           activeSection !== 'settings' && (
            <div className="text-center py-16">
              <div className={`w-20 h-20 rounded-xl ${brandGradient} flex items-center justify-center mx-auto mb-4`}>
                {navItems.find(item => item.id === activeSection)?.icon && 
                  React.createElement(navItems.find(item => item.id === activeSection).icon, { className: "w-10 h-10 text-white" })
                }
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {navItems.find(item => item.id === activeSection)?.label}
              </h3>
              <p className="text-gray-400">Раздел в разработке...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerPanelPro;
