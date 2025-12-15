const express = require('express');
const { generateChatResponse } = require('../controllers/chatbotController.js');
const router = express.Router();

router.route('/chat').post(generateChatResponse);

module.exports = router;

