const { dataStore } = require('../services/dataStore');

// @desc    Get aggregated municipal analytics
// @route   GET /api/analytics/summary
// @access  Public / Private
const getAnalyticsSummary = async (req, res) => {
  try {
    const complaints = await dataStore.listComplaints();

    const total = complaints.length;
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let duplicates = 0;
    let urgent = 0;
    let totalResolutionTimeHours = 0;
    let resolvedWithTimesCount = 0;

    const departmentCounts = {
      ROADS: { total: 0, resolved: 0 },
      WATER_SUPPLY: { total: 0, resolved: 0 },
      SANITATION: { total: 0, resolved: 0 },
      ELECTRICITY: { total: 0, resolved: 0 },
      HEALTH_SAFETY: { total: 0, resolved: 0 },
      PARKS: { total: 0, resolved: 0 },
      GENERAL: { total: 0, resolved: 0 }
    };

    const statusCounts = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };

    for (const c of complaints) {
      // Status counting
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }

      if (['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'].includes(c.status)) {
        open++;
      } else if (c.status === 'IN_PROGRESS') {
        inProgress++;
      } else if (c.status === 'RESOLVED') {
        resolved++;
      } else if (c.status === 'CLOSED') {
        closed++;
      }

      if (c.isDuplicate) duplicates++;
      if (c.priority === 'URGENT') urgent++;

      // Department breakdown
      const deptKey = departmentCounts[c.department] ? c.department : 'GENERAL';
      departmentCounts[deptKey].total++;
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        departmentCounts[deptKey].resolved++;
      }

      // Resolution time
      if ((c.status === 'RESOLVED' || c.status === 'CLOSED') && c.resolvedAt && c.createdAt) {
        const diffMs = new Date(c.resolvedAt) - new Date(c.createdAt);
        const hours = diffMs / (1000 * 60 * 60);
        if (hours >= 0) {
          totalResolutionTimeHours += hours;
          resolvedWithTimesCount++;
        }
      }
    }

    const avgResolutionHours =
      resolvedWithTimesCount > 0
        ? Math.round((totalResolutionTimeHours / resolvedWithTimesCount) * 10) / 10
        : 24.5; // Baseline standard default

    // Format department stats
    const departments = Object.keys(departmentCounts).map((key) => {
      const { total: deptTotal, resolved: deptResolved } = departmentCounts[key];
      const rate = deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 0;
      return {
        department: key,
        total: deptTotal,
        resolved: deptResolved,
        pending: deptTotal - deptResolved,
        resolutionRatePercent: rate
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalComplaints: total,
        openComplaints: open,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved + closed,
        duplicateComplaints: duplicates,
        urgentComplaints: urgent,
        avgResolutionHours,
        resolutionRatePercent: total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0
      },
      statusDistribution: statusCounts,
      departmentPerformance: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics summary',
      error: error.message
    });
  }
};

// @desc    Get GIS spatial heatmap coordinates
// @route   GET /api/analytics/heatmap
// @access  Public
const getSpatialHeatmap = async (req, res) => {
  try {
    const complaints = await dataStore.listComplaints();

    const points = complaints.map((c) => ({
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      weight: c.priority === 'URGENT' ? 1.0 : c.priority === 'HIGH' ? 0.8 : c.priority === 'MEDIUM' ? 0.5 : 0.3,
      department: c.department,
      status: c.status
    }));

    res.status(200).json({
      success: true,
      count: points.length,
      points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve spatial heatmap data',
      error: error.message
    });
  }
};

module.exports = {
  getAnalyticsSummary,
  getSpatialHeatmap
};
