const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/donationController.js');
const router = express.Router();

router.route('/order').post(createOrder);
router.route('/verify').post(verifyPayment);

module.exports = router;
