import { parseText, validateContent } from '../analyzers/textParser.js';
import { generateEmbeddingsWithProgress } from '../analyzers/embeddingGenerator.js';
import { calculateCoherence, getScoreColor, getScoreLabel } from '../analyzers/coherenceCalculator.js';
import { updateProgress, showError, resetAnalyzeButton, setAnalyzeButtonLoading, completeAllSteps, hideSection, showSection } from './progressIndicator.js';
import { generateSuggestions, generateSuggestionSummary } from '../analyzers/suggestionGenerator.js';
import { getStopwordsEnabled } from '../main.js';

let currentResults = null;

export function setupEventListeners() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyze);
  }

  const exportJsonBtn = document.getElementById('exportJson');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportToJson);
  }

  const exportCsvBtn = document.getElementById('exportCsv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCsv);
  }

  // Setup suggestion tabs
  document.querySelectorAll('.suggestions-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const priority = btn.dataset.priority;
      filterSuggestionsByPriority(priority);
      
      // Update active tab styling
      document.querySelectorAll('.suggestions-tab-btn').forEach(tab => {
        tab.classList.remove('border-blue-500', 'text-blue-600');
      });
      btn.classList.add('border-blue-500', 'text-blue-600');
    });
  });

  console.log('Event listeners initialized.');
}

async function handleAnalyze() {
  console.log('Analysis started...');
  setAnalyzeButtonLoading();
  hideSection('errorSection');
  hideSection('resultsSection');

  const apiKey = document.getElementById('apiKey').value.trim();
  const keyword = document.getElementById('targetKeyword').value.trim();
  const content = document.getElementById('contentText').value.trim();

  console.log('=== DEBUG: Raw content from textarea ===');
  console.log(content);
  console.log('=== END DEBUG ===');

  // --- 1. Input Validation ---
  console.log('Step 1: Validating inputs...');
  const validation = validateContent(content);
  if (!validation.isValid) {
    showError(validation.error);
    resetAnalyzeButton();
    return;
  }
  if (!apiKey || apiKey.length < 20) {
    showError('Inserisci una API Key valida per Google Gemini.');
    resetAnalyzeButton();
    return;
  }
  if (!keyword) {
    showError('Inserisci una keyword target.');
    resetAnalyzeButton();
    return;
  }
  console.log('Inputs are valid.');

  try {
    // --- 2. Text Parsing ---
    console.log('Step 2: Parsing text...');
    updateProgress(10, 'Analisi struttura documento...', 'stepStructure', 'active');
    const parsedText = parseText(content);
    console.log(`Text parsed: ${parsedText.paragraphs.length} paragraphs, ${parsedText.sentences.length} sentences.`);
    updateProgress(25, `Trovati ${parsedText.paragraphs.length} paragrafi e ${parsedText.sentences.length} frasi`, 'stepStructure', 'completed');

    // --- 3. Embedding Generation ---
    console.log('Step 3: Generating embeddings...');
    const embeddings = await generateEmbeddingsWithProgress(apiKey, keyword, parsedText, updateProgress);
    console.log('Embeddings generated successfully.');

    // --- 4. Coherence Calculation ---
    console.log('Step 4: Calculating coherence metrics...');
    updateProgress(80, 'Calcolo metriche di coerenza...', 'stepCalculation', 'active');
    const results = calculateCoherence(embeddings, parsedText, keyword);
    currentResults = results;
    console.log('Coherence metrics calculated.');
    updateProgress(95, 'Finalizzazione risultati...', 'stepCalculation', 'completed');
    completeAllSteps();

    // --- 5. Rendering Results ---
    console.log('Step 5: Rendering results...');
    updateProgress(100, 'Analisi completata!', null, null);
    setTimeout(() => {
      hideSection('progressSection');
      renderResults(results, keyword);
      showSection('resultsSection');
      resetAnalyzeButton();
      console.log('Analysis complete. Results rendered.');
    }, 500);

  } catch (error) {
    console.error('An error occurred during analysis:', error);
    showError(`Si è verificato un errore: ${error.message}`);
    resetAnalyzeButton();
  }
}

function renderResults(results, keyword) {
  renderSummaryMetrics(results.summary, keyword);
  
  // Generate suggestions for all paragraphs
  const suggestionResults = generateSuggestions(results, keyword);
  
  // Render paragraphs with integrated suggestions
  renderParagraphAnalysis(results.paragraphs, suggestionResults, keyword);
  
  // Hide the old suggestions section since we're integrating them into paragraphs
  hideSection('suggestions-section');
}

function renderSummaryMetrics(summary, keyword) {
  const summaryContainer = document.getElementById('summaryMetrics');
  if (!summaryContainer) return;

  const overallPct = Math.round(summary.overallCoherence * 100);
  const keywordPct = Math.round(summary.keywordAlignment * 100);
  const structuralPct = Math.round(summary.structuralCoherence * 100);
  const flowPct = Math.round(summary.flowCoherence * 100);

  summaryContainer.innerHTML = `
    <div class="bg-white dark:bg-dark-700 border ${getScoreColor(overallPct)} rounded-lg p-4">
      <div class="text-center"><div class="text-3xl font-bold mb-1">${overallPct}%</div><div class="text-sm font-medium text-gray-800 dark:text-gray-100">Coerenza Generale</div><div class="text-xs mt-1 text-gray-600 dark:text-gray-400">${getScoreLabel(overallPct)}</div></div>
    </div>
    <div class="bg-white dark:bg-dark-700 border ${getScoreColor(keywordPct)} rounded-lg p-4">
      <div class="text-center"><div class="text-2xl font-bold mb-1">${keywordPct}%</div><div class="text-sm font-medium text-gray-800 dark:text-gray-100">Allineamento Keyword</div><div class="text-xs mt-1 text-gray-600 dark:text-gray-400">vs. "${keyword}"</div></div>
    </div>
    <div class="bg-white dark:bg-dark-700 border ${getScoreColor(structuralPct)} rounded-lg p-4">
      <div class="text-center"><div class="text-2xl font-bold mb-1">${structuralPct}%</div><div class="text-sm font-medium text-gray-800 dark:text-gray-100">Coerenza Strutturale</div><div class="text-xs mt-1 text-gray-600 dark:text-gray-400">con sottotitoli</div></div>
    </div>
    <div class="bg-white dark:bg-dark-700 border ${getScoreColor(flowPct)} rounded-lg p-4">
      <div class="text-center"><div class="text-2xl font-bold mb-1">${flowPct}%</div><div class="text-sm font-medium text-gray-800 dark:text-gray-100">Flusso</div><div class="text-xs mt-1 text-gray-600 dark:text-gray-400">tra paragrafi</div></div>
    </div>
  `;
}

function renderParagraphAnalysis(paragraphs, suggestionResults, keyword) {
  const analysisContainer = document.getElementById('paragraphAnalysis');
  if (!analysisContainer) return;

  analysisContainer.innerHTML = paragraphs.map((p, index) => {
    // Filter suggestions for this paragraph
    const paragraphSuggestions = suggestionResults ? 
      suggestionResults.suggestions.filter(s => s.paragraphIndex === index) : [];
    
    const highPrioritySuggestions = paragraphSuggestions.filter(s => s.priority === 'high');
    const mediumPrioritySuggestions = paragraphSuggestions.filter(s => s.priority === 'medium');
    const totalSuggestions = paragraphSuggestions.length;

    const suggestionsSummary = totalSuggestions > 0 ? 
      `${highPrioritySuggestions.length} alta priorità, ${mediumPrioritySuggestions.length} media priorità` :
      'Nessun suggerimento';

    return `
    <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-dark-700">
      <div class="flex justify-between items-start mb-3">
        <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Paragrafo ${index + 1}</h4>
        <div class="text-sm text-gray-500 dark:text-gray-400">${p.wordCount} parole • ${p.sentenceCount} frasi</div>
      </div>
      <div class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${p.text}</div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div class="text-center"><div class="text-xl font-bold ${getScoreColor(p.keywordAlignment.percentage).split(' ')[0]}">${p.keywordAlignment.percentage}%</div><div class="text-xs text-gray-600 dark:text-gray-400">Keyword</div></div>
        <div class="text-center"><div class="text-xl font-bold ${getScoreColor(p.subheadingAlignment.percentage).split(' ')[0]}">${p.subheadingAlignment.percentage}%</div><div class="text-xs text-gray-600 dark:text-gray-400">Struttura</div></div>
        <div class="text-center"><div class="text-xl font-bold ${getScoreColor(p.internalCoherence.percentage).split(' ')[0]}">${p.internalCoherence.percentage}%</div><div class="text-xs text-gray-600 dark:text-gray-400">Interna</div></div>
      </div>
      
      <!-- Toggle buttons row -->
      <div class="flex gap-4 mb-4">
        <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium" onclick="toggleSentenceDetails(${index})">
          <span id="toggle-text-${index}">Mostra dettagli frasi</span>
          <svg id="toggle-icon-${index}" class="inline w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        
        ${totalSuggestions > 0 ? `
        <button class="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-sm font-medium" onclick="toggleSuggestions(${index})">
          <span id="suggestions-toggle-text-${index}">💡 Suggerimenti (${suggestionsSummary})</span>
          <svg id="suggestions-toggle-icon-${index}" class="inline w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        ` : ''}
      </div>

      <!-- Sentence details section -->
      <div id="sentence-details-${index}" class="hidden mt-4 space-y-2">
        ${p.sentences.map((s, sIndex) => `
          <div class="bg-gray-50 dark:bg-dark-600 rounded p-3">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Frase ${sIndex + 1}</span>
              <span class="text-sm ${getScoreColor(s.keywordSimilarity.percentage).split(' ')[0]} font-medium">${s.keywordSimilarity.percentage}% keyword</span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">${s.text}</div>
          </div>
        `).join('')}
      </div>

      <!-- Suggestions section -->
      ${totalSuggestions > 0 ? `
      <div id="suggestions-${index}" class="hidden mt-4 space-y-3">
        ${paragraphSuggestions.map((suggestion, sIdx) => `
          <div class="bg-gradient-to-r ${suggestion.priority === 'high' ? 'from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-700' : 'from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700'} rounded-lg p-4 border">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-1">
                ${suggestion.priority === 'high' ? '🔴' : '🟡'}
              </div>
              <div class="flex-1">
                <h5 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${suggestion.title}</h5>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">${suggestion.description}</p>
                
                ${suggestion.targetSentence ? `
                <div class="mb-3 p-2 bg-white/50 dark:bg-dark-800/50 rounded text-sm italic border-l-4 ${suggestion.priority === 'high' ? 'border-red-400' : 'border-yellow-400'}">
                  "${suggestion.targetSentence}"
                </div>
                ` : ''}
                
                <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
                  <p class="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Suggerimento:</p>
                  <p class="text-blue-700 dark:text-blue-200">${suggestion.actionSuggestion}</p>
                </div>
                
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Punteggio attuale: ${Math.round(suggestion.currentScore * 100)}% • ${suggestion.expectedImprovement}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  `;
  }).join('');
}

function renderSuggestions(suggestionResults, keyword) {
  const summaryContainer = document.getElementById('suggestions-summary');
  const contentContainer = document.getElementById('suggestions-content');
  
  if (!summaryContainer || !contentContainer) return;

  // Update counts in tabs
  document.querySelector('.high-count').textContent = suggestionResults.priorities.high.length;
  document.querySelector('.medium-count').textContent = suggestionResults.priorities.medium.length;

  // Render summary
  const summary = generateSuggestionSummary(suggestionResults);
  summaryContainer.innerHTML = `
    <div class="bg-white rounded-lg p-4 mb-4 border ${summary.tone === 'warning' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}">
      <p class="${summary.tone === 'warning' ? 'text-red-800' : 'text-blue-800'}">${summary.message}</p>
    </div>
  `;

  // Render all suggestions by default
  contentContainer.innerHTML = suggestionResults.suggestions.map((suggestion, idx) => `
    <div class="bg-white rounded-lg p-4 border ${suggestion.priority === 'high' ? 'border-red-200' : 'border-yellow-200'}">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-1">
          ${suggestion.priority === 'high' ? '🔴' : '🟡'}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800">${suggestion.title}</h4>
          <p class="text-sm text-gray-600 mt-1">${suggestion.description}</p>
          
          ${suggestion.targetSentence ? `
            <div class="mt-2 p-2 bg-gray-50 rounded text-sm italic">
              "${suggestion.targetSentence}"
            </div>
          ` : ''}
          
          <div class="mt-3 p-3 bg-blue-50 rounded text-sm">
            <p class="font-medium text-blue-800">Suggerimento:</p>
            <p>${suggestion.actionSuggestion}</p>
          </div>
          
          <div class="mt-2 text-xs text-gray-500">
            Punteggio attuale: ${Math.round(suggestion.currentScore * 100)}% • ${suggestion.expectedImprovement}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterSuggestionsByPriority(priority) {
  const contentContainer = document.getElementById('suggestions-content');
  if (!contentContainer) return;

  const allSuggestions = Array.from(contentContainer.children);
  
  allSuggestions.forEach(suggestion => {
    const isHighPriority = suggestion.querySelector('div:first-child').textContent.includes('🔴');
    const isMediumPriority = suggestion.querySelector('div:first-child').textContent.includes('🟡');
    
    if (priority === 'high') {
      suggestion.style.display = isHighPriority ? 'block' : 'none';
    } else if (priority === 'medium') {
      suggestion.style.display = isMediumPriority ? 'block' : 'none';
    } else {
      suggestion.style.display = 'block';
    }
  });
}

window.toggleSentenceDetails = function(paragraphIndex) {
  const details = document.getElementById(`sentence-details-${paragraphIndex}`);
  const toggleText = document.getElementById(`toggle-text-${paragraphIndex}`);
  const toggleIcon = document.getElementById(`toggle-icon-${paragraphIndex}`);
  if (details) {
    const isHidden = details.classList.toggle('hidden');
    if (toggleText) toggleText.textContent = isHidden ? 'Mostra dettagli frasi' : 'Nascondi dettagli frasi';
    if (toggleIcon) toggleIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  }
};

window.toggleSuggestions = function(paragraphIndex) {
  const suggestions = document.getElementById(`suggestions-${paragraphIndex}`);
  const toggleIcon = document.getElementById(`suggestions-toggle-icon-${paragraphIndex}`);
  if (suggestions) {
    const isHidden = suggestions.classList.toggle('hidden');
    if (toggleIcon) toggleIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  }
};

function exportToJson() {
  if (!currentResults) {
    alert('Nessun risultato da esportare. Esegui prima un\'analisi.');
    return;
  }
  const data = { timestamp: new Date().toISOString(), results: currentResults };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coherence-analysis-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToCsv() {
  if (!currentResults) {
    alert('Nessun risultato da esportare. Esegui prima un\'analisi.');
    return;
  }
  const headers = ['Paragrafo', 'Keyword Alignment (%)', 'Structural Coherence (%)', 'Internal Coherence (%)', 'Testo'];
  const rows = currentResults.paragraphs.map(p => [
    p.index + 1,
    p.keywordAlignment.percentage,
    p.subheadingAlignment.percentage,
    p.internalCoherence.percentage,
    `"${p.text.replace(/"/g, '""')}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coherence-analysis-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
