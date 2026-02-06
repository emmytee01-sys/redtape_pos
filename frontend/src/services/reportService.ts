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

export interface EndOfDayReport {
  date: string;
  summary: {
    total_orders: number;
    total_revenue: string | number;
    subtotal: string | number;
    total_tax: string | number;
  };
  payments: Array<{
    payment_method: string;
    count: number;
    total_amount: string | number;
  }>;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: string | number;
  }>;
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

  getEndOfDayReport: async (date?: string): Promise<EndOfDayReport> => {
    const response = await api.get<EndOfDayReport>('/reports/end-of-day', {
      params: { date },
    });
    return response.data;
  },

  exportEndOfDayPDF: async (date?: string): Promise<Blob> => {
    const response = await api.get('/reports/export-end-of-day-pdf', {
      params: { date },
      responseType: 'blob',
    });
    return response.data;
  },

  exportEndOfDayExcel: async (date?: string): Promise<Blob> => {
    const response = await api.get('/reports/export-end-of-day-excel', {
      params: { date },
      responseType: 'blob',
    });
    return response.data;
  },
};

