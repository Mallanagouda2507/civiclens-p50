# CivicLens: Municipal Complaint Portal with Geotagging
## Phase 5: AI-Powered Quality Assurance and Ethical Development

**Course Module:** Phase 5 – AI Quality Assurance, Security, and Ethical Governance  
**Project Identifier:** Question 50 (P50)  
**Version:** 1.0.0  
**Date:** November 2026  

---

## 1. Security Analysis & OWASP Top 10 Audit

CivicLens was audited against the **OWASP Top 10 Web Application Security Vulnerabilities** to ensure robust municipal deployment readiness.

```
========================================================================================
OWASP Risk Category              Mitigation Mechanism in CivicLens           Status
========================================================================================
A01: Broken Access Control       JWT role-based gating (protect, authorize)  VERIFIED SECURE
A02: Cryptographic Failures      bcrypt salt rounds (10), JWT HS256 expiry   VERIFIED SECURE
A03: Injection (NoSQL / SQL)     Mongoose ODM type casting & input scrub    VERIFIED SECURE
A04: Insecure Design             Dual-gate duplicate clustering (dist+text)  VERIFIED SECURE
A05: Security Misconfiguration   Environment variables via .env & defaults   VERIFIED SECURE
A06: Vulnerable Components       npm audit check, zero critical CVEs         VERIFIED SECURE
A07: Identification & Auth       24h token expiry, unique lowercase emails   VERIFIED SECURE
A08: Software & Data Integrity   Immutable audit trail logs for all changes  VERIFIED SECURE
A09: Logging & Telemetry         Structured error handling & /api/health     VERIFIED SECURE
A10: Server-Side Request Forgery Internal API isolation, no unsanitized URL  VERIFIED SECURE
========================================================================================
```

---

## 2. Algorithmic Bias & Spatial Fairness in Civic Tech

Deploying automated machine learning and geospatial clustering in municipal governance introduces serious ethical considerations that must be actively audited and mitigated.

### 2.1 Spatial Reporting Disparity & Digital Divide
- **The Problem:** Affluent urban wards with high smartphone literacy and tech familiarity typically submit significantly more digital complaints than low-income or informal settlements. If municipal triage algorithms prioritize areas purely based on complaint volume, public infrastructure funding risks being disproportionately funneled to already privileged neighborhoods.
- **CivicLens Mitigation:**
  1. The platform calculates **per-capita and locality-normalized density**, rather than raw complaint counts.
  2. Urgent priority flags (`HIGH`, `URGENT`) are assigned based on hazard severity (e.g., open high-voltage transformers or contaminated tap water) rather than ticket density alone.
  3. Municipal staff can filter by geographical ward to ensure equitable resource distribution regardless of submission volume.

---

### 2.2 Fairness in Duplicate Complaint Clustering
- **The Problem:** If an automated duplicate clustering engine is overly aggressive, it might wrongfully merge two distinct citizen grievances (e.g., two different potholes on opposite ends of a long street), effectively silencing the second citizen's voice and leaving one hazard unrepaired.
- **CivicLens Mitigation:**
  1. **Dual-Condition Gating:** Text similarity is never evaluated in isolation. A strict spatial distance threshold of $D \le 75\text{ meters}$ must be satisfied first.
  2. **Non-Destructive Clustering:** When a complaint is tagged as a duplicate, it is *not deleted*. It is stored with its full payload and linked to the master ticket as a child duplicate.
  3. **Priority Elevation:** Instead of suppressing duplicates, each additional linked duplicate increments `duplicateCount` and elevates master ticket urgency, honoring citizen endorsements.

---

### 2.3 Department Routing Explainability (XAI)
- **The Problem:** Black-box machine learning models that assign complaints without explanation cause distrust among municipal officers, who may reject or dispute the automated routing.
- **CivicLens Mitigation:**
  Every routing recommendation provides full transparency:
  ```json
  {
    "predictedDepartment": "ROADS",
    "departmentConfidence": 0.88,
    "routingKeywords": ["pothol", "asphalt", "crater"],
    "alternative": {
      "department": "SANITATION",
      "confidence": 0.08
    }
  }
  ```
  The user interface clearly presents the contributing keywords (e.g., `#pothol`, `#asphalt`) so staff understand *why* the classification occurred.

---

## 3. Privacy, Geotag Governance & Data Protection (GDPR / DPDP)

Municipal complaints inherently involve location telemetry that can inadvertently compromise citizen privacy if mishandled.

### 3.1 Residential Coordinate Protection
- **Vulnerability:** If a citizen files a complaint about a domestic issue (e.g., domestic water pressure or residential meter defect) and the exact GPS coordinates pinpoint their private residence on a public map, bad actors could infer private residential details.
- **CivicLens Architecture:**
  - **Public Map View (`GET /api/complaints/map`):** Coordinates displayed on public interactive maps are intended for civic public spaces. Public views suppress citizen personal contact details (phone numbers, personal emails).
  - **Staff Triage View:** Only authenticated municipal staff can view reporter contact details for verification and work-order resolution follow-up.
  - **Data Minimization:** Citizens have the option to file grievances as "Anonymous Citizen" without providing mandatory phone or email identifiers.

### 3.2 Immutable Audit Trail & Accountability
To prevent corruption, tampering, or silent closure of inconvenient complaints, CivicLens records an append-only audit trail for every status transition:
- Date and time of update
- Identity and role of the officer who made the change
- Official remarks and mandatory resolution notes
- Publicly verifiable by the citizen using the tracking reference ID.

---

## 4. Academic Syllabus Coverage Summary (Phases 1 - 5)

| Syllabus Coverage ID | Academic Requirement | Deliverable File Location | Verification Evidence |
|---|---|---|---|
| **Phase 1 (P1.1 - P1.4)** | Foundations of AI in SE, SRS, Feasibility | `docs/phase1_introduction_and_srs.md` | Problem definition, traditional vs AI comparison, IEEE-standard SRS. |
| **Phase 2 (P2.1 - P2.4)** | Agile Planning, AI Story Point Estimation | `docs/phase2_agile_planning_and_estimation.md` | INVEST user stories, Planning Poker vs AI comparison, Gantt schedule, risk matrix. |
| **Phase 3 (P3.1 - P3.4)** | AI Development Practices, CI/CD, Docker | `docs/phase3_development_practices_and_ai_logs.md`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` | Recorded AI prompt logs, human refactoring notes, multi-container Docker compose. |
| **Phase 4 (P4.1 - P4.4)** | AI Testing, Synthetic Data, Monitoring | `docs/phase4_testing_and_monitoring_report.md`, `tests/*.test.js`, `backend/scripts/seed.js` | 41 passing automated tests, boundary checks, Bangalore seed data generator. |
| **Phase 5 (P5.1 - P5.4)** | Security Audit, Spatial Bias, Privacy, XAI | `docs/phase5_qa_ethics_and_governance.md` | OWASP Top 10 evaluation, spatial fairness analysis, geotag privacy protections, XAI. |
