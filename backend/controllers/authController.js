const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dataStore } = require('../services/dataStore');

// Helper to sign JWT token
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    },
    process.env.JWT_SECRET || 'civiclens_jwt_super_secret_key_academic_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

// @desc    Register a new user (Citizen or Staff)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await dataStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Restrict staff and admin registration in self-serve mode
    const assignedRole = role === 'staff' ? 'staff' : 'citizen';
    const assignedDept =
      assignedRole === 'staff' ? department || 'GENERAL' : 'GENERAL';

    const user = await dataStore.createUser({
      name,
      email,
      password,
      role: assignedRole,
      department: assignedDept,
      phone: phone || ''
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await dataStore.findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await dataStore.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.'
    });
  }
};

// @desc    List municipal staff (for task assignment)
// @route   GET /api/auth/staff
// @access  Private (Staff / Admin)
const listStaff = async (req, res) => {
  try {
    const staff = await dataStore.listUsers({ role: 'staff' });
    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error listing municipal staff.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  listStaff
};
