import { Request, Response } from 'express';
import { CustomerModel } from '../models/Customer';
import { AuthRequest } from '../middlewares/auth';

export class CustomerController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { full_name, phone_number, email, address } = req.body;
      
      if (!full_name || !phone_number) {
        res.status(400).json({ error: 'Name and phone number are required' });
        return;
      }

      // Check for existing customer by phone
      const existing = await CustomerModel.findByPhone(phone_number);
      if (existing) {
        res.status(400).json({ error: 'Customer with this phone number already exists' });
        return;
      }

      const id = await CustomerModel.create({ full_name, phone_number, email, address });
      const customer = await CustomerModel.findById(id);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create customer' });
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      let customers;
      if (search) {
        customers = await CustomerModel.search(search);
      } else {
        customers = await CustomerModel.findAll();
      }
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch customers' });
    }
  }

  static async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query.query as string;
      if (!query) {
        res.json([]);
        return;
      }
      const customers = await CustomerModel.search(query);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to search customers' });
    }
  }
}
