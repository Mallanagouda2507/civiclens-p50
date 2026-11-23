const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getMapComplaints,
  getComplaintByTrackingId,
  getComplaintById,
  updateComplaintStatus,
  assignStaff
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public & Citizen Endpoints
router.post('/', (req, res, next) => {
  // Optional auth: if token is present, decode it, otherwise proceed as guest
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
}, createComplaint);

router.get('/', (req, res, next) => {
  // Optional auth for filtering my complaints
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
}, getComplaints);

router.get('/map', getMapComplaints);
router.get('/track/:trackingId', getComplaintByTrackingId);
router.get('/:id', getComplaintById);

// Staff / Administrative Endpoints
router.put('/:id/status', protect, authorize('staff', 'admin'), updateComplaintStatus);
router.put('/:id/assign', protect, authorize('staff', 'admin'), assignStaff);

module.exports = router;
