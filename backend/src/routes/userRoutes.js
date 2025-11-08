const express = require('express');
const router = express.Router();
const { updateMyProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes require user to be logged in
router.use(protect);

// Route for updating the logged-in user's profile
router.put('/profile', updateMyProfile);

module.exports = router;