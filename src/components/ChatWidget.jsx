import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { chatsAPI, messagesAPI, filesAPI, ordersAPI, signaturesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { playSound } from '../utils/sound';
import { Paperclip, X, Download, Maximize2, Minimize2, Trash2, Pin, Reply, CheckSquare, Square, Check, CheckCheck } from 'lucide-react';
import { useAvatarUrl } from '../hooks/useAvatarUrl';
import SmartOrderSystem from './SmartOrderSystem/SmartOrderSystem';
import JSZip from 'jszip';
import { buildOrderPdfForLang } from '../utils/orderPdf';


const ChatWidget = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [smartMode, setSmartMode] = useState('locked');
  const [smartResetNonce, setSmartResetNonce] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [aiHelpFlow, setAiHelpFlow] = useState(null);
  const [aiSessionStartMs, setAiSessionStartMs] = useState(0);
  


  
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const closeResetTimerRef = useRef(null);

  const clearSmartTranscript = useCallback(() => {
    if (!chatId) return;
    try {
      localStorage.removeItem(`smart_transcript_${chatId}`);
      localStorage.removeItem(`smart_greeted_${chatId}`);
    } catch { void 0; }
  }, [chatId]);

  function getMsgId(msg) {
    return msg?._id || msg?.id;
  }

  function isUserMessage(msg) {
    return msg?.senderId === user?._id || msg?.senderId === user?._id?.toString();
  }

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 440, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const widgetRef = useRef(null);
  const isOpenRef = useRef(false);
  const aiDocsRef = useRef(null);
  const aiActionLogRef = useRef([]);
  const appendAiFinalNotice = useCallback((text) => {
    const s = String(text || '').trim();
    if (!s) return;
    const createdAt = new Date().toISOString();
    const id = `ai_done_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setMessages((prev) => [
      ...(prev || []),
      { _id: id, chatId, text: s, senderId: 'system', senderEmail: 'assistant', attachments: [], createdAt }
    ]);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [chatId]);

  const getClientClearTs = useCallback((cid) => {
    const id = cid || chatId;
    if (!id) return 0;
    try {
      const raw = localStorage.getItem(`chatwidget_clear_ts_${id}`);
      const ts = raw ? Number(raw) : 0;
      return Number.isFinite(ts) ? ts : 0;
    } catch {
      return 0;
    }
  }, [chatId]);

  const applyClientClearFilter = useCallback((cid, list) => {
    const ts = getClientClearTs(cid);
    if (!ts) return list;
    return (list || []).filter((m) => {
      const created = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
      if (!created) return true;
      return created > ts;
    });
  }, [getClientClearTs]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (closeResetTimerRef.current) {
      clearTimeout(closeResetTimerRef.current);
      closeResetTimerRef.current = null;
    }
    if (isOpen) return;
    closeResetTimerRef.current = setTimeout(() => {
      if (isOpenRef.current) return;
      setAiHelpFlow(null);
      aiDocsRef.current = null;
      aiActionLogRef.current = [];
      clearSmartTranscript();
      setSmartMode('locked');
      setSmartResetNonce((n) => n + 1);
    }, 2 * 60 * 1000);
    return () => {
      if (closeResetTimerRef.current) {
        clearTimeout(closeResetTimerRef.current);
        closeResetTimerRef.current = null;
      }
    };
  }, [clearSmartTranscript, isOpen]);
  const [scrolled, setScrolled] = useState(false);
  const avatarUrl = useAvatarUrl(user?.email, null, user?.avatarType, user?.customAvatarUrl);
  const [supportOnline, setSupportOnline] = useState(false);
  const [supportTyping, setSupportTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  
  useEffect(() => {
    window.dispatchEvent(new Event(isOpen ? 'chatwidget:open' : 'chatwidget:close'));
  }, [isOpen]);

  // Блокируем браузерный свайп назад на мобиле когда чат открыт
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    // Пушим фиктивную запись в историю чтобы свайп назад не уходил со страницы
    window.history.pushState({ chatOpen: true }, '');
    const onPopState = (e) => {
      if (isOpen) {
        // Перехватываем — закрываем чат вместо навигации назад
        setIsOpen(false);
        e.preventDefault();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [isMobile, isOpen]);
  useEffect(() => {
    try {
      if (isOpen) {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch { void 0; }
  }, [isOpen]);
  useEffect(() => {
    try {
      const tracker = window.__analyticsTracker;
      if (isOpen && tracker) tracker.sectionOpen('chat');
      return () => {
        const t = window.__analyticsTracker;
        if (t && isOpen) t.sectionClose('chat');
      };
    } catch { void 0; }
  }, [isOpen]);
  const normalizeMessage = (msg) => {
    if (!msg) return msg;

    // Some backends send file data as fileName/fileUrl instead of attachments
    const hasAttachmentsArray = Array.isArray(msg.attachments) && msg.attachments.length > 0;
    const hasFileFields = !!(msg.fileUrl || msg.fileName || msg.fileType || msg.fileSize);

    if (hasAttachmentsArray) return msg;
    if (!hasFileFields) return msg;

    return {
      ...msg,
      attachments: [
        {
          url: msg.fileUrl,
          filename: msg.fileUrl,
          originalName: msg.fileName,
          mimetype: msg.fileType,
          size: msg.fileSize
        }
      ]
    };
  };

  const isSelecting = selectedMessages.size > 0;

  const toggleMessageSelection = (msg) => {
    const id = getMsgId(msg);
    if (!id) return;
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!chatId) return;
    if (selectedMessages.size === 0) return;

    const selectedIds = Array.from(selectedMessages);
    const allowedIds = messages
      .filter((m) => {
        const id = getMsgId(m);
        if (!id || String(id).startsWith('temp_')) return false;
        if (!selectedIds.includes(id)) return false;
        return isUserMessage(m);
      })
      .map((m) => getMsgId(m));

    if (allowedIds.length === 0) return;
    if (!window.confirm(`Удалить ${allowedIds.length} сообщений?`)) return;

    setMessages((prev) => prev.filter((m) => !allowedIds.includes(getMsgId(m))));
    clearSelection();

    await Promise.all(
      allowedIds.map((id) =>
        messagesAPI.delete(id).catch(() => null)
      )
    );
  };

  const handlePinSelected = () => {
    if (selectedMessages.size !== 1) return;
    const id = Array.from(selectedMessages)[0];
    const msg = messages.find((m) => getMsgId(m) === id);
    if (!msg) return;
    const nextPinned = pinnedMessage && getMsgId(pinnedMessage) === id ? null : msg;
    setPinnedMessage(nextPinned);
    try {
      if (nextPinned) localStorage.setItem(`chatwidget_pinned_${chatId}`, JSON.stringify(nextPinned));
      else localStorage.removeItem(`chatwidget_pinned_${chatId}`);
    } catch {
      // ignore
    }
    clearSelection();
  };

  const handleReplySelected = () => {
    if (selectedMessages.size !== 1) return;
    const id = Array.from(selectedMessages)[0];
    const msg = messages.find((m) => getMsgId(m) === id);
    if (!msg) return;
    setReplyTo(msg);
    clearSelection();
  };

  const handleMessagePressStart = (msg) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      toggleMessageSelection(msg);
    }, 500);
  };

  const handleMessagePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('Файл слишком большой. Максимальный размер — 100 МБ');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!chatId) {
      console.error('Chat ID not found');
      return;
    }

    setUploading(true);
    try {
      const result = await filesAPI.upload(file, chatId);

      const serverMessage = result?.message || result?.data?.message || result?.data;
      if (serverMessage && (serverMessage._id || serverMessage.id)) {
        const normalized = normalizeMessage(serverMessage);
        setMessages((prev) => {
          const id = normalized._id || normalized.id;
          if (id && prev.some((m) => (m._id || m.id) === id)) return prev;
          return [...prev, normalized];
        });
      } else {
        const msgs = await messagesAPI.getByChatId(chatId);
        setMessages((msgs || []).map(normalizeMessage));
      }

      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseReplyMetaFromText = (text) => {
    if (typeof text !== 'string') return null;
    if (!text.startsWith('[[reply:')) return null;

    const end = text.indexOf(']]\n');
    if (end === -1) return null;
    const header = text.slice(0, end + 2);
    const body = text.slice(end + 3);

    const inside = header.slice('[[reply:'.length, -2);
    const sepIdx = inside.indexOf('|');
    if (sepIdx === -1) return null;

    const replyId = inside.slice(0, sepIdx);
    const snippet = inside.slice(sepIdx + 1);
    return { replyId, snippet, bodyText: body };
  };

  const buildReplyEncodedText = (replyMsg, bodyText) => {
    const id = getMsgId(replyMsg);
    const snippetRaw = String(replyMsg?.text || '').replace(/\s+/g, ' ').trim();
    const snippet = snippetRaw.slice(0, 80);
    return `[[reply:${id || ''}|${snippet}]]\n${bodyText}`;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsMaximized(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user?._id) return;

      const socket = initSocket(user._id, user.role || 'user', user.email);
      console.log('🔌 CLIENT SOCKET INIT →', user._id, user.role || 'user');

      socket.on('connect', () => {
        console.log('🔌 CLIENT SOCKET CONNECTED →', socket.id?.slice(0,8), '(' + (user.role || 'user') + ')');
      });
      socket.on('disconnect', (reason) => {
        console.log('🔌 CLIENT SOCKET DISCONNECTED →', reason);
      });

    const loadChat = async () => {
      try {
        const chat = await chatsAPI.getMyChat();
        setChatId(chat.chatId);
        if (chat?.unreadByClient && !isOpenRef.current) {
          setHasNewMessage(true);
        }
        try {
          const socket = getSocket();
          if (socket && chat?.chatId) socket.emit('join-chat', chat.chatId);
        } catch { void 0; }

        if (socket) {
          console.log('📱 CLIENT JOIN chat-', chat.chatId);
          socket.emit('join-chat', chat.chatId);
        }

        const msgs = await messagesAPI.getByChatId(chat.chatId);
        const filteredMsgs = applyClientClearFilter(chat.chatId, (msgs || []).map(normalizeMessage));
        setMessages((filteredMsgs || []).map((m) => {
          const mine = isUserMessage(m);
          if (!mine) return m;
          const id0 = m?._id || m?.id;
          const isTemp = typeof id0 === 'string' && id0.startsWith('temp_');
          return { ...m, __status: isTemp ? 'sending' : 'delivered' };
        }));
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();

    if (socket) {
      const handleNewMessage = (newMsg) => {
        console.log('📨 CLIENT new-message ←', (newMsg?._id || newMsg?.message?._id || 'no-id')?.slice(0,8));
        const incoming = normalizeMessage(newMsg?.message || newMsg);
        try {
          const ts = getClientClearTs(chatId);
          const created = incoming?.createdAt ? new Date(incoming.createdAt).getTime() : 0;
          if (ts && created && created <= ts) return;
        } catch { void 0; }
        console.log('📨 CLIENT MESSAGE PROCESSED →', incoming?._id?.slice(0,8), incoming?.text?.slice(0,50));
        setMessages((prev) => {
          const id = incoming?._id || incoming?.id;
          // Удаляем оптимистичное временное сообщение пользователя с таким же текстом
          const withoutTemps = prev.filter((m) => {
            const mid = m._id || m.id;
            const isTemp = typeof mid === 'string' && mid.startsWith('temp_');
            if (!isTemp) return true;
            const mine = isUserMessage(m);
            const sameText = (m?.text || '') === (incoming?.text || '');
            return !(mine && sameText);
          });
          const mineIncoming = isUserMessage(incoming);
          const withStatus = mineIncoming ? { ...incoming, __status: 'delivered' } : incoming;

          // Если такое серверное сообщение уже есть — обновляем (нужно для доклеивания вложений)
          if (id && withoutTemps.some((m) => (m._id || m.id) === id)) {
            return withoutTemps.map((m) => {
              const mid = m._id || m.id;
              if (mid !== id) return m;
              const st = m.__status;
              return st ? { ...m, ...withStatus, __status: st } : { ...m, ...withStatus };
            });
          }
          return [...withoutTemps, withStatus];
        });
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
 
        if (incoming?.senderId === 'manager') {
          try { playSound('chat'); } catch { void 0; }
        }
        if (!isOpenRef.current && (incoming?.senderId === 'manager')) {
          setHasNewMessage(true);
        }
      };

      const handleMessageDeleted = (payload) => {
        const messageId = payload?.messageId || payload?.id;
        if (!messageId) return;
        setMessages((prev) => prev.filter((m) => (m._id || m.id) !== messageId));
        setSelectedMessages((prev) => {
          if (!prev?.size) return prev;
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      };

      const handleSupportStatus = (payload) => {
        setSupportOnline(!!payload?.online);
      };

      const handleTyping = (payload) => {
        if (!payload?.chatId || payload.chatId !== chatId) return;
        if (payload?.role !== 'admin') return;
        setSupportTyping(!!payload?.isTyping);
      };

      const handleChatRead = (payload) => {
        if (!payload?.chatId || payload.chatId !== chatId) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (!isUserMessage(m)) return m;
            const id0 = m?._id || m?.id;
            if (typeof id0 === 'string' && id0.startsWith('temp_')) return m;
            return { ...m, __status: 'read' };
          })
        );
      };

      socket.on('new-message', handleNewMessage);
      socket.on('message-deleted', handleMessageDeleted);
      socket.on('support-status', (payload) => {
        console.log('📨 CLIENT support-status ←', payload);
        handleSupportStatus(payload);
        console.log('📨 CLIENT SUPPORT ONLINE →', !!payload?.online);
      });
      socket.on('typing', (payload) => {
        console.log('📨 CLIENT typing ←', payload);
        handleTyping(payload);
        console.log('⌨️ CLIENT SUPPORT TYPING →', !!payload?.isTyping);
      });
      socket.on('chat-read', (payload) => {
        console.log('📨 CLIENT chat-read ←', payload);
        handleChatRead(payload);
      });

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-deleted', handleMessageDeleted);
        socket.off('support-status', handleSupportStatus);
        socket.off('typing', handleTyping);
        socket.off('chat-read', handleChatRead);
      };
    }

    return () => {
      disconnectSocket();
    };
  }, [user?._id, user?.email, user?.role]);

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    if (!socket) return;
    try { socket.emit('join-chat', chatId); } catch { void 0; }
    return () => {
      try { socket.emit('leave-chat', chatId); } catch { void 0; }
    };
  }, [chatId]);

  useEffect(() => {
    if (!user?._id) return;
    let mounted = true;

    const pollUnread = async () => {
      if (isOpen) return;
      try {
        const chat = await chatsAPI.getMyChat();
        if (!mounted) return;
        setHasNewMessage(!!chat?.unreadByClient);
      } catch { void 0; }
    };

    pollUnread();
    const id = setInterval(pollUnread, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?._id, isOpen]);

  const selectI18nText = (text) => {
    if (typeof text !== 'string') return text;
    if (!text.includes('[[i18n:')) return text;
    const lang = String(i18n?.language || '').toLowerCase().slice(0, 2);
    const blocks = {};
    const re = /\\[\\[i18n:(ru|en|ka)\\]\\]([\\s\\S]*?)\\[\\[\\/i18n\\]\\]/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      blocks[m[1]] = m[2];
    }
    return blocks[lang] || blocks.ru || blocks.en || blocks.ka || text;
  };

  const getNewMessageToastText = () => {
    const lang = String(i18n?.language || '').toLowerCase();
    if (lang.startsWith('ka')) return 'ახალი შეტყობინება';
    if (lang.startsWith('en')) return 'New message';
    return 'Новое сообщение';
  };

  const saveSmartTranscript = useCallback((entry) => {
    if (!chatId) return;
    try {
      const key = `smart_transcript_${chatId}`;
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const id = String(entry?._id || entry?.id || '');
      const filtered = id ? list.filter((m) => String(m?._id || m?.id || '') !== id) : list;
      filtered.push(entry);
      localStorage.setItem(key, JSON.stringify(filtered.slice(-250)));
    } catch { void 0; }
  }, [chatId]);

  const loadSmartTranscript = useCallback(() => {
    if (!chatId) return [];
    try {
      const key = `smart_transcript_${chatId}`;
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [chatId]);

  const appendAssistantMessage = useCallback((text) => {
    const s = String(text || '').trim();
    if (!s) return;
    const id = `smart_prompt_${chatId || 'nochat'}`;
    const createdAt = new Date().toISOString();
    setMessages((prev) => {
      const filtered = (prev || []).filter((m) => String(m?._id || m?.id || '') !== id);
      return [...filtered, { _id: id, chatId, text: s, senderId: 'assistant', senderEmail: 'assistant', attachments: [], createdAt }];
    });
    saveSmartTranscript({ _id: id, chatId, text: s, senderId: 'assistant', senderEmail: 'assistant', attachments: [], createdAt });
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [chatId, saveSmartTranscript]);

  const sendManagerLog = useCallback(async (text) => {
    if (!chatId) return;
    const s = String(text || '').trim();
    if (!s) return;
    aiActionLogRef.current = [...(aiActionLogRef.current || []), s].slice(-300);
    try {
      await messagesAPI.send(chatId, `🤖 ${s}`);
    } catch (e) {
      console.error('Failed to send manager log', e);
    }
  }, [chatId]);

  const uploadZipToChat = useCallback(async (zipBlob, fileName) => {
    const zipFile = new File([zipBlob], fileName, { type: 'application/zip' });
    return await filesAPI.upload(zipFile, null);
  }, []);

  const makeOrderSummaryPdf = useCallback(async (params) => {
    const lang2 = String(i18n?.language || '').toLowerCase().slice(0, 2);
    return buildOrderPdfForLang(lang2, params, i18n);
  }, [i18n]);



  const finalizeOrderPackage = useCallback(async (session) => {
    const brief = session?.brief || {};
    const params = {
      brief,
      selectedServices: session?.selectedServices || [],
      answers: session?.answers || {},
      stepData: session?.stepData || {}
    };

    const lang2 = String(i18n?.language || '').toLowerCase().slice(0, 2);
    const summaryPdf = await buildOrderPdfForLang(lang2, params, i18n);

    const zip = new JSZip();
    zip.file('order_summary.pdf', summaryPdf);

    const stepData = session?.stepData && typeof session.stepData === 'object' ? session.stepData : {};
    const allFiles = [];
    Object.entries(stepData).forEach(([k, v]) => {
      const files = Array.isArray(v?.files) ? v.files : [];
      files.forEach((f) => allFiles.push({ stepKey: k, file: f }));
    });

    const slug = (s) => {
      const txt = String(s || '').trim();
      const cleaned = txt.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
      return cleaned.slice(0, 60);
    };

    const getStepLabel = (key) => {
      const k = String(key || '');
      if (k === 'services_select') return t('smart_select_services');
      if (k === 'brief_form') return t('smart_fill_brief');
      if (k === 'q_deadline') return t('smart_q_deadline');
      if (k === 'q_quantity') return t('smart_q_quantity');
      return k;
    };

    // Separate images (upload to server) from videos (put in zip)
    const uploadedImageFiles = [];

    for (const item of allFiles) {
      try {
        const fileObj = item?.file?.file;
        if (!fileObj) continue;
        const originalName = String(item?.file?.name || fileObj.name || 'file');
        const mime = String(fileObj.type || '');
        const safeStep = String(item?.stepKey || 'step').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const label = getStepLabel(item?.stepKey);
        const folderSlug = slug(label);
        const folderName = folderSlug ? `${safeStep}_${folderSlug}` : safeStep;
        const fileName = `${safeStep}__${originalName}`;
        const buf = await fileObj.arrayBuffer();

        if (mime.startsWith('video/')) {
          // Videos go into zip under video/ folder
          zip.file(`video/${fileName}`, buf);
        } else {
          // All other files (images, docs) go into attachments/ in zip
          zip.file(`attachments/${folderName}/${fileName}`, buf);
          // Images also get uploaded separately so they appear in order.files
          if (mime.startsWith('image/')) {
            try {
              const uploadFile = new File([buf], originalName, { type: mime });
              const resp = await filesAPI.upload(uploadFile, null);
              const url = resp?.fileUrl || resp?.message?.attachments?.[0]?.url || resp?.data?.fileUrl;
              if (url) {
                uploadedImageFiles.push({ name: originalName, type: mime, size: fileObj.size, url });
              }
            } catch { void 0; }
          }
        }
      } catch { void 0; }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipResp = await uploadZipToChat(zipBlob, 'ai_order.zip');

    const docs = {
      zipUrl: zipResp?.fileUrl || zipResp?.message?.attachments?.[0]?.url,
      imageFiles: uploadedImageFiles
    };
    aiDocsRef.current = docs;
    return docs;
  }, [makeOrderSummaryPdf, uploadZipToChat, i18n]);

  useEffect(() => {
    if (isOpen && chatId) {
      setTimeout(() => setHasNewMessage(false), 0);
      chatsAPI.markAsRead(chatId).catch(console.error);

      const loadMessages = async () => {
        try {
          const msgs = await chatsAPI.getMessages(chatId);
          setMessages(() => {
            const serverMsgs0 = (msgs || []).map(normalizeMessage);
            const serverMsgs = applyClientClearFilter(chatId, serverMsgs0).map((m) => {
            const mine = isUserMessage(m);
            if (!mine) return m;
            const id0 = m?._id || m?.id;
            const isTemp = typeof id0 === 'string' && id0.startsWith('temp_');
            return { ...m, __status: isTemp ? 'sending' : (m.__status || 'delivered') };
            });
            const transcript = loadSmartTranscript();
            const existing = new Set(serverMsgs.map((m) => String(m?._id || m?.id || '')));
            const merged = [...serverMsgs];
            for (const tm of transcript) {
              const id = String(tm?._id || tm?.id || '');
              if (!id || existing.has(id)) continue;
              merged.push(tm);
            }
            return merged;
          });
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [isOpen, chatId]);

  useEffect(() => {
    try {
      if (isOpen) {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
      }
    } catch { void 0; }
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (!chatId) return;
    setTimeout(() => {
      setSelectedMessages(new Set());
      setReplyTo(null);
      try {
        const raw = localStorage.getItem(`chatwidget_pinned_${chatId}`);
        const parsed = raw ? JSON.parse(raw) : null;
        setPinnedMessage(parsed || null);
      } catch {
        setPinnedMessage(null);
      }
    }, 0);
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;

    const text = replyTo ? buildReplyEncodedText(replyTo, message) : message;
    setMessage('');
    setReplyTo(null);

    try {
      const socket = getSocket();
      const tempId = `temp_${Date.now()}`;
      const optimistic = {
        _id: tempId,
        senderId: user?._id,
        text,
        createdAt: new Date().toISOString(),
        __status: 'sending'
      };
      setMessages((prev) => [...prev, normalizeMessage(optimistic)]);

      if (socket && socket.connected) {
        console.log('📤 CLIENT EMIT send-message →', chatId, text.slice(0,50) + (text.length > 50 ? '...' : ''));
        socket.emit('send-message', { chatId, text });
        // Fallback refresh, но только если не пришел echo в разумный срок
        setTimeout(async () => {
          try {
            // Подстраховка: удалим временную запись, если она ещё осталась
            const msgs = await messagesAPI.getByChatId(chatId);
            setMessages((msgs || []).map(normalizeMessage));
          } catch {
            // ignore
          }
        }, 800);
      } else {
        await messagesAPI.send(chatId, text);
        const msgs = await messagesAPI.getByChatId(chatId);
        setMessages((msgs || []).map(normalizeMessage));
      }

      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessage(text);
    }
  };

  const getClientLabel = () => {
    return user?.name || user?.login || user?.email || 'Клиент';
  };

  const getClientInitial = () => {
    const label = String(getClientLabel() || '').trim();
    return (label[0] || 'U').toUpperCase();
  };

  const renderSupportAvatar = () => {
    return (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
        <img src="/img/logo.png" alt="support" className="w-full h-full object-contain p-1.5" />
      </div>
    );
  };

  const renderClientAvatar = () => {
    return (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full text-blue-200 flex items-center justify-center font-bold text-[10px] md:text-[11px]">
            {getClientInitial()}
          </div>
        )}
      </div>
    );
  };

  const normalizeForDisplay = (text) => {
    if (typeof text !== 'string') return text;
    return text.replace(/\u00ad/g, '').replace(/\u200b/g, '');
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return '';
    }
  };

  const renderReceipt = (msg) => {
    if (!isUserMessage(msg)) return null;
    const id0 = msg?._id || msg?.id;
    if (typeof id0 === 'string' && id0.startsWith('temp_')) {
      return <Check className="w-3 h-3 text-white/40" />;
    }
    const st = msg?.__status || 'delivered';
    if (st === 'read') return <CheckCheck className="w-3 h-3 text-blue-300" />;
    return <CheckCheck className="w-3 h-3 text-white/40" />;
  };

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const isTyping = (message || '').length > 0;
    console.log('⌨️ CLIENT TYPING →', isTyping ? 'true' : 'false', chatId);
    socket.emit('typing', { chatId, isTyping });
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⌨️ CLIENT TYPING → false', chatId);
      try { socket.emit('typing', { chatId, isTyping: false }); } catch { void 0; }
    }, 1200);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [message, chatId]);

  const getFileUrl = (filename) => {
    return filesAPI.getFileUrl(filename);
  };

  const renderAttachment = (att) => {
    const attUrl = att?.url || att?.fileUrl || att?.path || att?.filename;
    const fileUrl = getFileUrl(attUrl);
    const mime = att?.mimetype || att?.type || '';
    const sanitize = (s) => {
      try {
        const n = (s || '').normalize('NFC');
        return n.replace(/[^\u0020-\u007E\u00A0-\u00BF\u0100-\u024F\u0400-\u04FF\u10A0-\u10FF\u1C90-\u1CBF0-9A-Za-zА-Яа-яა-ჰ.\-_()\s]/g, '').trim() || t('file');
      } catch {
        return t('file');
      }
    };
    const baseName = sanitize(att?.originalName || att?.name || att?.filename || '');
    const prettify = (s, url) => {
      let b = s && s.length > 0 ? s : decodeURIComponent((url || '').split('/').pop() || t('file'));
      b = b.replace(/^[a-f0-9]{8,}[_-]/i, '');
      // Known original names translation
      if (b === 'Документ') b = t('document');
      if (b === 'Подпись менеджера') b = t('manager_signature');
      if (b === 'Подпись клиента') b = t('client_signature');
      return b || t('file');
    };
    const name = prettify(baseName, fileUrl);

    if (mime.startsWith('image/')) {
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={name}
            className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    if (mime.startsWith('video/')) {
      return (
        <video
          src={fileUrl}
          controls
          className="max-w-full rounded-lg border border-white/10"
        />
      );
    }

    if (mime.startsWith('audio/')) {
      return (
        <audio
          src={fileUrl}
          controls
          className="w-full"
        />
      );
    }

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-300 hover:text-blue-100 underline text-[10px] min-w-0"
      >
        <Download className="w-3 h-3" />
        <span className="min-w-0 whitespace-pre-wrap break-words">{name}</span>
      </a>
    );
  };

  const renderTextWithLinks = (text) => {
    if (typeof text !== 'string') return text;
    const normalized = text.trim();
    if (normalized === 'Документ подписан клиентом') return t('doc_signed_by_client');
    if (normalized === 'Документ отклонён клиентом') return t('doc_rejected_by_client');
    const sanitize = (s) => {
      try {
        // Разрешаем: латиницу, кириллицу, грузинский, цифры, базовую пунктуацию и пробелы
        return s.replace(/[^\u0020-\u007E\u00A0-\u00BF\u0100-\u024F\u0400-\u04FF\u10A0-\u10FF\u1C90-\u1CBF\u2D00-\u2D2F\u2010-\u206F]/g, '');
      } catch { return s; }
    };
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, idx) => {
      if (part.match(/^https?:\/\//)) {
        return (
          <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline break-all">
            {part}
          </a>
        );
      }
      return <span key={idx}>{sanitize(part)}</span>;
    });
  };

  const extractSignLink = (text) => {
    if (typeof text !== 'string') return null;
    const m = text.match(/https?:\/\/[^\s]*\/sign\/([a-fA-F0-9]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
    if (!m) return null;
    return { url: m[0], id: m[1] };
  };

  const [signPosModal, setSignPosModal] = useState({
    open: false,
    link: null,
    requestId: null,
    previewUrl: null,
    pos: null,
    scale: 1,
    drawing: false,
    signDataUrl: '',
    sending: false,
  });
  useEffect(() => {
    if (!signPosModal.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [signPosModal.open]);
  const [legalCardOpen, setLegalCardOpen] = useState(false);
  const [legalCardMsg, setLegalCardMsg] = useState(null);

  const openSignPosModal = async (msg) => {
    const sign = extractSignLink(msg?.text || '');
    if (!sign) return;
    try {
      const { signaturesAPI } = await import('../config/api');
      const doc = await signaturesAPI.get(sign.id);
      if (doc?.clientSignatureUrl || doc?.status === 'completed') {
        alert(t('doc_already_signed'));
        return;
      }
    } catch {/* ignore */}
    // берем первый подходящий attachment (pdf/image)
    const att = (msg.attachments || []).find(a => {
      const mime = a?.mimetype || a?.type || '';
      return mime.includes('pdf') || mime.startsWith('image/');
    }) || (msg.attachments || [])[0];
    const fileUrl = att ? getFileUrl(att?.url || att?.fileUrl || att?.filename) : null;
    setSignPosModal({
      open: true,
      link: sign.url,
      requestId: sign.id,
      previewUrl: fileUrl,
      pos: null,
      scale: 1,
      drawing: false,
      signDataUrl: '',
      sending: false,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (signPosModal.open && signPosModal.requestId && !signPosModal.pos) {
          const { signaturesAPI } = await import('../config/api');
          const doc = await signaturesAPI.get(signPosModal.requestId);
          if (!cancelled && doc?.managerSignPos) {
            setSignPosModal(s => ({ ...s, pos: doc.managerSignPos }));
          }
        }
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; };
  }, [signPosModal.open, signPosModal.requestId]);

  

  const handleMouseDown = (e) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - dimensions.width,
      y: e.clientY - dimensions.height
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isMobile) return;
    const newWidth = Math.max(360, Math.min(900, e.clientX - dragStart.x));
    const newHeight = Math.max(520, Math.min(1000, e.clientY - dragStart.y));
    setDimensions({ width: newWidth, height: newHeight });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, isMobile]);

  const toggleMaximize = () => {
    if (isMobile) return;
    setIsMaximized(!isMaximized);
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[150]">
      {hasNewMessage && !isOpen && (
        <div className="pointer-events-none fixed bottom-[11rem] right-4 md:bottom-[7.5rem] md:right-8 z-[9999]">
          <div className="bg-[#050a18]/95 border border-white/10 text-white text-[11px] md:text-xs px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md max-w-[80vw] md:max-w-none text-center">
            {getNewMessageToastText()}
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-16 h-16 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all relative
        ${isMobile && scrolled ? 'bg-blue-600 opacity-100' : 'bg-blue-600/60 opacity-90'} hover:bg-blue-600 hover:opacity-100 hover:scale-110`}
      >
        <svg className="w-6 h-6 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={widgetRef}
          data-section="chat"
          className={`
            ${isMobile 
              ? 'fixed inset-0 w-full h-full rounded-none' 
              : isMaximized 
                ? 'fixed inset-4 md:left-8 md:right-8 md:bottom-8 md:top-24 rounded-4xl' 
                : 'fixed top-24 right-24 md:right-28 rounded-4xl'
            } 
            bg-[#0a0a0a] border border-blue-500/20 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fadeIn
          `}
          style={
            !isMobile && !isMaximized ? {
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              maxHeight: 'calc(100vh - 8rem)'
            } : {}
          }
        >
          <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
            {isSelecting ? (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Отменить"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <span className="text-white text-[10px] uppercase font-bold tracking-widest truncate">
                  Выбрано: {selectedMessages.size}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full min-w-0">
                {/* Левая часть: лого + название */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <img src="/img/logo.png" alt="support" className="w-full h-full object-contain p-2" />
                  </div>
                  <div className="text-white text-[10px] font-black tracking-[0.2em] uppercase leading-tight truncate">CONNECTOR SUPPORT</div>
                </div>
                {/* Статус — с отступом справа чтобы не наслаивался на кнопки */}
                <div className="flex items-center gap-1.5 flex-shrink-0 mr-8">
                  <span className={`inline-block w-2 h-2 rounded-full ${supportOnline ? 'bg-green-400' : 'bg-white/20'}`} />
                  <span className="text-white/60 text-[10px]">
                    {supportTyping ? t('chat_typing') : (supportOnline ? t('chat_online') : t('chat_offline'))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isSelecting ? (
                <>
                  <button
                    type="button"
                    onClick={handleReplySelected}
                    disabled={selectedMessages.size !== 1}
                    className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
                    title="Ответить"
                  >
                    <Reply className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePinSelected}
                    disabled={selectedMessages.size !== 1}
                    className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
                    title="Закрепить"
                  >
                    <Pin className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-red-300 hover:text-red-200 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </>
              ) : (
                !isMobile && (
                  <button 
                    onClick={toggleMaximize}
                    className="text-white/40 hover:text-white transition-colors"
                    title={isMaximized ? "Свернуть" : "Развернуть"}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                )
              )}
              <button
                onClick={async () => {
                  const ok = window.confirm(t('chat_close_confirm_clear'));
                  setIsOpen(false);
                  if (!ok || !chatId) return;

                  const now = Date.now();
                  try { localStorage.setItem(`chatwidget_clear_ts_${chatId}`, String(now)); } catch { void 0; }

                  try {
                    const lines = (messages || []).map((m) => {
                      const ts = m?.createdAt ? new Date(m.createdAt).toISOString() : '';
                      const sender = m?.senderId === 'manager' ? 'MANAGER' : (isUserMessage(m) ? 'CLIENT' : (m?.senderId || 'SYSTEM'));
                      const text = String(m?.text || '').replace(/\r?\n/g, ' ');
                      return `${ts} [${sender}] ${text}`;
                    });
                    const payload = lines.join('\n');
                    const file = new File([payload], `chat_session_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`, { type: 'text/plain' });
                    await filesAPI.upload(file, chatId);
                  } catch { void 0; }

                  setAiHelpFlow(null);
                  aiDocsRef.current = null;
                  aiActionLogRef.current = [];
                  clearSmartTranscript();
                  setSmartMode('locked');
                  setSmartResetNonce((n) => n + 1);
                  setAiSessionStartMs(0);
                  setSelectedMessages(new Set());
                  setPinnedMessage(null);
                  setReplyTo(null);
                  setMessage('');
                  setMessages([]);
                }}
                className="text-white/40 hover:text-white text-sm md:text-base leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y] custom-scrollbar">
          {pinnedMessage && (
            <div className="px-3 py-2 md:px-4 md:py-3 border-b border-white/5 bg-blue-500/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Закреплено</div>
                <div className="mt-1 text-xs text-white/80 whitespace-pre-wrap break-words line-clamp-2">
                  {parseReplyMetaFromText(pinnedMessage.text)?.bodyText || pinnedMessage.text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinnedMessage(null);
                  try {
                    if (chatId) localStorage.removeItem(`chatwidget_pinned_${chatId}`);
                  } catch {
                    // ignore
                  }
                }}
                className="text-white/60 hover:text-white transition-colors"
                title="Открепить"
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          )}
          
          <SmartOrderSystem
            mode={smartMode}
            onModeChange={(next) => {
              setSmartMode(next);
              if (next === 'assistant') setAiSessionStartMs(Date.now());
              if (next === 'locked') setAiSessionStartMs(0);
            }}
            initialBrief={{
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              email: user?.email || '',
              phone: user?.phone || ''
            }}
            resetNonce={smartResetNonce}
            onCloseAssistant={async () => {
              const ok = window.confirm(t('smart_close_confirm'));
              if (!ok) return;
              clearSmartTranscript();
              setMessages((prev) => (prev || []).filter((m) => {
                const id0 = String(m?._id || m?.id || '');
                if (id0.startsWith('smart_')) return false;
                if (id0.startsWith('smart_prompt_')) return false;
                if (id0.startsWith('ai_done_')) return false;
                if (String(m?.senderId || '') === 'assistant') return false;
                return true;
              }));
              setSmartMode('locked');
              setSmartResetNonce((n) => n + 1);
            }}
            onRestart={() => {
              clearSmartTranscript();
              aiDocsRef.current = null;
              aiActionLogRef.current = [];
              setAiHelpFlow(null);
              setMessages((prev) => (prev || []).filter((m) => {
                const id = String(m?._id || m?.id || '');
                if (id.startsWith('smart_')) return false;
                if (id.startsWith('ai_done_')) return false;
                if (String(m?.senderId || '') === 'assistant') return false;
                if (id.startsWith('smart_prompt_')) return false;
                return true;
              }));
            }}
            onAssistantMessage={appendAssistantMessage}
            onManagerLog={sendManagerLog}
            onTransferToManager={async ({ reasonKey }) => {
              if (!chatId) return;
              try {
                await messagesAPI.send(chatId, `🤖🔔MANAGER_REQUEST reason=${String(reasonKey || 'smart_reason_contact_manager')}`);
              } catch { void 0; }
              appendAssistantMessage(t('smart_manager_soon'));
            }}
            onOrderPrepared={async (payload) => {
              try {
                const session = payload?.orderSession || {};
                const brief = session?.brief || {};
                const services = (session?.selectedServices || []).map((id) => String(id));
                
                appendAssistantMessage(t('smart_order_processing'));
                const docs = await finalizeOrderPackage(session);

                const lang2 = String(i18n?.language || '').toLowerCase().slice(0, 2);
                const fixed = i18n.getFixedT(lang2 === 'en' ? 'en' : (lang2 === 'ka' ? 'ka' : 'ru'));
                const serviceNames = services.map((sid) => {
                  const map = {
                    svc_bending: 'smart_svc_bending',
                    svc_laser_engraving: 'smart_svc_laser_engraving',
                    svc_laser_cut_metal: 'smart_svc_laser_cut_metal',
                    svc_laser_cut_nonmetal: 'smart_svc_laser_cut_nonmetal',
                    svc_powder_paint: 'smart_svc_powder_paint',
                    svc_welding: 'smart_svc_welding',
                    svc_mech: 'smart_svc_mech',
                    svc_cnc: 'smart_svc_cnc',
                    svc_liquid_paint: 'smart_svc_liquid_paint',
                    svc_materials: 'smart_svc_materials'
                  };
                  return fixed(map[sid] || sid);
                });

                const orderData = {
                  firstName: String(brief?.firstName || ''),
                  lastName: String(brief?.lastName || ''),
                  contact: String(brief?.email || brief?.phone || ''),
                  phone: String(brief?.phone || ''),
                  services: serviceNames,
                  comment: (() => {
                    const sd = session?.stepData && typeof session.stepData === 'object' ? session.stepData : {};
                    const lines = [];
                    Object.entries(sd).forEach(([k, v]) => {
                      const w = String(v?.wishes || '').trim();
                      if (!w) return;
                      lines.push(`${k}: ${w}`);
                    });
                    return lines.join(' | ');
                  })(),
                  aiSession: {
                    meta: session?.meta || {},
                    answers: session?.answers || {},
                    selectedServices: session?.selectedServices || [],
                    brief: session?.brief || {},
                    actions: aiActionLogRef.current || [],
                    stepData: session?.stepData || {}
                  },
                  files: [
                    ...(docs?.zipUrl ? [{ name: 'ai_order.zip', type: 'application/zip', size: null, url: docs.zipUrl }] : []),
                    ...(docs?.imageFiles || [])
                  ]
                };

                console.log('Sending order data to API:', orderData);
                const resp = await ordersAPI.create(orderData);
                console.log('Order created response:', resp);

                const createdOrderRef = resp?.chatId && resp?.orderIndex != null
                  ? { chatId: resp.chatId, orderIndex: resp.orderIndex }
                  : null;

                sendManagerLog('✅ Заказ сформирован и отправлен');
                clearSmartTranscript();
                aiDocsRef.current = null;
                setMessages((prev) => (prev || []).filter((m) => {
                  const id = String(m?._id || m?.id || '');
                  if (id.startsWith('smart_')) return false;
                  if (id.startsWith('smart_prompt_')) return false;
                  if (String(m?.senderId || '') === 'assistant') return false;
                  return true;
                }));
                appendAiFinalNotice(t('smart_order_sent'));
                setAiHelpFlow({ stage: 'ask', orderRef: createdOrderRef });
              } catch (err) {
                console.error('Order preparation/sending failed:', err);
                try { sendManagerLog(`❌ Ошибка сохранения заказа: ${err?.message || 'unknown'}`); } catch { void 0; }
                clearSmartTranscript();
                aiDocsRef.current = null;
                setMessages((prev) => (prev || []).filter((m) => {
                  const id = String(m?._id || m?.id || '');
                  if (id.startsWith('smart_')) return false;
                  if (id.startsWith('smart_prompt_')) return false;
                  if (id.startsWith('ai_done_')) return false;
                  if (String(m?.senderId || '') === 'assistant') return false;
                  return true;
                }));
                appendAiFinalNotice(t('smart_order_sent'));
                setAiHelpFlow({ stage: 'ask', orderRef: null });
              }
            }}
          />

          {aiHelpFlow && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 space-y-2">
              {aiHelpFlow.stage === 'ask' && (
                <>
                  <div className="text-white/80 text-[12px]">{t('smart_help_question')}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiHelpFlow((p) => ({ ...p, stage: 'comment', text: '' }));
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                    >
                      {t('smart_yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiHelpFlow((p) => ({ ...p, stage: 'confirm_close' }));
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10"
                    >
                      {t('smart_no')}
                    </button>
                  </div>
                </>
              )}

              {aiHelpFlow.stage === 'comment' && (
                <div className="space-y-2">
                  <div className="text-white/80 text-[12px]">{t('smart_help_comment_prompt')}</div>
                  <textarea
                    value={aiHelpFlow.text || ''}
                    onChange={(e) => setAiHelpFlow((p) => ({ ...(p || {}), text: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40 resize-none"
                    placeholder={t('smart_help_comment_placeholder')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const txt = String(aiHelpFlow.text || '').trim();
                        if (!txt) return;
                        const orderRef = aiHelpFlow.orderRef;
                        try {
                          if (orderRef?.chatId && orderRef?.orderIndex != null) {
                            await ordersAPI.updateClientComment(orderRef.chatId, orderRef.orderIndex, txt);
                          }
                          if (chatId) await messagesAPI.send(chatId, `👤 ${t('smart_manager_comment_prefix')} ${txt}`);
                        } catch { void 0; }
                        setAiHelpFlow((p) => ({ ...p, stage: 'ask' }));
                        setSmartMode('locked');
                        setSmartResetNonce((n) => n + 1);
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                    >
                      {t('smart_help_send_comment')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiHelpFlow((p) => ({ ...p, stage: 'ask' }));
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10"
                    >
                      {t('smart_back')}
                    </button>
                  </div>
                </div>
              )}

              {aiHelpFlow.stage === 'confirm_close' && (
                <>
                  <div className="text-white/80 text-[12px]">{t('smart_help_close_confirm')}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        appendAiFinalNotice(t('smart_help_session_closed'));
                        setAiHelpFlow(null);
                        clearSmartTranscript();
                        aiActionLogRef.current = [];
                        aiDocsRef.current = null;
                        setMessages((prev) => (prev || []).filter((m) => {
                          const id0 = String(m?._id || m?.id || '');
                          if (id0.startsWith('smart_')) return false;
                          if (id0.startsWith('smart_prompt_')) return false;
                          if (String(m?.senderId || '') === 'assistant') return false;
                          return true;
                        }));
                        setSmartMode('locked');
                        setSmartResetNonce((n) => n + 1);
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                    >
                      {t('smart_yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiHelpFlow((p) => ({ ...p, stage: 'ask' }));
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10"
                    >
                      {t('smart_no')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="px-4 py-3 md:px-5 md:py-4 space-y-3">
            {messages.map((msg) => {
              if (smartMode === 'assistant') {
                const created = msg?.createdAt ? new Date(msg.createdAt).getTime() : 0;
                if (aiSessionStartMs && created && created < aiSessionStartMs) return null;
                if (String(msg?.senderId || '') === 'manager') return null;
              }
              const isMine = isUserMessage(msg);
              const msgId = getMsgId(msg);
              const isSelected = !!msgId && selectedMessages.has(msgId);
              const replyMeta = parseReplyMetaFromText(normalizeForDisplay(msg.text));
              const hasAttachments = msg.attachments && msg.attachments.length > 0;
              const isAiLog = typeof msg.text === 'string' && msg.text.trim().startsWith('🤖');
              if (isAiLog) return null;
              const firstAtt = Array.isArray(msg.attachments) ? msg.attachments[0] : null;
              const firstName = String(firstAtt?.originalName || firstAtt?.filename || firstAtt?.name || '');
              if (firstName.toLowerCase().startsWith('chat_session_')) return null;
              const isAutoFileText =
                typeof msg.text === 'string' &&
                (msg.text.startsWith('📎') || msg.text.includes('Отправлен файл'));
              const isMediaOnly =
                hasAttachments &&
                (msg.attachments || []).every((att) => {
                  const mime = att?.mimetype || att?.type || '';
                  return mime.startsWith('image/') || mime.startsWith('video/');
                });
              const showText = (!hasAttachments || (!isMediaOnly && msg.text && !isAutoFileText)) && !extractSignLink(msg?.text || '');
              const isSupportMessage = !isMine;
              const avatarEl = isSupportMessage ? renderSupportAvatar() : renderClientAvatar();
              return (
                <div key={msg._id || msg.id} className="w-full flex justify-end">
                  <div className="w-full flex flex-col items-end">
                    <div className="mb-1">{avatarEl}</div>
                    <div
                      role={isSelecting ? 'button' : undefined}
                      tabIndex={isSelecting ? 0 : undefined}
                      onMouseDown={() => handleMessagePressStart(msg)}
                      onMouseUp={handleMessagePressEnd}
                      onMouseLeave={handleMessagePressEnd}
                      onTouchStart={() => handleMessagePressStart(msg)}
                      onTouchMove={handleMessagePressEnd}
                      onTouchEnd={handleMessagePressEnd}
                      onClick={(e) => {
                        if (longPressTriggeredRef.current) {
                          longPressTriggeredRef.current = false;
                          e.preventDefault();
                          return;
                        }
                        if (isSelecting) {
                          e.preventDefault();
                          toggleMessageSelection(msg);
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-2xl text-[12px] md:text-sm text-left overflow-hidden ${
                        isMine ? 'bg-white/10 text-white rounded-br-none' : 'bg-blue-600/30 text-white/90 rounded-bl-none'
                      } ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
                    >
                      {isSelecting && (
                        <div className="flex items-center justify-end mb-1">
                          {isSelected ? (
                            <CheckSquare className="w-3 h-3 text-white" />
                          ) : (
                            <Square className="w-3 h-3 text-white/60" />
                          )}
                        </div>
                      )}

                      {replyMeta && (
                        <div className="mb-2 px-2 py-1 rounded-lg bg-black/20 border border-white/10">
                          <div className="text-[10px] text-white/60">Ответ</div>
                          <div className="text-[11px] text-white/80 whitespace-pre-wrap break-words line-clamp-2">
                            {replyMeta.snippet}
                          </div>
                        </div>
                      )}

                      {showText && (
                        <p className="whitespace-pre-wrap" style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}>
                          {renderTextWithLinks(selectI18nText(normalizeForDisplay(replyMeta?.bodyText ?? msg.text)))}
                        </p>
                      )}
                      {hasAttachments && !extractSignLink(msg?.text || '') && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="space-y-1">
                              {renderAttachment(att)}
                            </div>
                          ))}
                        </div>
                      )}
                      {extractSignLink(msg?.text || '') && (
                        <div className="mt-2">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs text-white/80 font-medium">{t('doc_sign_card_title')}</div>
                                <div className="text-[11px] text-white/60 truncate max-w-[260px]">
                                  {t('doc_sign_card_hint')}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setLegalCardMsg(msg); setLegalCardOpen(true); }}
                                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 text-[11px]"
                                >
                                  {t('open')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className={`mt-2 flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-white/50">{formatTime(msg?.createdAt || msg?.created_at)}</span>
                        {isMine && renderReceipt(msg)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (smartMode !== 'manager') return;
              sendMessage(e);
            }}
            className="px-4 py-3 border-t border-white/10 flex flex-col gap-2 bg-white/5"
          >
            {replyTo && (
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Ответ</div>
                  <div className="text-xs text-white/80 whitespace-pre-wrap break-words line-clamp-2">
                    {String(parseReplyMetaFromText(replyTo.text)?.bodyText || replyTo.text || '').slice(0, 120)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                  title="Отменить"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || smartMode !== 'manager'}
                className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
                title="Прикрепить файл"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>
              <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={smartMode !== 'manager'}
                placeholder={smartMode !== 'manager' ? t('smart_input_locked') : (supportTyping ? t('chat_typing') : t('chat_input_placeholder'))}
                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
              />
              <button type="submit" disabled={smartMode !== 'manager'} className="text-white/80 hover:text-white transition-colors disabled:opacity-40">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </div>
            {!isMobile && !isMaximized && (
              <div 
                className="absolute bottom-2 right-2 w-4 h-4 cursor-ns-resize"
                onMouseDown={handleMouseDown}
                title="Изменить размер"
              />
            )}
          </form>
          <div className="px-4 py-2 border-t border-white/5 text-center">
            <p className="text-[9px] text-white/20 tracking-widest uppercase">
              &copy; 2026 Connector Official By PHOENIX.. All rights reserved.
            </p>
          </div>
        </div>
      )}
      {signPosModal.open && (
        <div className="fixed inset-0 z-[10000]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSignPosModal(s => ({ ...s, open: false }))} />
          <div className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-8 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-3xl">
            <div className="bg-[#0b1020] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-white font-semibold">{t('sign_modal_title')}</div>
                <button onClick={() => setSignPosModal(s => ({ ...s, open: false }))} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">✕</button>
              </div>
              <div className="p-4 overflow-y-auto overscroll-contain space-y-3">
                <div className="text-white/80 text-sm">{t('sign_draw_send_manager')}</div>
                <SignPosPreview
                  previewUrl={signPosModal.previewUrl}
                  scale={signPosModal.scale}
                  onScaleChange={(scale) => setSignPosModal(s => ({ ...s, scale }))}
                  onDraw={(dataUrl) => setSignPosModal(s => ({ ...s, signDataUrl: dataUrl }))}
                />
              </div>
              <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignPosModal(s => ({ ...s, open: false }))}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={!signPosModal.requestId || !signPosModal.signDataUrl || signPosModal.sending}
                  onClick={async () => {
                    try {
                      setSignPosModal(s => ({ ...s, sending: true }));
                      await signaturesAPI.clientSign(signPosModal.requestId, signPosModal.signDataUrl, signPosModal.pos || null);
                      alert(t('sign_sent_success'));
                      setSignPosModal(s => ({ ...s, open: false, sending: false }));
                    } catch {
                      alert(t('sign_send_error'));
                      setSignPosModal(s => ({ ...s, sending: false }));
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 disabled:opacity-60"
                >
                  {t('sign_and_send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {legalCardOpen && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setLegalCardOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 mx-auto w-full sm:max-w-md bg-[#0a0f1f] border border-white/10 rounded-t-2xl sm:rounded-2xl p-4">
            <div className="text-white font-semibold mb-2">{t('legal_title')}</div>
            <div className="text-white/80 text-sm">{t('legal_text')}</div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setLegalCardOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = legalCardMsg;
                  setLegalCardOpen(false);
                  setLegalCardMsg(null);
                  if (m) openSignPosModal(m);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600"
              >
                {t('agree')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

const SignPosPreview = memo(function SignPosPreview({ previewUrl, scale = 1, onScaleChange, onDraw }) {
  const ref = React.useRef(null);
  const [isImg, setIsImg] = React.useState(false);
  const [legalOpen, setLegalOpen] = React.useState(false);
  const { t } = useTranslation();
  const [baseWidth, setBaseWidth] = React.useState(0);
  const ptrsRef = React.useRef(new Map());
  const pinchDistRef = React.useRef(0);
  const pinchScaleRef = React.useRef(1);
  const canvasRef = React.useRef(null);
  const drawingRef = React.useRef(false);
  const lastRef = React.useRef({ x: 0, y: 0 });
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const pdfContainerRef = React.useRef(null);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const isPdf = String(previewUrl || '').toLowerCase().endsWith('.pdf');
  const [renderTick, setRenderTick] = React.useState(0);
  const MIN_SCALE = isMobile ? 1 : 0.6;
  const MAX_SCALE = 2;
  const isPinchingRef = React.useRef(false);
  const cssPreviewScaleRef = React.useRef(1);
  // const pdfTextRef = React.useRef(null);
  React.useEffect(() => {
    const url = String(previewUrl || '').toLowerCase();
    setIsImg(/\.(png|jpg|jpeg|webp|gif)$/.test(url));
  }, [previewUrl]);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(rect.width * dpr));
    c.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);
  React.useEffect(() => {
    const onResize = () => {
      const el = ref.current?.parentElement;
      if (el) setBaseWidth(Math.max(280, Math.floor(el.clientWidth)));
      setRenderTick((n) => n + 1);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    const loadPdfJs = async () => {
      if (!isPdf || !previewUrl) return;
      try {
        setPdfLoading(true);
        if (!window.pdfjsLib) {
          const s1 = document.createElement('script');
          s1.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
          const s2 = document.createElement('script');
          s2.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          await new Promise((r, j) => { s1.onload = r; s1.onerror = j; document.head.appendChild(s1); });
          await new Promise((r, j) => { s2.onload = r; s2.onerror = j; document.head.appendChild(s2); });
        }
        if (cancelled) return;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        const resp = await fetch(previewUrl);
        const buf = await resp.arrayBuffer();
        const doc = await window.pdfjsLib.getDocument({ data: buf }).promise;
        const cont = pdfContainerRef.current;
        if (!cont) return;
        cont.innerHTML = '';
        const containerWidth = Math.max(280, baseWidth || Math.floor((cont.clientWidth || 560)));
        const displayWidth = Math.round(containerWidth * Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)));
        if (ref.current) ref.current.style.width = `${displayWidth}px`;
        cont.style.width = `${displayWidth}px`;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const dpr = Math.max(1, window.devicePixelRatio || 1);
          const fitScale = displayWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: fitScale * dpr });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const cssHeight = Math.round(viewport.height / dpr);
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${cssHeight}px`;
          const div = document.createElement('div');
          div.style.position = 'relative';
          div.style.width = `${displayWidth}px`;
          div.style.height = `${cssHeight}px`;
          div.appendChild(canvas);
          cont.appendChild(div);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) {
          setPdfLoading(false);
        }
      } catch {
        setPdfLoading(false);
      }
    };
    loadPdfJs();
    return () => { cancelled = true; };
  }, [isPdf, previewUrl, scale, isMobile, renderTick, baseWidth]);
  const onPtrDown = (e) => {
    if (!isMobile) return;
    const m = ptrsRef.current;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (m.size === 2) {
      isPinchingRef.current = true;
      const a = Array.from(m.values());
      const dx = a[0].x - a[1].x;
      const dy = a[0].y - a[1].y;
      pinchDistRef.current = Math.hypot(dx, dy) || 1;
      pinchScaleRef.current = scale;
      cssPreviewScaleRef.current = 1;
      if (ref.current) {
        ref.current.style.transformOrigin = 'top left';
        ref.current.style.transform = 'scale(1)';
      }
    }
  };
  const onPtrMove = (e) => {
    const m = ptrsRef.current;
    if (m.size < 2) return;
    if (!m.has(e.pointerId)) return;
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = Array.from(m.values());
    const dx = a[0].x - a[1].x;
    const dy = a[0].y - a[1].y;
    const dist = Math.hypot(dx, dy) || 1;
    const k = dist / (pinchDistRef.current || 1);
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchScaleRef.current * k));
    if (ref.current) {
      const cssScale = next / scale;
      cssPreviewScaleRef.current = cssScale;
      ref.current.style.transform = `scale(${cssScale})`;
    }
  };
  const onPtrUp = (e) => {
    const m = ptrsRef.current;
    m.delete(e.pointerId);
    if (isPinchingRef.current && m.size < 2) {
      isPinchingRef.current = false;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchScaleRef.current * (cssPreviewScaleRef.current || 1)));
      if (ref.current) {
        ref.current.style.transform = 'none';
      }
      if (next !== scale) onScaleChange?.(next);
    }
  };
  const start = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e?.touches?.[0] || e?.changedTouches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    drawingRef.current = true;
    lastRef.current = { x, y };
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + pressure, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    onDraw?.(c.toDataURL('image/png'));
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e?.touches?.[0] || e?.changedTouches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3 * pressure;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastRef.current = { x, y };
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current;
    if (!c) return;
    const data = c.toDataURL('image/png');
    onDraw?.(data);
  };
  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    onDraw?.('');
  };
  return (
      <div className="relative bg-white/5 border border-white/10 rounded-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/70 text-xs">{t('scale')}</div>
        {isMobile ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onScaleChange?.(Math.max(0.6, +(scale - 0.1).toFixed(2)))}
              className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
              aria-label="Zoom out"
            >−</button>
            <div className="text-white/80 text-xs w-12 text-center">{Math.round(scale * 100)}%</div>
            <button
              type="button"
              onClick={() => onScaleChange?.(Math.min(2, +(scale + 0.1).toFixed(2)))}
              className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
              aria-label="Zoom in"
            >+</button>
          </div>
        ) : (
          <>
            <input
              type="range"
              min="0.6"
              max="2"
              step="0.05"
              value={scale}
              onChange={(e) => onScaleChange?.(parseFloat(e.target.value))}
              className="w-40 accent-purple-600"
            />
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="text-blue-300 underline text-xs"
            >
              {t('open_full')}
            </button>
          </>
        )}
      </div>
      <div
        className="relative w-full h-[42vh] sm:h-[60vh] bg-white rounded overflow-auto"
        style={{ touchAction: isMobile ? 'auto' : 'manipulation', overflowX: 'auto', overflowY: 'auto' }}
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
        onPointerCancel={onPtrUp}
      >
        <div ref={ref} className="relative" style={{ width: baseWidth ? Math.round(baseWidth * scale) : '100%', height: '100%' }}>
          {isImg ? (
            <img alt="doc" src={previewUrl} style={{ width: baseWidth ? Math.round(baseWidth * scale) : '100%', height: 'auto', display: 'block' }} />
          ) : isPdf ? (
            (
              <div>
                {pdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-black/60">{t('loading')}</div>
                )}
                <div ref={pdfContainerRef} />
              </div>
            )
          ) : previewUrl ? (
            <iframe title="doc" src={previewUrl} style={{ width: baseWidth ? Math.round(baseWidth * scale) : '100%', height: '56vh', display: 'block' }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">{t('preview_unavailable')}</div>
          )}
        </div>
      </div>
      {legalOpen && !isMobile && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setLegalOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 mx-auto w-full sm:max-w-md bg-[#0a0f1f] border border-white/10 rounded-t-2xl sm:rounded-2xl p-4">
            <div className="text-white font-semibold mb-2">{t('legal_title')}</div>
            <div className="text-white/80 text-sm">{t('legal_text')}</div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setLegalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegalOpen(false);
                  if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600"
              >
                {t('agree')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-3">
        <div className="text-white/80 text-sm mb-1">{t('sign_field')}</div>
        <div className="relative border border-white/10 rounded bg-white p-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            className="w-full h-[160px] sm:h-[200px] bg-white rounded"
            style={{ touchAction: 'none' }}
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="absolute bottom-2 right-2 text-[11px] px-3 py-1.5 rounded bg-white/90 text-black hover:bg-white"
          >
            {t('clear')}
          </button>
        </div>
        <div className="text-xs text-white/60 mt-1">{t('sign_draw_and_send')}</div>
      </div>
    </div>
  );
});
