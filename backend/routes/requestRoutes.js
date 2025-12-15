const express = require('express');
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  requestAssistance,
  assignRequestToVolunteer,
  getLast7DaysStats,
  getRequestsReport, // Import the new controller
} = require('../controllers/requestController.js');
// Auth middleware is not used for now, but kept for future implementation
const { protect, admin, ngo, volunteer } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/uploadMiddleware.js');
const { verifyRecaptcha } = require('../middleware/recaptchaMiddleware.js');

const router = express.Router();

// Configure multer to handle the specific file fields from your form
const uploadPhotos = upload.fields([
  { name: 'currentPhoto', maxCount: 1 }, // Remove 'citizenshipPhoto'
]);

// PUBLIC route for victims to submit a request
// The uploadPhotos middleware runs first, then verifyRecaptcha, then createRequest
router.route('/').post(uploadPhotos, verifyRecaptcha, createRequest);

// PROTECTED route for internal users (e.g., from Emergency Dashboard) to create a resource request.
// This route is protected by auth, not CAPTCHA, and doesn't handle file uploads.
router.route('/resource').post(protect, createRequest);

// PROTECTED route for NGOs to see all requests
router.route('/').get(getRequests); // Made public for now

// --- IMPORTANT: Place specific routes before dynamic ones ---
// This route must come before the '/:id' route
router.route('/report').get(protect, admin, getRequestsReport);
router.route('/stats/last7days').get(protect, admin, getLast7DaysStats);

// Route to get a single request by ID
router.route('/:id').get(getRequestById);

// Route for an admin/emergency user to assign a request to a volunteer
router.route('/:id/assign').put(protect, assignRequestToVolunteer);

// Route for volunteers/NGOs to update a request's status
router.route('/:id/status').put(updateRequestStatus);

// Route for a volunteer to request assistance on a task
router.route('/:id/assistance').post(requestAssistance); // Made public for now

module.exports = router;
