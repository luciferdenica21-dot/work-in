const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
export const getToken = () => {
  // Используем sessionStorage вместо localStorage для временных сессий
  return sessionStorage.getItem('token');
};

// Helper function to set auth token
export const setToken = (token) => {
  sessionStorage.setItem('token', token);
};

// Helper function to remove auth token
export const removeToken = () => {
  sessionStorage.removeItem('token');
};

// Generic fetch wrapper
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
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
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
  },
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Chats API
export const chatsAPI = {
  getAll: async () => {
    return apiRequest('/chats');
  },
  getMyChat: async () => {
    return apiRequest('/chats/my-chat');
  },
  getMessages: async (chatId) => {
    return apiRequest(`/chats/${chatId}/messages`);
  },
  markAsRead: async (chatId) => {
    return apiRequest(`/chats/${chatId}/read`, {
      method: 'PUT',
    });
  },

  delete: async (chatId) => {
    return apiRequest(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  },
};

// Messages API
export const messagesAPI = {
  send: async (chatId, text) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId, text }),
    });
  },

delete: async (messageId) => {
    return apiRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  // Добавлен метод получения всех заказов
  getAll: async () => {
    return apiRequest('/orders');
  },
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  // Исправлено: передаем два параметра согласно роутам сервера
  updateStatus: async (chatId, orderIndex, status) => {
    return apiRequest(`/orders/${chatId}/${orderIndex}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  delete: async (chatId, orderIndex) => {
    return apiRequest(`/orders/${chatId}/${orderIndex}`, {
      method: 'DELETE',
    });
  },
};

// Files API
export const filesAPI = {
  upload: async (file, chatId, messageId = null) => {
    // 1. Создаем FormData здесь, внутри API слоя
    const formData = new FormData();
    
    // Важно: убеждаемся, что передаем именно файл
    formData.append('file', file); 
    formData.append('chatId', chatId);
    
    if (messageId) {
      formData.append('messageId', messageId);
    }

    const token = getToken();
    
    // 2. Используем fetch напрямую, так как apiRequest принудительно ставит JSON
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        // ВАЖНО: Мы НЕ ставим 'Content-Type'. 
        // Браузер сам добавит multipart/form-data и boundary, увидев FormData в body.
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      // Пытаемся распарсить ошибку, если сервер прислал JSON
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  },

  getFileUrl: (filename) => {
    // Убедитесь, что путь совпадает с настройками статики на бэкенде
    return `${API_URL.replace('/api', '')}/uploads/${filename}`;
  },
};

export default API_URL;