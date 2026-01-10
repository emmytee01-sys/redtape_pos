import { Response } from 'express';
import { ProductModel } from '../models/Product';
import { AuthRequest } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CSVService } from '../services/csvService';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `products-${Date.now()}${path.extname(file.originalname)}`);
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
      cb(new Error('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'));
    }
  },
});

export class ProductController {
  static async getAllProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const products = await ProductModel.findAll(includeInactive);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch products' });
    }
  }

  static async getProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById(parseInt(id));
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch product' });
    }
  }

  static async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku, product_name, category, description, price, quantity, min_stock_level } =
        req.body;

      if (!sku || !product_name || !category || !price || quantity === undefined) {
        res.status(400).json({
          error: 'SKU, product_name, category, price, and quantity are required',
        });
        return;
      }

      // Check if SKU already exists
      const existing = await ProductModel.findBySku(sku);
      if (existing) {
        res.status(400).json({ error: 'SKU already exists' });
        return;
      }

      const productId = await ProductModel.create({
        sku,
        product_name,
        category,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        min_stock_level: min_stock_level ? parseInt(min_stock_level) : 0,
        created_by: req.user!.id,
      });

      res.status(201).json({ id: productId, message: 'Product created successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  }

  static async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.product_name !== undefined) updates.product_name = req.body.product_name;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
      if (req.body.quantity !== undefined) updates.quantity = parseInt(req.body.quantity);
      if (req.body.min_stock_level !== undefined)
        updates.min_stock_level = parseInt(req.body.min_stock_level);
      if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

      await ProductModel.update(parseInt(id), updates);
      res.json({ message: 'Product updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  }

  static async uploadCSV(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      const products = await CSVService.parseProducts(req.file.path);
      const validation = CSVService.validateCSVData(products);

      if (!validation.valid) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          error: 'File validation failed',
          errors: validation.errors,
        });
        return;
      }

      const result = await CSVService.importProducts(products, req.user!.id);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Import completed',
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message || 'Failed to import file' });
    }
  }

  static async getLowStockItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const threshold = req.query.threshold
        ? parseInt(req.query.threshold as string)
        : undefined;
      const products = await ProductModel.getLowStockItems(threshold);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch low stock items' });
    }
  }
}

