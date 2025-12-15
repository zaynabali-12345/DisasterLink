const express = require('express');
const {
  sendContactEmail,
  getContactQueries,
  updateQueryStatus,
  replyToQuery,
} = require('../controllers/contactController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.route('/send').post(sendContactEmail);
router.route('/queries').get(protect, admin, getContactQueries);
router.route('/queries/:id').put(protect, admin, updateQueryStatus);
router.route('/queries/:id/reply').post(protect, admin, replyToQuery);

module.exports = router;