const mongoose = require('mongoose');

const replenishmentRequestSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NgoResource',
      required: true,
    },
    // FIX: The CentralWarehouse uses a String _id (e.g., 'RES001'), not an ObjectId.
    // This must be changed to a String to allow for correct referencing.
    centralResource: {
      type: String,
      ref: 'CentralWarehouse',
      required: true,
    },
    resourceName: { type: String, required: true },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoName: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    // Explicitly set the collection name to avoid any ambiguity.
    collection: 'replenishmentrequests',
  }
);

module.exports = mongoose.model('ReplenishmentRequest', replenishmentRequestSchema);
