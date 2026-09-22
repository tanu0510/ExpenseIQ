import api from './api';

export const recurringService = {
  async getRecurring() {
    const response = await api.get('/recurring');
    return response.data.data;
  },

  async createRecurring(data) {
    const response = await api.post('/recurring', data);
    return response.data;
  },

  async updateRecurring(id, data) {
    const response = await api.put(`/recurring/${id}`, data);
    return response.data;
  },

  async deleteRecurring(id) {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
  },

  async processDueRecurring() {
    const response = await api.post('/recurring/process');
    return response.data;
  }
};
