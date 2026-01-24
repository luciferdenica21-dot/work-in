const API_URL = import.meta.env.VITE_API_URL || '/api';

// Вспомогательные функции для токена
export const getToken = () => sessionStorage.getItem('token');
export const setToken = (token) => sessionStorage.setItem('token', token);
export const removeToken = () => sessionStorage.removeItem('token');

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

// ... далее без изменений: authAPI, chatsAPI, messagesAPI, filesAPI, ordersAPI
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return apiRequest('/auth/me');
  }
};

export const chatsAPI = {
  getMyChat: () => apiRequest('/chats/my-chat'),
  getAll: () => apiRequest('/chats'),
  getMessages: (chatId) => apiRequest(`/chats/${chatId}/messages`),
  markAsRead: (chatId) => apiRequest(`/chats/${chatId}/read`, { method: 'POST' }),
  delete: (chatId) => apiRequest(`/chats/${chatId}`, { method: 'DELETE' }),
};

export const messagesAPI = {
  send: (chatId, text) => apiRequest(`/messages`, {
    method: 'POST',
    body: JSON.stringify({ chatId, text }),
  }),
  delete: (messageId) => apiRequest(`/messages/${messageId}`, { method: 'DELETE' }),
};

export const filesAPI = {
  upload: async (file, chatId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    const token = getToken();
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },
  getFileUrl: (filename) => `${API_URL}/files/${filename}`,
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
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  delete: (chatId, orderIndex) => apiRequest(`/orders/${chatId}/${orderIndex}`, { method: 'DELETE' }),
};

export default API_URL;
