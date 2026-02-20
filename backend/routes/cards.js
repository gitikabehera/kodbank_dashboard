const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Get User Cards
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [cards] = await pool.query('SELECT * FROM VirtualCards WHERE uid = ?', [req.user.uid]);
        res.json({ success: true, cards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cards' });
    }
});

// Issue New Card
router.post('/issue', authenticateToken, async (req, res) => {
    const uid = req.user.uid;
    const cardNumber = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
    const cvv = Math.floor(Math.random() * 900 + 100).toString();
    const expiry = '12/29';

    try {
        await pool.query(
            'INSERT INTO VirtualCards (uid, card_number, cvv, expiry_date) VALUES (?, ?, ?, ?)',
            [uid, cardNumber, cvv, expiry]
        );
        res.json({ success: true, message: 'New Virtual Card Issued Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Card issuance failed' });
    }
});

// Toggle Status
router.put('/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE VirtualCards SET status = ? WHERE id = ? AND uid = ?', [status, req.params.id, req.user.uid]);
        res.json({ success: true, message: `Card ${status === 'ACTIVE' ? 'Activated' : 'Frozen'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status update failed' });
    }
});

module.exports = router;
