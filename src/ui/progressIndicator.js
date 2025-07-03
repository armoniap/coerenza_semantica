export function initializeApp() {
  console.log('Content Coherence Analyzer initialized');
  resetUI();
  resetProgress();
}

export function updateProgress(percentage, message, stepId, status) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressPercentage = document.getElementById('progressPercentage');
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = message;
  }
  
  if (progressPercentage) {
    progressPercentage.textContent = `${Math.round(percentage)}%`;
  }
  
  if (stepId) {
    updateStepStatus(stepId, status);
  }
  
  if (progressBar) {
    progressBar.style.transition = 'width 0.3s ease-in-out';
  }
}

function updateStepStatus(stepId, status) {
  const stepElement = document.getElementById(stepId);
  if (!stepElement) return;
  
  const indicator = stepElement.querySelector('.w-4.h-4');
  if (!indicator) return;
  
  indicator.classList.remove('border-gray-300', 'border-blue-500', 'bg-blue-500', 'border-green-500', 'bg-green-500');
  
  switch (status) {
    case 'active':
      indicator.classList.add('border-blue-500', 'bg-blue-500');
      indicator.style.animation = 'pulse 2s infinite';
      break;
    case 'completed':
      indicator.classList.add('border-green-500', 'bg-green-500');
      indicator.style.animation = 'none';
      indicator.innerHTML = `
        <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      `;
      break;
    case 'pending':
    default:
      indicator.classList.add('border-gray-300');
      indicator.style.animation = 'none';
      indicator.innerHTML = '';
      break;
  }
}

export function resetProgress() {
  updateProgress(0, 'Pronto per l\'analisi...', null, null);
  
  const steps = ['stepStructure', 'stepEmbeddings', 'stepCalculation'];
  steps.forEach(stepId => updateStepStatus(stepId, 'pending'));
}

function resetUI() {
  const progressSection = document.getElementById('progressSection');
  const resultsSection = document.getElementById('resultsSection');
  const errorSection = document.getElementById('errorSection');
  
  if (progressSection) progressSection.classList.add('hidden');
  if (resultsSection) resultsSection.classList.add('hidden');
  if (errorSection) errorSection.classList.add('hidden');
  
  const summaryMetrics = document.getElementById('summaryMetrics');
  const paragraphAnalysis = document.getElementById('paragraphAnalysis');
  
  if (summaryMetrics) summaryMetrics.innerHTML = '';
  if (paragraphAnalysis) paragraphAnalysis.innerHTML = '';
}

export function showError(message) {
  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  
  if (errorSection) {
    errorSection.classList.remove('hidden');
  }
  
  hideSection('progressSection');
  hideSection('resultsSection');
}

export function resetAnalyzeButton() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <span class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Analizza Contenuto
      </span>
    `;
  }
}

export function setAnalyzeButtonLoading() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <span class="flex items-center">
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Analizzando...
      </span>
    `;
  }
}

export function completeAllSteps() {
  updateStepStatus('stepStructure', 'completed');
  updateStepStatus('stepEmbeddings', 'completed');
  updateStepStatus('stepCalculation', 'completed');
}

export function hideSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('hidden');
  }
}

export function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
  }
}
