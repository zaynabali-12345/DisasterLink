const mongoose = require('mongoose');

const ngoResourceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a resource name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Food', 'Water', 'Medical', 'Shelter', 'Clothing', 'Other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify the quantity'],
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'items', // e.g., 'kg', 'liters', 'kits'
    },
    location: {
      type: String,
      required: [true, 'Please provide the location of the resource'],
    },
    contact: {
      type: String,
      required: [true, 'Please provide a contact number or email'],
    },
    // Link to the NGO user who is managing this resource
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Link to the master resource in the Central Warehouse
    // FIX: The CentralWarehouse uses a String _id (e.g., 'RES001'), not an ObjectId.
    // This must be changed to a String to allow for correct referencing.
    centralResource: {
      type: String,
      ref: 'CentralWarehouse',
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Partially Used', 'Depleted', 'Deployed'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

const NgoResource = mongoose.model('NgoResource', ngoResourceSchema);

module.exports = NgoResource;
