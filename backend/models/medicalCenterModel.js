const mongoose = require('mongoose');

const medicalCenterSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    top: { type: String, required: true },
    left: { type: String, required: true },
  },
}, { timestamps: true });

const MedicalCenter = mongoose.model('MedicalCenter', medicalCenterSchema);
module.exports = MedicalCenter;