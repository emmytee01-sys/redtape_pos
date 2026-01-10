import pool from './database';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Get role IDs
    const [adminRole] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['admin']);
    const [managerRole] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['manager']);
    const [salesRepRole] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['sales_rep']);
    const [accountantRole] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['accountant']);

    const adminRoleId = (adminRole as any[])[0]?.id;
    const managerRoleId = (managerRole as any[])[0]?.id;
    const salesRepRoleId = (salesRepRole as any[])[0]?.id;
    const accountantRoleId = (accountantRole as any[])[0]?.id;

    if (!adminRoleId || !managerRoleId || !salesRepRoleId || !accountantRoleId) {
      throw new Error('Roles not found. Please run the database schema first.');
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create sample users
    const users = [
      {
        username: 'admin',
        email: 'admin@pos.com',
        password_hash: passwordHash,
        full_name: 'System Administrator',
        role_id: adminRoleId,
      },
      {
        username: 'manager',
        email: 'manager@pos.com',
        password_hash: passwordHash,
        full_name: 'Inventory Manager',
        role_id: managerRoleId,
      },
      {
        username: 'sales1',
        email: 'sales1@pos.com',
        password_hash: passwordHash,
        full_name: 'Sales Representative 1',
        role_id: salesRepRoleId,
      },
      {
        username: 'accountant',
        email: 'accountant@pos.com',
        password_hash: passwordHash,
        full_name: 'Accountant',
        role_id: accountantRoleId,
      },
    ];

    for (const user of users) {
      const existing = await UserModel.findByUsername(user.username);
      if (!existing) {
        await UserModel.create(user);
        console.log(`Created user: ${user.username}`);
      } else {
        console.log(`User ${user.username} already exists`);
      }
    }

    // Get manager user ID
    const manager = await UserModel.findByUsername('manager');
    if (!manager) {
      throw new Error('Manager user not found');
    }

    // Create sample products
    const products = [
      {
        sku: 'PROD-001',
        product_name: 'Laptop Computer',
        category: 'Electronics',
        description: 'High-performance laptop',
        price: 999.99,
        quantity: 50,
        min_stock_level: 10,
        created_by: manager.id,
      },
      {
        sku: 'PROD-002',
        product_name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
        quantity: 100,
        min_stock_level: 20,
        created_by: manager.id,
      },
      {
        sku: 'PROD-003',
        product_name: 'Office Chair',
        category: 'Furniture',
        description: 'Comfortable office chair',
        price: 199.99,
        quantity: 30,
        min_stock_level: 5,
        created_by: manager.id,
      },
      {
        sku: 'PROD-004',
        product_name: 'Desk Lamp',
        category: 'Furniture',
        description: 'LED desk lamp',
        price: 39.99,
        quantity: 75,
        min_stock_level: 15,
        created_by: manager.id,
      },
      {
        sku: 'PROD-005',
        product_name: 'Notebook',
        category: 'Stationery',
        description: 'A4 notebook',
        price: 5.99,
        quantity: 200,
        min_stock_level: 50,
        created_by: manager.id,
      },
    ];

    for (const product of products) {
      const existing = await ProductModel.findBySku(product.sku);
      if (!existing) {
        await ProductModel.create(product);
        console.log(`Created product: ${product.product_name}`);
      } else {
        console.log(`Product ${product.sku} already exists`);
      }
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

