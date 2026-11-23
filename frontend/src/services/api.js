const API_BASE = '/api';

/**
 * Retrieve current JWT auth token from localStorage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('civiclens_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return await res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getStaffRoster() {
    const res = await fetch(`${API_BASE}/auth/staff`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Complaints
  async createComplaint(data) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getComplaints(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/complaints${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getMapComplaints(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/complaints/map${query ? `?${query}` : ''}`);
    return await res.json();
  },

  async trackComplaint(trackingId) {
    const res = await fetch(`${API_BASE}/complaints/track/${encodeURIComponent(trackingId)}`);
    return await res.json();
  },

  async getComplaintById(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateComplaintStatus(id, updateData) {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    return await res.json();
  },

  async assignStaff(id, staffId) {
    const res = await fetch(`${API_BASE}/complaints/${id}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ staffId })
    });
    return await res.json();
  },

  // AI Services
  async predictDepartment(title, description) {
    const res = await fetch(`${API_BASE}/ai/predict-department`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    return await res.json();
  },

  async checkDuplicate(payload) {
    const res = await fetch(`${API_BASE}/ai/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getClusters() {
    const res = await fetch(`${API_BASE}/ai/clusters`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Analytics
  async getAnalyticsSummary() {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return await res.json();
  },

  async getSpatialHeatmap() {
    const res = await fetch(`${API_BASE}/analytics/heatmap`);
    return await res.json();
  }
};
