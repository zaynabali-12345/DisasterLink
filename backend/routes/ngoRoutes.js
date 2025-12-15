const express = require('express');
const router = express.Router();
const {
  getNgoRequests,
  getNgoDashboardData,
  acceptNgoTask,
  acceptCoordinationTask,
} = require('../controllers/ngoController');
const { protect, ngo } = require('../middleware/authMiddleware.js');

// Get all requests for a specific NGO
// For a real app, you'd use middleware like this:
// router.get('/:ngoId/requests', protectNgo, getNgoRequests);
router.get('/:ngoId/requests', getNgoRequests);

// Get all dashboard data for a specific NGO.
// This route is protected to ensure only the logged-in NGO can access their data.
router.get('/:ngoId/dashboard', protect, ngo, getNgoDashboardData);

// Allow an NGO to accept a task
router.put('/tasks/:taskId/accept', acceptNgoTask);

// Allow an NGO to accept a coordination request from the dashboard
router.put('/:ngoId/requests/:requestId/accept', protect, ngo, acceptCoordinationTask);

module.exports = router;
