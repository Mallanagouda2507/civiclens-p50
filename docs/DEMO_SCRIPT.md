# CivicLens: Municipal Complaint Portal with Geotagging
## 3-Minute Practical Demonstration Video Script (Question 50 / P50)

**Target Video Duration:** Exactly 180 Seconds (3 Minutes 00 Seconds)  
**Resolution / Aspect Ratio:** 1080p Full HD (1920x1080), 16:9 Widescreen  
**Audio Track:** Spoken Voiceover (Clear, Academic, Confident Pace)  
**Application Environment:** Live Unified CivicLens Server (`http://localhost:5174`)  
**Prerequisites:** Terminal with backend tests ready, Google Chrome browser open.  

---

## Timeline & Scene Overview

```
[ 0:00 - 0:15 ] Scene 1: Problem Definition & Urban Municipal Context      (15s)
[ 0:15 - 1:00 ] Scene 2: System Architecture, Tech Stack & Five Phases     (45s)
[ 1:00 - 2:30 ] Scene 3: Live Application Demonstration (Citizen & Staff)   (90s)
[ 2:30 - 3:00 ] Scene 4: Automated Testing Results, Coverage & SQA Outcomes (30s)
---------------------------------------------------------------------------------
TOTAL TIME:     3 Minutes (180 Seconds)
```

---

## Detailed Chronological Recording Script

### Scene 1: Problem Introduction (0:00 – 0:15 | 15 Seconds)

- **Visual on Screen:**  
  Title Card: *"CivicLens (P50) – Municipal Complaint Portal with Geotagging"*  
  Split screen showing urban road pothole photograph juxtaposed with a chaotic legacy complaint portal showing dozens of duplicate text tickets.
- **Voiceover (Audio):**  
  *"Municipal grievance portals suffer from three fatal flaws: citizens submit vague text addresses without coordinates, identical street defects cause duplicate ticket floods, and manual triage causes departmental misrouting. CivicLens solves this by combining interactive GIS geotagging with an AI-driven dual-stage duplicate detection engine."*
- **Visual Transition (0:15):**  
  Smooth dissolve into high-level architecture diagram.

---

### Scene 2: System Architecture & Course Phases (0:15 – 1:00 | 45 Seconds)

- **Visual on Screen:**  
  Animated Mermaid architecture diagram showing the four tiers:  
  `React 18 + Leaflet UI` $\rightarrow$ `Express REST API` $\rightarrow$ `Haversine & TF-IDF AI Core` $\rightarrow$ `Dual-Mode Store (MongoDB / In-Memory)`.  
  Lower third banner highlighting: *"Demonstrating All Five Course Phases (IDs 1.1 to 5.6)"*.
- **Voiceover (Audio):**  
  *"Built independently for Question 50, CivicLens integrates AI across all five software engineering phases:*  
  *In Phase 1, we established an IEEE 830 SRS and process justification.*  
  *In Phase 2, we authored 20 INVEST user stories and executed two official one-week Scrum sprints.*  
  *In Phase 3, we scaffolded spherical Haversine math and TF-IDF cosine similarity in native Node.js, backed by Docker and Jenkins CI.*  
  *In Phase 4, we built an automated test harness with 84.25% line coverage and a headless Selenium Page-Object Model suite.*  
  *And in Phase 5, we audited Responsible AI—normalizing complaint density and protecting residential coordinates under the DPDP Act."*
- **Visual Transition (1:00):**  
  Switch screen recording to open Google Chrome window at `http://localhost:5174`.

---

### Scene 3: Live Application Demonstration (1:00 – 2:30 | 90 Seconds)

#### Part A: Citizen Geotagged Intake & Interactive Leaflet Picker (1:00 – 1:30 | 30s)
- **Exact Action on Screen:**
  1. Browser displays `http://localhost:5174/submit`.
  2. Presenter fills form fields:
     - Title: `Severe Asphalt Crater on 100ft Road`
     - Description: `Deep road pothole near Metro Pillar 82 damaging two-wheelers.`
  3. Presenter scrolls to interactive Leaflet map picker.
  4. Clicks directly on the map surface in Indiranagar, Bengaluru (`[77.6412, 12.9784]`).
  5. Pin-drop marker immediately renders; coordinate badges update reactively to `Lat: 12.9784, Lng: 77.6412`.
- **Voiceover (Audio):**  
  *"Here on the complaint submission view, a citizen enters the defect description. Instead of typing an ambiguous landmark, they click on the interactive Leaflet map or tap GPS. The pin-drop immediately anchors exact geographic coordinates."*

#### Part B: Real-Time AI Duplicate Warning & XAI Department Routing (1:30 – 1:55 | 25s)
- **Exact Action on Screen:**
  1. A yellow alert banner dynamically renders above the submit button:  
     `⚠️ Similar complaint already reported within 24.8 meters! (73% text match) – Master Ticket: CL-2026-IND001`.
  2. Presenter hovers over the AI prediction badge:  
     `Suggested Department: ROADS (Confidence: 88%) | Contributing Keywords: #pothol, #asphalt, #crater`.
  3. Presenter clicks **"Submit Geotagged Complaint"**.
  4. Instant green confirmation alert pops up displaying tracking reference ID: `CL-2026-D55057`.
- **Voiceover (Audio):**  
  *"Notice what just happened in real time: before submission, our two-stage engine calculated a Haversine distance of 24.8 meters—well within our 75-meter gate—and a 73% TF-IDF cosine similarity. It alerts the resident that this is a duplicate of ticket IND001. The supervised NLP classifier suggests the Roads department with 88% confidence based on keywords #pothol and #asphalt. Upon submission, the complaint is non-destructively linked to the master ticket, incrementing its municipal urgency."*

#### Part C: Municipal Staff Triage & Interactive Civic Map (1:55 – 2:30 | 35s)
- **Exact Action on Screen:**
  1. Presenter clicks navbar link **"Staff Triage"** (`http://localhost:5174/staff`).
  2. Applies filter dropdown: `Department: ROADS`, `Status: SUBMITTED`.
  3. Opens master ticket `CL-2026-IND001`.
  4. Demonstrates the cluster endorsement count (`duplicateCount: 2`) and shows both citizen reports.
  5. Clicks **"Update Status"** $\rightarrow$ selects `IN_PROGRESS`, enters remarks: `Field repair truck dispatched with asphalt patch mix`.
  6. Submits status update; audit trail timeline appends new entry with officer timestamp.
  7. Presenter navigates to **"Civic Map"** (`http://localhost:5174/map`).
  8. Interactive map renders with color-coded pins: Red (Open), Amber (In Progress), and Green (Resolved). Clicks the Indiranagar pin to display the interactive popup.
- **Voiceover (Audio):**  
  *"Switching to the Staff Triage view, the ward engineer filters pending work orders. They can inspect the clustered duplicate reports side-by-side, seeing total neighborhood impact without dealing with duplicate tickets. The officer updates the status to In Progress with mandatory remarks, updating the immutable audit trail. On the Civic Map, complaints render as dynamic, color-coded pins, giving city supervisors an instant geographic heatmap of urban defects."*
- **Visual Transition (2:30):**  
  Cut to terminal console window.

---

### Scene 4: Automated Testing Results & SQA Outcomes (2:30 – 3:00 | 30 Seconds)

- **Exact Action on Screen:**
  1. Terminal displays test execution command: `npm test`.
  2. Jest runner finishes in real time, displaying:  
     `Test Suites: 6 passed, 6 total | Tests: 70 passed, 70 total | Time: 19.15s`.
  3. Displays Jest coverage summary table:  
     `All files: 84.25% Lines | AI Services: 96.95% Lines`.
  4. Runs headless Selenium WebDriver Page-Object Model test: `node tests/selenium/runSeleniumTests.js`.
  5. Output confirms: `Total Actions: 5 | Passed: 5 | Failed: 0`.
  6. Final closing slide displaying master index link: `evidence/EVIDENCE_INDEX.md` (37 Syllabus IDs mapped).
- **Voiceover (Audio):**  
  *"Every claim in CivicLens is backed by verifiable code. Our automated test suite executes 70 tests across 6 suites with zero failures, achieving 84.25% line coverage—with our AI engines reaching 96.95%. Our headless Selenium Page-Object Model suite validates all 5 browser actions. Across all 37 syllabus deliverables, our evidence repository provides authentic documentation and honest disclosure. Thank you."*

---

## Recording Checklist for the Presenter

- [x] **Browser Zoom:** Set Google Chrome zoom to 110% for crisp UI readability on 1080p video.
- [x] **Microphone Check:** Ensure clean audio input with minimal ambient noise.
- [x] **Resolution:** Screen recording set to 1920x1080 at 30 fps or 60 fps.
- [x] **Timing Check:** Keep stopwatch visible; adhere strictly to the 15s / 45s / 90s / 30s scene breakdown.
- [x] **Live Data:** Run `npm --prefix backend run seed` before recording to ensure Bengaluru complaints and pre-configured duplicate clusters are loaded.
