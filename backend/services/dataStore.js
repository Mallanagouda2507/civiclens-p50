const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isConnected } = require('../config/db');

// In-Memory store state
const memoryUsers = new Map();
const memoryComplaints = new Map();
const memoryAuditLogs = [];

// Helper to calculate Haversine distance in meters
function haversineDistanceMeters(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371000; // Earth's radius in meters
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

class DataStore {
  constructor() {
    this.initialized = false;
  }

  isMongoActive() {
    return isConnected() && mongoose.connection.readyState === 1;
  }

  async initDefaults() {
    if (this.initialized) return;

    // Check if admin user exists in memory, if not create default accounts
    const existing = await this.findUserByEmail('admin@civiclens.gov');
    if (!existing) {
      await this.createUser({
        name: 'Municipal Administrator',
        email: 'admin@civiclens.gov',
        password: 'AdminPassword123!',
        role: 'admin',
        department: 'ALL',
        phone: '+91 98765 43210'
      });

      await this.createUser({
        name: 'Roads Officer Rajesh',
        email: 'roads@civiclens.gov',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'ROADS',
        phone: '+91 98765 43211'
      });

      await this.createUser({
        name: 'Sanitation Officer Priya',
        email: 'sanitation@civiclens.gov',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'SANITATION',
        phone: '+91 98765 43212'
      });

      await this.createUser({
        name: 'Water Works Officer Anand',
        email: 'water@civiclens.gov',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'WATER_SUPPLY',
        phone: '+91 98765 43213'
      });

      await this.createUser({
        name: 'Electricity Officer Sneha',
        email: 'electricity@civiclens.gov',
        password: 'StaffPassword123!',
        role: 'staff',
        department: 'ELECTRICITY',
        phone: '+91 98765 43214'
      });

      await this.createUser({
        name: 'Citizen Vikram Kumar',
        email: 'citizen@example.com',
        password: 'CitizenPassword123!',
        role: 'citizen',
        department: 'GENERAL',
        phone: '+91 98765 11111'
      });
    }

    this.initialized = true;
  }

  // --- USER OPERATIONS ---

  async createUser(userData) {
    if (this.isMongoActive()) {
      const User = mongoose.model('User');
      const user = new User(userData);
      await user.save();
      return user.toObject();
    }

    // In-Memory Implementation
    const id = new mongoose.Types.ObjectId().toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = {
      _id: id,
      id: id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      role: userData.role || 'citizen',
      department: userData.department || 'GENERAL',
      phone: userData.phone || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryUsers.set(user.email, user);
    return { ...user };
  }

  async findUserByEmail(email, includePassword = false) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (this.isMongoActive()) {
      const User = mongoose.model('User');
      let query = User.findOne({ email: cleanEmail });
      if (includePassword) query = query.select('+password');
      return await query.lean();
    }

    const user = memoryUsers.get(cleanEmail);
    if (!user) return null;

    if (!includePassword) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return { ...user };
  }

  async findUserById(id) {
    if (!id) return null;

    if (this.isMongoActive()) {
      const User = mongoose.model('User');
      return await User.findById(id).lean();
    }

    for (const user of memoryUsers.values()) {
      if (user._id === id.toString() || user.id === id.toString()) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  async listUsers(filter = {}) {
    if (this.isMongoActive()) {
      const User = mongoose.model('User');
      return await User.find(filter).select('-password').lean();
    }

    let users = Array.from(memoryUsers.values());
    if (filter.role) {
      users = users.filter((u) => u.role === filter.role);
    }
    if (filter.department && filter.department !== 'ALL') {
      users = users.filter((u) => u.department === filter.department);
    }

    return users.map(({ password, ...u }) => u);
  }

  // --- COMPLAINT OPERATIONS ---

  async createComplaint(complaintData) {
    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      const complaint = new Complaint(complaintData);
      await complaint.save();
      return complaint.toObject();
    }

    const id = new mongoose.Types.ObjectId().toString();
    const complaint = {
      _id: id,
      id: id,
      trackingId: complaintData.trackingId,
      title: complaintData.title,
      description: complaintData.description,
      department: complaintData.department || 'GENERAL',
      predictedDepartment: complaintData.predictedDepartment || 'GENERAL',
      classificationConfidence: complaintData.classificationConfidence || 0.0,
      routingKeywords: complaintData.routingKeywords || [],
      category: complaintData.category || 'Civic Grievance',
      status: complaintData.status || 'SUBMITTED',
      priority: complaintData.priority || 'MEDIUM',
      location: complaintData.location,
      address: complaintData.address,
      landmark: complaintData.landmark || '',
      citizen: complaintData.citizen || null,
      citizenName: complaintData.citizenName || 'Anonymous Citizen',
      citizenEmail: complaintData.citizenEmail || '',
      citizenPhone: complaintData.citizenPhone || '',
      assignedStaff: complaintData.assignedStaff || null,
      assignedStaffName: complaintData.assignedStaffName || 'Unassigned',
      imageUrl: complaintData.imageUrl || '',
      isDuplicate: !!complaintData.isDuplicate,
      masterComplaintId: complaintData.masterComplaintId || null,
      masterTrackingId: complaintData.masterTrackingId || null,
      duplicateCount: complaintData.duplicateCount || 0,
      clusteredComplaintIds: complaintData.clusteredComplaintIds || [],
      similarityScore: complaintData.similarityScore || 0.0,
      distanceMeters: complaintData.distanceMeters || null,
      auditTrail: complaintData.auditTrail || [
        {
          status: complaintData.status || 'SUBMITTED',
          changedByName: complaintData.citizenName || 'Citizen',
          remarks: 'Complaint registered successfully',
          timestamp: new Date()
        }
      ],
      resolutionNotes: complaintData.resolutionNotes || '',
      resolvedAt: complaintData.resolvedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryComplaints.set(id, complaint);
    return { ...complaint };
  }

  async findComplaintById(id) {
    if (!id) return null;

    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      return await Complaint.findById(id).lean();
    }

    const complaint = memoryComplaints.get(id.toString());
    return complaint ? { ...complaint } : null;
  }

  async findComplaintByTrackingId(trackingId) {
    if (!trackingId) return null;

    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      return await Complaint.findOne({ trackingId }).lean();
    }

    for (const c of memoryComplaints.values()) {
      if (c.trackingId.toUpperCase() === trackingId.toUpperCase()) {
        return { ...c };
      }
    }
    return null;
  }

  async listComplaints(filters = {}) {
    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.department && filters.department !== 'ALL') {
        query.department = filters.department;
      }
      if (filters.citizenId) query.citizen = filters.citizenId;
      if (filters.isDuplicate !== undefined) query.isDuplicate = filters.isDuplicate;

      return await Complaint.find(query).sort({ createdAt: -1 }).lean();
    }

    let list = Array.from(memoryComplaints.values());

    if (filters.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters.department && filters.department !== 'ALL') {
      list = list.filter((c) => c.department === filters.department);
    }
    if (filters.citizenId) {
      list = list.filter(
        (c) => c.citizen && c.citizen.toString() === filters.citizenId.toString()
      );
    }
    if (filters.isDuplicate !== undefined) {
      list = list.filter((c) => c.isDuplicate === filters.isDuplicate);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async updateComplaint(id, updates) {
    const stringId = id.toString();

    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      return await Complaint.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
    }

    const existing = memoryComplaints.get(stringId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    memoryComplaints.set(stringId, updated);
    return { ...updated };
  }

  async deleteComplaint(id) {
    const stringId = id.toString();

    if (this.isMongoActive()) {
      const Complaint = mongoose.model('Complaint');
      return await Complaint.findByIdAndDelete(id).lean();
    }

    const existing = memoryComplaints.get(stringId);
    if (existing) {
      memoryComplaints.delete(stringId);
      return existing;
    }
    return null;
  }

  async findNearbyComplaints({ coordinates, maxDistanceMeters = 1000, excludeId = null, activeOnly = true }) {
    const allComplaints = await this.listComplaints();

    return allComplaints
      .filter((c) => {
        if (excludeId && (c._id.toString() === excludeId.toString() || c.id === excludeId.toString())) {
          return false;
        }
        if (activeOnly && (c.status === 'RESOLVED' || c.status === 'CLOSED')) {
          return false;
        }
        if (!c.location || !c.location.coordinates) return false;

        const distance = haversineDistanceMeters(coordinates, c.location.coordinates);
        c.distanceMeters = distance;
        return distance <= maxDistanceMeters;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  // --- AUDIT LOG OPERATIONS ---

  async createAuditLog(logData) {
    const log = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...logData,
      timestamp: new Date()
    };

    if (this.isMongoActive()) {
      const AuditLog = mongoose.model('AuditLog');
      const doc = new AuditLog(log);
      await doc.save();
      return doc.toObject();
    }

    memoryAuditLogs.push(log);
    return log;
  }

  async getAuditLogs(complaintId) {
    if (this.isMongoActive()) {
      const AuditLog = mongoose.model('AuditLog');
      return await AuditLog.find({ complaintId }).sort({ timestamp: -1 }).lean();
    }

    return memoryAuditLogs
      .filter((l) => l.complaintId.toString() === complaintId.toString())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  clearMemoryStore() {
    memoryUsers.clear();
    memoryComplaints.clear();
    memoryAuditLogs.length = 0;
    this.initialized = false;
  }
}

const dataStore = new DataStore();

module.exports = { dataStore, haversineDistanceMeters };
