const {
  calculateHaversineDistance,
  isValidCoordinates,
  isWithinProximity
} = require('../services/ai/geoSpatialService');
const {
  calculateCosineSimilarity,
  calculateJaccardSimilarity,
  calculateHybridSimilarity,
  tokenizeAndClean,
  extractCommonKeywords
} = require('../services/ai/textSimilarityService');
const {
  classifyDepartment
} = require('../services/ai/departmentClassifierService');
const {
  detectDuplicate
} = require('../services/ai/duplicateDetectorService');
const { dataStore } = require('../services/dataStore');

describe('CivicLens AI Algorithmic Engine Suite (F-03, F-06, F-07)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    dataStore.clearMemoryStore();
    await dataStore.initDefaults();
  });

  // ==========================================
  // 1. GEOSPATIAL PROXIMITY & HAVERSINE TESTS
  // ==========================================
  describe('Geospatial Service (Haversine Distance & Proximity)', () => {
    it('should validate geographic coordinate bounds correctly', () => {
      expect(isValidCoordinates(77.5946, 12.9716)).toBe(true); // Bangalore [lng, lat]
      expect(isValidCoordinates(181.0, 12.0)).toBe(false); // Invalid longitude > 180
      expect(isValidCoordinates(77.0, -95.0)).toBe(false); // Invalid latitude < -90
      expect(isValidCoordinates('abc', 12.0)).toBe(false); // Non-numeric
    });

    it('should return 0 meters for identical coordinates', () => {
      const coord = [77.5946, 12.9716];
      const distance = calculateHaversineDistance(coord, coord);
      expect(distance).toBe(0);
    });

    it('should calculate accurate distance between two nearby urban points', () => {
      // MG Road Point A and nearby shop Point B (~83m apart)
      const pointA = [77.6094, 12.9716];
      const pointB = [77.6101, 12.9719];

      const distance = calculateHaversineDistance(pointA, pointB);
      expect(distance).toBeGreaterThan(60);
      expect(distance).toBeLessThan(110);
    });

    it('should accurately evaluate proximity against 75-meter threshold', () => {
      const origin = [77.5946, 12.9716];
      // Point within ~35 meters
      const closePoint = [77.5948, 12.9718];
      // Point ~250 meters away
      const farPoint = [77.5970, 12.9716];

      const closeCheck = isWithinProximity(origin, closePoint, 75);
      expect(closeCheck.isWithinRadius).toBe(true);

      const farCheck = isWithinProximity(origin, farPoint, 75);
      expect(farCheck.isWithinRadius).toBe(false);
    });
  });

  // ==========================================
  // 2. TEXT SIMILARITY & TF-IDF TESTS
  // ==========================================
  describe('Text Similarity Service (TF-IDF, Cosine, Jaccard)', () => {
    it('should tokenize, remove stop words, and normalize terms', () => {
      const tokens = tokenizeAndClean('The large potholes are severely damaging vehicles on the main road');
      expect(tokens).toContain('larg');
      expect(tokens).toContain('pothol');
      expect(tokens).toContain('damag');
      expect(tokens).toContain('vehicl');
      expect(tokens).toContain('road');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('are');
      expect(tokens).not.toContain('on');
    });

    it('should compute high similarity for semantically paraphrased civic grievances', () => {
      const text1 = 'Severe water pipeline leakage on 5th main road causing flooding';
      const text2 = 'Water pipe is leaking heavily on 5th main road, water everywhere';

      const cosine = calculateCosineSimilarity(text1, text2);
      const hybrid = calculateHybridSimilarity(text1, text2);

      expect(cosine).toBeGreaterThanOrEqual(0.60);
      expect(hybrid).toBeGreaterThanOrEqual(0.55);
    });

    it('should compute low similarity for completely unrelated civic grievances', () => {
      const text1 = 'Street light is broken and completely dark near bus stop';
      const text2 = 'Garbage dump overflowing with uncollected rotten trash';

      const cosine = calculateCosineSimilarity(text1, text2);
      expect(cosine).toBeLessThan(0.20);
    });

    it('should extract common keywords for Explainable AI (XAI)', () => {
      const text1 = 'Open pothole near church circle damaging cars';
      const text2 = 'Deep pothole at church circle causing traffic jam';

      const keywords = extractCommonKeywords(text1, text2);
      expect(keywords).toContain('pothol');
      expect(keywords).toContain('church');
      expect(keywords).toContain('circl');
    });
  });

  // ==========================================
  // 3. DEPARTMENT CLASSIFIER TESTS
  // ==========================================
  describe('Department Classifier Service (Routing & XAI)', () => {
    it('should route pothole complaints to ROADS with high confidence', () => {
      const result = classifyDepartment(
        'Dangerous crater pothole',
        'Deep pothole on the asphalt road damaging two wheelers'
      );
      expect(result.department).toBe('ROADS');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('pothol');
      expect(result.keywords).toContain('road');
    });

    it('should route sewage and garbage complaints to SANITATION', () => {
      const result = classifyDepartment(
        'Overflowing garbage bin',
        'Rotten waste and uncollected trash dumping causing terrible stench'
      );
      expect(result.department).toBe('SANITATION');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('garbag');
      expect(result.keywords).toContain('wast');
    });

    it('should route broken pipelines to WATER_SUPPLY', () => {
      const result = classifyDepartment(
        'Burst water pipeline',
        'Drinking water pipe burst, contaminated muddy tap water coming'
      );
      expect(result.department).toBe('WATER_SUPPLY');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route broken lamps to ELECTRICITY', () => {
      const result = classifyDepartment(
        'Streetlight not working',
        'Streetlight transformer sparking and dangling wires near corner'
      );
      expect(result.department).toBe('ELECTRICITY');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route mosquito breeding to HEALTH_SAFETY', () => {
      const result = classifyDepartment(
        'Mosquito breeding menace',
        'Stagnant water causing massive mosquito infestation and dengue hazard'
      );
      expect(result.department).toBe('HEALTH_SAFETY');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route playground issues to PARKS', () => {
      const result = classifyDepartment(
        'Broken swing in public park',
        'Children playground equipment and garden bench broken with fallen tree branch'
      );
      expect(result.department).toBe('PARKS');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should fall back to GENERAL for ambiguous descriptions', () => {
      const result = classifyDepartment('Notice', 'Something happened here yesterday');
      expect(result.department).toBe('GENERAL');
    });
  });

  // ==========================================
  // 4. HYBRID DUPLICATE CLUSTERING INTEGRATION
  // ==========================================
  describe('Hybrid Spatial-Textual Duplicate Detector', () => {
    let masterComplaint;

    beforeAll(async () => {
      // Seed a master complaint
      masterComplaint = await dataStore.createComplaint({
        trackingId: 'CL-2026-TEST01',
        title: 'Huge pothole in front of SBI ATM',
        description: 'Dangerous deep pothole on the asphalt right in front of SBI ATM 1st Block',
        department: 'ROADS',
        location: {
          type: 'Point',
          coordinates: [77.6000, 12.9800] // [lng, lat]
        },
        address: '1st Block, Near SBI ATM',
        status: 'SUBMITTED'
      });
    });

    it('should flag as duplicate when within 75m AND high text similarity', async () => {
      const duplicateSubmission = {
        title: 'Deep road pothole near SBI cash machine',
        description: 'Large asphalt pothole in front of SBI ATM 1st Block, cars are getting stuck',
        coordinates: [77.6002, 12.9801] // ~25 meters away
      };

      const result = await detectDuplicate(duplicateSubmission);

      expect(result.isDuplicate).toBe(true);
      expect(result.masterComplaint).toBeDefined();
      expect(result.masterComplaint.trackingId).toBe('CL-2026-TEST01');
      expect(result.distanceMeters).toBeLessThan(75);
      expect(result.similarityScore).toBeGreaterThanOrEqual(0.60);
    });

    it('should NOT flag as duplicate if text is identical but location is far (> 75m)', async () => {
      const distantSubmission = {
        title: 'Huge pothole in front of SBI ATM',
        description: 'Dangerous deep pothole on the asphalt right in front of SBI ATM',
        coordinates: [77.6150, 12.9900] // ~2 kilometers away!
      };

      const result = await detectDuplicate(distantSubmission);
      expect(result.isDuplicate).toBe(false);
    });

    it('should NOT flag as duplicate if location is close (< 75m) but complaint issue is completely different', async () => {
      const differentIssueSubmission = {
        title: 'Garbage dump uncollected',
        description: 'Piles of rotten waste and trash bags not picked up by municipal truck',
        coordinates: [77.6001, 12.9800] // ~10 meters away, but different issue
      };

      const result = await detectDuplicate(differentIssueSubmission);
      expect(result.isDuplicate).toBe(false);
    });
  });
});
