const request = require('supertest');
const app = require('../server');
const { dataStore } = require('../services/dataStore');

describe('Complaints & Grievance Lifecycle Suite (F-02, F-03, F-04, F-05, F-08, F-09)', () => {
  let citizenToken;
  let staffToken;
  let createdTrackingId;
  let createdComplaintId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    dataStore.clearMemoryStore();
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

  describe('POST /api/complaints (F-02, F-03, F-06, F-07)', () => {
    it('should submit a complaint, geotag it, and automatically route to ROADS', async () => {
      const payload = {
        title: 'Dangerous road crater and potholes',
        description: 'Large potholes on the asphalt near Indiranagar 100ft road causing bike accidents',
        coordinates: [77.6412, 12.9784], // [lng, lat] Indiranagar
        address: '100ft Road, Indiranagar, Bengaluru',
        category: 'Road Repair',
        citizenName: 'Aarav Citizen',
        citizenPhone: '+91 99887 76655'
      };

      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint).toBeDefined();
      expect(res.body.complaint.trackingId).toMatch(/^CL-2026-[A-F0-9]{6}$/);
      expect(res.body.complaint.department).toBe('ROADS');
      expect(res.body.complaint.location.coordinates).toEqual([77.6412, 12.9784]);
      expect(res.body.complaint.status).toBe('SUBMITTED');
      expect(res.body.complaint.isDuplicate).toBe(false);

      createdTrackingId = res.body.complaint.trackingId;
      createdComplaintId = res.body.complaint._id || res.body.complaint.id;
    });

    it('should automatically cluster a subsequent similar complaint at the same spot as duplicate (F-06)', async () => {
      const duplicatePayload = {
        title: 'Deep road pothole on 100ft road',
        description: 'Big potholes and broken asphalt on Indiranagar 100ft road near junction',
        coordinates: [77.6414, 12.9785], // ~25 meters away
        address: 'Near junction 100ft Road, Indiranagar',
        category: 'Road Repair',
        citizenName: 'Second Citizen'
      };

      const res = await request(app)
        .post('/api/complaints')
        .send(duplicatePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.isDuplicate).toBe(true);
      expect(res.body.complaint.masterTrackingId).toBe(createdTrackingId);
      expect(res.body.complaint.distanceMeters).toBeLessThan(75);
      expect(res.body.complaint.similarityScore).toBeGreaterThanOrEqual(0.60);

      // Verify master complaint now has duplicateCount incremented
      const masterRes = await request(app).get(`/api/complaints/track/${createdTrackingId}`);
      expect(masterRes.body.complaint.duplicateCount).toBe(1);
      expect(masterRes.body.childDuplicates.length).toBe(1);
    });

    it('should reject complaint submission with missing coordinates (F-03)', async () => {
      const invalidPayload = {
        title: 'Missing coordinates',
        description: 'Nowhere on the map',
        address: 'Some address'
      };

      const res = await request(app)
        .post('/api/complaints')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/complaints & Map GeoJSON (F-04)', () => {
    it('should return list of complaints with department filters', async () => {
      const res = await request(app)
        .get('/api/complaints?department=ROADS');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaints.length).toBeGreaterThan(0);
      expect(res.body.complaints.every((c) => c.department === 'ROADS')).toBe(true);
    });

    it('should return valid GeoJSON FeatureCollection for Leaflet mapping', async () => {
      const res = await request(app).get('/api/complaints/map');

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('FeatureCollection');
      expect(Array.isArray(res.body.features)).toBe(true);
      expect(res.body.features.length).toBeGreaterThan(0);

      const firstFeature = res.body.features[0];
      expect(firstFeature.geometry.type).toBe('Point');
      expect(firstFeature.geometry.coordinates.length).toBe(2);
      expect(firstFeature.properties.trackingId).toBeDefined();
    });
  });

  describe('GET /api/complaints/track/:trackingId (F-08 Citizen Tracking)', () => {
    it('should retrieve complaint by public tracking ID with audit trail', async () => {
      const res = await request(app).get(`/api/complaints/track/${createdTrackingId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.trackingId).toBe(createdTrackingId);
      expect(res.body.complaint.auditTrail.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent tracking ID', async () => {
      const res = await request(app).get('/api/complaints/track/CL-9999-FAKE');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Staff Triage & Lifecycle State Updates (F-05, F-08)', () => {
    it('should allow municipal staff to transition status to IN_PROGRESS', async () => {
      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'IN_PROGRESS',
          remarks: 'Road repair team dispatched with asphalt mixture',
          priority: 'HIGH'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.status).toBe('IN_PROGRESS');
      expect(res.body.complaint.priority).toBe('HIGH');
      expect(res.body.complaint.auditTrail.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow municipal staff to resolve complaint with notes', async () => {
      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'RESOLVED',
          remarks: 'Pothole filled and sealed with bitumen',
          resolutionNotes: 'Work order completed by Ward 82 engineering crew.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.status).toBe('RESOLVED');
      expect(res.body.complaint.resolvedAt).toBeDefined();
    });

    it('should forbid citizens from updating complaint status (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid status with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'NON_EXISTENT_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status');
    });

    it('should return 404 when updating a non-existent complaint', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/complaints/${fakeId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve complaint by MongoDB ID (GET /api/complaints/:id)', async () => {
      const res = await request(app).get(`/api/complaints/${createdComplaintId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint).toBeDefined();
      expect(Array.isArray(res.body.auditLogs)).toBe(true);
    });

    it('should return 404 for non-existent complaint ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/complaints/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should assign a municipal staff member to complaint (PUT /api/complaints/:id/assign)', async () => {
      // Fetch staff roster to get valid staff ID
      const staffRes = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${staffToken}`);
      const officer = staffRes.body.staff[0];

      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/assign`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ staffId: officer._id || officer.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.assignedStaffName).toBe(officer.name);
    });

    it('should return 404 when assigning a non-existent staff member ID', async () => {
      const fakeStaffId = '507f1f77bcf86cd799439099';
      const res = await request(app)
        .put(`/api/complaints/${createdComplaintId}/assign`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ staffId: fakeStaffId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('staff member not found');
    });

    it('should filter complaints by myOnly=true for authenticated citizen', async () => {
      const res = await request(app)
        .get('/api/complaints?myOnly=true')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.complaints)).toBe(true);
    });
  });

  describe('Analytics & SLA Monitoring API (F-09)', () => {
    it('should generate accurate municipal metrics and department breakdowns', async () => {
      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalComplaints).toBeGreaterThan(0);
      expect(res.body.summary.duplicateComplaints).toBeGreaterThanOrEqual(1);
      expect(res.body.summary.resolvedComplaints).toBeGreaterThanOrEqual(1);
      expect(res.body.departmentPerformance.length).toBeGreaterThan(0);
    });

    it('should provide spatial heatmap weighted points', async () => {
      const res = await request(app).get('/api/analytics/heatmap');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.points)).toBe(true);
      expect(res.body.points[0].weight).toBeDefined();
    });
  });
});
