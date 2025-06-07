// ===================================================================
// Extension 0.5: Auto-Loader Scaffolding - EXTENSION SUITE ORCHESTRATOR
// 🎯 ONE EXTENSION TO LOAD THEM ALL!
// Loads entire Roam Extension Suite from GitHub in proper dependency order
// ===================================================================

// ===================================================================
// 🔧 CONFIGURATION - Easy Branch & Extension Management
// ===================================================================

// 🎯 EASY TOGGLE: Switch between dev and stable branches
const DEVELOPMENT_MODE = true; // ← Change this to switch branches
const BRANCH = DEVELOPMENT_MODE ? "dev" : "main";

// 🌐 GitHub Configuration - FIXED: Correct repo details
const GITHUB_CONFIG = {
  username: "mjbrockwell",
  repository: "Multiplayer-Suite",
  branch: BRANCH,
  baseUrl: `https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/${BRANCH}/src/`,
};

// 📦 Extension Loading Order (CRITICAL: Maintain dependency order!)
// Using ACTUAL GitHub folder names from your repo structure
const EXTENSION_SUITE = [
  {
    id: "foundation-registry",
    name: "Foundation Registry",
    filename: "1-core-infrastructure/extension.js",
    description: "Professional lifecycle management and cleanup registry",
    critical: true, // Must load for others to work
  },
  {
    id: "utility-library",
    name: "Enhanced Utility Library",
    filename: "1.5-utilities/extension.js",
    description: "Cross-cutting utilities with universal data parsing",
    critical: true,
  },
  {
    id: "user-authentication",
    name: "User Authentication",
    filename: "2-user-authentication/extension.js",
    description: "Professional user session management",
    critical: true,
  },
  {
    id: "configuration-manager",
    name: "Configuration Manager",
    filename: "3-preferences-manager/extension.js",
    description: "Professional settings with validation workflows",
    critical: false,
  },
  {
    id: "user-directory",
    name: "User Directory + Timezones",
    filename: "6-user-directory/extension.js",
    description: "Enhanced user profiles with timezone intelligence",
    critical: false,
  },
  // 🎯 Extensions 7, 8, 9 folders exist but still being updated - will add when ready!
  // {
  //   id: 'journal-quick-entry',
  //   name: 'Journal Quick Entry',
  //   filename: '7-journal-quick-entry/extension.js',
  //   description: 'Daily entry buttons with natural language dates',
  //   critical: false
  // },
  // {
  //   id: 'conversation-processor',
  //   name: 'Conversation Processor',
  //   filename: '8-conversation-processor/extension.js',
  //   description: 'Comment → conversation conversion + username tagging',
  //   critical: false
  // },
  // {
  //   id: 'timestamp-enhancer',
  //   name: 'Timestamp Enhancer',
  //   filename: '9-timestamp-enhancer/extension.js',
  //   description: 'Beautiful #ts0 timestamp pills with temporal context',
  //   critical: false
  // }
];

// ===================================================================
// 🎨 AUTO-LOADER UI - Professional Loading Dashboard
// ===================================================================

/**
 * Create the loading dashboard UI
 */
const createLoadingDashboard = () => {
  // Remove existing dashboard
  const existing = document.getElementById("extension-auto-loader");
  if (existing) existing.remove();

  const dashboard = document.createElement("div");
  dashboard.id = "extension-auto-loader";
  dashboard.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 380px;
    background: white;
    border: 2px solid #137cbd;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  `;

  dashboard.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #137cbd 0%, #0f5a8f 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
          🚀 Extension Suite Auto-Loader
        </div>
        <div style="font-size: 12px; opacity: 0.9;" id="branch-indicator">
          Loading from ${BRANCH} branch...
        </div>
      </div>
      <button onclick="this.closest('#extension-auto-loader').remove()" style="
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    </div>
    
    <div style="padding: 20px;" id="dashboard-content">
      <div style="text-align: center; color: #666; font-size: 14px;">
        Initializing auto-loader...
      </div>
    </div>
    
    <div style="
      padding: 12px 20px;
      border-top: 1px solid #e1e5e9;
      background: #f8f9fa;
      font-size: 11px;
      color: #666;
      text-align: center;
    ">
      Extension Suite Orchestrator v0.5 • Professional Development Platform
    </div>
  `;

  document.body.appendChild(dashboard);
  return dashboard;
};

/**
 * Update dashboard with extension loading progress
 */
const updateDashboard = (extensions, currentIndex, status = "loading") => {
  const content = document.getElementById("dashboard-content");
  if (!content) return;

  const totalExtensions = extensions.length;
  const progressPercent =
    currentIndex >= 0 ? Math.round((currentIndex / totalExtensions) * 100) : 0;

  let statusColor = "#137cbd";
  let statusText = "Loading Extensions...";
  let statusIcon = "🔄";

  if (status === "success") {
    statusColor = "#059669";
    statusText = "All Extensions Loaded!";
    statusIcon = "✅";
  } else if (status === "error") {
    statusColor = "#dc2626";
    statusText = "Loading Error Occurred";
    statusIcon = "❌";
  }

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 14px; font-weight: 500; color: ${statusColor};">
          ${statusIcon} ${statusText}
        </span>
        <span style="font-size: 12px; color: #666;">
          ${currentIndex}/${totalExtensions}
        </span>
      </div>
      
      <div style="
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      ">
        <div style="
          width: ${progressPercent}%;
          height: 100%;
          background: linear-gradient(90deg, ${statusColor} 0%, ${statusColor}aa 100%);
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>

    <div style="max-height: 200px; overflow-y: auto;">
      ${extensions
        .map((ext, index) => {
          let itemStatus = "⏳"; // Pending
          let itemColor = "#9ca3af";

          if (index < currentIndex) {
            itemStatus = "✅"; // Completed
            itemColor = "#059669";
          } else if (index === currentIndex && status === "loading") {
            itemStatus = "🔄"; // Currently loading
            itemColor = "#137cbd";
          } else if (index === currentIndex && status === "error") {
            itemStatus = "❌"; // Failed
            itemColor = "#dc2626";
          }

          return `
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          ">
            <span style="font-size: 14px;">${itemStatus}</span>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 500; color: ${itemColor};">
                ${ext.name}
              </div>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">
                ${ext.description}
              </div>
            </div>
            ${
              ext.critical
                ? '<span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 8px; font-weight: 500;">CRITICAL</span>'
                : ""
            }
          </div>
        `;
        })
        .join("")}
    </div>

    ${
      status === "success"
        ? `
      <div style="
        margin-top: 16px;
        padding: 12px;
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 6px;
        text-align: center;
      ">
        <div style="font-size: 14px; font-weight: 600; color: #0369a1; margin-bottom: 4px;">
          🎉 Extension Suite Ready!
        </div>
        <div style="font-size: 12px; color: #0369a1;">
          All ${totalExtensions} extensions loaded successfully from ${BRANCH} branch
        </div>
      </div>
    `
        : ""
    }

    ${
      status === "error"
        ? `
      <div style="
        margin-top: 16px;
        padding: 12px;
        background: #fef2f2;
        border: 1px solid #f87171;
        border-radius: 6px;
      ">
        <div style="font-size: 14px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
          ⚠️ Loading Issues Detected
        </div>
        <div style="font-size: 12px; color: #dc2626; margin-bottom: 8px;">
          Some extensions may not have loaded properly. Check debug info below.
        </div>
        
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #dc2626;">
            🔍 Debug Information (Click to expand)
          </summary>
          <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; font-size: 11px;">
            <div style="margin-bottom: 8px;">
              <strong>GitHub Configuration:</strong><br>
              Username: ${GITHUB_CONFIG.username}<br>
              Repository: ${GITHUB_CONFIG.repository}<br>
              Branch: ${GITHUB_CONFIG.branch}<br>
              Base URL: ${GITHUB_CONFIG.baseUrl}
            </div>
            
            <div style="margin-bottom: 8px;">
              <strong>Extension URLs Being Attempted:</strong>
            </div>
            
            ${extensions
              .map(
                (ext) => `
              <div style="margin-bottom: 4px; padding: 4px; background: #f8f9fa; border-radius: 2px;">
                <div style="font-weight: 600; color: #374151;">${ext.name}:</div>
                <div style="color: #6b7280; word-break: break-all;">
                  ${GITHUB_CONFIG.baseUrl}${ext.filename}
                </div>
              </div>
            `
              )
              .join("")}
            
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <button onclick="navigator.clipboard.writeText(\`${extensions
                .map((ext) => GITHUB_CONFIG.baseUrl + ext.filename)
                .join("\\n")}\`)" style="
                background: #137cbd;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 11px;
              ">
                📋 Copy All URLs
              </button>
              <span style="margin-left: 8px; font-size: 10px; color: #666;">
                Copy URLs to test manually in browser
              </span>
            </div>
          </div>
        </details>
      </div>
    `
        : ""
    }
  `;
};

// ===================================================================
// 🔄 EXTENSION LOADING ENGINE - The Heart of the Auto-Loader
// ===================================================================

/**
 * Load a single remote extension from GitHub
 */
const loadRemoteExtension = async (extensionConfig) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `🔄 Loading ${extensionConfig.name} from ${extensionConfig.filename}...`
      );

      const script = document.createElement("script");
      script.type = "module";
      script.src = GITHUB_CONFIG.baseUrl + extensionConfig.filename;

      // Add cache-busting parameter to ensure we get latest version
      const cacheBuster = new Date().getTime();
      script.src += `?cb=${cacheBuster}`;

      script.onload = () => {
        console.log(`✅ Successfully loaded ${extensionConfig.name}`);
        resolve(extensionConfig);
      };

      script.onerror = (error) => {
        console.error(`❌ Failed to load ${extensionConfig.name}:`, error);
        reject(
          new Error(
            `Failed to load ${extensionConfig.name}: ${
              error.message || "Unknown error"
            }`
          )
        );
      };

      // Add timeout for loading
      setTimeout(() => {
        reject(
          new Error(`Timeout loading ${extensionConfig.name} after 30 seconds`)
        );
      }, 30000);

      document.head.appendChild(script);
    } catch (error) {
      console.error(
        `❌ Error setting up load for ${extensionConfig.name}:`,
        error
      );
      reject(error);
    }
  });
};

/**
 * Wait for extension to be properly initialized
 */
const waitForExtensionInitialization = async (
  extensionConfig,
  maxWaitTime = 10000
) => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    // Check if extension registered itself with the platform
    if (
      window.RoamExtensionSuite &&
      window.RoamExtensionSuite.has(extensionConfig.id)
    ) {
      console.log(`✅ ${extensionConfig.name} properly initialized`);
      return true;
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.warn(
    `⚠️ ${extensionConfig.name} loaded but may not be fully initialized`
  );
  return false;
};

/**
 * Load all extensions in sequence with proper error handling
 */
const loadExtensionSuite = async () => {
  const dashboard = createLoadingDashboard();
  updateDashboard(EXTENSION_SUITE, 0, "loading");

  const results = {
    successful: [],
    failed: [],
    totalTime: 0,
  };

  const startTime = Date.now();

  try {
    for (let i = 0; i < EXTENSION_SUITE.length; i++) {
      const extension = EXTENSION_SUITE[i];

      try {
        // Update dashboard to show current loading
        updateDashboard(EXTENSION_SUITE, i, "loading");

        // Load the extension
        await loadRemoteExtension(extension);

        // For critical extensions, wait for proper initialization
        if (extension.critical) {
          await waitForExtensionInitialization(extension);
        } else {
          // Small delay for non-critical extensions
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        results.successful.push(extension);

        // Update dashboard to show progress
        updateDashboard(EXTENSION_SUITE, i + 1, "loading");
      } catch (error) {
        console.error(`❌ Failed to load ${extension.name}:`, error);
        results.failed.push({ extension, error: error.message });

        // For critical extensions, this is a serious problem
        if (extension.critical) {
          console.error(
            `💥 CRITICAL EXTENSION FAILED: ${extension.name} - this may break other extensions`
          );
          updateDashboard(EXTENSION_SUITE, i, "error");

          // Continue loading others, but mark as error state
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    results.totalTime = Date.now() - startTime;

    // Final status update
    const hasErrors = results.failed.length > 0;
    const hasCriticalErrors = results.failed.some((f) => f.extension.critical);

    if (hasCriticalErrors) {
      updateDashboard(EXTENSION_SUITE, EXTENSION_SUITE.length, "error");
    } else {
      updateDashboard(EXTENSION_SUITE, EXTENSION_SUITE.length, "success");
    }

    // Log final results
    console.group("🎯 Extension Suite Auto-Load Results");
    console.log(
      `✅ Successful: ${results.successful.length}/${EXTENSION_SUITE.length}`
    );
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⏱️ Total time: ${Math.round(results.totalTime / 1000)}s`);
    console.log(`🌿 Branch: ${BRANCH}`);

    if (results.failed.length > 0) {
      console.group("❌ Failed Extensions");
      results.failed.forEach((failure) => {
        console.log(`${failure.extension.name}: ${failure.error}`);
      });
      console.groupEnd();
    }

    if (results.successful.length > 0) {
      console.group("✅ Successfully Loaded");
      results.successful.forEach((ext) => {
        console.log(`${ext.name} (${ext.filename})`);
      });
      console.groupEnd();
    }

    console.groupEnd();

    // Auto-close dashboard after delay if successful
    if (!hasErrors) {
      setTimeout(() => {
        const dashboardElement = document.getElementById(
          "extension-auto-loader"
        );
        if (dashboardElement) {
          dashboardElement.style.opacity = "0.7";
          setTimeout(() => dashboardElement.remove(), 3000);
        }
      }, 5000);
    }

    return results;
  } catch (error) {
    console.error("💥 Fatal error in extension loading:", error);
    updateDashboard(EXTENSION_SUITE, -1, "error");
    throw error;
  }
};

// ===================================================================
// 🛠️ UTILITY FUNCTIONS - Helper Operations
// ===================================================================

/**
 * Validate GitHub configuration
 */
const validateConfiguration = () => {
  const issues = [];

  if (!GITHUB_CONFIG.username) issues.push("GitHub username not configured");
  if (!GITHUB_CONFIG.repository)
    issues.push("GitHub repository not configured");
  if (!GITHUB_CONFIG.branch) issues.push("GitHub branch not configured");
  if (EXTENSION_SUITE.length === 0)
    issues.push("No extensions configured to load");

  const criticalExtensions = EXTENSION_SUITE.filter((ext) => ext.critical);
  if (criticalExtensions.length === 0) {
    console.warn("⚠️ No critical extensions marked - this may cause issues");
  }

  if (issues.length > 0) {
    console.error("❌ Configuration issues:", issues);
    return false;
  }

  console.log("✅ Configuration validated successfully");
  return true;
};

/**
 * Quick diagnostic function to test GitHub configuration
 */
const runGitHubDiagnostics = async () => {
  console.group("🔍 GitHub Configuration Diagnostics");

  console.log("📋 Configuration:");
  console.log(`  Username: ${GITHUB_CONFIG.username}`);
  console.log(`  Repository: ${GITHUB_CONFIG.repository}`);
  console.log(`  Branch: ${GITHUB_CONFIG.branch}`);
  console.log(`  Base URL: ${GITHUB_CONFIG.baseUrl}`);

  console.log("\n📦 Extension URLs:");
  EXTENSION_SUITE.forEach((ext) => {
    const fullUrl = GITHUB_CONFIG.baseUrl + ext.filename;
    console.log(`  ${ext.name}: ${fullUrl}`);
  });

  console.log("\n🧪 Testing first extension URL...");
  try {
    const testUrl = GITHUB_CONFIG.baseUrl + EXTENSION_SUITE[0].filename;
    const response = await fetch(testUrl, { method: "HEAD" });

    if (response.ok) {
      console.log("✅ First extension URL is accessible");
      console.log("💡 GitHub configuration appears correct");
    } else {
      console.log(
        `❌ First extension URL returned: ${response.status} ${response.statusText}`
      );
      console.log("💡 Check repository name, branch, and file paths");
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    console.log("💡 Check internet connection and repository access");
  }

  console.log("\n📋 Copy URLs for manual testing:");
  const allUrls = EXTENSION_SUITE.map(
    (ext) => GITHUB_CONFIG.baseUrl + ext.filename
  ).join("\n");
  console.log(allUrls);

  console.groupEnd();

  return {
    config: GITHUB_CONFIG,
    urls: EXTENSION_SUITE.map((ext) => GITHUB_CONFIG.baseUrl + ext.filename),
  };
};

/**
 * Clean up any existing extension remnants
 */
const cleanupExistingExtensions = () => {
  try {
    // Remove any existing auto-loader dashboards
    document
      .querySelectorAll("#extension-auto-loader")
      .forEach((el) => el.remove());

    // Clear any extension scripts (though this is tricky with modules)
    // We'll rely on the extensions' own cleanup mechanisms

    console.log("🧹 Cleaned up existing extension remnants");
  } catch (error) {
    console.warn("⚠️ Error during cleanup:", error);
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Auto-Loader Main Entry Point
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🚀 Extension Suite Auto-Loader starting...");
    console.log(`🌿 Branch: ${BRANCH} (Development Mode: ${DEVELOPMENT_MODE})`);
    console.log(`📦 Extensions to load: ${EXTENSION_SUITE.length}`);

    try {
      // Clean up any previous state
      cleanupExistingExtensions();

      // Validate configuration
      if (!validateConfiguration()) {
        console.error(
          "❌ Configuration validation failed - aborting auto-load"
        );
        return;
      }

      // Test connectivity and configuration
      console.log("🔍 Running GitHub diagnostics...");
      await runGitHubDiagnostics();

      // Wait a moment for Roam to settle
      console.log("⏳ Waiting for Roam to settle before loading extensions...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start the extension loading process
      console.log("🎯 Beginning extension suite auto-load...");
      const results = await loadExtensionSuite();

      // Success!
      if (results.successful.length === EXTENSION_SUITE.length) {
        console.log("🎉 Extension Suite Auto-Load completed successfully!");
        console.log("💡 All extensions should now be running and coordinated");
      } else {
        console.log(
          `⚠️ Extension Suite partially loaded: ${results.successful.length}/${EXTENSION_SUITE.length} successful`
        );
      }
    } catch (error) {
      console.error("💥 Fatal error in auto-loader:", error);

      // Show error in dashboard if it exists
      const dashboard = document.getElementById("extension-auto-loader");
      if (dashboard) {
        updateDashboard(EXTENSION_SUITE, -1, "error");
      }
    }
  },

  onunload: () => {
    console.log("🛠️ Extension Suite Auto-Loader unloading...");

    // Clean up dashboard
    const dashboard = document.getElementById("extension-auto-loader");
    if (dashboard) dashboard.remove();

    // Clean up commands
    if (window._extensionRegistry && window._extensionRegistry.commands) {
      window._extensionRegistry.commands.forEach((label) => {
        try {
          window.roamAlphaAPI.ui.commandPalette.removeCommand({ label });
        } catch (error) {
          console.warn(`Failed to remove command "${label}":`, error);
        }
      });
    }

    // Note: We don't unload the other extensions here since they manage their own lifecycle
    // The auto-loader's job is just to load them, not manage them ongoing

    console.log("✅ Auto-Loader cleanup complete!");
    console.log(
      "💡 Other extensions remain loaded and should clean up themselves"
    );
  },
};
