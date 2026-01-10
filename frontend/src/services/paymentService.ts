import api from './api';

export interface Payment {
  id: number;
  order_id: number;
  accountant_id: number;
  amount: number;
  payment_method: 'cash' | 'pos' | 'bank_transfer' | 'other';
  payment_status: 'pending' | 'confirmed' | 'refunded';
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  order_number?: string;
  accountant_name?: string;
  customer_name?: string;
}

export interface Receipt {
  id: number;
  payment_id: number;
  receipt_number: string;
  file_path: string | null;
  generated_at: string;
}

export const paymentService = {
  create: async (payment: {
    order_id: number;
    payment_method?: string;
    notes?: string;
  }): Promise<Payment> => {
    const response = await api.post<Payment>('/payments', payment);
    return response.data;
  },

  confirm: async (id: number): Promise<{ payment: Payment; receipt: Receipt }> => {
    const response = await api.post<{ payment: Payment; receipt: Receipt }>(
      `/payments/${id}/confirm`
    );
    return response.data;
  },

  getAll: async (filters?: {
    payment_status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/payments', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  getReceipt: async (paymentId: number): Promise<Receipt> => {
    const response = await api.get<Receipt>(`/payments/receipt/${paymentId}`);
    return response.data;
  },
};

