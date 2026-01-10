import api from './api';

export interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price?: number;
  subtotal?: number;
  product_name?: string;
  product_sku?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  sales_rep_id: number;
  status: 'pending' | 'submitted' | 'paid' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  sales_rep_name?: string;
}

export const orderService = {
  create: async (order: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    items: OrderItem[];
    notes?: string;
  }): Promise<Order> => {
    const response = await api.post<Order>('/orders', order);
    return response.data;
  },

  getAll: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  submit: async (id: number): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/submit`);
    return response.data;
  },
};

