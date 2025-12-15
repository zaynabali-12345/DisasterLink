const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');

// Importing models for the emergency overview
const Request = require('../models/Request.js');
const User = require('../models/User.js');
const Resource = require('../models/resourceModel');
const MedicalCenter = require('../models/medicalCenterModel');
const Ambulance = require('../models/ambulanceModel');

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

// @route   GET /api/dashboard/emergency-overview
// @desc    Get all data for the emergency control dashboard
// @access  Private
router.get('/emergency-overview', protect, async (req, res) => {
  try {
    // Fetch data from the database in parallel for efficiency
    const [
      totalSOS,
      activeVolunteers,
      peopleHelped,
      latestRequests,
      latestUrgentRequests, // Changed from findOne to find
      availableResources,
      medicalCenters,
      activeAmbulances,
      activeVolunteersWithLocation,
    ] = await Promise.all([
      Request.countDocuments({ status: { $in: ['Pending', 'Assigned', 'InProgress'] } }),
      User.countDocuments({ role: 'Volunteer', isActive: true }),
      Request.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$people' } } },
      ]),
      Request.find({
        requestType: { $in: ['Help', undefined] }, // Show new 'Help' requests and old requests without a type
        status: { $in: ['Pending', 'Assigned', 'InProgress'] }
      }).sort({ createdAt: -1 }).limit(10), // Increased limit for the list
      Request.find({ priority: { $in: ['Critical', 'High'] }, status: 'Pending' }).sort({ createdAt: -1 }).limit(5),
      Resource.find({}),
      MedicalCenter.find({}),
      Ambulance.find({ status: 'Dispatched' }),
      User.find({ role: 'Volunteer', isActive: true, 'location.top': { $exists: true } }).limit(50),
    ]);

    // Format the data for the frontend
    const dashboardData = {
      stats: {
        totalSOS: totalSOS,
        peopleHelped: peopleHelped.length > 0 ? peopleHelped[0].total : 0,
        activeVolunteers: activeVolunteers,
        avgResponseTime: '18 mins', // This is complex; keep as static for now
      },
      helpRequests: latestRequests.map(request => ({
        id: request._id,
        priority: request.priority,
        location: request.location,
        people: request.people,
        description: request.description,
        time: formatTimeAgo(request.createdAt),
        status: request.status, // Add the status field
      })),
      resources: availableResources.map(resource => {
        let color = 'green';
        if (resource.status === 'Low') color = 'yellow';
        if (resource.status === 'Empty') color = 'red';
        return {
          name: resource.name,
          status: resource.status,
          level: resource.level,
          color: color,
          sources: resource.sources,
        };
      }),
      mapMarkers: (() => {
        const markers = [];

        // Create individual markers for the most urgent help requests
        latestUrgentRequests.forEach(request => {
          markers.push({
            id: `sos_${request._id}`,
            type: 'sos',
            priority: request.priority.toLowerCase(), // 'critical', 'high', 'medium'
            // In a real app, you'd use actual coordinates. Here we generate random positions for display.
            top: `${Math.floor(Math.random() * 70) + 15}%`,
            left: `${Math.floor(Math.random() * 80) + 10}%`,
            tooltip: {
              people: request.people,
              description: request.description,
              severity: request.priority.toUpperCase(),
              time: formatTimeAgo(request.createdAt),
            },
          });
        });

        // Active volunteer markers
        activeVolunteersWithLocation.forEach(volunteer => {
          if (volunteer.location && volunteer.location.top && volunteer.location.left) {
            markers.push({
              id: `volunteer_${volunteer._id}`,
              type: 'volunteer',
              top: volunteer.location.top,
              left: volunteer.location.left,
              tooltip: {
                title: 'Active Volunteer',
                description: volunteer.name,
              },
            });
          }
        });

        // Resource center markers
        availableResources.forEach(resource => markers.push({
          id: `resource_${resource._id}`,
          type: 'resource',
          top: resource.location.top,
          left: resource.location.left,
          tooltip: {
            title: resource.name,
            description: `Status: ${resource.status} (${resource.level}%)`,
          },
        }));

        // Medical center markers
        medicalCenters.forEach(center => markers.push({
          id: `medical_${center._id}`,
          type: 'medical',
          top: center.location.top,
          left: center.location.left,
          tooltip: {
            title: 'Medical Center',
            description: center.name,
          },
        }));

        // Active ambulance markers
        activeAmbulances.forEach(ambulance => markers.push({
          id: `ambulance_${ambulance._id}`,
          type: 'ambulance',
          top: ambulance.location.top,
          left: ambulance.location.left,
          tooltip: {
            title: `Ambulance ${ambulance.vehicleId}`,
            description: `Status: ${ambulance.status}`,
          },
        }));

        return markers;
      })(),
      // Create an array of banner alerts from the most urgent pending requests
      bannerAlerts: latestUrgentRequests.map(request => ({
        text: `New ${request.priority.toUpperCase()} alert in ${request.location} - ${request.people || 1} people affected`,
        timestamp: formatTimeAgo(request.createdAt),
        type: request.priority.toLowerCase(),
      })),
    };

    res.json(dashboardData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- VOLUNTEER DASHBOARD ROUTES ---

// @desc    Get stats for the volunteer dashboard
// @route   GET /api/dashboard/volunteer/stats
// @access  Public
router.get('/volunteer/stats', async (req, res) => {
  try {
    const [
      tasksCompleted,
      peopleHelpedResult,
      activeVolunteers,
      latestCompletedTask,
      recentlyAssignedTasks,
    ] = await Promise.all([
      Request.countDocuments({ status: 'Completed' }),
      Request.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$people' } } },
      ]),
      User.countDocuments({ role: 'Volunteer', isActive: true }),
      Request.findOne({ status: 'Completed' }).sort({ updatedAt: -1 }),
      Request.find({ status: { $in: ['Assigned', 'InProgress'] } }).sort({ updatedAt: -1 }).limit(5), // Get recently assigned tasks
    ]);

    const peopleHelped = peopleHelpedResult.length > 0 ? peopleHelpedResult[0].total : 0;

    const volunteerMetrics = [
      { id: 'tasks-completed', icon: "FaTasks", color: "#3498db", value: tasksCompleted, label: "Tasks Completed", tooltip: "Total tasks you have successfully completed." },
      { id: 'people-helped', icon: "FaHeart", color: "#e74c3c", value: peopleHelped, label: "People Helped", tooltip: "Total number of people assisted through your completed tasks." },
      { id: 'hours-volunteered', icon: "FaClock", color: "#f1c40f", value: 0, label: "Hours Volunteered", tooltip: "Total hours logged. (Feature coming soon)" },
      { id: 'active-volunteers', icon: "FaUser", color: "#2ecc71", value: activeVolunteers, label: "Active Volunteers", tooltip: "Number of volunteers currently active on the platform." },
    ];

    const latestActivity = latestCompletedTask ? {
      text: `Task "${latestCompletedTask.description.substring(0, 30)}..." marked as completed.`,
      timestamp: formatTimeAgo(latestCompletedTask.updatedAt),
    } : null;

    // Create an array of banner alerts from recently assigned tasks
    const bannerAlerts = recentlyAssignedTasks.map(task => ({
      text: `NEW TASK ASSIGNED: ${task.description.substring(0, 40)}...`,
      location: task.location,
      time: formatTimeAgo(task.updatedAt), // Use updatedAt for assignment time
      type: task.priority.toLowerCase(), // 'critical', 'high', 'medium'
    }));

    res.json({ metrics: volunteerMetrics, latestActivity, bannerAlerts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get available tasks for volunteers
// @route   GET /api/dashboard/volunteer/tasks
// @access  Public
router.get('/volunteer/tasks', async (req, res) => {
  try {
    const availableRequests = await Request.find({
      status: 'Pending',
      requestType: { $in: ['Help', undefined] } // Only show 'Help' requests (and old untyped ones) to volunteers
    }).sort({ priority: 1, createdAt: -1 });

    const volunteerTasks = availableRequests.map(request => ({
      id: request._id,
      title: request.description.substring(0, 50) + (request.description.length > 50 ? '...' : ''), // Use description as title
      severity: request.priority.toLowerCase(),
      time: formatTimeAgo(request.createdAt), // Using time ago instead of duration
      location: request.location,
      helped: request.people,
      description: request.description,
    }));

    res.json(volunteerTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get map markers for the volunteer dashboard
// @route   GET /api/dashboard/volunteer/map-markers
// @access  Public
router.get('/volunteer/map-markers', async (req, res) => {
  try {
    const [pendingRequests, activeVolunteers] = await Promise.all([
      Request.find({ status: 'Pending' }),
      User.find({ role: 'Volunteer', isActive: true, 'location.top': { $exists: true } })
    ]);

    const markers = [];

    // Create markers for pending requests by priority
    const priorities = ['critical', 'high', 'medium'];
    const locations = [['30%', '40%'], ['60%', '55%'], ['50%', '70%']]; // Static locations for clusters

    priorities.forEach((p, i) => {
      const requests = pendingRequests.filter(r => r.priority.toLowerCase() === p);
      if (requests.length > 0) {
        const totalPeople = requests.reduce((sum, req) => sum + (req.people || 1), 0);
        const latestRequest = requests[0]; // Assumes requests are sorted by date
        markers.push({
          id: `m_req_${p}`,
          type: p,
          count: totalPeople,
          top: locations[i][0],
          left: locations[i][1],
          tooltip: {
            title: `${totalPeople} people affected`,
            subtitle: `Latest: ${latestRequest.description.substring(0, 40)}...`,
            severity: latestRequest.priority.toUpperCase(),
            time: formatTimeAgo(latestRequest.createdAt),
          },
        });
      }
    });

    // Create markers for active volunteers
    activeVolunteers.forEach(v => markers.push({ id: `m_vol_${v._id}`, type: 'volunteer', count: 1, top: v.location.top, left: v.location.left }));

    res.json(markers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get tasks assigned to volunteers
// @route   GET /api/dashboard/volunteer/assigned-tasks
// @access  Public
router.get('/volunteer/assigned-tasks', async (req, res) => {
  try {
    // In a real app with logins, you would filter by assignedTo: req.user._id
    const assignedRequests = await Request.find({
      status: { $in: ['Assigned', 'InProgress'] },
      requestType: { $in: ['Help', undefined] } // Ensure only 'Help' requests appear here
    }).sort({ updatedAt: -1 });

    const assignedTasks = assignedRequests.map(request => ({
      id: request._id,
      title: request.description.substring(0, 50) + (request.description.length > 50 ? '...' : ''),
      severity: request.priority.toLowerCase(),
      status: request.status,
      location: request.location,
    }));

    res.json(assignedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get all available volunteers
// @route   GET /api/dashboard/volunteers
// @access  Private
router.get('/volunteers', protect, async (req, res) => {
  try {
    // Find all users with the role 'Volunteer' and exclude their password
    // Using a case-insensitive regex to match 'Volunteer', 'volunteer', etc.
    const volunteers = await User.find({ role: /^volunteer$/i }).select('-password');
    res.json(volunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
