const Issue = require('../models/issue');
const Ward = require('../models/ward');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Utility to upload buffer to Cloudinary
const uploadFromBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        let cld_upload_stream = cloudinary.uploader.upload_stream(
            { folder: "egov-issues" }, // Cloudinary folder
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
    });
};

// @desc    Create a new issue (by a Citizen)
// @route   POST /api/issues
// @access  Private/Citizen
const createIssue = async (req, res) => {
    try {
        const { title, description, category, wardId, longitude, latitude } = req.body;
        const createdBy = req.user._id; // Logged-in citizen

        if (!title || !category || !wardId || !longitude || !latitude) {
            return res.status(400).json({ message: 'Title, category, ward, and location are required.' });
        }

        let imageUrl = null;
        if (req.file) {
            try {
                const result = await uploadFromBuffer(req.file.buffer);
                imageUrl = result.secure_url;
            } catch (uploadError) {
                return res.status(500).json({ message: 'Error uploading image.' });
            }
        }

        const newIssue = await Issue.create({
            title,
            description,
            category,
            ward: wardId,
            createdBy,
            imageUrl,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            status: 'Pending',
            assignedTo: null // Unassigned
        });

        // Populate details for socket emission
        const populatedIssue = await Issue.findById(newIssue._id)
                                          .populate('createdBy', 'firstName lastName')
                                          .populate('ward', 'name');

        // --- Real-time Update via Socket.io ---
        const io = req.io;
        if (io) {
             const notificationData = {
                message: `New ${category} issue reported in ${populatedIssue.ward.name}`,
                issue: populatedIssue
            };
            // Emit to Admin room
            io.to('admin_room').emit('new_issue_admin', notificationData);
            // Emit to room for that specific ward (for officers)
            io.to(wardId.toString()).emit('new_issue_ward', notificationData);
        }

        res.status(201).json({
            message: 'Issue reported successfully.',
            issue: populatedIssue
        });

    } catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ message: 'Server Error creating issue' });
    }
};

// @desc    Get all issues reported by the logged-in citizen
// @route   GET /api/issues/my-reported
// @access  Private/Citizen
const getMyReportedIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ createdBy: req.user._id })
            .populate('ward', 'name')
            .populate('assignedTo', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching issues' });
    }
};

// @desc    Get all issues assigned to the logged-in officer
// @route   GET /api/issues/my-assigned
// @access  Private/Officer
const getMyAssignedIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ assignedTo: req.user._id })
            .populate('ward', 'name')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching issues' });
    }
};

// @desc    Update the status of an issue
// @route   PATCH /api/issues/:id/status
// @access  Private/Officer or Private/Admin
const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'In Progress', 'Resolved'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Please provide a valid status.' });
        }

        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found.' });
        }

        // --- MODIFIED: Allow Admin or the assigned Officer ---
        const isAssignedOfficer = issue.assignedTo && (issue.assignedTo.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'Admin';

        if (!isAssignedOfficer && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to update this issue.' });
        }

        issue.status = status;
        await issue.save();
        
        const populatedIssue = await Issue.findById(issue._id)
            .populate('createdBy', 'firstName')
            .populate('assignedTo', 'firstName');

        // --- Real-time Notification for Citizen, Admin, and Ward ---
        const io = req.io;
        const notificationData = {
            message: `Issue '${populatedIssue.title}' has been updated to ${status}.`,
            issue: populatedIssue
        };
        
        // Notify the citizen who created it
        io.to(issue.createdBy.toString()).emit('issue_status_update', notificationData);
        // Notify Admin
        io.to('admin_room').emit('issue_status_update_admin', notificationData);
         // Notify Officers in that ward
        io.to(issue.ward.toString()).emit('issue_status_update_ward', notificationData);


        res.status(200).json({ message: 'Issue status updated successfully.', issue: populatedIssue });

    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get all issues (for map)
// @route   GET /api/issues
// @access  Public (or Private)
const getAllIssues = async (req, res) => {
    try {
        const issues = await Issue.find({})
            .populate('ward', 'name')
            .populate('createdBy', 'firstName');
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server Error searching issues' });
    }
};

module.exports = {
    createIssue,
    getMyReportedIssues,
    getMyAssignedIssues,
    updateIssueStatus,
    getAllIssues
};