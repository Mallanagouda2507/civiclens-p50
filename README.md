# CivicLens – Municipal Complaint Portal with Geotagging
> **Assignment Reference:** Question 50 (P50) | AI in Software Engineering Integrated Project Handbook

CivicLens is an AI-augmented municipal grievance redressal and spatial intelligence platform. It bridges citizens and city administrators by enabling geotagged complaint reporting, interactive map-based visual triage, automated department routing, and hybrid spatial-textual duplicate complaint clustering.

---

## 🏛️ System Architecture Overview

```
                                  +---------------------------------------------+
                                  |         CivicLens Web Application           |
                                  |     (React, Vite, Tailwind, Leaflet)       |
                                  +----------------------+----------------------+
                                                         |
                                                 HTTPS / REST API
                                                         |
                                  +----------------------v----------------------+
                                  |          Node.js / Express Server           |
                                  +----------------------+----------------------+
                                                         |
            +--------------------------------------------+--------------------------------------------+
            |                                            |                                            |
+-----------v------------+                   +-----------v------------+                   +-----------v------------+
|  JWT & RBAC Controller |                   |  Geospatial AI Engine  |                   |   NLP Routing Engine   |
| (Citizens, Staff, Admin)                   | (Haversine Spatial Cl.)|                   | (TF-IDF & Naive Bayes) |
+-----------+------------+                   +-----------+------------+                   +-----------+------------+
            |                                            |                                            |
            +--------------------------------------------+--------------------------------------------+
                                                         |
                                  +----------------------v----------------------+
                                  |      MongoDB Database (2dsphere Index)      |
                                  |     (Fallback: Embedded In-Memory DB)       |
                                  +---------------------------------------------+
```

---

## 🚀 Key Capabilities

1. **Citizen Geotagged Reporting:** Capture exact coordinates via HTML5 Geolocation API or interactive Leaflet pin-drop selector.
2. **Interactive Geospatial Visualization:** Real-time map with status color-coding, marker clustering, category filtering, and jurisdiction bounds.
3. **AI Duplicate Complaint Clustering:** Dual-criteria clustering combining spatial proximity (Haversine formula within $\le 75\text{ m}$) and lexical similarity (TF-IDF Cosine Similarity $\ge 0.65$).
4. **Automated Department Classification:** Intelligent routing of complaints into 6 municipal departments (*Roads & Infrastructure*, *Water Supply*, *Sanitation & Waste*, *Electricity & Street Lighting*, *Health & Safety*, *Parks & Public Spaces*).
5. **Full Lifecycle Status Tracking:** State machine transition tracking with immutable audit trail logs and public tracking IDs.
6. **Municipal Staff & Admin Triage:** Filter by department, priority, duplicate clusters, and SLA status.
7. **Academic Modules Coverage:** Complete documentation and implementation across all 5 syllabus phases (Introduction to AI in SE, Agile Planning & Estimation, AI Development & Deployment, AI Testing & Monitoring, QA & Ethics).

---

## 📂 Repository Structure

```
civiclens/
├── backend/
│   ├── config/              # Database and environment configurations
│   ├── controllers/         # Request handling logic (auth, complaints, analytics)
│   ├── middleware/          # JWT auth, role validation, error handling
│   ├── models/              # Mongoose schemas (User, Complaint, AuditLog)
│   ├── routes/              # Express API routes
│   ├── services/            # AI services (Haversine distance, TF-IDF cosine similarity, NLP classifier)
│   └── server.js            # Express application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/      # Map, Navbar, Triage, Forms, Modals
│   │   ├── pages/           # Home, Submit, MapView, Track, Dashboard, Analytics
│   │   ├── services/        # API client and auth state
│   │   └── App.jsx
├── docs/                    # Phase 1-5 Academic Documentation
│   ├── phase1_introduction_and_srs.md
│   ├── phase2_agile_planning_and_estimation.md
│   ├── phase3_development_practices_and_ai_logs.md
│   ├── phase4_testing_and_monitoring_report.md
│   └── phase5_qa_ethics_and_governance.md
└── tests/                   # Unit, Integration, and AI Algorithmic Test Suites
```

---

## ⚙️ Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
# Starts on http://localhost:5000 (MongoDB auto-connects with in-memory fallback)
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:5173
```

### Run Automated Tests
```bash
cd backend
npm test
```
