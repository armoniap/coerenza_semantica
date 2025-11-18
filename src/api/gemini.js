const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'gemini-embedding-001'; // ✅ AGGIORNATO
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export async function generateEmbeddings(apiKey, texts, taskType = 'SEMANTIC_SIMILARITY') {
  if (!apiKey || !texts || texts.length === 0) {
    throw new Error('API key and texts are required');
  }

  const url = `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  
  const embeddings = [];
  
  // Process texts one by one instead of batch
  for (const text of texts) {
    const requestBody = {
      model: `models/${EMBEDDING_MODEL}`, // ✅ AGGIORNATO
      content: {
        parts: [{ text }]
      },
      taskType
    };

    const response = await makeRequestWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    embeddings.push(response);
  }
  
  return embeddings;
}

async function makeRequestWithRetry(url, options, retryCount = 0) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        return makeRequestWithRetry(url, options, retryCount + 1);
      }
      
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(`Server error ${response.status}. Retrying in ${delay}ms...`);
        await sleep(delay);
        return makeRequestWithRetry(url, options, retryCount + 1);
      }
      
      throw new Error(`API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.embedding || !data.embedding.values) {
      throw new Error('Invalid response format from Gemini API');
    }

    return data.embedding.values;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Errore di connessione. Verifica la tua connessione internet.');
    }

    if (retryCount < MAX_RETRIES && (
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('fetch')
    )) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`Network error. Retrying in ${delay}ms...`);
      await sleep(delay);
      return makeRequestWithRetry(url, options, retryCount + 1);
    }

    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  return apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}

export async function testApiKey(apiKey) {
  try {
    const testText = ['test'];
    await generateEmbeddings(apiKey, testText, 'SEMANTIC_SIMILARITY');
    return true;
  } catch (error) {
    console.error('API key test failed:', error.message);
    return false;
  }
}
