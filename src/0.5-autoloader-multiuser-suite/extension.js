// 👥 Multi-User Suite Modal Installer
// Complete autoloader for all Multi-User Suite extensions

const MULTIUSER_EXTENSIONS = [
  {
    id: "core-infrastructure",
    name: "Core Infrastructure",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/1-core-infrastructure/extension.js",
    description: "Foundation infrastructure for multi-user features",
    critical: true,
    exportPattern: "standard",
  },
  {
    id: "utilities",
    name: "Utilities",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/1.5-utilities/extension.js",
    description: "Shared utility functions and helpers",
    critical: true,
    exportPattern: "standard",
  },
  {
    id: "user-authentication",
    name: "User Authentication",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/2-user-authentication/extension.js",
    description: "User login and identity management",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "preferences-manager",
    name: "Preferences Manager",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/3-preferences-manager/extension.js",
    description: "User preference storage and management",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "navigation-manager",
    name: "Navigation Manager",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/4-navigation-manager/extension.js",
    description: "Enhanced navigation and routing features",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "personal-shortcuts",
    name: "Personal Shortcuts",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/5-personal-shortcuts/extension.js",
    description: "Customizable user shortcuts and quick actions",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "user-directory",
    name: "User Directory",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/6-user-directory/extension.js",
    description: "User profiles and directory browsing",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "avatar-css-maker",
    name: "Avatar CSS Maker",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/6.5-new-avatar-CSS-maker/extension.js",
    description: "Custom avatar styling and CSS generation",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "journal-quick-entry",
    name: "Journal Quick Entry",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/7-journal-quick-entry/extension.js",
    description: "Rapid journal entry tools and shortcuts",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "timestamps",
    name: "Timestamps",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/8-timestamps/extension.js",
    description: "Advanced timestamp and time tracking features",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "smart-username-tagger",
    name: "Smart Username Tagger",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/9-smart-username-tagger/extension.js",
    description: "Intelligent user tagging and mention system",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "floating-action-buttons",
    name: "Floating Action Buttons",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/10-floating-action-buttons/extension.js",
    description: "Customizable floating action buttons for quick access",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "comment-tagger",
    name: "Comment Tagger",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/11-comment-tagger/extension.js",
    description: "Advanced comment tagging and categorization system",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "notifications-core",
    name: "Notifications Core",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/12-notifications-core/extension.js",
    description: "Core notification system for real-time updates",
    critical: false,
    exportPattern: "standard",
  },
  {
    id: "profile-nudge",
    name: "Profile Nudge",
    url: "https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/refs/heads/main/src/13-profile-nudge/extension.js",
    description:
      "Smart profile completion prompts and user engagement features",
    critical: false,
    exportPattern: "standard",
  },
];

// Global state
let loadedExtensions = new Map();
let installerModal = null;
let installLog = [];

// Create mock extension API with CORRECT structure
function createMockExtensionAPI(extId) {
  return {
    settings: {
      get: (key) => localStorage.getItem(`multiuser-${extId}-${key}`),
      set: (key, value) =>
        localStorage.setItem(`multiuser-${extId}-${key}`, value),
      panel: {
        create: (config) => ({ id: Date.now(), config }),
      },
    },
    // CRITICAL: ui namespace required
    ui: {
      commandPalette: {
        // CRITICAL: under ui, not root
        addCommand: (command) => {
          console.log(`📋 Command added: ${command.label}`);
          return { id: Date.now(), ...command };
        },
        removeCommand: (commandId) => {
          console.log(`📋 Command removed: ${commandId}`);
          return true;
        },
      },
      createButton: (config) => ({ id: Date.now(), ...config }),
      showNotification: (message, type = "info") => {
        console.log(`🔔 Notification: ${message} (${type})`);
        return true;
      },
    },
  };
}

// Logging utility
function logMessage(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  installLog.push({ timestamp, message, type });
  console.log(`[${timestamp}] ${message}`);
  updateInstallLog();
}

// Update install log UI
function updateInstallLog() {
  const logContainer = document.getElementById("multiuser-install-log");
  if (!logContainer) return;

  logContainer.innerHTML = installLog
    .map((entry) => {
      const color =
        entry.type === "error"
          ? "#ff6b6b"
          : entry.type === "success"
          ? "#51cf66"
          : "#74c0fc";
      return `<div style="color: ${color}; margin: 2px 0;">
      [${entry.timestamp}] ${entry.message}
    </div>`;
    })
    .join("");

  logContainer.scrollTop = logContainer.scrollHeight;
}

// Update extension status in UI
function updateExtensionStatus(extId, status, error = null) {
  const row = document.getElementById(`ext-${extId}`);
  if (!row) return;

  const statusIcon = row.querySelector(".status-icon");
  const button = row.querySelector("button");

  switch (status) {
    case "pending":
      statusIcon.textContent = "⭕";
      button.textContent = "Install";
      button.disabled = false;
      button.style.background = "linear-gradient(135deg, #51cf66, #40c057)";
      row.style.border = "1px solid #e9ecef";
      break;

    case "loading":
      statusIcon.textContent = "🔄";
      button.textContent = "Loading...";
      button.disabled = true;
      button.style.background = "#adb5bd";
      row.style.border = "1px solid #74c0fc";
      break;

    case "success":
      statusIcon.textContent = "✅";
      button.textContent = "Installed";
      button.disabled = true;
      button.style.background = "#51cf66";
      row.style.border = "2px solid #51cf66";
      break;

    case "error":
      statusIcon.textContent = "❌";
      button.textContent = "Retry";
      button.disabled = false;
      button.style.background = "linear-gradient(135deg, #ff6b6b, #fa5252)";
      row.style.border = "2px solid #ff6b6b";
      break;
  }
}

// Install single extension
async function installExtension(extId) {
  const extension = MULTIUSER_EXTENSIONS.find((ext) => ext.id === extId);
  if (!extension) {
    throw new Error(`Extension ${extId} not found`);
  }

  logMessage(`🔄 Installing ${extension.name}...`);
  updateExtensionStatus(extId, "loading");

  try {
    // Fetch extension code
    logMessage(`📡 Fetching from GitHub: ${extension.name}`);
    const response = await fetch(extension.url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const code = await response.text();
    logMessage(`📝 Code retrieved (${code.length} bytes)`);

    // Create blob URL to bypass MIME type restrictions
    const blob = new Blob([code], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);

    try {
      // Setup mock API with CORRECT structure
      const mockAPI = createMockExtensionAPI(extId);

      // CRITICAL: Debug pre-execution API structure
      console.log(`🔍 PRE-EXECUTION DEBUG for ${extension.name}:`);
      console.log(`  mockAPI exists:`, !!mockAPI);
      console.log(`  mockAPI.ui exists:`, !!mockAPI.ui);
      console.log(
        `  mockAPI.ui.commandPalette exists:`,
        !!mockAPI.ui.commandPalette
      );

      // Test addCommand function
      try {
        const testResult = mockAPI.ui.commandPalette.addCommand({
          label: "test",
        });
        console.log(`  ✅ addCommand test successful:`, testResult);
      } catch (testError) {
        console.log(`  ❌ addCommand test failed:`, testError);
      }

      // Make API globally available (multiple locations for compatibility)
      window.extensionAPI = mockAPI;
      window._extensionAPI = mockAPI;
      if (!window.roamExtensions) window.roamExtensions = {};
      window.roamExtensions.extensionAPI = mockAPI;

      // Import module
      logMessage(`⚡ Importing module: ${extension.name}`);
      const module = await import(blobUrl);

      // Handle different export patterns
      let executed = false;

      if (module.default?.onload) {
        logMessage(`🎯 Executing standard onload: ${extension.name}`);
        await module.default.onload({ extensionAPI: mockAPI });
        executed = true;
      } else if (module.onload) {
        logMessage(`🎯 Executing named onload: ${extension.name}`);
        await module.onload({ extensionAPI: mockAPI });
        executed = true;
      } else if (typeof module.default === "function") {
        logMessage(`🎯 Executing function export: ${extension.name}`);
        await module.default({ extensionAPI: mockAPI });
        executed = true;
      } else {
        // Self-executing extension
        logMessage(`🎯 Self-executing extension detected: ${extension.name}`);
        executed = true;
      }

      // Clean up global API references
      delete window.extensionAPI;
      delete window._extensionAPI;
      delete window.roamExtensions.extensionAPI;

      // Store for unload
      loadedExtensions.set(extId, {
        name: extension.name,
        module: module.default || module,
        executed,
      });

      updateExtensionStatus(extId, "success");
      logMessage(`✅ ${extension.name} installed successfully!`, "success");
    } finally {
      // Always clean up blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error(`❌ ${extension.name} failed:`, error);
    updateExtensionStatus(extId, "error");
    logMessage(`❌ ${extension.name} failed: ${error.message}`, "error");
    throw error; // Re-throw for caller handling
  }
}

// Auto-install all extensions
async function autoInstallAll() {
  const autoBtn = document.getElementById("auto-install-btn");
  if (autoBtn) {
    autoBtn.disabled = true;
    autoBtn.textContent = "Installing...";
  }

  logMessage(
    "🚀 Starting auto-installation of all Multi-User Suite extensions..."
  );

  let successCount = 0;
  let failureCount = 0;

  for (const extension of MULTIUSER_EXTENSIONS) {
    try {
      await installExtension(extension.id);
      successCount++;
      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      failureCount++;
      logMessage(`⚠️ Continuing despite ${extension.name} failure...`);
    }
  }

  // Final report
  const totalCount = MULTIUSER_EXTENSIONS.length;
  if (successCount === totalCount) {
    logMessage(
      `🎉 Auto-installation complete! All ${successCount} extensions loaded.`,
      "success"
    );
  } else {
    logMessage(
      `⚠️ Auto-installation finished: ${successCount}/${totalCount} successful, ${failureCount} failed.`
    );
  }

  if (autoBtn) {
    autoBtn.disabled = false;
    autoBtn.textContent = "Auto-Install All Extensions";
  }
}

// Create installer modal UI
function createInstallerModal() {
  const modalHTML = `
    <div id="multiuser-installer-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #212529; font-size: 24px;">👥 Multi-User Suite Installer</h2>
          <p style="margin: 0; color: #6c757d; font-size: 14px;">Load all Multi-User Suite extensions with one click</p>
        </div>
        
        <button id="auto-install-btn" style="
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #20c997, #17a2b8);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s;
        " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
          Auto-Install All Extensions
        </button>
        
        <div style="margin-bottom: 20px;">
          ${MULTIUSER_EXTENSIONS.map(
            (ext) => `
            <div id="ext-${ext.id}" style="
              display: flex;
              align-items: center;
              padding: 12px;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              margin-bottom: 8px;
              transition: all 0.2s;
            ">
              <span class="status-icon" style="font-size: 16px; margin-right: 12px;">⭕</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #212529; margin-bottom: 2px;">
                  ${ext.name}${ext.critical ? " ⚡" : ""}
                </div>
                <div style="font-size: 12px; color: #6c757d;">${
                  ext.description
                }</div>
              </div>
              <button data-ext-id="${ext.id}" class="install-btn" style="
                padding: 6px 16px;
                background: linear-gradient(135deg, #51cf66, #40c057);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                min-width: 70px;
                transition: all 0.2s;
              ">Install</button>
            </div>
          `
          ).join("")}
        </div>
        
        <details style="margin-bottom: 20px;">
          <summary style="cursor: pointer; font-weight: 600; color: #495057; margin-bottom: 8px;">
            📋 Installation Log
          </summary>
          <div id="multiuser-install-log" style="
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 12px;
            max-height: 150px;
            overflow-y: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 11px;
            line-height: 1.4;
          "></div>
        </details>
        
        <div style="text-align: right;">
          <button id="close-installer-btn" style="
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  installerModal = document.getElementById("multiuser-installer-modal");

  // Event listeners
  document
    .getElementById("auto-install-btn")
    .addEventListener("click", autoInstallAll);
  document
    .getElementById("close-installer-btn")
    .addEventListener("click", closeInstaller);

  // Add event listeners for individual install buttons
  document.querySelectorAll(".install-btn").forEach((button) => {
    const extId = button.getAttribute("data-ext-id");
    button.addEventListener("click", () => installExtension(extId));
  });

  // Close on backdrop click
  installerModal.addEventListener("click", (e) => {
    if (e.target === installerModal) {
      closeInstaller();
    }
  });

  logMessage("📱 Multi-User Suite Installer opened");
}

// Close installer modal
function closeInstaller() {
  if (installerModal) {
    installerModal.remove();
    installerModal = null;
  }
}

// Dismiss the installer button
function dismissInstallerButton() {
  const buttonContainer = document.getElementById(
    "multiuser-installer-container"
  );
  if (buttonContainer) {
    buttonContainer.style.display = "none";
    // Store dismissal preference
    localStorage.setItem("multiuser-installer-dismissed", "true");
    console.log("👥 Multi-User Suite Installer button dismissed");
  }
}

// Show the installer button (in case user wants to bring it back)
function showInstallerButton() {
  // First clear the dismissal preference
  localStorage.removeItem("multiuser-installer-dismissed");

  // Check if container already exists
  const existingContainer = document.getElementById(
    "multiuser-installer-container"
  );
  if (existingContainer) {
    existingContainer.style.display = "block";
    console.log("👥 Multi-User Suite Installer button restored (was hidden)");
    return;
  }

  // If container doesn't exist, create it
  addInstallerButton();
  console.log("👥 Multi-User Suite Installer button created");
}

// Add installer button to Roam
function addInstallerButton() {
  // Check if user has dismissed the button
  if (localStorage.getItem("multiuser-installer-dismissed") === "true") {
    console.log(
      "👥 Multi-User Suite Installer button dismissed by user, not showing"
    );
    return;
  }

  const containerHTML = `
    <div id="multiuser-installer-container" style="
      position: fixed;
      top: 70px;
      right: 10px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <button id="multiuser-installer-btn" style="
        padding: 8px 12px;
        background: linear-gradient(135deg, #20c997, #17a2b8);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s;
      ">👥 Install Multi-User Suite</button>
      <button id="multiuser-installer-dismiss" style="
        width: 20px;
        height: 20px;
        background: rgba(108, 117, 125, 0.8);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        line-height: 1;
        padding: 0;
      " title="Dismiss installer button">×</button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", containerHTML);

  const installerBtn = document.getElementById("multiuser-installer-btn");
  const dismissBtn = document.getElementById("multiuser-installer-dismiss");

  // Main button event listeners
  installerBtn.addEventListener("click", createInstallerModal);
  installerBtn.addEventListener("mouseover", () => {
    installerBtn.style.transform = "translateY(-1px)";
    installerBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
  });
  installerBtn.addEventListener("mouseout", () => {
    installerBtn.style.transform = "translateY(0)";
    installerBtn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
  });

  // Dismiss button event listeners
  dismissBtn.addEventListener("click", dismissInstallerButton);
  dismissBtn.addEventListener("mouseover", () => {
    dismissBtn.style.background = "rgba(220, 53, 69, 0.8)";
    dismissBtn.style.transform = "scale(1.1)";
  });
  dismissBtn.addEventListener("mouseout", () => {
    dismissBtn.style.background = "rgba(108, 117, 125, 0.8)";
    dismissBtn.style.transform = "scale(1)";
  });

  console.log("👥 Multi-User Suite Installer button added");
}

// Main extension export
export default {
  onload: async ({ extensionAPI }) => {
    console.log("🚀 Multi-User Suite Installer Loading...");

    // Reset state
    loadedExtensions.clear();
    installLog = [];

    // Add installer button
    addInstallerButton();

    // Add command palette command to show installer button
    extensionAPI.ui.commandPalette.addCommand({
      label: "👥 Show Multi-User Suite Installer",
      callback: () => {
        showInstallerButton();
        console.log(
          "👥 Multi-User Suite Installer button restored via command palette"
        );
      },
    });

    // Add global function to re-show button if needed (fallback)
    window.showMultiUserInstaller = showInstallerButton;

    console.log("✅ Multi-User Suite Installer Ready!");

    // 🚀 AUTO-START: Automatically open modal and begin installation
    console.log("🎬 Auto-starting Multi-User Suite installation...");

    // Small delay to ensure everything is ready
    setTimeout(() => {
      createInstallerModal();
      // Auto-start the installation process
      setTimeout(() => {
        autoInstallAll();
      }, 1000); // 1 second delay to show the modal first
    }, 500);

    console.log(
      "💡 Tip: If you dismissed the button, use Cmd+P and search for 'Show Multi-User Suite Installer'"
    );
  },

  onunload: () => {
    console.log("🔄 Multi-User Suite Installer Unloading...");

    // Unload all installed extensions
    loadedExtensions.forEach((ext, id) => {
      try {
        if (ext.module?.onunload) {
          console.log(`🔄 Unloading ${ext.name}...`);
          ext.module.onunload();
        }
      } catch (error) {
        console.warn(`⚠️ Error unloading ${ext.name}:`, error);
      }
    });

    // Clean up UI
    closeInstaller();
    const installerContainer = document.getElementById(
      "multiuser-installer-container"
    );
    if (installerContainer) {
      installerContainer.remove();
    }

    // Clean up global function
    delete window.showMultiUserInstaller;

    // Reset state
    loadedExtensions.clear();
    installLog = [];

    console.log("✅ Multi-User Suite Installer Unloaded");
  },
};
