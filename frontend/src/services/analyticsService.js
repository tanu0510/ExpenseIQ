import api from './api';

export const analyticsService = {
  async getSummary() {
    const response = await api.get('/analytics/summary');
    return response.data.data;
  },

  async getMonthlyTrends(months = 6) {
    const response = await api.get('/analytics/monthly', { params: { months } });
    return response.data.data;
  },

  async getCategoryBreakdown(params = {}) {
    const response = await api.get('/analytics/categories', { params });
    return response.data;
  },

  async getSpendingTrends(params = {}) {
    const response = await api.get('/analytics/trends', { params });
    return response.data.data;
  },

  async getDeepMetrics() {
    const response = await api.get('/analytics/deep-metrics');
    return response.data.data;
  }
};
