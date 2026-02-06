import pool from '../utils/database';

export interface AccountNumber {
  id: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface POSTerminal {
  id: number;
  bank_name: string;
  terminal_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  created_at: Date;
  updated_at: Date;
}

export class SettingsModel {
  // Account Numbers
  static async getAllAccountNumbers(): Promise<AccountNumber[]> {
    const [rows] = await pool.execute('SELECT * FROM account_numbers ORDER BY created_at DESC');
    return rows as AccountNumber[];
  }

  static async getAccountNumberById(id: number): Promise<AccountNumber | null> {
    const [rows] = await pool.execute('SELECT * FROM account_numbers WHERE id = ?', [id]);
    const accounts = rows as AccountNumber[];
    return accounts.length > 0 ? accounts[0] : null;
  }

  static async createAccountNumber(data: {
    account_number: string;
    account_name: string;
    bank_name: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO account_numbers (account_number, account_name, bank_name) VALUES (?, ?, ?)',
      [data.account_number, data.account_name, data.bank_name]
    );
    return (result as any).insertId;
  }

  static async updateAccountNumber(
    id: number,
    updates: Partial<{
      account_number: string;
      account_name: string;
      bank_name: string;
      is_active: boolean;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await pool.execute(`UPDATE account_numbers SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async deleteAccountNumber(id: number): Promise<boolean> {
    await pool.execute('DELETE FROM account_numbers WHERE id = ?', [id]);
    return true;
  }

  // POS Terminals
  static async getAllPOSTerminals(): Promise<POSTerminal[]> {
    const [rows] = await pool.execute('SELECT * FROM pos_terminals ORDER BY created_at DESC');
    return rows as POSTerminal[];
  }

  static async getPOSTerminalById(id: number): Promise<POSTerminal | null> {
    const [rows] = await pool.execute('SELECT * FROM pos_terminals WHERE id = ?', [id]);
    const terminals = rows as POSTerminal[];
    return terminals.length > 0 ? terminals[0] : null;
  }

  static async createPOSTerminal(data: {
    bank_name: string;
    terminal_id: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO pos_terminals (bank_name, terminal_id) VALUES (?, ?)',
      [data.bank_name, data.terminal_id]
    );
    return (result as any).insertId;
  }

  static async updatePOSTerminal(
    id: number,
    updates: Partial<{
      bank_name: string;
      terminal_id: string;
      is_active: boolean;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await pool.execute(`UPDATE pos_terminals SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async deletePOSTerminal(id: number): Promise<boolean> {
    await pool.execute('DELETE FROM pos_terminals WHERE id = ?', [id]);
    return true;
  }

  // System Settings
  static async getSetting(key: string): Promise<string | null> {
    const [rows] = await pool.execute('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
    const settings = rows as any[];
    return settings.length > 0 ? settings[0].setting_value : null;
  }

  static async setSetting(key: string, value: string): Promise<void> {
    await pool.execute(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value]
    );
  }

  static async getAllSettings(): Promise<SystemSetting[]> {
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    return rows as SystemSetting[];
  }
}

