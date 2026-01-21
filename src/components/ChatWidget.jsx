import React, { useState, useEffect, useRef } from 'react';
import { chatsAPI, messagesAPI, filesAPI } from '../config/api';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { Paperclip, X, Download } from 'lucide-react';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket
    const socket = initSocket(user._id, user.role || 'user', user.email);

    // Load chat
    const loadChat = async () => {
      try {
        const chat = await chatsAPI.getMyChat();
        setChatId(chat.chatId);

        // Join chat room
        if (socket) {
          socket.emit('join-chat', chat.chatId);
        }

        // Load messages
        const msgs = await chatsAPI.getMessages(chat.chatId);
        setMessages(msgs);
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();

    // Socket listeners
    if (socket) {
      const handleNewMessage = (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        
        // If widget is closed and message is from admin, show notification
        if (!isOpen && newMsg.senderId === 'manager') {
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
  }, [user?._id, user?.email, user?.role]);

  // Reset notification when opening widget
  useEffect(() => {
    if (isOpen && chatId) {
      setHasNewMessage(false);
      // Mark as read if admin sent message
      chatsAPI.markAsRead(chatId).catch(console.error);
      
      // Load messages when opening
      const loadMessages = async () => {
        try {
          const msgs = await chatsAPI.getMessages(chatId);
          setMessages(msgs);
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
      if (socket) {
        socket.emit('send-message', { chatId, text });
      } else {
        // Fallback to REST API
        await messagesAPI.send(chatId, text);
        const msgs = await chatsAPI.getMessages(chatId);
        setMessages(msgs);
      }
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessage(text); // Restore message on error
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
      // Передаем просто файл и ID чата, api.js сам все упакует
      await filesAPI.upload(file, chatId); 
      
      const msgs = await chatsAPI.getMessages(chatId);
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
    // Fix: Check if message is from current user
    return msg.senderId === user._id || msg.senderId === user._id?.toString();
  };

  const getFileUrl = (filename) => {
    return filesAPI.getFileUrl(filename);
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[150]">
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
        <div className="absolute bottom-20 right-0 w-[320px] h-[450px] bg-[#0a0a0a] border border-blue-500/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fadeIn">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-white text-[10px] uppercase font-bold tracking-widest">CONNECTOR Support</span>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => {
              const isMine = isUserMessage(msg);
              return (
                <div key={msg._id || msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/80 rounded-tl-none'}`}>
                    <p>{msg.text}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, idx) => {
                          const fileUrl = getFileUrl(att.filename);
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename);

                          return (
                            <div key={idx} className="space-y-1">
                              {isImage ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={fileUrl} 
                                    alt="attachment" 
                                    className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-300 hover:text-blue-100 underline text-[10px]"
                                >
                                  <Download className="w-3 h-3" />
                                  {att.originalName || 'Файл'}
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
            <div ref={scrollRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex flex-col gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
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
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;