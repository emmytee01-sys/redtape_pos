import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { DiscountRequestModel } from '../models/DiscountRequest';
import { OrderModel } from '../models/Order';

export class DiscountRequestController {
  static async createRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { order_id, discount_amount, reason } = req.body;

      if (!order_id || !discount_amount || !reason) {
        res.status(400).json({ error: 'Order ID, discount amount, and reason are required' });
        return;
      }

      const order = await OrderModel.findById(order_id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Verify order belongs to the requesting user (if sales rep)
      if (req.user!.role === 'sales_rep' && order.sales_rep_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Verify order is pending
      if (order.status !== 'pending') {
        res.status(400).json({ error: 'Discount can only be requested for pending orders' });
        return;
      }

      const discountValue = parseFloat(discount_amount);
      if (discountValue <= 0 || discountValue > order.total) {
        res.status(400).json({ error: 'Discount amount must be greater than 0 and less than order total' });
        return;
      }

      const id = await DiscountRequestModel.create({
        order_id,
        requested_by: req.user!.id,
        discount_amount: discountValue,
        reason,
      });

      const request = await DiscountRequestModel.findById(id);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create discount request' });
    }
  }

  static async getAllRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.status) {
        filters.status = req.query.status;
      }

      // Sales reps can only see their own requests
      if (req.user!.role === 'sales_rep') {
        filters.requested_by = req.user!.id;
      }

      const requests = await DiscountRequestModel.findAll(filters);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch discount requests' });
    }
  }

  static async getRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await DiscountRequestModel.findById(parseInt(id));

      if (!request) {
        res.status(404).json({ error: 'Discount request not found' });
        return;
      }

      // Sales reps can only view their own requests
      if (req.user!.role === 'sales_rep' && request.requested_by !== req.user!.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch discount request' });
    }
  }

  static async approveRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;

      const request = await DiscountRequestModel.findById(parseInt(id));
      if (!request) {
        res.status(404).json({ error: 'Discount request not found' });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({ error: 'Request has already been processed' });
        return;
      }

      // Approve request
      await DiscountRequestModel.updateStatus(parseInt(id), 'approved', req.user!.id, admin_notes);

      // Update order with discount
      await DiscountRequestModel.updateOrderWithDiscount(request.order_id, request.discount_amount);

      const updatedRequest = await DiscountRequestModel.findById(parseInt(id));
      res.json({ message: 'Discount request approved', request: updatedRequest });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to approve discount request' });
    }
  }

  static async rejectRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;

      const request = await DiscountRequestModel.findById(parseInt(id));
      if (!request) {
        res.status(404).json({ error: 'Discount request not found' });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({ error: 'Request has already been processed' });
        return;
      }

      await DiscountRequestModel.updateStatus(parseInt(id), 'rejected', req.user!.id, admin_notes);

      const updatedRequest = await DiscountRequestModel.findById(parseInt(id));
      res.json({ message: 'Discount request rejected', request: updatedRequest });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to reject discount request' });
    }
  }
}

