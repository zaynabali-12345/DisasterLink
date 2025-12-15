const express = require('express');
const router = express.Router();
const { getAllAnalytics } = require('../controllers/analyticsController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

// @route   GET /api/analytics/all
// @desc    Get all analytics data for the dashboard
// @access  Private/Admin
router.get('/all', protect, admin, getAllAnalytics);

module.exports = router;