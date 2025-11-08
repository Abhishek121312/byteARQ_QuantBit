const express = require('express');
const router = express.Router();
const {
    addWard,
    getAllWards,
    deleteWard,
    getAllOfficers,
    getAllCitizens,
    getAdminAllIssues,
    assignIssueToOfficer
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect, isAdmin);

// Ward Management
router.route('/wards')
    .post(addWard)
    .get(getAllWards);

router.route('/wards/:id')
    // .put(updateWard) // TODO: Add later if needed
    .delete(deleteWard);

// User Management
router.get('/officers', getAllOfficers);
router.get('/citizens', getAllCitizens);

// Issue Management
router.get('/issues', getAdminAllIssues);
router.patch('/issues/:issueId/assign', assignIssueToOfficer);

module.exports = router;