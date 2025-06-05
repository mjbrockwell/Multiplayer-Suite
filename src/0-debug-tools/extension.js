// ===================================================================
// Extension 0: Debug Tools - Swappable Development Platform
// Professional debugging interface focused on current development priorities
// ===================================================================

// ===================================================================
// 🛠️ DEBUG MODULE ARCHITECTURE - Plugin System
// ===================================================================

const DEBUG_MODULES = {
  "settings-manager": {
    id: "settings-manager",
    name: "⚙️ Settings Manager Debug",
    description: "Debug tree-based configuration and user preferences",
    active: true, // Current development focus
    component: null, // Will be set below
  },
  "foundation-registry": {
    id: "foundation-registry",
    name: "🏛️ Foundation Registry Debug",
    description: "Debug extension coordination and cleanup",
    active: false,
    component: null,
  },
  "user-authentication": {
    id: "user-authentication",
    name: "👤 User Authentication Debug",
    description: "Debug user detection methods and caching",
    active: false,
    component: null,
  },
  "performance-monitor": {
    id: "performance-monitor",
    name: "📊 Performance Monitor",
    description: "Monitor extension performance and resource usage",
    active: false,
    component: null,
  },
};

// ===================================================================
// 🎯 SETTINGS MANAGER DEBUG MODULE - Current Development Focus
// ===================================================================

const createSettingsManagerDebugModule = () => {
  const container = document.createElement("div");
  container.className = "debug-module settings-manager-debug";

  container.innerHTML = `
    <div class="debug-section">
      <h4>🔍 Settings Detection & Analysis</h4>
      <div class="debug-controls">
        <button id="debug-detect-user" class="debug-btn">Detect Current User</button>
        <button id="debug-check-page" class="debug-btn">Check Preferences Page</button>
        <button id="debug-scan-tree" class="debug-btn">Scan Tree Structure</button>
        <button id="debug-force-create" class="debug-btn primary">Force Create Preferences</button>
      </div>
    </div>
    
    <div class="debug-section">
      <h4>📊 Real-time Status</h4>
      <div id="settings-debug-status" class="debug-status">
        <div class="status-item">
          <strong>User:</strong> <span id="current-user-status">Not checked</span>
        </div>
        <div class="status-item">
          <strong>Page Exists:</strong> <span id="page-exists-status">Not checked</span>
        </div>
        <div class="status-item">
          <strong>Settings Count:</strong> <span id="settings-count-status">Not checked</span>
        </div>
        <div class="status-item">
          <strong>Last Update:</strong> <span id="last-update-status">Never</span>
        </div>
      </div>
    </div>
    
    <div class="debug-section">
      <h4>🧪 Test Actions</h4>
      <div class="debug-controls">
        <button id="debug-test-get" class="debug-btn">Test Get Preference</button>
        <button id="debug-test-set" class="debug-btn">Test Set Preference</button>
        <button id="debug-test-parse" class="debug-btn">Test Shortcuts Parser</button>
        <button id="debug-clear-cache" class="debug-btn warning">Clear All Caches</button>
      </div>
    </div>
    
    <div class="debug-section">
      <h4>📝 Debug Log</h4>
      <div id="settings-debug-log" class="debug-log">
        <div class="log-item info">🎯 Settings Manager Debug Module Ready</div>
      </div>
      <div class="debug-controls">
        <button id="debug-clear-log" class="debug-btn small">Clear Log</button>
        <button id="debug-copy-log" class="debug-btn small">Copy Log</button>
      </div>
    </div>
  `;

  // Set up event handlers
  setupSettingsDebugHandlers(container);

  return container;
};

const setupSettingsDebugHandlers = (container) => {
  const log = (message, type = "info") => {
    const logContainer = container.querySelector("#settings-debug-log");
    const logItem = document.createElement("div");
    logItem.className = `log-item ${type}`;
    logItem.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString()}</span> ${message}`;
    logContainer.appendChild(logItem);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Update last update time
    const lastUpdate = container.querySelector("#last-update-status");
    if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString();
  };

  const updateStatus = (key, value, type = "success") => {
    const element = container.querySelector(`#${key}-status`);
    if (element) {
      element.textContent = value;
      element.className = `status-value ${type}`;
    }
  };

  // Get platform utilities
  const platform = window.RoamExtensionSuite;
  const getCurrentUser = platform?.getUtility("getCurrentUser");
  const getUserPreference = platform?.getUtility("getUserPreference");
  const setUserPreference = platform?.getUtility("setUserPreference");
  const getAllUserPreferences = platform?.getUtility("getAllUserPreferences");
  const parsePersonalShortcuts = platform?.getUtility("parsePersonalShortcuts");

  // User Detection
  container
    .querySelector("#debug-detect-user")
    ?.addEventListener("click", async () => {
      try {
        log("🔍 Detecting current user...", "info");
        const user = getCurrentUser();
        log(
          `✅ User detected: ${user.displayName} (method: ${user.method})`,
          "success"
        );
        updateStatus("current-user", user.displayName, "success");
      } catch (error) {
        log(`❌ User detection failed: ${error.message}`, "error");
        updateStatus("current-user", "Error", "error");
      }
    });

  // Page Check
  container
    .querySelector("#debug-check-page")
    ?.addEventListener("click", async () => {
      try {
        log("📄 Checking preferences page...", "info");
        const user = getCurrentUser();
        const pageTitle = `${user.displayName}/user preferences`;

        const pageUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where [?page :node/title "${pageTitle}"] [?page :block/uid ?uid]]
      `);

        if (pageUid) {
          log(`✅ Page exists with UID: ${pageUid}`, "success");
          updateStatus("page-exists", "Yes", "success");
        } else {
          log(`❌ Page does not exist: "${pageTitle}"`, "warning");
          updateStatus("page-exists", "No", "warning");
        }
      } catch (error) {
        log(`❌ Page check failed: ${error.message}`, "error");
        updateStatus("page-exists", "Error", "error");
      }
    });

  // Tree Structure Scan
  container
    .querySelector("#debug-scan-tree")
    ?.addEventListener("click", async () => {
      try {
        log("🌳 Scanning tree structure...", "info");
        const user = getCurrentUser();
        const prefs = await getAllUserPreferences(user.displayName);

        const count = Object.keys(prefs).length;
        log(`📊 Found ${count} preferences:`, "info");

        Object.entries(prefs).forEach(([key, value]) => {
          log(`  • ${key}: "${value}"`, "info");
        });

        updateStatus(
          "settings-count",
          count,
          count > 0 ? "success" : "warning"
        );
      } catch (error) {
        log(`❌ Tree scan failed: ${error.message}`, "error");
        updateStatus("settings-count", "Error", "error");
      }
    });

  // Force Create
  container
    .querySelector("#debug-force-create")
    ?.addEventListener("click", async () => {
      try {
        log("🔧 Force creating preferences...", "info");
        const user = getCurrentUser();

        // This will trigger the auto-creation logic
        const testPref = await getUserPreference(
          user.displayName,
          "Loading Page Preference",
          "Daily Page"
        );
        log(`✅ Auto-creation triggered, got: "${testPref}"`, "success");

        // Scan results
        const prefs = await getAllUserPreferences(user.displayName);
        const count = Object.keys(prefs).length;
        log(`📊 Created ${count} preferences total`, "success");
        updateStatus("settings-count", count, "success");
        updateStatus("page-exists", "Yes", "success");
      } catch (error) {
        log(`❌ Force create failed: ${error.message}`, "error");
      }
    });

  // Test Get
  container
    .querySelector("#debug-test-get")
    ?.addEventListener("click", async () => {
      try {
        log("🧪 Testing getUserPreference...", "info");
        const user = getCurrentUser();
        const pref = await getUserPreference(
          user.displayName,
          "Journal Header Color",
          "blue"
        );
        log(`✅ Got preference: Journal Header Color = "${pref}"`, "success");
      } catch (error) {
        log(`❌ Get preference failed: ${error.message}`, "error");
      }
    });

  // Test Set
  container
    .querySelector("#debug-test-set")
    ?.addEventListener("click", async () => {
      try {
        log("🧪 Testing setUserPreference...", "info");
        const user = getCurrentUser();
        const testValue = `Debug Test ${Date.now()}`;
        await setUserPreference(
          user.displayName,
          "Debug Test Setting",
          testValue
        );
        log(
          `✅ Set preference: Debug Test Setting = "${testValue}"`,
          "success"
        );
      } catch (error) {
        log(`❌ Set preference failed: ${error.message}`, "error");
      }
    });

  // Test Parser
  container
    .querySelector("#debug-test-parse")
    ?.addEventListener("click", async () => {
      try {
        log("🧪 Testing shortcuts parser...", "info");
        const user = getCurrentUser();
        const shortcutsString = await getUserPreference(
          user.displayName,
          "Personal Shortcuts",
          "(Daily Notes)(Chat Room)"
        );
        const parsed = parsePersonalShortcuts(shortcutsString);
        log(`Raw: "${shortcutsString}"`, "info");
        log(`Parsed: [${parsed.join(", ")}]`, "success");
      } catch (error) {
        log(`❌ Parser test failed: ${error.message}`, "error");
      }
    });

  // Clear Log
  container.querySelector("#debug-clear-log")?.addEventListener("click", () => {
    const logContainer = container.querySelector("#settings-debug-log");
    logContainer.innerHTML = '<div class="log-item info">🧹 Log cleared</div>';
  });

  // Copy Log
  container.querySelector("#debug-copy-log")?.addEventListener("click", () => {
    const logItems = container.querySelectorAll(".log-item");
    const logText = Array.from(logItems)
      .map((item) => item.textContent)
      .join("\n");
    navigator.clipboard.writeText(logText).then(() => {
      log("📋 Log copied to clipboard", "success");
    });
  });

  // Auto-refresh status every 10 seconds
  const autoRefresh = () => {
    if (container.parentElement) {
      container.querySelector("#debug-detect-user")?.click();
      setTimeout(autoRefresh, 10000);
    }
  };
  setTimeout(autoRefresh, 2000); // Start after 2 seconds
};

// ===================================================================
// 🎨 DEBUG WINDOW UI - Professional Interface
// ===================================================================

const createDebugWindow = () => {
  // Remove existing window
  const existing = document.getElementById("roam-extension-debug-window");
  if (existing) existing.remove();

  // Create main window
  const window = document.createElement("div");
  window.id = "roam-extension-debug-window";
  window.style.cssText = `
    position: fixed;
    top: 60px;
    left: 20px;
    width: 450px;
    max-height: 80vh;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    background: #0f172a;
    color: white;
    padding: 12px 16px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
  `;

  // Module selector
  const moduleSelector = document.createElement("select");
  moduleSelector.id = "debug-module-selector";
  moduleSelector.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
  `;

  Object.values(DEBUG_MODULES).forEach((module) => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = module.name;
    option.selected = module.active;
    moduleSelector.appendChild(option);
  });

  header.innerHTML = `
    <span>🛠️ Debug Tools</span>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button id="debug-window-minimize" style="
        background: none; border: none; color: white; 
        font-size: 16px; cursor: pointer; padding: 0;
      ">–</button>
      <button id="debug-window-close" style="
        background: none; border: none; color: white; 
        font-size: 16px; cursor: pointer; padding: 0;
      ">×</button>
    </div>
  `;

  header.insertBefore(moduleSelector, header.lastElementChild);

  // Content area
  const content = document.createElement("div");
  content.id = "debug-window-content";
  content.style.cssText = `
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    background: #fafbfc;
  `;

  // Add CSS for debug components
  const debugStyles = document.createElement("style");
  debugStyles.textContent = `
    .debug-section {
      margin-bottom: 20px;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      padding: 12px;
    }
    
    .debug-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    
    .debug-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .debug-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #374151;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .debug-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
    
    .debug-btn.primary {
      background: #137cbd;
      color: white;
      border-color: #137cbd;
    }
    
    .debug-btn.primary:hover {
      background: #106ba3;
    }
    
    .debug-btn.warning {
      background: #f59e0b;
      color: white;
      border-color: #f59e0b;
    }
    
    .debug-btn.small {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    .debug-status {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .status-item:last-child {
      margin-bottom: 0;
    }
    
    .status-value.success {
      color: #059669;
      font-weight: 500;
    }
    
    .status-value.warning {
      color: #d97706;
      font-weight: 500;
    }
    
    .status-value.error {
      color: #dc2626;
      font-weight: 500;
    }
    
    .debug-log {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 4px;
      padding: 8px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 11px;
      line-height: 1.4;
    }
    
    .log-item {
      margin-bottom: 4px;
      padding: 2px 0;
    }
    
    .log-item.success {
      color: #10b981;
    }
    
    .log-item.warning {
      color: #f59e0b;
    }
    
    .log-item.error {
      color: #ef4444;
    }
    
    .log-item .timestamp {
      color: #9ca3af;
      font-size: 10px;
    }
  `;

  // Assemble window
  window.appendChild(debugStyles);
  window.appendChild(header);
  window.appendChild(content);

  // Load initial module
  loadDebugModule("settings-manager");

  // Event handlers
  setupDebugWindowHandlers(window);

  // Add to page
  document.body.appendChild(window);

  return window;
};

const loadDebugModule = (moduleId) => {
  const content = document.getElementById("debug-window-content");
  if (!content) return;

  // Clear content
  content.innerHTML = "";

  // Load module
  const module = DEBUG_MODULES[moduleId];
  if (!module) return;

  // Create module component
  let moduleComponent;
  switch (moduleId) {
    case "settings-manager":
      moduleComponent = createSettingsManagerDebugModule();
      break;
    default:
      moduleComponent = document.createElement("div");
      moduleComponent.innerHTML = `
        <div class="debug-section">
          <h4>${module.name}</h4>
          <p>${module.description}</p>
          <p><em>This debug module is coming soon...</em></p>
        </div>
      `;
  }

  content.appendChild(moduleComponent);

  // Update active state
  Object.values(DEBUG_MODULES).forEach((m) => (m.active = false));
  module.active = true;
};

const setupDebugWindowHandlers = (window) => {
  // Module selector
  const selector = window.querySelector("#debug-module-selector");
  selector?.addEventListener("change", (e) => {
    loadDebugModule(e.target.value);
  });

  // Close button
  window.querySelector("#debug-window-close")?.addEventListener("click", () => {
    window.remove();
  });

  // Minimize button
  let minimized = false;
  window
    .querySelector("#debug-window-minimize")
    ?.addEventListener("click", () => {
      const content = window.querySelector("#debug-window-content");
      if (minimized) {
        content.style.display = "block";
        window.style.height = "auto";
        minimized = false;
      } else {
        content.style.display = "none";
        window.style.height = "48px";
        minimized = true;
      }
    });
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Debug Platform Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🛠️ Debug Tools starting...");

    // ✅ VERIFY FOUNDATION DEPENDENCY
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    // 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Debug Tools: Open Debug Window",
        callback: () => {
          createDebugWindow();
        },
      },
      {
        label: "Debug Tools: Settings Manager Focus",
        callback: () => {
          const window = createDebugWindow();
          const selector = window.querySelector("#debug-module-selector");
          if (selector) selector.value = "settings-manager";
          loadDebugModule("settings-manager");
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    const platform = window.RoamExtensionSuite;
    platform.register(
      "debug-tools",
      {
        openDebugWindow: createDebugWindow,
        loadModule: loadDebugModule,
        modules: DEBUG_MODULES,
        version: "1.0.0",
      },
      {
        name: "Debug Tools",
        description: "Swappable debug modules for current development focus",
        version: "1.0.0",
        dependencies: ["foundation-registry"],
      }
    );

    console.log("✅ Debug Tools loaded successfully!");
    console.log('💡 Try: Cmd+P → "Debug Tools: Open Debug Window"');

    // Auto-open debug window for development
    setTimeout(() => {
      createDebugWindow();
    }, 1000);
  },

  onunload: () => {
    console.log("🛠️ Debug Tools unloading...");

    // Remove debug window
    const window = document.getElementById("roam-extension-debug-window");
    if (window) window.remove();

    console.log("✅ Debug Tools cleanup complete!");
  },
};
