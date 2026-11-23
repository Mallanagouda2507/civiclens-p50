import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import { StatusBadge, DepartmentBadge, PriorityBadge } from './StatusBadge';
import { Filter, Layers, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const ComplaintsMap = ({ onSelectComplaint, onTrackTrackingId }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  // Load complaints from backend
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (departmentFilter !== 'ALL') filters.department = departmentFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (showDuplicatesOnly) filters.isDuplicate = 'true';

      const res = await api.getComplaints(filters);
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching map complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [departmentFilter, statusFilter, showDuplicatesOnly]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CivicLens Municipal Portal',
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when complaints change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (complaints.length === 0) return;

    const bounds = L.latLngBounds();

    complaints.forEach((c) => {
      if (!c.location || !c.location.coordinates) return;
      const [lng, lat] = c.location.coordinates;

      // Status color matching
      let pinColor = '#ef4444'; // Red for SUBMITTED
      if (c.status === 'UNDER_REVIEW') pinColor = '#f59e0b';
      if (c.status === 'ASSIGNED') pinColor = '#6366f1';
      if (c.status === 'IN_PROGRESS') pinColor = '#eab308';
      if (c.status === 'RESOLVED') pinColor = '#10b981';
      if (c.status === 'CLOSED') pinColor = '#64748b';

      // Duplicate highlight
      const isClustered = c.duplicateCount > 0 || c.isDuplicate;

      const markerHtml = `
        <div style="position: relative; width: 30px; height: 30px;">
          <div style="background-color: ${pinColor}; width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          ${c.duplicateCount > 0 ? `
            <div style="position: absolute; top: -6px; right: -6px; background: #dc2626; color: #fff; font-size: 10px; font-weight: 800; border-radius: 999px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
              +${c.duplicateCount}
            </div>` : ''}
          ${c.isDuplicate ? `
            <div style="position: absolute; top: -4px; right: -4px; background: #ea580c; color: #fff; font-size: 9px; font-weight: 700; border-radius: 999px; padding: 1px 4px; border: 1px solid #fff;">
              DUP
            </div>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-complaint-pin',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 220px; font-family: inherit;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #2563eb;">
              ${c.trackingId}
            </span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #e2e8f0;">
              ${c.status}
            </span>
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${c.title}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.3;">
            ${c.description.slice(0, 85)}${c.description.length > 85 ? '...' : ''}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${c.address}
          </div>
          ${c.duplicateCount > 0 ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 4px 6px; border-radius: 4px; font-size: 11px; color: #b91c1c; font-weight: 600; margin-bottom: 6px;">
              ⚡ Master ticket (${c.duplicateCount} citizen duplicate reports linked)
            </div>` : ''}
          ${c.isDuplicate ? `
            <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 4px 6px; border-radius: 4px; font-size: 11px; color: #c2410c; margin-bottom: 6px;">
              🔗 Clustered duplicate of master ${c.masterTrackingId || ''}
            </div>` : ''}
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            <button id="track-btn-${c.trackingId}" style="flex: 1; padding: 5px; font-size: 11px; font-weight: 600; background: #2563eb; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
              Track Status
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`track-btn-${c.trackingId}`);
        if (btn) {
          btn.onclick = () => {
            if (onTrackTrackingId) onTrackTrackingId(c.trackingId);
          };
        }
      });

      markersGroupRef.current.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid() && complaints.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [complaints]);

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 4.25rem)', width: '100%' }}>
      {/* Filter Floating Overlay Header */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 500,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        padding: '0.75rem 1.25rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
          <Filter size={16} color="#2563eb" />
          <span>Filters:</span>
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
        >
          <option value="ALL">All Departments</option>
          <option value="ROADS">Roads & Infrastructure</option>
          <option value="WATER_SUPPLY">Water Supply</option>
          <option value="SANITATION">Sanitation & Waste</option>
          <option value="ELECTRICITY">Electricity & Lighting</option>
          <option value="HEALTH_SAFETY">Health & Safety</option>
          <option value="PARKS">Parks & Recreation</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted / Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {/* Duplicate Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDuplicatesOnly}
            onChange={(e) => setShowDuplicatesOnly(e.target.checked)}
          />
          <span>Show Clustered Duplicates Only</span>
        </label>

        {/* Complaint Count Badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            {loading ? 'Refreshing...' : `${complaints.length} Geotagged Complaints`}
          </span>
          <button
            onClick={loadComplaints}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.6rem' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 500,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(6px)',
        padding: '0.85rem 1rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        fontSize: '0.75rem'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
          Map Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <span>Open / Submitted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308' }} />
            <span>In Progress / Assigned</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            <span>Resolved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ background: '#dc2626', color: '#fff', fontSize: '9px', fontWeight: 800, borderRadius: '999px', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+3</span>
            <span>Master with Clustered Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};
