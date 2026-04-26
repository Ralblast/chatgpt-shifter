const GPT_ORIGINS  = ['https://chatgpt.com/*', 'https://chat.openai.com/*'];
const GPT_PATTERNS = ['chatgpt.com', 'chat.openai.com'];

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set({
      savedOffset:  0,
      hideSidebar:  false,
      sidebarRight: false,
      sidebarWidth: null,
      savedPresets: { left: -350, right: 350 },
    });
  }

  // Re-inject into open ChatGPT tabs so stale script versions are replaced
  const tabs = await chrome.tabs.query({ url: GPT_ORIGINS });
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'CLEANUP' }).catch(() => {});
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    } catch (_) {}
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!GPT_PATTERNS.some(p => tab.url?.includes(p))) return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'STATUS' });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
  }
});
