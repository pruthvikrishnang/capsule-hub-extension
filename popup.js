// Popup logic for Capsule Hub
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const statusPill = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  
  const unsupportedView = document.getElementById("unsupported-view");
  const capturedView = document.getElementById("captured-view");
  
  const sourceBadge = document.getElementById("source-badge");
  const messageCountBadge = document.getElementById("message-count-badge");
  const messagesList = document.getElementById("messages-list");
  
  const selectAllBtn = document.getElementById("select-all-btn");
  const selectLastBtn = document.getElementById("select-last-btn");
  const addSummaryPromptCheckbox = document.getElementById("add-summary-prompt");
  const copyClipboardBtn = document.getElementById("copy-clipboard-btn");
  const clearSessionBtn = document.getElementById("clear-session-btn");
  const footerMessage = document.getElementById("footer-message");
  
  const manualText = document.getElementById("manual-text");
  const manualBridgeBtn = document.getElementById("manual-bridge-btn");

  let extractedSession = null; // Stores currently loaded session { provider, providerName, messages }

  // Initial connection check
  checkActiveTab();

  // Button Event Listeners
  selectAllBtn.addEventListener("click", () => toggleAllCheckboxes(true));
  selectLastBtn.addEventListener("click", selectOnlyLastTurn);
  copyClipboardBtn.addEventListener("click", copyContextToClipboard);
  clearSessionBtn.addEventListener("click", clearCurrentSession);
  
  manualBridgeBtn.addEventListener("click", handleManualBridge);

  // Set up Target Destination click handlers
  document.querySelectorAll(".target-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.currentTarget;
      const targetAI = targetBtn.dataset.target;
      const targetUrl = targetBtn.dataset.url;
      bridgeToTarget(targetAI, targetUrl);
    });
  });

  // Query the current active tab to detect context
  function checkActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        showStatus("No active tab detected", "idle");
        showUnsupportedView();
        return;
      }

      const activeTab = tabs[0];
      
      // Try to communicate with content script on active tab
      chrome.tabs.sendMessage(activeTab.id, { action: "extractContext" }, (response) => {
        // Handle runtime errors (e.g. content script not loaded on page)
        if (chrome.runtime.lastError || !response) {
          console.log("Content script not active on current tab. Checking storage...");
          // Content script not loaded, check if we have previously saved context in storage
          loadSavedSessionOrShowWelcome();
          return;
        }

        if (response.success) {
          console.log("Context successfully extracted:", response);
          extractedSession = response;
          // Save this session to storage for persistence
          chrome.storage.local.set({ savedSession: response });
          displaySession(response);
          showStatus("Context extracted!", "active");
        } else {
          console.log("Failed to extract context from active tab:", response.error);
          loadSavedSessionOrShowWelcome();
        }
      });
    });
  }

  // Load a previously saved session or show unsupported launchpad
  function loadSavedSessionOrShowWelcome() {
    chrome.storage.local.get("savedSession", (data) => {
      if (data && data.savedSession) {
        console.log("Loaded saved session from storage");
        extractedSession = data.savedSession;
        displaySession(extractedSession);
        showStatus("Saved context loaded", "active");
      } else {
        showUnsupportedView();
        showStatus("Launchpad", "idle");
      }
    });
  }

  // Show status inside header pill
  function showStatus(text, type) {
    statusText.innerText = text;
    statusPill.className = `status-pill status-${type}`;
  }

  // Render unsupported view
  function showUnsupportedView() {
    unsupportedView.classList.remove("hidden");
    capturedView.classList.add("hidden");
  }

  // Render captured session view
  function displaySession(session) {
    unsupportedView.classList.add("hidden");
    capturedView.classList.remove("hidden");

    // Configure source badge classes
    sourceBadge.innerText = session.providerName;
    sourceBadge.className = `source-badge source-${session.provider}`;
    
    // Configure counts
    const turnCount = session.messages.length;
    messageCountBadge.innerText = `${turnCount} turn${turnCount === 1 ? '' : 's'}`;

    // Populate message list
    messagesList.innerHTML = "";
    session.messages.forEach((msg, idx) => {
      const item = document.createElement("div");
      item.className = "message-item";
      
      const roleText = msg.role === "user" ? "User" : "AI";
      const snippet = msg.text.substring(0, 150) + (msg.text.length > 150 ? "..." : "");

      item.innerHTML = `
        <div class="message-checkbox-wrapper">
          <input type="checkbox" class="message-checkbox" data-idx="${idx}" checked>
        </div>
        <div class="message-body" data-idx="${idx}">
          <div class="message-meta">
            <span class="role-badge role-${msg.role}">${roleText}</span>
          </div>
          <p class="message-snippet">${escapeHtml(snippet)}</p>
        </div>
      `;

      // Allow clicking the body to toggle selection
      item.querySelector(".message-body").addEventListener("click", () => {
        const checkbox = item.querySelector(".message-checkbox");
        checkbox.checked = !checkbox.checked;
      });

      messagesList.appendChild(item);
    });
  }

  // Helper to escape HTML characters
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Select/deselect all checkboxes
  function toggleAllCheckboxes(checked) {
    document.querySelectorAll(".message-checkbox").forEach(box => {
      box.checked = checked;
    });
  }

  // Select only the last conversation turn (User prompt + AI Response, or just latest user prompt)
  function selectOnlyLastTurn() {
    toggleAllCheckboxes(false);
    const checkboxes = Array.from(document.querySelectorAll(".message-checkbox"));
    if (checkboxes.length > 0) {
      // Find the last user turn and select from there to the end
      let lastUserIdx = checkboxes.length - 1;
      for (let i = checkboxes.length - 1; i >= 0; i--) {
        const idx = checkboxes[i].dataset.idx;
        const msg = extractedSession.messages[idx];
        if (msg.role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      
      // Check from last user message onwards
      for (let i = lastUserIdx; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
      }
    }
  }


});

