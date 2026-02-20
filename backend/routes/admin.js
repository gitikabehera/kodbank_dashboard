const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Middleware to verify Admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Administrative access required' });
    }
};

// Get Global Stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [[{ user_count }]] = await pool.query('SELECT COUNT(*) as user_count FROM KodUser');
        const [[{ total_balance }]] = await pool.query('SELECT SUM(balance) as total_balance FROM KodUser');
        const [[{ txn_count }]] = await pool.query('SELECT COUNT(*) as txn_count FROM Transactions');

        res.json({
            success: true,
            stats: {
                users: user_count,
                balance: total_balance || 0,
                transactions: txn_count
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// List All Users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT uid, username, email, balance, role, is_frozen, created_at FROM KodUser ORDER BY created_at DESC');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// List All Transactions (Global)
router.get('/transactions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [txns] = await pool.query(`
            SELECT t.*, s.username as sender_name, r.username as receiver_name 
            FROM Transactions t
            LEFT JOIN KodUser s ON t.sender_uid = s.uid
            LEFT JOIN KodUser r ON t.receiver_uid = r.uid
            ORDER BY t.created_at DESC LIMIT 100
        `);
        res.json({ success: true, transactions: txns });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
});

// Freeze/Unfreeze
router.put('/freeze/:uid', authenticateToken, isAdmin, async (req, res) => {
    const { freeze } = req.body;
    try {
        await pool.query('UPDATE KodUser SET is_frozen = ? WHERE uid = ?', [freeze, req.params.uid]);
        res.json({ success: true, message: `User account ${freeze ? 'frozen' : 'activated'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Action failed' });
    }
});

// Adjust Balance
router.put('/adjust-balance', authenticateToken, isAdmin, async (req, res) => {
    const { uid, newBalance } = req.body;
    try {
        await pool.query('UPDATE KodUser SET balance = ? WHERE uid = ?', [newBalance, uid]);
        res.json({ success: true, message: 'Balance calibrated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Calibration failed' });
    }
});

// Promote to Manager
router.put('/promote/:uid', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query("UPDATE KodUser SET role = 'Manager' WHERE uid = ?", [req.params.uid]);
        res.json({ success: true, message: 'User promoted to Managerial role' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Promotion failed' });
    }
});

// Delete User
router.delete('/delete/:uid', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM KodUser WHERE uid = ?', [req.params.uid]);
        res.json({ success: true, message: 'Entity purged from system' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Purge failed. User may have transaction dependencies.' });
    }
});

module.exports = router;
