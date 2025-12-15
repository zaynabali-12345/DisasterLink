const mongoose = require('mongoose');

const requestSchema = mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ['Help', 'Resource'], // Defines the possible types of requests
      default: 'Help', // Defaults to a standard 'Help' request
      required: true,
    },
    name: {
      type: String,
      required: function () { return this.requestType === 'Help'; },
    },
    email: {
      type: String,
      // We'll make email required for help requests to ensure we can send a confirmation.
      required: function () { return this.requestType === 'Help'; },
    },
    contact: {
      type: String,
      required: function () { return this.requestType === 'Help'; },
    },
    location: { type: String, required: true },
    description: { type: String, required: true },
    citizenshipPhoto: { type: String }, // Path to the uploaded image
    currentPhoto: { type: String }, // Path to the uploaded image
    people: {
      type: Number,
      required: true,
      default: 1,
    },
    priority: {
      type: String,
      required: true,
      enum: ['Critical', 'High', 'Medium'],
      default: 'Medium',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled', 'Needs Assistance'],
      default: 'Pending',
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    }, // Volunteer ID
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NGO ID
    completionNotes: { type: String }, // Optional notes from volunteer on completion
    // To log assistance requests from volunteers
    assistanceLog: [
      {
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
