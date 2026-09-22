import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('expenseiq_token', response.data.token);
      localStorage.setItem('expenseiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('expenseiq_token', response.data.token);
      localStorage.setItem('expenseiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('expenseiq_token');
      localStorage.removeItem('expenseiq_user');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    if (response.data.user) {
      localStorage.setItem('expenseiq_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('expenseiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    if (response.data.token) {
      localStorage.setItem('expenseiq_token', response.data.token);
    }
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, password) {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    if (response.data.token) {
      localStorage.setItem('expenseiq_token', response.data.token);
      localStorage.setItem('expenseiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
};
