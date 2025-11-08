const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Private Routes ---
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe); // Gets current logged-in user

module.exports = router;