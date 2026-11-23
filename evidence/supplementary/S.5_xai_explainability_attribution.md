# Evidence 5.5: Explainable AI (XAI) and Feature Attribution Report

**Project:** CivicLens – Municipal Complaint Portal with Geotagging (Question 50 / P50)  
**Academic Module:** Phase 5 – AI-Powered Quality Assurance and Ethical Development  
**Syllabus Coverage ID:** ID 5.5  
**Status:** VERIFIED & DOCUMENTED  

---

## 1. Executive Summary
In municipal public administration, "black-box" machine learning predictions breed distrust among field engineers, department heads, and citizens. If an algorithm routes a complaint to the wrong department or clusters two distinct issues as duplicates without explanation, municipal officers cannot verify or correct the decision.

CivicLens incorporates **Explainable AI (XAI)** principles into both its department classifier and its duplicate detection engine, providing visible keyword attribution, confidence scores, and alternative category probabilities.

---

## 2. Department Routing XAI Architecture

### 2.1 Keyword Feature Attribution
When a citizen submits a grievance, the NLP classifier extracts term frequencies, applies stemming, and matches tokens against municipal category dictionaries. The system returns the exact tokens that contributed to the classification:

```json
{
  "predictedDepartment": "ROADS",
  "confidenceScore": 0.88,
  "explainabilityKeywords": ["pothol", "asphalt", "crater", "vehicl"],
  "alternative": {
    "department": "SANITATION",
    "confidenceScore": 0.08
  }
}
```

### 2.2 UI Explainability Widgets
In the staff triage dashboard (`StaffTriagePage.jsx`) and complaint submission view (`SubmitComplaintPage.jsx`), these keywords are rendered as interactive hashtag pills:
- *Visual Representation:* `Suggested Routing: [ROADS] (88% confidence) based on keywords: #pothol, #asphalt, #crater`
- *Staff Agency:* Municipal officers can inspect the contributing keywords and override the recommendation with a single click if unusual context warrants human judgment.

---

## 3. Duplicate Detection Explainability Architecture

When two complaints are clustered as duplicates, CivicLens generates a transparent mathematical explanation detailing both spatial and textual factors:

```json
{
  "isDuplicate": true,
  "clusterDecision": "LINKED_AS_CHILD_DUPLICATE",
  "spatialEvidence": {
    "geodesicDistanceMeters": 24.8,
    "distanceThresholdMeters": 75.0,
    "spatialStatus": "WITHIN_PROXIMITY"
  },
  "textualEvidence": {
    "hybridSimilarityScore": 0.73,
    "cosineScore": 0.76,
    "jaccardOverlap": 0.60,
    "similarityThreshold": 0.60,
    "overlappingKeywords": ["pothol", "damag", "road"]
  },
  "masterTicketReference": "CL-2026-IND001"
}
```

- **Verification:** Both citizen and municipal staff can see why the tickets were linked:
  * "Identified as duplicate of ticket CL-2026-IND001: Located 24.8m away (< 75m threshold) with 73% text similarity matching keywords '#pothol', '#damag'."

---

## 4. XAI Verification Test Results

The explainability output is formally verified by automated Jest tests in `backend/tests/aiEngine.test.js`:

```
========================================================================================
XAI AUTOMATED TEST ASSERTIONS
========================================================================================
PASS  tests/aiEngine.test.js
  Text Similarity & Explainability
    √ should return overlapping keywords for explainability (1 ms)
    √ should calculate high cosine similarity for semantically identical complaints (1 ms)
    √ should extract common stem tokens across paraphrased civic descriptions (1 ms)
========================================================================================
```

---

## 5. Academic Verification Checklist
- [x] Clear XAI architecture documented for both department routing and duplicate clustering.
- [x] Keyword feature attribution and confidence scoring schemas provided.
- [x] UI explainability widgets and human override mechanisms specified.
- [x] Automated test assertions validating explainability outputs verified.
