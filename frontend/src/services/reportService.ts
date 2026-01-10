import api from './api';

export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  today_sales: number;
  low_stock_items: number;
}

export interface SalesReport {
  date: string;
  order_count: number;
  total_revenue: number;
}

export interface ProductSalesReport {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export const reportService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/reports/dashboard');
    return response.data;
  },

  getSalesReport: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesReport[]> => {
    const response = await api.get<SalesReport[]>('/reports/sales', { params: filters });
    return response.data;
  },

  getProductSalesReport: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ProductSalesReport[]> => {
    const response = await api.get<ProductSalesReport[]>('/reports/products', {
      params: filters,
    });
    return response.data;
  },
};

