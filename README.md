# Capsule Hub - AI Context Bridge 🔄🚀

A premium Chrome & Brave browser extension designed to capture context from one AI chat tool and continue in another instantly. If you aren't satisfied with one AI model's response, or want to cross-examine another model, Capsule Hub transfers your session context with one click.

---

## 😫 The Problem Faced Without Capsule Hub

If you use multiple AI models (ChatGPT, Claude, Gemini, DeepSeek) for coding, research, or writing, you've likely faced these common frustrations:

*   **The Copy-Paste Tax**: Copying a long chat history line-by-line is tedious. If you do a simple `Ctrl+A` or drag-select, you copy garbage elements like "Copy Code" buttons, thumbs-up/down icons, timestamps, and layout wrappers.
*   **Cognitive Reset**: When a model gets stuck, hallucinates, or hits a rate limit, switching to another model forces you to manually summarize where you were and re-explain the task to the new AI. You lose the momentum of the chat.
*   **Failing Framework Inputs**: Directly pasting huge text walls into AI inputs (which are heavily managed by frameworks like React or Svelte) often triggers input errors, misses event listeners, or fails to enable the "Submit" button until you manually type a character.
*   **Siloed Workflows**: Cross-referencing answers across models takes 5 to 10 manual steps per prompt. This friction stops developers and writers from using the best model for each specific sub-task.

### 💡 The Solution: Capsule Hub
With Capsule Hub, you click **one button** on your active chat, click the logo of the target AI, and continue your conversation instantly. It automatically extracts, cleanses, formats, and programmatically injects the exact conversation history, preserving context and format seamlessly.

---

## 🌟 Key Features

1. **Auto-Context Extraction**: Detects and extracts messages dynamically when you're on a supported AI provider site.
2. **Turn-based Selection UI**: Interactively select which parts of the conversation you want to transfer.
3. **Seamless Context Injection**: Automatically opens the destination AI tool, waits for the DOM input textarea to load, and injects the formatted conversation history directly.
4. **Manual Context Launchpad**: Enter custom prompts or paste context from any unsupported webpage to launch a fresh AI session.
5. **Universal Fallback Copy**: Copy raw formatted markdown transcripts to your clipboard with a hotkey/button.
6. **Premium Glow UI**: Designed with glassmorphism, glowing neons, and micro-animations, optimized for dark mode.

---

## 📂 Project Structure

- [manifest.json](file:///C:/Users/Admin/Projects/capsule-hub-extension/manifest.json): Extension configuration (Manifest V3), permissions, and site injection scopes.
- [icon.svg](file:///C:/Users/Admin/Projects/capsule-hub-extension/icon.svg): A modern, glowing vector asset representing Capsule Hub.
- [content.js](file:///C:/Users/Admin/Projects/capsule-hub-extension/content.js): Content script containing DOM scrapers (`extractConversation`) and React/Vue-compliant text injection script (`injectText`).
- [background.js](file:///C:/Users/Admin/Projects/capsule-hub-extension/background.js): Service worker handling cross-tab orchestration and extension icon badges.
- [popup.html](file:///C:/Users/Admin/Projects/capsule-hub-extension/popup.html): Main extension popup layout displaying conversation history and destination launch buttons.
- [popup.css](file:///C:/Users/Admin/Projects/capsule-hub-extension/popup.css): Glassmorphic dark styling sheet with custom Google Fonts, glowing hover effects, and animations.
- [popup.js](file:///C:/Users/Admin/Projects/capsule-hub-extension/popup.js): Controller handling state synchronization, selection parsing, manual entries, and background message passing.

---

## 🔧 Installation Instructions for Chrome / Brave

Since **Brave** runs on Chromium, it supports all standard Chrome Web Store and local developer-mode extensions:

1. **Download / Verify Files**:
   Ensure all files are generated in `C:/Users/Admin/Projects/capsule-hub-extension/`.
2. **Open Extensions Page**:
   - In **Brave**, navigate to `brave://extensions` (or `chrome://extensions` in Chrome).
3. **Enable Developer Mode**:
   - Toggle the **Developer Mode** switch in the top-right corner to **On**.
4. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the directory containing the extension files: `C:\Users\Admin\Projects\capsule-hub-extension`.
5. **Pin Capsule Hub**:
   - Click the puzzle piece icon (Extensions menu) in the browser toolbar and pin **Capsule Hub - AI Context Bridge** for easy access!

---

## 🖥️ Supported AI Providers

Capsule Hub includes pre-configured selectors and injection paths for:
- 🤖 **ChatGPT** (`https://chatgpt.com`)
- 🎨 **Claude** (`https://claude.ai`)
- ✨ **Gemini** (`https://gemini.google.com`)
- 🐳 **DeepSeek** (`https://chat.deepseek.com`)

---

## 🎯 How to Use It

1. Start chatting with any AI tool (e.g., Claude).
2. Click the **Capsule Hub** extension icon.
3. The popup automatically displays the conversation log.
4. Deselect any turns you don't need, toggle **Include bridge header instruction** if desired.
5. Click one of the destination buttons (e.g., **ChatGPT**).
6. A new tab opens automatically, populates the input bar with your context, focuses the field, and flashes a success toast. Simply review the text and hit **Enter**!

