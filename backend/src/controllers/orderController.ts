import { Response } from 'express';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';
import { ReceiptService } from '../services/receiptService';

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customer_name, customer_email, customer_phone, items, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Order must contain at least one item' });
        return;
      }

      // Validate items and calculate totals
      let subtotal = 0;
      const orderItems: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        const product = await ProductModel.findById(item.product_id);
        if (!product) {
          res.status(400).json({ error: `Product with ID ${item.product_id} not found` });
          return;
        }

        // Stock check removed as per request to allow out of stock items

        const unitPrice = product.price;
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          product_id: product.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
        });
      }

      const tax = subtotal * 0.1; // 10% tax (you can make this configurable)
      const total = subtotal + tax;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Create order
      const orderId = await OrderModel.create({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone,
        sales_rep_id: req.user!.id,
        subtotal,
        tax,
        total,
        notes,
      });

      // Add order items
      for (const item of orderItems) {
        await OrderModel.addItem({
          order_id: orderId,
          ...item,
        });

        // Update product stock
        await ProductModel.updateStock(item.product_id, -item.quantity);
      }

      const order = await OrderModel.findById(orderId);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  }

  static async getAllOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.status) {
        filters.status = req.query.status;
      }

      // Sales reps can only see their own orders
      if (req.user!.role === 'sales_rep') {
        filters.sales_rep_id = req.user!.id;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const orders = await OrderModel.findAll(filters);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch orders' });
    }
  }

  static async getOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderModel.findById(parseInt(id));

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Sales reps can only view their own orders
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch order' });
    }
  }

  static async submitOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderModel.findById(parseInt(id));

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'pending') {
        res.status(400).json({ error: 'Order cannot be submitted' });
        return;
      }

      // Only sales rep who created the order can submit it
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await OrderModel.updateStatus(parseInt(id), 'submitted');
      const updatedOrder = await OrderModel.findById(parseInt(id));
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to submit order' });
    }
  }

  static async updateOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { customer_name, customer_email, customer_phone, items, notes } = req.body;

      const order = await OrderModel.findById(parseInt(id));

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Can only update pending orders
      if (order.status !== 'pending') {
        res.status(400).json({ error: 'Can only update pending orders' });
        return;
      }

      // Only sales rep who created the order can update it
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      let subtotal = order.subtotal;
      let total = order.total;
      let tax = order.tax;

      // If items are provided, recalculate totals
      if (items && Array.isArray(items)) {
        subtotal = 0;
        const orderItems: Array<{
          product_id: number;
          quantity: number;
          unit_price: number;
          subtotal: number;
        }> = [];

        // Get existing items to restore stock
        const existingItems = order.items;
        for (const existingItem of existingItems) {
          await ProductModel.updateStock(existingItem.product_id, existingItem.quantity);
          await OrderModel.deleteItem(existingItem.id!);
        }

        // Validate and add new items
        for (const item of items) {
          const product = await ProductModel.findById(item.product_id);
          if (!product) {
            res.status(400).json({ error: `Product with ID ${item.product_id} not found` });
            return;
          }

          // Stock check removed as per request to allow out of stock items

          const unitPrice = product.price;
          const itemSubtotal = unitPrice * item.quantity;
          subtotal += itemSubtotal;

          orderItems.push({
            product_id: product.id,
            quantity: item.quantity,
            unit_price: unitPrice,
            subtotal: itemSubtotal,
          });

          // Add new items to order
          await OrderModel.addItem({
            order_id: parseInt(id),
            ...orderItems[orderItems.length - 1],
          });

          // Update product stock
          await ProductModel.updateStock(item.product_id, -item.quantity);
        }

        tax = subtotal * 0.1;
        total = subtotal + tax;
      }

      // Update order details
      await OrderModel.updateOrder(parseInt(id), {
        customer_name,
        customer_email,
        customer_phone,
        notes,
        subtotal,
        tax,
        total,
      });

      const updatedOrder = await OrderModel.findById(parseInt(id));
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update order' });
    }
  }

  static async deleteOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderModel.findById(parseInt(id));

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Can only delete pending orders
      if (order.status !== 'pending') {
        res.status(400).json({ error: 'Can only delete pending orders' });
        return;
      }

      // Only sales rep who created the order can delete it
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Restore stock for all items
      for (const item of order.items) {
        await ProductModel.updateStock(item.product_id, item.quantity);
      }

      // Delete the order
      await OrderModel.deleteOrder(parseInt(id));

      res.json({ message: 'Order deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete order' });
    }
  }

  static async getOrderInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderModel.findById(parseInt(id));

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Sales reps can only view their own orders
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const invoiceFilePath = await ReceiptService.generateInvoice(order);
      res.json({ file_path: invoiceFilePath });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate invoice' });
    }
  }
}

