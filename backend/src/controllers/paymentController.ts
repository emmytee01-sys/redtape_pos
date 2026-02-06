import { Response } from 'express';
import { PaymentModel } from '../models/Payment';
import { OrderModel } from '../models/Order';
import { ReceiptModel } from '../models/Receipt';
import { ReceiptService } from '../services/receiptService';
import { AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';

export class PaymentController {
  static async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { order_id, payment_method, notes, pos_terminal_id, bank_account_id } = req.body;

      const order = await OrderModel.findById(order_id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'submitted') {
        res.status(400).json({ error: 'Order must be submitted before payment' });
        return;
      }

      // Check if payment already exists
      const existingPayment = await PaymentModel.findByOrderId(order_id);
      if (existingPayment) {
        res.status(400).json({ error: 'Payment already exists for this order' });
        return;
      }

      const paymentId = await PaymentModel.create({
        order_id,
        accountant_id: req.user!.id,
        amount: order.total,
        payment_method: payment_method || 'cash',
        pos_terminal_id,
        bank_account_id,
        notes,
      });

      const payment = await PaymentModel.findById(paymentId);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create payment' });
    }
  }

  static async confirmPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      if (payment.payment_status === 'confirmed') {
        res.status(400).json({ error: 'Payment already confirmed' });
        return;
      }

      // Confirm payment
      await PaymentModel.confirmPayment(parseInt(id));

      // Update order status
      await OrderModel.updateStatus(payment.order_id, 'paid');

      // Generate receipt
      const order = await OrderModel.findById(payment.order_id);
      if (!order) {
        res.status(500).json({ error: 'Order not found' });
        return;
      }

      const receiptPath = await ReceiptService.generateReceipt(order, payment);
      const receiptNumber = `RCP-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      await ReceiptModel.create({
        payment_id: parseInt(id),
        receipt_number: receiptNumber,
        file_path: receiptPath,
      });

      const confirmedPayment = await PaymentModel.findById(parseInt(id));
      const receipt = await ReceiptModel.findByPaymentId(parseInt(id));

      res.json({
        payment: confirmedPayment,
        receipt: {
          receipt_number: receipt?.receipt_number,
          file_path: receipt?.file_path,
        },
        message: 'Payment confirmed and receipt generated',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to confirm payment' });
    }
  }

  static async getAllPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.payment_status) {
        filters.payment_status = req.query.payment_status;
      }

      // Accountants can see all payments, but filter by their own if needed
      if (req.query.accountant_id) {
        filters.accountant_id = parseInt(req.query.accountant_id as string);
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const payments = await PaymentModel.findAll(filters);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch payments' });
    }
  }

  static async getPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch payment' });
    }
  }

  static async getReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { payment_id } = req.params;
      const receipt = await ReceiptModel.findByPaymentId(parseInt(payment_id));

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      res.json(receipt);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch receipt' });
    }
  }
}

