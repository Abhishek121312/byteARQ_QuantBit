const Ward = require('../models/ward');

/**
 * @desc    Get all wards for public use (dropdowns)
 * @route   GET /api/public/wards
 * @access  Public
 */
const getPublicWards = async (req, res) => {
    try {
        // We only select the 'name' and '_id' to keep the payload light
        // and send only what's needed for the dropdown.
        const wards = await Ward.find({}).select('name _id');
        
        res.status(200).json(wards);
    } catch (error) {
        console.error('Server Error fetching public wards:', error.message);
        res.status(500).json({ message: 'Server Error fetching wards' });
    }
};

module.exports = { 
    getPublicWards 
};