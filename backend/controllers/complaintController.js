const crypto = require('crypto');
const { dataStore } = require('../services/dataStore');
const {
  isValidCoordinates
} = require('../services/ai/geoSpatialService');
const {
  classifyDepartment
} = require('../services/ai/departmentClassifierService');
const {
  detectDuplicate
} = require('../services/ai/duplicateDetectorService');

// Helper to generate a unique tracking ID: CL-2026-XXXXX
const generateTrackingId = () => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CL-2026-${randomPart}`;
};

// @desc    Submit a new municipal complaint with AI routing & duplicate detection
// @route   POST /api/complaints
// @access  Public (Citizen authenticated or guest with contact)
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      category,
      priority,
      coordinates,
      address,
      landmark,
      imageUrl,
      citizenName,
      citizenEmail,
      citizenPhone
    } = req.body;

    if (!title || !description || !address) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and address are required fields.'
      });
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographical coordinates [longitude, latitude] are required for geotagging.'
      });
    }

    const [lon, lat] = coordinates;
    if (!isValidCoordinates(lon, lat)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of geographical range (-90 to 90 lat, -180 to 180 lng).'
      });
    }

    // 1. Run AI Department Classifier
    const aiPrediction = classifyDepartment(title, description);
    const assignedDepartment =
      department && department !== 'AUTO' && department !== 'GENERAL'
        ? department
        : aiPrediction.department;

    // 2. Run AI Duplicate Detection Engine
    const duplicateCheck = await detectDuplicate({
      coordinates,
      title,
      description
    });

    const trackingId = generateTrackingId();
    const isDuplicate = duplicateCheck.isDuplicate;
    const masterTicket = duplicateCheck.masterComplaint;

    // Extract user details if logged in
    const citizenId = req.user ? req.user.id : null;
    const resolvedCitizenName = req.user ? req.user.name : citizenName || 'Anonymous Citizen';
    const resolvedCitizenEmail = req.user ? req.user.email : citizenEmail || '';
    const resolvedCitizenPhone = req.user ? (req.user.phone || citizenPhone) : citizenPhone || '';

    const initialAudit = {
      status: 'SUBMITTED',
      changedByName: resolvedCitizenName,
      remarks: isDuplicate
        ? `Complaint submitted and automatically clustered as duplicate of ${masterTicket.trackingId} (Similarity: ${Math.round(duplicateCheck.similarityScore * 100)}%, Distance: ${duplicateCheck.distanceMeters}m)`
        : 'Grievance registered and routed via AI Department Classifier',
      timestamp: new Date()
    };

    const newComplaintData = {
      trackingId,
      title,
      description,
      department: assignedDepartment,
      predictedDepartment: aiPrediction.department,
      classificationConfidence: aiPrediction.confidence,
      routingKeywords: aiPrediction.keywords,
      category: category || 'Civic Infrastructure',
      status: 'SUBMITTED',
      priority: priority || (isDuplicate ? 'HIGH' : 'MEDIUM'),
      location: {
        type: 'Point',
        coordinates: [Number(lon), Number(lat)]
      },
      address,
      landmark: landmark || '',
      citizen: citizenId,
      citizenName: resolvedCitizenName,
      citizenEmail: resolvedCitizenEmail,
      citizenPhone: resolvedCitizenPhone,
      imageUrl: imageUrl || '',
      isDuplicate,
      masterComplaintId: isDuplicate && masterTicket ? (masterTicket._id || masterTicket.id) : null,
      masterTrackingId: isDuplicate && masterTicket ? masterTicket.trackingId : null,
      similarityScore: duplicateCheck.similarityScore,
      distanceMeters: duplicateCheck.distanceMeters,
      auditTrail: [initialAudit]
    };

    const complaint = await dataStore.createComplaint(newComplaintData);

    // If duplicate, update master complaint's duplicateCount and clusteredComplaintIds
    if (isDuplicate && masterTicket) {
      const masterId = masterTicket._id || masterTicket.id;
      const updatedCount = (masterTicket.duplicateCount || 0) + 1;
      const updatedClusters = [...(masterTicket.clusteredComplaintIds || []), complaint._id || complaint.id];

      // Automatically elevate priority if duplicate threshold reached
      let updatedPriority = masterTicket.priority;
      if (updatedCount >= 3 && updatedPriority !== 'URGENT') {
        updatedPriority = 'URGENT';
      } else if (updatedCount >= 1 && updatedPriority === 'LOW') {
        updatedPriority = 'HIGH';
      }

      await dataStore.updateComplaint(masterId, {
        duplicateCount: updatedCount,
        clusteredComplaintIds: updatedClusters,
        priority: updatedPriority
      });

      await dataStore.createAuditLog({
        complaintId: masterId,
        trackingId: masterTicket.trackingId,
        action: 'DUPLICATE_CLUSTERED',
        previousValue: `${updatedCount - 1} duplicates`,
        newValue: `${updatedCount} duplicates`,
        performedByName: 'AI Clustering Engine',
        performedByRole: 'system',
        notes: `Duplicate complaint ${trackingId} linked (${Math.round(duplicateCheck.similarityScore * 100)}% match, ${duplicateCheck.distanceMeters}m away)`
      });
    }

    res.status(201).json({
      success: true,
      message: isDuplicate
        ? 'Complaint registered and linked to an existing active duplicate cluster.'
        : 'Complaint submitted successfully and assigned to department queue.',
      complaint,
      aiInsights: {
        predictedDepartment: aiPrediction.department,
        departmentConfidence: aiPrediction.confidence,
        routingKeywords: aiPrediction.keywords,
        duplicateAnalysis: duplicateCheck
      }
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint.',
      error: error.message
    });
  }
};

// @desc    Get all complaints with filtering
// @route   GET /api/complaints
// @access  Public / Private
const getComplaints = async (req, res) => {
  try {
    const { status, department, isDuplicate, myOnly } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (department && department !== 'ALL') filters.department = department;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';

    // If citizen requested only their own complaints
    if (myOnly === 'true' && req.user) {
      filters.citizenId = req.user.id;
    }

    const complaints = await dataStore.listComplaints(filters);

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
      error: error.message
    });
  }
};

// @desc    Get complaints formatted for interactive Leaflet Map
// @route   GET /api/complaints/map
// @access  Public
const getMapComplaints = async (req, res) => {
  try {
    const { department, status } = req.query;
    const filters = {};
    if (department && department !== 'ALL') filters.department = department;
    if (status) filters.status = status;

    const complaints = await dataStore.listComplaints(filters);

    // Return GeoJSON FeatureCollection format
    const features = complaints.map((c) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: c.location.coordinates // [lng, lat]
      },
      properties: {
        id: c._id || c.id,
        trackingId: c.trackingId,
        title: c.title,
        description: c.description,
        department: c.department,
        category: c.category,
        status: c.status,
        priority: c.priority,
        address: c.address,
        isDuplicate: c.isDuplicate,
        duplicateCount: c.duplicateCount || 0,
        masterTrackingId: c.masterTrackingId,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt
      }
    }));

    res.status(200).json({
      type: 'FeatureCollection',
      count: features.length,
      features
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve map geospatial complaints',
      error: error.message
    });
  }
};

// @desc    Track complaint by public Tracking ID
// @route   GET /api/complaints/track/:trackingId
// @access  Public
const getComplaintByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const complaint = await dataStore.findComplaintByTrackingId(trackingId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint with tracking ID '${trackingId}' not found.`
      });
    }

    // Retrieve child duplicates if this is a master complaint
    let childDuplicates = [];
    if (complaint.clusteredComplaintIds && complaint.clusteredComplaintIds.length > 0) {
      const allComplaints = await dataStore.listComplaints();
      childDuplicates = allComplaints.filter(
        (c) => c.masterComplaintId && c.masterComplaintId.toString() === complaint._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      complaint,
      childDuplicates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching for complaint tracking ID',
      error: error.message
    });
  }
};

// @desc    Get complaint by MongoDB ID
// @route   GET /api/complaints/:id
// @access  Public / Private
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await dataStore.findComplaintById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    const auditLogs = await dataStore.getAuditLogs(id);

    res.status(200).json({
      success: true,
      complaint,
      auditLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint detail',
      error: error.message
    });
  }
};

// @desc    Update complaint status & lifecycle (Staff / Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private (Staff, Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, resolutionNotes, priority, department } = req.body;

    const validStatuses = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const complaint = await dataStore.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const previousStatus = complaint.status;
    const updates = { status };

    if (priority) updates.priority = priority;
    if (department) updates.department = department;
    if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updates.resolvedAt = new Date();
    }

    const auditEntry = {
      status,
      changedBy: req.user.id,
      changedByName: req.user.name,
      remarks: remarks || `Status changed from ${previousStatus} to ${status}`,
      timestamp: new Date()
    };

    updates.auditTrail = [...(complaint.auditTrail || []), auditEntry];

    const updatedComplaint = await dataStore.updateComplaint(id, updates);

    // Record persistent audit log
    await dataStore.createAuditLog({
      complaintId: id,
      trackingId: complaint.trackingId,
      action: 'STATUS_CHANGE',
      previousValue: previousStatus,
      newValue: status,
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      notes: remarks || ''
    });

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
      error: error.message
    });
  }
};

// @desc    Assign municipal staff to complaint
// @route   PUT /api/complaints/:id/assign
// @access  Private (Staff, Admin)
const assignStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const complaint = await dataStore.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const staffMember = await dataStore.findUserById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Assigned staff member not found in roster.'
      });
    }

    const updates = {
      assignedStaff: staffMember._id || staffMember.id,
      assignedStaffName: staffMember.name,
      status: complaint.status === 'SUBMITTED' ? 'ASSIGNED' : complaint.status
    };

    const auditEntry = {
      status: updates.status,
      changedBy: req.user.id,
      changedByName: req.user.name,
      remarks: `Assigned to ${staffMember.name} (${staffMember.department})`,
      timestamp: new Date()
    };

    updates.auditTrail = [...(complaint.auditTrail || []), auditEntry];

    const updated = await dataStore.updateComplaint(id, updates);

    await dataStore.createAuditLog({
      complaintId: id,
      trackingId: complaint.trackingId,
      action: 'STAFF_ASSIGNED',
      previousValue: complaint.assignedStaffName || 'Unassigned',
      newValue: staffMember.name,
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      notes: `Assigned to ${staffMember.name}`
    });

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${staffMember.name}`,
      complaint: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign staff member',
      error: error.message
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getMapComplaints,
  getComplaintByTrackingId,
  getComplaintById,
  updateComplaintStatus,
  assignStaff
};
