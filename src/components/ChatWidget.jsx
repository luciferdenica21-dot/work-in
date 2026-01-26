import React, { useState, useEffect, useRef } from 'react';
import { chatsAPI, messagesAPI, filesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { Paperclip, X, Download, Maximize2, Minimize2 } from 'lucide-react';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);

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

      socket.on('new-message', handleNewMessage);

      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }

    return () => {
      disconnectSocket();
    };
  }, [user?._id, user?.email, user?.role, isOpen]);

  useEffect(() => {
    if (isOpen && chatId) {
      setHasNewMessage(false);
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;

    const text = message;
    setMessage('');

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
          } catch (err) {
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const isUserMessage = (msg) => {
    return msg.senderId === user._id || msg.senderId === user._id?.toString();
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

  const handleDeleteMessage = async (msg) => {
    if (!msg) return;
    if (!isUserMessage(msg)) return;

    const id = msg._id || msg.id;
    if (!id || String(id).startsWith('temp_')) return;

    if (!window.confirm('Удалить сообщение?')) return;

    try {
      await messagesAPI.delete(id);
      setMessages((prev) => prev.filter((m) => (m._id || m.id) !== id));
    } catch (err) {
      console.error('Error deleting message:', err);
      try {
        const msgs = await messagesAPI.getByChatId(chatId);
        setMessages((msgs || []).map(normalizeMessage));
      } catch (e) {
        // ignore
      }
    }
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
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-white text-[10px] uppercase font-bold tracking-widest">CONNECTOR Support</span>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <button 
                  onClick={toggleMaximize}
                  className="text-white/40 hover:text-white transition-colors"
                  title={isMaximized ? "Свернуть" : "Развернуть"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => {
              const isMine = isUserMessage(msg);
              const hasAttachments = msg.attachments && msg.attachments.length > 0;
              const showText = !hasAttachments || (msg.text && !msg.text.startsWith('📎'));
              return (
                <div key={msg._id || msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`min-w-0 max-w-[80%] px-3 py-2 rounded-2xl text-xs ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/80 rounded-tl-none'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] text-white/60 leading-none">{getSenderLabel(msg)}</span>
                      {isMine && (msg._id || msg.id) && !String(msg._id || msg.id).startsWith('temp_') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg)}
                          className="text-white/50 hover:text-white/90 transition-colors flex-shrink-0"
                          title="Удалить"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {showText && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
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
              );
            })}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex flex-col gap-2">
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
                className="absolute bottom-2 right-2 w-4 h-4 bg-blue-500/20 hover:bg-blue-500/40 rounded-full cursor-ns-resize transition-colors"
                onMouseDown={handleMouseDown}
                title="Изменить размер"
              >
                <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;