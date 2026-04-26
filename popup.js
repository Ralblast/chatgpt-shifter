'use strict';

const KEY_OFFSET    = 'savedOffset';
const KEY_SIDEBAR   = 'hideSidebar';
const KEY_SIDEBAR_W = 'sidebarWidth';
const KEY_SIDEBAR_R = 'sidebarRight';
const KEY_PRESETS   = 'savedPresets';
const DEFAULT_LEFT      = -350;
const DEFAULT_RIGHT     =  350;
const DEFAULT_SIDEBAR_W = 260;

let offset       = 0;
let lastOffset   = DEFAULT_LEFT;
let hideSidebar  = false;
let sidebarWidth = null;
let sidebarRight = false;
let presets      = { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  const isGPT = await onChatGPT();
  $('status-dot').classList.toggle('active', isGPT);
  if (!isGPT) $('app').classList.add('disabled');

  chrome.storage.sync.get([KEY_OFFSET, KEY_SIDEBAR, KEY_SIDEBAR_W, KEY_SIDEBAR_R, KEY_PRESETS], (r) => {
    if (r[KEY_PRESETS]) presets = { ...presets, ...r[KEY_PRESETS] };

    hideSidebar  = r[KEY_SIDEBAR]   ?? false;
    sidebarRight = r[KEY_SIDEBAR_R] ?? false;
    $('sidebar-toggle').setAttribute('aria-pressed', String(hideSidebar));
    $('sidebar-left-btn').classList.toggle('active',  !sidebarRight);
    $('sidebar-right-btn').classList.toggle('active',  sidebarRight);
    updateSidebarWidgetVisibility();

    sidebarWidth = r[KEY_SIDEBAR_W] ?? null;
    const sw = sidebarWidth ?? DEFAULT_SIDEBAR_W;
    $('sidebar-width-slider').value = sw;
    $('sidebar-width-num').value    = sw;

    const saved = r[KEY_OFFSET] ?? 0;
    offset = saved;
    if (saved !== 0) lastOffset = saved;
    syncUI(saved, false);
  });

  bindEvents();
});

function setOffset(val, propagate = true) {
  const v = clamp(Math.round(val), -700, 700);
  offset = v;
  if (v !== 0) lastOffset = v;
  syncUI(v, propagate);
}

function syncUI(v, propagate) {
  $('slider').value = v;
  if (document.activeElement !== $('num')) $('num').value = v;

  $('btn-left').classList.toggle('active',   v < 0);
  $('btn-center').classList.toggle('active', v === 0);
  $('btn-right').classList.toggle('active',  v > 0);

  $('btn-toggle').classList.toggle('off', v === 0);
  $('btn-toggle').title = v !== 0 ? 'Turn off shift' : 'Turn on shift';

  if (propagate) send('SET_OFFSET', v);
  debounce('save-offset', () => {
    chrome.storage.sync.set({ [KEY_OFFSET]: v });
    if (v < 0) { presets.left  = v; chrome.storage.sync.set({ [KEY_PRESETS]: presets }); }
    if (v > 0) { presets.right = v; chrome.storage.sync.set({ [KEY_PRESETS]: presets }); }
  }, 400);
}

function updateSidebarWidgetVisibility() {
  $('sidebar-width-wrap').style.display = hideSidebar ? 'none' : 'block';
}

function bindEvents() {
  $('slider').addEventListener('input', e => setOffset(+e.target.value));

  $('num').addEventListener('input', e => {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v)) return;
    const clamped = clamp(v, -700, 700);
    $('slider').value = clamped;
    debounce('num-send', () => {
      offset = clamped;
      if (clamped !== 0) lastOffset = clamped;
      send('SET_OFFSET', clamped);
      debounce('save-offset', () => chrome.storage.sync.set({ [KEY_OFFSET]: clamped }), 400);
    }, 150);
  });
  $('num').addEventListener('change', e => {
    clearTimeout(_t['num-send']);
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) setOffset(v);
    else $('num').value = offset;
  });
  $('num').addEventListener('keydown', e => {
    if (e.key === 'Enter') e.target.blur();
  });

  $('btn-left').addEventListener('click',   () => setOffset(presets.left));
  $('btn-center').addEventListener('click', () => setOffset(0));
  $('btn-right').addEventListener('click',  () => setOffset(presets.right));

  $('btn-toggle').addEventListener('click', () => {
    setOffset(offset !== 0 ? 0 : (lastOffset || presets.left));
  });

  $('sidebar-toggle').addEventListener('click', () => {
    hideSidebar = !hideSidebar;
    $('sidebar-toggle').setAttribute('aria-pressed', String(hideSidebar));
    updateSidebarWidgetVisibility();
    chrome.storage.sync.set({ [KEY_SIDEBAR]: hideSidebar });
    send('SET_SIDEBAR', hideSidebar);
  });

  $('sidebar-width-slider').addEventListener('input', e => {
    const w = parseInt(e.target.value, 10);
    if (document.activeElement !== $('sidebar-width-num')) {
      $('sidebar-width-num').value = w;
    }
    const val = w === DEFAULT_SIDEBAR_W ? null : w;
    sidebarWidth = val;
    send('SET_SIDEBAR_WIDTH', val);
    debounce('save-sw', () => chrome.storage.sync.set({ [KEY_SIDEBAR_W]: val }), 400);
  });

  $('sidebar-width-num').addEventListener('input', e => {
    const w = parseInt(e.target.value, 10);
    if (isNaN(w)) return;
    const cw = clamp(w, 100, 400);
    $('sidebar-width-slider').value = cw;
    debounce('sw-num-send', () => {
      const val = cw === DEFAULT_SIDEBAR_W ? null : cw;
      sidebarWidth = val;
      send('SET_SIDEBAR_WIDTH', val);
      debounce('save-sw', () => chrome.storage.sync.set({ [KEY_SIDEBAR_W]: val }), 400);
    }, 150);
  });
  $('sidebar-width-num').addEventListener('change', e => {
    const w = clamp(parseInt(e.target.value, 10) || DEFAULT_SIDEBAR_W, 100, 400);
    $('sidebar-width-slider').value = w;
    const val = w === DEFAULT_SIDEBAR_W ? null : w;
    sidebarWidth = val;
    send('SET_SIDEBAR_WIDTH', val);
    chrome.storage.sync.set({ [KEY_SIDEBAR_W]: val });
  });
  $('sidebar-width-num').addEventListener('keydown', e => {
    if (e.key === 'Enter') e.target.blur();
  });

  $('sidebar-left-btn').addEventListener('click', () => {
    sidebarRight = false;
    $('sidebar-left-btn').classList.add('active');
    $('sidebar-right-btn').classList.remove('active');
    chrome.storage.sync.set({ [KEY_SIDEBAR_R]: false });
    send('SET_SIDEBAR_RIGHT', false);
  });
  $('sidebar-right-btn').addEventListener('click', () => {
    sidebarRight = true;
    $('sidebar-right-btn').classList.add('active');
    $('sidebar-left-btn').classList.remove('active');
    chrome.storage.sync.set({ [KEY_SIDEBAR_R]: true });
    send('SET_SIDEBAR_RIGHT', true);
  });

  $('btn-reset').addEventListener('click', () => {
    presets      = { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };
    hideSidebar  = false;
    sidebarRight = false;
    sidebarWidth = null;
    $('sidebar-toggle').setAttribute('aria-pressed', 'false');
    $('sidebar-left-btn').classList.add('active');
    $('sidebar-right-btn').classList.remove('active');
    $('sidebar-width-slider').value = DEFAULT_SIDEBAR_W;
    $('sidebar-width-num').value    = DEFAULT_SIDEBAR_W;
    updateSidebarWidgetVisibility();
    chrome.storage.sync.set({
      [KEY_PRESETS]:   presets,
      [KEY_SIDEBAR]:   false,
      [KEY_SIDEBAR_W]: null,
      [KEY_SIDEBAR_R]: false,
    });
    send('SET_SIDEBAR', false);
    send('SET_SIDEBAR_RIGHT', false);
    send('SET_SIDEBAR_WIDTH', null);
    setOffset(0);
  });
}

function send(type, value) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type, value }).catch(() => {
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ['content.js'] },
        () => {
          if (!chrome.runtime.lastError) {
            setTimeout(() => chrome.tabs.sendMessage(tab.id, { type, value }).catch(() => {}), 300);
          }
        }
      );
    });
  });
}

async function onChatGPT() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url?.toLowerCase() || '';
    return url.includes('chatgpt.com') || url.includes('chat.openai.com');
  } catch { return false; }
}

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

const _t = {};
function debounce(key, fn, ms) {
  clearTimeout(_t[key]);
  _t[key] = setTimeout(fn, ms);
}
