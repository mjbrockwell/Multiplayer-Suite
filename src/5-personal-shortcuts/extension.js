// ===================================================================
// Extension 5: Personal Shortcuts Widget - ORIGINAL DESIGN RESTORED
// Fixed: Reads actual user preferences + matches original UI exactly
// Features: [x] remove buttons, Add Current Page button, original styling
// Dependencies: Extensions 1.5, 2 (with robust checking)
// ===================================================================

(() => {
  "use strict";

  // ===================================================================
  // 🚨 ENHANCED DEPENDENCY CHECK WITH DIAGNOSTICS
  // ===================================================================

  console.log("🔍 Extension 5: Checking dependencies...");

  if (!window.RoamExtensionSuite) {
    console.error(
      "❌ Extension 5: RoamExtensionSuite not found! Please load Extension 1 first."
    );
    return;
  }

  const platform = window.RoamExtensionSuite;

  // Check for individual utilities we need
  const requiredUtilities = [
    "getCurrentUsername",
    "getUserPreference",
    "setUserPreference",
    "getPageUidByTitle",
  ];

  const missingUtilities = [];
  for (const util of requiredUtilities) {
    if (!platform.getUtility || !platform.getUtility(util)) {
      missingUtilities.push(util);
    }
  }

  if (missingUtilities.length > 0) {
    console.error(
      `❌ Extension 5: Missing required utilities: ${missingUtilities.join(
        ", "
      )}`
    );
    console.log(
      "💡 Extension 5: Make sure Extension 1.5 and Extension 2 are loaded first"
    );
    return;
  }

  console.log("✅ Extension 5: All required utilities found!");

  // State for collapse/expand
  let isCollapsed = false;

  // ===================================================================
  // 🎯 CORE DATA FUNCTIONS - FIXED TO READ ACTUAL PREFERENCES
  // ===================================================================

  /**
   * 🔧 FIXED: Get user shortcuts with ACTUAL preference reading
   */
  const getUserShortcuts = async () => {
    try {
      const getCurrentUsername = platform.getUtility("getCurrentUsername");
      const getUserPreference = platform.getUtility("getUserPreference");

      const currentUser = getCurrentUsername();
      if (!currentUser) {
        console.warn("❌ No authenticated user found for shortcuts");
        return ["Daily Notes", "Chat Room"]; // Fallback
      }

      // 🔥 BUG FIX: Read ACTUAL user preferences instead of defaults
      const personalShortcutsValue = await getUserPreference(
        currentUser,
        "Personal Shortcuts",
        ["Daily Notes", "Chat Room"] // Only use as fallback
      );

      // Parse the shortcuts (handle both string and array formats)
      let shortcuts;
      if (typeof personalShortcutsValue === "string") {
        // Parse from string format: "(Matt Brockwell)(Matt Brockwell/user preferences)"
        shortcuts = personalShortcutsValue
          .split(/[()]+/)
          .filter((s) => s.trim())
          .map((s) => s.trim());
      } else if (Array.isArray(personalShortcutsValue)) {
        shortcuts = personalShortcutsValue;
      } else {
        console.warn("⚠️ Invalid shortcuts format, using defaults");
        shortcuts = ["Daily Notes", "Chat Room"];
      }

      console.log(
        `📋 FIXED: Personal shortcuts for ${currentUser}:`,
        shortcuts
      );
      return shortcuts;
    } catch (error) {
      console.error("❌ Error getting user shortcuts:", error);
      return ["Daily Notes", "Chat Room"]; // Fallback
    }
  };

  /**
   * Add current page to shortcuts
   */
  const addCurrentPageToShortcuts = async () => {
    try {
      const getCurrentUsername = platform.getUtility("getCurrentUsername");
      const getUserPreference = platform.getUtility("getUserPreference");
      const setUserPreference = platform.getUtility("setUserPreference");

      const currentUser = getCurrentUsername();
      if (!currentUser) {
        console.error("No authenticated user found");
        return false;
      }

      // Get current page title
      const currentPage = document.title.replace(" - Roam", "").trim();
      if (!currentPage) {
        console.error("Could not determine current page");
        return false;
      }

      console.log(`📊 Adding "${currentPage}" to shortcuts for ${currentUser}`);

      // Get existing shortcuts
      const existingShortcuts = await getUserPreference(
        currentUser,
        "Personal Shortcuts",
        []
      );
      const shortcutsArray = Array.isArray(existingShortcuts)
        ? existingShortcuts
        : [existingShortcuts].filter(Boolean);

      console.log("📊 Existing shortcuts before adding:", shortcutsArray);

      // Check if already exists
      if (shortcutsArray.includes(currentPage)) {
        console.log(`"${currentPage}" already in shortcuts`);
        return false;
      }

      // Add new shortcut
      const updatedShortcuts = [...shortcutsArray, currentPage];
      console.log("📊 Updated shortcuts to save:", updatedShortcuts);

      // Save updated shortcuts
      const success = await setUserPreference(
        currentUser,
        "Personal Shortcuts",
        updatedShortcuts
      );

      if (success) {
        console.log(`✅ Added "${currentPage}" to shortcuts`);

        // Refresh UI after a delay
        setTimeout(async () => {
          await refreshShortcutsUI();
        }, 1000);

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
      const getCurrentUsername = platform.getUtility("getCurrentUsername");
      const getUserPreference = platform.getUtility("getUserPreference");
      const setUserPreference = platform.getUtility("setUserPreference");

      const currentUser = getCurrentUsername();
      if (!currentUser) {
        console.error("No authenticated user found");
        return false;
      }

      console.log(
        `📊 Removing "${shortcutToRemove}" from shortcuts for ${currentUser}`
      );

      // Get existing shortcuts
      const existingShortcuts = await getUserPreference(
        currentUser,
        "Personal Shortcuts",
        []
      );
      const shortcutsArray = Array.isArray(existingShortcuts)
        ? existingShortcuts
        : [existingShortcuts].filter(Boolean);

      console.log("📊 Existing shortcuts before removal:", shortcutsArray);

      // Remove the shortcut
      const updatedShortcuts = shortcutsArray.filter(
        (s) => s !== shortcutToRemove
      );
      console.log("📊 Updated shortcuts after removal:", updatedShortcuts);

      // Save updated shortcuts
      const success = await setUserPreference(
        currentUser,
        "Personal Shortcuts",
        updatedShortcuts
      );

      if (success) {
        console.log(`✅ Removed "${shortcutToRemove}" from shortcuts`);

        // Refresh UI after a delay
        setTimeout(async () => {
          await refreshShortcutsUI();
        }, 1000);

        return true;
      } else {
        console.error("Failed to save shortcuts after removal");
        return false;
      }
    } catch (error) {
      console.error("Error removing shortcut:", error);
      return false;
    }
  };

  // ===================================================================
  // 🎨 ORIGINAL UI CREATION - EXACT ORIGINAL STYLING RESTORED
  // ===================================================================

  /**
   * Add custom scrollbar styles for better visual integration
   */
  const addScrollbarStyles = () => {
    const styleId = "personal-shortcuts-scrollbar-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .roam-extension-personal-shortcuts .shortcuts-content > div::-webkit-scrollbar {
        width: 6px;
      }
      
      .roam-extension-personal-shortcuts .shortcuts-content > div::-webkit-scrollbar-track {
        background: rgba(102, 126, 234, 0.05);
        border-radius: 3px;
      }
      
      .roam-extension-personal-shortcuts .shortcuts-content > div::-webkit-scrollbar-thumb {
        background: rgba(102, 126, 234, 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      
      .roam-extension-personal-shortcuts .shortcuts-content > div::-webkit-scrollbar-thumb:hover {
        background: rgba(102, 126, 234, 0.5);
      }
      
      /* Ensure proper sizing for all children */
      .roam-extension-personal-shortcuts * {
        box-sizing: border-box;
      }
      
      /* Prevent any text overflow issues */
      .roam-extension-personal-shortcuts .shortcuts-list > div {
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);

    // Register for cleanup
    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push(style);
    }
  };

  /**
   * Create the shortcuts section element with ORIGINAL styling
   */
  const createShortcutsElement = (shortcuts) => {
    const element = document.createElement("div");
    element.className = "roam-extension-personal-shortcuts";
    element.id = "roam-extension-personal-shortcuts";

    // ORIGINAL: Container sizing with exact original styling
    element.style.cssText = `
      margin: 6px 0px 8px 0px;
      padding: 0;
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid #667eea;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 100%;
      height: auto;
      max-height: 400px;
      min-height: fit-content;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    `;

    // Check if collapsed from localStorage
    isCollapsed = localStorage.getItem("roam-shortcuts-collapsed") === "true";

    // ORIGINAL: Header with collapse button
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
      flex-shrink: 0;
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

    // ORIGINAL: Content container with proper flex sizing and overflow
    const content = document.createElement("div");
    content.className = "shortcuts-content";
    content.style.cssText = `
      display: ${isCollapsed ? "none" : "flex"};
      flex-direction: column;
      flex: 1;
      min-height: 0;
      max-height: 340px;
      overflow: hidden;
      box-sizing: border-box;
    `;

    // ORIGINAL: Scrollable container for the actual content
    const scrollContainer = document.createElement("div");
    scrollContainer.style.cssText = `
      padding: 10px;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 320px;
      box-sizing: border-box;
    `;

    // ORIGINAL: Add Current Page Button
    const addCurrentButton = document.createElement("button");
    addCurrentButton.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      margin-top: 10px;
      background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
      color: #4a5568;
      border: 2px solid #667eea;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
      flex-shrink: 0;
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
        addCurrentButton.textContent = "Added ✓";
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

    // ORIGINAL: Shortcuts list with proper sizing
    const list = document.createElement("div");
    list.className = "shortcuts-list";
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 100%;
      box-sizing: border-box;
      flex: 1;
      min-height: fit-content;
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
        flex-shrink: 0;
      `;
      emptyMessage.textContent = "No shortcuts configured";
      list.appendChild(emptyMessage);
    } else {
      console.log(
        `🎨 Creating UI for ${shortcuts.length} shortcuts:`,
        shortcuts
      );

      shortcuts.forEach((shortcut, index) => {
        console.log(`🎨 Creating item ${index + 1}: "${shortcut}"`);

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
          flex-shrink: 0;
          min-height: 36px;
          box-sizing: border-box;
        `;

        const shortcutText = document.createElement("span");
        shortcutText.textContent = shortcut;
        shortcutText.style.cssText = `
          flex: 1;
          cursor: pointer;
          word-break: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
        `;

        // ORIGINAL: Remove button [x] functionality!
        const removeButton = document.createElement("span");
        removeButton.innerHTML = "×";
        removeButton.style.cssText = `
          margin-left: 8px;
          color: #999;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          transition: color 0.15s ease;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        `;

        // Remove button hover effects
        removeButton.addEventListener("mouseenter", () => {
          removeButton.style.color = "#ff4444";
          removeButton.style.background = "rgba(255, 68, 68, 0.1)";
        });

        removeButton.addEventListener("mouseleave", () => {
          removeButton.style.color = "#999";
          removeButton.style.background = "transparent";
        });

        // Remove button click handler
        removeButton.addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevent navigation
          console.log(`🗑️ Removing shortcut: ${shortcut}`);

          removeButton.style.color = "#ff6666";
          removeButton.innerHTML = "⟳";

          const success = await removeFromShortcuts(shortcut);

          if (success) {
            console.log(`✅ Successfully removed: ${shortcut}`);
          } else {
            console.error(`❌ Failed to remove: ${shortcut}`);
            removeButton.style.color = "#999";
            removeButton.innerHTML = "×";
          }
        });

        // Navigation click handler for the text
        shortcutText.addEventListener("click", () => navigateToPage(shortcut));

        // Item hover effects
        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(102, 126, 234, 0.08)";
          item.style.borderColor = "rgba(102, 126, 234, 0.2)";
          item.style.transform = "translateX(2px)";
        });

        item.addEventListener("mouseleave", () => {
          item.style.background = "rgba(102, 126, 234, 0.02)";
          item.style.borderColor = "rgba(102, 126, 234, 0.1)";
          item.style.transform = "translateX(0)";
        });

        item.appendChild(shortcutText);
        item.appendChild(removeButton);
        list.appendChild(item);
      });
    }

    // Toggle collapse functionality
    const toggleCollapse = () => {
      if (content.style.display === "none") {
        content.style.display = "flex";
        collapseButton.innerHTML = "🔼";
        element.style.maxHeight = "400px";
        isCollapsed = false;
        localStorage.setItem("roam-shortcuts-collapsed", "false");
      } else {
        content.style.display = "none";
        collapseButton.innerHTML = "🔽";
        element.style.maxHeight = "auto";
        isCollapsed = true;
        localStorage.setItem("roam-shortcuts-collapsed", "true");
      }
    };

    header.addEventListener("click", toggleCollapse);
    collapseButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCollapse();
    });

    // Build the structure
    scrollContainer.appendChild(list);
    scrollContainer.appendChild(addCurrentButton);
    content.appendChild(scrollContainer);
    element.appendChild(header);
    element.appendChild(content);

    return element;
  };

  // ===================================================================
  // 🧭 NAVIGATION - Simple Page Navigation
  // ===================================================================

  const navigateToPage = async (pageName) => {
    try {
      console.log(`🧭 Navigating to: ${pageName}`);

      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      let pageUid = getPageUidByTitle(pageName);

      if (!pageUid) {
        console.log(`Page "${pageName}" doesn't exist, creating...`);
      }

      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title: pageName } });
      console.log(`✅ Successfully navigated to: ${pageName}`);
    } catch (error) {
      console.error(`Navigation error for "${pageName}":`, error);
    }
  };

  // ===================================================================
  // 📍 ORIGINAL INJECTION LOGIC - ABOVE ROAM RESEARCH LOGO
  // ===================================================================

  /**
   * Inject with all fallback methods to find the correct location
   */
  const injectWithAllFallbacks = (shortcutsElement) => {
    // Method 1: Look for starred pages container (primary location)
    let targetContainer = document.querySelector("div.starred-pages");
    if (targetContainer && targetContainer.parentElement) {
      targetContainer.parentElement.insertBefore(
        shortcutsElement,
        targetContainer.nextSibling
      );
      return { success: true, method: "starred-pages sibling injection" };
    }

    // Method 2: Look for sidebar container
    targetContainer = document.querySelector(
      ".roam-sidebar-container.noselect"
    );
    if (targetContainer) {
      targetContainer.appendChild(shortcutsElement);
      return { success: true, method: "sidebar container append" };
    }

    // Method 3: Look for left sidebar by test id
    targetContainer = document.querySelector(
      '[data-testid="roam-left-sidebar"]'
    );
    if (targetContainer) {
      targetContainer.appendChild(shortcutsElement);
      return { success: true, method: "test-id left sidebar" };
    }

    // Method 4: General left sidebar
    targetContainer = document.querySelector('[data-testid="left-sidebar"]');
    if (targetContainer) {
      targetContainer.appendChild(shortcutsElement);
      return { success: true, method: "generic left sidebar" };
    }

    // Method 5: Fallback to body
    document.body.appendChild(shortcutsElement);
    shortcutsElement.style.position = "fixed";
    shortcutsElement.style.bottom = "20px";
    shortcutsElement.style.left = "20px";
    shortcutsElement.style.zIndex = "9999";
    return { success: true, method: "body fixed position fallback" };
  };

  // ===================================================================
  // 🔄 REFRESH AND MAIN INJECTION
  // ===================================================================

  const refreshShortcutsUI = async () => {
    console.log("🔄 Refreshing shortcuts UI...");
    await injectPersonalShortcuts();
  };

  /**
   * Main function to inject shortcuts into sidebar with proper styling
   */
  const injectPersonalShortcuts = async () => {
    console.log("🔗 Starting Personal Shortcuts injection...");

    // Add scrollbar styles first
    addScrollbarStyles();

    // Remove any existing shortcuts
    const existing = document.getElementById(
      "roam-extension-personal-shortcuts"
    );
    if (existing) {
      existing.remove();
      console.log("🧹 Removed existing shortcuts element");
    }

    // Get user shortcuts with retry logic
    const shortcuts = await getUserShortcuts();
    console.log(`📊 Found ${shortcuts.length} shortcuts:`, shortcuts);

    // Create shortcuts element with original styling
    const shortcutsElement = createShortcutsElement(shortcuts);

    // Inject with fallbacks - ORIGINAL LOCATION LOGIC
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
  // 🎯 EXTENSION LIFECYCLE
  // ===================================================================

  const extension5 = {
    onload: async () => {
      console.log("🎯 Extension 5: Personal Shortcuts Widget loading...");

      try {
        // Wait for Roam to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create the widget with original UI
        await injectPersonalShortcuts();

        // Register utilities
        const personalShortcutsUtilities = {
          injectPersonalShortcuts,
          getUserShortcuts,
          addCurrentPageToShortcuts,
          removeFromShortcuts,
          refreshShortcutsUI,
          navigateToPage,
        };

        Object.entries(personalShortcutsUtilities).forEach(
          ([name, utility]) => {
            platform.registerUtility(name, utility);
          }
        );

        // Register commands
        const commands = [
          {
            label: "Shortcuts: Refresh Widget",
            callback: refreshShortcutsUI,
          },
          {
            label: "Shortcuts: Add Current Page",
            callback: addCurrentPageToShortcuts,
          },
        ];

        commands.forEach((cmd) => {
          window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
          if (window._extensionRegistry) {
            window._extensionRegistry.commands.push(cmd.label);
          }
        });

        // Register self with platform
        platform.register(
          "personal-shortcuts",
          {
            utilities: personalShortcutsUtilities,
            version: "1.0.3",
          },
          {
            name: "Extension 5: Personal Shortcuts Widget (Original Design)",
            description:
              "Complete shortcuts widget with original UI design restored",
            version: "1.0.3",
            dependencies: ["utility-library", "user-authentication"],
          }
        );

        console.log(
          "✅ Extension 5: Personal Shortcuts Widget loaded successfully!"
        );
        console.log(
          "💡 Try: Cmd+P → 'Shortcuts: Add Current Page' to add current page"
        );
        console.log("💡 Click [×] next to any shortcut to remove it");

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
      } catch (error) {
        console.error("❌ Extension 5 failed to load:", error);
      }
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

  // ===================================================================
  // 🚀 AUTO-START
  // ===================================================================

  // Auto-load the extension
  extension5.onload();

  // Export for manual control
  window.Extension5 = extension5;

  console.log(
    "🎯 Extension 5: Personal Shortcuts Widget initialized with ORIGINAL design restored!"
  );
})();
