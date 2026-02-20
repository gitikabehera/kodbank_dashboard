const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logAudit } = require('../logger');
require('dotenv').config();

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

// User Registration
router.post('/register', async (req, res) => {
    const { uid, username, password, email, phone, role } = req.body;

    if (!uid || !username || !password || !email) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO KodUser (uid, username, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, username, email, hashedPassword, phone, role || 'Customer']
        );

        await logAudit(uid, 'User Registered', req);
        res.status(201).json({ success: true, message: 'User registered successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// User Login
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM KodUser WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Check lock
        if (user.lock_until && new Date() < new Date(user.lock_until)) {
            const minutesLeft = Math.ceil((new Date(user.lock_until) - new Date()) / 60000);
            return res.status(403).json({ message: `Account locked. Try again in ${minutesLeft} minutes.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Track failed lookup
            const attempts = (user.failed_logins || 0) + 1;
            let lockUntil = null;
            if (attempts >= 5) {
                lockUntil = new Date(Date.now() + 10 * 60000); // 10 mins lock
            }
            await pool.query('UPDATE KodUser SET failed_logins = ?, lock_until = ? WHERE uid = ?', [attempts, lockUntil, user.uid]);
            const remaining = 5 - attempts;
            return res.status(401).json({
                message: attempts >= 5
                    ? 'Account locked for 10 minutes.'
                    : `Invalid credentials. ${remaining} attempts remaining.`
            });
        }

        // Success - reset failures
        await pool.query('UPDATE KodUser SET failed_logins = 0, lock_until = NULL WHERE uid = ?', [user.uid]);

        const token = jwt.sign(
            { sub: user.username, role: user.role, uid: user.uid },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });

        await logAudit(user.uid, 'User Logged In', req);

        res.json({
            success: true,
            message: 'Login successful.',
            user: { uid: user.uid, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
