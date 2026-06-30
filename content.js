// Content script for Capsule Hub - running on AI chat sites
console.log("Capsule Hub content script loaded on", window.location.hostname);

// Provider configuration mapping
const PROVIDERS = {
  chatgpt: {
    name: "ChatGPT",
    domains: ["chatgpt.com"],
    selectors: {
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      input: '#prompt-textarea'
    }
  },
  claude: {
    name: "Claude",
    domains: ["claude.ai"],
    selectors: {
      userMessage: '[data-testid="user-message"], div.font-user-message, div[class*="user-message"]',
      assistantMessage: '.font-claude-message, div[class*="assistant-message"], div.font-claude-message',
      input: 'div[contenteditable="true"], textarea[placeholder*="Claude"], textarea[placeholder*="message"]'
    }
  },
  gemini: {
    name: "Gemini",
    domains: ["gemini.google.com"],
    selectors: {
      userMessage: 'user-query, .query-text, .query-content',
      assistantMessage: 'model-turn, .response-container-layout, .model-turn',
      input: 'div[contenteditable="true"], textarea[placeholder*="Ask Gemini"]'
    }
  },
  deepseek: {
    name: "DeepSeek",
    domains: ["deepseek.com", "chat.deepseek.com"],
    selectors: {
      userMessage: '.ds-chat-turn--user, .user-message, [class*="user-message"]',
      assistantMessage: '.ds-markdown, .assistant-message, [class*="assistant-message"]',
      input: '#chat-input, textarea'
    }
  }
};

// Detect current provider based on hostname
function detectCurrentProvider() {
  const host = window.location.hostname;
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    if (provider.domains.some(domain => host.includes(domain))) {
      return key;
    }
  }
  return null;
}

// Extract conversation from page DOM
function extractConversation() {
  const providerKey = detectCurrentProvider();
  if (!providerKey) {
    return { success: false, error: "Unsupported AI website" };
  }

  const provider = PROVIDERS[providerKey];
  const userSelector = provider.selectors.userMessage;
  const assistantSelector = provider.selectors.assistantMessage;

  // Query both sets of selectors to read them in document order (chronological order)
  const querySelectorAllString = `${userSelector}, ${assistantSelector}`;
  const elements = Array.from(document.querySelectorAll(querySelectorAllString));
  
  if (elements.length === 0) {
    // Try a general approach: search for divs with user/assistant keywords or bubbles
    return { 
      success: false, 
      error: "No messages found. Try sending a message first or refresh the page." 
    };
  }

  const messages = [];
  
  elements.forEach((element) => {
    // Determine the role by checking which selector matched
    let role = 'unknown';
    if (element.matches(userSelector)) {
      role = 'user';
    } else if (element.matches(assistantSelector)) {
      role = 'assistant';
    } else {
      // Fallback check
      const text = element.className.toLowerCase();
      if (text.includes('user')) role = 'user';
      else if (text.includes('assistant') || text.includes('agent') || text.includes('claude') || text.includes('model')) {
        role = 'assistant';
      }
    }

    // Extract text content, stripping unwanted edit buttons or action buttons
    // Typically, we want the core text block.
    // For Claude / ChatGPT, sometimes they have extra elements. We clean up common ones.
    let text = "";
    
    // Copy element and remove buttons/actions to get clean text representation
    const clone = element.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('button, svg, .sr-only, [aria-hidden="true"], .custom-actions, div[class*="Action"], div[class*="button"]');
    elementsToRemove.forEach(el => el.remove());
    
    text = clone.innerText || clone.textContent || "";
    text = text.trim();

    if (text && role !== 'unknown') {
      messages.push({ role, text });
    }
  });

  // Filter consecutive duplicates if DOM structure returned double matches
  const filteredMessages = [];
  for (let i = 0; i < messages.length; i++) {
    if (i === 0 || messages[i].text !== messages[i-1].text || messages[i].role !== messages[i-1].role) {
      filteredMessages.push(messages[i]);
    }
  }

  return {
    success: true,
    provider: providerKey,
    providerName: provider.name,
    messages: filteredMessages
  };
}

// Inject text into the target input element
function injectText(element, text) {
  element.focus();
  
  // Method 1: Using execCommand (supports rich text and most frameworks cleanly)
  try {
    // Select any existing text in focus
    document.execCommand('selectall', false, null);
    document.execCommand('insertText', false, text);
    console.log("Injected context via execCommand");
    return true;
  } catch (e) {
    console.warn("execCommand failed, attempting direct DOM event simulation...", e);
  }

  // Method 2: Direct value assignment and React/Vue event dispatch
  try {
    const isValueProperty = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
    
    if (isValueProperty) {
      // Bypass React's overridden value setter if applicable
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 
        "value"
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 
        "value"
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, text);
      } else {
        element.value = text;
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Contenteditable divs
      element.innerText = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    console.log("Injected context via event simulation");
    return true;
  } catch (e) {
    console.error("Failed to inject text:", e);
    return false;
  }
}

// Periodically look for input box and inject context
function startInjectionPolling(text) {
  const providerKey = detectCurrentProvider();
  if (!providerKey) return;

  const provider = PROVIDERS[providerKey];
  let attempts = 0;
  const maxAttempts = 30; // 15 seconds max

  console.log(`Starting injection polling for ${provider.name}...`);

  const pollInterval = setInterval(() => {
    attempts++;
    
    // Find the input field
    const inputElement = document.querySelector(provider.selectors.input);
    
    if (inputElement) {
      clearInterval(pollInterval);
      console.log("Found input element. Injecting context...");
      
      setTimeout(() => {
        const success = injectText(inputElement, text);
        if (success) {
          showToast(`Context bridge active! Capsule Hub injected your session. 🚀`);
          // Clear context from storage so it doesn't inject again on refresh
          chrome.storage.local.remove('pendingContext');
        } else {
          showToast(`Context bridge ready. Please paste (Ctrl+V) manually! 📋`, "warning");
        }
      }, 500); // Small buffer to ensure editor listeners are registered
    }

    if (attempts >= maxAttempts) {
      clearInterval(pollInterval);
      console.warn("Input element not found after 15 seconds. Creating fallback paste option.");
      showToast("Capsule Hub: Input area not found. Context copied to clipboard instead!", "warning");
      
      // Copy to clipboard as a last resort fallback
      navigator.clipboard.writeText(text).catch(err => console.error("Clipboard copy failed: ", err));
    }
  }, 500);
}

// Inject styling and display toast message in the UI
function showToast(message, type = "success") {
  // Remove existing toast if any
  const existing = document.getElementById('capsule-hub-toast');
  if (existing) existing.remove();

  // Create toast container
  const toast = document.createElement('div');
  toast.id = 'capsule-hub-toast';
  
  // Custom styling
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Colors based on type
  const themeColors = {
    success: {
      bg: "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
      border: "#22d3ee",
      shadow: "rgba(6, 182, 212, 0.4)"
    },
    warning: {
      bg: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      border: "#fbbf24",
      shadow: "rgba(245, 158, 11, 0.4)"
    }
  };
  
  const currentTheme = themeColors[type] || themeColors.success;

  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    background: currentTheme.bg,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '12px',
    border: `1px solid ${currentTheme.border}`,
    boxShadow: `0 10px 25px -5px ${currentTheme.shadow}, 0 8px 10px -6px ${currentTheme.shadow}`,
    zIndex: '999999',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    opacity: '0',
    transform: 'translateY(-20px) scale(0.95)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'none'
  });

  toast.innerHTML = `
    <span style="font-size: 16px;">🔄</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Trigger animations
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
  });

  // Hide and remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Check for incoming messages (e.g. from popup request)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractContext") {
    const result = extractConversation();
    sendResponse(result);
  }
  return true;
});

// Check if we have pending context injection at load time
chrome.storage.local.get('pendingContext', (data) => {
  if (data && data.pendingContext) {
    const context = data.pendingContext;
    const currentProvider = detectCurrentProvider();
    
    // Check if the domain matches the target and has not expired (e.g., within last 2 minutes)
    const timeDiff = Date.now() - context.timestamp;
    if (context.targetAI === currentProvider && timeDiff < 120000) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startInjectionPolling(context.text);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          startInjectionPolling(context.text);
        });
      }
    }
  }
});
