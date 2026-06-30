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


// Message listener for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContext') {
    const result = extractConversation();
    sendResponse(result);
  }
  return true;
});

