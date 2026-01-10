import pool from '../utils/database';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  sales_rep_id: number;
  status: 'pending' | 'submitted' | 'paid' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
  product_name?: string;
  product_sku?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  sales_rep_name?: string;
}

export class OrderModel {
  static async create(orderData: {
    order_number: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    sales_rep_id: number;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, sales_rep_id, subtotal, tax, total, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.order_number,
        orderData.customer_name || null,
        orderData.customer_email || null,
        orderData.customer_phone || null,
        orderData.sales_rep_id,
        orderData.subtotal,
        orderData.tax || 0,
        orderData.total,
        orderData.notes || null,
      ]
    );
    return (result as any).insertId;
  }

  static async addItem(itemData: {
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        itemData.order_id,
        itemData.product_id,
        itemData.quantity,
        itemData.unit_price,
        itemData.subtotal,
      ]
    );
    return (result as any).insertId;
  }

  static async findById(id: number): Promise<OrderWithItems | null> {
    const [orders] = await pool.execute(
      `SELECT o.*, u.full_name as sales_rep_name 
       FROM orders o 
       LEFT JOIN users u ON o.sales_rep_id = u.id 
       WHERE o.id = ?`,
      [id]
    );
    const orderList = orders as Order[];
    if (orderList.length === 0) return null;

    const [items] = await pool.execute(
      `SELECT oi.*, p.product_name, p.sku as product_sku 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [id]
    );

    return {
      ...orderList[0],
      items: items as OrderItem[],
    } as OrderWithItems;
  }

  static async findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
    const [orders] = await pool.execute(
      `SELECT o.*, u.full_name as sales_rep_name 
       FROM orders o 
       LEFT JOIN users u ON o.sales_rep_id = u.id 
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    const orderList = orders as Order[];
    if (orderList.length === 0) return null;

    const [items] = await pool.execute(
      `SELECT oi.*, p.product_name, p.sku as product_sku 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderList[0].id]
    );

    return {
      ...orderList[0],
      items: items as OrderItem[],
    } as OrderWithItems;
  }

  static async findAll(filters?: {
    status?: string;
    sales_rep_id?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<OrderWithItems[]> {
    let query = `SELECT o.*, u.full_name as sales_rep_name 
                 FROM orders o 
                 LEFT JOIN users u ON o.sales_rep_id = u.id 
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }
    if (filters?.sales_rep_id) {
      query += ' AND o.sales_rep_id = ?';
      params.push(filters.sales_rep_id);
    }
    if (filters?.startDate) {
      query += ' AND o.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND o.created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);
    const orderList = orders as Order[];

    const ordersWithItems: OrderWithItems[] = [];
    for (const order of orderList) {
      const [items] = await pool.execute(
        `SELECT oi.*, p.product_name, p.sku as product_sku 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      ordersWithItems.push({
        ...order,
        items: items as OrderItem[],
      });
    }

    return ordersWithItems;
  }

  static async updateStatus(
    id: number,
    status: 'pending' | 'submitted' | 'paid' | 'cancelled'
  ): Promise<boolean> {
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return true;
  }

  static async updateOrder(
    id: number,
    orderData: {
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      notes?: string;
      subtotal?: number;
      tax?: number;
      total?: number;
    }
  ): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];

    if (orderData.customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(orderData.customer_name || null);
    }
    if (orderData.customer_email !== undefined) {
      updates.push('customer_email = ?');
      params.push(orderData.customer_email || null);
    }
    if (orderData.customer_phone !== undefined) {
      updates.push('customer_phone = ?');
      params.push(orderData.customer_phone || null);
    }
    if (orderData.notes !== undefined) {
      updates.push('notes = ?');
      params.push(orderData.notes || null);
    }
    if (orderData.subtotal !== undefined) {
      updates.push('subtotal = ?');
      params.push(orderData.subtotal);
    }
    if (orderData.tax !== undefined) {
      updates.push('tax = ?');
      params.push(orderData.tax);
    }
    if (orderData.total !== undefined) {
      updates.push('total = ?');
      params.push(orderData.total);
    }

    if (updates.length === 0) return true;

    params.push(id);
    await pool.execute(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
    return true;
  }

  static async deleteItem(itemId: number): Promise<boolean> {
    await pool.execute('DELETE FROM order_items WHERE id = ?', [itemId]);
    return true;
  }

  static async updateItem(
    itemId: number,
    itemData: {
      quantity?: number;
      unit_price?: number;
      subtotal?: number;
    }
  ): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];

    if (itemData.quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(itemData.quantity);
    }
    if (itemData.unit_price !== undefined) {
      updates.push('unit_price = ?');
      params.push(itemData.unit_price);
    }
    if (itemData.subtotal !== undefined) {
      updates.push('subtotal = ?');
      params.push(itemData.subtotal);
    }

    if (updates.length === 0) return true;

    params.push(itemId);
    await pool.execute(`UPDATE order_items SET ${updates.join(', ')} WHERE id = ?`, params);
    return true;
  }

  static async deleteOrder(id: number): Promise<boolean> {
    // Delete order items first
    await pool.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    // Then delete the order
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    return true;
  }
}

