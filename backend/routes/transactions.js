const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const crypto = require('crypto');
const authenticateToken = require('../middleware/authMiddleware');
const { logAudit } = require('../logger');

const genRef = () => crypto.randomUUID().slice(0, 8).toUpperCase();

// Temporary Memory Store for OTPs (In production, use Redis)
const otpStore = new Map();

// Request OTP for large transfers
router.post('/request-otp', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const uid = req.user.uid;

    if (amount <= 10000) {
        return res.status(400).json({ success: false, message: 'OTP only required for transfers above ₹10,000' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(uid, { otp, expiry });

    // In a real bank, we would send via SMS/Email.
    console.log(`[SECURITY] OTP for ${uid} (Amount: ₹${amount}): ${otp}`);

    res.json({ success: true, message: 'Secure OTP sent to your registered device (Check Console for Demo)' });
});

// DEPOSIT
router.post('/deposit', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const uid = req.user.uid;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid deposit amount' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('UPDATE KodUser SET balance = balance + ? WHERE uid = ?', [amount, uid]);

        const [rows] = await connection.query('SELECT balance FROM KodUser WHERE uid = ?', [uid]);
        const newBal = rows[0].balance;

        const ref = crypto.randomUUID();
        await connection.query(
            'INSERT INTO Transactions (reference_id, sender_uid, receiver_uid, amount, type, balance_after, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ref, null, uid, amount, 'DEPOSIT', newBal, 'SUCCESS']
        );

        await logAudit(uid, `Credit: ₹${amount}`, req, connection);
        await connection.commit();

        res.json({ success: true, message: `Successfully deposited ₹${amount}`, balance: newBal });
    } catch (error) {
        await connection.rollback();
        console.error("Deposit Error:", error);
        res.status(500).json({ success: false, message: `Deposit Engine Error: ${error.message}` });
    } finally {
        connection.release();
    }
});

// WITHDRAW
router.post('/withdraw', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const uid = req.user.uid;

    if (!amount || amount < 100) return res.status(400).json({ success: false, message: 'Minimum withdrawal is ₹100' });
    if (amount > 50000) return res.status(400).json({ success: false, message: 'Daily limit exceeded. Max: ₹50,000' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [users] = await connection.query('SELECT balance, is_frozen FROM KodUser WHERE uid = ? FOR UPDATE', [uid]);
        const user = users[0];

        if (user.is_frozen) return res.status(403).json({ success: false, message: 'Account is frozen. Please contact support.' });
        if (parseFloat(user.balance) < amount) return res.status(400).json({ success: false, message: 'Insufficient funds for this withdrawal' });

        const newBal = parseFloat(user.balance) - amount;
        await connection.query('UPDATE KodUser SET balance = ? WHERE uid = ?', [newBal, uid]);

        const ref = crypto.randomUUID();
        await connection.query(
            'INSERT INTO Transactions (reference_id, sender_uid, receiver_uid, amount, type, balance_after, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ref, uid, null, amount, 'WITHDRAW', newBal, 'SUCCESS']
        );

        await logAudit(uid, `Debit: ₹${amount}`, req, connection);
        await connection.commit();

        res.json({ success: true, message: `Withdrew ₹${amount} successfully`, balance: newBal });
    } catch (error) {
        await connection.rollback();
        console.error("Withdraw Error:", error);
        res.status(500).json({ success: false, message: 'Transaction failure on server. No funds were debited.' });
    } finally {
        connection.release();
    }
});

// TRANSFER (ACID Compliant)
router.post('/transfer', authenticateToken, async (req, res) => {
    const { receiver_username, amount, otp } = req.body;
    const sender_uid = req.user.uid;
    const val = parseFloat(amount);

    if (!receiver_username || val <= 0) return res.status(400).json({ success: false, message: 'Invalid recipient or amount' });

    // Rule: Max Single Transfer ₹20,000
    if (val > 20000) return res.status(400).json({ success: false, message: 'Transfer exceeds single transaction limit of ₹20,000' });

    // Rule: OTP for > ₹10,000
    if (val > 10000) {
        if (!otp) return res.status(401).json({ success: false, message: 'High-value transfer requires OTP validation' });
        const stored = otpStore.get(sender_uid);
        if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }
        otpStore.delete(sender_uid); // Use once
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check Daily Limit (₹50,000)
        const [daily] = await connection.query(
            "SELECT SUM(amount) as daily_total FROM Transactions WHERE sender_uid = ? AND type = 'TRANSFER' AND created_at >= CURDATE()",
            [sender_uid]
        );
        const dailyTotal = parseFloat(daily[0].daily_total || 0);
        if (dailyTotal + val > 50000) {
            return res.status(400).json({ success: false, message: `Daily transfer limit exceeded. Remaining limit: ₹${50000 - dailyTotal}` });
        }

        // Lock Sender
        const [senders] = await connection.query('SELECT balance, is_frozen FROM KodUser WHERE uid = ? FOR UPDATE', [sender_uid]);
        const sender = senders[0];
        if (sender.is_frozen) return res.status(403).json({ success: false, message: 'Your account is currently restricted' });

        // Rule: Minimum Balance ₹1,000
        const currentBal = parseFloat(sender.balance);
        if (currentBal - val < 1000) {
            return res.status(400).json({ success: false, message: 'Transaction rejected: Minimum balance of ₹1,000 must be maintained' });
        }

        // Find and Lock Receiver
        const normalizedRecipient = receiver_username.trim().toUpperCase();
        const [receivers] = await connection.query(
            'SELECT uid, username, balance FROM KodUser WHERE (UPPER(uid) = ? OR UPPER(username) = ?) FOR UPDATE',
            [normalizedRecipient, normalizedRecipient]
        );

        if (receivers.length === 0) return res.status(404).json({ success: false, message: 'Recipient account not found' });
        const receiver = receivers[0];
        if (receiver.uid === sender_uid) return res.status(400).json({ success: false, message: 'Self-transfers not permitted' });

        const sNewBal = currentBal - val;
        const rNewBal = parseFloat(receiver.balance) + val;

        // Execute Updates
        await connection.query('UPDATE KodUser SET balance = ? WHERE uid = ?', [sNewBal, sender_uid]);
        await connection.query('UPDATE KodUser SET balance = ? WHERE uid = ?', [rNewBal, receiver.uid]);

        const ref = crypto.randomUUID();
        await connection.query(
            'INSERT INTO Transactions (reference_id, sender_uid, receiver_uid, amount, type, balance_after, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ref, sender_uid, receiver.uid, val, 'TRANSFER', sNewBal, 'SUCCESS']
        );

        await logAudit(sender_uid, `Transfer Out: ₹${val} to ${receiver.username}`, req, connection);
        await logAudit(receiver.uid, `Transfer In: ₹${val} from ${req.user.sub || 'System'}`, req, connection);

        await connection.commit();
        res.json({ success: true, message: `Transferred ₹${val} successfully`, balance: sNewBal, reference_id: ref });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("CRITICAL TRANSFER ERROR:", error);
        res.status(500).json({
            success: false,
            message: `Transfer Engine Error: ${error.message}`,
            details: error.code || 'NO_CODE'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Comprehensive History with Pagination & Advanced Filtering
router.get('/', authenticateToken, async (req, res) => {
    const { type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const uid = req.user.uid;

    let whereClause = '(t.sender_uid = ? OR t.receiver_uid = ?)';
    let params = [uid, uid];

    if (type === 'Sent') {
        whereClause = 't.sender_uid = ? AND t.type = "TRANSFER"';
        params = [uid];
    } else if (type === 'Received') {
        whereClause = 't.receiver_uid = ? AND t.type = "TRANSFER"';
        params = [uid];
    } else if (type && type !== 'All') {
        whereClause += ' AND t.type = ?';
        params.push(type.toUpperCase());
    }

    const query = `
        SELECT t.*, s.username as sender_name, r.username as receiver_name 
        FROM Transactions t
        LEFT JOIN KodUser s ON t.sender_uid = s.uid
        LEFT JOIN KodUser r ON t.receiver_uid = r.uid
        WHERE ${whereClause}
        ORDER BY t.created_at DESC 
        LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) as total FROM Transactions t WHERE ${whereClause}`;

    try {
        const [[{ total }]] = await pool.query(countQuery, params);
        const [txns] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            transactions: txns,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fetch Transactions Error:", error);
        res.status(500).json({ success: false, message: 'Database query failed' });
    }
});

// Alias for legacy compatibility
router.get('/history', authenticateToken, async (req, res) => {
    res.redirect(307, '/api/transactions' + req.url.replace('/history', ''));
});

module.exports = router;
