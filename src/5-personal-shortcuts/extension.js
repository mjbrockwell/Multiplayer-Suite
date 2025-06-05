// ===================================================================
// Extension 5: Personal Shortcuts - Professional Navigation Interface
// Based on David Vargas's enterprise-grade patterns from Roam University
// Features: Keyboard navigation, search, sidebar integration
// ===================================================================

// ===================================================================
// 🎯 SHORTCUTS DATA MANAGEMENT - Smart Preference Integration
// ===================================================================

/**
 * Get current user's personal shortcuts with caching
 */
let shortcutsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getUserShortcuts = async () => {
  // Smart caching to avoid repeated preference reads
  if (shortcutsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return shortcutsCache;
  }

  try {
    const platform = window.RoamExtensionSuite;
    const getCurrentUser = platform.getUtility("getCurrentUser");
    const getUserPreference = platform.getUtility("getUserPreference");
    const parsePersonalShortcuts = platform.getUtility(
      "parsePersonalShortcuts"
    );

    const user = getCurrentUser();
    const shortcutsString = await getUserPreference(
      user.displayName,
      "Personal Shortcuts",
      "(Daily Notes)(Chat Room)"
    );

    const shortcuts = parsePersonalShortcuts(shortcutsString);

    // Cache result
    shortcutsCache = shortcuts;
    cacheTimestamp = Date.now();

    console.log(
      `🔗 Loaded ${shortcuts.length} personal shortcuts for ${user.displayName}`
    );
    return shortcuts;
  } catch (error) {
    console.error("Failed to get user shortcuts:", error);
    return ["Daily Notes", "Chat Room"]; // Safe fallback
  }
};

/**
 * Update user's personal shortcuts
 */
const setUserShortcuts = async (shortcuts) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getCurrentUser = platform.getUtility("getCurrentUser");
    const setUserPreference = platform.getUtility("setUserPreference");

    const user = getCurrentUser();

    // Convert back to parentheses format
    const shortcutsString = shortcuts.map((name) => `(${name})`).join("");

    await setUserPreference(
      user.displayName,
      "Personal Shortcuts",
      shortcutsString
    );

    // Clear cache to force refresh
    shortcutsCache = null;
    cacheTimestamp = 0;

    console.log(
      `✅ Updated personal shortcuts for ${user.displayName}: ${shortcuts.length} items`
    );
    return true;
  } catch (error) {
    console.error("Failed to update shortcuts:", error);
    return false;
  }
};

// ===================================================================
// ⌨️ KEYBOARD NAVIGATION - David's Professional Pattern
// ===================================================================

/**
 * Professional keyboard navigation for shortcuts dropdown
 * Based on David's useArrowKeyDown pattern
 */
class ShortcutsKeyboardNav {
  constructor(shortcuts, onSelect, menuContainer) {
    this.shortcuts = shortcuts;
    this.onSelect = onSelect;
    this.menuContainer = menuContainer;
    this.activeIndex = 0;
    this.isOpen = false;
  }

  // David's circular navigation logic
  moveDown() {
    this.activeIndex = (this.activeIndex + 1) % this.shortcuts.length;
    this.updateHighlight();
    this.scrollIntoView();
  }

  moveUp() {
    this.activeIndex =
      (this.activeIndex + this.shortcuts.length - 1) % this.shortcuts.length;
    this.updateHighlight();
    this.scrollIntoView();
  }

  selectCurrent() {
    if (this.shortcuts.length > 0) {
      const selectedShortcut = this.shortcuts[this.activeIndex];
      this.onSelect(selectedShortcut);
    }
  }

  // Professional visual highlighting
  updateHighlight() {
    const items = this.menuContainer.querySelectorAll(".shortcut-item");
    items.forEach((item, index) => {
      if (index === this.activeIndex) {
        item.classList.add("shortcut-active");
        item.style.background = "#137cbd";
        item.style.color = "white";
      } else {
        item.classList.remove("shortcut-active");
        item.style.background = "";
        item.style.color = "";
      }
    });
  }

  // David's intelligent viewport management
  scrollIntoView() {
    const activeItem = this.menuContainer.querySelector(".shortcut-active");
    if (activeItem && this.menuContainer) {
      const containerTop = this.menuContainer.scrollTop;
      const containerBottom = containerTop + this.menuContainer.offsetHeight;
      const itemTop = activeItem.offsetTop;
      const itemBottom = itemTop + activeItem.offsetHeight;

      if (itemBottom > containerBottom) {
        activeItem.scrollIntoView(false); // Align to bottom
      } else if (itemTop < containerTop) {
        activeItem.scrollIntoView(true); // Align to top
      }
    }
  }

  // Professional event handling with conflict prevention
  handleKeyDown(event) {
    if (!this.isOpen) return false;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        this.moveDown();
        return true;

      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        this.moveUp();
        return true;

      case "Enter":
        event.preventDefault();
        event.stopPropagation();
        this.selectCurrent();
        return true;

      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return true;

      default:
        return false;
    }
  }

  open() {
    this.isOpen = true;
    this.activeIndex = 0;
    this.updateHighlight();
  }

  close() {
    this.isOpen = false;
    this.menuContainer.style.display = "none";
  }
}

// ===================================================================
// 🎨 SIDEBAR UI INTEGRATION - Native Roam Styling
// ===================================================================

/**
 * Create professional shortcuts section for left sidebar
 */
const createShortcutsSection = async () => {
  const shortcuts = await getUserShortcuts();

  // Create main container
  const section = document.createElement("div");
  section.className = "roam-extension-suite shortcuts-section";
  section.style.cssText = `
    margin: 8px 0;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  `;

  // Create header with search
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    margin-bottom: 4px;
  `;

  const title = document.createElement("div");
  title.textContent = "★ Personal Shortcuts";
  title.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: #5c7080;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search...";
  searchInput.style.cssText = `
    width: 100px;
    padding: 2px 6px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    font-size: 11px;
    display: none;
  `;

  const searchToggle = document.createElement("button");
  searchToggle.innerHTML = "🔍";
  searchToggle.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 2px;
  `;

  header.appendChild(title);
  header.appendChild(searchToggle);
  header.appendChild(searchInput);

  // Create shortcuts list
  const shortcutsList = document.createElement("div");
  shortcutsList.className = "shortcuts-list";
  shortcutsList.style.cssText = `
    max-height: 200px;
    overflow-y: auto;
  `;

  // Create keyboard navigation
  const keyboardNav = new ShortcutsKeyboardNav(
    shortcuts,
    navigateToPage,
    shortcutsList
  );

  // Render shortcuts
  const renderShortcuts = (shortcutsToShow = shortcuts, filter = "") => {
    shortcutsList.innerHTML = "";

    if (shortcutsToShow.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.textContent = filter
        ? "No matches found"
        : "No shortcuts configured";
      emptyMessage.style.cssText = `
        padding: 8px;
        color: #8a9ba8;
        font-size: 11px;
        font-style: italic;
      `;
      shortcutsList.appendChild(emptyMessage);
      return;
    }

    shortcutsToShow.forEach((shortcut, index) => {
      const item = document.createElement("div");
      item.className = "shortcut-item";
      item.textContent = shortcut;
      item.style.cssText = `
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
        border-radius: 2px;
        margin: 1px 0;
        transition: background-color 0.1s ease;
      `;

      // Hover effects
      item.addEventListener("mouseenter", () => {
        if (!keyboardNav.isOpen) {
          item.style.background = "#f5f8fa";
        }
      });

      item.addEventListener("mouseleave", () => {
        if (!item.classList.contains("shortcut-active")) {
          item.style.background = "";
        }
      });

      // Click navigation
      item.addEventListener("click", () => {
        navigateToPage(shortcut);
      });

      shortcutsList.appendChild(item);
    });

    // Update keyboard navigation
    keyboardNav.shortcuts = shortcutsToShow;
    keyboardNav.activeIndex = 0;
  };

  // Search functionality
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const filter = e.target.value.toLowerCase();
      const filtered = shortcuts.filter((shortcut) =>
        shortcut.toLowerCase().includes(filter)
      );
      renderShortcuts(filtered, filter);

      if (filtered.length > 0) {
        keyboardNav.open();
      }
    }, 150);
  });

  // Search toggle
  searchToggle.addEventListener("click", () => {
    const isVisible = searchInput.style.display !== "none";
    if (isVisible) {
      searchInput.style.display = "none";
      searchInput.value = "";
      renderShortcuts(shortcuts);
      keyboardNav.close();
    } else {
      searchInput.style.display = "block";
      searchInput.focus();
    }
  });

  // Keyboard navigation integration
  searchInput.addEventListener("keydown", (e) => {
    if (keyboardNav.handleKeyDown(e)) {
      return;
    }

    // Open dropdown when typing
    if (e.key.length === 1 || e.key === "Backspace") {
      setTimeout(() => {
        if (searchInput.value) {
          keyboardNav.open();
        }
      }, 10);
    }
  });

  // Escape to close search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !keyboardNav.isOpen) {
      searchToggle.click(); // Close search
    }
  });

  // Initial render
  renderShortcuts();

  // Assemble section
  section.appendChild(header);
  section.appendChild(shortcutsList);

  return { section, refresh: () => renderShortcuts() };
};

/**
 * Navigate to page with proper error handling
 */
const navigateToPage = async (pageName) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    // Check if page exists
    const pageUid = getPageUidByTitle(pageName);

    if (pageUid) {
      // Navigate to existing page
      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title: pageName } });
      console.log(`📄 Navigated to: ${pageName}`);
    } else {
      // Offer to create page
      if (confirm(`Page "${pageName}" doesn't exist. Create it?`)) {
        const createPageIfNotExists = platform.getUtility(
          "createPageIfNotExists"
        );
        const newPageUid = await createPageIfNotExists(pageName);

        if (newPageUid) {
          window.roamAlphaAPI.ui.mainWindow.openPage({
            page: { title: pageName },
          });
          console.log(`✅ Created and navigated to: ${pageName}`);
        } else {
          console.error(`Failed to create page: ${pageName}`);
        }
      }
    }
  } catch (error) {
    console.error(`Navigation error for "${pageName}":`, error);
  }
};

/**
 * Inject shortcuts section into left sidebar
 */
const injectIntoSidebar = async () => {
  // Find left sidebar
  const leftSidebar =
    document.querySelector(".roam-sidebar-container.noselect") ||
    document.querySelector(".roam-sidebar-container") ||
    document.querySelector('[data-testid="left-sidebar"]');

  if (!leftSidebar) {
    console.warn("Left sidebar not found - will retry in 2 seconds");
    setTimeout(injectIntoSidebar, 2000);
    return null;
  }

  // Remove existing shortcuts section
  const existingSection = leftSidebar.querySelector(".shortcuts-section");
  if (existingSection) {
    existingSection.remove();
  }

  // Create new shortcuts section
  const { section: shortcutsSection, refresh } = await createShortcutsSection();

  // Find insertion point (before Roam branding or at end)
  const roamBranding =
    leftSidebar.querySelector('[data-testid="roam-logo"]') ||
    leftSidebar.querySelector(".roam-logo") ||
    leftSidebar.querySelector(".bp3-icon-manual");

  if (roamBranding && roamBranding.parentElement) {
    roamBranding.parentElement.insertBefore(
      shortcutsSection,
      roamBranding.parentElement
    );
  } else {
    leftSidebar.appendChild(shortcutsSection);
  }

  console.log("🔗 Personal shortcuts injected into sidebar");
  return { shortcutsSection, refresh };
};

// ===================================================================
// 🔄 SHORTCUTS MANAGEMENT - Add/Remove Functionality
// ===================================================================

/**
 * Add current page to shortcuts
 */
const addCurrentPageToShortcuts = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");

    const currentPage = getCurrentPageTitle();
    if (!currentPage) {
      console.warn("No current page to add to shortcuts");
      return false;
    }

    const shortcuts = await getUserShortcuts();

    if (shortcuts.includes(currentPage)) {
      console.log(`Page "${currentPage}" already in shortcuts`);
      return false;
    }

    const updatedShortcuts = [...shortcuts, currentPage];
    const success = await setUserShortcuts(updatedShortcuts);

    if (success) {
      console.log(`✅ Added "${currentPage}" to personal shortcuts`);

      // Refresh UI
      setTimeout(() => {
        injectIntoSidebar();
      }, 500);
    }

    return success;
  } catch (error) {
    console.error("Failed to add current page to shortcuts:", error);
    return false;
  }
};

/**
 * Remove page from shortcuts
 */
const removeFromShortcuts = async (pageName) => {
  try {
    const shortcuts = await getUserShortcuts();
    const updatedShortcuts = shortcuts.filter((name) => name !== pageName);

    const success = await setUserShortcuts(updatedShortcuts);

    if (success) {
      console.log(`❌ Removed "${pageName}" from personal shortcuts`);

      // Refresh UI
      setTimeout(() => {
        injectIntoSidebar();
      }, 500);
    }

    return success;
  } catch (error) {
    console.error(`Failed to remove "${pageName}" from shortcuts:`, error);
    return false;
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔗 Personal Shortcuts starting...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    if (!platform.has("user-authentication")) {
      console.error(
        "❌ User Authentication not found! Please load Extension 2 first."
      );
      return;
    }

    if (!platform.has("configuration-manager")) {
      console.error(
        "❌ Configuration Manager not found! Please load Extension 3 first."
      );
      return;
    }

    // 🎯 REGISTER UTILITIES WITH PLATFORM
    const shortcutsServices = {
      getUserShortcuts: getUserShortcuts,
      setUserShortcuts: setUserShortcuts,
      addCurrentPageToShortcuts: addCurrentPageToShortcuts,
      removeFromShortcuts: removeFromShortcuts,
      navigateToPage: navigateToPage,
    };

    Object.entries(shortcutsServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 🎨 INJECT SHORTCUTS INTO SIDEBAR
    let sidebarInjection = null;

    // Initial injection
    setTimeout(async () => {
      sidebarInjection = await injectIntoSidebar();
    }, 1000);

    // Monitor for sidebar changes (Roam sometimes rebuilds it)
    const sidebarObserver = new MutationObserver((mutations) => {
      const sidebarChanged = mutations.some(
        (mutation) =>
          mutation.target.closest(".roam-sidebar-container") ||
          mutation.target.classList?.contains("roam-sidebar-container")
      );

      if (sidebarChanged) {
        setTimeout(async () => {
          sidebarInjection = await injectIntoSidebar();
        }, 500);
      }
    });

    const targetNode = document.querySelector("#app") || document.body;
    sidebarObserver.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    window._extensionRegistry.observers.push(sidebarObserver);

    // 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Shortcuts: Add Current Page",
        callback: addCurrentPageToShortcuts,
      },
      {
        label: "Shortcuts: Show My Shortcuts",
        callback: async () => {
          const shortcuts = await getUserShortcuts();
          console.group("🔗 Personal Shortcuts");
          shortcuts.forEach((shortcut, index) => {
            console.log(`${index + 1}. ${shortcut}`);
          });
          console.groupEnd();
        },
      },
      {
        label: "Shortcuts: Refresh Sidebar",
        callback: async () => {
          sidebarInjection = await injectIntoSidebar();
          console.log("🔄 Shortcuts sidebar refreshed");
        },
      },
      {
        label: "Shortcuts: Edit Shortcuts",
        callback: async () => {
          const platform = window.RoamExtensionSuite;
          const getCurrentUser = platform.getUtility("getCurrentUser");
          const user = getCurrentUser();
          const pageTitle = `${user.displayName}/user preferences`;

          window.roamAlphaAPI.ui.mainWindow.openPage({
            page: { title: pageTitle },
          });
          console.log("📄 Opened preferences page for editing shortcuts");
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "personal-shortcuts",
      {
        services: shortcutsServices,
        navigateToPage,
        version: "1.0.0",
      },
      {
        name: "Personal Shortcuts",
        description:
          "Professional navigation interface with keyboard shortcuts and sidebar integration",
        version: "1.0.0",
        dependencies: [
          "foundation-registry",
          "user-authentication",
          "configuration-manager",
        ],
      }
    );

    // 🎉 STARTUP COMPLETE
    const shortcuts = await getUserShortcuts();
    console.log("✅ Personal Shortcuts loaded successfully!");
    console.log(`🔗 Found ${shortcuts.length} personal shortcuts`);
    console.log('💡 Try: Cmd+P → "Shortcuts: Add Current Page"');

    // Store cleanup function
    window._shortcutsCleanup = () => {
      if (sidebarInjection?.shortcutsSection) {
        sidebarInjection.shortcutsSection.remove();
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

    // Clear cache
    shortcutsCache = null;
    cacheTimestamp = 0;

    console.log("✅ Personal Shortcuts cleanup complete!");
  },
};
