import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { VendorModel } from '../models/Vendor';
import { ProductModel } from '../models/Product';
import { CSVService } from '../services/csvService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `vendors-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

export class VendorController {
  static async getAllVendors(req: AuthRequest, res: Response): Promise<void> {
    try {
      const vendors = await VendorModel.findAll();
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch vendors' });
    }
  }

  static async getVendor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendor = await VendorModel.findById(parseInt(id));
      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }
      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch vendor' });
    }
  }

  static async createVendor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        vendor_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        notes,
      } = req.body;

      if (!vendor_name) {
        res.status(400).json({ error: 'Vendor name is required' });
        return;
      }

      const id = await VendorModel.create({
        vendor_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        notes,
      });

      const vendor = await VendorModel.findById(id);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create vendor' });
    }
  }

  static async updateVendor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.vendor_name !== undefined) updates.vendor_name = req.body.vendor_name;
      if (req.body.contact_person !== undefined) updates.contact_person = req.body.contact_person;
      if (req.body.email !== undefined) updates.email = req.body.email;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      if (req.body.address !== undefined) updates.address = req.body.address;
      if (req.body.city !== undefined) updates.city = req.body.city;
      if (req.body.state !== undefined) updates.state = req.body.state;
      if (req.body.country !== undefined) updates.country = req.body.country;
      if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
      if (req.body.notes !== undefined) updates.notes = req.body.notes;

      await VendorModel.update(parseInt(id), updates);
      const vendor = await VendorModel.findById(parseInt(id));
      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update vendor' });
    }
  }

  static async deleteVendor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VendorModel.delete(parseInt(id));
      res.json({ message: 'Vendor deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete vendor' });
    }
  }

  static async linkProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vendorId, productId } = req.params;
      const { vendor_sku, unit_price, minimum_order_quantity, lead_time_days, is_primary_supplier } = req.body;

      await VendorModel.linkProductToVendor({
        vendor_id: parseInt(vendorId),
        product_id: parseInt(productId),
        vendor_sku,
        unit_price: unit_price ? parseFloat(unit_price) : undefined,
        minimum_order_quantity: minimum_order_quantity ? parseInt(minimum_order_quantity) : undefined,
        lead_time_days: lead_time_days ? parseInt(lead_time_days) : undefined,
        is_primary_supplier: is_primary_supplier || false,
      });

      res.json({ message: 'Product linked to vendor successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to link product' });
    }
  }

  static async unlinkProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vendorId, productId } = req.params;
      await VendorModel.unlinkProductFromVendor(parseInt(vendorId), parseInt(productId));
      res.json({ message: 'Product unlinked from vendor successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to unlink product' });
    }
  }

  static async getProductVendors(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const vendors = await VendorModel.getProductVendors(parseInt(productId));
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch product vendors' });
    }
  }

  static async uploadVendors(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      // Parse vendor file (similar to products but different structure)
      const vendors = await parseVendorFile(req.file.path);
      const result = await importVendors(vendors);

      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Vendor import completed',
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message || 'Failed to import vendors' });
    }
  }

  static async generateOutOfStockInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vendor_ids } = req.body; // Array of vendor IDs

      if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
        res.status(400).json({ error: 'At least one vendor ID is required' });
        return;
      }

      // Get out of stock products
      const outOfStockProducts = await ProductModel.getLowStockItems(0); // 0 means out of stock
      const products = outOfStockProducts.filter((p) => p.quantity === 0);

      if (products.length === 0) {
        res.status(400).json({ error: 'No out of stock products found' });
        return;
      }

      // Generate invoices for each vendor
      const invoices = [];
      for (const vendorId of vendor_ids) {
        const vendor = await VendorModel.findById(vendorId);
        if (!vendor) continue;

        // Get products linked to this vendor
        const vendorProducts = await VendorModel.getVendorProducts(vendorId);
        const vendorProductIds = new Set(vendorProducts.map((vp) => vp.product_id));

        // Filter products that belong to this vendor or all if no vendor products exist
        const invoiceProducts =
          vendorProductIds.size > 0
            ? products.filter((p) => vendorProductIds.has(p.id))
            : products;

        if (invoiceProducts.length === 0) continue;

        // Create invoice
        const invoiceNumber = `VINV-${Date.now()}-${vendorId}`;
        let totalAmount = 0;

        const invoiceId = await VendorModel.createInvoice({
          invoice_number: invoiceNumber,
          vendor_id: vendorId,
          status: 'draft',
          total_amount: 0,
          created_by: req.user!.id,
        });

        // Add items to invoice
        for (const product of invoiceProducts) {
          const vendorProduct = vendorProducts.find((vp) => vp.product_id === product.id);
          const unitPrice = vendorProduct?.unit_price || product.price || 0;
          const quantity = product.min_stock_level || 10; // Default order quantity
          const totalPrice = unitPrice * quantity;

          await VendorModel.addInvoiceItem({
            invoice_id: invoiceId,
            product_id: product.id,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          });

          totalAmount += totalPrice;
        }

        // Update invoice total
        await VendorModel.updateInvoice(invoiceId, { total_amount: totalAmount });

        const invoice = await VendorModel.getInvoiceWithItems(invoiceId);
        invoices.push({ ...invoice, vendor_name: vendor.vendor_name });
      }

      res.json({
        message: 'Invoices generated successfully',
        invoices,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate invoices' });
    }
  }

  static async getAllInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const invoices = await VendorModel.getAllInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch invoices' });
    }
  }

  static async getInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await VendorModel.getInvoiceWithItems(parseInt(id));
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch invoice' });
    }
  }
}

async function parseVendorFile(filePath: string): Promise<any[]> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return data.map((row: any) => ({
      vendor_name: row['Vendor Name'] || row['vendor_name'] || row['Name'] || '',
      contact_person: row['Contact Person'] || row['contact_person'] || row['Contact'] || '',
      email: row['Email'] || row['email'] || '',
      phone: row['Phone'] || row['phone'] || row['Telephone'] || '',
      address: row['Address'] || row['address'] || '',
      city: row['City'] || row['city'] || '',
      state: row['State'] || row['state'] || '',
      country: row['Country'] || row['country'] || '',
    }));
  } else {
    const csv = require('csv-parser');
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
}

async function importVendors(vendors: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const vendor of vendors) {
    try {
      if (!vendor.vendor_name || vendor.vendor_name.trim() === '') {
        failed++;
        errors.push('Vendor name is required');
        continue;
      }

      await VendorModel.create({
        vendor_name: vendor.vendor_name.trim(),
        contact_person: vendor.contact_person?.trim() || undefined,
        email: vendor.email?.trim() || undefined,
        phone: vendor.phone?.trim() || undefined,
        address: vendor.address?.trim() || undefined,
        city: vendor.city?.trim() || undefined,
        state: vendor.state?.trim() || undefined,
        country: vendor.country?.trim() || undefined,
      });

      success++;
    } catch (error: any) {
      failed++;
      errors.push(`Failed to import ${vendor.vendor_name}: ${error.message}`);
    }
  }

  return { success, failed, errors };
}

