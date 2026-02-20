const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT uid, username, email, balance, phone, role, created_at FROM KodUser WHERE uid = ?',
            [req.user.uid]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Check User for Transfer
router.get('/users/check/:uid', authenticateToken, async (req, res) => {
    const rawUid = req.params.uid;
    const uid = rawUid.trim().toUpperCase();

    console.log("Checking UID:", uid);

    try {
        const [users] = await pool.query(
            'SELECT uid, username, role FROM KodUser WHERE UPPER(uid) = ? OR UPPER(username) = ?',
            [uid, uid]
        );

        if (users.length > 0) {
            return res.json({
                success: true,
                exists: true,
                uid: users[0].uid,
                username: users[0].username,
                role: users[0].role
            });
        }

        // Diagnostic Log for Dev
        const [allUsers] = await pool.query('SELECT username, uid FROM KodUser LIMIT 10');
        console.log("Validation Failed for:", uid);
        console.log("Current Users in DB:", allUsers.map(u => `${u.username} (${u.uid})`).join(', '));

        res.json({ success: true, exists: false });
    } catch (error) {
        console.error('Database Error during User Check:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
