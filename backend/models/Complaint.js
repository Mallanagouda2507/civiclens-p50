const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedByName: {
      type: String,
      default: 'System'
    },
    remarks: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide complaint title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide detailed complaint description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    department: {
      type: String,
      required: true,
      enum: [
        'ROADS',
        'WATER_SUPPLY',
        'SANITATION',
        'ELECTRICITY',
        'HEALTH_SAFETY',
        'PARKS',
        'GENERAL'
      ],
      default: 'GENERAL',
      index: true
    },
    predictedDepartment: {
      type: String,
      default: 'GENERAL'
    },
    classificationConfidence: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 1.0
    },
    routingKeywords: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      default: 'Civic Grievance'
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      type: String,
      required: [true, 'Address or locality is required'],
      trim: true
    },
    landmark: {
      type: String,
      default: ''
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    citizenName: {
      type: String,
      default: 'Anonymous Citizen'
    },
    citizenEmail: {
      type: String,
      default: ''
    },
    citizenPhone: {
      type: String,
      default: ''
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedStaffName: {
      type: String,
      default: 'Unassigned'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true
    },
    masterComplaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    masterTrackingId: {
      type: String,
      default: null
    },
    duplicateCount: {
      type: Number,
      default: 0
    },
    clusteredComplaintIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
      }
    ],
    similarityScore: {
      type: Number,
      default: 0.0
    },
    distanceMeters: {
      type: Number,
      default: null
    },
    auditTrail: [auditEntrySchema],
    resolutionNotes: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for geospatial proximity queries
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
