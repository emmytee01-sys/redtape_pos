import api from './api';

export interface Vendor {
  id: number;
  vendor_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorProduct {
  id: number;
  vendor_id: number;
  product_id: number;
  vendor_sku: string | null;
  unit_price: number | null;
  minimum_order_quantity: number;
  lead_time_days: number;
  is_primary_supplier: boolean;
  vendor_name?: string;
  product_name?: string;
  sku?: string;
}

export interface VendorInvoice {
  id: number;
  invoice_number: string;
  vendor_id: number;
  vendor_name?: string;
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  items?: VendorInvoiceItem[];
}

export interface VendorInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  product_name?: string;
  sku?: string;
}

export const vendorService = {
  getAll: async (): Promise<Vendor[]> => {
    const response = await api.get<Vendor[]>('/vendors');
    return response.data;
  },

  getById: async (id: number): Promise<Vendor> => {
    const response = await api.get<Vendor>(`/vendors/${id}`);
    return response.data;
  },

  create: async (vendor: Partial<Vendor>): Promise<Vendor> => {
    const response = await api.post<Vendor>('/vendors', vendor);
    return response.data;
  },

  update: async (id: number, vendor: Partial<Vendor>): Promise<Vendor> => {
    const response = await api.put<Vendor>(`/vendors/${id}`, vendor);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },

  uploadCSV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/vendors/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  linkProduct: async (vendorId: number, productId: number, data: Partial<VendorProduct>): Promise<void> => {
    await api.post(`/vendors/${vendorId}/products/${productId}`, data);
  },

  unlinkProduct: async (vendorId: number, productId: number): Promise<void> => {
    await api.delete(`/vendors/${vendorId}/products/${productId}`);
  },

  getProductVendors: async (productId: number): Promise<VendorProduct[]> => {
    const response = await api.get<VendorProduct[]>(`/vendors/products/${productId}`);
    return response.data;
  },

  generateOutOfStockInvoice: async (vendorIds: number[]): Promise<{ invoices: VendorInvoice[] }> => {
    const response = await api.post<{ invoices: VendorInvoice[] }>('/vendors/invoices/generate', {
      vendor_ids: vendorIds,
    });
    return response.data;
  },

  getAllInvoices: async (): Promise<VendorInvoice[]> => {
    const response = await api.get<VendorInvoice[]>('/vendors/invoices');
    return response.data;
  },

  getInvoice: async (id: number): Promise<VendorInvoice> => {
    const response = await api.get<VendorInvoice>(`/vendors/invoices/${id}`);
    return response.data;
  },
};

