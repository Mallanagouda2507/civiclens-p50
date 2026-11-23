/**
 * Duplicate Complaint Clustering Engine for CivicLens
 * Combines spatial proximity (Haversine formula <= 75m) and
 * semantic text similarity (TF-IDF Cosine + Jaccard >= 0.65).
 */

const { calculateHaversineDistance } = require('./geoSpatialService');
const {
  calculateHybridSimilarity,
  extractCommonKeywords
} = require('./textSimilarityService');
const { dataStore } = require('../dataStore');

const DEFAULT_DISTANCE_THRESHOLD_METERS = Number(process.env.DISTANCE_THRESHOLD_METERS) || 75;
const DEFAULT_SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD) || 0.60;

/**
 * Checks whether an incoming complaint is a duplicate of any existing active complaint.
 * @param {Object} params
 * @param {[number, number]} params.coordinates [longitude, latitude]
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.excludeId] ID to exclude (when updating)
 * @param {number} [params.distanceThreshold] default 75m
 * @param {number} [params.similarityThreshold] default 0.65
 * @returns {Promise<{
 *   isDuplicate: boolean,
 *   masterComplaint: Object | null,
 *   similarityScore: number,
 *   distanceMeters: number | null,
 *   matchedKeywords: string[],
 *   reason: string,
 *   nearbyCandidatesCount: number
 * }>}
 */
const detectDuplicate = async ({
  coordinates,
  title,
  description,
  excludeId = null,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD_METERS,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD
}) => {
  if (!coordinates || coordinates.length < 2) {
    return {
      isDuplicate: false,
      masterComplaint: null,
      similarityScore: 0.0,
      distanceMeters: null,
      matchedKeywords: [],
      reason: 'No geographic coordinates provided for spatial clustering',
      nearbyCandidatesCount: 0
    };
  }

  // Find all active complaints within spatial threshold radius
  const nearbyComplaints = await dataStore.findNearbyComplaints({
    coordinates,
    maxDistanceMeters: distanceThreshold * 2, // Check up to 150m for contextual awareness
    excludeId,
    activeOnly: true
  });

  if (nearbyComplaints.length === 0) {
    return {
      isDuplicate: false,
      masterComplaint: null,
      similarityScore: 0.0,
      distanceMeters: null,
      matchedKeywords: [],
      reason: 'No active complaints found within geographic vicinity',
      nearbyCandidatesCount: 0
    };
  }

  const incomingFullText = `${title} ${description}`;

  let bestMatch = null;
  let highestSimilarity = 0.0;
  let matchedDistance = null;
  let matchedKeywords = [];

  for (const candidate of nearbyComplaints) {
    const candidateFullText = `${candidate.title} ${candidate.description}`;
    const distance = calculateHaversineDistance(coordinates, candidate.location.coordinates);

    // Only cluster if candidate is within distanceThreshold
    if (distance <= distanceThreshold) {
      const similarity = calculateHybridSimilarity(incomingFullText, candidateFullText);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = candidate;
        matchedDistance = distance;
        matchedKeywords = extractCommonKeywords(incomingFullText, candidateFullText);
      }
    }
  }

  const isDuplicate = highestSimilarity >= similarityThreshold && bestMatch !== null;

  let masterComplaint = null;
  if (isDuplicate) {
    // If candidate is already a child duplicate, link to root master complaint
    if (bestMatch.isDuplicate && bestMatch.masterComplaintId) {
      const rootMaster = await dataStore.findComplaintById(bestMatch.masterComplaintId);
      masterComplaint = rootMaster || bestMatch;
    } else {
      masterComplaint = bestMatch;
    }
  }

  return {
    isDuplicate,
    masterComplaint,
    similarityScore: highestSimilarity,
    distanceMeters: matchedDistance,
    matchedKeywords,
    reason: isDuplicate
      ? `Duplicate identified: ${Math.round(highestSimilarity * 100)}% textual similarity and ${matchedDistance}m spatial distance`
      : 'Complaint meets uniqueness criteria for independent ticketing',
    nearbyCandidatesCount: nearbyComplaints.length
  };
};

module.exports = {
  DEFAULT_DISTANCE_THRESHOLD_METERS,
  DEFAULT_SIMILARITY_THRESHOLD,
  detectDuplicate
};
