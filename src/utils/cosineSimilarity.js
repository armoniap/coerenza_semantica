export function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be non-empty and of equal length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function maxCosineSimilarity(vector, vectors) {
  if (!vectors || vectors.length === 0) return 0;
  
  const similarities = vectors.map(v => cosineSimilarity(vector, v));
  return Math.max(...similarities);
}

export function averageConsecutiveSimilarity(vectors) {
  if (vectors.length < 2) return 1;

  const similarities = [];
  for (let i = 0; i < vectors.length - 1; i++) {
    similarities.push(cosineSimilarity(vectors[i], vectors[i + 1]));
  }

  return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
}

export function similarityToPercentage(similarity) {
  return Math.round(((similarity + 1) / 2) * 100);
}

export function getSimilarityCategory(similarity) {
  const percentage = similarityToPercentage(similarity);
  
  if (percentage >= 70) return 'excellent';
  if (percentage >= 40) return 'good';
  return 'poor';
}
