// ===================================================================
// Extension 5: Personal Shortcuts Widget - Production Ready
// Clean, efficient shortcuts widget with original design
// Features: Personal shortcuts management, add/remove functionality
// Dependencies: Extensions 1.5, 2
// ===================================================================

(() => {
  "use strict";

  // ===================================================================
  // 🔍 DEPENDENCY CHECKING
  // ===================================================================

  if (!window.RoamExtensionSuite) {
    console.error(
      "❌ Extension 5: RoamExtensionSuite not found! Please load Extension 1 first."
    );
    return;
  }

  const platform = window.RoamExtensionSuite;

  // Check for required utilities
  const requiredUtilities = ["getCurrentUsername", "getPageUidByTitle"];
  const missingUtilities = [];

  for (const util of requiredUtilities) {
    if (!platform.getUtility || !platform.getUtility(util)) {
      missingUtilities.push(util);
    }
  }

  if (missingUtilities.length > 0) {
    console.error(
      `❌ Extension 5: Missing utilities: ${missingUtilities.join(", ")}`
    );
    return;
  }

  // ===================================================================
  // 🎯 STATE MANAGEMENT
  // ===================================================================

  let isCollapsed = localStorage.getItem("roam-shortcuts-collapsed") === "true";

  // ===================================================================
  // 🔧 USER DETECTION
  // ===================================================================

  const getCurrentUser = async () => {
    try {
      const getCurrentUsername = platform.getUtility("getCurrentUsername");
      if (getCurrentUsername) {
        const result = await getCurrentUsername();
        return typeof result === "string" ? result : null;
      }

      // Fallback to Roam API
      if (window.roamAlphaAPI?.data?.user) {
        const user = window.roamAlphaAPI.data.user;
        return user.displayName || user.email || user.uid;
      }

      return null;
    } catch (error) {
      console.error("❌ Extension 5: Error getting current user:", error);
      return null;
    }
  };

  // ===================================================================
  // 🔧 SHORTCUTS DATA FUNCTIONS
  // ===================================================================

  const getUserShortcuts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return ["Daily Notes", "Chat Room"];
      }

      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      if (!getPageUidByTitle) {
        return ["Daily Notes", "Chat Room"];
      }

      const pageUid = getPageUidByTitle(`${currentUser}/user preferences`);
      if (!pageUid) {
        return ["Daily Notes", "Chat Room"];
      }

      // Find Personal Shortcuts header block
      const headerQuery = `[:find ?block-uid :where 
                           [?page :block/uid "${pageUid}"]
                           [?page :block/children ?child]
                           [?child :block/string ?content]
                           [?child :block/uid ?block-uid]
                           [(clojure.string/includes? ?content "Personal Shortcuts")]]`;

      const headerResults = await window.roamAlphaAPI.data.q(headerQuery);

      if (headerResults && headerResults.length > 0) {
        const shortcutsBlockUid = headerResults[0][0];

        // Get child blocks (the shortcuts)
        const childQuery = `[:find ?content :where 
                           [?parent :block/uid "${shortcutsBlockUid}"]
                           [?parent :block/children ?child]
                           [?child :block/string ?content]]`;

        const childResults = await window.roamAlphaAPI.data.q(childQuery);

        if (childResults && childResults.length > 0) {
          const shortcuts = childResults
            .map(([content]) => content)
            .filter((s) => s && s.trim() && s.length > 0);

          return shortcuts.length > 0
            ? shortcuts
            : ["Daily Notes", "Chat Room"];
        }
      }

      return ["Daily Notes", "Chat Room"];
    } catch (error) {
      console.error("❌ Extension 5: Error getting shortcuts:", error);
      return ["Daily Notes", "Chat Room"];
    }
  };

  const addCurrentPageToShortcuts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return false;

      const currentPage = document.title.replace(" - Roam", "").trim();
      if (!currentPage) return false;

      // Check if already exists
      const existingShortcuts = await getUserShortcuts();
      if (existingShortcuts.includes(currentPage)) return false;

      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      const pageUid = getPageUidByTitle(`${currentUser}/user preferences`);
      if (!pageUid) return false;

      // Find Personal Shortcuts header block
      const headerQuery = `[:find ?block-uid :where 
                           [?page :block/uid "${pageUid}"]
                           [?page :block/children ?child]
                           [?child :block/string ?content]
                           [?child :block/uid ?block-uid]
                           [(clojure.string/includes? ?content "Personal Shortcuts")]]`;

      const headerResults = await window.roamAlphaAPI.data.q(headerQuery);

      if (headerResults && headerResults.length > 0) {
        const shortcutsBlockUid = headerResults[0][0];

        await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": shortcutsBlockUid, order: "last" },
          block: { string: currentPage },
        });

        setTimeout(() => refreshShortcutsUI(), 1000);
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Extension 5: Error adding shortcut:", error);
      return false;
    }
  };

  const removeFromShortcuts = async (shortcutToRemove) => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return false;

      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      const pageUid = getPageUidByTitle(`${currentUser}/user preferences`);
      if (!pageUid) return false;

      // Find Personal Shortcuts header block
      const headerQuery = `[:find ?block-uid :where 
                           [?page :block/uid "${pageUid}"]
                           [?page :block/children ?child]
                           [?child :block/string ?content]
                           [?child :block/uid ?block-uid]
                           [(clojure.string/includes? ?content "Personal Shortcuts")]]`;

      const headerResults = await window.roamAlphaAPI.data.q(headerQuery);

      if (headerResults && headerResults.length > 0) {
        const shortcutsBlockUid = headerResults[0][0];

        // Find the specific shortcut block to remove
        const shortcutQuery = `[:find ?child-uid :where 
                               [?parent :block/uid "${shortcutsBlockUid}"]
                               [?parent :block/children ?child]
                               [?child :block/string "${shortcutToRemove}"]
                               [?child :block/uid ?child-uid]]`;

        const shortcutResults = await window.roamAlphaAPI.data.q(shortcutQuery);

        if (shortcutResults && shortcutResults.length > 0) {
          const shortcutBlockUid = shortcutResults[0][0];

          await window.roamAlphaAPI.deleteBlock({
            block: { uid: shortcutBlockUid },
          });

          setTimeout(() => refreshShortcutsUI(), 1000);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("❌ Extension 5: Error removing shortcut:", error);
      return false;
    }
  };

  // ===================================================================
  // 🎨 UI CREATION
  // ===================================================================

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
      
      .roam-extension-personal-shortcuts * {
        box-sizing: border-box;
      }
      
      .roam-extension-personal-shortcuts .shortcuts-list > div {
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);

    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push(style);
    }
  };

  const createShortcutsElement = (shortcuts) => {
    const element = document.createElement("div");
    element.className = "roam-extension-personal-shortcuts";
    element.id = "roam-extension-personal-shortcuts";

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

    // Content container
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

    const scrollContainer = document.createElement("div");
    scrollContainer.style.cssText = `
      padding: 10px;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 320px;
      box-sizing: border-box;
    `;

    // Add Current Page Button
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

    // Shortcuts list
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
      shortcuts.forEach((shortcut, index) => {
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

        removeButton.addEventListener("mouseenter", () => {
          removeButton.style.color = "#ff4444";
          removeButton.style.background = "rgba(255, 68, 68, 0.1)";
        });

        removeButton.addEventListener("mouseleave", () => {
          removeButton.style.color = "#999";
          removeButton.style.background = "transparent";
        });

        removeButton.addEventListener("click", async (e) => {
          e.stopPropagation();

          removeButton.style.color = "#ff6666";
          removeButton.innerHTML = "⟳";

          const success = await removeFromShortcuts(shortcut);

          if (!success) {
            removeButton.style.color = "#999";
            removeButton.innerHTML = "×";
          }
        });

        shortcutText.addEventListener("click", () => navigateToPage(shortcut));

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
  // 🧭 NAVIGATION
  // ===================================================================

  const navigateToPage = async (pageName) => {
    try {
      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title: pageName } });
    } catch (error) {
      console.error(
        `❌ Extension 5: Navigation error for "${pageName}":`,
        error
      );
    }
  };

  // ===================================================================
  // 📍 INJECTION LOGIC
  // ===================================================================

  const injectWithFallbacks = (shortcutsElement) => {
    const methods = [
      {
        name: "starred-pages sibling",
        attempt: () => {
          const target = document.querySelector("div.starred-pages");
          if (target && target.parentElement) {
            target.parentElement.insertBefore(
              shortcutsElement,
              target.nextSibling
            );
            return true;
          }
          return false;
        },
      },
      {
        name: "sidebar container append",
        attempt: () => {
          const target = document.querySelector(
            ".roam-sidebar-container.noselect"
          );
          if (target) {
            target.appendChild(shortcutsElement);
            return true;
          }
          return false;
        },
      },
      {
        name: "left sidebar testid",
        attempt: () => {
          const target = document.querySelector(
            '[data-testid="roam-left-sidebar"]'
          );
          if (target) {
            target.appendChild(shortcutsElement);
            return true;
          }
          return false;
        },
      },
      {
        name: "generic left sidebar",
        attempt: () => {
          const target = document.querySelector('[data-testid="left-sidebar"]');
          if (target) {
            target.appendChild(shortcutsElement);
            return true;
          }
          return false;
        },
      },
      {
        name: "body fixed position fallback",
        attempt: () => {
          document.body.appendChild(shortcutsElement);
          shortcutsElement.style.position = "fixed";
          shortcutsElement.style.bottom = "20px";
          shortcutsElement.style.left = "20px";
          shortcutsElement.style.zIndex = "9999";
          return true;
        },
      },
    ];

    for (const method of methods) {
      try {
        if (method.attempt()) {
          return { success: true, method: method.name };
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false, method: "all methods failed" };
  };

  // ===================================================================
  // 🔄 MAIN FUNCTIONS
  // ===================================================================

  const refreshShortcutsUI = async () => {
    await injectPersonalShortcuts();
  };

  const injectPersonalShortcuts = async () => {
    try {
      addScrollbarStyles();

      const existing = document.getElementById(
        "roam-extension-personal-shortcuts"
      );
      if (existing) {
        existing.remove();
      }

      const shortcuts = await getUserShortcuts();
      const shortcutsElement = createShortcutsElement(shortcuts);
      const result = injectWithFallbacks(shortcutsElement);

      if (result.success) {
        if (window._extensionRegistry) {
          window._extensionRegistry.elements.push(shortcutsElement);
        }
        return shortcutsElement;
      } else {
        console.error("❌ Extension 5: Failed to inject shortcuts widget");
        return null;
      }
    } catch (error) {
      console.error("❌ Extension 5: Error injecting shortcuts:", error);
      return null;
    }
  };

  // ===================================================================
  // 🎯 EXTENSION LIFECYCLE
  // ===================================================================

  const extension5 = {
    onload: async () => {
      try {
        // Wait for Roam to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create the widget
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

        // Register with platform
        platform.register(
          "personal-shortcuts",
          {
            utilities: personalShortcutsUtilities,
            version: "1.0.0",
          },
          {
            name: "Extension 5: Personal Shortcuts Widget",
            description: "Clean shortcuts widget with add/remove functionality",
            version: "1.0.0",
            dependencies: ["utility-library"],
          }
        );

        // Store cleanup function
        window._shortcutsCleanup = () => {
          const existing = document.getElementById(
            "roam-extension-personal-shortcuts"
          );
          if (existing) {
            existing.remove();
          }
        };

        console.log("✅ Extension 5: Personal Shortcuts loaded successfully!");
      } catch (error) {
        console.error("❌ Extension 5: Failed to load:", error);
      }
    },

    onunload: () => {
      if (window._shortcutsCleanup) {
        window._shortcutsCleanup();
        delete window._shortcutsCleanup;
      }
    },
  };

  // ===================================================================
  // 🚀 AUTO-START
  // ===================================================================

  extension5.onload();

  // Export for manual control
  window.Extension5 = extension5;

  console.log("🎯 Extension 5: Personal Shortcuts initialized successfully!");
})();
