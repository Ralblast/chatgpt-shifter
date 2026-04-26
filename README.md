# ChatGPT Layout Shifter

Shifts ChatGPT's chat column left or right. Useful when you want it side-by-side with an IDE or any other app without resizing windows.

## Why

- You're coding and want ChatGPT on the left half of the screen while your editor stays on the right — without snapping or resizing windows
- You're on an ultrawide and the centered chat column feels wasteful
- You have a vertical monitor and the default layout doesn't sit right
- You want the sidebar on the right side instead of left, or hidden entirely to maximise chat width

## Install

1. Clone or download this repo
2. Go to `chrome://extensions/` → enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. Open [chatgpt.com](https://chatgpt.com) and click the extension icon

## What it does

**Position** — Left / Center / Right presets. The buttons remember the last position you dragged to, so they become your personal presets over time.

**Offset** — Slider from -700px to +700px, or type an exact value. Changes are live.

**Hide sidebar** — Collapses the nav entirely, gives all the space to the chat.

**Sidebar side** — Move the sidebar to the right instead of left.

**Sidebar width** — Resize the sidebar if you don't want to hide it completely.

**Keyboard shortcuts** (work on the ChatGPT page itself):
- `Alt+Shift+[` — jump to left preset
- `Alt+Shift+]` — jump to right preset  
- `Alt+Shift+\` — center (reset)

All settings sync via Chrome's storage and persist across sessions.

## Files

```
manifest.json     extension config
background.js     install/update handler, tab injection
content.js        injects the CSS into ChatGPT, handles messages
popup.html/css/js popup UI
styles.css        static base styles (loaded before content.js runs)
```

## How it works

`content.js` builds a single `<style>` tag and rewrites it whenever state changes. No DOM walking — targets stable selectors (`#thread`, `#main`, `nav`) plus the `--sidebar-width` CSS variable ChatGPT already uses internally.

URL polling (500ms interval) handles SPA navigation without MutationObserver jitter. A separate MutationObserver watches the root element's inline style to win the race against ChatGPT's own JS overriding `--sidebar-width`.

## Known issues

- Relies on ChatGPT's current DOM structure (`#thread`, `#main`, `nav`). If OpenAI does a major layout overhaul the selectors may need updating.
- All tabs in the same Chrome profile share the same settings. If you have two ChatGPT tabs open, changing the offset in one affects both on reload.

## Version

**v3.2** — stable

- Keyboard shortcuts fixed (`e.code` instead of `e.key`, which was broken under Shift)
- Scroll and "jump to bottom" button fixed (`overflow-x` only, not full `overflow: hidden`)
- Sidebar width slider now responds immediately instead of 200ms lag
- Message handler cleaned up