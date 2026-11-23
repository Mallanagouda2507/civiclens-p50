import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace('_', '-');
  const label = (status || '').replace('_', ' ');

  let badgeClass = 'badge-submitted';
  if (normalized === 'under-review') badgeClass = 'badge-under-review';
  if (normalized === 'assigned') badgeClass = 'badge-assigned';
  if (normalized === 'in-progress') badgeClass = 'badge-in-progress';
  if (normalized === 'resolved') badgeClass = 'badge-resolved';
  if (normalized === 'closed') badgeClass = 'badge-closed';

  return <span className={`badge ${badgeClass}`}>{label}</span>;
};

export const DepartmentBadge = ({ department }) => {
  const deptMap = {
    ROADS: { label: 'Roads & Infra', cls: 'dept-roads' },
    WATER_SUPPLY: { label: 'Water Supply', cls: 'dept-water' },
    SANITATION: { label: 'Sanitation', cls: 'dept-sanitation' },
    ELECTRICITY: { label: 'Electricity', cls: 'dept-electricity' },
    HEALTH_SAFETY: { label: 'Health & Safety', cls: 'dept-health' },
    PARKS: { label: 'Parks', cls: 'dept-parks' },
    GENERAL: { label: 'General Admin', cls: 'dept-general' },
    ALL: { label: 'All Depts', cls: 'dept-general' }
  };

  const item = deptMap[department] || { label: department || 'General', cls: 'dept-general' };

  return <span className={`badge ${item.cls}`}>{item.label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    LOW: { bg: '#f1f5f9', color: '#475569' },
    MEDIUM: { bg: '#e0f2fe', color: '#0369a1' },
    HIGH: { bg: '#ffedd5', color: '#c2410c' },
    URGENT: { bg: '#fee2e2', color: '#b91c1c' }
  };

  const p = styles[priority] || styles.MEDIUM;

  return (
    <span
      className="badge"
      style={{ backgroundColor: p.bg, color: p.color, fontWeight: 700 }}
    >
      {priority}
    </span>
  );
};
