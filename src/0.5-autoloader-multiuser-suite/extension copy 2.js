// 👥 Multi-User Suite Auto-Loader
// Automatically loads all Multi-User Suite extensions on startup

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
];

// Global state
let loadedExtensions = new Map();
let loadingModal = null;

// Create mock extension API
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
    ui: {
      commandPalette: {
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

// Update loading progress
function updateLoadingProgress(current, total, currentExtension) {
  const progressElement = document.getElementById("multiuser-progress");
  const statusElement = document.getElementById("multiuser-status");

  if (progressElement) {
    const percentage = Math.round((current / total) * 100);
    progressElement.style.width = `${percentage}%`;
  }

  if (statusElement) {
    statusElement.textContent = `Loading ${currentExtension}... (${current}/${total})`;
  }
}

// Create simple loading modal
function createLoadingModal() {
  const modalHTML = `
    <div id="multiuser-loading-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        min-width: 300px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
        <h2 style="margin: 0 0 16px 0; color: #212529; font-size: 22px;">Loading Multi-User Suite</h2>
        <p id="multiuser-status" style="margin: 0 0 20px 0; color: #6c757d; font-size: 14px;">Initializing...</p>
        <div style="
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        ">
          <div id="multiuser-progress" style="
            height: 100%;
            background: linear-gradient(135deg, #20c997, #17a2b8);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 4px;
          "></div>
        </div>
        <p style="margin: 0; color: #adb5bd; font-size: 12px;">Please wait while all extensions load...</p>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  loadingModal = document.getElementById("multiuser-loading-modal");
}

// Close loading modal
function closeLoadingModal() {
  if (loadingModal) {
    loadingModal.remove();
    loadingModal = null;
  }
}

// Install single extension
async function installExtension(extId) {
  const extension = MULTIUSER_EXTENSIONS.find((ext) => ext.id === extId);
  if (!extension) {
    throw new Error(`Extension ${extId} not found`);
  }

  console.log(`🔄 Installing ${extension.name}...`);

  try {
    // Fetch extension code
    const response = await fetch(extension.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const code = await response.text();
    console.log(`📝 ${extension.name}: Code retrieved (${code.length} bytes)`);

    // Create blob URL to bypass MIME type restrictions
    const blob = new Blob([code], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);

    try {
      // Setup mock API
      const mockAPI = createMockExtensionAPI(extId);

      // Make API globally available
      window.extensionAPI = mockAPI;
      window._extensionAPI = mockAPI;
      if (!window.roamExtensions) window.roamExtensions = {};
      window.roamExtensions.extensionAPI = mockAPI;

      // Import and execute module
      const module = await import(blobUrl);
      let executed = false;

      if (module.default?.onload) {
        await module.default.onload({ extensionAPI: mockAPI });
        executed = true;
      } else if (module.onload) {
        await module.onload({ extensionAPI: mockAPI });
        executed = true;
      } else if (typeof module.default === "function") {
        await module.default({ extensionAPI: mockAPI });
        executed = true;
      } else {
        executed = true; // Self-executing extension
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

      console.log(`✅ ${extension.name} loaded successfully!`);
      return true;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error(`❌ ${extension.name} failed:`, error);
    throw error;
  }
}

// Auto-load all extensions
async function autoLoadAllExtensions() {
  console.log("🚀 Auto-loading Multi-User Suite extensions...");

  createLoadingModal();

  let successCount = 0;
  let failureCount = 0;
  const totalCount = MULTIUSER_EXTENSIONS.length;

  for (let i = 0; i < MULTIUSER_EXTENSIONS.length; i++) {
    const extension = MULTIUSER_EXTENSIONS[i];

    updateLoadingProgress(i, totalCount, extension.name);

    try {
      await installExtension(extension.id);
      successCount++;
    } catch (error) {
      failureCount++;
      console.warn(`⚠️ Continuing despite ${extension.name} failure...`);
    }

    // Small delay to show progress
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Final update
  updateLoadingProgress(totalCount, totalCount, "Complete");

  // Show completion status briefly
  const statusElement = document.getElementById("multiuser-status");
  if (statusElement) {
    if (successCount === totalCount) {
      statusElement.textContent = `🎉 All ${successCount} extensions loaded successfully!`;
      statusElement.style.color = "#28a745";
    } else {
      statusElement.textContent = `✅ ${successCount}/${totalCount} extensions loaded (${failureCount} failed)`;
      statusElement.style.color = "#ffc107";
    }
  }

  // Close modal after brief delay
  setTimeout(() => {
    closeLoadingModal();
    console.log(
      `🎯 Multi-User Suite loading complete: ${successCount}/${totalCount} successful`
    );
  }, 2000);
}

// Main extension export
export default {
  onload: async ({ extensionAPI }) => {
    console.log("🚀 Multi-User Suite Auto-Loader Starting...");

    // Reset state
    loadedExtensions.clear();

    // Immediately start auto-loading all extensions
    autoLoadAllExtensions();

    console.log("✅ Multi-User Suite Auto-Loader Initialized!");
  },

  onunload: () => {
    console.log("🔄 Multi-User Suite Auto-Loader Unloading...");

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
    closeLoadingModal();

    // Reset state
    loadedExtensions.clear();

    console.log("✅ Multi-User Suite Auto-Loader Unloaded");
  },
};
