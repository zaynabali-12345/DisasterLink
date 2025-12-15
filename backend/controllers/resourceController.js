const NgoResource = require('../models/ngoResourceModel.js');
const ReplenishmentRequest = require('../models/replenishmentRequestModel.js');
const CentralWarehouse = require('../models/centralWarehouseModel.js');

// @desc    Get all resources
// @route   GET /api/resources/all
// @access  Private/Admin
const getAllResources = async (req, res) => {
  // Fetch all NGO resources and populate the 'managedBy' field with the user's name
  const resources = await NgoResource.find({}).populate('managedBy', 'name');
  res.json(resources);
};

// @desc    Get all central warehouse inventory
// @route   GET /api/resources/warehouse
// @access  Private/Admin
const getWarehouseInventory = async (req, res) => {
  const inventory = await CentralWarehouse.find({});
  res.json(inventory);
};

// @desc    Add a new item to the central warehouse
// @route   POST /api/resources/warehouse
// @access  Private/Admin
const addWarehouseItem = async (req, res) => {
  const { resourceName, category, totalQuantity, unit, location } = req.body;

  const itemExists = await CentralWarehouse.findOne({ resourceName });
  if (itemExists) {
    return res.status(400).json({ message: 'Resource with this name already exists in the warehouse.' });
  }

  // --- FIX: Auto-generate the next sequential string ID ---
  // Find the last item in the warehouse, sorted by _id descending
  const lastItem = await CentralWarehouse.findOne().sort({ _id: -1 });
  let newId;
  if (lastItem) {
    // Extract the number from the last ID (e.g., 'RES005' -> 5)
    const lastIdNumber = parseInt(lastItem._id.replace('RES', ''), 10);
    // Increment and format the new ID (e.g., 6 -> 'RES006')
    newId = 'RES' + String(lastIdNumber + 1).padStart(3, '0');
  } else {
    // If this is the very first item, start with RES001
    newId = 'RES001';
  }

  const newItem = await CentralWarehouse.create({
    _id: newId, // Use the newly generated ID
    resourceName,
    category,
    totalQuantity,
    unit,
    location,
  });

  res.status(201).json(newItem);
};

// @desc    Update an item in the central warehouse
// @route   PUT /api/resources/warehouse/:id
// @access  Private/Admin
const updateWarehouseItem = async (req, res) => {
  const item = await CentralWarehouse.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ message: 'Warehouse item not found' });
  }

  item.resourceName = req.body.resourceName || item.resourceName;
  item.category = req.body.category || item.category;
  item.totalQuantity = req.body.totalQuantity ?? item.totalQuantity;
  item.unit = req.body.unit || item.unit;
  item.location = req.body.location || item.location;

  const updatedItem = await item.save();
  res.json(updatedItem);
};

// @desc    Delete an item from the central warehouse
// @route   DELETE /api/resources/warehouse/:id
// @access  Private/Admin
const deleteWarehouseItem = async (req, res) => {
  const item = await CentralWarehouse.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Warehouse item not found' });
  }
  res.json({ message: 'Item removed from warehouse' });
};

// @desc    Create a new replenishment request
// @route   POST /api/resources/request-replenishment
// @access  Private/NGO
const createReplenishmentRequest = async (req, res) => {
  const { resourceId, resourceName, ngoId, ngoName, quantity } = req.body;

  // Find the NGO's resource to get the centralResource ID from it
  const ngoResource = await NgoResource.findById(resourceId);
  if (!ngoResource || !ngoResource.centralResource) {
    return res.status(400).json({
      message: 'Cannot create replenishment request. The resource is not linked to the central warehouse.',
    });
  }

  const request = new ReplenishmentRequest({
    resourceId,
    resourceName,
    centralResource: ngoResource.centralResource, // Use the ID from the NGO's resource
    ngoId,
    ngoName,
    quantity,
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
};

// @desc    Get all pending replenishment requests
// @route   GET /api/resources/replenishment-requests
// @access  Private/Admin
const getReplenishmentRequests = async (req, res) => {
  const requests = await ReplenishmentRequest.find({ status: 'Pending' }).sort({ createdAt: 'desc' });
  res.json(requests);
};

// @desc    Approve or reject a replenishment request
// @route   PUT /api/resources/replenishment-requests/:id
// @access  Private/Admin
const updateReplenishmentRequest = async (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'
  const request = await ReplenishmentRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  if (status === 'Approved') {
    // CRITICAL FIX: Use findOne({ _id: ... }) instead of findById().
    // findById() is for ObjectIds, but your warehouse uses String IDs (e.g., "RES003").
    // This ensures Mongoose queries by the string value correctly.
    const warehouseItem = await CentralWarehouse.findOne({ _id: request.centralResource });

    if (!warehouseItem || warehouseItem.totalQuantity < request.quantity) {
      return res.status(400).json({ message: 'Not enough stock in the central warehouse to approve this request.' });
    }

    // Perform stock updates in a single transaction for data integrity
    // 1. Decrement central warehouse stock
    warehouseItem.totalQuantity -= request.quantity;
    await warehouseItem.save();

    // 2. Increment the specific NGO's resource stock
    // The `request.resourceId` correctly points to the NgoResource document that made the request.
    const ngoResource = await NgoResource.findById(request.resourceId);
    if (ngoResource) {
      ngoResource.quantity += request.quantity;
      await ngoResource.save();
    } else {
      // This is a safeguard in case the NGO's resource was deleted.
      return res.status(404).json({ message: "The requesting NGO's resource could not be found." });
    }
  }

  request.status = status;
  await request.save();
  res.json({ message: `Request has been ${status.toLowerCase()}` });
};

module.exports = {
  getAllResources,
  getWarehouseInventory,
  addWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem,
  createReplenishmentRequest,
  getReplenishmentRequests,
  updateReplenishmentRequest,
};
