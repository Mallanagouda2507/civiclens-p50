const express = require('express');
const router = express.Router();
const {
  getAnalyticsSummary,
  getSpatialHeatmap
} = require('../controllers/analyticsController');

router.get('/summary', getAnalyticsSummary);
router.get('/heatmap', getSpatialHeatmap);

module.exports = router;
