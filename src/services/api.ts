// src/services/api.ts
import axios from 'axios';

const API_URL = 'https://pay.prosecurelsp.com';

interface APIResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}

interface CheckoutData {
  checkout_id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  zipcode: string;
  state: string;
  city: string;
  street: string;
  additional: string;
  username: string;
  passphrase: string;
  plans_json?: string;
  plan?: number;
}

interface PaymentInfo {
  cardname: string;
  cardnumber: string;
  cvv: string;
  expiry: string;
  sid: string; // checkout_id
}

interface CartResponse {
  items: Array<{
    plan_id: number;
    plan_name: string;
    plan_image: string;
    plan_description: string;
    plan_quantity: number;
    price: number;
    is_annual: boolean;
  }>;
  cart_subtotal: number;
  cart_discount: number;
  shortfall_for_discount: string;
  cart_total: number;
}

export interface PaymentProps {
  onBack: () => void;
  checkoutId: string;
}

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Adicionar interceptors para debug
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    withCredentials: request.withCredentials,
    data: request.data
  });
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.log('Response Error:', {
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const checkoutService = {
  async generateCheckoutId(): Promise<string> {
    try {
      const response = await api.get<APIResponse<{checkout_id: string}>>('/api/generate-checkout-id');
      return response.data.data!.checkout_id;
    } catch (error) {
      console.error('Error generating checkout ID:', error);
      throw error;
    }
  },

  async createOrUpdateCheckout(data: Partial<CheckoutData>): Promise<APIResponse> {
    try {
      const response = await api.post<APIResponse>('/api/checkout', data);
      return response.data;
    } catch (error) {
      console.error('Error saving checkout data:', error);
      throw error;
    }
  },

  async getCheckout(checkoutId: string): Promise<CheckoutData> {
    try {
      const response = await api.get<APIResponse<CheckoutData>>(`/api/checkout?checkout_id=${checkoutId}`);
      return response.data.data!;
    } catch (error) {
      console.error('Error retrieving checkout:', error);
      throw error;
    }
  },

  async getCart(): Promise<CartResponse> {
    try {
      console.log('Fetching cart data...');
      const response = await api.get<CartResponse>('/api/cart');
      console.log('Cart response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  async linkAccount(checkoutId: string): Promise<APIResponse> {
    try {
      // Primeiro verificar o carrinho
      console.log('Checking cart before linking account...');
      const cartResponse = await this.getCart();
      
      if (!cartResponse?.items?.length) {
        throw new Error('No items in cart. Please add plans before proceeding.');
      }

      console.log('Cart verified, proceeding with link-account...');
      const response = await api.post(
        `/api/link-account?checkout_id=${checkoutId}`,
        {},
        {
          withCredentials: true,
          headers: {
            'Origin': window.location.origin
          }
        }
      );
      console.log('Link account response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in linkAccount:', error);
      throw error;
    }
  },
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await api.get<APIResponse<{ available: boolean }>>(
        `/api/check-email-availability?email=${encodeURIComponent(email)}`
      );
      return response.data.data!.available;
    } catch (error) {
      console.error('Error checking email availability:', error);
      throw error;
    }
  },
  async processPayment(data: PaymentInfo): Promise<APIResponse> {
    try {
      const response = await api.post<APIResponse>('/api/process-payment', data);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
};

export type { CheckoutData, PaymentInfo, APIResponse, CartResponse };