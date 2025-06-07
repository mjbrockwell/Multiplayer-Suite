// ===================================================================
// Extension 0.5: Auto-Loader Scaffolding - MIME TYPE ISSUE FIXED
// 🎯 SOLUTION: Blob URL method to bypass GitHub Raw MIME type restrictions
// ===================================================================

// ===================================================================
// 🔧 CONFIGURATION - Same as before
// ===================================================================

const DEVELOPMENT_MODE = true;
const BRANCH = DEVELOPMENT_MODE ? "main" : "main";

const GITHUB_CONFIG = {
  username: "mjbrockwell",
  repository: "Multiplayer-Suite",
  branch: BRANCH,
  baseUrl: `https://raw.githubusercontent.com/mjbrockwell/Multiplayer-Suite/${BRANCH}/`,
};

const EXTENSION_SUITE = [];

// ===================================================================
// 🔄 FIXED: Blob URL Extension Loading Method
// ===================================================================

/**
 * 🔧 FIXED: Load remote extension using Blob URL method to bypass MIME type issues
 */
const loadRemoteExtensionFixed = async (extensionConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔄 Loading ${extensionConfig.name} via Blob URL method...`);

      const url = GITHUB_CONFIG.baseUrl + extensionConfig.filename;
      const cacheBuster = new Date().getTime();
      const fullUrl = `${url}?cb=${cacheBuster}`;

      console.log(`📥 Fetching: ${fullUrl}`);

      // Step 1: Fetch the file content as text
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const code = await response.text();
      console.log(`📄 Retrieved ${code.length} characters of code`);

      // Step 2: Create blob with correct MIME type
      const blob = new Blob([code], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);

      console.log(`🔗 Created blob URL: ${blobUrl.substring(0, 50)}...`);

      // Step 3: Load as ES6 module from blob URL
      try {
        const module = await import(blobUrl);

        // Cleanup blob URL
        URL.revokeObjectURL(blobUrl);

        console.log(
          `✅ Successfully loaded ${extensionConfig.name} as ES6 module`
        );
        console.log(`📦 Module exports:`, Object.keys(module));

        resolve({
          ...extensionConfig,
          module: module,
          loadMethod: "blob-url",
        });
      } catch (importError) {
        console.error(
          `❌ ES6 import failed for ${extensionConfig.name}:`,
          importError
        );

        // Cleanup blob URL
        URL.revokeObjectURL(blobUrl);

        // Fallback: Try eval method
        console.log(
          `🔄 Trying fallback eval method for ${extensionConfig.name}...`
        );

        try {
          // Create a function that returns the module
          const moduleFunction = new Function(
            code + "\n//# sourceURL=" + extensionConfig.filename
          );
          const result = moduleFunction();

          console.log(
            `✅ Successfully loaded ${extensionConfig.name} via eval fallback`
          );

          resolve({
            ...extensionConfig,
            module: result,
            loadMethod: "eval-fallback",
          });
        } catch (evalError) {
          console.error(
            `❌ Eval fallback also failed for ${extensionConfig.name}:`,
            evalError
          );
          reject(
            new Error(
              `Both ES6 import and eval failed: ${importError.message} | ${evalError.message}`
            )
          );
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load ${extensionConfig.name}:`, error);
      reject(error);
    }
  });
};

// ===================================================================
// 🧪 ENHANCED: Test Single Extension Loading
// ===================================================================

/**
 * Test loading a single extension (for debugging)
 */
const testSingleExtensionLoad = async (
  extensionName = "Extension 1: Core Infrastructure"
) => {
  console.group(`🧪 Testing Single Extension Load: ${extensionName}`);

  try {
    // Find the extension config
    const extensionConfig =
      window.extensionAutoLoader.discoveredExtensions.find(
        (ext) => ext.name === extensionName
      );

    if (!extensionConfig) {
      throw new Error(
        `Extension "${extensionName}" not found in discovered extensions`
      );
    }

    console.log(`🎯 Testing: ${extensionConfig.name}`);
    console.log(`📁 File: ${extensionConfig.filename}`);
    console.log(`🔗 URL: ${GITHUB_CONFIG.baseUrl + extensionConfig.filename}`);

    const result = await loadRemoteExtensionFixed(extensionConfig);

    console.log(`✅ Test successful!`);
    console.log(`📦 Load method: ${result.loadMethod}`);
    console.log(`📋 Module keys:`, Object.keys(result.module));

    return result;
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    throw error;
  } finally {
    console.groupEnd();
  }
};

// ===================================================================
// 🔍 DISCOVERY FUNCTIONS - Same as before
// ===================================================================

const runEnhancedGitHubDiagnostics = async () => {
  console.group("🔍 Enhanced GitHub Configuration Diagnostics");

  console.log("📋 Current Configuration:");
  console.log(`  Username: ${GITHUB_CONFIG.username}`);
  console.log(`  Repository: ${GITHUB_CONFIG.repository}`);
  console.log(`  Branch: ${GITHUB_CONFIG.branch}`);
  console.log(`  Base URL: ${GITHUB_CONFIG.baseUrl}`);

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

  console.groupEnd();

  return { config: GITHUB_CONFIG, extensions: EXTENSION_SUITE };
};

const discoverExtensionFiles = async () => {
  console.log("🔍 Discovering extension files in src/ directory...");

  try {
    const srcUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/contents/src?ref=${GITHUB_CONFIG.branch}`;
    const srcResponse = await fetch(srcUrl);

    if (!srcResponse.ok) {
      throw new Error(`Failed to fetch src/ directory: ${srcResponse.status}`);
    }

    const srcContents = await srcResponse.json();

    const extensionDirs = srcContents.filter(
      (item) =>
        item.type === "dir" &&
        /^\d+[-\w]+/.test(item.name) &&
        item.name !== "0.5-autoloader"
    );

    console.log(
      `📁 Found ${extensionDirs.length} extension directories in src/:`
    );
    extensionDirs.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.name}/`);
    });

    const discoveredExtensions = [];

    for (const dir of extensionDirs) {
      try {
        const dirUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/contents/src/${dir.name}?ref=${GITHUB_CONFIG.branch}`;
        const dirResponse = await fetch(dirUrl);

        if (dirResponse.ok) {
          const dirContents = await dirResponse.json();
          const extensionFile = dirContents.find(
            (file) => file.name === "extension.js"
          );

          if (extensionFile) {
            const dirParts = dir.name.split("-");
            const extensionNumber = dirParts[0];
            const extensionName = dirParts
              .slice(1)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            const isCritical = ["1", "1.5", "2"].includes(extensionNumber);

            discoveredExtensions.push({
              id: dir.name,
              name: `Extension ${extensionNumber}: ${extensionName}`,
              filename: `src/${dir.name}/extension.js`,
              description: `${extensionName} (from ${dir.name}/)`,
              critical: isCritical,
              order: parseFloat(extensionNumber),
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
// 🎨 UI FUNCTIONS - Enhanced with test button
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
    width: 440px;
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
      background: linear-gradient(135deg, #059669 0%, #065f46 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
          🚀 Extension Suite Auto-Loader (MIME FIXED)
        </div>
        <div style="font-size: 12px; opacity: 0.9;" id="branch-indicator">
          Blob URL Method • GitHub MIME Type Issue Solved
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
        Running enhanced diagnostics with MIME type fix...
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
      Enhanced Auto-Loader v0.5.2 • Blob URL Method • MIME Type Issue Fixed
    </div>
  `;

  document.body.appendChild(dashboard);
  return dashboard;
};

const updateDashboardWithDiscovery = (discoveredExtensions) => {
  const content = document.getElementById("dashboard-content");
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; font-weight: 600; color: #059669; margin-bottom: 8px;">
        🔍 Extension Discovery Results (MIME FIXED)
      </div>
      <div style="font-size: 12px; color: #666;">
        Found ${
          discoveredExtensions.length
        } extension files • Blob URL loading ready
      </div>
    </div>

    <div style="max-height: 280px; overflow-y: auto;">
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
        🚀 Load All (Blob Method)
      </button>
      
      <button onclick="window.extensionAutoLoader.testSingleLoad()" style="
        background: #d97706;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">
        🧪 Test One
      </button>
      
      <button onclick="window.extensionAutoLoader.runDiagnostics()" style="
        background: #7c3aed;
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
// 🚀 ENHANCED MAIN AUTO-LOADER FUNCTIONALITY
// ===================================================================

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

  async testSingleLoad() {
    if (this.discoveredExtensions.length === 0) {
      console.log("❌ No extensions discovered. Run diagnostics first.");
      return;
    }

    // Test the first critical extension (usually Extension 1)
    const testExtension =
      this.discoveredExtensions.find((ext) => ext.critical) ||
      this.discoveredExtensions[0];

    console.log(`🧪 Testing single extension load: ${testExtension.name}`);

    try {
      const result = await testSingleExtensionLoad(testExtension.name);
      console.log("✅ Single extension test successful!");
      console.log("💡 All extensions should load successfully now.");
      return result;
    } catch (error) {
      console.error("❌ Single extension test failed:", error);
      throw error;
    }
  },

  async loadDiscoveredExtensions() {
    if (this.discoveredExtensions.length === 0) {
      console.log("❌ No extensions discovered. Run diagnostics first.");
      return;
    }

    console.log(
      `🚀 Loading ${this.discoveredExtensions.length} discovered extensions using Blob URL method...`
    );
    console.log(
      "📊 Loading order:",
      this.discoveredExtensions.map((e) => `${e.order}: ${e.name}`)
    );

    const results = {
      successful: [],
      failed: [],
    };

    for (let i = 0; i < this.discoveredExtensions.length; i++) {
      const extension = this.discoveredExtensions[i];

      try {
        console.log(
          `🔄 [${i + 1}/${this.discoveredExtensions.length}] Loading ${
            extension.name
          }...`
        );
        const result = await loadRemoteExtensionFixed(extension);
        results.successful.push(result);

        const delay = extension.critical ? 1000 : 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`❌ Failed to load ${extension.name}:`, error.message);
        results.failed.push({ extension, error: error.message });

        if (extension.critical) {
          console.warn(
            `💥 CRITICAL EXTENSION FAILED: ${extension.name} - other extensions may not work properly`
          );
        }
      }
    }

    console.group("🎯 Blob URL Auto-Load Results");
    console.log(
      `✅ Successful: ${results.successful.length}/${this.discoveredExtensions.length}`
    );
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.successful.length > 0) {
      console.log(
        "✅ Successfully loaded:",
        results.successful.map((e) => `${e.order}: ${e.name} (${e.loadMethod})`)
      );
    }

    if (results.failed.length > 0) {
      console.log(
        "❌ Failed to load:",
        results.failed.map((f) => `${f.extension.order}: ${f.extension.name}`)
      );
    }

    const criticalFailed = results.failed.filter(
      (f) => f.extension.critical
    ).length;
    if (criticalFailed === 0 && results.successful.length > 0) {
      console.log(
        "🎉 Extension suite loaded successfully using Blob URL method! All critical extensions operational."
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
// 🚀 ROAM EXTENSION EXPORT - Enhanced Entry Point
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log(
      "🚀 Enhanced Extension Suite Auto-Loader starting (MIME TYPE FIXED)..."
    );
    console.log(
      "🔧 Solution: Blob URL method bypasses GitHub Raw MIME type restrictions"
    );
    console.log(
      `📁 Repository: ${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}`
    );
    console.log(`🌿 Branch: ${GITHUB_CONFIG.branch}`);

    try {
      createEnhancedLoadingDashboard();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(
        "🔍 Starting enhanced repository discovery with MIME type fix..."
      );
      await window.extensionAutoLoader.runDiagnostics();

      console.log("✅ Enhanced Auto-Loader ready with Blob URL method!");
      console.log(
        "💡 Use dashboard buttons to test single extension or load all"
      );
      console.log(
        "🔧 MIME type issue resolved - extensions should load successfully"
      );
    } catch (error) {
      console.error("💥 Fatal error in enhanced auto-loader:", error);
    }
  },

  onunload: () => {
    console.log("🛠️ Enhanced Auto-Loader unloading...");

    const dashboard = document.getElementById("extension-auto-loader");
    if (dashboard) dashboard.remove();

    delete window.extensionAutoLoader;

    console.log("✅ Enhanced Auto-Loader cleanup complete!");
  },
};
