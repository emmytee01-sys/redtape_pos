const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function runMigrations() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_system',
    multipleStatements: true
  });

  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir).filter(f => f.startsWith('migration_') && f.endsWith('.sql'));
  
  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Running migration: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`✓ Migration ${file} executed successfully.`);
    } catch (err) {
      console.error(`✗ Error running migration ${file}:`, err.message);
    }
  }

  process.exit();
}

runMigrations();
