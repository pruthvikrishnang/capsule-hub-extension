// Background service worker for Capsule Hub
console.log("Capsule Hub background service worker initialized.");

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openTabAndInject") {
    const { url, targetAI } = message;
    
    // Create new tab with the target AI tool
    chrome.tabs.create({ url: url }, (tab) => {
      console.log(`Created new tab for ${targetAI} (Tab ID: ${tab.id})`);
      sendResponse({ success: true, tabId: tab.id });
    });
    return true; // Keeps the message channel open for async response
  }
  
  if (message.action === "updateBadge") {
    const { text, color } = message;
    chrome.action.setBadgeText({ text: text || "" });
    if (color) {
      chrome.action.setBadgeBackgroundColor({ color: color });
    }
    sendResponse({ success: true });
  }
});
