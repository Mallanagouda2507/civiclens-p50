import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge, DepartmentBadge, PriorityBadge } from '../components/StatusBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Copy,
  ChevronRight
} from 'lucide-react';

export const TrackComplaintPage = ({ initialTrackingId, onSelectComplaint }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [complaint, setComplaint] = useState(null);
  const [childDuplicates, setChildDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingId(initialTrackingId);
      performSearch(initialTrackingId);
    }
  }, [initialTrackingId]);

  const performSearch = async (idToSearch) => {
    const id = idToSearch || trackingId;
    if (!id.trim()) return;

    setLoading(true);
    setError('');
    setComplaint(null);
    setChildDuplicates([]);

    try {
      const res = await api.trackComplaint(id.trim());
      if (res.success) {
        setComplaint(res.complaint);
        setChildDuplicates(res.childDuplicates || []);
      } else {
        setError(res.message || 'Complaint tracking ID not found.');
      }
    } catch (err) {
      setError('Error connecting to tracking service.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // State machine progression steps
  const LIFECYCLE_STEPS = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' }
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem', maxWidth: '850px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Track Municipal Complaint Status
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Enter your unique tracking reference ID (e.g. CL-2026-XXXXX) for real-time lifecycle updates
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '520px', margin: '1.5rem auto 0', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.85rem', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="e.g. CL-2026-TEST01"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {complaint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Status Header Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>
                    {complaint.trackingId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(complaint.trackingId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    title="Copy tracking ID"
                  >
                    <Copy size={14} />
                  </button>
                  {copied && <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Copied!</span>}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {complaint.title}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <DepartmentBadge department={complaint.department} />
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {complaint.description}
            </p>

            {/* Lifecycle Progress Bar */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Resolution Lifecycle Progression
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const state = getStepStatus(step.key, complaint.status);
                  const isDone = state === 'completed';
                  const isCurrent = state === 'current';

                  return (
                    <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : isCurrent ? '#2563eb' : '#e2e8f0',
                        color: isDone || isCurrent ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: isCurrent ? '3px solid #bfdbfe' : 'none'
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#2563eb' : '#475569', marginTop: '0.35rem', textAlign: 'center' }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Duplicate Clustering Alert Box */}
          {complaint.isDuplicate && (
            <div className="card" style={{ padding: '1.25rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                ⚡ Clustered Duplicate Notice
              </div>
              <p style={{ fontSize: '0.85rem', color: '#78350f' }}>
                This grievance has been clustered as a verified duplicate of master complaint ticket{' '}
                <strong
                  onClick={() => performSearch(complaint.masterTrackingId)}
                  style={{ textDecoration: 'underline', cursor: 'pointer', color: '#b45309' }}
                >
                  {complaint.masterTrackingId}
                </strong>{' '}
                (Similarity: {Math.round((complaint.similarityScore || 0) * 100)}%, Distance: {complaint.distanceMeters}m).
                Both tickets share linked municipal work order status.
              </p>
            </div>
          )}

          {/* If Master with child duplicates */}
          {childDuplicates.length > 0 && (
            <div className="card" style={{ padding: '1.25rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                🏛️ Clustered Citizen Endorsements ({childDuplicates.length} Duplicate Submissions Merged)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {childDuplicates.map((dup) => (
                  <div key={dup._id || dup.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#2563eb' }}>{dup.trackingId}</span>
                      <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{dup.citizenName || 'Citizen'}</span>
                    </div>
                    <span style={{ color: '#475569' }}>{dup.address}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details & Audit Trail Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Location Geotag Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#2563eb" />
                <span>Geotag Coordinates</span>
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div><strong>Locality:</strong> {complaint.address}</div>
                {complaint.landmark && <div><strong>Landmark:</strong> {complaint.landmark}</div>}
                <div>
                  <strong>Coordinates:</strong>{' '}
                  <span style={{ fontFamily: 'JetBrains Mono', color: '#1e293b' }}>
                    {complaint.location.coordinates[1]}° N, {complaint.location.coordinates[0]}° E
                  </span>
                </div>
                <div><strong>Assigned Officer:</strong> {complaint.assignedStaffName || 'Under Triage'}</div>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#2563eb" />
                <span>Audit Trail History</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
                {complaint.auditTrail && complaint.auditTrail.map((log, index) => (
                  <div key={index} style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: '0.75rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{log.status}</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: '#475569', marginTop: '0.15rem' }}>{log.remarks}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>By: {log.changedByName || 'System'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
