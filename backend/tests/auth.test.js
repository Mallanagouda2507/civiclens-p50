const request = require('supertest');
const app = require('../server');
const { dataStore } = require('../services/dataStore');

describe('Authentication & Authorization Suite (F-01)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await dataStore.initDefaults();
  });

  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.system).toContain('CivicLens');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new citizen user with valid inputs', async () => {
      const newUser = {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.org',
        password: 'Password123!',
        phone: '+91 91234 56789'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(newUser.email.toLowerCase());
      expect(res.body.user.role).toBe('citizen');
    });

    it('should reject registration with duplicate email', async () => {
      const duplicateUser = {
        name: 'Aarav Duplicate',
        email: 'aarav.sharma@example.org',
        password: 'Password123!'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@civiclens.gov',
          password: 'AdminPassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@civiclens.gov',
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent user email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@civiclens.gov',
          password: 'SomePassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Route: GET /api/auth/me & Role Gating', () => {
    let citizenToken;
    let staffToken;

    beforeAll(async () => {
      // Login citizen
      const citizenRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'citizen@example.com',
          password: 'CitizenPassword123!'
        });
      citizenToken = citizenRes.body.token;

      // Login staff
      const staffRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'roads@civiclens.gov',
          password: 'StaffPassword123!'
        });
      staffToken = staffRes.body.token;
    });

    it('should return user profile when valid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('citizen@example.com');
    });

    it('should reject profile access without Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow staff to access staff roster', async () => {
      const res = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.staff.length).toBeGreaterThan(0);
    });

    it('should forbid citizens from accessing staff roster (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
