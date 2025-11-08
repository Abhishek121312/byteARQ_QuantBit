const User = require('../models/user');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const { validateRegistration } = require('../utility/validation'); // We'll adapt this

// Utility to generate token and set cookie
const generateTokenAndSetCookie = (res, userId, role) => {
    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600 * 1000
    });
};

// @desc    Register a new user (defaults to Citizen)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        // We'll use a simplified validation for now
        const { email, password, firstName, lastName, ward } = req.body;
        if (!email || !password || !firstName) {
             return res.status(400).json({ message: 'Email, password, and first name are required.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // --- MODIFIED: Default role is now 'Citizen' ---
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            ward, // Citizen is associated with a ward
            role: 'Citizen' // Changed from 'Patient' or 'Officer'
        });

        if (user) {
            generateTokenAndSetCookie(res, user._id, user.role);
            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                email: user.email,
                role: user.role,
                ward: user.ward
            });
        } else {
            res.status(400).json({ message: 'Invalid user data provided' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate a user & get a cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User.findOne({ email }).populate('ward', 'name');
        if (user && (await user.matchPassword(password))) {
            generateTokenAndSetCookie(res, user._id, user.role);
            res.json({
                _id: user._id,
                firstName: user.firstName,
                email: user.email,
                role: user.role,
                ward: user.ward
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Logout user, clear cookie, and block token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (token) {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                // Add token to Redis blocklist until it expires
                await redisClient.set(`token:${token}`, 'blocked', {
                    EXAT: decoded.exp
                });
            }
        }
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is already populated by 'protect' middleware
    // We re-fetch to populate the ward name
     const user = await User.findById(req.user._id).select('-password').populate('ward', 'name');
    res.status(200).json(user);
};

module.exports = { 
    registerUser, 
    loginUser, 
    logoutUser,
    getMe
};