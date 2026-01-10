import pool from '../utils/database';

export interface DiscountRequest {
  id: number;
  order_id: number;
  requested_by: number;
  discount_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: Date | null;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
  order_number?: string;
  requested_by_name?: string;
  reviewed_by_name?: string;
  customer_name?: string;
  order_total?: number;
}

export class DiscountRequestModel {
  static async create(data: {
    order_id: number;
    requested_by: number;
    discount_amount: number;
    reason: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO discount_requests (order_id, requested_by, discount_amount, reason)
       VALUES (?, ?, ?, ?)`,
      [data.order_id, data.requested_by, data.discount_amount, data.reason]
    );
    return (result as any).insertId;
  }

  static async findAll(filters?: {
    status?: string;
    requested_by?: number;
  }): Promise<DiscountRequest[]> {
    let query = `SELECT dr.*, 
                        o.order_number, 
                        o.customer_name,
                        o.total as order_total,
                        u1.full_name as requested_by_name,
                        u2.full_name as reviewed_by_name
                 FROM discount_requests dr
                 JOIN orders o ON dr.order_id = o.id
                 JOIN users u1 ON dr.requested_by = u1.id
                 LEFT JOIN users u2 ON dr.reviewed_by = u2.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND dr.status = ?';
      params.push(filters.status);
    }

    if (filters?.requested_by) {
      query += ' AND dr.requested_by = ?';
      params.push(filters.requested_by);
    }

    query += ' ORDER BY dr.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as DiscountRequest[];
  }

  static async findById(id: number): Promise<DiscountRequest | null> {
    const [rows] = await pool.execute(
      `SELECT dr.*, 
              o.order_number, 
              o.customer_name,
              o.total as order_total,
              u1.full_name as requested_by_name,
              u2.full_name as reviewed_by_name
       FROM discount_requests dr
       JOIN orders o ON dr.order_id = o.id
       JOIN users u1 ON dr.requested_by = u1.id
       LEFT JOIN users u2 ON dr.reviewed_by = u2.id
       WHERE dr.id = ?`,
      [id]
    );
    const requests = rows as DiscountRequest[];
    return requests.length > 0 ? requests[0] : null;
  }

  static async updateStatus(
    id: number,
    status: 'approved' | 'rejected',
    reviewed_by: number,
    admin_notes?: string
  ): Promise<boolean> {
    await pool.execute(
      `UPDATE discount_requests 
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), admin_notes = ?
       WHERE id = ?`,
      [status, reviewed_by, admin_notes || null, id]
    );
    return true;
  }

  static async updateOrderWithDiscount(orderId: number, discountAmount: number): Promise<boolean> {
    // Update order total with discount
    await pool.execute(
      `UPDATE orders 
       SET total = total - ?, 
           notes = CONCAT(COALESCE(notes, ''), '\nDiscount Applied: ₦', ?)
       WHERE id = ?`,
      [discountAmount, discountAmount, orderId]
    );
    return true;
  }
}

