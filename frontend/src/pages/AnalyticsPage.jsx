import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DepartmentBadge } from '../components/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalyticsSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await api.getComplaints();
      if (!res.success || !res.complaints) return;

      const headers = ['TrackingID', 'Title', 'Department', 'Status', 'Priority', 'Address', 'Longitude', 'Latitude', 'IsDuplicate', 'CreatedAt'];
      const rows = res.complaints.map((c) => [
        c.trackingId,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        c.department,
        c.status,
        c.priority,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        c.location.coordinates[0],
        c.location.coordinates[1],
        c.isDuplicate ? 'YES' : 'NO',
        c.createdAt
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CivicLens_Municipal_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error generating CSV export.');
    }
  };

  if (loading && !data) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center', color: '#64748b' }}>
        Loading municipal analytics and SLA telemetry...
      </div>
    );
  }

  const { summary, statusDistribution, departmentPerformance } = data || {
    summary: {},
    statusDistribution: {},
    departmentPerformance: []
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Municipal Operations & SLA Intelligence
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Real-time telemetry, spatial workload distribution, and AI duplicate mitigation metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary btn-sm">
            <Download size={14} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Grievances
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {summary.totalComplaints || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
            Active civic telemetry
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Active Backlog
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ea580c', marginTop: '0.25rem' }}>
            {(summary.openComplaints || 0) + (summary.inProgressComplaints || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            {summary.openComplaints || 0} open · {summary.inProgressComplaints || 0} in progress
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Resolved Tickets
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {summary.resolvedComplaints || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.35rem', fontWeight: 600 }}>
            {summary.resolutionRatePercent || 0}% overall success rate
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Clustered Duplicates
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            {summary.duplicateComplaints || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.35rem', fontWeight: 600 }}>
            Filtered by AI Spatial Clustering
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Avg Resolution SLA
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {summary.avgResolutionHours || 24}h
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            Standard SLA threshold &lt; 48h
          </div>
        </div>
      </div>

      {/* Department Workload & Performance Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Departmental Resolution Efficiency
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {departmentPerformance.map((dept) => (
              <div key={dept.department}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <DepartmentBadge department={dept.department} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {dept.resolved} / {dept.total} resolved ({dept.resolutionRatePercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${dept.resolutionRatePercent}%`,
                      height: '100%',
                      background: dept.resolutionRatePercent > 70 ? '#10b981' : dept.resolutionRatePercent > 40 ? '#2563eb' : '#f59e0b',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Complaint State Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(statusDistribution).map(([statusKey, count]) => (
              <div key={statusKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>{statusKey.replace('_', ' ')}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#0f172a' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
