const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    },
    trackingId: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true // 'STATUS_CHANGE', 'DEPARTMENT_REASSIGNED', 'DUPLICATE_CLUSTERED', 'STAFF_ASSIGNED'
    },
    previousValue: {
      type: String,
      default: ''
    },
    newValue: {
      type: String,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'System'
    },
    performedByRole: {
      type: String,
      default: 'system'
    },
    notes: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
