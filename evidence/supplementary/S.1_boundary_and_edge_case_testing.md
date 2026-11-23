# Evidence 4.6: Boundary Analysis and Edge-Case Testing Log

**Project:** CivicLens – Municipal Complaint Portal with Geotagging (Question 50 / P50)  
**Academic Module:** Phase 4 – AI-Based Testing and Monitoring  
**Syllabus Coverage ID:** ID 4.6  
**Status:** VERIFIED & DOCUMENTED  

---

## 1. Executive Summary
Municipal GIS and machine learning systems face severe failure risks when presented with boundary conditions: coordinate wrapping, zero distances, extreme latitudes, empty strings, and adversarial text injection.

This document records the boundary analysis and edge-case testing conducted for CivicLens, detailing test vectors, mathematical expectations, and actual test suite assertions.

---

## 2. Boundary Value Analysis (BVA) Matrix

| Dimension | Minimum Valid | Just Below Min (Invalid) | Nominal Value | Just Above Max (Invalid) | Maximum Valid |
|---|:---:|:---:|:---:|:---:|:---:|
| **Latitude ($\phi$)** | $-90.0^\circ$ (South Pole) | $-90.0001^\circ$ (Out of bounds) | $12.9716^\circ$ (Bengaluru) | $+90.0001^\circ$ (Out of bounds) | $+90.0^\circ$ (North Pole) |
| **Longitude ($\lambda$)** | $-180.0^\circ$ (Date Line) | $-180.0001^\circ$ (Out of bounds) | $77.5946^\circ$ (Bengaluru) | $+180.0001^\circ$ (Out of bounds) | $+180.0^\circ$ (Date Line) |
| **Proximity Distance** | $0.0\text{ meters}$ (Co-located) | - | $35.0\text{ meters}$ | $75.01\text{ meters}$ (Pruned) | $75.00\text{ meters}$ (Duplicate Gate) |
| **Text Similarity** | $0.00$ (No overlap) | - | $0.72$ (Paraphrased) | - | $1.00$ (Identical text) |
| **Password Length** | 6 characters | 5 characters (Rejected 400) | 12 characters | - | 128 characters |

---

## 3. Critical Edge-Case Test Scenarios & Results

### Scenario 1: Identical Geographic Coordinates ($d = 0.0\text{m}$)
- **Test Vector:** Point A: `[77.6412, 12.9784]`, Point B: `[77.6412, 12.9784]`.
- **Potential Failure:** IEEE 754 floating point arithmetic in $\arcsin(\sqrt{a})$ can produce minute non-zero values (e.g. $10^{-12}$) or `NaN` due to domain bounds ($a > 1$).
- **Mitigation & Assertion:** Clamped $a = \min(1, \max(0, a))$ and applied `Math.round(dist * 100) / 100`.
- **Verified Result:** Returned exactly `0` meters. **PASSED** (`tests/aiEngine.test.js`).

### Scenario 2: Proximity Boundary Threshold Clamping ($74.9\text{m}$ vs $75.1\text{m}$)
- **Test Vector 1:** Points separated by $74.9\text{m}$ with matching text -> **FLAGGED AS DUPLICATE (PASS)**.
- **Test Vector 2:** Points separated by $75.1\text{m}$ with matching text -> **NOT FLAGGED AS DUPLICATE (PASS)** (Stage 1 spatial gate correctly pruned).

### Scenario 3: Semantic Threshold Clamping ($0.59$ vs $0.60$)
- **Test Vector 1:** Score $0.59$ -> Not clustered as duplicate.
- **Test Vector 2:** Score $0.61$ -> Linked as duplicate child ticket.
- **Verified Result:** Deterministic clustering behavior confirmed.

### Scenario 4: Coordinate Antimeridian & Polar Extremities
- **Test Vector:** Submissions with latitude $90^\circ$ (North Pole) and longitude $180^\circ$ (International Date Line).
- **Verified Result:** Validation passes and accurately calculates geodesic arc distance without arithmetic exceptions.

### Scenario 5: Adversarial Inputs & Empty Strings
- **Test Vector 1:** Description containing empty string `""` or whitespace `"   "`.
  - *Result:* Controller rejects with HTTP 400 Bad Request before calling NLP engines.
- **Test Vector 2:** Coordinate array with `NaN` or non-numeric types: `["invalid", 12.97]`.
  - *Result:* Validation helper returns `false`; rejected with HTTP 400.
- **Test Vector 3:** SQL / NoSQL injection attempts (`{"$gt": ""}`).
  - *Result:* Mongoose and in-memory store cast parameters strictly, preventing injection attacks.

---

## 4. Academic Verification Checklist
- [x] Standard Boundary Value Analysis (BVA) matrix constructed.
- [x] 5 critical edge cases tested and verified against live code.
- [x] Mathematical stability near zero distances confirmed.
