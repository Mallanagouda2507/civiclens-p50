/**
 * Automated Department Classification Service for CivicLens
 * Uses domain vocabulary weighting, tokenization, and probability estimation
 * to route complaints with Explainable AI (XAI) feature attribution.
 */

const { tokenizeAndClean } = require('./textSimilarityService');

// Municipal department taxonomy and feature keywords with importance weights
const DEPARTMENT_TAXONOMY = {
  ROADS: {
    name: 'Roads & Infrastructure',
    description: 'Road repairs, potholes, pavement, traffic dividers, and manhole covers',
    keywords: {
      pothol: 3.5,
      road: 3.0,
      asphalt: 3.0,
      crater: 2.5,
      pavement: 2.5,
      footpath: 2.5,
      manhol: 3.0,
      speedbreak: 2.5,
      divider: 2.0,
      tar: 2.0,
      gravel: 2.0,
      cavein: 3.0,
      curb: 2.0,
      bitumen: 2.5
    }
  },
  WATER_SUPPLY: {
    name: 'Water Supply & Distribution',
    description: 'Pipeline leaks, low pressure, contamination, broken mains, and valve issues',
    keywords: {
      water: 3.0,
      pipe: 3.0,
      pipelin: 3.0,
      leak: 3.0,
      tap: 2.5,
      pressur: 2.5,
      contamin: 3.5,
      burst: 3.0,
      valv: 2.5,
      drain: 2.0,
      suppli: 2.0,
      muddi: 2.5,
      odor: 2.0,
      tanker: 2.0
    }
  },
  SANITATION: {
    name: 'Sanitation & Solid Waste Management',
    description: 'Garbage accumulation, uncollected bins, open dumping, and public cleanliness',
    keywords: {
      garbag: 3.5,
      wast: 3.0,
      trash: 3.0,
      dump: 3.0,
      dustbin: 3.0,
      bin: 2.5,
      uncollect: 3.0,
      sweeper: 2.5,
      litter: 2.5,
      sewag: 3.0,
      stench: 2.5,
      smell: 2.0,
      carcass: 3.5,
      debri: 2.0
    }
  },
  ELECTRICITY: {
    name: 'Electricity & Public Lighting',
    description: 'Broken streetlights, dangling live wires, damaged transformers, and dark lanes',
    keywords: {
      streetlight: 3.5,
      light: 2.5,
      lamp: 2.5,
      lamppost: 3.0,
      electr: 3.0,
      wire: 3.0,
      transform: 3.5,
      spark: 3.0,
      dangl: 2.5,
      blackout: 3.0,
      dark: 2.5,
      flicker: 2.5,
      cabl: 2.5
    }
  },
  HEALTH_SAFETY: {
    name: 'Public Health & Urban Safety',
    description: 'Mosquito breeding, stray animals, hazardous dumping, and disease prevention',
    keywords: {
      mosquito: 3.5,
      dengu: 3.5,
      larva: 3.0,
      stray: 3.0,
      dog: 2.5,
      bitten: 3.0,
      stagnant: 3.0,
      infest: 3.0,
      fog: 2.5,
      spray: 2.0,
      hazard: 3.0,
      hygien: 2.5,
      malaria: 3.5
    }
  },
  PARKS: {
    name: 'Parks & Recreation Facilities',
    description: 'Damaged playground swings, fallen tree branches, unmaintained lawns, and park lighting',
    keywords: {
      park: 3.5,
      tree: 3.0,
      branch: 3.0,
      garden: 3.0,
      lawn: 2.5,
      playground: 3.0,
      swing: 3.0,
      bench: 2.5,
      grass: 2.5,
      prun: 2.5,
      plant: 2.0,
      greenery: 2.5,
      pathway: 2.0
    }
  }
};

/**
 * Predicts the most suitable department for a given complaint description and title.
 * @param {string} title
 * @param {string} description
 * @returns {{
 *   department: string,
 *   departmentName: string,
 *   confidence: number,
 *   keywords: string[],
 *   alternative: { department: string, confidence: number } | null,
 *   allScores: Record<string, number>
 * }}
 */
const classifyDepartment = (title = '', description = '') => {
  const combinedText = `${title} ${description}`;
  const tokens = tokenizeAndClean(combinedText);

  const rawScores = {};
  const matchedKeywordsPerDept = {};

  // Baseline score
  for (const deptKey of Object.keys(DEPARTMENT_TAXONOMY)) {
    rawScores[deptKey] = 0.1; // Small smoothing prior
    matchedKeywordsPerDept[deptKey] = [];
  }

  // Calculate weighted frequency
  for (const [deptKey, deptData] of Object.entries(DEPARTMENT_TAXONOMY)) {
    for (const token of tokens) {
      if (deptData.keywords[token]) {
        const weight = deptData.keywords[token];
        rawScores[deptKey] += weight;
        if (!matchedKeywordsPerDept[deptKey].includes(token)) {
          matchedKeywordsPerDept[deptKey].push(token);
        }
      }
    }
  }

  // Softmax normalization to obtain calibrated probabilities
  const expScores = {};
  let expSum = 0;

  for (const [deptKey, score] of Object.entries(rawScores)) {
    const exp = Math.exp(score);
    expScores[deptKey] = exp;
    expSum += exp;
  }

  const probabilities = {};
  for (const [deptKey, exp] of Object.entries(expScores)) {
    probabilities[deptKey] = Math.round((exp / expSum) * 1000) / 1000;
  }

  // Sort departments by probability
  const sortedDepts = Object.keys(probabilities).sort(
    (a, b) => probabilities[b] - probabilities[a]
  );

  const topDeptKey = sortedDepts[0];
  const secondDeptKey = sortedDepts[1];

  // If top score has zero keyword matches, fall back to GENERAL
  const hasMatches = matchedKeywordsPerDept[topDeptKey].length > 0;
  if (!hasMatches) {
    return {
      department: 'GENERAL',
      departmentName: 'General Administration',
      confidence: 0.5,
      keywords: [],
      alternative: null,
      allScores: probabilities
    };
  }

  return {
    department: topDeptKey,
    departmentName: DEPARTMENT_TAXONOMY[topDeptKey].name,
    confidence: probabilities[topDeptKey],
    keywords: matchedKeywordsPerDept[topDeptKey],
    alternative: {
      department: secondDeptKey,
      departmentName: DEPARTMENT_TAXONOMY[secondDeptKey].name,
      confidence: probabilities[secondDeptKey]
    },
    allScores: probabilities
  };
};

module.exports = {
  DEPARTMENT_TAXONOMY,
  classifyDepartment
};
