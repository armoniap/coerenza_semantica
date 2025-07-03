import { generateEmbeddings } from '../api/gemini.js';
import { removeStopwords } from '../utils/stopwords.js';

const MAX_BATCH_SIZE = 20;
const EMBEDDING_CACHE_KEY = 'content_embeddings_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function generateEmbeddingsWithProgress(apiKey, keyword, parsedText, progressCallback) {
  const cache = loadCache();
  const embeddings = {
    keyword: null,
    subheadings: [],
    sentences: [],
    paragraphs: []
  };

  // Check if stopwords filter is enabled
  const filterStopwords = document.getElementById('filterStopwords')?.checked || false;
  console.log('Stopwords filter enabled:', filterStopwords);

  try {
    progressCallback(35, 'Generazione embeddings per keyword e sottotitoli...', 'stepEmbeddings', 'active');
    
    const processedKeyword = filterStopwords ? removeStopwords(keyword) : keyword;
    const processedSubheadings = parsedText.subheadings.map(h => 
      filterStopwords ? removeStopwords(h.text) : h.text
    );
    const keywordAndSubheadings = [processedKeyword, ...processedSubheadings];
    const keywordCacheKey = generateCacheKey(keywordAndSubheadings);
    
    let keywordEmbeddings;
    if (cache[keywordCacheKey] && !isCacheExpired(cache[keywordCacheKey])) {
      keywordEmbeddings = cache[keywordCacheKey].embeddings;
    } else {
      keywordEmbeddings = await generateEmbeddings(apiKey, keywordAndSubheadings);
      cache[keywordCacheKey] = {
        embeddings: keywordEmbeddings,
        timestamp: Date.now()
      };
      saveCache(cache);
    }
    
    embeddings.keyword = keywordEmbeddings[0];
    embeddings.subheadings = keywordEmbeddings.slice(1);

    const allSentences = parsedText.sentences.map(s => 
      filterStopwords ? removeStopwords(s.text) : s.text
    );
    const sentenceBatches = createBatches(allSentences, MAX_BATCH_SIZE);
    
    let processedSentences = 0;
    const totalSentences = allSentences.length;
    
    for (let i = 0; i < sentenceBatches.length; i++) {
      const batch = sentenceBatches[i];
      const batchProgress = 40 + (35 * (i + 1) / sentenceBatches.length);
      
      const paragraphIndex = Math.floor(processedSentences / (totalSentences / parsedText.paragraphs.length));
      
      progressCallback(
        batchProgress, 
        `Generazione embeddings per P${paragraphIndex + 1} (Batch ${i + 1}/${sentenceBatches.length}, ${batch.length} frasi)`,
        'stepEmbeddings', 
        'active'
      );
      
      const batchCacheKey = generateCacheKey(batch);
      let batchEmbeddings;
      
      if (cache[batchCacheKey] && !isCacheExpired(cache[batchCacheKey])) {
        batchEmbeddings = cache[batchCacheKey].embeddings;
      } else {
        batchEmbeddings = await generateEmbeddings(apiKey, batch);
        cache[batchCacheKey] = {
          embeddings: batchEmbeddings,
          timestamp: Date.now()
        };
        saveCache(cache);
      }
      
      embeddings.sentences.push(...batchEmbeddings);
      processedSentences += batch.length;
      
      if (i < sentenceBatches.length - 1) {
        await sleep(200);
      }
    }

    progressCallback(75, 'Calcolo embeddings per paragrafi...', 'stepEmbeddings', 'active');
    
    let sentenceIndex = 0;
    for (const paragraph of parsedText.paragraphs) {
      const paragraphSentenceEmbeddings = embeddings.sentences.slice(
        sentenceIndex, 
        sentenceIndex + paragraph.sentences.length
      );
      
      const paragraphEmbedding = calculateAverageEmbedding(paragraphSentenceEmbeddings);
      embeddings.paragraphs.push(paragraphEmbedding);
      
      sentenceIndex += paragraph.sentences.length;
    }

    return embeddings;

  } catch (error) {
    throw new Error(`Errore durante la generazione degli embeddings: ${error.message}`);
  }
}

function createBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

function calculateAverageEmbedding(embeddings) {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return embeddings[0];
  
  const dimension = embeddings[0].length;
  const average = new Array(dimension).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i];
    }
  }
  
  return average.map(val => val / embeddings.length);
}

function generateCacheKey(texts) {
  const concatenated = texts.join('|');
  // Encode the string to a Base64-safe format to handle Unicode characters
  const utf8 = unescape(encodeURIComponent(concatenated));
  return btoa(utf8).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

function loadCache() {
  try {
    const cached = localStorage.getItem(EMBEDDING_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.warn('Failed to load embeddings cache:', error);
    return {};
  }
}

function saveCache(cache) {
  try {
    const now = Date.now();
    const cleanedCache = {};
    
    Object.entries(cache).forEach(([key, value]) => {
      if (!isCacheExpired(value, now)) {
        cleanedCache[key] = value;
      }
    });
    
    localStorage.setItem(EMBEDDING_CACHE_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    console.warn('Failed to save embeddings cache:', error);
  }
}

function isCacheExpired(cacheEntry, now = Date.now()) {
  return !cacheEntry.timestamp || (now - cacheEntry.timestamp) > CACHE_EXPIRY;
}

export function clearCache() {
  localStorage.removeItem(EMBEDDING_CACHE_KEY);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
