/**
 * Text Similarity & NLP Service for CivicLens
 * Provides TF vectorization, Cosine Similarity, Jaccard Index, and Token Normalization.
 */

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt',
  'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt',
  'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im',
  'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more',
  'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant',
  'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
  'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these',
  'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'werent',
  'weve', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who',
  'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll',
  'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves', 'please', 'kindly', 'help', 'urgent'
]);

/**
 * Normalizes and stems words to root forms (e.g. potholes -> pothol, pipeline -> pipelin).
 */
const stemWord = (word) => {
  if (!word || word.length <= 3) return word;
  let w = word.toLowerCase();

  // Root normalization for civic domain synonyms
  if (w.startsWith('pipelin')) return 'pipe';
  if (w.startsWith('leak')) return 'leak';
  if (w.startsWith('pothol')) return 'pothol';
  if (w.startsWith('garbag')) return 'garbag';

  // Suffix rules
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('es')) return w.slice(0, -2);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  if (w.endsWith('e') && w.length > 4) return w.slice(0, -1);

  return w;
};

/**
 * Tokenize, clean, remove stop words, and stem text.
 */
const tokenizeAndClean = (text) => {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(stemWord);
};

/**
 * Compute term frequency vector for a tokenized document.
 */
const computeTermFrequencies = (tokens) => {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
};

/**
 * Computes Cosine Similarity between two texts using term vector angles.
 * Returns score in range [0.0, 1.0].
 */
const calculateCosineSimilarity = (textA, textB) => {
  const tokensA = tokenizeAndClean(textA);
  const tokensB = tokenizeAndClean(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0.0;
  }

  const tfA = computeTermFrequencies(tokensA);
  const tfB = computeTermFrequencies(tokensB);

  let dotProduct = 0;
  for (const [term, freqA] of tfA.entries()) {
    if (tfB.has(term)) {
      dotProduct += freqA * tfB.get(term);
    }
  }

  let normA = 0;
  for (const freq of tfA.values()) {
    normA += freq * freq;
  }

  let normB = 0;
  for (const freq of tfB.values()) {
    normB += freq * freq;
  }

  if (normA === 0 || normB === 0) return 0.0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1.0, Math.max(0.0, Math.round(similarity * 1000) / 1000));
};

/**
 * Computes Jaccard Similarity index: |A ∩ B| / |A ∪ B|
 */
const calculateJaccardSimilarity = (textA, textB) => {
  const setA = new Set(tokenizeAndClean(textA));
  const setB = new Set(tokenizeAndClean(textB));

  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionSize++;
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0.0 : Math.round((intersectionSize / unionSize) * 1000) / 1000;
};

/**
 * Computes hybrid similarity score balancing vector angle and token overlap.
 */
const calculateHybridSimilarity = (textA, textB) => {
  const cosine = calculateCosineSimilarity(textA, textB);
  const jaccard = calculateJaccardSimilarity(textA, textB);

  // 80% Cosine vector angle + 20% Jaccard token overlap
  const hybrid = cosine * 0.8 + jaccard * 0.2;
  return Math.min(1.0, Math.max(0.0, Math.round(hybrid * 1000) / 1000));
};

/**
 * Extract overlapping salient keywords between two texts for Explainable AI (XAI) output.
 */
const extractCommonKeywords = (textA, textB) => {
  const tokensA = new Set(tokenizeAndClean(textA));
  const tokensB = new Set(tokenizeAndClean(textB));

  const overlap = [];
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap.push(t);
  }
  return overlap;
};

module.exports = {
  tokenizeAndClean,
  stemWord,
  calculateCosineSimilarity,
  calculateJaccardSimilarity,
  calculateHybridSimilarity,
  extractCommonKeywords
};
