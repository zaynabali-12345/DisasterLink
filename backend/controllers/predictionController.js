const axios = require('axios');
const PredictionResult = require('../models/predictionResultModel.js');
const sendTelegramNotification = require('../utils/sendTelegramNotification.js');

// @desc    Get earthquake prediction from the ML model
// @route   POST /api/predict/earthquake
// @access  Public (or Private if you add auth middleware)
const predictEarthquake = async (req, res) => {
  try {
    // 1. Get the input data from the frontend request
    const { city, depth } = req.body;

    // Basic validation
    if (!city || depth === undefined) {
      return res.status(400).json({ message: 'Please provide both city and depth.' });
    }
    if (isNaN(parseFloat(depth)) || parseFloat(depth) <= 0) {
      return res.status(400).json({ message: 'Depth must be a positive number.' });
    }

    // 2. Fetch coordinates from OpenStreetMap (Nominatim)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      city
    )}&format=json&limit=1`;

    const geoResponse = await axios.get(nominatimUrl, {
      headers: { 'User-Agent': 'DisasterLink/1.0' }, // Nominatim API requires a User-Agent header
    });

    if (!geoResponse.data || geoResponse.data.length === 0) {
      return res.status(404).json({ message: `Could not find coordinates for city: ${city}` });
    }

    // 3. Forward the data to your FastAPI microservice
    const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000/predict';

    // Construct the payload to exactly match the FastAPI schema.
    const payload = {
      city: city,
      depth: parseFloat(depth)
    };

    const response = await axios.post(fastApiUrl, payload, {
      // FIX: Increased timeout to 90 seconds to give the ML model more time to respond.
      // The previous 30-second timeout was being exceeded.
      timeout: 90000, // 90 seconds in milliseconds
    });

    // 4. Save the prediction result to the database
    const predictionData = response.data;

    // --- FIX: Calculate risk_level based on magnitude ---
    let riskLevel = 'Low';
    const magnitude = predictionData.predicted_magnitude;
    if (magnitude >= 7) {
      riskLevel = 'Severe';
    } else if (magnitude >= 6) {
      riskLevel = 'High';
    } else if (magnitude >= 4.5) {
      riskLevel = 'Moderate';
    }

    await PredictionResult.create({
      city: city,
      depth: parseFloat(depth),
      predicted_magnitude: predictionData.predicted_magnitude,
      risk_level: riskLevel, // Use the calculated risk level
    });

    // --- NEW: Send Telegram notification for significant predictions ---
    if (riskLevel === 'Moderate' || riskLevel === 'High' || riskLevel === 'Severe') {
      const notificationMessage =
        `*🚨 Earthquake Risk Alert 🚨*\n\n` +
        `*City:* ${city}\n` +
        `*Predicted Magnitude:* ${magnitude.toFixed(2)}\n` +
        `*Risk Level:* ${riskLevel}\n\n` +
        `Please monitor the situation and advise relevant authorities.`;

      // Send notification in the background (no need to await)
      sendTelegramNotification(notificationMessage);
    }

    // 5. Send the prediction result back to the frontend
    res.status(200).json({ ...predictionData, risk_level: riskLevel });
    
  } catch (error) {
    console.error('Error calling prediction API:', error.message);
    // Check if the error is from the FastAPI service
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Error from prediction service.',
        details: error.response.data,
      });
    } else if (error.code === 'ECONNABORTED') {
      // This specifically handles the timeout error
      return res.status(504).json({
        message: 'The prediction service took too long to respond. Please try again.',
      });
    } else {
      res.status(500).json({ message: 'Server error while getting prediction.' });
    }
  }
};

module.exports = { predictEarthquake };
