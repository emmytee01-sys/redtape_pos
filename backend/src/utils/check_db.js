const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pos_system',
    });

    try {
        const [rows] = await pool.execute('SHOW TABLES');
        console.log('Tables:', rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

check();
