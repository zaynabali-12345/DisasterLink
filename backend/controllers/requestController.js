const asyncHandler = require('express-async-handler');
const Request = require('../models/Request.js');
const axios = require('axios');
const User = require('../models/User.js');
const sendEmail = require('../utils/sendEmail.js');

// @desc    Create a new help request
// @route   POST /api/requests
// @access  Public
const createRequest = asyncHandler(async (req, res) => {
  const { name, email, contact, location, description, people, priority, requestType, latitude, longitude } = req.body;
  
  // --- NEW: Reverse geocode coordinates to get a reliable location name ---
  let locationName = location; // Default to user-provided text

  if (latitude && longitude) {
    try {
      const { data } = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'DisasterLinkApp/1.0' } } // Nominatim requires a User-Agent
      );
      if (data && data.display_name) {
        locationName = data.display_name;
      }
    } catch (error) {
      console.error('Reverse geocoding failed, using fallback location text.', error.message);
      // If geocoding fails, we'll stick with the text sent from the frontend.
    }
  }

  const io = require('../socket').getIO(); // Get the io instance here

  // Handle file uploads from multer
  const currentPhotoPath = req.files?.currentPhoto
    ? req.files.currentPhoto[0].path
    : null;
  
  // --- FIX: Use the geocoded location name ---
  // The location field in the database will now store the human-readable address.
  // The original coordinate string from the frontend is still available in `location` if needed,
  // but `locationName` is more reliable.

  const request = new Request({
    requestType: requestType || 'Help', // Set the type, defaulting to 'Help'
    name,
    email,
    contact,
    location: locationName, // Use the geocoded or fallback location name
    description,
    people, // <-- Add the people value here
    priority, // <-- Add the priority value here
    status: 'Pending', // Set a default status for all new requests
    currentPhoto: currentPhotoPath,
  });

  const createdRequest = await request.save();

  // After saving, send a confirmation email if an email address was provided.
  if (createdRequest.email) {
    try {
      await sendEmail({
        to: createdRequest.email,
        subject: 'Your Help Request has been Received | DisasterLink',
        // Switched to HTML for better formatting
        html: `
          <h1 style="color: #333;">Request Confirmation</h1>
          <p>Dear ${createdRequest.name},</p>
          <p>Thank you for reaching out to DisasterLink. Your help request has been successfully submitted and is now pending review.</p>
          <p><strong>Your Request ID is:</strong> ${createdRequest._id}</p>
          <p>Please save this ID to track the status of your request on our website.</p>
          <hr>
          <h3>Request Summary:</h3>
          <ul>
            <li><strong>Location:</strong> ${createdRequest.location}</li>
            <li><strong>People Affected:</strong> ${createdRequest.people}</li>
            <li><strong>Priority:</strong> ${createdRequest.priority}</li>
          </ul>
          <p>Our team is reviewing your request and help will be on its way shortly. Please stay safe.</p>
          <p>Best regards,<br>The DisasterLink Team</p>
        `,
      });
      console.log(`Confirmation email sent to ${createdRequest.email}`);
    } catch (error) {
      // IMPORTANT: Log the error, but don't fail the entire operation.
      // The request was saved, which is the most critical part.
      console.error('Error sending confirmation email:', error);
    }
  }

  // Emit an event to all connected clients
  io.emit('new_request', { message: 'A new help request has been submitted!' });

  res.status(201).json({
    message: 'Request submitted successfully',
    requestId: createdRequest._id,
  });
});

// This function was in your routes, so we'll define it here as well.
const getRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({}).sort({ createdAt: -1 });
  res.json(requests);
});

// @desc    Get a single help request by ID
// @route   GET /api/requests/:id
// @access  Public (for now)
const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id).populate(
    'assignedVolunteer managedBy',
    'name email currentLocation'
  );

  if (request) {
    res.json(request);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

// @desc    Update a request's status
// @route   PUT /api/requests/:id/status
// @access  Public (for now, should be protected for volunteers/NGOs)
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const updateData = { status };

  // If the task is being marked as completed, save the notes.
  if (status === 'Completed' && notes) {
    updateData.completionNotes = notes;
  }

  // Use findByIdAndUpdate to directly update the document in the DB.
  // This is more efficient and avoids running full validation on fields
  // that we are not changing, which was the source of the error.
  const updatedRequest = await Request.findByIdAndUpdate(
    req.params.id,
    updateData,
    // { new: true } returns the updated document after the update is applied.
    { new: true }
  );

  if (updatedRequest) {
    // Emit an event to notify clients of the status change
    const io = require('../socket').getIO();
    io.emit('request_updated', updatedRequest);

    res.json(updatedRequest);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

// @desc    Log an assistance request for a task
// @route   POST /api/requests/:id/assistance
// @access  Private/Volunteer
const requestAssistance = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  if (!notes || notes.trim() === '') {
    res.status(400);
    throw new Error('Assistance notes are required.');
  }

  // Use findByIdAndUpdate for an atomic operation. This is more efficient
  // and avoids re-validating the entire document, which was causing the error.
  const updatedRequest = await Request.findByIdAndUpdate(
    req.params.id,
    {
      $set: { status: 'Needs Assistance' },
      $push: {
        assistanceLog: {
          notes: notes,
          date: new Date(),
          // requestedBy will be added later with auth
        },
      },
    },
    { new: true, runValidators: true } // Return the updated document and run validators on the update
  );

  if (updatedRequest) {
    // Notify admins/NGOs via WebSocket
    const io = require('../socket').getIO();
    io.emit('assistance_requested', updatedRequest);

    res.status(200).json(updatedRequest);
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

/**
 * @desc    Assign a request to a volunteer
 * @route   PUT /api/requests/:id/assign
 * @access  Private (Emergency, NGO)
 */
const assignRequestToVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId } = req.body;

  if (!volunteerId) {
    res.status(400);
    throw new Error('Volunteer ID is required');
  }

  const request = await Request.findById(req.params.id);
  const volunteer = await User.findById(volunteerId);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (!volunteer || volunteer.role.toLowerCase() !== 'volunteer') {
    res.status(404);
    throw new Error('Volunteer not found or user is not a volunteer');
  }

  request.assignedVolunteer = volunteerId;
  request.status = 'Assigned';

  const updatedRequest = await request.save();

  // Emit a WebSocket event to notify relevant dashboards
  const io = require('../socket').getIO();
  if (io) {
    io.emit('request_updated', {
      message: `Request ${request._id} has been assigned.`,
      requestId: request._id,
    });
  }

  res.json(updatedRequest);
});

// @desc    Get data for requests report
// @route   GET /api/requests/report
// @access  Private/Admin
const getRequestsReport = asyncHandler(async (req, res) => {
  try {
    const requestsByStatus = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    const totalRequests = await Request.countDocuments();

    res.json({
      totalRequests,
      requestsByStatus,
    });
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
});

// @desc    Get request counts for the last 7 days
// @route   GET /api/requests/stats/last7days
// @access  Private/Admin
const getLast7DaysStats = asyncHandler(async (req, res) => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0); // Set to the beginning of the day
    last7Days.push(d);
  }

  const stats = await Promise.all(
    last7Days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const count = await Request.countDocuments({
        createdAt: {
          $gte: day,
          $lt: nextDay,
        },
      });

      return {
        date: day.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
        requests: count,
      };
    })
  );

  res.json(stats);
});

module.exports = { createRequest, getRequests, getRequestById, updateRequestStatus, requestAssistance, assignRequestToVolunteer, getRequestsReport, getLast7DaysStats };
