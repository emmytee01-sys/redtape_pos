#!/usr/bin/env node

/**
 * Database Setup Script
 * Alternative Node.js version for database setup
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupDatabase() {
  try {
    console.log('==========================================');
    console.log('POS System - Database Setup');
    console.log('==========================================\n');

    // Get database credentials
    const host = await question('Enter database host [localhost]: ') || 'localhost';
    const port = parseInt(await question('Enter database port [3306]: ') || '3306');
    const user = await question('Enter MySQL user [root]: ') || 'root';
    const password = await question('Enter MySQL password: ');

    console.log('\nConnecting to MySQL...');

    // Create connection without specifying database first
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema...');
    await connection.query(schema);
    console.log('✓ Schema executed successfully');

    await connection.end();
    rl.close();

    console.log('\n✓ Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Copy backend/.env.example to backend/.env');
    console.log('2. Update the database credentials in backend/.env');
    console.log('3. Run "cd backend && npm run seed" to add sample data');

  } catch (error) {
    console.error('\n✗ Database setup failed:');
    console.error(error.message);
    rl.close();
    process.exit(1);
  }
}

setupDatabase();


