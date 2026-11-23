import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'citizen',
    department: 'GENERAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({
        email: formData.email,
        password: formData.password
      });

      if (res.success) {
        localStorage.setItem('civiclens_token', res.token);
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register(formData);
      if (res.success) {
        localStorage.setItem('civiclens_token', res.token);
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error connecting to registration server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ email, password });
      if (res.success) {
        localStorage.setItem('civiclens_token', res.token);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {tab === 'login' ? 'Sign In to CivicLens' : 'Create Citizen Account'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
            Access municipal complaint tracking and GIS reporting
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid #2563eb' : 'none',
              color: tab === 'login' ? '#2563eb' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid #2563eb' : 'none',
              color: tab === 'register' ? '#2563eb' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. citizen@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Aarav Sharma"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="aarav@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Password (min 6 chars)
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Mobile Phone (optional)
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}

        {/* Demo Fast Login Shortcuts */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.65rem', textAlign: 'center' }}>
            ⚡ Instant Academic Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => handleDemoLogin('citizen@example.com', 'CitizenPassword123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              👤 Citizen Demo
            </button>
            <button
              onClick={() => handleDemoLogin('roads@civiclens.gov', 'StaffPassword123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              🚧 Roads Staff
            </button>
            <button
              onClick={() => handleDemoLogin('sanitation@civiclens.gov', 'StaffPassword123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              🧹 Sanitation Staff
            </button>
            <button
              onClick={() => handleDemoLogin('admin@civiclens.gov', 'AdminPassword123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              🏛️ Admin Officer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
