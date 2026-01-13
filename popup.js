const DEFAULT_OFFSET = 250;
let currentOffset = 0;

let presets = {
  left: -DEFAULT_OFFSET,
  center: 0,
  right: DEFAULT_OFFSET
};

const elements = {
  slider: document.getElementById('offset-slider'),
  numberInput: document.getElementById('number-input'),
  btnLeft: document.getElementById('btn-left'),
  btnCenter: document.getElementById('btn-center'),
  btnRight: document.getElementById('btn-right'),
  btnReset: document.getElementById('btn-reset-defaults'),
  appContainer: document.getElementById('app-container'),
  statusIndicator: document.getElementById('status-indicator')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  const isChatGPT = await checkContext();
  
  if (!isChatGPT) {
    disableUI();
    return;
  }
  
  chrome.storage.sync.get(['savedOffset', 'savedPresets'], (result) => {
    const saved = result.savedOffset !== undefined ? result.savedOffset : 0;
    if (result.savedPresets) {
      presets = result.savedPresets;
    }
    updateUIState(saved, false);
  });
});

// --- Core Logic ---
function updateUIState(value, shouldPropagate = true, isManualAdjustment = false) {
  const val = parseInt(value, 10);
  if (isNaN(val)) return; 
  const clampedVal = Math.max(-1000, Math.min(1000, val)); 
  currentOffset = clampedVal; 
  
  elements.slider.value = val;
  elements.numberInput.value = val;
  
  elements.btnLeft.classList.remove('active');
  elements.btnCenter.classList.remove('active');
  elements.btnRight.classList.remove('active');
  
  if (val === 0) elements.btnCenter.classList.add('active');
  else if (val < 0) elements.btnLeft.classList.add('active');
  else elements.btnRight.classList.add('active');
  
  if (isManualAdjustment) {
    if (val < 0) presets.left = val;
    else if (val > 0) presets.right = val;
    debouncedSavePresets();
  }
  
  if (shouldPropagate) {
    sendMessage(val);
    debouncedSave(val);
  }
}

// --- Communication ---
function sendMessage(offset, retryCount = 0) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_LAYOUT',
        payload: offset
      }).catch(() => {
        if (retryCount < 3) {
          setTimeout(() => sendMessage(offset, retryCount + 1), 300);
        }
      });
    }
  });
}

let debounceTimer;
function debouncedSave(value) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    chrome.storage.sync.set({ savedOffset: value });
  }, 500);
}

let presetDebounceTimer;
function debouncedSavePresets() {
  clearTimeout(presetDebounceTimer);
  presetDebounceTimer = setTimeout(() => {
    chrome.storage.sync.set({ savedPresets: presets });
  }, 1000);
}

// --- Event Listeners ---
elements.slider.addEventListener('input', (e) => {
  updateUIState(e.target.value, true, true);
});

elements.numberInput.addEventListener('change', (e) => {
  updateUIState(e.target.value, true, true);
});

elements.btnLeft.addEventListener('click', () => updateUIState(presets.left));
elements.btnCenter.addEventListener('click', () => updateUIState(presets.center));
elements.btnRight.addEventListener('click', () => updateUIState(presets.right));

elements.btnReset.addEventListener('click', () => {
  presets.left = -DEFAULT_OFFSET;
  presets.center = 0;
  presets.right = DEFAULT_OFFSET;
  chrome.storage.sync.set({ savedPresets: presets });
  updateUIState(0);
});

// --- Helpers ---
async function checkContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return false;
    
    const url = tab.url.toLowerCase();
    return url.includes('chatgpt.com') || url.includes('chat.openai.com');
  } catch {
    return false;
  }
}

function disableUI() {
  elements.appContainer.classList.add('disabled');
  elements.statusIndicator.classList.remove('hidden');
  elements.statusIndicator.textContent = "⚠️ Open ChatGPT to use";
}
