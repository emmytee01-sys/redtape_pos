import pool from '../utils/database';

export interface Payment {
  id: number;
  order_id: number;
  accountant_id: number;
  amount: number;
  payment_method: 'cash' | 'pos' | 'bank_transfer' | 'other';
  payment_status: 'pending' | 'confirmed' | 'refunded';
  pos_terminal_id: number | null;
  bank_account_id: number | null;
  confirmed_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentWithDetails extends Payment {
  order_number?: string;
  accountant_name?: string;
  customer_name?: string;
  pos_bank_name?: string;
  pos_terminal_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
}

export class PaymentModel {
  static async create(paymentData: {
    order_id: number;
    accountant_id: number;
    amount: number;
    payment_method?: 'cash' | 'pos' | 'bank_transfer' | 'other';
    pos_terminal_id?: number;
    bank_account_id?: number;
    notes?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO payments (order_id, accountant_id, amount, payment_method, pos_terminal_id, bank_account_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentData.order_id,
        paymentData.accountant_id,
        paymentData.amount,
        paymentData.payment_method || 'cash',
        paymentData.pos_terminal_id || null,
        paymentData.bank_account_id || null,
        paymentData.notes || null,
      ]
    );
    return (result as any).insertId;
  }

  static async findById(id: number): Promise<PaymentWithDetails | null> {
    const [rows] = await pool.execute(
      `SELECT p.*, o.order_number, o.customer_name, u.full_name as accountant_name,
              pt.bank_name as pos_bank_name, pt.terminal_id as pos_terminal_number,
              an.account_name as bank_account_name, an.account_number as bank_account_number, an.bank_name as bank_name
       FROM payments p 
       JOIN orders o ON p.order_id = o.id 
       LEFT JOIN users u ON p.accountant_id = u.id 
       LEFT JOIN pos_terminals pt ON p.pos_terminal_id = pt.id
       LEFT JOIN account_numbers an ON p.bank_account_id = an.id
       WHERE p.id = ?`,
      [id]
    );
    const payments = rows as Payment[];
    return payments.length > 0 ? (payments[0] as PaymentWithDetails) : null;
  }

  static async findByOrderId(orderId: number): Promise<PaymentWithDetails | null> {
    const [rows] = await pool.execute(
      `SELECT p.*, o.order_number, o.customer_name, u.full_name as accountant_name,
              pt.bank_name as pos_bank_name, pt.terminal_id as pos_terminal_number,
              an.account_name as bank_account_name, an.account_number as bank_account_number, an.bank_name as bank_name
       FROM payments p 
       JOIN orders o ON p.order_id = o.id 
       LEFT JOIN users u ON p.accountant_id = u.id 
       LEFT JOIN pos_terminals pt ON p.pos_terminal_id = pt.id
       LEFT JOIN account_numbers an ON p.bank_account_id = an.id
       WHERE p.order_id = ?`,
      [orderId]
    );
    const payments = rows as Payment[];
    return payments.length > 0 ? (payments[0] as PaymentWithDetails) : null;
  }

  static async findAll(filters?: {
    payment_status?: string;
    accountant_id?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaymentWithDetails[]> {
    let query = `SELECT p.*, o.order_number, o.customer_name, u.full_name as accountant_name 
                 FROM payments p 
                 JOIN orders o ON p.order_id = o.id 
                 LEFT JOIN users u ON p.accountant_id = u.id 
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters?.payment_status) {
      query += ' AND p.payment_status = ?';
      params.push(filters.payment_status);
    }
    if (filters?.accountant_id) {
      query += ' AND p.accountant_id = ?';
      params.push(filters.accountant_id);
    }
    if (filters?.startDate) {
      query += ' AND p.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND p.created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as PaymentWithDetails[];
  }

  static async confirmPayment(id: number): Promise<boolean> {
    await pool.execute(
      `UPDATE payments 
       SET payment_status = 'confirmed', confirmed_at = NOW() 
       WHERE id = ?`,
      [id]
    );
    return true;
  }
}

