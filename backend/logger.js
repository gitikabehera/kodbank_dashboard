const { pool } = require('./db');

const logAudit = async (uid, action, req, connection = null) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Use provided connection or pool
    const executor = connection || pool;

    try {
        await executor.query(
            'INSERT INTO AuditLogs (uid, action, ip_address) VALUES (?, ?, ?)',
            [uid, action, ip]
        );
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = { logAudit };
