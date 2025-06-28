// ===================================================================
// Simple Button Utility Extension 2.0 - Page-Change Driven
// 🎯 COMPLETELY REDESIGNED: Simple "tear down and rebuild" approach
// ===================================================================

(() => {
  "use strict";

  const EXTENSION_NAME = "Simple Button Utility";
  const EXTENSION_VERSION = "2.0.0"; // Complete redesign
  const ANIMATION_DURATION = 200;

  // ==================== BUTTON STACK POSITIONING (RESTORED) ====================

  const BUTTON_STACKS = {
    "top-left": {
      maxButtons: 2,
      positions: [
        { x: 20, y: 8 }, // ← Sandbox coordinates: relative to content area
        { x: 20, y: 50 }, // ← Proper spacing for content positioning
      ],
    },
    "top-right": {
      maxButtons: 5,
      positions: [
        { x: -100, y: 8 }, // ← Sandbox coordinates: -100px from right edge
        { x: -100, y: 50 },
        { x: -100, y: 92 },
        { x: -100, y: 134 },
        { x: -100, y: 176 },
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
          setTimeout(() => this.checkForPageChange(), 50);
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

  // Simple condition functions - much easier to understand!
  const ButtonConditions = {
    // Username page detection
    isUsernamePage: () => {
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;

      // Simple patterns for username detection
      return (
        /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(pageTitle) || // "First Last"
        /^[a-zA-Z][a-zA-Z0-9_-]{2,}$/.test(pageTitle)
      ); // "username123"
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

    // Custom condition support
    custom: (conditionFn) => {
      try {
        return conditionFn();
      } catch (error) {
        console.error("❌ Custom condition error:", error);
        return false;
      }
    },
  };

  // Helper function
  function getCurrentPageTitle() {
    const url = window.location.href;
    const pageMatch = url.match(/\/page\/([^/?#]+)/);
    return pageMatch ? decodeURIComponent(pageMatch[1]) : null;
  }

  // ==================== SIMPLE BUTTON REGISTRY ====================

  class SimpleButtonRegistry {
    constructor() {
      this.registeredButtons = new Map(); // button config storage
      this.activeButtons = new Map(); // currently visible DOM elements
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

      console.log("✅ Simple Button Registry initialized");
      return true;
    }

    setupContainer() {
      // Find main content area
      const candidates = [
        ".roam-article",
        ".roam-main .roam-article",
        ".roam-main",
      ];

      for (const selector of candidates) {
        const element = document.querySelector(selector);
        if (element) {
          this.container = element;

          // Ensure relative positioning for absolute button placement
          if (getComputedStyle(element).position === "static") {
            element.style.position = "relative";
          }

          console.log(`✅ Container found: ${selector}`);
          return;
        }
      }

      throw new Error("No suitable container found");
    }

    // ==================== CORE METHOD: REBUILD ALL BUTTONS ====================

    rebuildAllButtons() {
      console.log("🔄 Rebuilding all buttons for current page...");
      if (window.SimpleButtonRegistry?.debugMode) {
        console.log("📍 Current location:", {
          url: window.location.href,
          title: getCurrentPageTitle(),
        });
      }

      // STEP 1: Clear ALL existing buttons and stacks (default state)
      this.clearAllButtons();
      this.clearAllStacks();

      if (window.SimpleButtonRegistry?.debugMode) {
        console.log(
          `📋 Evaluating ${this.registeredButtons.size} registered buttons`
        );
      }

      // STEP 2: Collect buttons that should be visible
      const visibleButtons = [];
      this.registeredButtons.forEach((config) => {
        if (this.shouldButtonBeVisible(config)) {
          visibleButtons.push(config);
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(`✅ Button "${config.id}" will be shown`);
          }
        } else {
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(`❌ Button "${config.id}" will be hidden`);
          }
        }
      });

      if (window.SimpleButtonRegistry?.debugMode) {
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

      if (window.SimpleButtonRegistry?.debugMode) {
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
      if (window.SimpleButtonRegistry?.debugMode) {
        console.group(`🔍 Evaluating visibility for button "${config.id}"`);
        console.log("Button config:", {
          showOn,
          hideOn,
          condition: !!condition,
        });
        console.log("Current page:", {
          url: window.location.href,
          title: getCurrentPageTitle(),
        });
      }

      // Custom condition function (most flexible)
      if (condition && typeof condition === "function") {
        try {
          const result = condition();
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(`Custom condition result: ${result}`);
            console.groupEnd();
          }
          return result;
        } catch (error) {
          console.error(`❌ Custom condition error for "${config.id}":`, error);
          if (window.SimpleButtonRegistry?.debugMode) {
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
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(`Condition "${conditionName}": ${hasCondition}`);
          }
          return hasCondition;
        });

        const shouldShow = conditionResults.some((result) => result);
        if (window.SimpleButtonRegistry?.debugMode) {
          console.log(
            `showOn evaluation: ${shouldShow} (${conditionResults.join(", ")})`
          );
        }

        if (!shouldShow) {
          if (window.SimpleButtonRegistry?.debugMode) {
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
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log(`Hide condition "${conditionName}": ${shouldHide}`);
          }
          return shouldHide;
        });

        const shouldHide = hideResults.some((result) => result);
        if (window.SimpleButtonRegistry?.debugMode) {
          console.log(
            `hideOn evaluation: ${shouldHide} (${hideResults.join(", ")})`
          );
        }

        if (shouldHide) {
          if (window.SimpleButtonRegistry?.debugMode) {
            console.log("❌ Button hidden by hideOn rules");
            console.groupEnd();
          }
          return false;
        }
      }

      if (window.SimpleButtonRegistry?.debugMode) {
        console.log("✅ Button should be visible");
        console.groupEnd();
      }

      return true; // Default: show button
    }

    createAndPlaceButton(config, stackName, stackIndex) {
      const button = document.createElement("button");
      button.textContent = config.text;

      // Get position from stack configuration
      const stackConfig = BUTTON_STACKS[stackName];
      const position = stackConfig.positions[stackIndex];

      // Base styling
      Object.assign(button.style, {
        position: "absolute",
        padding: "8px 12px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: "10000",
        userSelect: "none",
        transition: "all 200ms ease",
        whiteSpace: "nowrap",
      });

      // Apply custom styles
      if (config.style) {
        Object.assign(button.style, config.style);
      }

      // RESTORED: Smart positioning logic
      if (position.x < 0) {
        // Right-aligned positioning
        button.style.right = `${Math.abs(position.x)}px`;
        button.style.left = "auto";
      } else {
        // Left-aligned positioning
        button.style.left = `${position.x}px`;
        button.style.right = "auto";
      }
      button.style.top = `${position.y}px`;

      // Click handler
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          config.onClick({
            buttonId: config.id,
            buttonStack: stackName,
            buttonPosition: stackIndex + 1,
            currentPage: {
              url: window.location.href,
              title: getCurrentPageTitle(),
            },
          });
        } catch (error) {
          console.error(`❌ Button "${config.id}" click error:`, error);
        }
      });

      // Hover effects
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });

      // Add to DOM and track
      this.container.appendChild(button);
      this.activeButtons.set(config.id, button);

      console.log(
        `✅ Button "${config.id}" placed at ${stackName} #${stackIndex + 1} (${
          position.x
        }, ${position.y})`
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
      if (this.container) {
        this.rebuildAllButtons();
      }

      console.log(
        `✅ Button "${id}" registered for ${stack} stack${
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
          title: getCurrentPageTitle(),
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

      console.log("Test buttons registered");
      console.log("Registry status:", window.SimpleButtonRegistry.getStatus());

      // Clean up after 10 seconds
      setTimeout(() => {
        manager.cleanup();
        console.log("Test cleaned up");
      }, 10000);
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
  };

  console.log(
    `✅ ${EXTENSION_NAME} v${EXTENSION_VERSION} loaded - Simple & Clean! 🎯`
  );
})();
