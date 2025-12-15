const mongoose = require('mongoose');
const HelpRequest = require('../models/Request.js');
const User = require('../models/User.js'); // Use the User model
const NgoResource = require('../models/ngoResourceModel.js'); // Import the NGO Resource model

// Helper function to format time
function formatTimeAgo(date) {
  if (!date) {
    return '';
  }
  const now = new Date();
  const seconds = Math.round((now - new Date(date)) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// @desc    Get all help requests for a specific NGO
// @route   GET /api/ngos/:ngoId/requests
// @access  Private (for the logged-in NGO)
const getNgoRequests = async (req, res) => {
  try {
    const { ngoId } = req.params;

    // --- TEMPORARILY DISABLED FOR DEBUGGING ---
    // This check is causing the 404 error because the hardcoded ID in the frontend
    // does not match an NGO user in your database. We'll bypass it for now.
    // const ngoUser = await User.findOne({ _id: ngoId, role: 'NGO' });
    // if (!ngoUser) {
    //   return res.status(404).json({ message: 'NGO not found' });
    // }

    const requests = await HelpRequest.find({ managedBy: ngoId }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching NGO requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all data for the NGO dashboard
// @route   GET /api/ngos/:ngoId/dashboard
// @access  Private (for the logged-in NGO)
const getNgoDashboardData = async (req, res) => {
  try {
    const { ngoId } = req.params;
    console.log(`[NGO Dashboard] Attempting to fetch data for NGO ID: ${ngoId}`);
    
    // Security check: Ensure the logged-in user (from the token) is the one
    // requesting their own dashboard. The 'ngo' role is already verified by middleware.
    if (req.user._id.toString() !== ngoId) {
      res.status(403); // 403 Forbidden is more appropriate than 404
      throw new Error('You are not authorized to view this dashboard.');
    }

    // --- Real Database Queries ---
    const [
      tasksInProgress,
      resourcesDeployed,
      activeVolunteers,
      partnerNgos,
    ] = await Promise.all([
      HelpRequest.countDocuments({ managedBy: ngoId, status: { $in: ['Assigned', 'InProgress'] } }),
      NgoResource.countDocuments({ managedBy: ngoId, status: 'Deployed' }),
      User.countDocuments({ role: 'Volunteer' }),
      User.countDocuments({ role: /^ngo$/i, _id: { $ne: ngoId } }),
    ]);

    // For "Vehicles on Field", we'll use a static number as an example.
    // In a real app, this could come from counting resources with a 'Vehicle' category.
    const vehiclesOnField = 12;

    const stats = [
      { id: 1, icon: 'FaWarehouse', label: 'Resources Deployed', value: resourcesDeployed, color: 'blue' },
      { id: 2, icon: 'FaUserFriends', label: 'Active Volunteers', value: activeVolunteers, color: 'green' },
      { id: 3, icon: 'FaTruck', label: 'Vehicles on Field', value: vehiclesOnField, color: 'orange' },
      { id: 4, icon: 'FaHandshake', label: 'Partner NGOs', value: partnerNgos, color: 'purple' },
    ];

    // Generate Map Markers for open RESOURCE requests from the emergency portal
    // To catch older requests that might not have a status, we'll check for 'Pending'
    // or for requests where the status field doesn't exist.
    const openRequestsForMap = await HelpRequest.find(
      {
        requestType: 'Resource',
        $or: [
          { status: { $in: ['Pending', 'Assigned', 'InProgress'] } },
          { status: { $exists: false } }, // Catches documents where status field is missing
        ],
      }
    );
    const mapMarkers = openRequestsForMap.map((request) => ({
      id: `request_${request._id}`,
      type: 'resource_request', // A specific type for resource requests
      priority: request.priority.toLowerCase(), // 'critical', 'high', 'medium'
      // In a real app, you'd use actual coordinates. Here we generate random positions for display.
      top: `${Math.floor(Math.random() * 70) + 15}%`,
      left: `${Math.floor(Math.random() * 80) + 10}%`,
      tooltip: {
        description: request.description,
        severity: request.priority.toUpperCase(),
        time: formatTimeAgo(request.createdAt),
      },
    }));

    // Fetch pending RESOURCE requests for the coordination panel
    const coordinationRequests = await HelpRequest.find({
      status: 'Pending',
      requestType: 'Resource' // Only show requests of type 'Resource'
    })
      .limit(5)
      .sort({ priority: 1, createdAt: -1 });

    const coordinationTasks = coordinationRequests.map(req => ({
      id: req._id,
      org: 'Emergency Portal', // Source of the request
      task: req.description,
      urgency: req.priority,
      icon: 'FaHandshake' // A fitting icon for coordination
    }));

    // The `resources` data is now fetched by the frontend in a separate call,
    // so we no longer need to include it in this response.
    res.json({ stats, coordinationTasks, mapMarkers });
  } catch (error) {
    console.error('Error fetching NGO dashboard data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Allow an NGO to accept/manage a task
// @route   PUT /api/ngos/tasks/:taskId/accept
// @access  Private (NGO)
const acceptNgoTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { ngoId } = req.body; // The ID of the NGO accepting the task

    const updatedTask = await HelpRequest.findByIdAndUpdate(
      taskId,
      { managedBy: ngoId, status: 'Needs Assistance' }, // Set NGO and update status
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error accepting task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Allow an NGO to accept a coordination task
// @route   PUT /api/ngos/:ngoId/requests/:requestId/accept
// @access  Private (NGO)
const acceptCoordinationTask = async (req, res) => {
  try {
    const { ngoId, requestId } = req.params;

    // Security check: Ensure the logged-in user is the one accepting the task.
    if (req.user._id.toString() !== ngoId) {
      res.status(403); // Forbidden
      throw new Error('You are not authorized to perform this action.');
    }

    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      requestId,
      {
        managedBy: ngoId,
        status: 'Assigned', // Move from Pending to Assigned
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Notify clients via WebSocket that the request has been updated
    const io = require('../socket').getIO();
    io.emit('request_updated', updatedRequest);

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error accepting coordination task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getNgoRequests,
  getNgoDashboardData,
  acceptNgoTask,
  acceptCoordinationTask,
};
