const asyncHandler = require('express-async-handler');
const NgoResource = require('../models/ngoResourceModel.js');
const CentralWarehouse = require('../models/centralWarehouseModel.js');

// @desc    Create a new NGO resource
// @route   POST /api/ngo-resources
// @access  Private/Admin
const assignResourceToNgo = asyncHandler(async (req, res) => {
  const { centralResourceId, ngoId, quantity } = req.body;

  // CRITICAL FIX: Use findOne for String-based IDs like "RES001".
  // findById is only for MongoDB's default ObjectIds and will fail here.
  const centralResource = await CentralWarehouse.findOne({ _id: centralResourceId });

  if (!centralResource) {
    res.status(404);
    throw new Error('Central Warehouse item not found.');
  }

  if (centralResource.totalQuantity < quantity) {
    res.status(400);
    throw new Error('Not enough stock in the central warehouse to assign this quantity.');
  }

  // Check if this NGO already manages this resource type
  const existingNgoResource = await NgoResource.findOne({
    managedBy: ngoId,
    centralResource: centralResourceId,
  });

  // If the NGO already has this resource, just increase the quantity.
  if (existingNgoResource) {
    existingNgoResource.quantity += quantity;
    await existingNgoResource.save();
    // Decrease stock from central warehouse
    centralResource.totalQuantity -= quantity;
    await centralResource.save();
    res.status(200).json(existingNgoResource);
    return;
  }

  // If it's a new assignment, create a new inventory item for the NGO.
  const newNgoResource = await NgoResource.create({
    name: centralResource.resourceName,
    category: centralResource.category,
    quantity: quantity, // Assign the specified quantity.
    unit: centralResource.unit,
    location: 'NGO Premises', // Or get from NGO profile
    contact: 'N/A', // Or get from NGO profile
    managedBy: ngoId,
    centralResource: centralResourceId,
  });

  // Decrease stock from central warehouse
  centralResource.totalQuantity -= quantity;
  await centralResource.save();

  res.status(201).json(newNgoResource);
});

// @desc    Get resources for the logged-in NGO
// @route   GET /api/ngo-resources
// @access  Private/NGO
const getNgoResources = asyncHandler(async (req, res) => {
  // Find resources managed by the specific NGO user and populate the central resource info
  const resources = await NgoResource.find({ managedBy: req.user.id })
    .populate('centralResource', '_id resourceName category') // Explicitly include the _id
    .sort({ createdAt: -1 });
  res.json(resources);
});

// @desc    Update an NGO resource
// @route   PUT /api/ngo-resources/:id
// @access  Private/NGO
const updateNgoResource = asyncHandler(async (req, res) => {
  const resource = await NgoResource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Security check: Ensure the logged-in user owns this resource
  if (resource.managedBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized to update this resource');
  }

  // Update fields from request body
  resource.name = req.body.name || resource.name;
  resource.category = req.body.category || resource.category;
  resource.quantity = req.body.quantity ?? resource.quantity; // Use ?? to allow 0
  resource.unit = req.body.unit || resource.unit;
  resource.location = req.body.location || resource.location;
  resource.contact = req.body.contact || resource.contact;
  resource.status = req.body.status || resource.status;

  const updatedResource = await resource.save();
  res.json(updatedResource);
});

// @desc    Delete an NGO resource
// @route   DELETE /api/ngo-resources/:id
// @access  Private/NGO
const deleteNgoResource = asyncHandler(async (req, res) => {
  const resource = await NgoResource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Security check: Ensure the logged-in user owns this resource
  if (resource.managedBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized to delete this resource');
  }

  await resource.deleteOne(); // Mongoose v6+ method
  res.json({ message: 'Resource removed successfully' });
});

// @desc    Deploy an NGO resource (update status)
// @route   PUT /api/ngo-resources/:id/deploy
// @access  Private/NGO
const deployNgoResource = asyncHandler(async (req, res) => {
  const resource = await NgoResource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Security check: Ensure the logged-in user owns this resource
  if (resource.managedBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized to deploy this resource');
  }

  // Update status to 'Deployed'
  resource.status = 'Deployed';

  const updatedResource = await resource.save();

  // For immediate UI feedback, we can also send back the updated stats
  const resourcesDeployed = await NgoResource.countDocuments({ managedBy: req.user.id, status: 'Deployed' });

  res.json({
    updatedResource,
    updatedStats: { resourcesDeployed },
  });
});

module.exports = { assignResourceToNgo, getNgoResources, updateNgoResource, deleteNgoResource, deployNgoResource };
