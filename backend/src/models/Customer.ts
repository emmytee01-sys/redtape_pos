import pool from '../utils/database';

export interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

export class CustomerModel {
  static async create(customerData: {
    full_name: string;
    phone_number: string;
    email?: string;
    address?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO customers (full_name, phone_number, email, address) VALUES (?, ?, ?, ?)',
      [
        customerData.full_name,
        customerData.phone_number,
        customerData.email || null,
        customerData.address || null,
      ]
    );
    return (result as any).insertId;
  }

  static async findByPhone(phoneNumber: string): Promise<Customer | null> {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE phone_number = ?', [phoneNumber]);
    return (rows as any)[0] || null;
  }

  static async findAll(): Promise<Customer[]> {
    const [rows] = await pool.execute('SELECT * FROM customers ORDER BY full_name ASC');
    return rows as Customer[];
  }

  static async findById(id: number): Promise<Customer | null> {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    return (rows as any)[0] || null;
  }

  static async search(query: string): Promise<Customer[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE full_name LIKE ? OR phone_number LIKE ? ORDER BY full_name ASC',
      [`%${query}%`, `%${query}%`]
    );
    return rows as Customer[];
  }
}
