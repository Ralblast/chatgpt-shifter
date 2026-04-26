(() => {
  'use strict';

  const STYLE_ID      = 'gpt-shifter-v3';
  const KEY_OFFSET    = 'savedOffset';
  const KEY_SIDEBAR   = 'hideSidebar';
  const KEY_SIDEBAR_W = 'sidebarWidth';
  const KEY_SIDEBAR_R = 'sidebarRight';
  const KEY_PRESETS   = 'savedPresets';

  let offset       = 0;
  let hideSidebar  = false;
  let sidebarWidth = null;
  let sidebarRight = false;
  let styleEl      = null;
  let lastUrl      = location.href;
  let resizeTimer  = null;

  function buildCSS() {
    let css = 'html,body{overflow-x:hidden!important}';

    if (offset !== 0) {
      css += `
#thread{
  transform:translateX(${offset}px)!important;
  transition:transform .15s ease!important;
  will-change:transform!important;
}
#main{overflow-x:hidden!important}
.composer-parent:not(#thread .composer-parent){
  transform:translateX(${offset}px)!important;
  transition:transform .15s ease!important;
  will-change:transform!important;
}`;
    }

    if (hideSidebar) {
      css += `
:root{--sidebar-width:0px!important}
nav{width:0!important;min-width:0!important;overflow:hidden!important;flex-shrink:0!important}
nav+*,nav~*{transition:none!important}`;
    }

    if (!hideSidebar && sidebarWidth !== null) {
      css += `
:root{--sidebar-width:${sidebarWidth}px!important}
nav{width:${sidebarWidth}px!important;min-width:${sidebarWidth}px!important;max-width:${sidebarWidth}px!important;overflow:hidden!important}`;
    }

    if (sidebarRight && !hideSidebar) {
      css += '\n#main{order:-1!important}';
    }

    return css;
  }

  function render() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = buildCSS();
  }

  function setOffset(px)       { offset = px;       render(); }
  function setSidebar(on)      { hideSidebar = on;   render(); }
  function setSidebarWidth(px) { sidebarWidth = px;  render(); }
  function setSidebarRight(on) { sidebarRight = on;  render(); }

  // Poll URL instead of MutationObserver — avoids jitter while typing
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(render, 400); // wait for React to remount #thread
    }
  }, 500);

  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 50);
  }).observe(document.documentElement);

  // ChatGPT sets --sidebar-width via inline style, which beats our stylesheet rule.
  // Re-enforce our value immediately when it changes.
  let rootLocked = false;
  new MutationObserver(() => {
    if (rootLocked) return;
    if (!hideSidebar && sidebarWidth === null) return;
    const target  = hideSidebar ? '0px' : `${sidebarWidth}px`;
    const current = document.documentElement.style.getPropertyValue('--sidebar-width');
    if (current && current !== target) {
      rootLocked = true;
      document.documentElement.style.setProperty('--sidebar-width', target);
      requestAnimationFrame(() => { rootLocked = false; });
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  // Alt+Shift+[ / ] / backslash  — use e.code, not e.key (Shift remaps [ ] \ to { } |)
  document.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey) return;
    let action;
    switch (e.code) {
      case 'BracketLeft':  action = 'left';   break;
      case 'BracketRight': action = 'right';  break;
      case 'Backslash':    action = 'center'; break;
      default: return;
    }
    chrome.storage.sync.get([KEY_PRESETS], (r) => {
      const p    = r[KEY_PRESETS] || { left: -350, right: 350 };
      const next = action === 'center' ? 0 : p[action];
      setOffset(next);
      chrome.storage.sync.set({ [KEY_OFFSET]: next });
    });
  });

  function init() {
    chrome.storage.sync.get([KEY_OFFSET, KEY_SIDEBAR, KEY_SIDEBAR_W, KEY_SIDEBAR_R], (r) => {
      offset       = r[KEY_OFFSET]    ?? 0;
      hideSidebar  = r[KEY_SIDEBAR]   ?? false;
      sidebarWidth = r[KEY_SIDEBAR_W] ?? null;
      sidebarRight = r[KEY_SIDEBAR_R] ?? false;
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  chrome.runtime.onMessage.addListener((msg, _, reply) => {
    switch (msg.type) {
      case 'SET_OFFSET':        setOffset(msg.value);       break;
      case 'SET_SIDEBAR':       setSidebar(msg.value);      break;
      case 'SET_SIDEBAR_WIDTH': setSidebarWidth(msg.value); break;
      case 'SET_SIDEBAR_RIGHT': setSidebarRight(msg.value); break;
      case 'STATUS':
        reply({ ok: true, offset, hideSidebar, sidebarWidth, sidebarRight });
        return true;
      case 'CLEANUP':
        document.getElementById(STYLE_ID)?.remove();
        styleEl = null;
        break;
      default: return;
    }
    reply({ ok: true });
    return true;
  });

})();
