const express = require('express');
const { predictEarthquake } = require('../controllers/predictionController.js');

const router = express.Router();

// Define the route for earthquake prediction
router.post('/earthquake', predictEarthquake);

module.exports = router;
