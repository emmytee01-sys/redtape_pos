import * as XLSX from 'xlsx';
import { CSVService } from '../services/csvService';
import pool from './database';
import path from 'path';

async function importExcelFile() {
  try {
    const excelPath = path.join(__dirname, '../../../frontend/public/QB POS Inventory Items Export.xlsx');
    
    console.log('Reading Excel file:', excelPath);
    const products = await CSVService.parseProducts(excelPath);
    
    console.log(`Found ${products.length} products to import`);
    
    // Get admin user ID (assuming admin user exists)
    const [adminUsers] = await pool.execute('SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = "admin") LIMIT 1');
    const adminUsersArray = adminUsers as any[];
    
    if (adminUsersArray.length === 0) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    
    const adminId = adminUsersArray[0].id;
    
    console.log('Importing products...');
    const result = await CSVService.importProducts(products, adminId);
    
    console.log('\n=== Import Summary ===');
    console.log(`Successful: ${result.success}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error importing Excel file:', error.message);
    process.exit(1);
  }
}

importExcelFile();

