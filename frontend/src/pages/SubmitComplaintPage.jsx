import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPicker } from '../components/MapPicker';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  MapPin,
  Building2,
  FileText,
  User,
  Phone,
  Image,
  ArrowRight
} from 'lucide-react';

export const SubmitComplaintPage = ({ user, onComplaintSubmitted, onTrackTrackingId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'AUTO',
    category: 'Civic Infrastructure',
    priority: 'MEDIUM',
    address: 'Indiranagar 100ft Road, Bengaluru',
    landmark: '',
    citizenName: user ? user.name : '',
    citizenEmail: user ? user.email : '',
    citizenPhone: user ? user.phone || '' : '',
    imageUrl: ''
  });

  // Coordinates: default Bengaluru center [lng, lat]
  const [coordinates, setCoordinates] = useState([77.6412, 12.9784]);

  // AI Live Insights
  const [aiPrediction, setAiPrediction] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Debounced AI classification and duplicate detection
  useEffect(() => {
    if (!formData.description && !formData.title) {
      setAiPrediction(null);
      setDuplicateAlert(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzingAi(true);
      try {
        // 1. Predict Department
        const predRes = await api.predictDepartment(formData.title, formData.description);
        if (predRes.success) {
          setAiPrediction(predRes.prediction);
        }

        // 2. Check Duplicates if coordinates exist
        if (coordinates && coordinates.length === 2 && formData.description.length > 10) {
          const dupRes = await api.checkDuplicate({
            coordinates,
            title: formData.title,
            description: formData.description
          });
          if (dupRes.success && dupRes.result.isDuplicate) {
            setDuplicateAlert(dupRes.result);
          } else {
            setDuplicateAlert(null);
          }
        }
      } catch (err) {
        console.warn('AI analysis error:', err);
      } finally {
        setAnalyzingAi(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, coordinates]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        coordinates,
        department: formData.department === 'AUTO' && aiPrediction
          ? aiPrediction.department
          : formData.department
      };

      const res = await api.createComplaint(payload);

      if (res.success) {
        setSuccessResult(res);
        if (onComplaintSubmitted) onComplaintSubmitted(res.complaint);
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error connecting to complaint server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    const { complaint, aiInsights } = successResult;
    return (
      <div className="container" style={{ padding: '3rem 1.25rem', maxWidth: '680px' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Grievance Lodged Successfully!
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your municipal complaint has been geotagged and dispatched to the department triage queue.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tracking ID</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#2563eb', fontSize: '1rem' }}>
                {complaint.trackingId}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Department</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{complaint.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Location Geotag</span>
              <span style={{ fontSize: '0.85rem' }}>{complaint.address}</span>
            </div>
            {complaint.isDuplicate && (
              <div style={{ background: '#fef3c7', padding: '0.65rem', borderRadius: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#92400e' }}>
                ⚡ <strong>Clustered Duplicate:</strong> Linked with active master ticket <strong>{complaint.masterTrackingId}</strong> ({Math.round((complaint.similarityScore || 0) * 100)}% similarity, {complaint.distanceMeters}m away). Urgency weight elevated.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => onTrackTrackingId(complaint.trackingId)}
              className="btn btn-primary"
            >
              <span>Track Resolution Status</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => { setSuccessResult(null); setFormData(prev => ({ ...prev, title: '', description: '' })); }}
              className="btn btn-secondary"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          File a Municipal Grievance
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Pinpoint the issue on the map. Our AI engine automatically checks for existing duplicate reports and routes to the correct department.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.75rem' }}>
        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Duplicate Alert Banner */}
          {duplicateAlert && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderLeft: '4px solid #f59e0b',
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.85rem' }}>
                <AlertTriangle size={18} />
                <span>Notice: Existing Similar Report Detected</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '0.35rem' }}>
                A grievance matching your description was previously reported <strong>{duplicateAlert.distanceMeters}m away</strong> ({duplicateAlert.masterComplaint.trackingId}: "{duplicateAlert.masterComplaint.title}").
              </p>
              <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.35rem', fontWeight: 600 }}>
                💡 Submitting will link your report to the master cluster, elevating priority and avoiding duplicate municipal work orders.
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Complaint Title *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Deep pothole causing accidents near main junction"
              value={formData.title}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Detailed Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe the issue, severity, and any hazards..."
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          {/* Geotagging Map Section */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Geotag Location (Interactive Map) *
            </label>
            <MapPicker
              coordinates={coordinates}
              onChangeCoordinates={setCoordinates}
              onAddressResolved={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Locality / Street Address *
            </label>
            <input
              type="text"
              name="address"
              required
              placeholder="Street name, cross, or landmark"
              value={formData.address}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Your Name
              </label>
              <input
                type="text"
                name="citizenName"
                placeholder="Citizen Name"
                value={formData.citizenName}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <input
                type="text"
                name="citizenPhone"
                placeholder="+91 98765 43210"
                value={formData.citizenPhone}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Photo URL / Simulated Attachment (optional)
            </label>
            <input
              type="text"
              name="imageUrl"
              placeholder="https://example.com/pothole-photo.jpg"
              value={formData.imageUrl}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <Send size={18} />
            <span>{submitting ? 'Submitting & Routing...' : 'Submit Geotagged Complaint'}</span>
          </button>
        </form>

        {/* Right AI Sidebar & Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI Live Assistant Card */}
          <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={18} color="#2563eb" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                AI Assistant & Smart Triage
              </h3>
            </div>

            {analyzingAi && (
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                Analyzing text features and spatial proximity...
              </div>
            )}

            {aiPrediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Predicted Department</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      {aiPrediction.departmentName}
                    </span>
                    <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                      {Math.round(aiPrediction.confidence * 100)}% match
                    </span>
                  </div>
                </div>

                {aiPrediction.keywords && aiPrediction.keywords.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>
                      Explainability Keywords (XAI)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {aiPrediction.keywords.map((kw, i) => (
                        <span key={i} style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontSize: '0.75rem', color: '#334155' }}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Start typing your complaint description to see real-time AI department suggestions and duplicate detection.
              </p>
            )}
          </div>

          {/* Academic Info Box */}
          <div className="card" style={{ padding: '1.25rem', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Algorithmic Governance (P50)
            </h4>
            <ul style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.1rem' }}>
              <li><strong>Geotagging:</strong> Exact coordinates captured via Leaflet/GPS.</li>
              <li><strong>Spatial Clustered Duplicates:</strong> Haversine distance threshold $\le 75\text{m}$.</li>
              <li><strong>Text Similarity:</strong> TF-IDF cosine score $\ge 0.60$.</li>
              <li><strong>Department Routing:</strong> Multinomial Naive Bayes classifier.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
