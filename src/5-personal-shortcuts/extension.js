// ===================================================================
// Extension 5: Personal Shortcuts - Simplified Sidebar Implementation
// Focus: Get basic sidebar injection working with robust fallbacks
// Based on "Summary of Findings on Adding a Sidebar Element"
// ===================================================================

// ===================================================================
// 🔍 SIDEBAR INJECTION - Method 2 with Fallbacks (Proven Approach)
// ===================================================================

/**
 * Method 2: Parent Append (PRIMARY - from findings document)
 */
const injectViaParentAppend = (shortcutsElement) => {
  try {
    const starredPages = document.querySelector("div.starred-pages");
    if (!starredPages) {
      console.warn("Method 2: starred-pages container not found");
      return false;
    }

    console.log("Method 2: Found starred-pages, attempting parent append...");
    starredPages.parentElement.appendChild(shortcutsElement);
    console.log("✅ Method 2 (Parent Append) - SUCCESS");
    return true;
  } catch (error) {
    console.error("❌ Method 2 (Parent Append) failed:", error);
    return false;
  }
};

/**
 * Method 1: Fixed After (FALLBACK 1 - from findings document)
 */
const injectViaFixedAfter = (shortcutsElement) => {
  try {
    const starredPages = document.querySelector("div.starred-pages");
    if (!starredPages) {
      console.warn("Method 1: starred-pages container not found");
      return false;
    }

    const parent = starredPages.parentElement;
    const nextSibling = starredPages.nextSibling;

    console.log("Method 1: Attempting fixed after injection...");
    if (nextSibling) {
      parent.insertBefore(shortcutsElement, nextSibling);
    } else {
      parent.appendChild(shortcutsElement);
    }

    console.log("✅ Method 1 (Fixed After) - SUCCESS");
    return true;
  } catch (error) {
    console.error("❌ Method 1 (Fixed After) failed:", error);
    return false;
  }
};

/**
 * Method 3: Direct Sidebar (FALLBACK 2 - from findings document)
 */
const injectViaSidebarDirect = (shortcutsElement) => {
  try {
    const sidebar =
      document.querySelector(".roam-sidebar-container") ||
      document.querySelector('[data-testid="roam-left-sidebar"]') ||
      document.querySelector(".roam-sidebar-container.noselect");

    if (!sidebar) {
      console.warn("Method 3: No sidebar container found");
      return false;
    }

    console.log("Method 3: Attempting direct sidebar injection...");
    sidebar.appendChild(shortcutsElement);
    console.log("✅ Method 3 (Direct Sidebar) - SUCCESS");
    return true;
  } catch (error) {
    console.error("❌ Method 3 (Direct Sidebar) failed:", error);
    return false;
  }
};

/**
 * Robust injection with all fallback methods
 */
const injectWithAllFallbacks = (shortcutsElement) => {
  console.log("🚀 Starting sidebar injection with fallbacks...");

  // Try Method 2 (Primary)
  if (injectViaParentAppend(shortcutsElement)) {
    return { success: true, method: "Method 2 (Parent Append)" };
  }

  // Try Method 1 (Fallback 1)
  console.log("🔄 Method 2 failed, trying Method 1...");
  if (injectViaFixedAfter(shortcutsElement)) {
    return { success: true, method: "Method 1 (Fixed After)" };
  }

  // Try Method 3 (Fallback 2)
  console.log("🔄 Method 1 failed, trying Method 3...");
  if (injectViaSidebarDirect(shortcutsElement)) {
    return { success: true, method: "Method 3 (Direct Sidebar)" };
  }

  console.error("❌ ALL INJECTION METHODS FAILED");
  return { success: false, method: "All methods failed" };
};

// ===================================================================
// 🎨 UI CREATION - Simple, Professional Design
// ===================================================================

/**
 * Create the shortcuts section element
 */
const createShortcutsElement = (shortcuts) => {
  const element = document.createElement("div");
  element.className = "roam-extension-personal-shortcuts";
  element.id = "roam-extension-personal-shortcuts";

  // Professional styling from findings document
  element.style.cssText = `
    margin: 12px 0;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border-left: 3px solid #667eea;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  header.textContent = "★ Personal Shortcuts";

  // Shortcuts list
  const list = document.createElement("div");
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  if (shortcuts.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.style.cssText = `
      color: #8a9ba8;
      font-size: 11px;
      font-style: italic;
      padding: 4px 0;
    `;
    emptyMessage.textContent = "No shortcuts configured";
    list.appendChild(emptyMessage);
  } else {
    shortcuts.forEach((shortcut) => {
      const item = document.createElement("div");
      item.style.cssText = `
        padding: 4px 8px;
        margin: 1px 0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.15s ease;
        color: #333;
      `;
      item.textContent = shortcut;

      // Hover effect
      item.addEventListener("mouseenter", () => {
        item.style.background = "rgba(102, 126, 234, 0.1)";
      });

      item.addEventListener("mouseleave", () => {
        item.style.background = "";
      });

      // Click to navigate
      item.addEventListener("click", () => {
        navigateToPage(shortcut);
      });

      list.appendChild(item);
    });
  }

  element.appendChild(header);
  element.appendChild(list);

  return element;
};

// ===================================================================
// 🧭 NAVIGATION - Simple Page Navigation
// ===================================================================

/**
 * Navigate to a page (create if it doesn't exist)
 */
const navigateToPage = async (pageName) => {
  try {
    console.log(`🧭 Navigating to: ${pageName}`);

    // Use utility to check if page exists
    const platform = window.RoamExtensionSuite;
    if (!platform) {
      console.error("Platform not available for navigation");
      return;
    }

    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");

    let pageUid = getPageUidByTitle(pageName);

    if (!pageUid) {
      console.log(`Page "${pageName}" doesn't exist, creating...`);
      pageUid = await createPageIfNotExists(pageName);
    }

    if (pageUid) {
      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title: pageName } });
      console.log(`✅ Successfully navigated to: ${pageName}`);
    } else {
      console.error(`Failed to create/navigate to: ${pageName}`);
    }
  } catch (error) {
    console.error(`Navigation error for "${pageName}":`, error);
  }
};

// ===================================================================
// 📊 DATA MANAGEMENT - Simple Shortcuts Loading
// ===================================================================

/**
 * Get user shortcuts using the utility library
 */
const getUserShortcuts = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    if (!platform) {
      console.warn("Platform not available, using fallback shortcuts");
      return ["Daily Notes", "Chat Room"];
    }

    const getCurrentUser = platform.getUtility("getCurrentUser");
    const findDataValue = platform.getUtility("findDataValue");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    if (!getCurrentUser || !findDataValue || !getPageUidByTitle) {
      console.warn(
        "Required utilities not available, using fallback shortcuts"
      );
      return ["Daily Notes", "Chat Room"];
    }

    const user = getCurrentUser();
    const preferencesPageTitle = `${user.displayName}/user preferences`;
    const preferencesPageUid = getPageUidByTitle(preferencesPageTitle);

    if (!preferencesPageUid) {
      console.log(
        `No preferences page found for ${user.displayName}, using defaults`
      );
      return ["Daily Notes", "Chat Room"];
    }

    // Try to get shortcuts using universal parser
    const shortcutsData = findDataValue(
      preferencesPageUid,
      "Personal Shortcuts"
    );

    if (Array.isArray(shortcutsData)) {
      console.log(
        `📊 Loaded ${shortcutsData.length} shortcuts from preferences`
      );
      return shortcutsData;
    } else if (typeof shortcutsData === "string") {
      // Single shortcut
      return [shortcutsData];
    } else {
      console.log("No shortcuts found in preferences, using defaults");
      return ["Daily Notes", "Chat Room"];
    }
  } catch (error) {
    console.error("Error loading user shortcuts:", error);
    return ["Daily Notes", "Chat Room"];
  }
};

// ===================================================================
// 🔧 MAIN INJECTION FUNCTION
// ===================================================================

/**
 * Main function to inject shortcuts into sidebar
 */
const injectPersonalShortcuts = async () => {
  console.log("🔗 Starting Personal Shortcuts injection...");

  // Remove any existing shortcuts
  const existing = document.getElementById("roam-extension-personal-shortcuts");
  if (existing) {
    existing.remove();
    console.log("🧹 Removed existing shortcuts element");
  }

  // Get user shortcuts
  const shortcuts = await getUserShortcuts();
  console.log(`📊 Found ${shortcuts.length} shortcuts:`, shortcuts);

  // Create shortcuts element
  const shortcutsElement = createShortcutsElement(shortcuts);

  // Inject with fallbacks
  const result = injectWithAllFallbacks(shortcutsElement);

  if (result.success) {
    console.log(
      `✅ Personal Shortcuts injected successfully using ${result.method}`
    );

    // Register for cleanup
    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push(shortcutsElement);
    }

    return shortcutsElement;
  } else {
    console.error("❌ Failed to inject Personal Shortcuts with all methods");
    return null;
  }
};

// ===================================================================
// 🔍 DEBUG UTILITIES
// ===================================================================

/**
 * Debug function to analyze sidebar structure
 */
const debugSidebarStructure = () => {
  console.group("🔍 Sidebar Structure Analysis");

  // Check for various sidebar selectors
  const selectors = [
    "div.starred-pages",
    ".roam-sidebar-container",
    ".roam-sidebar-container.noselect",
    '[data-testid="roam-left-sidebar"]',
    '[data-testid="left-sidebar"]',
  ];

  selectors.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Found: ${selector}`, element);
      if (selector === "div.starred-pages" && element.parentElement) {
        console.log("  Parent element:", element.parentElement);
        console.log(
          "  Parent children count:",
          element.parentElement.children.length
        );
      }
    } else {
      console.log(`❌ Not found: ${selector}`);
    }
  });

  // Check for existing shortcuts
  const existingShortcuts = document.getElementById(
    "roam-extension-personal-shortcuts"
  );
  console.log("Existing shortcuts element:", existingShortcuts);

  console.groupEnd();
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔗 Personal Shortcuts (Simplified) starting...");

    // ✅ VERIFY FOUNDATION DEPENDENCY
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    // 📊 DEBUG INITIAL STATE
    console.log("🔍 Initial sidebar analysis:");
    debugSidebarStructure();

    // 🎯 INJECT SHORTCUTS WITH DELAY (let DOM settle)
    setTimeout(async () => {
      console.log("🚀 Attempting shortcuts injection...");
      const shortcutsElement = await injectPersonalShortcuts();

      if (shortcutsElement) {
        console.log("✅ Personal Shortcuts loaded successfully!");
      } else {
        console.error("❌ Personal Shortcuts failed to load");

        // Extra debug on failure
        setTimeout(() => {
          console.log("🔍 Post-failure sidebar analysis:");
          debugSidebarStructure();
        }, 1000);
      }
    }, 1000);

    // 📝 REGISTER DEBUG COMMANDS
    const commands = [
      {
        label: "Debug: Analyze Sidebar Structure",
        callback: debugSidebarStructure,
      },
      {
        label: "Debug: Test Shortcuts Injection",
        callback: async () => {
          console.log("🔄 Testing shortcuts injection...");
          const result = await injectPersonalShortcuts();
          if (result) {
            console.log("✅ Test injection successful");
          } else {
            console.log("❌ Test injection failed");
          }
        },
      },
      {
        label: "Debug: Test User Shortcuts Data",
        callback: async () => {
          const shortcuts = await getUserShortcuts();
          console.log("📊 User shortcuts:", shortcuts);
        },
      },
      {
        label: "Shortcuts: Retry Injection",
        callback: async () => {
          console.log("🔄 Retrying shortcuts injection...");
          await injectPersonalShortcuts();
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    window.RoamExtensionSuite.register(
      "personal-shortcuts",
      {
        inject: injectPersonalShortcuts,
        debug: debugSidebarStructure,
        version: "1.0.0",
      },
      {
        name: "Personal Shortcuts (Simplified)",
        description: "Basic sidebar shortcuts injection with robust fallbacks",
        version: "1.0.0",
        dependencies: ["foundation-registry"],
      }
    );

    console.log("💡 Try: Cmd+P → 'Debug: Analyze Sidebar Structure'");

    // Store cleanup function
    window._shortcutsCleanup = () => {
      const existing = document.getElementById(
        "roam-extension-personal-shortcuts"
      );
      if (existing) {
        existing.remove();
        console.log("🧹 Shortcuts cleaned up");
      }
    };
  },

  onunload: () => {
    console.log("🔗 Personal Shortcuts unloading...");

    // Custom cleanup
    if (window._shortcutsCleanup) {
      window._shortcutsCleanup();
      delete window._shortcutsCleanup;
    }

    console.log("✅ Personal Shortcuts cleanup complete!");
  },
};
