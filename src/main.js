import '../styles/main.css';
import { initializeApp } from './ui/progressIndicator.js';
import { setupEventListeners } from './ui/resultsRenderer.js';

// --- DOM Elements ---
const dom = {
  apiKeyInput: null,
  keywordInput: null,
  contentInput: null,
  analyzeBtn: null,
  toggleApiKeyBtn: null,
  charCount: null,
  wordCount: null,
  analyzeBtnHelp: null,
  eyeIcon: null,
  darkModeToggle: null,
  darkModeIcon: null,
  enableStopwords: null,
};

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  dom.apiKeyInput = document.getElementById('apiKey');
  dom.keywordInput = document.getElementById('targetKeyword');
  dom.contentInput = document.getElementById('contentText');
  dom.analyzeBtn = document.getElementById('analyzeBtn');
  dom.toggleApiKeyBtn = document.getElementById('toggleApiKey');
  dom.charCount = document.getElementById('charCount');
  dom.wordCount = document.getElementById('wordCount');
  dom.analyzeBtnHelp = document.getElementById('analyzeBtnHelp');
  dom.eyeIcon = document.getElementById('eyeIcon');
  dom.darkModeToggle = document.getElementById('darkModeToggle');
  dom.darkModeIcon = document.getElementById('darkModeIcon');
  dom.enableStopwords = document.getElementById('enableStopwords');

  initializeApp();
  setupEventListeners(); // From resultsRenderer.js
  setupFormValidation();
  setupDarkMode();
  setupStopwords();
  loadSavedApiKey();
});

// --- Functions ---
function loadSavedApiKey() {
  const savedApiKey = localStorage.getItem('gemini_api_key');
  if (savedApiKey) {
    dom.apiKeyInput.value = savedApiKey;
  }
  // Always validate form on load to set initial button state
  validateForm();
}

function setupFormValidation() {
  dom.toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  
  dom.apiKeyInput.addEventListener('input', () => {
    const apiKey = dom.apiKeyInput.value.trim();
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
    validateForm();
  });

  dom.contentInput.addEventListener('input', () => {
    const content = dom.contentInput.value;
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    dom.charCount.textContent = `${chars.toLocaleString()} caratteri`;
    dom.wordCount.textContent = `${words.toLocaleString()} parole`;
    
    validateForm();
  });

  dom.keywordInput.addEventListener('input', validateForm);
}

function toggleApiKeyVisibility() {
  const isPassword = dom.apiKeyInput.type === 'password';
  dom.apiKeyInput.type = isPassword ? 'text' : 'password';
  
  dom.eyeIcon.innerHTML = isPassword 
    ? `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    ` 
    : `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    `;
}

function validateForm() {
  const apiKey = dom.apiKeyInput.value.trim();
  const keyword = dom.keywordInput.value.trim();
  const content = dom.contentInput.value.trim();
  
  // Enhanced API key validation
  const isValidApiKey = apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
  const isValidKeyword = keyword.length > 0 && keyword.length <= 100;
  const isValidContent = content.length >= 100 && content.length <= 50000;
  
  const isValid = isValidApiKey && isValidKeyword && isValidContent;
  
  dom.analyzeBtn.disabled = !isValid;
  
  // Update help text with specific validation errors
  let helpText = '';
  if (!isValidApiKey) {
    helpText = 'API key deve essere di almeno 20 caratteri alfanumerici.';
  } else if (!isValidKeyword) {
    helpText = 'Parola chiave richiesta (max 100 caratteri).';
  } else if (!isValidContent) {
    helpText = 'Contenuto deve essere tra 100 e 50.000 caratteri.';
  }
  
  if (isValid) {
    dom.analyzeBtnHelp.classList.add('hidden');
  } else {
    dom.analyzeBtnHelp.textContent = helpText;
    dom.analyzeBtnHelp.classList.remove('hidden');
  }
  
  // Add visual feedback to input fields
  updateInputValidationState(dom.apiKeyInput, isValidApiKey);
  updateInputValidationState(dom.keywordInput, isValidKeyword);
  updateInputValidationState(dom.contentInput, isValidContent);
}

function updateInputValidationState(input, isValid) {
  if (!input) return;
  
  // Remove existing validation classes
  input.classList.remove('border-red-500', 'border-green-500', 'border-gray-300', 'dark:border-gray-600');
  
  if (input.value.trim() === '') {
    // Default state for empty fields
    input.classList.add('border-gray-300', 'dark:border-gray-600');
  } else if (isValid) {
    // Valid state
    input.classList.add('border-green-500');
  } else {
    // Invalid state
    input.classList.add('border-red-500');
  }
}

function setupDarkMode() {
  // Load saved dark mode preference
  const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
  if (savedDarkMode) {
    document.documentElement.classList.add('dark');
    updateDarkModeIcon(true);
  }

  // Setup dark mode toggle
  if (dom.darkModeToggle) {
    dom.darkModeToggle.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  const isDarkMode = document.documentElement.classList.toggle('dark');
  localStorage.setItem('dark_mode', isDarkMode.toString());
  updateDarkModeIcon(isDarkMode);
}

function updateDarkModeIcon(isDarkMode) {
  if (dom.darkModeIcon) {
    dom.darkModeIcon.innerHTML = isDarkMode 
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
  }
}

function setupStopwords() {
  // Load saved stopwords preference
  const savedStopwords = localStorage.getItem('enable_stopwords') !== 'false'; // Default to true
  if (dom.enableStopwords) {
    dom.enableStopwords.checked = savedStopwords;
    
    // Setup event listener
    dom.enableStopwords.addEventListener('change', () => {
      localStorage.setItem('enable_stopwords', dom.enableStopwords.checked.toString());
    });
  }
}

// Export function to get current stopwords setting
export function getStopwordsEnabled() {
  return dom.enableStopwords ? dom.enableStopwords.checked : true;
}
