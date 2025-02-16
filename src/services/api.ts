import axios from 'axios';
import { CheckoutData, PaymentInfo, MFAData } from '../types/checkout';

const api = axios.create({
  baseURL: 'https://pay.prosecurelsp.com',
});

const mfaApi = axios.create({
  baseURL: 'http://172.31.255.66:7080',
});

export const checkoutService = {
  async createCheckout(data: Partial<CheckoutData>) {
    const response = await api.post<{ checkout_id: string }>('/api/checkout', data);
    return response.data;
  },

  async updateCheckout(checkoutId: string, data: Partial<CheckoutData>) {
    const response = await api.put(`/api/checkout/${checkoutId}`, data);
    return response.data;
  },

  async getCheckout(checkoutId: string) {
    const response = await api.get<CheckoutData>(`/api/checkout/${checkoutId}`);
    return response.data;
  },

  async processPayment(paymentData: PaymentInfo) {
    const response = await api.post('/api/process-payment', paymentData);
    return response.data;
  },

  async verifyPhone(data: MFAData) {
    const response = await mfaApi.post('/verify-phone', data);
    return response.data;
  },

  async verifyCode(data: MFAData) {
    const response = await mfaApi.post('/verify-code', data);
    return response.data;
  },

  async associatePlan(checkoutId: string) {
    const response = await api.post('/api/associate-plan', { checkout_id: checkoutId });
    return response.data;
  }
};