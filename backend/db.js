const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const initializeDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to Aiven MySQL database.');

        // User table with locking logic
        await connection.query(`
            CREATE TABLE IF NOT EXISTS KodUser (
                uid VARCHAR(50) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                balance DECIMAL(15, 2) DEFAULT 100000.00,
                phone VARCHAR(20),
                role ENUM('Customer', 'Manager', 'Admin') DEFAULT 'Customer',
                is_frozen BOOLEAN DEFAULT FALSE,
                is_locked BOOLEAN DEFAULT FALSE,
                failed_logins INT DEFAULT 0,
                lock_until DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Transaction table with reference IDs and status
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Transactions (
                txn_id INT AUTO_INCREMENT PRIMARY KEY,
                reference_id VARCHAR(36) UNIQUE NOT NULL,
                sender_uid VARCHAR(50),
                receiver_uid VARCHAR(50),
                amount DECIMAL(15, 2) NOT NULL,
                type ENUM('DEPOSIT', 'WITHDRAW', 'TRANSFER') NOT NULL,
                balance_after DECIMAL(15, 2),
                status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_uid) REFERENCES KodUser(uid),
                FOREIGN KEY (receiver_uid) REFERENCES KodUser(uid)
            )
        `);

        // Audit & Session tables
        await connection.query(`
            CREATE TABLE IF NOT EXISTS UserToken (
                tid INT AUTO_INCREMENT PRIMARY KEY,
                token TEXT NOT NULL,
                uid VARCHAR(50),
                expiry DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uid) REFERENCES KodUser(uid) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS AuditLogs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                uid VARCHAR(50),
                action VARCHAR(255) NOT NULL,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uid) REFERENCES KodUser(uid)
            )
        `);

        console.log('Advanced Banking Database System Synchronized.');
        connection.release();
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

module.exports = { pool, initializeDB };
