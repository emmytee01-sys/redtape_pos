import pool from '../utils/database';

export interface Receipt {
  id: number;
  payment_id: number;
  receipt_number: string;
  file_path: string | null;
  generated_at: Date;
}

export class ReceiptModel {
  static async create(receiptData: {
    payment_id: number;
    receipt_number: string;
    file_path?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO receipts (payment_id, receipt_number, file_path) 
       VALUES (?, ?, ?)`,
      [
        receiptData.payment_id,
        receiptData.receipt_number,
        receiptData.file_path || null,
      ]
    );
    return (result as any).insertId;
  }

  static async findByPaymentId(paymentId: number): Promise<Receipt | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM receipts WHERE payment_id = ?',
      [paymentId]
    );
    const receipts = rows as Receipt[];
    return receipts.length > 0 ? receipts[0] : null;
  }

  static async findByReceiptNumber(receiptNumber: string): Promise<Receipt | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM receipts WHERE receipt_number = ?',
      [receiptNumber]
    );
    const receipts = rows as Receipt[];
    return receipts.length > 0 ? receipts[0] : null;
  }
}

