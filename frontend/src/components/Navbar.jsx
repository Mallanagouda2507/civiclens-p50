import React from 'react';
import {
  MapPin,
  PlusCircle,
  Search,
  LayoutDashboard,
  BarChart3,
  UserCheck,
  LogOut,
  ShieldAlert
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, user, onOpenAuth, onLogout }) => {
  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.25rem' }}>
        {/* Brand */}
        <div
          onClick={() => setActiveTab('map')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{ backgroundColor: '#2563eb', padding: '0.5rem', borderRadius: '0.5rem', color: '#fff', display: 'flex' }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Civic<span style={{ color: '#2563eb' }}>Lens</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
              Municipal Complaint Portal & AI Geotagging
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setActiveTab('map')}
            className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MapPin size={16} />
            <span>Civic Map</span>
          </button>

          <button
            onClick={() => setActiveTab('submit')}
            className={`btn ${activeTab === 'submit' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <PlusCircle size={16} />
            <span>File Complaint</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Search size={16} />
            <span>Track Status</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <LayoutDashboard size={16} />
            <span>Staff Triage</span>
            {user && (user.role === 'staff' || user.role === 'admin') && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BarChart3 size={16} />
            <span>Analytics & SLA</span>
          </button>
        </nav>

        {/* User Auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {user.name}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#334155', fontSize: '0.65rem' }}>
                    {user.role}
                  </span>
                  {user.department && user.department !== 'GENERAL' && (
                    <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.65rem' }}>
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary">
              <UserCheck size={16} />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
