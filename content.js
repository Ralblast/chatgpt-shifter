/**
 * ChatGPT Layout Shifter - Content Script
 */

const CONFIG = {
  VAR_NAME: '--shifter-offset',
  CLASS_NAME: 'shifter-active'
};

function applyLayout(offsetPx) {
  const root = document.documentElement;
  const body = document.body;
  
  root.style.setProperty(CONFIG.VAR_NAME, `${offsetPx}px`);
  
  if (Math.abs(offsetPx) > 0) {
    body.classList.add(CONFIG.CLASS_NAME);
  } else {
    body.classList.remove(CONFIG.CLASS_NAME);
  }
}

function initialize() {
  chrome.storage.sync.get(['savedOffset'], (result) => {
    const offset = result.savedOffset || 0;
    applyLayout(offset);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_LAYOUT') {
    applyLayout(message.payload);
    sendResponse({ status: 'success' });
  }
  return true;
});
