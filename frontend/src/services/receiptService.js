import api from './api';

export const receiptService = {
  async analyzeReceipt(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await api.post('/receipts/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      timeout: 60000
    });

    return response.data;
  }
};
