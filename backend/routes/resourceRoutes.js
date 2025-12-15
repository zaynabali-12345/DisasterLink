
const express = require('express');
const {
  getAllResources,
  getWarehouseInventory,
  addWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem,
  createReplenishmentRequest,
  getReplenishmentRequests,
  updateReplenishmentRequest,
} = require('../controllers/resourceController');
const { protect, admin, ngo } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin route to see all NGO resources
router.get('/all', protect, admin, getAllResources);

// --- Central Warehouse CRUD Routes ---
router.route('/warehouse')
  .get(protect, admin, getWarehouseInventory)   // GET /api/resources/warehouse
  .post(protect, admin, addWarehouseItem);      // POST /api/resources/warehouse

router.route('/warehouse/:id')
  .put(protect, admin, updateWarehouseItem)       // PUT /api/resources/warehouse/:id
  .delete(protect, admin, deleteWarehouseItem);   // DELETE /api/resources/warehouse/:id

// NGO route to request more resources
router.post('/request-replenishment', protect, ngo, createReplenishmentRequest);

// Admin routes for managing replenishment requests
router.get('/replenishment-requests', protect, admin, getReplenishmentRequests);
router.put('/replenishment-requests/:id', protect, admin, updateReplenishmentRequest);

module.exports = router;
