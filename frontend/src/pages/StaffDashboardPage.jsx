import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge, DepartmentBadge, PriorityBadge } from '../components/StatusBadge';
import {
  LayoutDashboard,
  Filter,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Edit3,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  CheckSquare
} from 'lucide-react';

export const StaffDashboardPage = ({ user, onOpenAuth, onTrackTrackingId }) => {
  const [complaints, setComplaints] = useState([]);
  const [staffRoster, setStaffRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Status Modal form state
  const [modalStatus, setModalStatus] = useState('IN_PROGRESS');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalResolutionNotes, setModalResolutionNotes] = useState('');
  const [modalStaffId, setModalStaffId] = useState('');

  const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (departmentFilter !== 'ALL') filters.department = departmentFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;

      const res = await api.getComplaints(filters);
      if (res.success) {
        setComplaints(res.complaints || []);
      }

      if (isStaffOrAdmin) {
        const staffRes = await api.getStaffRoster();
        if (staffRes.success) {
          setStaffRoster(staffRes.staff || []);
        }
      }
    } catch (err) {
      console.error('Failed to load triage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter, statusFilter, isStaffOrAdmin]);

  const handleOpenUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setModalStatus(complaint.status);
    setModalRemarks('');
    setModalResolutionNotes(complaint.resolutionNotes || '');
    setModalStaffId(complaint.assignedStaff ? (complaint.assignedStaff._id || complaint.assignedStaff) : '');
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const id = selectedComplaint._id || selectedComplaint.id;
      const res = await api.updateComplaintStatus(id, {
        status: modalStatus,
        remarks: modalRemarks || `Status updated to ${modalStatus}`,
        resolutionNotes: modalResolutionNotes
      });

      if (res.success) {
        // Also assign staff if selected
        if (modalStaffId && modalStaffId !== selectedComplaint.assignedStaff) {
          await api.assignStaff(id, modalStaffId);
        }

        setSelectedComplaint(null);
        await loadData();
      } else {
        alert(res.message || 'Status update failed.');
      }
    } catch (err) {
      alert('Error updating complaint status.');
    } finally {
      setUpdating(false);
    }
  };

  if (!isStaffOrAdmin) {
    return (
      <div className="container" style={{ padding: '3.5rem 1.25rem', maxWidth: '600px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <UserCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Municipal Staff Portal Access
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            The Staff Triage Console is role-restricted to municipal officers, ward engineers, and administrators.
          </p>
          <button onClick={onOpenAuth} className="btn btn-primary">
            Sign In with Staff Account (Instant Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Municipal Staff Triage Queue
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Logged in as <strong>{user.name}</strong> ({user.role.toUpperCase()} - {user.department})
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={16} color="#2563eb" />
          <span>Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Departments</option>
            <option value="ROADS">Roads & Infrastructure</option>
            <option value="WATER_SUPPLY">Water Supply</option>
            <option value="SANITATION">Sanitation & Waste</option>
            <option value="ELECTRICITY">Electricity & Lighting</option>
            <option value="HEALTH_SAFETY">Health & Safety</option>
            <option value="PARKS">Parks & Recreation</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{complaints.length}</strong> complaints
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Grievance Title</th>
              <th style={{ padding: '0.75rem 1rem' }}>Department</th>
              <th style={{ padding: '0.75rem 1rem' }}>Locality</th>
              <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Cluster</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  {loading ? 'Loading triage complaints...' : 'No complaints found matching filter criteria.'}
                </td>
              </tr>
            ) : (
              complaints.map((c) => (
                <tr key={c._id || c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#2563eb' }}>
                    <span onClick={() => onTrackTrackingId(c.trackingId)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                      {c.trackingId}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <DepartmentBadge department={c.department} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.address}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {c.duplicateCount > 0 ? (
                      <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        Master (+{c.duplicateCount})
                      </span>
                    ) : c.isDuplicate ? (
                      <span className="badge" style={{ background: '#ffedd5', color: '#c2410c' }}>
                        Child Duplicate
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Unique</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenUpdateModal(c)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      <Edit3 size={13} />
                      <span>Update</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Update Complaint: {selectedComplaint.trackingId}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {selectedComplaint.title}
            </p>

            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Target Resolution Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Assign Field Officer
                </label>
                <select
                  value={modalStaffId}
                  onChange={(e) => setModalStaffId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="">Unassigned</option>
                  {staffRoster.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Audit Trail Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crew dispatched with road compactor"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {modalStatus === 'RESOLVED' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', marginBottom: '0.35rem' }}>
                    Resolution Notes (Mandatory for completion)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details of physical repair work undertaken..."
                    value={modalResolutionNotes}
                    onChange={(e) => setModalResolutionNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? 'Saving...' : 'Save & Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
