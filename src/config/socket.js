import { io } from 'socket.io-client';

const defaultSocketUrl = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
const isLocalDev = import.meta.env.DEV && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const SOCKET_URL = envSocketUrl || (isLocalDev ? 'http://localhost:5000' : (defaultSocketUrl || 'https://connector.ge'));

let socket = null;

export const initSocket = (userId, role, email) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      userId,
      role,
      email,
    },
    transports: ['websocket', 'polling'],
  });

socket.on('connect', () => {
  console.log(`🔌 SOCKET CONNECTED → ${socket.id?.slice(0,8)} (${socket.auth?.role})`);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 SOCKET DISCONNECTED → ${reason} (attempt reconnect)`);
});

socket.on('error', (error) => {
  console.error(`❌ SOCKET ERROR:`, error);
});
socket.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 SOCKET RECONNECT ATTEMPT #${attempt}`);
});
socket.on('reconnect', (attempt) => {
  console.log(`✅ SOCKET RECONNECTED after ${attempt} attempts`);
});
socket.on('reconnect_failed', () => {
  console.error('❌ SOCKET RECONNECT FAILED');
});

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

export default socket;
