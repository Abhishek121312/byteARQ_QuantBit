const User = require('../models/user');

// @desc    Update user profile (Citizen, Officer, Admin)
// @route   PUT /api/users/profile
// @access  Private
const updateMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(4404).json({ message: 'User not found' });
        }

        // Common fields
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.phone_number = req.body.phone_number || user.phone_number;
        
        // Update ward if provided
        if (req.body.ward) {
            user.ward = req.body.ward;
        }

        const updatedUser = await user.save();

        // Send back updated user data (excluding password)
        const responseUser = await User.findById(updatedUser._id).select('-password').populate('ward', 'name');

        res.status(200).json(responseUser);

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: 'Server Error updating profile: ' + error.message });
    }
};

module.exports = {
    updateMyProfile,
};