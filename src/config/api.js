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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Проверяем, является ли ответ JSON-ом
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
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
    if (filename.startsWith('http')) return filename;
    // Отрезаем /api, чтобы получить корень сервера (http://localhost:5000)
    const BASE_URL = API_URL.replace('/api', '');
    const cleanFilename = filename.startsWith('/') ? filename : `/${filename}`;
    return `${BASE_URL}${cleanFilename}`;
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
  delete: (chatId, orderIndex) => apiRequest(`/orders/${chatId}/${orderIndex}`, {
    method: 'DELETE',
  }),
};