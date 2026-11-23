/**
 * Geospatial Service for CivicLens
 * Handles Haversine distance computations, coordinate validations, and spatial bounding boxes.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Validates whether latitude and longitude are within standard geographical boundaries.
 * @param {number} latitude [-90 to 90]
 * @param {number} longitude [-180 to 180]
 * @returns {boolean}
 */
const isValidCoordinates = (longitude, latitude) => {
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return false;
  if (isNaN(longitude) || isNaN(latitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
};

/**
 * Computes geodesic distance between two [lng, lat] coordinate points using Haversine formula.
 * @param {[number, number]} pointA [longitude, latitude]
 * @param {[number, number]} pointB [longitude, latitude]
 * @returns {number} distance in meters rounded to 2 decimal places
 */
const calculateHaversineDistance = (pointA, pointB) => {
  if (!pointA || !pointB || pointA.length < 2 || pointB.length < 2) {
    throw new Error('Invalid coordinate points provided to Haversine calculation');
  }

  const [lon1, lat1] = pointA;
  const [lon2, lat2] = pointB;

  if (!isValidCoordinates(lon1, lat1) || !isValidCoordinates(lon2, lat2)) {
    throw new Error('Coordinates out of range for Haversine computation');
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return Math.round(distanceMeters * 100) / 100;
};

/**
 * Determines if two geographic points are within a specified distance threshold.
 * @param {[number, number]} pointA [lng, lat]
 * @param {[number, number]} pointB [lng, lat]
 * @param {number} thresholdMeters default 75m
 * @returns {{ isWithinRadius: boolean, distanceMeters: number }}
 */
const isWithinProximity = (pointA, pointB, thresholdMeters = 75) => {
  const distanceMeters = calculateHaversineDistance(pointA, pointB);
  return {
    isWithinRadius: distanceMeters <= thresholdMeters,
    distanceMeters
  };
};

module.exports = {
  EARTH_RADIUS_METERS,
  isValidCoordinates,
  calculateHaversineDistance,
  isWithinProximity
};
