import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ComplaintsMap } from './components/ComplaintsMap';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'submit' | 'track' | 'staff' | 'analytics'
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState('');

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('civiclens_token');
    if (token) {
      api.getMe().then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('civiclens_token');
        }
      }).catch(() => {
        localStorage.removeItem('civiclens_token');
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('civiclens_token');
    setUser(null);
  };

  const handleTrackTrackingId = (id) => {
    setActiveTrackingId(id);
    setActiveTab('track');
  };

  const handleComplaintSubmitted = (newComplaint) => {
    // Optionally jump to track page or reload map
    setActiveTrackingId(newComplaint.trackingId);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'map' && (
          <ComplaintsMap
            onTrackTrackingId={handleTrackTrackingId}
          />
        )}

        {activeTab === 'submit' && (
          <SubmitComplaintPage
            user={user}
            onComplaintSubmitted={handleComplaintSubmitted}
            onTrackTrackingId={handleTrackTrackingId}
          />
        )}

        {activeTab === 'track' && (
          <TrackComplaintPage
            initialTrackingId={activeTrackingId}
            onSelectComplaint={(c) => handleTrackTrackingId(c.trackingId)}
          />
        )}

        {activeTab === 'staff' && (
          <StaffDashboardPage
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onTrackTrackingId={handleTrackTrackingId}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => setUser(authedUser)}
      />
    </div>
  );
}
