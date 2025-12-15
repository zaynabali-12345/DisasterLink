const mongoose = require('mongoose');

// Defines the schema for items stored in the central warehouse.
const centralWarehouseSchema = new mongoose.Schema(
  {
    // Using a custom string ID like 'RES001' instead of a default ObjectId.
    _id: {
      type: String,
      required: true,
    },
    resourceName: {
      type: String,
      required: true,
      unique: true, // Each resource name should be unique in the warehouse.
    },
    category: {
      type: String,
      required: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0, // Default to 0 if not specified.
    },
    unit: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    // This field was in your data, so it's included here.
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps.
    // **FIX**: Explicitly tell Mongoose to use the 'central_warehouse' collection.
    // This prevents it from defaulting to the plural 'centralwarehouses'.
    collection: 'central_warehouse',
  }
);

// Create the Mongoose model from the schema.
const CentralWarehouse = mongoose.model('CentralWarehouse', centralWarehouseSchema);

// **FIX**: Export the model directly so it can be imported and used correctly.
module.exports = CentralWarehouse;
