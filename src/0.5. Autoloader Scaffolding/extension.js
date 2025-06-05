// ===================================================================
// Extension 0.5: Reload Manager - Development Extension Loader
// Checkbox interface for selective extension loading during development
// ===================================================================

// ===================================================================
// 🔧 EXTENSION CATALOG - Available Extensions
// ===================================================================

const EXTENSION_CATALOG = {
  "foundation-registry": {
    id: "foundation-registry",
    name: "Foundation Registry",
    description:
      "Professional lifecycle management and extension coordination platform",
    file: "extension-1-foundation-registry.js",
    required: true, // Always loaded first
    dependencies: [],
  },
  "user-authentication": {
    id: "user-authentication",
    name: "User Authentication",
    description: "Professional user detection with multi-fallback approach",
    file: "extension-2-user-authentication.js",
    dependencies: ["foundation-registry"],
  },
  "settings-manager": {
    id: "settings-manager",
    name: "Settings Manager",
    description: "Tree-based configuration with auto-creation",
    file: "extension-3-settings-manager.js",
    dependencies: ["foundation-registry", "user-authentication"],
  },
  "navigation-protection": {
    id: "navigation-protection",
    name: "Navigation + Protection",
    description: "Smart landing + collaborative page protection",
    file: "extension-4-navigation-protection.js",
    dependencies: [
      "foundation-registry",
      "user-authentication",
      "settings-manager",
    ],
  },
  "personal-shortcuts": {
    id: "personal-shortcuts",
    name: "Personal Shortcuts",
    description: "Professional shortcuts with keyboard navigation",
    file: "extension-5-personal-shortcuts.js",
    dependencies: [
      "foundation-registry",
      "user-authentication",
      "settings-manager",
    ],
  },
  "user-directory": {
    id: "user-directory",
    name: "User Directory + Timezones",
    description: "User directory with real-time timezone intelligence",
    file: "extension-6-user-directory.js",
    dependencies: [
      "foundation-registry",
      "user-authentication",
      "settings-manager",
    ],
  },
  "journal-quick-entry": {
    id: "journal-quick-entry",
    name: "Journal Quick Entry",
    description: "Daily entry buttons with natural language dates",
    file: "extension-7-journal-quick-entry.js",
    dependencies: [
      "foundation-registry",
      "user-authentication",
      "settings-manager",
    ],
  },
  "conversation-processor": {
    id: "conversation-processor",
    name: "Conversation Processor",
    description: "Comment → conversation conversion + username tagging",
    file: "extension-8-conversation-processor.js",
    dependencies: ["foundation-registry", "user-authentication"],
  },
  "timestamp-enhancer": {
    id: "timestamp-enhancer",
    name: "Timestamp Enhancer",
    description: "Beautiful #ts0 timestamp pills with temporal context",
    file: "extension-9-timestamp-enhancer.js",
    dependencies: ["foundation-registry"],
  },
  "debug-tools": {
    id: "debug-tools",
    name: "Debug Tools",
    description: "Swappable debug modules for current development focus",
    file: "extension-0-debug-tools.js",
    dependencies: ["foundation-registry"],
  },
};

// ===================================================================
// 🗃️ PREFERENCES STORAGE - Development Settings
// ===================================================================

const STORAGE_KEY = "roam-extension-suite-dev-prefs";

const getStoredPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("Failed to load stored preferences:", error.message);
    return {};
  }
};

const storePreferences = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn("Failed to store preferences:", error.message);
  }
};

// ===================================================================
// 🎨 RELOAD MANAGER UI - Professional Interface
// ===================================================================

const createReloadManagerUI = () => {
  // Remove existing UI if present
  const existingUI = document.getElementById("roam-extension-reload-manager");
  if (existingUI) {
    existingUI.remove();
  }

  // Create main container
  const container = document.createElement("div");
  container.id = "roam-extension-reload-manager";
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 380px;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    background: #137cbd;
    color: white;
    padding: 12px 16px;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>🔄 Extension Reload Manager</span>
    <button id="close-reload-manager" style="
      background: none;
      border: none; 
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    ">×</button>
  `;

  // Content area
  const content = document.createElement("div");
  content.style.cssText = `
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  `;

  // Extension list
  const extensionList = document.createElement("div");
  extensionList.style.cssText = `
    margin-bottom: 16px;
  `;

  // Get current status
  const platform = window.RoamExtensionSuite;
  const loadedExtensions = platform ? platform.getStatus().extensions : [];
  const storedPrefs = getStoredPreferences();

  // Build extension checkboxes
  Object.values(EXTENSION_CATALOG).forEach((ext) => {
    const isLoaded = loadedExtensions.includes(ext.id);
    const isEnabled = storedPrefs[ext.id] !== false; // Default to enabled

    const item = document.createElement("div");
    item.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      border: 1px solid #e1e5e9;
      border-radius: 4px;
      background: ${isLoaded ? "#f0f9ff" : "#fafafa"};
    `;

    item.innerHTML = `
      <label style="display: flex; align-items: flex-start; cursor: pointer;">
        <input 
          type="checkbox" 
          ${isEnabled ? "checked" : ""} 
          ${ext.required ? "disabled" : ""}
          data-extension-id="${ext.id}"
          style="margin: 2px 8px 0 0; flex-shrink: 0;"
        >
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; color: ${
            isLoaded ? "#0d47a1" : "#333"
          };">
            ${ext.name}
            ${isLoaded ? " ✅" : ""}
            ${ext.required ? " (Required)" : ""}
          </div>
          <div style="font-size: 12px; color: #666; margin: 2px 0;">
            ${ext.description}
          </div>
          ${
            ext.dependencies.length > 0
              ? `
            <div style="font-size: 11px; color: #888;">
              Depends on: ${ext.dependencies.join(", ")}
            </div>
          `
              : ""
          }
        </div>
      </label>
    `;

    extensionList.appendChild(item);
  });

  // Control buttons
  const controls = document.createElement("div");
  controls.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;

  const buttonStyle = `
    padding: 8px 16px;
    border: 1px solid #137cbd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;

  controls.innerHTML = `
    <button id="reload-selected" style="${buttonStyle} background: #137cbd; color: white;">
      🔄 Reload Selected
    </button>
    <button id="unload-all" style="${buttonStyle} background: white; color: #137cbd;">
      🗑️ Unload All
    </button>
    <button id="select-all" style="${buttonStyle} background: white; color: #137cbd;">
      ✅ Select All
    </button>
    <button id="select-none" style="${buttonStyle} background: white; color: #137cbd;">
      ❌ Select None
    </button>
  `;

  // Status area
  const status = document.createElement("div");
  status.id = "reload-status";
  status.style.cssText = `
    margin-top: 12px;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    min-height: 20px;
  `;

  // Assemble UI
  content.appendChild(extensionList);
  content.appendChild(controls);
  content.appendChild(status);
  container.appendChild(header);
  container.appendChild(content);

  // Add to page
  document.body.appendChild(container);

  // Register for cleanup
  if (window._extensionRegistry) {
    window._extensionRegistry.elements.push(container);
  }

  return container;
};

// ===================================================================
// 🔄 EXTENSION LOADING LOGIC - Core Functionality
// ===================================================================

const showStatus = (message, type = "info") => {
  const status = document.getElementById("reload-status");
  if (!status) return;

  const colors = {
    info: "#e3f2fd",
    success: "#e8f5e8",
    error: "#ffebee",
    warning: "#fff3e0",
  };

  status.style.background = colors[type] || colors.info;
  status.textContent = message;

  setTimeout(() => {
    if (status) status.textContent = "";
  }, 3000);
};

const getSelectedExtensions = () => {
  const checkboxes = document.querySelectorAll("[data-extension-id]");
  const selected = [];

  checkboxes.forEach((cb) => {
    if (cb.checked && !cb.disabled) {
      selected.push(cb.dataset.extensionId);
    }
  });

  return selected;
};

const savePreferences = () => {
  const checkboxes = document.querySelectorAll("[data-extension-id]");
  const prefs = {};

  checkboxes.forEach((cb) => {
    prefs[cb.dataset.extensionId] = cb.checked;
  });

  storePreferences(prefs);
};

const unloadAllExtensions = async () => {
  showStatus("🗑️ Unloading all extensions...", "warning");

  // Note: In a real implementation, this would actually unload extensions
  // For now, we'll just show the status and let the user know they need to reload the page
  showStatus(
    "⚠️ Please reload the page to fully unload all extensions",
    "warning"
  );

  setTimeout(() => {
    showStatus(
      "💡 Tip: Use Cmd+R to reload the page, then reopen this manager",
      "info"
    );
  }, 3500);
};

const loadSelectedExtensions = async () => {
  const selected = getSelectedExtensions();
  if (selected.length === 0) {
    showStatus("❌ No extensions selected", "warning");
    return;
  }

  showStatus(`🔄 Loading ${selected.length} extension(s)...`, "info");

  // Save preferences
  savePreferences();

  // Sort by dependencies (foundation-registry first, etc.)
  const sortedExtensions = [];
  const resolved = new Set();

  const resolveDependencies = (extId) => {
    if (resolved.has(extId)) return;

    const ext = EXTENSION_CATALOG[extId];
    if (!ext) return;

    // First resolve dependencies
    ext.dependencies.forEach((depId) => {
      if (selected.includes(depId) || ext.required) {
        resolveDependencies(depId);
      }
    });

    // Then add this extension
    if (selected.includes(extId)) {
      sortedExtensions.push(extId);
      resolved.add(extId);
    }
  };

  selected.forEach(resolveDependencies);

  showStatus(`📋 Loading order: ${sortedExtensions.join(" → ")}`, "info");

  // Note: In a real implementation, this would load the actual extension files
  // For development, we'll show the user what would be loaded
  setTimeout(() => {
    showStatus(`💡 Would load: ${sortedExtensions.join(", ")}`, "success");
  }, 1500);

  setTimeout(() => {
    showStatus(
      "🚀 In full implementation: extensions would be loaded via import()",
      "info"
    );
  }, 4000);
};

// ===================================================================
// 🎯 EVENT HANDLERS - UI Interactions
// ===================================================================

const setupEventHandlers = () => {
  // Close button
  document
    .getElementById("close-reload-manager")
    ?.addEventListener("click", () => {
      const ui = document.getElementById("roam-extension-reload-manager");
      if (ui) ui.remove();
    });

  // Reload selected
  document
    .getElementById("reload-selected")
    ?.addEventListener("click", loadSelectedExtensions);

  // Unload all
  document
    .getElementById("unload-all")
    ?.addEventListener("click", unloadAllExtensions);

  // Select all
  document.getElementById("select-all")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll("[data-extension-id]");
    checkboxes.forEach((cb) => {
      if (!cb.disabled) cb.checked = true;
    });
    savePreferences();
  });

  // Select none
  document.getElementById("select-none")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll("[data-extension-id]");
    checkboxes.forEach((cb) => {
      if (!cb.disabled) cb.checked = false;
    });
    savePreferences();
  });

  // Individual checkboxes
  document.querySelectorAll("[data-extension-id]").forEach((cb) => {
    cb.addEventListener("change", savePreferences);
  });
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Development Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔄 Reload Manager starting...");

    // Create UI
    const ui = createReloadManagerUI();
    setupEventHandlers();

    // Register command to open manager
    const command = {
      label: "Extension Suite: Open Reload Manager",
      callback: () => {
        const existing = document.getElementById(
          "roam-extension-reload-manager"
        );
        if (existing) {
          existing.remove();
        }
        const newUI = createReloadManagerUI();
        setupEventHandlers();
        showStatus(
          '🔄 Reload Manager ready! Select extensions and click "Reload Selected"',
          "success"
        );
      },
    };

    window.roamAlphaAPI.ui.commandPalette.addCommand(command);

    // Register for cleanup
    if (window._extensionRegistry) {
      window._extensionRegistry.commands.push(command.label);
    }

    // Register with platform if available
    if (window.RoamExtensionSuite) {
      window.RoamExtensionSuite.register(
        "reload-manager",
        {
          openUI: () => {
            const ui = createReloadManagerUI();
            setupEventHandlers();
            return ui;
          },
          getSelectedExtensions,
          version: "1.0.0",
        },
        {
          name: "Reload Manager",
          description: "Development utility for selective extension loading",
          version: "1.0.0",
          dependencies: [],
        }
      );
    }

    console.log("✅ Reload Manager loaded successfully!");
    console.log('💡 Try: Cmd+P → "Extension Suite: Open Reload Manager"');

    // Auto-show on first load
    showStatus(
      "🎉 Reload Manager ready! Check the extensions you want to load.",
      "success"
    );
  },

  onunload: () => {
    console.log("🔄 Reload Manager unloading...");

    // Remove UI
    const ui = document.getElementById("roam-extension-reload-manager");
    if (ui) ui.remove();

    console.log("✅ Reload Manager cleanup complete!");
  },
};
