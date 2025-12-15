const express = require('express');
const {
  registerUser,
  createUserByAdmin,
  authUser,
  getAllUsers,
  toggleUserBlockStatus,
  updateVolunteerLocation,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public registration for new users (e.g., from a signup page)
router.post('/register', registerUser);

// Admin-only route to create a new user from the dashboard
router.route('/').post(protect, admin, createUserByAdmin);

router.post('/login', authUser); // For NGOs and Volunteers to log in
router.get('/all', protect, admin, getAllUsers); // New route for admins to get all users

// Route for an admin to block/unblock a user
router.route('/:id/toggle-block').put(protect, admin, toggleUserBlockStatus);

router.patch('/:id/location', protect, updateVolunteerLocation);

module.exports = router;
