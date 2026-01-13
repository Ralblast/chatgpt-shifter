# ChatGPT Layout Shifter Pro

A lightweight Chrome extension that gives you precise control over ChatGPT's horizontal layout position. Shift the conversation area left or right for better ergonomics, multi-window workflows, and vertical monitor setups.

---

## Features

- **Precision Control** – Smooth slider with real-time adjustment from -600px to +600px
- **Smart Presets** – Left/Center/Right buttons that remember your custom positions
- **Persistent State** – Your preferred layout is automatically restored on every visit
- **Lightweight Design** – No analytics, no bloat, just clean CSS transforms
- **Context-Aware** – Only activates on ChatGPT domains, disabled elsewhere
- **Zero Performance Impact** – GPU-accelerated transforms with no DOM reflows

---

## Why Use This?

Perfect for developers, researchers, and multitaskers who need ChatGPT side-by-side with other apps. Move the conversation left or right to match your workflow without awkward window resizing.

Whether you're coding with ChatGPT on one side, using a vertical monitor, or just prefer asymmetric layouts, this extension gives you pixel-perfect control.

---

## Installation

### From Source

1. **Download or clone** this repository containing the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the extension folder
5. Open [chatgpt.com](https://chatgpt.com) or [chat.openai.com](https://chat.openai.com)
6. Click the extension icon in your toolbar to open the popup

### Files Required

```
chatgpt-layout-shifter/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
└── styles.css
```

---

##  Quick Start

1. Open ChatGPT in your browser
2. Click the extension icon in the toolbar
3. Use the **Shift Distance** slider or preset buttons to adjust the layout
4. Your position is saved automatically

---

## 📖 Usage Guide

### Controls

**Segmented Buttons**
- **Left** – Jump to your saved left preset (default: -250px)
- **Center** – Reset to centered layout (0px)
- **Right** – Jump to your saved right preset (default: +250px)

**Slider**  
Drag the *Shift Distance* slider smoothly from -600px (far left) to +600px (far right) for precise positioning.

**Number Input**  
Type an exact pixel value (e.g., `-320` or `+180`) for precision control without dragging.

**Reset Defaults**  
Click *Reset Defaults* to restore the original presets (-250 / 0 / +250) and center the layout.

### Smart Preset Learning

The extension automatically remembers your custom positions:

- **Customize left position**: Slide the slider to any negative value (e.g., -230px) → The Left button now remembers -230px
- **Customize right position**: Slide the slider to any positive value (e.g., +310px) → The Right button now remembers +310px
- **Restore defaults**: Click Reset Defaults → All presets return to factory settings (-250 / 0 / +250)

Your custom presets are saved in Chrome's synced storage and restored across sessions.

---

##  Technical Details

### Architecture

**Manifest V3 Extension**
- Minimal permissions: `storage`, `activeTab`, `scripting`, `tabs`
- Content script runs only on ChatGPT domains
- Popup UI with real-time updates via Chrome message passing

**Content Script (`content.js`)**
- Reads saved offset from `chrome.storage.sync` on page load
- Listens for layout update messages from the popup
- Updates the CSS variable `--shifter-offset` and applies `body.shifter-active` class

**Stylesheet (`styles.css`)**
- Uses CSS variable `--shifter-offset` for dynamic horizontal shifting
- Applies `transform: translateX(var(--shifter-offset))` to ChatGPT's main containers
- GPU-accelerated with smooth 0.2s cubic-bezier transition
- Includes `overflow-x: hidden` to prevent visual artifacts

**Popup UI (`popup.html`, `popup.css`, `popup.js`)**
- Verifies active tab is a ChatGPT domain before enabling controls
- Syncs offset and presets via Chrome's synced storage
- Debounces storage writes (500ms for offset, 1000ms for presets) to respect rate limits
- Implements exponential backoff retry for content script communication

### State Management

**Saved Data**
- `savedOffset` – Current layout offset (persisted automatically)
- `savedPresets` – Custom left/center/right preset values (persisted when adjusted)

**Storage Strategy**
- Writes are debounced to avoid hitting Chrome's `MAX_WRITE_OPERATIONS_PER_MINUTE` quota
- Content script initializes with stored values on page load to prevent visual lag (FOUC)
- Message passing ensures popup and content script stay in sync

### Performance

- **Size**: <100KB total extension size
- **Memory**: Minimal footprint with zero CPU usage when idle
- **Rendering**: Single CSS variable update, GPU-accelerated transforms, no DOM reflows
- **Latency**: Real-time slider updates with 200ms smooth transitions

---

## 🔒 Privacy & Security

- **No analytics or tracking** – This extension does not collect any data about your usage
- **No external requests** – All processing happens locally in your browser
- **Minimal permissions** – Only requests access to ChatGPT domains and Chrome storage
- **Open source** – Code is transparent and can be audited

---

##  Known Limitations

- The extension is designed for ChatGPT's current DOM structure; if OpenAI significantly restructures the layout, selectors may need updating
- Only affects horizontal positioning; does not change fonts, colors, or other UI elements by design
- Works best on screens wider than 1200px (tested on modern desktop setups)

---

##  Use Cases

**Side-by-Side Coding**  
Move ChatGPT to one side while keeping your IDE visible on the other.

**Vertical Monitors**  
Shift the layout to match your vertical screen orientation perfectly.

**Multi-App Workflows**  
Position ChatGPT asymmetrically to leave room for reference materials, notes, or dashboards.

**Comfortable Viewing**  
Reduce neck strain by positioning the conversation area directly in your line of sight.

---

## 🛠️ Development

### Project Structure

```
├── manifest.json          – Extension configuration and permissions
├── popup.html             – Control UI layout
├── popup.css              – Popup styling
├── popup.js               – Popup logic and state management
├── content.js             – Page integration and layout application
└── styles.css             – ChatGPT layout transformation styles
```

### Technologies

- **Pure JavaScript** – No frameworks or build tools
- **CSS Variables** – Dynamic styling without runtime calculations
- **Chrome Storage API** – Cross-device state synchronization
- **Chrome Messaging API** – Popup ↔ Content script communication

### Extending the Project

To add features (e.g., keyboard shortcuts, animation toggles, multiple profiles):

1. Keep the scope focused on layout control
2. Respect the existing debouncing patterns for storage writes
3. Use Chrome message passing for popup ↔ content script updates
4. Test thoroughly on ChatGPT domains before shipping

---

## 📄 License

MIT License – Feel free to use, modify, and distribute this extension.

---

## 🤝 Contributing

Found a bug or have a feature suggestion? Open an issue or submit a pull request.

**Before contributing:**
- Test changes on both chatgpt.com and chat.openai.com
- Keep the extension lightweight (<100KB)
- Follow existing code style and patterns
- Document any changes to behavior

---

##  Support

If the extension isn't working:

1. **Check that you're on ChatGPT** – Open `chatgpt.com` or `chat.openai.com` in a new tab
2. **Reload the page** – Press Ctrl+R (or Cmd+R on Mac)
3. **Reload the extension** – Go to `chrome://extensions/` and click the refresh icon
4. **Check Chrome Developer Tools** – Press F12 and look for any error messages in the Console tab

---

##  Version History

**v1.0** (Current)
- Fixed storage rate limit errors with debounced writes
- Added retry logic for content script communication
- Implemented smart preset learning
- Added input validation and bounds checking

---

##  Built By

A passionate developer focused on improving ChatGPT ergonomics and user workflows.

---

**Happy shifting! **  

Enjoy ChatGPT at the exact position that works best for you.