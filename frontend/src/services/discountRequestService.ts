import api from './api';

export interface DiscountRequest {
  id: number;
  order_id: number;
  requested_by: number;
  discount_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string;
  requested_by_name?: string;
  reviewed_by_name?: string;
  customer_name?: string;
  order_total?: number;
}

export const discountRequestService = {
  create: async (data: {
    order_id: number;
    discount_amount: number;
    reason: string;
  }): Promise<DiscountRequest> => {
    const response = await api.post<DiscountRequest>('/discount-requests', data);
    return response.data;
  },

  getAll: async (filters?: { status?: string }): Promise<DiscountRequest[]> => {
    const response = await api.get<DiscountRequest[]>('/discount-requests', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<DiscountRequest> => {
    const response = await api.get<DiscountRequest>(`/discount-requests/${id}`);
    return response.data;
  },

  approve: async (id: number, admin_notes?: string): Promise<{ message: string; request: DiscountRequest }> => {
    const response = await api.post<{ message: string; request: DiscountRequest }>(
      `/discount-requests/${id}/approve`,
      { admin_notes }
    );
    return response.data;
  },

  reject: async (id: number, admin_notes?: string): Promise<{ message: string; request: DiscountRequest }> => {
    const response = await api.post<{ message: string; request: DiscountRequest }>(
      `/discount-requests/${id}/reject`,
      { admin_notes }
    );
    return response.data;
  },
};

