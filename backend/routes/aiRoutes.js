const express = require('express');
const router = express.Router();
const {
  predictDepartment,
  checkDuplicate,
  calculateDistance,
  getClusters
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/predict-department', predictDepartment);
router.post('/check-duplicate', checkDuplicate);
router.post('/distance', calculateDistance);
router.get('/clusters', protect, authorize('staff', 'admin'), getClusters);

module.exports = router;
