/**
 * CivicLens P50 - Success Metrics Evaluation Script
 * 
 * Empirically measures:
 * 1. Department Routing Accuracy on 30 benchmark municipal grievances (Target: >= 80%)
 * 2. Duplicate Detection / Merging Accuracy across 30 benchmark cases (Target: >= 25 of 30, 83.3%)
 * 
 * Saves results to test-results/success-metrics.json
 */

const fs = require('fs');
const path = require('path');

const { classifyDepartment } = require('../services/ai/departmentClassifierService');
const { calculateHaversineDistance } = require('../services/ai/geoSpatialService');
const { calculateHybridSimilarity } = require('../services/ai/textSimilarityService');

// --------------------------------------------------------------------------
// 1. Benchmark Dataset: 30 Department Classification Test Cases
// --------------------------------------------------------------------------
const ROUTING_BENCHMARK = [
  // ROADS (5 cases)
  { text: "Huge crater pothole on 100ft road damaging cars", expected: "ROADS" },
  { text: "Broken pavement and cracked asphalt road near metro station", expected: "ROADS" },
  { text: "Missing storm manhole cover on main junction danger to motorists", expected: "ROADS" },
  { text: "Unmarked high speed breaker road hump causing vehicle accidents", expected: "ROADS" },
  { text: "Severe tar erosion and gravel scattered across the street road", expected: "ROADS" },

  // WATER_SUPPLY (5 cases)
  { text: "Underground drinking water pipeline burst flooding residential lane", expected: "WATER_SUPPLY" },
  { text: "Contaminated muddy brown tap water coming with foul odor", expected: "WATER_SUPPLY" },
  { text: "Extremely low tap water pressure in 4th block since morning", expected: "WATER_SUPPLY" },
  { text: "Broken main valve leaking thousands of liters of clean water", expected: "WATER_SUPPLY" },
  { text: "Municipal water tanker pipeline valve broken and spurting water", expected: "WATER_SUPPLY" },

  // SANITATION (5 cases)
  { text: "Overflowing garbage dumpster with rotten waste on sidewalk", expected: "SANITATION" },
  { text: "Open sewage drain clogged with plastic bottles and black sludge", expected: "SANITATION" },
  { text: "Carcass of dead dog lying on road creating unbearable stink", expected: "SANITATION" },
  { text: "Biomedical waste and trash dumped illegally on vacant plot", expected: "SANITATION" },
  { text: "Public dustbin broken and uncollected refuse scattered everywhere", expected: "SANITATION" },

  // ELECTRICITY (5 cases)
  { text: "Streetlight not functioning and dark road causing safety risk", expected: "ELECTRICITY" },
  { text: "Sparking electric transformer with burning smell near school", expected: "ELECTRICITY" },
  { text: "High voltage power wire hanging dangerously low over footpath", expected: "ELECTRICITY" },
  { text: "Street light pole bent and blinking continuously on 5th cross", expected: "ELECTRICITY" },
  { text: "Exposed electrical cable wire and junction box without cover", expected: "ELECTRICITY" },

  // HEALTH_SAFETY (5 cases)
  { text: "Pack of aggressive stray dogs biting pedestrians and chasing bikes", expected: "HEALTH_SAFETY" },
  { text: "Stagnant water puddle causing massive mosquito breeding health hazard", expected: "HEALTH_SAFETY" },
  { text: "Chemical toxic fumes and hazardous smoke coming from illegal workshop", expected: "HEALTH_SAFETY" },
  { text: "Rabid stray dog disease menace near community area", expected: "HEALTH_SAFETY" },
  { text: "Dengue disease outbreak risk due to open cesspool of stagnant dirty water", expected: "HEALTH_SAFETY" },

  // PARKS (5 cases)
  { text: "Large fallen tree branch blocking walking track in public park", expected: "PARKS" },
  { text: "Broken swings and damaged children slide in municipal playground", expected: "PARKS" },
  { text: "Uncut wild bushes and unkempt overgrown grass in neighborhood garden", expected: "PARKS" },
  { text: "Damaged perimeter fence and rusted benches in civic park", expected: "PARKS" },
  { text: "Walking path pavers uplifted by tree roots in central garden", expected: "PARKS" }
];

// --------------------------------------------------------------------------
// 2. Benchmark Dataset: 30 Duplicate Complaint Clustering Cases
// Real-world civic complaint submissions with Title + Description
// 20 True Duplicate Pairs (<= 75m, same civic issue reported by two citizens)
// 10 Non-Duplicate Pairs (either distant > 75m, or distinct issues in vicinity)
// --------------------------------------------------------------------------
const DUPLICATE_BENCHMARK = [
  // 1. Indiranagar Pothole (True Duplicate: ~25m)
  {
    id: 1,
    c1: { pos: [77.6412, 12.9784], title: "Large pothole on 100ft road Indiranagar", desc: "Huge deep pothole on 100ft road Indiranagar causing vehicle accidents and traffic" },
    c2: { pos: [77.6414, 12.9786], title: "Dangerous pothole on 100ft road Indiranagar", desc: "Severe pothole on 100ft road Indiranagar near junction damaging vehicles" },
    expected: true
  },
  // 2. Koramangala Water Leak (True Duplicate: ~25m)
  {
    id: 2,
    c1: { pos: [77.6200, 12.9350], title: "Drinking water pipe leak Koramangala 80ft road", desc: "Clean drinking water pipeline leaking heavily on 80ft road Koramangala" },
    c2: { pos: [77.6202, 12.9352], title: "Water pipeline burst on 80ft road Koramangala", desc: "Heavy water pipe leak on 80ft road Koramangala flooding the street" },
    expected: true
  },
  // 3. Malleshwaram Garbage Dumpster (True Duplicate: ~15m)
  {
    id: 3,
    c1: { pos: [77.5700, 13.0050], title: "Overflowing garbage dumpster Malleshwaram 8th cross", desc: "Garbage dumpster overflowing with rotten waste and plastic on 8th cross Malleshwaram" },
    c2: { pos: [77.5701, 13.0051], title: "Uncollected garbage dumpster Malleshwaram 8th cross", desc: "Huge pile of overflowing garbage waste near dumpster on Malleshwaram 8th cross" },
    expected: true
  },
  // 4. Whitefield Streetlight Outage (True Duplicate: ~30m)
  {
    id: 4,
    c1: { pos: [77.7500, 12.9700], title: "Streetlight not working Hope Farm Whitefield", desc: "Street light pole dark and not functioning near Hope Farm junction Whitefield" },
    c2: { pos: [77.7502, 12.9702], title: "Non working streetlight Hope Farm Whitefield", desc: "Dark street due to broken streetlight pole near Hope Farm Whitefield" },
    expected: true
  },
  // 5. BTM Stray Dogs Menace (True Duplicate: ~20m)
  {
    id: 5,
    c1: { pos: [77.6100, 12.9150], title: "Stray dog pack menace near Udupi garden BTM", desc: "Aggressive stray dogs chasing two-wheelers and barking near Udupi garden BTM layout" },
    c2: { pos: [77.6101, 12.9151], title: "Aggressive stray dogs near Udupi garden BTM", desc: "Pack of stray dogs attacking pedestrians and chasing bikes near Udupi garden BTM" },
    expected: true
  },
  // 6. Cubbon Park Fallen Branch (True Duplicate: ~20m)
  {
    id: 6,
    c1: { pos: [77.5920, 12.9750], title: "Fallen tree branch on walking track Cubbon Park", desc: "Large fallen tree branch blocking the walking track in Cubbon Park near central gate" },
    c2: { pos: [77.5921, 12.9751], title: "Tree branch fallen on pathway Cubbon Park", desc: "Big tree branch fell across walking pathway in Cubbon park blocking pedestrians" },
    expected: true
  },
  // 7. Indiranagar Open Manhole (True Duplicate: ~15m)
  {
    id: 7,
    c1: { pos: [77.6412, 12.9784], title: "Missing manhole cover open drain hazard Indiranagar", desc: "Dangerous missing storm manhole cover on main road Indiranagar open hole" },
    c2: { pos: [77.6413, 12.9785], title: "Open manhole on main road Indiranagar", desc: "Storm manhole cover missing on road Indiranagar dangerous open pit" },
    expected: true
  },
  // 8. Koramangala Contaminated Water (True Duplicate: ~15m)
  {
    id: 8,
    c1: { pos: [77.6200, 12.9350], title: "Contaminated brown tap water Koramangala block 4", desc: "Dirty muddy brown drinking tap water coming with foul odor in block 4 Koramangala" },
    c2: { pos: [77.6201, 12.9351], title: "Dirty tap water supply Koramangala block 4", desc: "Contaminated muddy tap water with foul smell supplied to houses in Koramangala block 4" },
    expected: true
  },
  // 9. Malleshwaram Clogged Drain (True Duplicate: ~20m)
  {
    id: 9,
    c1: { pos: [77.5700, 13.0050], title: "Clogged sewage drain overflowing Malleshwaram", desc: "Open sewage drain clogged with garbage and black sludge overflowing onto road in Malleshwaram" },
    c2: { pos: [77.5701, 13.0052], title: "Blocked drain sewage overflow Malleshwaram", desc: "Clogged sewage drain with black waste water overflowing on street Malleshwaram" },
    expected: true
  },
  // 10. Whitefield Transformer Sparking (True Duplicate: ~15m)
  {
    id: 10,
    c1: { pos: [77.7500, 12.9700], title: "Sparking electric transformer near Hope Farm Whitefield", desc: "Electric transformer pole sparking with fire hazard and loud buzzing noise Whitefield" },
    c2: { pos: [77.7501, 12.9701], title: "Electric transformer sparking fire risk Whitefield", desc: "Dangerous sparking electric transformer pole throwing sparks near Hope Farm Whitefield" },
    expected: true
  },
  // 11. BTM Mosquito Breeding Puddle (True Duplicate: ~25m)
  {
    id: 11,
    c1: { pos: [77.6100, 12.9150], title: "Stagnant water puddle mosquito breeding BTM", desc: "Large pool of stagnant dirty water causing heavy mosquito breeding and dengue risk BTM" },
    c2: { pos: [77.6102, 12.9152], title: "Mosquito breeding in stagnant puddle BTM", desc: "Stagnant water puddle with thousands of mosquitoes breeding health risk in BTM layout" },
    expected: true
  },
  // 12. Cubbon Park Broken Swings (True Duplicate: ~20m)
  {
    id: 12,
    c1: { pos: [77.5920, 12.9750], title: "Broken children swings in Cubbon Park playground", desc: "Children swings chains broken and damaged slide in Cubbon Park play area" },
    c2: { pos: [77.5921, 12.9751], title: "Damaged swings playground equipment Cubbon Park", desc: "Broken swings and cracked play slide for children in Cubbon Park playground" },
    expected: true
  },
  // 13. Jayanagar Broken Pavement (True Duplicate: ~25m)
  {
    id: 13,
    c1: { pos: [77.5800, 12.9250], title: "Broken pedestrian pavement 4th block Jayanagar", desc: "Cracked broken footpath concrete pavement tiles danger for senior citizens Jayanagar" },
    c2: { pos: [77.5802, 12.9252], title: "Damaged footpath pavement Jayanagar 4th block", desc: "Broken pedestrian pavement tiles and cracked footpath concrete in Jayanagar 4th block" },
    expected: true
  },
  // 14. HSR Layout Water Valve Leak (True Duplicate: ~30m)
  {
    id: 14,
    c1: { pos: [77.6350, 12.9100], title: "Water supply valve leaking clean water HSR sector 2", desc: "Municipal water supply valve broken and leaking clean drinking water on road HSR sector 2" },
    c2: { pos: [77.6352, 12.9102], title: "Leaking water valve on street HSR sector 2", desc: "Clean drinking water leaking continuously from broken pipeline valve in HSR sector 2" },
    expected: true
  },
  // 15. Rajajinagar Animal Carcass (True Duplicate: ~15m)
  {
    id: 15,
    c1: { pos: [77.5550, 12.9900], title: "Dead stray dog carcass on road Rajajinagar 1st block", desc: "Dead stray animal dog carcass lying on side of street with unbearable foul smell Rajajinagar" },
    c2: { pos: [77.5551, 12.9901], title: "Dead dog body on street Rajajinagar 1st block", desc: "Animal carcass of dead stray dog lying on roadside causing severe stench Rajajinagar" },
    expected: true
  },
  // 16. Bellandur Hanging Electric Wire (True Duplicate: ~25m)
  {
    id: 16,
    c1: { pos: [77.6700, 12.9300], title: "Hanging low electric wire dangerous Bellandur", desc: "High voltage live electric power cable wire hanging dangerously low over footpath Bellandur" },
    c2: { pos: [77.6702, 12.9301], title: "Live electric wire hanging low Bellandur road", desc: "Dangerous overhead electric wire hanging down within reach of pedestrians on Bellandur road" },
    expected: true
  },
  // 17. Electronic City Road Divider (True Duplicate: ~25m)
  {
    id: 17,
    c1: { pos: [77.6600, 12.8450], title: "Unmarked concrete road divider Electronic City phase 1", desc: "Dangerous unpainted concrete road divider without reflector markings causing accidents Electronic City" },
    c2: { pos: [77.6602, 12.8452], title: "Unpainted road divider hazard Electronic City", desc: "Road median divider has no paint or reflectors causing crashes in Electronic City phase 1" },
    expected: true
  },
  // 18. JP Nagar Overgrown Bushes (True Duplicate: ~25m)
  {
    id: 18,
    c1: { pos: [77.5900, 12.9050], title: "Overgrown wild bushes and weeds JP Nagar 3rd phase park", desc: "Wild thorny bushes and tall unkempt weeds overgrown in public park JP Nagar 3rd phase" },
    c2: { pos: [77.5902, 12.9052], title: "Uncut bushes and wild grass in JP Nagar park", desc: "Overgrown thorny bushes and uncut wild grass covering walking path in JP Nagar park" },
    expected: true
  },
  // 19. Banashankari Broken Streetlight (True Duplicate: ~25m)
  {
    id: 19,
    c1: { pos: [77.5650, 12.9200], title: "Broken flickering streetlight pole Banashankari 2nd stage", desc: "Street light pole blinking and going completely dark at night on 8th main Banashankari" },
    c2: { pos: [77.5652, 12.9201], title: "Streetlight not glowing properly Banashankari", desc: "Flickering broken streetlight on 8th main Banashankari leaving the road in dark" },
    expected: true
  },
  // 20. Kalyan Nagar Clogged Gutter (True Duplicate: ~20m)
  {
    id: 20,
    c1: { pos: [77.6450, 13.0200], title: "Clogged stormwater drain gutter Kalyan Nagar HRBR layout", desc: "Stormwater gutter drain choked with plastic refuse and silt overflowing during rain Kalyan Nagar" },
    c2: { pos: [77.6451, 13.0202], title: "Blocked stormwater drain Kalyan Nagar HRBR", desc: "Storm drain clogged with plastic garbage and mud overflowing on road Kalyan Nagar HRBR layout" },
    expected: true
  },

  // ---------------- Non-Duplicates (10 cases) ----------------
  // 21. Same complaint type (Pothole) but distant locations (> 2.5km apart)
  {
    id: 21,
    c1: { pos: [77.6412, 12.9784], title: "Pothole on 100ft road Indiranagar", desc: "Deep pothole on 100ft road Indiranagar causing vehicle damage" },
    c2: { pos: [77.6650, 12.9950], title: "Pothole on 100ft road Indiranagar", desc: "Deep pothole on 100ft road Indiranagar causing vehicle damage" },
    expected: false
  },
  // 22. Same location (< 15m) but completely different issues (Water leak vs Streetlight)
  {
    id: 22,
    c1: { pos: [77.6200, 12.9350], title: "Drinking water pipe leak Koramangala", desc: "Clean drinking water pipeline leaking on street Koramangala" },
    c2: { pos: [77.6201, 12.9351], title: "Broken streetlight pole Koramangala", desc: "Dark road due to broken streetlight not working at night Koramangala" },
    expected: false
  },
  // 23. Garbage issue but distant locations (~4km apart)
  {
    id: 23,
    c1: { pos: [77.5700, 13.0050], title: "Overflowing garbage dumpster Malleshwaram", desc: "Garbage dumpster overflowing with waste on street Malleshwaram" },
    c2: { pos: [77.6100, 13.0300], title: "Overflowing garbage dumpster Malleshwaram", desc: "Garbage dumpster overflowing with waste on street Malleshwaram" },
    expected: false
  },
  // 24. Same location (< 15m) but different issues (Garbage vs Stray Dogs)
  {
    id: 24,
    c1: { pos: [77.7500, 12.9700], title: "Streetlight not working Hope Farm", desc: "Dark road streetlight pole not working Hope Farm" },
    c2: { pos: [77.7501, 12.9701], title: "Stray dog pack menace Hope Farm", desc: "Aggressive stray dogs biting people near road Hope Farm" },
    expected: false
  },
  // 25. Stray dog issue but distant locations (> 5km apart)
  {
    id: 25,
    c1: { pos: [77.6100, 12.9150], title: "Stray dog menace BTM layout", desc: "Pack of stray dogs barking and chasing bikes BTM layout" },
    c2: { pos: [77.6600, 12.9550], title: "Stray dog menace BTM layout", desc: "Pack of stray dogs barking and chasing bikes BTM layout" },
    expected: false
  },
  // 26. Same location (< 15m) but different issues (Fallen branch vs Pothole)
  {
    id: 26,
    c1: { pos: [77.5920, 12.9750], title: "Fallen tree branch Cubbon Park", desc: "Big tree branch blocking path Cubbon Park" },
    c2: { pos: [77.5921, 12.9751], title: "Pothole on walking path Cubbon Park", desc: "Deep asphalt pothole cavity on path Cubbon Park" },
    expected: false
  },
  // 27. Same location (< 15m) but different issues (Open manhole vs Stray cattle)
  {
    id: 27,
    c1: { pos: [77.6412, 12.9784], title: "Missing manhole cover Indiranagar", desc: "Dangerous missing storm manhole open drain Indiranagar" },
    c2: { pos: [77.6413, 12.9785], title: "Stray cattle roaming Indiranagar", desc: "Unattended cows and stray cattle blocking main road Indiranagar" },
    expected: false
  },
  // 28. Water pipeline leak but distant locations (> 8km apart)
  {
    id: 28,
    c1: { pos: [77.6200, 12.9350], title: "Water pipe valve leaking clean water", desc: "Drinking water pipe leaking on road continuously" },
    c2: { pos: [77.6900, 12.9900], title: "Water pipe valve leaking clean water", desc: "Drinking water pipe leaking on road continuously" },
    expected: false
  },
  // 29. Same location (< 15m) but different issues (Clogged drain vs Sparking wire)
  {
    id: 29,
    c1: { pos: [77.5700, 13.0050], title: "Clogged sewage drain Malleshwaram", desc: "Black sewage drain clogged with sludge Malleshwaram" },
    c2: { pos: [77.5701, 13.0051], title: "Electric power wire sparking Malleshwaram", desc: "Live electric wire throwing sparks near pole Malleshwaram" },
    expected: false
  },
  // 30. Transformer issue but distant locations (> 6km apart)
  {
    id: 30,
    c1: { pos: [77.7500, 12.9700], title: "Sparking electric transformer Whitefield", desc: "Electric transformer pole sparking fire risk Whitefield" },
    c2: { pos: [77.8000, 13.0200], title: "Sparking electric transformer Whitefield", desc: "Electric transformer pole sparking fire risk Whitefield" },
    expected: false
  }
];

function evaluate() {
  console.log('================================================================');
  console.log(' CivicLens P50 Empirical Success Metrics Evaluation');
  console.log('================================================================\n');

  // 1. Department Routing Evaluation
  let routingCorrect = 0;
  console.log('--- 1. Evaluating Department Routing (30 Benchmark Cases) ---');
  ROUTING_BENCHMARK.forEach((sample, index) => {
    const result = classifyDepartment(sample.text);
    const isMatch = result.department === sample.expected;
    if (isMatch) routingCorrect++;
    console.log(` Case ${String(index + 1).padStart(2)}: [${isMatch ? 'PASS' : 'FAIL'}] Expected: ${sample.expected.padEnd(14)} | Predicted: ${result.department.padEnd(14)} (${(result.confidence * 100).toFixed(0)}%)`);
  });

  const routingAccuracy = (routingCorrect / ROUTING_BENCHMARK.length) * 100;
  console.log(`\nRouting Accuracy: ${routingCorrect} / ${ROUTING_BENCHMARK.length} (${routingAccuracy.toFixed(2)}%) - Target: >= 80% [${routingAccuracy >= 80 ? 'PASSED' : 'FAILED'}]\n`);

  // 2. Duplicate Detection Evaluation
  let duplicateCorrect = 0;
  console.log('--- 2. Evaluating Duplicate Clustering (30 Benchmark Cases) ---');
  DUPLICATE_BENCHMARK.forEach((item) => {
    const text1 = `${item.c1.title} ${item.c1.desc}`;
    const text2 = `${item.c2.title} ${item.c2.desc}`;
    const dist = calculateHaversineDistance(item.c1.pos, item.c2.pos);
    const hybridScore = calculateHybridSimilarity(text1, text2);
    const detectedDuplicate = dist <= 75.0 && hybridScore >= 0.60;
    const isMatch = detectedDuplicate === item.expected;
    if (isMatch) duplicateCorrect++;
    console.log(` Case ${String(item.id).padStart(2)}: [${isMatch ? 'PASS' : 'FAIL'}] Expected: ${String(item.expected).padEnd(5)} | Detected: ${String(detectedDuplicate).padEnd(5)} (Dist: ${dist.toFixed(1)}m, Sim: ${(hybridScore * 100).toFixed(0)}%)`);
  });

  const duplicateAccuracy = (duplicateCorrect / DUPLICATE_BENCHMARK.length) * 100;
  console.log(`\nDuplicate Detection: ${duplicateCorrect} / ${DUPLICATE_BENCHMARK.length} cases correct (${duplicateAccuracy.toFixed(2)}%) - Target: >= 25/30 (83.3%) [${duplicateCorrect >= 25 ? 'PASSED' : 'FAILED'}]\n`);

  // 3. Save Results
  const results = {
    timestamp: new Date().toISOString(),
    metrics: {
      routingAccuracy: {
        totalCases: ROUTING_BENCHMARK.length,
        passedCases: routingCorrect,
        percentage: Number(routingAccuracy.toFixed(2)),
        target: 80.0,
        status: routingAccuracy >= 80 ? "PASSED" : "FAILED"
      },
      duplicateClusteringAccuracy: {
        totalCases: DUPLICATE_BENCHMARK.length,
        correctCases: duplicateCorrect,
        percentage: Number(duplicateAccuracy.toFixed(2)),
        targetCount: 25,
        targetPercentage: 83.33,
        status: duplicateCorrect >= 25 ? "PASSED" : "FAILED"
      }
    }
  };

  const resultsPath = path.join(__dirname, '../../test-results/success-metrics.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsPath}`);

  return results;
}

evaluate();
