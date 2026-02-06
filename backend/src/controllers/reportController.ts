import { Response } from 'express';
import pool from '../utils/database';
import { AuthRequest } from '../middlewares/auth';

export class ReportController {
  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;

      let salesQuery = 'SELECT SUM(total) as total_sales FROM orders WHERE status = "paid"';
      let ordersQuery = 'SELECT COUNT(*) as total_orders FROM orders';
      let todaySalesQuery =
        'SELECT SUM(total) as today_sales FROM orders WHERE status = "paid" AND DATE(created_at) = CURDATE()';

      const params: any[] = [];

      // Sales reps can only see their own stats
      if (role === 'sales_rep') {
        salesQuery += ' AND sales_rep_id = ?';
        ordersQuery += ' WHERE sales_rep_id = ?';
        todaySalesQuery += ' AND sales_rep_id = ?';
        params.push(userId);
      }

      const [salesResult] = await pool.execute(salesQuery, params);
      const [ordersResult] = await pool.execute(ordersQuery, params);
      const [todaySalesResult] = await pool.execute(todaySalesQuery, params);

      // Stock status
      const [stockResult] = await pool.execute(
        'SELECT COUNT(*) as low_stock FROM products WHERE quantity <= min_stock_level AND is_active = TRUE'
      );

      const stats = {
        total_sales: (salesResult as any[])[0]?.total_sales || 0,
        total_orders: (ordersResult as any[])[0]?.total_orders || 0,
        today_sales: (todaySalesResult as any[])[0]?.today_sales || 0,
        low_stock_items: (stockResult as any[])[0]?.low_stock || 0,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
    }
  }

  static async getSalesReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user!.id;
      const role = req.user!.role;

      let query = `
        SELECT 
          DATE(o.created_at) as date,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_revenue
        FROM orders o
        WHERE o.status = 'paid'
      `;

      const params: any[] = [];

      if (role === 'sales_rep') {
        query += ' AND o.sales_rep_id = ?';
        params.push(userId);
      }

      if (startDate) {
        query += ' AND DATE(o.created_at) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND DATE(o.created_at) <= ?';
        params.push(endDate);
      }

      query += ' GROUP BY DATE(o.created_at) ORDER BY date DESC LIMIT 30';

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch sales report' });
    }
  }

  static async getProductSalesReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let query = `
        SELECT 
          p.id,
          p.sku,
          p.product_name,
          p.category,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.subtotal) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'paid'
      `;

      const params: any[] = [];

      if (startDate) {
        query += ' AND DATE(o.created_at) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND DATE(o.created_at) <= ?';
        params.push(endDate);
      }

      query += ' GROUP BY p.id, p.sku, p.product_name, p.category ORDER BY total_revenue DESC';

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch product sales report' });
    }
  }

  static async getEndOfDayReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const dateValue = date || null;

      // 1. Summary Stats
      const summaryQuery = `
        SELECT 
          COUNT(id) as total_orders,
          SUM(total) as total_revenue,
          SUM(subtotal) as subtotal,
          SUM(tax) as total_tax
        FROM orders 
        WHERE status = 'paid' AND DATE(created_at) = ${dateValue ? '?' : 'CURDATE()'}
      `;

      // 2. Payment Method Breakdown
      const paymentsQuery = `
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments
        WHERE payment_status = 'confirmed' AND DATE(created_at) = ${dateValue ? '?' : 'CURDATE()'}
        GROUP BY payment_method
      `;

      // 3. Top Products Today
      const topProductsQuery = `
        SELECT 
          p.product_name,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'paid' AND DATE(o.created_at) = ${dateValue ? '?' : 'CURDATE()'}
        GROUP BY p.id, p.product_name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `;

      const params = dateValue ? [dateValue] : [];
      const [summaryResult] = await pool.execute(summaryQuery, params);
      const [paymentsResult] = await pool.execute(paymentsQuery, params);
      const [topProductsResult] = await pool.execute(topProductsQuery, params);

      res.json({
        date: dateValue || new Date().toISOString().split('T')[0],
        summary: (summaryResult as any[])[0] || { total_orders: 0, total_revenue: 0, subtotal: 0, total_tax: 0 },
        payments: paymentsResult,
        top_products: topProductsResult
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch end-of-day report' });
    }
  }
}

