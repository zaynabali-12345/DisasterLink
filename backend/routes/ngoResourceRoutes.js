const express = require('express');
const router = express.Router();
const {
  assignResourceToNgo,
  getNgoResources,
  updateNgoResource,
  deleteNgoResource,
  deployNgoResource,
} = require('../controllers/ngoResourceController.js');
const { protect, ngo, admin } = require('../middleware/authMiddleware.js');

// The 'protect' middleware ensures the user is logged in.
// The 'ngo' middleware ensures the user has the 'NGO' role.
router.route('/').get(protect, ngo, getNgoResources);

// Admin route to assign a resource type to an NGO
router.route('/assign').post(protect, admin, assignResourceToNgo);

router
  .route('/:id')
  .put(protect, ngo, updateNgoResource)
  .delete(protect, ngo, deleteNgoResource);

router.route('/:id/deploy').put(protect, ngo, deployNgoResource);

module.exports = router;