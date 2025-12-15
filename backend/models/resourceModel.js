const mongoose = require('mongoose');

const resourceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Good', 'Low', 'Empty'],
      default: 'Good',
    },
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    sources: {
      type: [String],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      top: { type: String, required: true },
      left: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;