const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, required: true },
    level: { type: Number, required: true },
    sources: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

module.exports = Resource;
