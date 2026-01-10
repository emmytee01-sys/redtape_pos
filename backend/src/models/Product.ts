import pool from '../utils/database';

export interface Product {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  description: string | null;
  price: number;
  quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export class ProductModel {
  static async findAll(includeInactive = false): Promise<Product[]> {
    const query = includeInactive
      ? 'SELECT * FROM products ORDER BY created_at DESC'
      : 'SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows as Product[];
  }

  static async findById(id: number): Promise<Product | null> {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [
      id,
    ]);
    const products = rows as Product[];
    return products.length > 0 ? products[0] : null;
  }

  static async findBySku(sku: string): Promise<Product | null> {
    const [rows] = await pool.execute('SELECT * FROM products WHERE sku = ?', [
      sku,
    ]);
    const products = rows as Product[];
    return products.length > 0 ? products[0] : null;
  }

  static async create(productData: {
    sku: string;
    product_name: string;
    category: string;
    description?: string;
    price: number;
    quantity: number;
    min_stock_level?: number;
    created_by: number;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO products (sku, product_name, category, description, price, quantity, min_stock_level, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.sku,
        productData.product_name,
        productData.category,
        productData.description || null,
        productData.price,
        productData.quantity,
        productData.min_stock_level || 0,
        productData.created_by,
      ]
    );
    return (result as any).insertId;
  }

  static async update(
    id: number,
    updates: Partial<{
      product_name: string;
      category: string;
      description: string;
      price: number;
      quantity: number;
      min_stock_level: number;
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
    await pool.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  static async updateStock(id: number, quantityChange: number): Promise<boolean> {
    await pool.execute(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantityChange, id]
    );
    return true;
  }

  static async getLowStockItems(threshold?: number): Promise<Product[]> {
    const query = threshold
      ? 'SELECT * FROM products WHERE quantity <= ? AND is_active = TRUE'
      : 'SELECT * FROM products WHERE quantity <= min_stock_level AND is_active = TRUE';
    const params = threshold ? [threshold] : [];
    const [rows] = await pool.execute(query, params);
    return rows as Product[];
  }
}

