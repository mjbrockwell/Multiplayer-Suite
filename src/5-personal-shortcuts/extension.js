// ===================================================================
// Extension 5: Personal Shortcuts - Enhanced & Fixed Version
// Focus: Fixed positioning, improved styling, working functionality
// Based on user feedback and Roam University utilities
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

    // Insert BEFORE any existing siblings to position higher
    const parent = starredPages.parentElement;
    const nextSibling = starredPages.nextSibling;

    if (nextSibling) {
      parent.insertBefore(shortcutsElement, nextSibling);
    } else {
      parent.appendChild(shortcutsElement);
    }

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
// 📊 SHORTCUTS DATA MANAGEMENT - Working Implementation
// ===================================================================

/**
 * Add current page to shortcuts using utility library
 */
const addCurrentPageToShortcuts = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    if (!platform) {
      console.error("Platform not available for adding shortcuts");
      return false;
    }

    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getCurrentUser = platform.getUtility("getCurrentUser");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const findDataValue = platform.getUtility("findDataValue");
    const setDataValue = platform.getUtility("setDataValue");

    if (!getCurrentPageTitle || !getCurrentUser) {
      console.error("Required utilities not available");
      return false;
    }

    // Get current page and user
    const currentPage = getCurrentPageTitle();
    const user = getCurrentUser();

    if (!currentPage) {
      console.warn("No current page detected");
      return false;
    }

    console.log(
      `📝 Adding "${currentPage}" to shortcuts for ${user.displayName}`
    );

    // Get user's preferences page
    const preferencesPageTitle = `${user.displayName}/user preferences`;
    let preferencesPageUid = getPageUidByTitle(preferencesPageTitle);

    if (!preferencesPageUid) {
      console.log(`Creating preferences page: ${preferencesPageTitle}`);
      preferencesPageUid = await createPageIfNotExists(preferencesPageTitle);
    }

    if (!preferencesPageUid) {
      console.error("Failed to create/find preferences page");
      return false;
    }

    // Get existing shortcuts
    const existingShortcuts =
      findDataValue(preferencesPageUid, "Personal Shortcuts") || [];
    const shortcutsArray = Array.isArray(existingShortcuts)
      ? existingShortcuts
      : [existingShortcuts].filter(Boolean);

    // Check if already exists
    if (shortcutsArray.includes(currentPage)) {
      console.log(`"${currentPage}" already in shortcuts`);
      return false;
    }

    // Add new shortcut
    const updatedShortcuts = [...shortcutsArray, currentPage];

    // Save updated shortcuts
    const success = await setDataValue(
      preferencesPageUid,
      "Personal Shortcuts",
      updatedShortcuts
    );

    if (success) {
      console.log(`✅ Added "${currentPage}" to shortcuts`);
      // Refresh the UI
      await refreshShortcutsUI();
      return true;
    } else {
      console.error("Failed to save shortcuts");
      return false;
    }
  } catch (error) {
    console.error("Error adding current page to shortcuts:", error);
    return false;
  }
};

/**
 * Remove shortcut from user preferences
 */
const removeFromShortcuts = async (shortcutToRemove) => {
  try {
    const platform = window.RoamExtensionSuite;
    if (!platform) {
      console.error("Platform not available for removing shortcuts");
      return false;
    }

    const getCurrentUser = platform.getUtility("getCurrentUser");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findDataValue = platform.getUtility("findDataValue");
    const setDataValue = platform.getUtility("setDataValue");

    const user = getCurrentUser();
    const preferencesPageTitle = `${user.displayName}/user preferences`;
    const preferencesPageUid = getPageUidByTitle(preferencesPageTitle);

    if (!preferencesPageUid) {
      console.warn("No preferences page found");
      return false;
    }

    // Get existing shortcuts
    const existingShortcuts =
      findDataValue(preferencesPageUid, "Personal Shortcuts") || [];
    const shortcutsArray = Array.isArray(existingShortcuts)
      ? existingShortcuts
      : [existingShortcuts].filter(Boolean);

    // Remove the shortcut
    const updatedShortcuts = shortcutsArray.filter(
      (shortcut) => shortcut !== shortcutToRemove
    );

    // Save updated shortcuts
    const success = await setDataValue(
      preferencesPageUid,
      "Personal Shortcuts",
      updatedShortcuts
    );

    if (success) {
      console.log(`✅ Removed "${shortcutToRemove}" from shortcuts`);
      // Refresh the UI
      await refreshShortcutsUI();
      return true;
    } else {
      console.error("Failed to save updated shortcuts");
      return false;
    }
  } catch (error) {
    console.error("Error removing shortcut:", error);
    return false;
  }
};

/**
 * Refresh the shortcuts UI
 */
const refreshShortcutsUI = async () => {
  console.log("🔄 Refreshing shortcuts UI...");

  // Remove existing element
  const existing = document.getElementById("roam-extension-personal-shortcuts");
  if (existing) {
    existing.remove();
  }

  // Re-inject with updated data
  await injectPersonalShortcuts();
};

// ===================================================================
// 🎨 UI CREATION - Enhanced Styling with Fixes
// ===================================================================

// State for collapse/expand
let isCollapsed = false;

/**
 * Create the shortcuts section element with enhanced styling
 */
const createShortcutsElement = (shortcuts) => {
  const element = document.createElement("div");
  element.className = "roam-extension-personal-shortcuts";
  element.id = "roam-extension-personal-shortcuts";

  // ENHANCED STYLING - Bold border, curved corners, subtle shadow, better positioning
  element.style.cssText = `
    margin: 6px 8px 8px 8px;
    padding: 0;
    background: rgba(255, 255, 255, 0.95);
    border: 1.5px solid #667eea;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
  `;

  // Header with collapse button
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(102, 126, 234, 0.12));
    border-radius: 10px 10px 0 0;
    border-bottom: 1px solid rgba(102, 126, 234, 0.2);
    cursor: pointer;
  `;

  const headerText = document.createElement("div");
  headerText.style.cssText = `
    font-weight: 700;
    color: #4a5568;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  `;
  headerText.textContent = "★ PERSONAL SHORTCUTS";

  const collapseButton = document.createElement("button");
  collapseButton.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #667eea;
    padding: 4px 6px;
    border-radius: 4px;
    transition: all 0.15s ease;
  `;
  collapseButton.innerHTML = isCollapsed ? "🔽" : "🔼";

  header.appendChild(headerText);
  header.appendChild(collapseButton);

  // Content container (shortcuts list + controls)
  const content = document.createElement("div");
  content.className = "shortcuts-content";
  content.style.cssText = `
    padding: 10px;
    display: ${isCollapsed ? "none" : "block"};
  `;

  // DEMURE Add Current Page Button - Pastel with Bold Border
  const addCurrentButton = document.createElement("button");
  addCurrentButton.style.cssText = `
    width: 100%;
    padding: 8px 10px;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
    color: #4a5568;
    border: 2px solid #667eea;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  `;
  addCurrentButton.textContent = "+ Add Current Page";

  addCurrentButton.addEventListener("mouseenter", () => {
    addCurrentButton.style.background =
      "linear-gradient(135deg, #e8f0fe, #dbeafe)";
    addCurrentButton.style.transform = "translateY(-1px)";
    addCurrentButton.style.boxShadow = "0 2px 4px rgba(102, 126, 234, 0.2)";
  });

  addCurrentButton.addEventListener("mouseleave", () => {
    addCurrentButton.style.background =
      "linear-gradient(135deg, #f0f4ff, #e8f0fe)";
    addCurrentButton.style.transform = "translateY(0)";
    addCurrentButton.style.boxShadow = "none";
  });

  addCurrentButton.addEventListener("click", async () => {
    addCurrentButton.disabled = true;
    addCurrentButton.textContent = "Adding...";

    const success = await addCurrentPageToShortcuts();

    if (success) {
      addCurrentButton.textContent = "Added! ✓";
      setTimeout(() => {
        if (document.getElementById("roam-extension-personal-shortcuts")) {
          addCurrentButton.textContent = "+ Add Current Page";
          addCurrentButton.disabled = false;
        }
      }, 2000);
    } else {
      addCurrentButton.textContent = "Already added or failed";
      setTimeout(() => {
        if (document.getElementById("roam-extension-personal-shortcuts")) {
          addCurrentButton.textContent = "+ Add Current Page";
          addCurrentButton.disabled = false;
        }
      }, 2000);
    }
  });

  // Shortcuts list
  const list = document.createElement("div");
  list.className = "shortcuts-list";
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 3px;
  `;

  if (shortcuts.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.style.cssText = `
      color: #8a9ba8;
      font-size: 12px;
      font-style: italic;
      padding: 12px;
      text-align: center;
      background: rgba(102, 126, 234, 0.03);
      border-radius: 6px;
    `;
    emptyMessage.textContent = "No shortcuts configured";
    list.appendChild(emptyMessage);
  } else {
    shortcuts.forEach((shortcut) => {
      const item = document.createElement("div");
      item.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        margin: 1px 0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s ease;
        color: #2d3748;
        background: rgba(102, 126, 234, 0.02);
        border: 1px solid rgba(102, 126, 234, 0.1);
      `;

      const shortcutText = document.createElement("span");
      shortcutText.textContent = shortcut;
      shortcutText.style.cssText = `
        flex: 1;
        cursor: pointer;
      `;

      const removeButton = document.createElement("button");
      removeButton.innerHTML = "×";
      removeButton.style.cssText = `
        background: none;
        border: none;
        color: #e53e3e;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        padding: 0 6px;
        border-radius: 4px;
        opacity: 0.6;
        transition: all 0.15s ease;
      `;

      removeButton.addEventListener("mouseenter", () => {
        removeButton.style.opacity = "1";
        removeButton.style.background = "rgba(229, 62, 62, 0.1)";
        removeButton.style.transform = "scale(1.1)";
      });

      removeButton.addEventListener("mouseleave", () => {
        removeButton.style.opacity = "0.6";
        removeButton.style.background = "none";
        removeButton.style.transform = "scale(1)";
      });

      removeButton.addEventListener("click", async (e) => {
        e.stopPropagation(); // Prevent navigation
        removeButton.disabled = true;
        removeButton.innerHTML = "⟳";
        await removeFromShortcuts(shortcut);
      });

      // Enhanced hover effect for the whole item
      item.addEventListener("mouseenter", () => {
        item.style.background = "rgba(102, 126, 234, 0.08)";
        item.style.transform = "translateX(2px)";
        item.style.borderColor = "rgba(102, 126, 234, 0.3)";
      });

      item.addEventListener("mouseleave", () => {
        item.style.background = "rgba(102, 126, 234, 0.02)";
        item.style.transform = "translateX(0)";
        item.style.borderColor = "rgba(102, 126, 234, 0.1)";
      });

      // Click to navigate (only on the text, not the remove button)
      shortcutText.addEventListener("click", () => {
        navigateToPage(shortcut);
      });

      item.appendChild(shortcutText);
      item.appendChild(removeButton);
      list.appendChild(item);
    });
  }

  // Collapse/expand functionality
  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;
    content.style.display = isCollapsed ? "none" : "block";
    collapseButton.innerHTML = isCollapsed ? "🔽" : "🔼";
  };

  header.addEventListener("click", toggleCollapse);
  collapseButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCollapse();
  });

  content.appendChild(addCurrentButton);
  content.appendChild(list);

  element.appendChild(header);
  element.appendChild(content);

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
    console.log("🔗 Personal Shortcuts (Enhanced & Fixed) starting...");

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
      {
        label: "Shortcuts: Add Current Page",
        callback: async () => {
          const success = await addCurrentPageToShortcuts();
          if (success) {
            console.log("✅ Current page added to shortcuts");
          } else {
            console.log("❌ Failed to add current page or already exists");
          }
        },
      },
      {
        label: "Shortcuts: Refresh UI",
        callback: async () => {
          await refreshShortcutsUI();
          console.log("🔄 Shortcuts UI refreshed");
        },
      },
      {
        label: "Shortcuts: Show All Data",
        callback: async () => {
          console.group("📊 Complete Shortcuts Data");
          const shortcuts = await getUserShortcuts();
          console.log("Current shortcuts:", shortcuts);

          const platform = window.RoamExtensionSuite;
          const getCurrentUser = platform.getUtility("getCurrentUser");
          const getCurrentPageTitle = platform.getUtility(
            "getCurrentPageTitle"
          );

          if (getCurrentUser && getCurrentPageTitle) {
            const user = getCurrentUser();
            const currentPage = getCurrentPageTitle();
            console.log("Current user:", user.displayName);
            console.log("Current page:", currentPage);
          }
          console.groupEnd();
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
        getUserShortcuts: getUserShortcuts,
        addCurrentPageToShortcuts: addCurrentPageToShortcuts,
        removeFromShortcuts: removeFromShortcuts,
        refreshUI: refreshShortcutsUI,
        version: "1.0.0",
      },
      {
        name: "Personal Shortcuts (Enhanced & Fixed)",
        description:
          "Enhanced sidebar shortcuts with working add/remove functionality and improved styling",
        version: "1.0.0",
        dependencies: ["foundation-registry", "utility-library"],
      }
    );

    console.log("💡 Try: Cmd+P → 'Debug: Analyze Sidebar Structure'");
    console.log("💡 Try: Cmd+P → 'Shortcuts: Add Current Page'");

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
