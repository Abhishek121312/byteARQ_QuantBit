const express = require('express');
const router = express.Router();
const { getPublicWards } = require('../controllers/publicController');

/**
 * @desc    Public route to get a list of all wards.
 * Used for 'Sign Up' and 'Report Issue' forms.
 * @route   GET /api/public/wards
 * @access  Public
 */
router.get('/wards', getPublicWards);

module.exports = router;