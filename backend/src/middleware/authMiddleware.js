const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

// Middleware to protect routes (checks for valid token)
const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;

            // 1. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 2. Check if token is in Redis blocklist (from logout)
            const isBlocked = await redisClient.get(`token:${token}`);
            if (isBlocked) {
                return res.status(401).json({ message: 'Not authorized, token is blocked' });
            }

            // 3. Attach user to the request
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// --- NEW Role-Based Middleware ---

// Middleware to check if the user is an Admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized as an Admin' });
    }
};

// Middleware to check if the user is an Officer
const isOfficer = (req, res, next) => {
    if (req.user && req.user.role === 'Officer') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized as an Officer' });
    }
};

// Middleware to check if the user is a Citizen
const isCitizen = (req, res, next) => {
    if (req.user && req.user.role === 'Citizen') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized as a Citizen' });
    }
};

// Middleware to check for Admin OR Officer
const isAdminOrOfficer = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Officer')) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized for this action' });
    }
};


module.exports = { 
    protect, 
    isAdmin,
    isOfficer,
    isCitizen,
    isAdminOrOfficer
};