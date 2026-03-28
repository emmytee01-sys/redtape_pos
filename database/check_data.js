const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pos_system',
    });

    try {
        const [pos] = await pool.execute('SELECT * FROM pos_terminals');
        console.log('POS Terminals:', pos);
        const [acc] = await pool.execute('SELECT * FROM account_numbers');
        console.log('Bank Accounts:', acc);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

check();
