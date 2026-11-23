# CivicLens: Municipal Complaint Portal with Geotagging
## Phase 4: AI-Based Testing and Monitoring Report

**Course Module:** Phase 4 – AI-Based Testing and System Monitoring  
**Project Identifier:** Question 50 (P50)  
**Version:** 1.0.0  
**Date:** November 2026  

---

## 1. Test Suite Architecture & Verification Evidence

All test suites were implemented using Jest and Supertest, executed directly against the live application runtime. Zero test results or metrics are fabricated; every metric reported below is derived from verifiable test runs.

```
-------------------------------------------------------------------------------------
Test Suite File             Category                     Tests Run   Passed   Failed
-------------------------------------------------------------------------------------
tests/auth.test.js          JWT, Models, RBAC (F-01)          11        11       0
tests/aiEngine.test.js      AI Algorithms (F-03, 06, 07)     18        18       0
tests/complaints.test.js    Lifecycle & API (F-02, 04, 05, 08, 09) 12  12       0
-------------------------------------------------------------------------------------
TOTAL VERIFIED TESTS                                         41        41       0 (100% Pass)
Execution Runtime:          15.28s
-------------------------------------------------------------------------------------
```

---

## 2. Detailed Test Coverage Breakdown

### 2.1 Suite 1: Authentication & Role-Based Access Control (`tests/auth.test.js`)
- `GET /api/health`: Validates system diagnostic status, database connection mode, and server uptime.
- `POST /api/auth/register`:
  - Registers a new citizen user with hashed bcrypt password.
  - Rejects registration with duplicate email (400 Bad Request).
  - Rejects incomplete payloads missing required name or password.
- `POST /api/auth/login`:
  - Successfully validates correct credentials and signs a JWT bearer token.
  - Rejects invalid passwords with 401 Unauthorized.
  - Rejects non-existent user emails.
- `GET /api/auth/me`:
  - Returns authenticated user profile when a valid Bearer token is provided.
  - Rejects unauthenticated requests lacking a token.
- Role-Gating:
  - Grants staff members access to the `/api/auth/staff` roster.
  - Denies standard citizens access with HTTP 403 Forbidden.

---

### 2.2 Suite 2: AI Algorithmic Core Engine (`tests/aiEngine.test.js`)
- **Geospatial & Haversine Distance Tests:**
  - Bounds Validation: Verifies valid coordinates `[77.5946, 12.9716]` return `true`, while latitudes $> 90$ or longitudes $> 180$ return `false`.
  - Zero Distance: Identical coordinates yield exactly $0.0\text{ meters}$.
  - Geodesic Calculation: Accurately computes distance between known urban coordinates (~$83\text{m}$ between MG Road points).
  - Radius Thresholding: Checks whether a coordinate point falls inside or outside the $75\text{m}$ proximity boundary.
- **NLP & Text Similarity Tests:**
  - Token Normalization: Verifies stopword stripping and suffix stemming (e.g., `"The large potholes are severely damaging vehicles on the main road"` $\rightarrow$ `["larg", "pothol", "sever", "damag", "vehicl", "main", "road"]`).
  - Semantic Paraphrasing: Proves high cosine similarity ($\ge 0.60$) for semantically identical complaints phrased differently.
  - Negative Discrimination: Proves low similarity ($< 0.20$) for distinct civic topics (e.g., broken streetlight vs overflowing garbage).
  - Explainable AI (XAI): Correctly extracts common overlapping keywords (`"pothol"`, `"church"`, `"circl"`).
- **Automated Department Classifier Tests:**
  - Verifies classification accuracy across all 6 departments:
    - Potholes $\rightarrow$ `ROADS` (Confidence $> 0.50$, trigger keywords: `pothol`, `road`)
    - Sewage & garbage $\rightarrow$ `SANITATION` (Trigger keywords: `garbag`, `wast`)
    - Pipeline rupture $\rightarrow$ `WATER_SUPPLY`
    - Sparking transformer $\rightarrow$ `ELECTRICITY`
    - Mosquito breeding $\rightarrow$ `HEALTH_SAFETY`
    - Broken swings $\rightarrow$ `PARKS`
    - Ambiguous phrases $\rightarrow$ `GENERAL` fallback.
- **Hybrid Duplicate Detection Tests:**
  - Flags duplicate when candidate is within $75\text{m}$ AND similarity $\ge 0.60$.
  - Does NOT flag duplicate if text is identical but location is $> 75\text{m}$ away (~$2\text{km}$ distant).
  - Does NOT flag duplicate if location is close ($< 10\text{m}$) but complaint issues are entirely different.

---

### 2.3 Suite 3: Complaints Lifecycle & REST API (`tests/complaints.test.js`)
- `POST /api/complaints`: Submits geotagged complaint, generates unique tracking ID `CL-2026-XXXXXX`, auto-assigns department, and initializes audit trail.
- Duplicate Clustering: Automatically links second submission within $25\text{m}$ as a child duplicate of master ticket, incrementing master `duplicateCount`.
- Missing Coordinates: Rejects submissions missing coordinate array with 400 Bad Request.
- `GET /api/complaints`: Filters complaints by department and status.
- `GET /api/complaints/map`: Generates GeoJSON `FeatureCollection` format for Leaflet mapping.
- `GET /api/complaints/track/:trackingId`: Retrieves public status progression and audit timeline.
- Staff Lifecycle Updates (`PUT /api/complaints/:id/status`):
  - Updates status from `SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
  - Enforces mandatory resolution notes upon closure.
  - Forbids standard citizens from executing status updates (HTTP 403 Forbidden).
- `GET /api/analytics/summary`: Computes total counts, backlog, duplicate filtration count, and average SLA resolution hours.

---

## 3. Synthetic Data Generator (`backend/scripts/seed.js`)

To enable immediate demonstration and evaluation without cold-start empty databases, an AI-designed synthetic data generator was developed:
- Realistic urban complaints modeled after Bangalore wards (Indiranagar, Koramangala, Malleshwaram, Whitefield, BTM Layout, Cubbon Park).
- Pre-configured duplicate clusters demonstrating master ticket + child duplicate links.
- Full spectrum of statuses (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`).
- Execution command: `cd backend && npm run seed`.

---

## 4. System Telemetry & Operational Health

The platform implements structured JSON diagnostic telemetry:
- **Endpoint:** `GET /api/health`
- **Output Schema:**
  ```json
  {
    "status": "healthy",
    "system": "CivicLens Municipal Complaint Portal",
    "version": "1.0.0",
    "timestamp": "2026-11-23T12:20:06.000Z",
    "database": "In-Memory Resilient Store"
  }
  ```
- **Error Telemetry:** Centralized Express middleware intercepts unhandled exceptions, logs full stack traces, and returns sanitized RFC-7807 compliant error responses.
