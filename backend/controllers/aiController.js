const {
  classifyDepartment,
  DEPARTMENT_TAXONOMY
} = require('../services/ai/departmentClassifierService');
const {
  detectDuplicate,
  DEFAULT_DISTANCE_THRESHOLD_METERS,
  DEFAULT_SIMILARITY_THRESHOLD
} = require('../services/ai/duplicateDetectorService');
const {
  calculateHaversineDistance,
  isValidCoordinates
} = require('../services/ai/geoSpatialService');
const {
  calculateHybridSimilarity
} = require('../services/ai/textSimilarityService');
const { dataStore } = require('../services/dataStore');

// @desc    Predict complaint department in real-time
// @route   POST /api/ai/predict-department
// @access  Public
const predictDepartment = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!description && !title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a title or description for classification.'
      });
    }

    const prediction = classifyDepartment(title, description);

    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to classify department',
      error: error.message
    });
  }
};

// @desc    Pre-submission duplicate check
// @route   POST /api/ai/check-duplicate
// @access  Public
const checkDuplicate = async (req, res) => {
  try {
    const { coordinates, title, description, distanceThreshold, similarityThreshold } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required.'
      });
    }

    const [lon, lat] = coordinates;
    if (!isValidCoordinates(lon, lat)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are out of geographical range (-90 to 90 lat, -180 to 180 lng).'
      });
    }

    const duplicateResult = await detectDuplicate({
      coordinates,
      title: title || '',
      description: description || '',
      distanceThreshold: distanceThreshold ? Number(distanceThreshold) : DEFAULT_DISTANCE_THRESHOLD_METERS,
      similarityThreshold: similarityThreshold ? Number(similarityThreshold) : DEFAULT_SIMILARITY_THRESHOLD
    });

    res.status(200).json({
      success: true,
      result: duplicateResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform duplicate check',
      error: error.message
    });
  }
};

// @desc    Calculate distance between two coordinates
// @route   POST /api/ai/distance
// @access  Public
const calculateDistance = async (req, res) => {
  try {
    const { pointA, pointB } = req.body;

    if (!pointA || !pointB) {
      return res.status(400).json({
        success: false,
        message: 'Both pointA [lng, lat] and pointB [lng, lat] are required.'
      });
    }

    const distanceMeters = calculateHaversineDistance(pointA, pointB);

    res.status(200).json({
      success: true,
      distanceMeters,
      distanceKm: Math.round((distanceMeters / 1000) * 100) / 100
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Retrieve duplicate clusters breakdown
// @route   GET /api/ai/clusters
// @access  Private (Staff / Admin)
const getClusters = async (req, res) => {
  try {
    const allComplaints = await dataStore.listComplaints();

    // Group into clusters by masterComplaintId or self if master
    const clustersMap = new Map();

    for (const c of allComplaints) {
      const clusterKey = c.isDuplicate && c.masterComplaintId
        ? c.masterComplaintId.toString()
        : c._id.toString();

      if (!clustersMap.has(clusterKey)) {
        clustersMap.set(clusterKey, {
          clusterId: clusterKey,
          masterTicket: null,
          duplicates: [],
          totalCount: 0
        });
      }

      const cluster = clustersMap.get(clusterKey);
      if (!c.isDuplicate) {
        cluster.masterTicket = c;
      } else {
        cluster.duplicates.push(c);
      }
      cluster.totalCount++;
    }

    // Only return clusters that have at least one duplicate or are masters with duplicates
    const multiTicketClusters = Array.from(clustersMap.values()).filter(
      (cl) => cl.duplicates.length > 0
    );

    res.status(200).json({
      success: true,
      totalClusters: multiTicketClusters.length,
      clusters: multiTicketClusters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve duplicate clusters',
      error: error.message
    });
  }
};

module.exports = {
  predictDepartment,
  checkDuplicate,
  calculateDistance,
  getClusters
};
