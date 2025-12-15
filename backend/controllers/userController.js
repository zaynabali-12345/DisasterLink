const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail.js');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (NGO or Volunteer)
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const authUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Check if user exists and compare passwords
  if (user && (await user.matchPassword(password))) {
    // 3. Check if the user is active before granting access
    if (!user.isActive) {
      res.status(403); // 403 Forbidden is more appropriate for a disabled account
      throw new Error('Your account has been disabled. Please contact an administrator.');
    }

    // If active, send back user data and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get all users
// @route   GET /api/users/all
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// @desc    Create a new user by an Admin
// @route   POST /api/users
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
  const { name, email, password, role, personalEmail, sendEmail: shouldSendEmail } = req.body;

  if (!name || !email || !role) {
    res.status(400);
    throw new Error('Please provide name, email, and role.');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  // If password is not provided by admin, auto-generate a simple one.
  // In a real-world app, you'd generate a more secure random password.
  const finalPassword = password || `password_${Math.random().toString(36).slice(-8)}`;

  const user = await User.create({ name, email, password: finalPassword, role, personalEmail, isApproved: true, isActive: true });

  if (user) {
    // If the admin checked the "send credentials" box
    if (shouldSendEmail && personalEmail) {
      try {
        const message = `Hello ${name},\n\nAn account has been created for you on DisasterLink.\n\nHere are your login credentials:\nEmail: ${email}\nPassword: ${finalPassword}\n\nPlease log in and change your password at your earliest convenience.\n\nBest regards,\nThe DisasterLink Team`;

        await sendEmail({
          email: personalEmail,
          subject: 'Your DisasterLink Account Credentials',
          message,
        });

        console.log(`Credentials sent to ${personalEmail}`);
      } catch (error) {
        console.error('Email sending failed:', error);
        // Don't block the user creation, but maybe log this for the admin
        // For now, we'll just log it on the server.
      }
    }

    // Respond with the created user object
    res.status(201).json(user);
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};



// @desc    Block or unblock a user
// @route   PUT /api/users/:id/toggle-block
// @access  Private/Admin
const toggleUserBlockStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Prevent admin from blocking themselves
    if (user.role === 'Admin') {
      res.status(400);
      throw new Error('Cannot block an admin account.');
    }

    // --- FIX for Validation Error ---
    // Standardize the role to match the enum (e.g., 'emergency' -> 'Emergency')
    // This prevents validation errors on save for older documents.
    if (user.role) {
      if (user.role.toLowerCase() === 'ngo') {
        user.role = 'NGO';
      } else {
        user.role = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      }
    }

    // The user model has 'isActive', not 'isBlocked'.
    // We'll toggle the 'isActive' status.
    // isBlocked: true on the frontend means isActive should be false.
    user.isActive = !req.body.isBlocked;
    const updatedUser = await user.save();
    res.json(updatedUser); // Send back the full updated user object
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update volunteer's location
// @route   PATCH /api/users/:id/location
// @access  Private/Volunteer
const updateVolunteerLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  const user = await User.findById(req.params.id);

  if (user) {
    user.currentLocation = {
      lat,
      lng,
      lastUpdated: new Date(),
    };

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      currentLocation: updatedUser.currentLocation,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


module.exports = { registerUser, authUser, getAllUsers, createUserByAdmin, toggleUserBlockStatus, updateVolunteerLocation };
