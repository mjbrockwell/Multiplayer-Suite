// ===================================================================
// Extension 0.5: Auto-Loader Scaffolding - FIXED CONFIGURATION
// 🎯 ONE EXTENSION TO LOAD THEM ALL!
// FIXED: Correct GitHub paths and repository configuration
// ===================================================================

// ===================================================================
// 🔧 FIXED CONFIGURATION - Correct Repository and Paths
// ===================================================================

// 🎯 EASY TOGGLE: Switch between dev and stable branches
const DEVELOPMENT_MODE = true; // ← Change this to switch branches
const BRANCH = DEVELOPMENT_MODE ? "main" : "main"; // Using main branch for now

// 🌐 GitHub Configuration - FIXED: Correct repo details
const GITHUB_CONFIG = {
  username: "mjbrockwell",
  repository: "Multiplayer-Suite",
  branch: BRANCH,
  baseUrl: `https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/${BRANCH}/`,
};

// 📦 Extension Loading Order - DYNAMIC: Will be discovered from src/ directory
// Extensions will be loaded in numerical order: 1, 1.5, 2, 3, etc.
const EXTENSION_SUITE = []; // Will be populated by discovery

// ===================================================================
// 🔍 ENHANCED GITHUB DIAGNOSTICS - Better Debugging
// ===================================================================

/**
 * Test GitHub repository connectivity and file structure
 */
const runEnhancedGitHubDiagnostics = async () => {
  console.group("🔍 Enhanced GitHub Configuration Diagnostics");

  console.log("📋 Current Configuration:");
  console.log(`  Username: ${GITHUB_CONFIG.username}`);
  console.log(`  Repository: ${GITHUB_CONFIG.repository}`);
  console.log(`  Branch: ${GITHUB_CONFIG.branch}`);
  console.log(`  Base URL: ${GITHUB_CONFIG.baseUrl}`);

  // Test repository accessibility
  console.log("\n🧪 Testing Repository Access...");
  try {
    const repoTestUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}`;
    const repoResponse = await fetch(repoTestUrl);

    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      console.log("✅ Repository exists and is accessible");
      console.log(`   Repository: ${repoData.full_name}`);
      console.log(`   Default branch: ${repoData.default_branch}`);
      console.log(`   Public: ${!repoData.private}`);
    } else {
      console.log(
        `❌ Repository not accessible: ${repoResponse.status} ${repoResponse.statusText}`
      );
    }
  } catch (error) {
    console.log(`❌ Repository check failed: ${error.message}`);
  }

  // Test branch accessibility
  console.log("\n🌿 Testing Branch Access...");
  try {
    const branchTestUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/branches/${GITHUB_CONFIG.branch}`;
    const branchResponse = await fetch(branchTestUrl);

    if (branchResponse.ok) {
      console.log(
        `✅ Branch '${GITHUB_CONFIG.branch}' exists and is accessible`
      );
    } else {
      console.log(
        `❌ Branch '${GITHUB_CONFIG.branch}' not accessible: ${branchResponse.status}`
      );

      // Suggest alternative branches
      try {
        const branchesUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/branches`;
        const branchesResponse = await fetch(branchesUrl);
        if (branchesResponse.ok) {
          const branches = await branchesResponse.json();
          const availableBranches = branches.map((b) => b.name);
          console.log(`💡 Available branches: ${availableBranches.join(", ")}`);
        }
      } catch (e) {
        console.log("Could not fetch available branches");
      }
    }
  } catch (error) {
    console.log(`❌ Branch check failed: ${error.message}`);
  }

  // Test file accessibility
  console.log("\n📁 Testing File Access...");

  // First, let's see what files are actually in the repository
  try {
    const contentsUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/contents?ref=${GITHUB_CONFIG.branch}`;
    const contentsResponse = await fetch(contentsUrl);

    if (contentsResponse.ok) {
      const contents = await contentsResponse.json();
      console.log("📂 Repository contents:");
      contents.forEach((item) => {
        console.log(`   ${item.type === "dir" ? "📁" : "📄"} ${item.name}`);
      });

      // Look for extension files
      const extensionFiles = contents.filter(
        (item) =>
          item.name.includes("extension") ||
          item.name.includes("Extension") ||
          item.name.endsWith(".js") ||
          item.name.endsWith(".txt")
      );

      if (extensionFiles.length > 0) {
        console.log("\n🎯 Potential extension files found:");
        extensionFiles.forEach((file) => {
          console.log(`   📄 ${file.name}`);
        });
      }
    } else {
      console.log(
        `❌ Could not fetch repository contents: ${contentsResponse.status}`
      );
    }
  } catch (error) {
    console.log(`❌ Contents check failed: ${error.message}`);
  }

  // Test each configured extension file
  console.log("\n🧪 Testing Configured Extension Files...");
  for (const ext of EXTENSION_SUITE) {
    const fullUrl = GITHUB_CONFIG.baseUrl + ext.filename;
    console.log(`Testing: ${ext.name}`);
    console.log(`   URL: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, { method: "HEAD" });
      if (response.ok) {
        console.log(`   ✅ File accessible`);
      } else {
        console.log(`   ❌ File not found: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  console.groupEnd();

  return {
    config: GITHUB_CONFIG,
    extensions: EXTENSION_SUITE,
  };
};

// ===================================================================
// 🛠️ SMART FILE DISCOVERY - Find the actual extension files
// ===================================================================

/**
 * Discover extension files in the src/ directory structure
 */
const discoverExtensionFiles = async () => {
  console.log("🔍 Discovering extension files in src/ directory...");

  try {
    // First, get contents of src/ directory
    const srcUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/contents/src?ref=${GITHUB_CONFIG.branch}`;
    const srcResponse = await fetch(srcUrl);

    if (!srcResponse.ok) {
      throw new Error(`Failed to fetch src/ directory: ${srcResponse.status}`);
    }

    const srcContents = await srcResponse.json();

    // Look for numbered extension directories (like 1-core-infrastructure, 2-user-authentication, etc.)
    const extensionDirs = srcContents.filter(
      (item) =>
        item.type === "dir" &&
        /^\d+[-\w]+/.test(item.name) && // Starts with number and has descriptive name
        item.name !== "0.5-autoloader" // Skip the autoloader itself
    );

    console.log(
      `📁 Found ${extensionDirs.length} extension directories in src/:`
    );
    extensionDirs.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.name}/`);
    });

    // Check each directory for extension.js
    const discoveredExtensions = [];

    for (const dir of extensionDirs) {
      try {
        // Check if extension.js exists in this directory
        const dirUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/contents/src/${dir.name}?ref=${GITHUB_CONFIG.branch}`;
        const dirResponse = await fetch(dirUrl);

        if (dirResponse.ok) {
          const dirContents = await dirResponse.json();
          const extensionFile = dirContents.find(
            (file) => file.name === "extension.js"
          );

          if (extensionFile) {
            // Parse directory name to create nice extension info
            const dirParts = dir.name.split("-");
            const extensionNumber = dirParts[0];
            const extensionName = dirParts
              .slice(1)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            const isCritical = ["1", "1.5", "2"].includes(extensionNumber); // Core infrastructure is critical

            discoveredExtensions.push({
              id: dir.name,
              name: `Extension ${extensionNumber}: ${extensionName}`,
              filename: `src/${dir.name}/extension.js`,
              description: `${extensionName} (from ${dir.name}/)`,
              critical: isCritical,
              order: parseFloat(extensionNumber), // For sorting
            });

            console.log(`   ✅ Found extension.js in ${dir.name}/`);
          } else {
            console.log(`   ⚠️  No extension.js in ${dir.name}/`);
          }
        }
      } catch (error) {
        console.warn(`   ❌ Error checking ${dir.name}/: ${error.message}`);
      }
    }

    // Sort by extension number for proper loading order
    discoveredExtensions.sort((a, b) => a.order - b.order);

    console.log(
      `🎯 Successfully discovered ${discoveredExtensions.length} extensions with proper loading order`
    );

    return discoveredExtensions;
  } catch (error) {
    console.error(`❌ Extension discovery failed: ${error.message}`);
    return [];
  }
};

// ===================================================================
// 🎨 AUTO-LOADER UI - Enhanced with Discovery Results
// ===================================================================

const createEnhancedLoadingDashboard = () => {
  const existing = document.getElementById("extension-auto-loader");
  if (existing) existing.remove();

  const dashboard = document.createElement("div");
  dashboard.id = "extension-auto-loader";
  dashboard.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 420px;
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
          🚀 Extension Suite Auto-Loader (FIXED)
        </div>
        <div style="font-size: 12px; opacity: 0.9;" id="branch-indicator">
          GitHub: ${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/${BRANCH}
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
        Running enhanced diagnostics...
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
      Enhanced Auto-Loader v0.5.1 • GitHub Integration Fixed
    </div>
  `;

  document.body.appendChild(dashboard);
  return dashboard;
};

/**
 * Update dashboard with discovery results
 */
const updateDashboardWithDiscovery = (discoveredExtensions) => {
  const content = document.getElementById("dashboard-content");
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; font-weight: 600; color: #137cbd; margin-bottom: 8px;">
        🔍 Extension Discovery Results
      </div>
      <div style="font-size: 12px; color: #666;">
        Found ${discoveredExtensions.length} extension files in repository
      </div>
    </div>

    <div style="max-height: 300px; overflow-y: auto;">
      ${
        discoveredExtensions.length === 0
          ? `
        <div style="text-align: center; padding: 20px; color: #666;">
          <div style="font-size: 14px; margin-bottom: 8px;">📂 No extensions found</div>
          <div style="font-size: 12px;">
            Looking for numbered directories in src/ with extension.js files
          </div>
        </div>
      `
          : discoveredExtensions
              .map(
                (ext, index) => `
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          ${ext.critical ? "background: #fef3c7;" : ""}
        ">
          <span style="
            font-size: 16px; 
            min-width: 24px; 
            text-align: center;
            font-weight: bold;
            color: ${ext.critical ? "#92400e" : "#374151"};
          ">${ext.order}</span>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 500; color: #374151;">
              ${ext.name}
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">
              📁 ${ext.filename}
            </div>
          </div>
          ${
            ext.critical
              ? '<span style="font-size: 10px; background: #92400e; color: white; padding: 2px 6px; border-radius: 8px; font-weight: 500;">CRITICAL</span>'
              : ""
          }
        </div>
      `
              )
              .join("")
      }
    </div>

    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <button onclick="window.extensionAutoLoader.loadDiscoveredExtensions()" style="
        flex: 1;
        background: #059669;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">
        🚀 Load These Extensions
      </button>
      
      <button onclick="window.extensionAutoLoader.runDiagnostics()" style="
        background: #d97706;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">
        🔍 Re-scan
      </button>
    </div>
  `;
};

// ===================================================================
// 🔄 ENHANCED EXTENSION LOADING ENGINE
// ===================================================================

/**
 * Load a single remote extension with better error handling
 */
const loadRemoteExtension = async (extensionConfig) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `🔄 Loading ${extensionConfig.name} from ${extensionConfig.filename}...`
      );

      const script = document.createElement("script");

      // Handle both .js and .txt files appropriately
      if (extensionConfig.filename.endsWith(".js")) {
        script.type = "module";
      } else {
        // For .txt files that contain JavaScript, create a module script
        script.type = "module";
      }

      script.src = GITHUB_CONFIG.baseUrl + extensionConfig.filename;

      // Add cache-busting parameter
      const cacheBuster = new Date().getTime();
      script.src += `?cb=${cacheBuster}`;

      script.onload = () => {
        console.log(`✅ Successfully loaded ${extensionConfig.name}`);
        resolve(extensionConfig);
      };

      script.onerror = (error) => {
        console.error(`❌ Failed to load ${extensionConfig.name}:`, error);
        console.error(`   URL attempted: ${script.src}`);
        reject(
          new Error(
            `Failed to load ${extensionConfig.name}: Check URL and file format`
          )
        );
      };

      // Shorter timeout for faster feedback
      setTimeout(() => {
        reject(
          new Error(`Timeout loading ${extensionConfig.name} after 15 seconds`)
        );
      }, 15000);

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

// ===================================================================
// 🚀 MAIN AUTO-LOADER FUNCTIONALITY
// ===================================================================

// Global object to expose functionality
window.extensionAutoLoader = {
  discoveredExtensions: [],

  async runDiagnostics() {
    console.log("🔍 Running enhanced GitHub diagnostics...");
    await runEnhancedGitHubDiagnostics();

    const discovered = await discoverExtensionFiles();
    this.discoveredExtensions = discovered;

    updateDashboardWithDiscovery(discovered);

    return discovered;
  },

  async loadDiscoveredExtensions() {
    if (this.discoveredExtensions.length === 0) {
      console.log("❌ No extensions discovered. Run diagnostics first.");
      return;
    }

    console.log(
      `🚀 Loading ${this.discoveredExtensions.length} discovered extensions in proper order...`
    );
    console.log(
      "📊 Loading order:",
      this.discoveredExtensions.map((e) => `${e.order}: ${e.name}`)
    );

    const results = {
      successful: [],
      failed: [],
    };

    // Load extensions in order (already sorted by discovery function)
    for (let i = 0; i < this.discoveredExtensions.length; i++) {
      const extension = this.discoveredExtensions[i];

      try {
        console.log(
          `🔄 [${i + 1}/${this.discoveredExtensions.length}] Loading ${
            extension.name
          }...`
        );
        await loadRemoteExtension(extension);
        results.successful.push(extension);

        // Longer delay for critical extensions to ensure proper initialization
        const delay = extension.critical ? 1000 : 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`❌ Failed to load ${extension.name}:`, error.message);
        results.failed.push({ extension, error: error.message });

        // For critical extensions, this could break the chain
        if (extension.critical) {
          console.warn(
            `💥 CRITICAL EXTENSION FAILED: ${extension.name} - other extensions may not work properly`
          );
        }
      }
    }

    console.group("🎯 Auto-Load Results");
    console.log(
      `✅ Successful: ${results.successful.length}/${this.discoveredExtensions.length}`
    );
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.successful.length > 0) {
      console.log(
        "✅ Successfully loaded:",
        results.successful.map((e) => `${e.order}: ${e.name}`)
      );
    }

    if (results.failed.length > 0) {
      console.log(
        "❌ Failed to load:",
        results.failed.map((f) => `${f.extension.order}: ${f.extension.name}`)
      );
    }

    // Show final status
    const criticalFailed = results.failed.filter(
      (f) => f.extension.critical
    ).length;
    if (criticalFailed === 0 && results.successful.length > 0) {
      console.log(
        "🎉 Extension suite loaded successfully! All critical extensions operational."
      );
    } else if (criticalFailed > 0) {
      console.warn(
        `⚠️ ${criticalFailed} critical extension(s) failed - suite may not function properly`
      );
    }

    console.groupEnd();

    return results;
  },
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Enhanced Main Entry Point
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🚀 Enhanced Extension Suite Auto-Loader starting...");
    console.log(
      `📁 Repository: ${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}`
    );
    console.log(`🌿 Branch: ${GITHUB_CONFIG.branch}`);

    try {
      // Create enhanced dashboard
      createEnhancedLoadingDashboard();

      // Wait a moment for Roam to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Run discovery and diagnostics
      console.log("🔍 Starting enhanced repository discovery...");
      await window.extensionAutoLoader.runDiagnostics();

      console.log("✅ Enhanced Auto-Loader ready!");
      console.log("💡 Use the dashboard to load discovered extensions");
    } catch (error) {
      console.error("💥 Fatal error in enhanced auto-loader:", error);
    }
  },

  onunload: () => {
    console.log("🛠️ Enhanced Auto-Loader unloading...");

    // Clean up dashboard
    const dashboard = document.getElementById("extension-auto-loader");
    if (dashboard) dashboard.remove();

    // Clean up global object
    delete window.extensionAutoLoader;

    console.log("✅ Enhanced Auto-Loader cleanup complete!");
  },
};
