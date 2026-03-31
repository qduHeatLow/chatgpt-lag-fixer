# ChatGPT Lag Fixer (Virtual Scroller)

**原作者：bramvdg**
**自用修改，仅用于个人使用**
[![License: PolyForm Strict 1.0.0](https://img.shields.io/badge/License-PolyForm%20Strict%201.0.0-blue)](https://polyformproject.org/licenses/strict/1.0.0)

**The ultimate performance booster for long ChatGPT conversations**

ChatGPT Lag Fixer is a **Chrome and Firefox** extension that uses intelligent virtual scrolling to keep your ChatGPT tabs lightning-fast, even during long conversations. Unlike simple DOM trimming solutions, this extension dynamically virtualizes messages outside your viewport while seamlessly restoring them as you scroll.

### ℹ️ Evolution of the Project (v1.0 vs v2.0)

I started this project as an open-source tool, and I’m proud of how much it has helped people. However, as the user base grew, maintaining it in my evenings alongside a full-time job became a massive commitment. 

To keep the project alive and sustainable **without** burning out, I made a few changes:

* **This Repository (v1.0):** Source is publicly available under the **PolyForm Strict License**. I’m keeping this public so the community can still use the original logic as a learning resource for their own tools regarding DOM virtualization and Chrome extensions.
* **Web Store Version (v2.0+):** This version is **not open-sourced** at this point. It features a complete architectural rewrite that works with the current version of ChatGPT and includes a "Pro" tier for a small one-time fee for new heavy users (still free for casual users) to help cover a bit of the ongoing development time spent. I want to stress that this version still runs **100% locally on your device and does NOT collect any data.**

I want to be transparent about this shift—my goal is to ensure the extension stays fast, secure, and actively maintained for the long run.

---
## 📥 Download

| Browser | Store Link |
| :--- | :--- |
| **Google Chrome** | [Download from Chrome Web Store (v2)](https://chromewebstore.google.com/detail/finipiejpmpccemiedioehhpgcafnndo?utm_source=item-share-cb) |
| **Mozilla Firefox** | [Download from Firefox Add-ons (v2)](https://addons.mozilla.org/en-GB/firefox/addon/chatgpt-speed-booster/) |

---

## Features

### Smart Virtual Scrolling
- **Viewport-aware rendering**: Only renders messages visible in your viewport
- **Seamless restoration**: Scroll up to see older messages instantly restored
- **Zero context loss**: Full conversation history always accessible

### Performance Optimizations
- **Memory efficiency**: Reduces DOM nodes by 70-90% in long conversations
- **Smooth scrolling**: Maintains scroll position perfectly when virtualizing/restoring
- **Lightweight caching**: Smart message caching for instant restoration

### User Experience
- **Completely transparent**: Works silently in the background
- **No interruptions**: Doesn't interfere with ChatGPT's functionality
- **Real-time stats**: See performance improvements live
- **All optimization runs locally in your browser**: Full privacy - no data is ever sent to an external server

### Advanced Features
- **MutationObserver integration**: Automatically detects new messages
- **Debug mode**: Developer-friendly logging for troubleshooting


## Installation

### **Option 1 — Install from Web Stores (Recommended)**
Use the links in the [Download](#-download) section above to install the extension automatically for your specific browser.

### **Option 2 — Install Manually (Unpacked)**

If you want to run the extension locally or modify the code, follow the instructions for your browser below.

#### 📦 For Google Chrome (and Edge/Brave)
1. Download or clone this repository after forking it:
   ```bash
   git clone https://github.com/<YOUR_GH_ACCOUNT_NAME>/chatgpt-lag-fixer.git
   ```
2. Open Chrome and navigate to:
    ```bash
   chrome://extensions
   ```
3. Enable Developer mode (toggle in the top-right corner)
4. Click Load unpacked
5. Select the project folder (the one containing manifest.json)
6. Open ChatGPT — the extension will load automatically
7. Use the extension icon in Chrome to open the settings popup

#### 🦊 For Mozilla Firefox
1. Download or clone this repository after forking it:
   ```bash
   git clone https://github.com/<YOUR_GH_ACCOUNT_NAME>/chatgpt-lag-fixer.git
   ```
2. Open Firefox and navigate to:
    ```bash
   about:debugging#/runtime/this-firefox
   ```
3. Click Load Temporary Add-on...
4. Navigate to your project folder and select the manifest.json file

You're now running ChatGPT Lag Fixer locally, and you can make changes in the code!


## Technical Architecture

### How It Works
ChatGPT normally renders **every message in the DOM at once**, even if they are not visible.  
This extension fixes that by:

1. **Detection**: Scans ChatGPT's DOM structure to identify the message container
2. **Caching**: Stores message content, height, and metadata in memory
3. **Virtualization**: Replaces off-screen messages with height-matched placeholders
4. **Restoration**: Recreates messages from cache when scrolled into view
5. **Monitoring**: Watches for new messages via MutationObserver

This technique — **virtual scrolling** — is commonly used in high-performance apps like:

- Notion  
- Discord  
- Slack  
- VS Code  
- React Virtualized  

It makes massive message lists behave like small ones.

### Key Components

```
├── manifest.json            # Extension manifest (Manifest V3)
├── src/boot.js              # Initialization logic (entry point)
├── src/virtualization.js    # Core virtual scrolling logic
├── src/constants.js         # Config values
├── src/background.js        # Service worker for settings & lifecycle
├── src/popup.html/css/js    # Extension UI and settings
└── icons/                   # Extension icons
```


## Development Notes

### Running the extension during development:
- Load the extension locally in your browser
- Open the browser console on ChatGPT and look for debug logs (if enabled)
- Use the popup toggle to enable/disable virtualization
- When making changes, hit **Reload** on the extension page (for Chrome)

### Debug mode
The popup includes an optional "Debug mode" that logs internal states such as:
- Scroll container detection
- Virtualization passes
- Nodes rendered / unrendered
- URL changes
- Mutation observer triggers


## 🔐 Privacy

This extension:
- Collects **no data**
- Sends **nothing** to any server
- Reads/writes only its own local storage (settings)
- Runs **only** on ChatGPT domains (`chat.openai.com` / `chatgpt.com`)

All processing happens **fully locally** in your browser.

## Usage

### Basic Usage
1. Install the extension
2. Open ChatGPT
3. Start a conversation
4. The extension works automatically! 🎉

### Accessing Settings
- Click the extension icon in your Chrome/Firefox toolbar
- See stats like nodes rendered, memory saved and more
- Enable debug mode to see what's happening behind the scenes

### Settings Explained

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Virtual Scrolling** | Toggle virtualization on/off | ON |
| **Debug Mode** | Show console logs for debugging | OFF |

### Performance Stats

The popup displays real-time statistics:
- **Total Messages**: Number of messages in conversation
- **Rendered**: Currently rendered messages
- **Memory Saved**: Percentage of messages virtualized
- **Status**: Extension active/disabled state

## Performance Comparison

| Scenario | Without Extension | With Extension | Improvement |
|----------|------------------|----------------|-------------|
| 100 messages | ~800 DOM nodes | ~250 DOM nodes | **69% reduction** |
| 500 messages | ~4000 DOM nodes | ~300 DOM nodes | **92% reduction** |
| Scroll lag | Noticeable | Smooth | **Significantly better** |
| Memory usage | High | Low | **~60% less** |


## Compatibility
- Browser: Chrome, Firefox (Manifest V3 with background scripts)
- OS: Windows, macOS, Linux
- ChatGPT: Optimized for current UI (as of 2025), resilient to minor changes


## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/your-feature`)
3. **Commit your changes** (`git commit -m 'Add your feature'`)
4. **Push to the branch** (`git push origin feature/your-feature`)
5. **Open a Pull Request**

### Areas for Improvement
- [ ] Support for other AI chat interfaces (Claude, Gemini, etc.)


## Manifest V3 Compliance

This extension is built with **Manifest V3**, ensuring:
- Service worker instead of background pages
- Minimal permissions
- No remotely hosted code
- Content Security Policy compliant
- Future-proof for Chrome/Firefox updates

## Troubleshooting

### Extension not working?
1. Check that you're on `chat.openai.com` or `chatgpt.com`
2. Refresh the page after installing/updating
3. Enable debug mode and check console for errors
4. Try disabling and re-enabling the extension

### Messages not virtualizing?
1. Ensure "Enable Virtual Scrolling" is ON in settings
2. Check that you have enough messages (>10) in conversation
3. Check browser console for errors

### Scroll position jumping?
1. Disable extension temporarily to see if ChatGPT is the issue
2. Report the issue with reproduction steps
