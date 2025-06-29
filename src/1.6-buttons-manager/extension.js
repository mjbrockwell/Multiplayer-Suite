// ===================================================================
// Simple Button Utility Extension 2.0 - Page-Change Driven
// 🎯 COMPLETELY REDESIGNED: Simple "tear down and rebuild" approach
// 🔧 FIXED: Proper page title detection consistently throughout
// ✅ UPDATED: Added isChatRoom condition and fixed custom condition bug
// ✨ NEW: Dismissible buttons with centered-right [x] - Standard Behavior
// ===================================================================

(() => {
  "use strict";

  const EXTENSION_NAME = "Simple Button Utility";
  const EXTENSION_VERSION = "2.1.0"; // ✨ NEW: Dismissible buttons
  const ANIMATION_DURATION = 200;

  // ==================== CENTRALIZED PAGE TITLE DETECTION ====================

  // 🔧 SINGLE SOURCE OF TRUTH: One function for page title detection used everywhere
  function getCurrentPageTitle() {
    try {
      // STEP 1: Try to get the actual displayed page title from DOM FIRST
      const titleSelectors = [
        ".roam-article h1",
        ".rm-page-title",
        ".rm-title-display",
        "[data-page-title]",
        ".rm-page-title-text",
        ".roam-article > div:first-child h1",
        "h1[data-page-title]",
      ];

      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement) {
          const titleText = titleElement.textContent?.trim();
          if (titleText && titleText !== "") {
            if (window.SimpleButtonRegistry?.debugMode) {
              console.log(`📄 Got page title from ${selector}: "${titleText}"`);
            }
            return titleText;
          }
        }
      }

      // STEP 2: Try document.title as backup (clean it up)
      if (document.title && document.title !== "Roam") {
        const titleText = document.title
          .replace(" - Roam", "")
          .replace(" | Roam Research", "")
          .trim();
        if (titleText && titleText !== "") {
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(
              `📄 Got page title from document.title: "${titleText}"`
            );
          }
          return titleText;
        }
      }

      // STEP 3: ONLY as last resort, try URL parsing (returns page ID, not title)
      const url = window.location.href;
      const pageMatch = url.match(/\/page\/([^/?#]+)/);
      if (pageMatch) {
        const pageId = decodeURIComponent(pageMatch[1]);
        console.warn(`⚠️ Falling back to page ID (not title): "${pageId}"`);
        console.warn(
          "💡 Consider improving DOM selectors for better title detection"
        );
        return pageId;
      }

      console.warn("❌ Could not determine page title");
      return null;
    } catch (error) {
      console.error("❌ Failed to get current page title:", error);
      return null;
    }
  }

  // ==================== BUTTON STACK POSITIONING (UPDATED) ====================

  const BUTTON_STACKS = {
    "top-left": {
      maxButtons: 2,
      positions: [
        { x: 14, y: 6 }, // ← Updated coordinates: closer to edges
        { x: 14, y: 48 }, // ← Proper spacing for content positioning
      ],
    },

    "top-right": {
      maxButtons: 5,
      positions: [
        { x: -14, y: 6 }, // ← Updated: -14px from right edge (closer than -100px)
        { x: -14, y: 48 },
        { x: -14, y: 90 },
        { x: -14, y: 132 },
        { x: -14, y: 174 },
      ],
    },
  };

  // ==================== SIMPLE PAGE CHANGE DETECTOR ====================

  class SimplePageChangeDetector {
    constructor() {
      this.currentUrl = window.location.href;
      this.currentTitle = document.title;
      this.listeners = new Set();
      this.isMonitoring = false;
    }

    startMonitoring() {
      if (this.isMonitoring) return;

      // Just monitor the basics - URL and title changes
      this.setupURLListeners();
      this.setupTitleListener();
      this.setupPeriodicCheck();

      this.isMonitoring = true;
      console.log("🚀 Simple page monitoring started");
    }

    stopMonitoring() {
      if (!this.isMonitoring) return;

      // Clean up listeners
      window.removeEventListener("popstate", this.boundURLChange);
      if (this.originalPushState) history.pushState = this.originalPushState;
      if (this.originalReplaceState)
        history.replaceState = this.originalReplaceState;
      if (this.titleObserver) this.titleObserver.disconnect();
      if (this.checkInterval) clearInterval(this.checkInterval);

      this.isMonitoring = false;
      console.log("🛑 Simple page monitoring stopped");
    }

    setupURLListeners() {
      // Browser navigation
      this.boundURLChange = () => this.checkForPageChange();
      window.addEventListener("popstate", this.boundURLChange);

      // SPA navigation
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;

      const self = this;
      history.pushState = function (...args) {
        self.originalPushState.apply(history, args);
        setTimeout(() => self.checkForPageChange(), 50);
      };

      history.replaceState = function (...args) {
        self.originalReplaceState.apply(history, args);
        setTimeout(() => self.checkForPageChange(), 50);
      };
    }

    setupTitleListener() {
      // Watch for title changes (Roam-specific)
      this.titleObserver = new MutationObserver(() => {
        if (document.title !== this.currentTitle) {
          setTimeout(() => self.checkForPageChange(), 50);
        }
      });

      this.titleObserver.observe(document.head, {
        childList: true,
        subtree: true,
      });
    }

    setupPeriodicCheck() {
      // Light backup check every 3 seconds
      this.checkInterval = setInterval(() => {
        this.checkForPageChange();
      }, 3000);
    }

    checkForPageChange() {
      const newUrl = window.location.href;
      const newTitle = document.title;

      if (newUrl !== this.currentUrl || newTitle !== this.currentTitle) {
        console.log(`📄 Page changed: ${this.currentUrl} → ${newUrl}`);

        this.currentUrl = newUrl;
        this.currentTitle = newTitle;

        // Notify all listeners - THIS IS THE CORE EVENT
        this.listeners.forEach((listener) => {
          try {
            listener({ url: newUrl, title: newTitle });
          } catch (error) {
            console.error("❌ Page change listener error:", error);
          }
        });
      }
    }

    onPageChange(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
  }

  // ==================== SIMPLE BUTTON CONDITIONS ====================

  // 🔧 FIXED: All conditions use the same centralized getCurrentPageTitle function
  const ButtonConditions = {
    // Username page detection - ENHANCED: Uses member cache for exact matching
    isUsernamePage: () => {
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;

      // 🎯 NEW: Use GraphMemberCache for exact member matching (no false positives)
      if (window.GraphMemberCache?.isMember) {
        const isCachedMember = window.GraphMemberCache.isMember(pageTitle);

        if (window.SimpleButtonRegistry?.debugMode) {
          console.log(
            `🎯 Cache-based username detection for "${pageTitle}": ${isCachedMember}`
          );
        }

        return isCachedMember;
      }

      // Fallback to regex patterns if cache not available
      const isFirstLastPattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(pageTitle);
      const isUsernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,}$/.test(pageTitle);
      const result = isFirstLastPattern || isUsernamePattern;

      if (window.SimpleButtonRegistry?.debugMode) {
        console.log(
          `⚠️ Fallback regex username detection for "${pageTitle}":`,
          {
            isFirstLastPattern,
            isUsernamePattern,
            result,
          }
        );
      }

      return result;
    },

    // ✅ NEW: Chat room page detection - CASE INSENSITIVE
    isChatRoom: () => {
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;

      // Case-insensitive check for "chat room"
      const lowerTitle = pageTitle.toLowerCase();
      const containsChatRoom = lowerTitle.includes("chat room");

      if (window.SimpleButtonRegistry?.debugMode) {
        console.log(
          `🗨️ Chat room detection for "${pageTitle}": ${containsChatRoom} (lowercase: "${lowerTitle}")`
        );
      }

      return containsChatRoom;
    },

    // Daily note detection
    isDailyNote: () => {
      const url = window.location.href;
      return (
        /\/page\/\d{2}-\d{2}-\d{4}/.test(url) || // MM-DD-YYYY
        /\/page\/\d{4}-\d{2}-\d{2}/.test(url) || // YYYY-MM-DD
        /\/page\/[A-Z][a-z]+.*\d{4}/.test(url)
      ); // Month DD, YYYY
    },

    // Main content pages
    isMainPage: () => {
      return (
        !!document.querySelector(".roam-article") &&
        window.location.href.includes("/page/")
      );
    },

    // Settings pages
    isSettingsPage: () => {
      return (
        window.location.href.includes("/settings") ||
        window.location.href.includes("roam/settings")
      );
    },

    // ✅ FIXED: Custom condition support - handles missing parameters
    custom: (conditionFn) => {
      // Handle being called without parameters (like from debug panel)
      if (!conditionFn || typeof conditionFn !== "function") {
        return false;
      }

      try {
        return conditionFn();
      } catch (error) {
        console.error("❌ Custom condition error:", error);
        return false;
      }
    },
  };

  // ==================== SIMPLE BUTTON REGISTRY ====================

  class SimpleButtonRegistry {
    constructor() {
      this.registeredButtons = new Map(); // button config storage
      this.activeButtons = new Map(); // currently visible DOM elements (containers, not buttons)
      this.stacks = {
        // RESTORED: Stack management
        "top-left": [],
        "top-right": [],
      };
      this.container = null;
      this.debugMode = false; // 🐛 Debug mode toggle
      this.pageDetector = new SimplePageChangeDetector();

      // Core event: when page changes, rebuild all buttons
      this.pageDetector.onPageChange(() => {
        this.rebuildAllButtons();
      });
    }

    async initialize() {
      this.setupContainer();
      this.pageDetector.startMonitoring();

      // Initial button placement
      this.rebuildAllButtons();

      console.log(
        "✅ Simple Button Registry initialized with dismissible buttons"
      );
      return true;
    }

    setupContainer() {
      // 🔧 FIXED: Don't cache container - find it dynamically each time
      // This prevents stale container issues during SPA navigation
      this.container = null; // Will be found dynamically
      console.log("✅ Container setup configured for dynamic detection");
    }

    getCurrentContainer() {
      // 🔧 DYNAMIC: Find container fresh each time to handle SPA navigation
      const candidates = [
        ".roam-article",
        ".roam-main .roam-article",
        ".roam-main",
      ];

      for (const selector of candidates) {
        const element = document.querySelector(selector);
        if (element && document.contains(element)) {
          // Ensure relative positioning for absolute button placement
          if (getComputedStyle(element).position === "static") {
            element.style.position = "relative";
          }

          return element;
        }
      }

      // Fallback to body if no suitable container found
      console.warn("⚠️ No suitable container found, using document.body");
      return document.body;
    }

    // ==================== CORE METHOD: REBUILD ALL BUTTONS ====================

    rebuildAllButtons() {
      console.log("🔄 Rebuilding all buttons for current page...");
      if (this.debugMode) {
        console.log("📍 Current location:", {
          url: window.location.href,
          title: getCurrentPageTitle(), // Uses centralized function
        });
      }

      // STEP 1: Clear ALL existing buttons and stacks (default state)
      this.clearAllButtons();
      this.clearAllStacks();

      if (this.debugMode) {
        console.log(
          `📋 Evaluating ${this.registeredButtons.size} registered buttons`
        );
      }

      // STEP 2: Collect buttons that should be visible
      const visibleButtons = [];
      this.registeredButtons.forEach((config) => {
        if (this.shouldButtonBeVisible(config)) {
          visibleButtons.push(config);
          if (this.debugMode) {
            console.log(`✅ Button "${config.id}" will be shown`);
          }
        } else {
          if (this.debugMode) {
            console.log(`❌ Button "${config.id}" will be hidden`);
          }
        }
      });

      if (this.debugMode) {
        console.log(
          `📊 Visibility results: ${visibleButtons.length}/${this.registeredButtons.size} buttons will be shown`
        );
      }

      // STEP 3: Sort by priority (priority buttons get slots first)
      visibleButtons.sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return 0; // Maintain original order for same priority
      });

      // STEP 4: Assign to available stack slots
      visibleButtons.forEach((config) => {
        this.assignButtonToStack(config);
      });

      // STEP 5: Create and place all assigned buttons
      this.placeAllStackedButtons();

      console.log(
        `✅ Button rebuild complete (${this.activeButtons.size} visible)`
      );

      if (this.debugMode) {
        console.log("📊 Final button status:", {
          registered: Array.from(this.registeredButtons.keys()),
          visible: Array.from(this.activeButtons.keys()),
          stacks: {
            "top-left": this.stacks["top-left"].map((b) => b.id),
            "top-right": this.stacks["top-right"].map((b) => b.id),
          },
        });
      }
    }

    clearAllButtons() {
      this.activeButtons.forEach((element) => {
        element.remove();
      });
      this.activeButtons.clear();
    }

    clearAllStacks() {
      this.stacks["top-left"] = [];
      this.stacks["top-right"] = [];
    }

    assignButtonToStack(config) {
      const targetStack = config.stack || "top-right";
      const stackConfig = BUTTON_STACKS[targetStack];

      // Check if stack has available slots
      if (this.stacks[targetStack].length < stackConfig.maxButtons) {
        this.stacks[targetStack].push(config);
        console.log(
          `📍 Button "${config.id}" assigned to ${targetStack} slot ${this.stacks[targetStack].length}`
        );
      } else {
        console.warn(
          `⚠️ Button "${config.id}" skipped - no slots available in ${targetStack}`
        );
      }
    }

    placeAllStackedButtons() {
      // Place buttons from both stacks
      Object.keys(this.stacks).forEach((stackName) => {
        this.stacks[stackName].forEach((config, index) => {
          this.createAndPlaceButton(config, stackName, index);
        });
      });
    }

    shouldButtonBeVisible(config) {
      const { showOn, hideOn, condition } = config;

      // Enhanced debugging for this specific issue
      if (this.debugMode) {
        console.group(`🔍 Evaluating visibility for button "${config.id}"`);
        console.log("Button config:", {
          showOn,
          hideOn,
          condition: !!condition,
        });
        console.log("Current page:", {
          url: window.location.href,
          title: getCurrentPageTitle(), // Uses centralized function
        });
      }

      // Custom condition function (most flexible)
      if (condition && typeof condition === "function") {
        try {
          const result = condition();
          if (this.debugMode) {
            console.log(`Custom condition result: ${result}`);
            console.groupEnd();
          }
          return result;
        } catch (error) {
          console.error(`❌ Custom condition error for "${config.id}":`, error);
          if (this.debugMode) {
            console.groupEnd();
          }
          return false;
        }
      }

      // Simple showOn/hideOn rules
      if (showOn) {
        const conditionResults = showOn.map((conditionName) => {
          const hasCondition = ButtonConditions[conditionName]
            ? ButtonConditions[conditionName]()
            : false;
          if (this.debugMode) {
            console.log(`Condition "${conditionName}": ${hasCondition}`);
          }
          return hasCondition;
        });

        const shouldShow = conditionResults.some((result) => result);
        if (this.debugMode) {
          console.log(
            `showOn evaluation: ${shouldShow} (${conditionResults.join(", ")})`
          );
        }

        if (!shouldShow) {
          if (this.debugMode) {
            console.log("❌ Button hidden by showOn rules");
            console.groupEnd();
          }
          return false;
        }
      }

      if (hideOn) {
        const hideResults = hideOn.map((conditionName) => {
          const shouldHide = ButtonConditions[conditionName]
            ? ButtonConditions[conditionName]()
            : false;
          if (this.debugMode) {
            console.log(`Hide condition "${conditionName}": ${shouldHide}`);
          }
          return shouldHide;
        });

        const shouldHide = hideResults.some((result) => result);
        if (this.debugMode) {
          console.log(
            `hideOn evaluation: ${shouldHide} (${hideResults.join(", ")})`
          );
        }

        if (shouldHide) {
          if (this.debugMode) {
            console.log("❌ Button hidden by hideOn rules");
            console.groupEnd();
          }
          return false;
        }
      }

      if (this.debugMode) {
        console.log("✅ Button should be visible");
        console.groupEnd();
      }

      return true; // Default: show button
    }

    // ✨ NEW: Enhanced createAndPlaceButton with dismissible functionality
    createAndPlaceButton(config, stackName, stackIndex) {
      // ✨ NEW: Create container instead of single button
      const buttonContainer = document.createElement("div");
      buttonContainer.style.position = "absolute";
      buttonContainer.style.display = "flex";
      buttonContainer.style.alignItems = "center";
      buttonContainer.style.zIndex = "10000";

      // ✨ NEW: Create main button
      const mainButton = document.createElement("button");
      mainButton.textContent = config.text;

      // Get position from stack configuration
      const stackConfig = BUTTON_STACKS[stackName];
      const position = stackConfig.positions[stackIndex];

      // Base styling for main button
      Object.assign(mainButton.style, {
        padding: "8px 12px",
        paddingRight: "32px", // ✨ NEW: Extra space for dismiss button
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        userSelect: "none",
        transition: "all 200ms ease",
        whiteSpace: "nowrap",
        position: "relative", // ✨ NEW: For dismiss button positioning
      });

      // Apply custom styles to main button
      if (config.style) {
        Object.assign(mainButton.style, config.style);
        // ✨ NEW: Ensure padding-right is preserved for dismiss button
        if (!config.style.paddingRight) {
          mainButton.style.paddingRight = "32px";
        }
      }

      // ✨ NEW: Create dismiss button
      const dismissButton = document.createElement("span");
      dismissButton.innerHTML = "×";
      dismissButton.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-weight: bold;
        border-radius: 2px;
        transition: all 150ms ease;
        user-select: none;
        line-height: 1;
      `;

      // ✨ NEW: Dismiss button hover effects
      dismissButton.addEventListener("mouseenter", () => {
        dismissButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        dismissButton.style.color = "rgba(255, 255, 255, 0.9)";
      });

      dismissButton.addEventListener("mouseleave", () => {
        dismissButton.style.backgroundColor = "transparent";
        dismissButton.style.color = "rgba(255, 255, 255, 0.7)";
      });

      // ✨ NEW: Dismiss functionality
      dismissButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent main button click

        console.log(`🗑️ Dismissing button "${config.id}"`);

        // Remove from DOM
        if (buttonContainer.parentNode) {
          buttonContainer.remove();
        }

        // Remove from activeButtons tracking
        this.activeButtons.delete(config.id);

        console.log(
          `✅ Button "${config.id}" dismissed (will reappear on page change)`
        );
      });

      // Assemble the button structure
      mainButton.appendChild(dismissButton);
      buttonContainer.appendChild(mainButton);

      // Position the container
      if (position.x < 0) {
        // Right-aligned positioning
        buttonContainer.style.right = `${Math.abs(position.x)}px`;
        buttonContainer.style.left = "auto";
      } else {
        // Left-aligned positioning
        buttonContainer.style.left = `${position.x}px`;
        buttonContainer.style.right = "auto";
      }
      buttonContainer.style.top = `${position.y}px`;

      // Main button click handler
      mainButton.addEventListener("click", (e) => {
        // ✨ NEW: Check if click was on dismiss button
        if (e.target === dismissButton) {
          return; // Let dismiss button handle it
        }

        e.preventDefault();
        e.stopPropagation();

        try {
          config.onClick({
            buttonId: config.id,
            buttonStack: stackName,
            buttonPosition: stackIndex + 1,
            currentPage: {
              url: window.location.href,
              title: getCurrentPageTitle(), // Uses centralized function
            },
          });
        } catch (error) {
          console.error(`❌ Button "${config.id}" click error:`, error);
        }
      });

      // Main button hover effects
      mainButton.addEventListener("mouseenter", () => {
        mainButton.style.transform = "translateY(-1px)";
        mainButton.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      mainButton.addEventListener("mouseleave", () => {
        mainButton.style.transform = "translateY(0)";
        mainButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });

      // Add to DOM and track the container
      const container = this.getCurrentContainer(); // 🔧 DYNAMIC: Get fresh container
      container.appendChild(buttonContainer);
      this.activeButtons.set(config.id, buttonContainer); // ✨ NEW: Track container, not button

      console.log(
        `✅ Dismissible button "${config.id}" placed at ${stackName} #${
          stackIndex + 1
        } (${position.x}, ${position.y})`
      );
    }

    // ==================== SIMPLE PUBLIC API ====================

    registerButton(config) {
      const { id, text, onClick } = config;

      // Validation
      if (!id || !text || !onClick) {
        throw new Error("Button must have id, text, and onClick");
      }

      if (this.registeredButtons.has(id)) {
        throw new Error(`Button "${id}" already registered`);
      }

      // Validate stack
      const stack = config.stack || "top-right";
      if (!BUTTON_STACKS[stack]) {
        throw new Error(
          `Invalid stack: ${stack}. Must be: ${Object.keys(BUTTON_STACKS).join(
            ", "
          )}`
        );
      }

      // Store configuration with stack positioning
      this.registeredButtons.set(id, {
        id,
        text,
        onClick,
        stack,
        priority: config.priority || false,
        showOn: config.showOn || null,
        hideOn: config.hideOn || null,
        condition: config.condition || null,
        style: config.style || {},
      });

      // If already initialized, trigger rebuild
      if (this.pageDetector.isMonitoring) {
        // 🔧 CHANGED: Check if initialized differently
        this.rebuildAllButtons();
      }

      console.log(
        `✅ Dismissible button "${id}" registered for ${stack} stack${
          config.priority ? " (priority)" : ""
        }`
      );
      return { success: true, id, stack };
    }

    removeButton(id) {
      // Remove from registry
      const removed = this.registeredButtons.delete(id);

      // Remove from DOM if active
      if (this.activeButtons.has(id)) {
        this.activeButtons.get(id).remove();
        this.activeButtons.delete(id);
      }

      if (removed) {
        console.log(`🗑️ Button "${id}" removed`);
      }

      return removed;
    }

    getStatus() {
      return {
        registeredButtons: this.registeredButtons.size,
        activeButtons: this.activeButtons.size,
        stacks: {
          "top-left": {
            buttons: this.stacks["top-left"].length,
            max: BUTTON_STACKS["top-left"].maxButtons,
            available:
              BUTTON_STACKS["top-left"].maxButtons -
              this.stacks["top-left"].length,
            buttonIds: this.stacks["top-left"].map((b) => b.id),
          },
          "top-right": {
            buttons: this.stacks["top-right"].length,
            max: BUTTON_STACKS["top-right"].maxButtons,
            available:
              BUTTON_STACKS["top-right"].maxButtons -
              this.stacks["top-right"].length,
            buttonIds: this.stacks["top-right"].map((b) => b.id),
          },
        },
        currentPage: {
          url: window.location.href,
          title: getCurrentPageTitle(), // Uses centralized function
        },
        buttonIds: {
          registered: Array.from(this.registeredButtons.keys()),
          active: Array.from(this.activeButtons.keys()),
        },
      };
    }

    cleanup() {
      this.clearAllButtons();
      this.clearAllStacks();
      this.registeredButtons.clear();
      this.pageDetector.stopMonitoring();
      console.log("🧹 Simple Button Registry cleaned up");
    }
  }

  // ==================== EXTENSION MANAGER ====================

  class SimpleExtensionButtonManager {
    constructor(extensionName) {
      this.extensionName = extensionName;
      this.registry = null;
      this.myButtons = new Set();
    }

    async initialize() {
      if (!window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry = new SimpleButtonRegistry();
        await window.SimpleButtonRegistry.initialize();
      }

      this.registry = window.SimpleButtonRegistry;
      return true;
    }

    async registerButton(config) {
      if (!this.registry) await this.initialize();

      const buttonId = `${this.extensionName}-${config.id}`;
      const result = this.registry.registerButton({
        ...config,
        id: buttonId,
      });

      if (result.success) {
        this.myButtons.add(buttonId);
      }

      return result;
    }

    removeButton(id) {
      const buttonId = `${this.extensionName}-${id}`;
      const success = this.registry?.removeButton(buttonId);

      if (success) {
        this.myButtons.delete(buttonId);
      }

      return success;
    }

    cleanup() {
      this.myButtons.forEach((buttonId) => {
        this.registry?.removeButton(buttonId);
      });
      this.myButtons.clear();
    }
  }

  // ==================== GLOBAL API ====================

  // Simple global access
  window.SimpleButtonRegistry = null; // Will be created on first use
  window.SimpleExtensionButtonManager = SimpleExtensionButtonManager;
  window.ButtonConditions = ButtonConditions;

  // Simple testing
  window.SimpleButtonUtilityTests = {
    testBasicButton: async () => {
      const manager = new SimpleExtensionButtonManager("TestExtension");
      await manager.initialize();

      // Test multiple buttons with different stacks and priorities
      await manager.registerButton({
        id: "test-button-1",
        text: "🧪 Test 1",
        onClick: () => console.log("Test button 1 clicked!"),
        showOn: ["isMainPage"],
        stack: "top-right",
        priority: false,
      });

      await manager.registerButton({
        id: "test-button-2",
        text: "⭐ Priority",
        onClick: () => console.log("Priority button clicked!"),
        showOn: ["isMainPage"],
        stack: "top-right",
        priority: true, // This will get slot #1
      });

      await manager.registerButton({
        id: "test-button-3",
        text: "📍 Left",
        onClick: () => console.log("Left stack button clicked!"),
        showOn: ["isMainPage"],
        stack: "top-left",
      });

      console.log("Test dismissible buttons registered");
      console.log("Registry status:", window.SimpleButtonRegistry.getStatus());

      // Clean up after 10 seconds
      setTimeout(() => {
        manager.cleanup();
        console.log("Test cleaned up");
      }, 10000);
    },

    // ✅ UPDATED: Test the new isChatRoom condition
    testChatRoomDetection: () => {
      console.group("🗨️ Testing Chat Room Detection");

      const currentTitle = getCurrentPageTitle();
      console.log(`Current page: "${currentTitle}"`);

      if (window.ButtonConditions.isChatRoom) {
        const result = window.ButtonConditions.isChatRoom();
        console.log(`isChatRoom() result: ${result}`);

        // Test various titles
        const testTitles = [
          "Chat Room",
          "chat room",
          "CHAT ROOM",
          "Daily Chat Room",
          "Matt Brockwell",
          "Daily Notes",
        ];

        console.log("\nTesting various titles:");
        testTitles.forEach((title) => {
          const isMatch = title.toLowerCase().includes("chat room");
          console.log(`"${title}" → ${isMatch}`);
        });
      } else {
        console.log("❌ isChatRoom condition not found");
      }

      console.groupEnd();
    },

    // ✨ NEW: Test dismissible functionality
    testDismissibleButtons: async () => {
      console.group("✨ Testing Dismissible Button Functionality");

      const manager = new SimpleExtensionButtonManager("DismissTest");
      await manager.initialize();

      // Create a test button
      await manager.registerButton({
        id: "dismissible-test",
        text: "🧪 Try dismissing me with [×]",
        onClick: () => console.log("Main button clicked!"),
        showOn: ["isMainPage"],
        stack: "top-right",
      });

      console.log("✨ Dismissible test button created");
      console.log(
        "💡 Click the [×] to dismiss, it will reappear on page change"
      );

      console.groupEnd();
    },

    // 🚨 SPECIAL: Debug Extension 6 User Directory button issue
    debugUserDirectoryButton: () => {
      console.group("🔍 Debugging User Directory Button Issue");

      const registry = window.SimpleButtonRegistry;
      if (!registry) {
        console.error("❌ Simple Button Registry not found");
        console.groupEnd();
        return;
      }

      // Check if there's a User Directory button registered
      let userDirButton = null;
      registry.registeredButtons.forEach((config, id) => {
        if (
          id.includes("User") ||
          id.includes("Directory") ||
          config.text.includes("User") ||
          config.text.includes("Directory")
        ) {
          userDirButton = { id, config };
        }
      });

      if (!userDirButton) {
        console.log("❌ No User Directory button found in registry");
        console.log(
          "📋 Registered buttons:",
          Array.from(registry.registeredButtons.keys())
        );
        console.groupEnd();
        return;
      }

      console.log("🎯 Found User Directory button:", userDirButton.id);
      console.log("📝 Button config:", userDirButton.config);

      // Test all conditions manually
      console.log("\n🧪 Testing button conditions manually:");

      // Test current page conditions
      console.log("📄 Current page info:");
      console.log("  URL:", window.location.href);
      console.log("  Title:", getCurrentPageTitle());

      // Test all ButtonConditions
      console.log("\n🔍 Testing all button conditions:");
      Object.keys(ButtonConditions).forEach((conditionName) => {
        try {
          const result = ButtonConditions[conditionName]();
          console.log(`  ${conditionName}: ${result}`);
        } catch (error) {
          console.log(`  ${conditionName}: ERROR - ${error.message}`);
        }
      });

      // Test the specific button's visibility logic
      console.log("\n⚖️ Testing button visibility logic:");
      const shouldBeVisible = registry.shouldButtonBeVisible(
        userDirButton.config
      );
      console.log(`Should be visible: ${shouldBeVisible}`);

      // Check if it's actually visible
      const isActuallyVisible = registry.activeButtons.has(userDirButton.id);
      console.log(`Actually visible: ${isActuallyVisible}`);

      if (shouldBeVisible !== isActuallyVisible) {
        console.error(
          "🚨 MISMATCH: Expected visibility doesn't match actual visibility!"
        );
      }

      console.groupEnd();
    },

    showStatus: () => {
      if (window.SimpleButtonRegistry) {
        console.log(
          "📊 Registry Status:",
          window.SimpleButtonRegistry.getStatus()
        );
      } else {
        console.log("❌ Registry not initialized");
      }
    },

    forceRebuild: () => {
      if (window.SimpleButtonRegistry) {
        console.log("🔄 Forcing button rebuild...");
        window.SimpleButtonRegistry.rebuildAllButtons();
      }
    },

    enableDebugMode: () => {
      if (window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry.debugMode = true;
        console.log(
          "🐛 Debug mode enabled - you'll see detailed logs during button rebuilds"
        );
      } else {
        console.log("❌ Registry not found");
      }
    },

    disableDebugMode: () => {
      if (window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry.debugMode = false;
        console.log("✅ Debug mode disabled");
      }
    },

    // 🔧 NEW: Test container connectivity
    testContainerConnectivity: () => {
      console.group("🔍 Testing Container Connectivity");

      if (window.SimpleButtonRegistry) {
        const registry = window.SimpleButtonRegistry;
        const container = registry.getCurrentContainer();

        console.log("Current container:", container);
        console.log(
          "Container connected to document:",
          document.contains(container)
        );
        console.log("Container className:", container?.className);

        // Test all possible containers
        const candidates = [
          ".roam-article",
          ".roam-main .roam-article",
          ".roam-main",
        ];
        candidates.forEach((selector) => {
          const element = document.querySelector(selector);
          console.log(`${selector}:`, {
            exists: !!element,
            connected: element ? document.contains(element) : false,
            isCurrentContainer: element === container,
          });
        });

        // Check button connectivity
        registry.activeButtons.forEach((button, id) => {
          console.log(`Button "${id}":`, {
            connected: document.contains(button),
            parent: button.parentElement?.className,
            visible: button.getBoundingClientRect().width > 0,
          });
        });
      }

      console.groupEnd();
    },

    testPageTitleDetection: () => {
      console.group("🔧 Testing Fixed Page Title Detection");

      console.log("Current page title:", getCurrentPageTitle());

      // Test username detection with current title
      const pageTitle = getCurrentPageTitle();
      if (pageTitle) {
        const isFirstLastPattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(
          pageTitle
        );
        const isUsernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,}$/.test(pageTitle);

        console.log(`Testing "${pageTitle}":`);
        console.log("  Matches 'First Last' pattern:", isFirstLastPattern);
        console.log("  Matches 'username123' pattern:", isUsernamePattern);
        console.log(
          "  Should be detected as username page:",
          isFirstLastPattern || isUsernamePattern
        );

        // Test the actual condition
        console.log(
          "  isUsernamePage() result:",
          ButtonConditions.isUsernamePage()
        );
      }

      // Test what different methods return
      console.log("\nComparison of page title detection methods:");
      console.log(
        "  DOM-based:",
        document.querySelector(".roam-article h1")?.textContent?.trim()
      );
      console.log(
        "  URL-based:",
        window.location.href.match(/\/page\/([^/?#]+)/)?.[1]
      );
      console.log("  document.title:", document.title);
      console.log("  getCurrentPageTitle():", getCurrentPageTitle());

      console.groupEnd();
    },

    // 🎯 NEW: Test cache-based username detection
    testCacheBasedUsernameDetection: () => {
      console.group(
        "🎯 Testing Cache-Based Username Detection in Button System"
      );

      // Test current page
      const currentTitle = getCurrentPageTitle();
      console.log(`Current page: "${currentTitle}"`);

      if (window.GraphMemberCache) {
        console.log("✅ GraphMemberCache available");
        const cacheStatus = window.GraphMemberCache.getStatus();
        console.log("Cache status:", cacheStatus);

        // Test current page detection
        const isMemberViaCache = window.GraphMemberCache.isMember(currentTitle);
        const isUsernamePageResult = window.ButtonConditions.isUsernamePage();

        console.log(
          `Cache says "${currentTitle}" is member: ${isMemberViaCache}`
        );
        console.log(`isUsernamePage() returns: ${isUsernamePageResult}`);
        console.log(
          `Results match: ${isMemberViaCache === isUsernamePageResult}`
        );

        // Test some example cases
        const testCases = [
          "Matt Brockwell",
          "Chat Room",
          "Daily Notes",
          "John Smith",
        ];
        testCases.forEach((testCase) => {
          const cacheResult = window.GraphMemberCache.isMember(testCase);
          console.log(`"${testCase}" → Cache: ${cacheResult}`);
        });
      } else {
        console.log(
          "❌ GraphMemberCache not available - using fallback detection"
        );
      }

      console.groupEnd();
    },
  };

  console.log(
    `✅ ${EXTENSION_NAME} v${EXTENSION_VERSION} loaded - Now with dismissible buttons! ✨`
  );
  console.log("💡 All buttons now have a [×] button for temporary dismissal");
  console.log("🔄 Dismissed buttons reappear on page changes");

  // Auto-test the page title detection and cache integration
  setTimeout(() => {
    console.log(
      "🔧 Auto-testing page title detection and cache integration..."
    );
    window.SimpleButtonUtilityTests.testPageTitleDetection();

    // Test cache integration if available
    if (window.GraphMemberCache) {
      window.SimpleButtonUtilityTests.testCacheBasedUsernameDetection();
    }

    // ✅ NEW: Test the chat room detection
    window.SimpleButtonUtilityTests.testChatRoomDetection();

    // ✨ NEW: Test dismissible functionality
    setTimeout(() => {
      window.SimpleButtonUtilityTests.testDismissibleButtons();
    }, 2000);
  }, 1000);
})();
