const mongoose = require('mongoose');

const ambulanceSchema = mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Dispatched'],
    default: 'Active',
  },
  location: {
    top: { type: String, required: true },
    left: { type: String, required: true },
  },
}, { timestamps: true });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);
module.exports = Ambulance;