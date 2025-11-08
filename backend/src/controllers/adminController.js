const Ward = require('../models/ward');
const User = require('../models/user');
const Issue = require('../models/issue');
const mongoose = require('mongoose');

// --- NEW FUNCTION: Create Officer ---
// @desc    Create a new officer
// @route   POST /api/admin/officers
// @access  Private/Admin
const createOfficer = async (req, res) => {
    try {
        const { email, password, firstName, lastName, ward } = req.body;

        // Basic validation
        if (!email || !password || !firstName || !ward) {
            return res.status(400).json({ message: 'Email, password, first name, and ward are required.' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Check if ward exists
        const wardExists = await Ward.findById(ward);
        if (!wardExists) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        // Create user with 'Officer' role
        const officer = await User.create({
            email,
            password,
            firstName,
            lastName,
            ward,
            role: 'Officer' // Explicitly set role
        });
        
        if (officer) {
            // Don't send password back
            const officerData = await User.findById(officer._id).select('-password').populate('ward', 'name');
            
            // --- IMPORTANT: Add officer to the ward's assignedOfficers array ---
            wardExists.assignedOfficers.push(officer._id);
            await wardExists.save();
            
            res.status(201).json(officerData);
        } else {
            res.status(400).json({ message: 'Invalid officer data provided' });
        }

    } catch (error) {
        console.error("Error creating officer:", error);
        res.status(500).json({ message: 'Server Error creating officer: ' + error.message });
    }
};
// --- END NEW FUNCTION ---

// @desc    Add a new ward
// @route   POST /api/admin/wards
// @access  Private/Admin
const addWard = async (req, res) => {
    try {
        const { name, longitude, latitude } = req.body;
        const newWard = await Ward.create({
            name,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
        res.status(201).json({
            message: 'Ward created successfully',
            ward: newWard
        });
    } catch (error) {
         res.status(500).json({ message: 'Server Error adding ward: ' + error.message });
    }
};

// @desc    Get all wards
// @route   GET /api/admin/wards
// @access  Private/Admin
const getAllWards = async (req, res) => {
    try {
        const wards = await Ward.find({}).populate('assignedOfficers', 'email firstName lastName');
        res.status(200).json(wards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching wards: ' + error.message });
    }
};

// @desc    Delete a ward
// @route   DELETE /api/admin/wards/:id
// @access  Private/Admin
const deleteWard = async (req, res) => {
    try {
        // TODO: Add transaction to also delete/reassign issues and officers
        await Ward.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Ward removed successfully' });
    } catch (error) {
         res.status(500).json({ message: 'Server Error deleting ward: ' + error.message });
    }
};

// @desc    Get all officers
// @route   GET /api/admin/officers
// @access  Private/Admin
const getAllOfficers = async (req, res) => {
    try {
        const officers = await User.find({ role: 'Officer' })
                                   .select('-password')
                                   .populate('ward', 'name');
        res.status(200).json(officers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching officers: ' + error.message });
    }
};

// @desc    Get all citizens
// @route   GET /api/admin/citizens
// @access  Private/Admin
const getAllCitizens = async (req, res) => {
    try {
        const citizens = await User.find({ role: 'Citizen' })
                                   .select('-password')
                                   .populate('ward', 'name');
        res.status(200).json(citizens);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching citizens: ' + error.message });
    }
};

// @desc    Get all issues (for admin dashboard)
// @route   GET /api/admin/issues
// @access  Private/Admin
const getAdminAllIssues = async (req, res) => {
    try {
        const issues = await Issue.find({})
            .populate('createdBy', 'firstName lastName')
            .populate('ward', 'name')
            .populate('assignedTo', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching issues: ' + error.message });
    }
};

// @desc    Assign an issue to an officer
// @route   PATCH /api/admin/issues/:issueId/assign
// @access  Private/Admin
const assignIssueToOfficer = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { officerId } = req.body;

        const issue = await Issue.findById(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const officer = await User.findById(officerId);
        if (!officer || officer.role !== 'Officer') {
            return res.status(404).json({ message: 'Officer not found or user is not an Officer' });
        }
        
        // --- Check if officer is in the same ward as the issue ---
        if (issue.ward.toString() !== officer.ward.toString()) {
            return res.status(400).json({ message: 'Officer must be assigned to the same ward as the issue.' });
        }

        issue.assignedTo = officerId;
        // Optionally update status to 'In Progress'
        if(issue.status === 'Pending') {
            issue.status = 'In Progress';
        }
        await issue.save();

        const populatedIssue = await Issue.findById(issue._id)
            .populate('createdBy', 'firstName')
            .populate('assignedTo', 'firstName')
            .populate('ward', 'name');

        // --- Real-time Notification ---
        const io = req.io;
        const notifyData = {
            message: `Issue '${populatedIssue.title}' has been assigned to you.`,
            issue: populatedIssue
        };
        // Notify the specific officer
        io.to(officerId.toString()).emit('new_assignment', notifyData);
        // Notify the citizen
        io.to(issue.createdBy.toString()).emit('issue_status_update', {
            message: `Your issue is now In Progress and assigned to ${officer.firstName}.`,
            issue: populatedIssue
        });
        // Notify other admins/ward
        io.to('admin_room').emit('issue_status_update_admin', notifyData);
        io.to(issue.ward.toString()).emit('issue_status_update_ward', notifyData);


        res.status(200).json({ message: 'Issue assigned successfully', issue: populatedIssue });

    } catch (error) {
        res.status(500).json({ message: 'Server Error assigning issue: ' + error.message });
    }
};

module.exports = {
    addWard,
    getAllWards,
    deleteWard,
    getAllOfficers,
    getAllCitizens,
    getAdminAllIssues,
    assignIssueToOfficer,
    createOfficer, // --- ADDED ---
};