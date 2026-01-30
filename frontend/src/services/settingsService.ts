import api from './api';

export interface AccountNumber {
  id: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  receipt_name: string;
  logo_path: string;
  store_address?: string;
  store_phone?: string;
}

export const settingsService = {
  // Account Numbers
  getAccountNumbers: async (): Promise<AccountNumber[]> => {
    const response = await api.get<AccountNumber[]>('/settings/account-numbers');
    return response.data;
  },

  createAccountNumber: async (data: {
    account_number: string;
    account_name: string;
    bank_name: string;
  }): Promise<AccountNumber> => {
    const response = await api.post<AccountNumber>('/settings/account-numbers', data);
    return response.data;
  },

  updateAccountNumber: async (
    id: number,
    data: Partial<{
      account_number: string;
      account_name: string;
      bank_name: string;
      is_active: boolean;
    }>
  ): Promise<AccountNumber> => {
    const response = await api.put<AccountNumber>(`/settings/account-numbers/${id}`, data);
    return response.data;
  },

  deleteAccountNumber: async (id: number): Promise<void> => {
    await api.delete(`/settings/account-numbers/${id}`);
  },

  // System Settings
  getSettings: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/settings');
    return response.data;
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
    await api.put('/settings/setting', { key, value });
  },

  uploadLogo: async (file: File): Promise<{ logo_path: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ logo_path: string }>('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

