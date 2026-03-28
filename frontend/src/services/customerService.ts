import api from './api';

export interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
}

export const customerService = {
  getAll: async (search?: string) => {
    const response = await api.get<Customer[]>('/customers', {
      params: { search }
    });
    return response.data;
  },

  create: async (customerData: Partial<Customer>) => {
    const response = await api.post<Customer>('/customers', customerData);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<Customer[]>('/customers/search', {
      params: { query }
    });
    return response.data;
  }
};
