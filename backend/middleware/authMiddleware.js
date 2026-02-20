const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains sub (username), role, uid
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authenticateToken;
