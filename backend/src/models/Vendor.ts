import pool from '../utils/database';

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
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface VendorInvoice {
  id: number;
  invoice_number: string;
  vendor_id: number;
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface VendorInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: Date;
}

export class VendorModel {
  static async findAll(): Promise<Vendor[]> {
    const [rows] = await pool.execute('SELECT * FROM vendors ORDER BY vendor_name');
    return rows as Vendor[];
  }

  static async findById(id: number): Promise<Vendor | null> {
    const [rows] = await pool.execute('SELECT * FROM vendors WHERE id = ?', [id]);
    const vendors = rows as Vendor[];
    return vendors.length > 0 ? vendors[0] : null;
  }

  static async create(data: {
    vendor_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    notes?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO vendors (vendor_name, contact_person, email, phone, address, city, state, country, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.vendor_name,
        data.contact_person || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || null,
        data.notes || null,
      ]
    );
    return (result as any).insertId;
  }

  static async update(
    id: number,
    updates: Partial<{
      vendor_name: string;
      contact_person: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      is_active: boolean;
      notes: string;
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
    await pool.execute(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id: number): Promise<boolean> {
    await pool.execute('DELETE FROM vendors WHERE id = ?', [id]);
    return true;
  }

  // Vendor Products
  static async getVendorProducts(vendorId: number): Promise<(VendorProduct & { product_name?: string; sku?: string })[]> {
    const [rows] = await pool.execute(
      `SELECT vp.*, p.product_name, p.sku 
       FROM vendor_products vp 
       JOIN products p ON vp.product_id = p.id 
       WHERE vp.vendor_id = ?`,
      [vendorId]
    );
    return rows as any[];
  }

  static async getProductVendors(productId: number): Promise<(VendorProduct & { vendor_name?: string })[]> {
    const [rows] = await pool.execute(
      `SELECT vp.*, v.vendor_name 
       FROM vendor_products vp 
       JOIN vendors v ON vp.vendor_id = v.id 
       WHERE vp.product_id = ? AND v.is_active = TRUE`,
      [productId]
    );
    return rows as any[];
  }

  static async linkProductToVendor(data: {
    vendor_id: number;
    product_id: number;
    vendor_sku?: string;
    unit_price?: number;
    minimum_order_quantity?: number;
    lead_time_days?: number;
    is_primary_supplier?: boolean;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO vendor_products (vendor_id, product_id, vendor_sku, unit_price, minimum_order_quantity, lead_time_days, is_primary_supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       vendor_sku = VALUES(vendor_sku),
       unit_price = VALUES(unit_price),
       minimum_order_quantity = VALUES(minimum_order_quantity),
       lead_time_days = VALUES(lead_time_days),
       is_primary_supplier = VALUES(is_primary_supplier)`,
      [
        data.vendor_id,
        data.product_id,
        data.vendor_sku || null,
        data.unit_price || null,
        data.minimum_order_quantity || 1,
        data.lead_time_days || 0,
        data.is_primary_supplier || false,
      ]
    );
    return (result as any).insertId || data.vendor_id;
  }

  static async unlinkProductFromVendor(vendorId: number, productId: number): Promise<boolean> {
    await pool.execute('DELETE FROM vendor_products WHERE vendor_id = ? AND product_id = ?', [vendorId, productId]);
    return true;
  }

  // Vendor Invoices
  static async createInvoice(data: {
    invoice_number: string;
    vendor_id: number;
    status?: 'draft' | 'sent' | 'confirmed' | 'cancelled';
    total_amount: number;
    notes?: string;
    created_by: number;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO vendor_invoices (invoice_number, vendor_id, status, total_amount, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.invoice_number,
        data.vendor_id,
        data.status || 'draft',
        data.total_amount,
        data.notes || null,
        data.created_by,
      ]
    );
    return (result as any).insertId;
  }

  static async addInvoiceItem(data: {
    invoice_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO vendor_invoice_items (invoice_id, product_id, quantity, unit_price, total_price, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.invoice_id, data.product_id, data.quantity, data.unit_price, data.total_price, data.notes || null]
    );
    return (result as any).insertId;
  }

  static async getInvoiceWithItems(invoiceId: number): Promise<any> {
    const [invoices] = await pool.execute('SELECT * FROM vendor_invoices WHERE id = ?', [invoiceId]);
    if ((invoices as any[]).length === 0) return null;

    const invoice = (invoices as any[])[0];
    const [items] = await pool.execute(
      `SELECT vi.*, p.product_name, p.sku 
       FROM vendor_invoice_items vi 
       JOIN products p ON vi.product_id = p.id 
       WHERE vi.invoice_id = ?`,
      [invoiceId]
    );

    return { ...invoice, items };
  }

  static async getAllInvoices(): Promise<VendorInvoice[]> {
    const [rows] = await pool.execute(
      `SELECT vi.*, v.vendor_name 
       FROM vendor_invoices vi 
       JOIN vendors v ON vi.vendor_id = v.id 
       ORDER BY vi.created_at DESC`
    );
    return rows as any[];
  }

  static async updateInvoice(
    id: number,
    updates: Partial<{ status: string; total_amount: number; notes: string }>
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
    await pool.execute(`UPDATE vendor_invoices SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }
}

