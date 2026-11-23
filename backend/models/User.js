const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['citizen', 'staff', 'admin'],
      default: 'citizen'
    },
    department: {
      type: String,
      enum: [
        'ROADS',
        'WATER_SUPPLY',
        'SANITATION',
        'ELECTRICITY',
        'HEALTH_SAFETY',
        'PARKS',
        'GENERAL',
        'ALL'
      ],
      default: 'GENERAL'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Hash password prior to saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT signed token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      department: this.department
    },
    process.env.JWT_SECRET || 'civiclens_jwt_super_secret_key_academic_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

module.exports = mongoose.model('User', userSchema);
