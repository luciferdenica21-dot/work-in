const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
export const removeToken = () => {
  localStorage.removeItem('token');
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
};

// Messages API
export const messagesAPI = {
  send: async (chatId, text) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId, text }),
    });
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (messageId) {
      formData.append('messageId', messageId);
    }

    const token = getToken();
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },
  getFileUrl: (filename) => {
    return `${API_URL.replace('/api', '')}/uploads/${filename}`;
  },
};

export default API_URL;