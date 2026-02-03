const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Вспомогательные функции для токена
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// Общий оберточный метод для запросов
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Проверяем, является ли ответ JSON-ом
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  me: () => apiRequest('/auth/me'),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (profileData) => apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  getUsers: () => apiRequest('/auth/users'),
  getUserById: (userId) => apiRequest(`/auth/users/${userId}`),
  deleteUser: (userId) => apiRequest(`/auth/users/${userId}`, { method: 'DELETE' }),
};

export const chatsAPI = {
  getAll: () => apiRequest('/chats'),
  getMyChat: () => apiRequest('/chats/my-chat'), // Исправлено на /my-chat
  getById: (chatId) => apiRequest(`/chats/${chatId}`),
  getMessages: (chatId) => messagesAPI.getByChatId(chatId),
  startChat: (userId) => apiRequest('/chats/start', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  markAsRead: (chatId) => apiRequest(`/chats/${chatId}/read`, {
    method: 'PATCH',
  }),
  updateStatus: (chatId, status) => apiRequest(`/chats/${chatId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  clearMessages: (chatId) => apiRequest(`/chats/${chatId}/messages`, {
    method: 'DELETE',
  }),
  deleteChat: (chatId) => apiRequest(`/chats/${chatId}`, {
    method: 'DELETE',
  }),
};

export const messagesAPI = {
  getByChatId: (chatId) => apiRequest(`/chats/${chatId}/messages`), 
  send: (chatId, text) => apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ chatId, text }),
  }),
  delete: (messageId) => apiRequest(`/messages/${messageId}`, { method: 'DELETE' }),
};

export const filesAPI = {
  upload: async (file, chatId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Добавляем chatId только если он не null
    if (chatId) {
      formData.append('chatId', chatId);
    }

    const token = getToken();
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // НЕ устанавливаем Content-Type - браузер установит его автоматически с правильным boundary
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  getFileUrl: (filename) => {
    if (!filename) return '';
    const raw = String(filename).trim();
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;

    // Получаем только протокол и домен (без /api)
    const url = new URL(API_URL);
    const origin = url.origin;

    // Normalize windows paths/backslashes and extract uploads part if needed
    const normalized = raw.replace(/\\/g, '/');

    let cleanFilename = normalized;
    const uploadsIdx = normalized.indexOf('/uploads/');
    if (uploadsIdx >= 0) {
      cleanFilename = normalized.slice(uploadsIdx);
    }

    if (!cleanFilename.startsWith('/') && cleanFilename.startsWith('uploads/')) {
      cleanFilename = `/${cleanFilename}`;
    }

    // If stored as bare filename in DB (old format), assume it lives in /uploads/
    if (!cleanFilename.includes('/') && cleanFilename.includes('.')) {
      cleanFilename = `/uploads/${cleanFilename}`;
    }

    if (!cleanFilename.startsWith('/')) {
      cleanFilename = `/${cleanFilename}`;
    }

    // VPS/nginx часто проксирует только /api, а /uploads может не отдаваться напрямую.
    // Backend кладет url как /uploads/<filename>, поэтому переписываем на /api/files/uploads/<filename>
    if (cleanFilename.startsWith('/uploads/')) {
      return `${origin}/api/files${cleanFilename}`;
    }
    // Если url уже содержит /api/files, оставляем как есть
    if (cleanFilename.startsWith('/api/files/')) {
      return `${origin}${cleanFilename}`;
    }

    return `${origin}${cleanFilename}`;
  },
};

export const ordersAPI = {
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  getAll: () => apiRequest('/orders'),
  updateStatus: (chatId, orderIndex, status) => apiRequest(`/orders/${chatId}/${orderIndex}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  updateDetails: (chatId, orderIndex, details) => apiRequest(`/orders/${chatId}/${orderIndex}/details`, {
    method: 'PUT',
    body: JSON.stringify(details),
  }),
  delete: (chatId, orderIndex) => apiRequest(`/orders/${chatId}/${orderIndex}`, {
    method: 'DELETE',
  }),
};
