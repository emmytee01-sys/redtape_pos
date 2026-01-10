import api from './api';

export interface Product {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  description: string | null;
  price: number;
  quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
}

export const productService = {
  getAll: async (includeInactive = false): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (product: Partial<Product>): Promise<any> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  update: async (id: number, product: Partial<Product>): Promise<any> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },

  uploadCSV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLowStock: async (threshold?: number): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/low-stock', {
      params: threshold ? { threshold } : {},
    });
    return response.data;
  },
};

