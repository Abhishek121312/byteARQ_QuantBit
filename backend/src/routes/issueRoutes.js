const express = require('express');
const router = express.Router();
const {
    createIssue,
    getMyReportedIssues,
    getMyAssignedIssues,
    updateIssueStatus,
    getAllIssues
} = require('../controllers/issueController');
const { 
    protect, 
    isCitizen, 
    isOfficer, 
    isAdmin,
    isAdminOrOfficer
} = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import upload middleware

// --- Public Route ---
// Get all issues for the public map view
router.get('/', getAllIssues);


// --- Private Citizen Route ---
// Create a new issue (with image upload)
router.post('/', protect, isCitizen, upload, createIssue);
// Get issues reported by the logged-in citizen
router.get('/my-reported', protect, isCitizen, getMyReportedIssues);


// --- Private Officer Route ---
// Get issues assigned to the logged-in officer
router.get('/my-assigned', protect, isOfficer, getMyAssignedIssues);


// --- Private Officer/Admin Route ---
// Update an issue's status
router.patch('/:id/status', protect, isAdminOrOfficer, updateIssueStatus);


module.exports = router;