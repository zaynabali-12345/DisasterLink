const mongoose = require('mongoose');

const predictionResultSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    depth: {
      type: Number,
      required: true,
    },
    predicted_magnitude: {
      type: Number,
      required: true,
    },
    risk_level: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PredictionResult', predictionResultSchema);