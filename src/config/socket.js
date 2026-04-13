import { io } from 'socket.io-client';

const defaultSocketUrl = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
const isLocalDev = import.meta.env.DEV && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const SOCKET_URL = isLocalDev ? defaultSocketUrl : (envSocketUrl || 'https://connector.ge');

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
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
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
