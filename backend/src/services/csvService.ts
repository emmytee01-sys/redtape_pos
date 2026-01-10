import csv from 'csv-parser';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { ProductModel } from '../models/Product';
import path from 'path';

export interface CSVProduct {
  product_name: string;
  sku: string;
  category: string;
  price: string;
  quantity: string;
  min_stock_level?: string;
  description?: string;
}

export class CSVService {
  static async parseProducts(filePath: string): Promise<CSVProduct[]> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.xlsx' || ext === '.xls') {
      return this.parseExcel(filePath);
    } else {
      return this.parseCSV(filePath);
    }
  }

  static async parseCSV(filePath: string): Promise<CSVProduct[]> {
    return new Promise((resolve, reject) => {
      const results: CSVProduct[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  static async parseExcel(filePath: string): Promise<CSVProduct[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const products: CSVProduct[] = data.map((row: any) => {
        // Map Excel columns to our product format
        // Try to find columns by common names (case-insensitive)
        const mapColumn = (possibleNames: string[]): string => {
          for (const name of possibleNames) {
            const key = Object.keys(row).find(
              (k) => k.toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return String(row[key]).trim();
            }
          }
          return '';
        };

        // QB POS specific mapping
        const itemNumber = mapColumn(['item number', 'item_number', 'sku', 'item code', 'item_code', 'code', 'product code', 'product_code']) || '';
        const itemDescription = mapColumn(['item description', 'item_description', 'product name', 'product_name', 'name', 'item', 'description']) || '';
        const department = mapColumn(['department name', 'department_name', 'category', 'type', 'group', 'department']) || 'Uncategorized';
        const sellingPrice = mapColumn(['selling price', 'selling_price', 'price', 'unit price', 'unit_price', 'amount', 'sell price', 'sell_price']) || '0';
        const quantity = mapColumn(['quantity', 'qty', 'stock', 'on hand', 'on_hand', 'inventory', 'available']) || '0';
        const cost = mapColumn(['cost']) || '';
        const barcode = mapColumn(['barcode', 'barcode number', 'bar_code']) || '';

        // Use Item Number as SKU, or barcode if Item Number is not available
        const sku = itemNumber || barcode || '';

        return {
          product_name: itemDescription || '',
          sku: sku,
          category: department || 'Uncategorized',
          price: sellingPrice || '0',
          quantity: quantity || '0',
          min_stock_level: mapColumn(['min stock', 'min_stock', 'min stock level', 'min_stock_level', 'reorder level', 'reorder_level']) || '0',
          description: cost ? `Cost: ${cost}` : '',
        };
      });

      // Filter out empty rows
      return products.filter(
        (p) => p.product_name && p.sku
      );
    } catch (error: any) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  static validateCSVData(products: CSVProduct[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const skus = new Set<string>();

    products.forEach((product, index) => {
      const row = index + 2; // +2 because header is row 1, and arrays are 0-indexed

      if (!product.product_name || product.product_name.trim() === '') {
        errors.push(`Row ${row}: Product name is required`);
      }

      if (!product.sku || product.sku.trim() === '') {
        errors.push(`Row ${row}: SKU is required`);
      } else if (skus.has(product.sku.trim().toUpperCase())) {
        errors.push(`Row ${row}: Duplicate SKU: ${product.sku}`);
      } else {
        skus.add(product.sku.trim().toUpperCase());
      }

      // Category is optional, will default to 'Uncategorized'

      const price = parseFloat(product.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${row}: Invalid price: ${product.price}`);
      }

      const quantity = parseInt(product.quantity);
      if (isNaN(quantity) || quantity < 0) {
        errors.push(`Row ${row}: Invalid quantity: ${product.quantity}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static async importProducts(
    products: CSVProduct[],
    createdBy: number
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // Check if SKU already exists
        const existing = await ProductModel.findBySku(product.sku.trim());
        if (existing) {
          failed++;
          errors.push(`SKU ${product.sku} already exists`);
          continue;
        }

        await ProductModel.create({
          sku: product.sku.trim(),
          product_name: product.product_name.trim(),
          category: product.category?.trim() || 'Uncategorized',
          description: product.description?.trim() || undefined,
          price: parseFloat(product.price || '0'),
          quantity: parseInt(product.quantity || '0'),
          min_stock_level: product.min_stock_level ? parseInt(product.min_stock_level) : 0,
          created_by: createdBy,
        });

        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to import ${product.sku}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }
}

