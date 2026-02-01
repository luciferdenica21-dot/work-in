import React, { useState, useEffect, useRef } from 'react';
import { chatsAPI, messagesAPI, filesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { Paperclip, X, Download, Maximize2, Minimize2, Trash2, Pin, Reply, CheckSquare, Square } from 'lucide-react';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);

  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

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

    const loadChat = async () => {
      try {
        const chat = await chatsAPI.getMyChat();
        setChatId(chat.chatId);

        if (socket) {
          socket.emit('join-chat', chat.chatId);
        }

        const msgs = await messagesAPI.getByChatId(chat.chatId);
        setMessages((msgs || []).map(normalizeMessage));
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();

    if (socket) {
      const handleNewMessage = (newMsg) => {
        const incoming = normalizeMessage(newMsg?.message || newMsg);
        setMessages((prev) => {
          const id = incoming?._id || incoming?.id;
          if (id && prev.some((m) => (m._id || m.id) === id)) return prev;
          return [...prev, incoming];
        });
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        if (!isOpen && (incoming?.senderId === 'manager')) {
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

      socket.on('new-message', handleNewMessage);
      socket.on('message-deleted', handleMessageDeleted);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-deleted', handleMessageDeleted);
      };
    }

    return () => {
      disconnectSocket();
    };
  }, [user?._id, user?.email, user?.role, isOpen]);

  useEffect(() => {
    if (isOpen && chatId) {
      setTimeout(() => setHasNewMessage(false), 0);
      chatsAPI.markAsRead(chatId).catch(console.error);

      const loadMessages = async () => {
        try {
          const msgs = await chatsAPI.getMessages(chatId);
          setMessages((msgs || []).map(normalizeMessage));
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [isOpen, chatId]);

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
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, normalizeMessage(optimistic)]);

      if (socket && socket.connected) {
        socket.emit('send-message', { chatId, text });
        // Fallback refresh to avoid missing echo from server
        setTimeout(async () => {
          try {
            const msgs = await messagesAPI.getByChatId(chatId);
            setMessages((msgs || []).map(normalizeMessage));
          } catch {
            // ignore
          }
        }, 400);
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

  const isManagerMessage = (msg) => {
    return msg?.senderId === 'manager' || msg?.senderRole === 'manager' || msg?.role === 'manager';
  };

  const getSenderLabel = (msg) => {
    if (isManagerMessage(msg)) return 'Support';
    return getClientLabel();
  };

  const getClientInitial = () => {
    const label = String(getClientLabel() || '').trim();
    return (label[0] || 'U').toUpperCase();
  };

  const renderMessageAvatar = (isMine) => {
    if (!isMine) {
      return (
        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
          <img src="/img/logo.png" alt="logo" className="w-full h-full object-contain p-1" />
        </div>
      );
    }

    return (
      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200 flex items-center justify-center font-bold text-[10px] md:text-[11px]">
        {getClientInitial()}
      </div>
    );
  };

  const getFileUrl = (filename) => {
    return filesAPI.getFileUrl(filename);
  };

  const renderAttachment = (att) => {
    const attUrl = att?.url || att?.fileUrl || att?.path || att?.filename;
    const fileUrl = getFileUrl(attUrl);
    const mime = att?.mimetype || att?.type || '';
    const name = att?.originalName || att?.name || att?.filename || 'Файл';

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
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-150">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all relative"
      >
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-[#0a0a0a]"></span>
        )}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={widgetRef}
          className={`
            ${isMobile 
              ? 'fixed inset-0 w-full h-full rounded-none' 
              : isMaximized 
                ? 'fixed inset-4 md:inset-8 rounded-4xl' 
                : 'absolute bottom-20 right-0 rounded-4xl'
            } 
            bg-[#0a0a0a] border border-blue-500/20 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fadeIn
          `}
          style={
            !isMobile && !isMaximized ? {
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`
            } : {}
          }
        >
          <div className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
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
              <span className="text-white text-[10px] uppercase font-bold tracking-widest">CONNECTOR Support</span>
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
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-sm md:text-base leading-none">✕</button>
            </div>
          </div>

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
          
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
            {messages.map((msg) => {
              const isMine = isUserMessage(msg);
              const msgId = getMsgId(msg);
              const isSelected = !!msgId && selectedMessages.has(msgId);
              const replyMeta = parseReplyMetaFromText(msg.text);
              const hasAttachments = msg.attachments && msg.attachments.length > 0;
              const isAutoFileText =
                typeof msg.text === 'string' &&
                (msg.text.startsWith('📎') || msg.text.includes('Отправлен файл'));
              const isMediaOnly =
                hasAttachments &&
                (msg.attachments || []).every((att) => {
                  const mime = att?.mimetype || att?.type || '';
                  return mime.startsWith('image/') || mime.startsWith('video/');
                });
              const showText = !hasAttachments || (!isMediaOnly && msg.text && !isAutoFileText);
              return (
                <div key={msg._id || msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {renderMessageAvatar(isMine)}
                    <div
                      role={isSelecting ? 'button' : undefined}
                      tabIndex={isSelecting ? 0 : undefined}
                      onMouseDown={() => handleMessagePressStart(msg)}
                      onMouseUp={handleMessagePressEnd}
                      onMouseLeave={handleMessagePressEnd}
                      onTouchStart={() => handleMessagePressStart(msg)}
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
                      className={`min-w-0 max-w-[80%] px-3 py-2 rounded-2xl text-[11px] md:text-xs text-left ${
                        isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/80 rounded-tl-none'
                      } ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] text-white/60 leading-none">{getSenderLabel(msg)}</span>
                        {isSelecting && (
                          <span className="flex-shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-3 h-3 text-white" />
                            ) : (
                              <Square className="w-3 h-3 text-white/60" />
                            )}
                          </span>
                        )}
                      </div>

                      {replyMeta && (
                        <div className="mb-2 px-2 py-1 rounded-lg bg-black/20 border border-white/10">
                          <div className="text-[10px] text-white/60">Ответ</div>
                          <div className="text-[11px] text-white/80 whitespace-pre-wrap break-words line-clamp-2">
                            {replyMeta.snippet}
                          </div>
                        </div>
                      )}

                      {showText && (
                        <p className="whitespace-pre-wrap break-words">{replyMeta?.bodyText ?? msg.text}</p>
                      )}
                      {hasAttachments && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="space-y-1">
                              {renderAttachment(att)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex flex-col gap-2">
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
                disabled={uploading}
                className="text-blue-500 hover:text-white transition-colors disabled:opacity-50"
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
                placeholder="..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500/50"
              />
              <button type="submit" className="text-blue-500 hover:text-white transition-colors">
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
        </div>
      )}
    </div>
  );
};

export default ChatWidget;