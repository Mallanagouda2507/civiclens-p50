const request = require('supertest');
const app = require('../server');
const { dataStore } = require('../services/dataStore');

describe('AI Routes & Controller Integration Suite (aiController.js)', () => {
  let citizenToken;
  let staffToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await dataStore.initDefaults();

    // Login citizen
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@example.com', password: 'CitizenPassword123!' });
    citizenToken = citizenLogin.body.token;

    // Login staff
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'roads@civiclens.gov', password: 'StaffPassword123!' });
    staffToken = staffLogin.body.token;
  });

  // ==========================================
  // POST /api/ai/predict-department
  // ==========================================
  describe('POST /api/ai/predict-department', () => {
    it('should predict department with confidence score and keywords for roads', async () => {
      const res = await request(app)
        .post('/api/ai/predict-department')
        .send({
          title: 'Damaged road with large potholes',
          description: 'Pothole asphalt crater on main road'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.prediction).toBeDefined();
      expect(res.body.prediction.department).toBe('ROADS');
      expect(res.body.prediction.confidence).toBeGreaterThan(0.5);
      expect(Array.isArray(res.body.prediction.keywords)).toBe(true);
      expect(res.body.prediction.keywords).toContain('pothol');
    });

    it('should return 400 Bad Request when both title and description are missing', async () => {
      const res = await request(app)
        .post('/api/ai/predict-department')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide at least a title or description');
    });
  });

  // ==========================================
  // POST /api/ai/check-duplicate
  // ==========================================
  describe('POST /api/ai/check-duplicate', () => {
    beforeAll(async () => {
      // Seed a reference active complaint
      await dataStore.createComplaint({
        trackingId: 'CL-2026-AI-TEST01',
        title: 'Water pipe leak near Metro station',
        description: 'Severe water pipe bursting and leaking water near Metro station Indiranagar',
        department: 'WATER_SUPPLY',
        location: {
          type: 'Point',
          coordinates: [77.6380, 12.9750]
        },
        address: 'Near Metro Station, Indiranagar',
        status: 'SUBMITTED'
      });
    });

    it('should detect duplicate when coordinates are within radius and text is similar', async () => {
      const res = await request(app)
        .post('/api/ai/check-duplicate')
        .send({
          coordinates: [77.6382, 12.9751], // ~25 meters away
          title: 'Burst pipe water leaking at metro',
          description: 'Drinking water pipeline ruptured near Indiranagar metro station'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.isDuplicate).toBe(true);
      expect(res.body.result.distanceMeters).toBeLessThan(75);
      expect(res.body.result.similarityScore).toBeGreaterThanOrEqual(0.60);
      expect(res.body.result.masterComplaint).toBeDefined();
    });

    it('should reject duplicate check when coordinates are missing or non-array', async () => {
      const res = await request(app)
        .post('/api/ai/check-duplicate')
        .send({
          title: 'No coordinates',
          description: 'Missing location'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Valid coordinates [longitude, latitude] are required');
    });

    it('should reject coordinates that fall outside geographic range', async () => {
      const res = await request(app)
        .post('/api/ai/check-duplicate')
        .send({
          coordinates: [195.0, 95.0], // Out of bounds
          title: 'Invalid coordinates',
          description: 'Testing range validation'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('out of geographical range');
    });

    it('should respect custom distance and similarity threshold overrides', async () => {
      const res = await request(app)
        .post('/api/ai/check-duplicate')
        .send({
          coordinates: [77.6382, 12.9751],
          title: 'Burst pipe water leaking at metro',
          description: 'Drinking water pipeline ruptured near Indiranagar metro station',
          distanceThreshold: 10, // Stricter 10m threshold (candidate is ~25m)
          similarityThreshold: 0.95
        });

      expect(res.status).toBe(200);
      expect(res.body.result.isDuplicate).toBe(false);
    });
  });

  // ==========================================
  // POST /api/ai/distance
  // ==========================================
  describe('POST /api/ai/distance', () => {
    it('should compute Haversine distance in meters and kilometers between two points', async () => {
      const res = await request(app)
        .post('/api/ai/distance')
        .send({
          pointA: [77.6094, 12.9716],
          pointB: [77.6101, 12.9719]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.distanceMeters).toBeGreaterThan(60);
      expect(res.body.distanceMeters).toBeLessThan(110);
      expect(res.body.distanceKm).toBeDefined();
    });

    it('should return 400 Bad Request when either point is missing', async () => {
      const res = await request(app)
        .post('/api/ai/distance')
        .send({ pointA: [77.6094, 12.9716] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request when points contain invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/ai/distance')
        .send({
          pointA: [200.0, 12.9716],
          pointB: [77.6101, 12.9719]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/ai/clusters
  // ==========================================
  describe('GET /api/ai/clusters (Role-Gated)', () => {
    beforeAll(async () => {
      // Create master and child duplicate
      const master = await dataStore.createComplaint({
        trackingId: 'CL-2026-CLUSTER-M1',
        title: 'Garbage dump uncollected on 12th Main',
        description: 'Large garbage pile not cleared',
        department: 'SANITATION',
        location: { type: 'Point', coordinates: [77.6200, 12.9500] },
        address: '12th Main',
        duplicateCount: 1,
        status: 'SUBMITTED'
      });

      await dataStore.createComplaint({
        trackingId: 'CL-2026-CLUSTER-C1',
        title: 'Rotten trash 12th Main',
        description: 'Garbage overflow on 12th main',
        department: 'SANITATION',
        location: { type: 'Point', coordinates: [77.6201, 12.9501] },
        address: '12th Main near corner',
        isDuplicate: true,
        masterComplaintId: master._id || master.id,
        masterTrackingId: master.trackingId,
        status: 'SUBMITTED'
      });
    });

    it('should allow municipal staff to retrieve duplicate cluster hierarchies', async () => {
      const res = await request(app)
        .get('/api/ai/clusters')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalClusters).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.clusters)).toBe(true);

      const cluster = res.body.clusters.find((cl) => cl.duplicates.length > 0);
      expect(cluster).toBeDefined();
      expect(cluster.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('should reject access without token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/ai/clusters');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should forbid citizens from accessing duplicate cluster analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/ai/clusters')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
