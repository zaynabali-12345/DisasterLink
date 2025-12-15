const HelpRequest = require('../models/Request.js');
const User = require('../models/User.js');
const NgoResource = require('../models/ngoResourceModel.js');
const PredictionResult = require('../models/predictionResultModel.js');

// @desc    Get all analytics data for the admin dashboard
// @route   GET /api/analytics/all
// @access  Private/Admin
const getAllAnalytics = async (req, res) => {
  try {
    // --- NGO Insights ---
    // 1. Requests Fulfilled by Each NGO
    const fulfilledByNgo = await HelpRequest.aggregate([
      { $match: { status: 'Completed', managedBy: { $exists: true } } },
      { $lookup: { from: 'users', localField: 'managedBy', foreignField: '_id', as: 'ngo' } },
      { $unwind: '$ngo' },
      { $group: { _id: '$ngo.name', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]);

    // 2. Average Fulfillment Time by NGO (Example in hours)
    const fulfillmentTimes = await HelpRequest.aggregate([
        { $match: { status: 'Completed', createdAt: { $exists: true }, updatedAt: { $exists: true } } },
        { $lookup: { from: 'users', localField: 'managedBy', foreignField: '_id', as: 'ngo' } },
        { $unwind: '$ngo' },
        { $group: { 
            _id: '$ngo.name', 
            avgTime: { $avg: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 3600000] } } // in hours
        }},
        { $project: { name: '$_id', avgTime: 1, _id: 0 } },
    ]);

    // --- Volunteer Insights ---
    // 1. Active Volunteers per Region (mocked for now, as region isn't in User model)
    const activeByRegion = {
      labels: ['North', 'South', 'East', 'West', 'Central'],
      data: [
        await User.countDocuments({ role: 'Volunteer' }), // Example distribution
        await User.countDocuments({ role: 'Volunteer' }) / 2,
        await User.countDocuments({ role: 'Volunteer' }) * 1.2,
        await User.countDocuments({ role: 'Volunteer' }) / 3,
        await User.countDocuments({ role: 'Volunteer' }) * 1.5,
      ].map(Math.round),
    };

    // 3. ML Predictions by Risk Level - Formatted as a key-value object
    const mlPredictions = await PredictionResult.aggregate([
      { $group: { _id: '$risk_level', count: { $sum: 1 } } },
      { $group: { _id: null, data: { $push: { k: '$_id', v: '$count' } } } },
      { $replaceRoot: { newRoot: { $arrayToObject: '$data' } } }
    ]);
    // The above pipeline transforms [{_id: 'High', count: 5}] into { High: 5 }

    // 2. Volunteer Sign-ups Over Time
    const signupsOverTime = await User.aggregate([
      { $match: { role: 'Volunteer' } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Formatting data for Chart.js
    const analyticsData = {
      ngoInsights: {
        labels: fulfilledByNgo.map(item => item.name),
        datasets: [{
          label: 'Requests Fulfilled',
          data: fulfilledByNgo.map(item => item.count),
          backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)'],
          borderWidth: 1,
        }],
      },
      fulfillmentTime: {
        labels: fulfillmentTimes.map(item => item.name),
        datasets: [{
          label: 'Average Time (hours)',
          data: fulfillmentTimes.map(item => item.avgTime.toFixed(2)),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }],
      },
      volunteerInsights: {
        activeByRegion: {
          labels: activeByRegion.labels,
          datasets: [{
            label: 'Active Volunteers',
            data: activeByRegion.data,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
          }],
        },
        signupsOverTime: {
          labels: signupsOverTime.map(item => item._id),
          datasets: [{
            label: 'New Sign-ups',
            data: signupsOverTime.map(item => item.count),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4,
          }],
        },
      },
      mlPredictions: mlPredictions[0] || {}, // Pass the object directly, or an empty object if no predictions exist
    };

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

module.exports = { getAllAnalytics };