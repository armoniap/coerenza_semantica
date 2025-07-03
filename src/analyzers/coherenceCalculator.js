import { 
  cosineSimilarity, 
  maxCosineSimilarity, 
  averageConsecutiveSimilarity,
  similarityToPercentage,
  getSimilarityCategory 
} from '../utils/cosineSimilarity.js';

export function calculateCoherence(embeddings, parsedText, keyword) {
  const results = {
    keyword,
    timestamp: new Date().toISOString(),
    summary: {
      overallCoherence: 0,
      keywordAlignment: 0,
      structuralCoherence: 0,
      flowCoherence: 0
    },
    paragraphs: [],
    structure: parsedText.structure,
    metadata: {
      processingTime: Date.now(),
      totalEmbeddings: embeddings.sentences.length + embeddings.subheadings.length + 1
    }
  };

  let totalKeywordAlignment = 0;
  let totalSubheadingAlignment = 0;
  let totalInternalCoherence = 0;

  parsedText.paragraphs.forEach((paragraph, index) => {
    const paragraphMetrics = calculateParagraphMetrics(
      paragraph,
      index,
      embeddings,
      parsedText
    );
    
    results.paragraphs.push(paragraphMetrics);
    
    totalKeywordAlignment += paragraphMetrics.keywordAlignment.score;
    totalSubheadingAlignment += paragraphMetrics.subheadingAlignment.score;
    totalInternalCoherence += paragraphMetrics.internalCoherence.score;
  });

  const paragraphCount = results.paragraphs.length;
  results.summary.keywordAlignment = totalKeywordAlignment / paragraphCount;
  results.summary.structuralCoherence = totalSubheadingAlignment / paragraphCount;
  results.summary.flowCoherence = calculateFlowCoherence(embeddings.paragraphs);
  results.summary.overallCoherence = calculateOverallCoherence(results.summary);

  results.metadata.processingTime = Date.now() - results.metadata.processingTime;

  return results;
}

function calculateParagraphMetrics(paragraph, index, embeddings, parsedText) {
  const paragraphEmbedding = embeddings.paragraphs[index];
  
  const keywordScore = cosineSimilarity(paragraphEmbedding, embeddings.keyword);
  
  const subheadingScore = embeddings.subheadings.length > 0 
    ? maxCosineSimilarity(paragraphEmbedding, embeddings.subheadings)
    : 0;

  const sentenceStartIndex = parsedText.paragraphs.slice(0, index)
    .reduce((sum, p) => sum + p.sentences.length, 0);
  const paragraphSentenceEmbeddings = embeddings.sentences.slice(
    sentenceStartIndex,
    sentenceStartIndex + paragraph.sentences.length
  );
  const internalScore = averageConsecutiveSimilarity(paragraphSentenceEmbeddings);

  return {
    index,
    text: paragraph.text.substring(0, 200) + (paragraph.text.length > 200 ? '...' : ''),
    fullText: paragraph.text,
    wordCount: paragraph.wordCount,
    sentenceCount: paragraph.sentences.length,
    keywordAlignment: {
      score: keywordScore,
      percentage: similarityToPercentage(keywordScore),
      category: getSimilarityCategory(keywordScore)
    },
    subheadingAlignment: {
      score: subheadingScore,
      percentage: similarityToPercentage(subheadingScore),
      category: getSimilarityCategory(subheadingScore)
    },
    internalCoherence: {
      score: internalScore,
      percentage: similarityToPercentage(internalScore),
      category: getSimilarityCategory(internalScore)
    },
    sentences: paragraph.sentences.map((sentence, sentenceIndex) => {
      const globalSentenceIndex = sentenceStartIndex + sentenceIndex;
      const sentenceEmbedding = embeddings.sentences[globalSentenceIndex];
      
      return {
        text: sentence,
        keywordSimilarity: {
          score: cosineSimilarity(sentenceEmbedding, embeddings.keyword),
          percentage: similarityToPercentage(cosineSimilarity(sentenceEmbedding, embeddings.keyword))
        },
        paragraphSimilarity: {
          score: cosineSimilarity(sentenceEmbedding, paragraphEmbedding),
          percentage: similarityToPercentage(cosineSimilarity(sentenceEmbedding, paragraphEmbedding))
        }
      };
    })
  };
}

function calculateFlowCoherence(paragraphEmbeddings) {
  return averageConsecutiveSimilarity(paragraphEmbeddings);
}

function calculateOverallCoherence(summary) {
  const weights = {
    keywordAlignment: 0.4,
    structuralCoherence: 0.3,
    flowCoherence: 0.3
  };

  return (
    summary.keywordAlignment * weights.keywordAlignment +
    summary.structuralCoherence * weights.structuralCoherence +
    summary.flowCoherence * weights.flowCoherence
  );
}

export function generateInsights(results) {
  const insights = [];
  const summary = results.summary;

  const overallPercentage = similarityToPercentage(summary.overallCoherence);
  if (overallPercentage >= 70) {
    insights.push('✅ Il contenuto ha un\'alta coerenza complessiva.');
  } else if (overallPercentage >= 40) {
    insights.push('⚠️ Il contenuto ha una coerenza moderata. Ci sono margini di miglioramento.');
  } else {
    insights.push('❌ Il contenuto ha una bassa coerenza e necessita di miglioramenti significativi.');
  }

  const keywordPercentage = similarityToPercentage(summary.keywordAlignment);
  if (keywordPercentage < 40) {
    insights.push('🎯 Considera di includere più riferimenti alla keyword target nei paragrafi.');
  }

  const structuralPercentage = similarityToPercentage(summary.structuralCoherence);
  if (structuralPercentage < 40) {
    insights.push('📝 I paragrafi potrebbero essere meglio allineati con i sottotitoli.');
  }

  const flowPercentage = similarityToPercentage(summary.flowCoherence);
  if (flowPercentage < 40) {
    insights.push('🔗 Migliora le transizioni tra i paragrafi per un flusso più naturale.');
  }

  const poorParagraphs = results.paragraphs.filter(p => 
    similarityToPercentage(p.keywordAlignment.score) < 40
  );
  
  if (poorParagraphs.length > 0) {
    insights.push(`📊 ${poorParagraphs.length} paragrafo${poorParagraphs.length > 1 ? 'i hanno' : ' ha'} un basso allineamento con la keyword.`);
  }

  return insights;
}

export function getScoreColor(score) {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getScoreLabel(score) {
  if (score >= 70) return 'Eccellente';
  if (score >= 60) return 'Buono';
  if (score >= 40) return 'Sufficiente';
  if (score >= 20) return 'Scarso';
  return 'Molto Scarso';
}
