// ===================================================================
// Enhanced Button Utility Extension 1.6 - Event-Driven & Context-Aware
// 🧙‍♂️ FIXED WITH SANDBOX WISDOM - No more positioning issues!
// With Username Page Detection
// ===================================================================

(() => {
  "use strict";

  // ==================== CONFIGURATION ====================

  const EXTENSION_NAME = "Enhanced Button Utility";
  const EXTENSION_VERSION = "1.6.1"; // Incremented for the fix
  const ANIMATION_DURATION = 200;

  // 🧙‍♂️ SANDBOX WISDOM: Fixed button stack configuration
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

  // ==================== USERNAME PAGE DETECTION ====================

  /**
   * 📄 Get current page title from URL or DOM
   */
  const getCurrentPageTitle = () => {
    try {
      // Method 1: Extract from URL (most reliable)
      const url = window.location.href;
      const pageMatch = url.match(/\/page\/([^/?#]+)/);
      if (pageMatch) {
        return decodeURIComponent(pageMatch[1]);
      }

      // Method 2: Extract from page title element (fallback)
      const titleElement = document.querySelector(
        ".roam-article h1, .rm-page-title"
      );
      if (titleElement) {
        return titleElement.textContent?.trim();
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to get current page title:", error);
      return null;
    }
  };

  /**
   * 👤 Get current user's display name using Extension 1.5 or Roam API
   */
  const getCurrentUserDisplayName = () => {
    try {
      // Method 1: Use Extension 1.5 getCurrentUser utility (preferred)
      const platform = window.RoamExtensionSuite;
      if (platform) {
        const getCurrentUser = platform.getUtility("getCurrentUser");
        if (getCurrentUser) {
          const user = getCurrentUser();
          if (user && user.displayName) {
            return user.displayName;
          }
        }
      }

      // Method 2: Use Roam Alpha API directly (fallback)
      if (window.roamAlphaAPI && window.roamAlphaAPI.graph) {
        const user = window.roamAlphaAPI.graph.getUser?.();
        if (user && user.displayName) {
          return user.displayName;
        }
        if (user && user.email) {
          // Sometimes displayName isn't set, use email as fallback
          return user.email.split("@")[0]; // Use part before @ as username
        }
      }

      // Method 3: DOM scanning (last resort)
      const userMenuButton = document.querySelector(
        'button[data-testid="user-menu"]'
      );
      if (userMenuButton) {
        const userName = userMenuButton.textContent?.trim();
        if (userName && userName !== "User") {
          return userName;
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to get current user display name:", error);
      return null;
    }
  };

  /**
   * 🚫 Check if page is a system page (not a username)
   */
  const isSystemPage = (pageTitle) => {
    const systemPagePatterns = [
      /^roam\//i, // roam/settings, roam/depot, etc.
      /^help/i, // help pages
      /^settings/i, // settings pages
      /^extensions/i, // extension pages
      /^search/i, // search pages
      /^\[\[/, // block reference pages
      /^#/, // tag pages
      /^\(\(/, // alias pages
    ];

    return systemPagePatterns.some((pattern) => pattern.test(pageTitle));
  };

  /**
   * 📅 Check if page is a daily note
   */
  const isDailyNotePage = (pageTitle) => {
    // Common daily note patterns
    const dailyNotePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th),?\s+\d{4}$/i, // Month DD, YYYY
      /^\w+\s+\d{1,2}(st|nd|rd|th),?\s+\d{4}$/i, // Weekday Month DD, YYYY
    ];

    return dailyNotePatterns.some((pattern) => pattern.test(pageTitle));
  };

  /**
   * 🤔 Heuristic check if page title looks like a username
   * Used as fallback when Extension 1.5 utilities aren't available
   */
  const isLikelyUsername = (pageTitle) => {
    // Basic username patterns
    const usernamePatterns = [
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // First Last
      /^[A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+$/, // First M. Last
      /^[a-zA-Z][a-zA-Z0-9_-]{2,}$/, // username123, user_name, etc.
    ];

    // Should be reasonable length for a name
    if (pageTitle.length < 2 || pageTitle.length > 50) return false;

    // Check patterns
    return usernamePatterns.some((pattern) => pattern.test(pageTitle));
  };

  /**
   * 👥 Check if page title matches a known graph member
   * Uses Extension 1.5 utilities for authoritative member list
   */
  const isKnownGraphMember = (pageTitle) => {
    try {
      // Get Extension 1.5 platform
      const platform = window.RoamExtensionSuite;
      if (!platform) {
        console.warn(
          "⚠️ Extension 1.5 platform not found, falling back to basic check"
        );
        return isLikelyUsername(pageTitle);
      }

      // Method 1: Check curated member list (most reliable)
      const getGraphMembersFromList = platform.getUtility(
        "getGraphMembersFromList"
      );
      if (getGraphMembersFromList) {
        try {
          const curatedMembers = getGraphMembersFromList(
            "roam/graph members",
            "Directory"
          );
          if (curatedMembers && curatedMembers.length > 0) {
            return curatedMembers.includes(pageTitle);
          }
        } catch (error) {
          console.warn("⚠️ Curated member list check failed:", error);
        }
      }

      // Method 2: Check all graph members (fallback)
      const getGraphMembers = platform.getUtility("getGraphMembers");
      if (getGraphMembers) {
        try {
          const allMembers = getGraphMembers();
          return allMembers.includes(pageTitle);
        } catch (error) {
          console.warn("⚠️ Graph members check failed:", error);
        }
      }

      // Method 3: Pattern-based heuristic (last resort)
      return isLikelyUsername(pageTitle);
    } catch (error) {
      console.error("❌ Graph member check error:", error);
      return isLikelyUsername(pageTitle);
    }
  };

  /**
   * 🔍 Determine if current page is an official username page
   * Uses Extension 1.5 utilities for reliable detection
   */
  const isOfficialUsernamePage = () => {
    try {
      // Get current page title from URL
      const currentPageTitle = getCurrentPageTitle();
      if (!currentPageTitle) return false;

      // Quick checks first (performance optimization)
      if (isSystemPage(currentPageTitle)) return false;
      if (isDailyNotePage(currentPageTitle)) return false;

      // Check against known graph members
      return isKnownGraphMember(currentPageTitle);
    } catch (error) {
      console.error("❌ Username page detection error:", error);
      return false;
    }
  };

  /**
   * 🏠 Check if current user is on their OWN username page
   */
  const isCurrentUserOnOwnPage = () => {
    try {
      const currentPageTitle = getCurrentPageTitle();
      const currentUser = getCurrentUserDisplayName();

      if (!currentPageTitle || !currentUser) return false;

      // Direct match
      if (currentPageTitle === currentUser) return true;

      // Handle email-based usernames (sometimes Roam uses email as display name)
      if (currentUser.includes("@")) {
        const emailUsername = currentUser.split("@")[0];
        if (currentPageTitle === emailUsername) return true;
      }

      // Handle display name variations
      if (currentPageTitle.toLowerCase() === currentUser.toLowerCase())
        return true;

      return false;
    } catch (error) {
      console.error("❌ Own page detection error:", error);
      return false;
    }
  };

  /**
   * ⚙️ Check if current user is on their OWN user preferences page
   */
  const isCurrentUserOnOwnPreferencesPage = () => {
    try {
      const currentPageTitle = getCurrentPageTitle();
      const currentUser = getCurrentUserDisplayName();

      if (!currentPageTitle || !currentUser) return false;

      // Common user preferences page patterns
      const preferencesPatterns = [
        `${currentUser}/user preferences`,
        `${currentUser}/preferences`,
        `${currentUser}/settings`,
        `${currentUser}/profile settings`,
        `${currentUser}/user settings`,
      ];

      // Check case-insensitive matches
      const lowerPageTitle = currentPageTitle.toLowerCase();
      return preferencesPatterns.some(
        (pattern) => lowerPageTitle === pattern.toLowerCase()
      );
    } catch (error) {
      console.error("❌ Own preferences page detection error:", error);
      return false;
    }
  };

  // ==================== CONTEXT DETECTION ENGINE ====================

  class ContextDetectionEngine {
    constructor() {
      this.contextDetectors = new Map();
      this.setupBuiltInDetectors();
    }

    setupBuiltInDetectors() {
      // 📄 Main pages (primary content areas)
      this.registerContextDetector("main-pages", () => {
        const hasMainContainer = !!document.querySelector(".roam-article");
        const isNotSystemPage = !this.isSystemPage();
        return hasMainContainer && isNotSystemPage;
      });

      // 📅 Daily notes
      this.registerContextDetector("daily-notes", () => {
        const url = window.location.href;
        const datePatterns = [
          /\/page\/\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
          /\/page\/\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
          /\/page\/[A-Z][a-z]+\s+\d{1,2}(st|nd|rd|th),?\s+\d{4}/, // Month DD, YYYY
        ];
        return (
          datePatterns.some((pattern) => pattern.test(url)) ||
          !!document.querySelector(".roam-log-container")
        );
      });

      // 📖 Page views (specific pages, not daily notes)
      this.registerContextDetector("page-views", () => {
        const url = window.location.href;
        const hasPagePath = url.includes("/page/");
        const isNotDailyNote = !this.hasContext("daily-notes");
        return hasPagePath && isNotDailyNote && !this.isSystemPage();
      });

      // ⚙️ Settings pages
      this.registerContextDetector("settings", () => {
        const url = window.location.href;
        return (
          url.includes("/settings") ||
          url.includes("roam/settings") ||
          !!document.querySelector(
            '.roam-sidebar-content[data-testid="settings"]'
          )
        );
      });

      // 🔧 Extensions/depot pages
      this.registerContextDetector("extensions", () => {
        const url = window.location.href;
        return (
          url.includes("/extensions") ||
          url.includes("roam/depot") ||
          !!document.querySelector(".roam-extensions")
        );
      });

      // ❓ Help pages
      this.registerContextDetector("help", () => {
        const url = window.location.href;
        return (
          url.includes("/help") ||
          url.includes("roam/help") ||
          !!document.querySelector(".roam-help-content")
        );
      });

      // 🔍 Search pages
      this.registerContextDetector("search", () => {
        const url = window.location.href;
        return (
          url.includes("/search") ||
          !!document.querySelector(".rm-find-or-create-wrapper")
        );
      });

      // 🎯 Block focus mode
      this.registerContextDetector("block-focus", () => {
        return (
          !!document.querySelector(
            ".roam-block-container .block-highlight-blue"
          ) &&
          !document.querySelector(".roam-block-container .block-highlight-blue")
        );
      });

      // 📊 Graph view
      this.registerContextDetector("graph-view", () => {
        const url = window.location.href;
        return (
          url.includes("/graph") || !!document.querySelector(".roam-graph-view")
        );
      });

      // 🔗 Block references
      this.registerContextDetector("block-references", () => {
        return !!document.querySelector(".rm-reference-main");
      });

      // 👥 USERNAME PAGE DETECTORS (NEW!)
      this.registerContextDetector("username-pages", () => {
        return isOfficialUsernamePage();
      });

      this.registerContextDetector("own-username-page", () => {
        return isCurrentUserOnOwnPage();
      });

      this.registerContextDetector("own-user-preferences-page", () => {
        return isCurrentUserOnOwnPreferencesPage();
      });
    }

    registerContextDetector(name, detector) {
      if (typeof detector !== "function") {
        throw new Error(`Context detector "${name}" must be a function`);
      }

      this.contextDetectors.set(name, detector);
      if (window.RoamButtonRegistry?.debugMode) {
        console.log(`✅ Registered context detector: ${name}`);
      }
    }

    detectCurrentContext() {
      const activeContexts = new Set();

      this.contextDetectors.forEach((detector, name) => {
        try {
          if (detector()) {
            activeContexts.add(name);
          }
        } catch (error) {
          console.error(`❌ Context detector "${name}" error:`, error);
        }
      });

      return activeContexts;
    }

    isSystemPage() {
      const url = window.location.href;
      const systemPages = [
        "/settings",
        "/help",
        "/extensions",
        "roam/depot",
        "roam/settings",
        "roam/help",
      ];
      return systemPages.some((page) => url.includes(page));
    }

    hasContext(contextName) {
      const detector = this.contextDetectors.get(contextName);
      if (!detector) {
        console.warn(`❌ Unknown context: ${contextName}`);
        return false;
      }

      try {
        return detector();
      } catch (error) {
        console.error(`❌ Context check "${contextName}" error:`, error);
        return false;
      }
    }

    getAvailableContexts() {
      return Array.from(this.contextDetectors.keys());
    }
  }

  // ==================== EVENT-DRIVEN PAGE MONITOR ====================

  class EventDrivenPageMonitor {
    constructor(contextEngine) {
      this.contextEngine = contextEngine;
      this.isMonitoring = false;
      this.currentContext = new Set();
      this.changeCallbacks = new Set();
      this.urlChangeHandlers = new Set();
      this.mutationObserver = null;
      this.verificationInterval = null;
    }

    startMonitoring() {
      if (this.isMonitoring) return;

      this.setupURLEventListeners();
      this.setupDOMContextMonitoring();
      this.setupPeriodicVerification();
      this.isMonitoring = true;

      // Initial context detection
      this.handleContextChange();

      if (window.RoamButtonRegistry?.debugMode) {
        console.log("🚀 Event-driven page monitoring started");
      }
    }

    stopMonitoring() {
      if (!this.isMonitoring) return;

      // Clean up URL listeners
      window.removeEventListener("popstate", this.boundHandleURLChange);
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
      }

      // Clean up DOM observer
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      // Clean up verification interval
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
        this.verificationInterval = null;
      }

      this.isMonitoring = false;

      if (window.RoamButtonRegistry?.debugMode) {
        console.log("🛑 Page monitoring stopped");
      }
    }

    setupURLEventListeners() {
      // Browser back/forward navigation
      this.boundHandleURLChange = this.handleURLChange.bind(this);
      window.addEventListener("popstate", this.boundHandleURLChange);

      // SPA navigation (pushState/replaceState)
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;

      const self = this;

      history.pushState = function (...args) {
        self.originalPushState.apply(history, args);
        setTimeout(() => self.handleURLChange(), 10);
      };

      history.replaceState = function (...args) {
        self.originalReplaceState.apply(history, args);
        setTimeout(() => self.handleURLChange(), 10);
      };
    }

    setupDOMContextMonitoring() {
      // Watch for significant DOM changes that might affect context
      this.mutationObserver = new MutationObserver((mutations) => {
        let significantChange = false;

        for (const mutation of mutations) {
          // Check for Roam container changes
          if (mutation.type === "childList") {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);

            const hasRoamContainers = [...addedNodes, ...removedNodes].some(
              (node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return false;
                return (
                  node.classList?.contains("roam-article") ||
                  node.classList?.contains("roam-main") ||
                  node.classList?.contains("rm-reference-main") ||
                  node.querySelector?.(
                    ".roam-article, .roam-main, .rm-reference-main"
                  )
                );
              }
            );

            if (hasRoamContainers) {
              significantChange = true;
              break;
            }
          }
        }

        if (significantChange) {
          setTimeout(() => this.handleContextChange(), 50);
        }
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }

    setupPeriodicVerification() {
      // Light verification every 5 seconds (vs heavy 500ms polling!)
      this.verificationInterval = setInterval(() => {
        this.handleContextChange();
      }, 5000);
    }

    handleURLChange() {
      // Debounce rapid URL changes
      clearTimeout(this.urlChangeTimeout);
      this.urlChangeTimeout = setTimeout(() => {
        this.handleContextChange();
      }, 100);
    }

    handleContextChange() {
      const newContext = this.contextEngine.detectCurrentContext();

      // Compare contexts
      const added = new Set(
        [...newContext].filter((c) => !this.currentContext.has(c))
      );
      const removed = new Set(
        [...this.currentContext].filter((c) => !newContext.has(c))
      );

      if (added.size > 0 || removed.size > 0) {
        const change = {
          addedContexts: added,
          removedContexts: removed,
          currentContext: newContext,
        };

        this.currentContext = newContext;

        // Notify all change callbacks
        this.changeCallbacks.forEach((callback) => {
          try {
            callback(change);
          } catch (error) {
            console.error("❌ Context change callback error:", error);
          }
        });

        if (
          window.RoamButtonRegistry?.debugMode &&
          (added.size > 0 || removed.size > 0)
        ) {
          console.log("🔄 Context change:", {
            added: Array.from(added),
            removed: Array.from(removed),
            current: Array.from(newContext),
          });
        }
      }
    }

    onContextChange(callback) {
      if (typeof callback !== "function") {
        throw new Error("Context change callback must be a function");
      }
      this.changeCallbacks.add(callback);
      return () => this.changeCallbacks.delete(callback);
    }

    getCurrentContext() {
      return new Set(this.currentContext);
    }
  }

  // ==================== BUTTON DISPLACEMENT ENGINE ====================

  class ButtonDisplacementEngine {
    constructor(registry) {
      this.registry = registry;
      this.animationDuration = ANIMATION_DURATION;
      this.displacementQueue = [];
      this.processing = false;
    }

    async processDisplacement(
      triggerButtonId,
      triggerStack,
      isPriority = false
    ) {
      if (this.processing) {
        this.displacementQueue.push({
          triggerButtonId,
          triggerStack,
          isPriority,
        });
        return;
      }

      this.processing = true;
      if (window.RoamButtonRegistry?.debugMode) {
        console.log(
          `🔄 Displacement: Processing ${
            isPriority ? "priority" : "normal"
          } button "${triggerButtonId}" in ${triggerStack}`
        );
      }

      try {
        const stackConfig = BUTTON_STACKS[triggerStack];
        const buttons = this.registry.stacks[triggerStack];

        if (buttons.length > stackConfig.maxButtons) {
          // Determine displacement strategy
          if (isPriority) {
            await this.handlePriorityDisplacement(
              triggerStack,
              triggerButtonId
            );
          } else {
            await this.handleOverflowDisplacement(triggerStack);
          }
        }

        // Update positions for all buttons in stack
        this.registry.updateStackPositions(triggerStack);
      } catch (error) {
        console.error(`❌ Displacement processing error:`, error);
      } finally {
        this.processing = false;

        // Process next in queue
        if (this.displacementQueue.length > 0) {
          const next = this.displacementQueue.shift();
          setTimeout(
            () =>
              this.processDisplacement(
                next.triggerButtonId,
                next.triggerStack,
                next.isPriority
              ),
            10
          );
        }
      }
    }

    async handlePriorityDisplacement(stack, priorityButtonId) {
      const buttons = this.registry.stacks[stack];
      const stackConfig = BUTTON_STACKS[stack];

      // Move priority button to front
      const priorityIndex = buttons.findIndex((b) => b.id === priorityButtonId);
      if (priorityIndex > 0) {
        const priorityButton = buttons.splice(priorityIndex, 1)[0];
        buttons.unshift(priorityButton);
      }

      // Hide overflow buttons
      while (buttons.length > stackConfig.maxButtons) {
        const displaced = buttons.pop();
        await this.hideButton(displaced, "priority-displaced");
      }
    }

    async handleOverflowDisplacement(stack) {
      const buttons = this.registry.stacks[stack];
      const stackConfig = BUTTON_STACKS[stack];

      // Hide oldest buttons first (FIFO)
      while (buttons.length > stackConfig.maxButtons) {
        const displaced = buttons.shift();
        await this.hideButton(displaced, "overflow-displaced");
      }
    }

    async hideButton(buttonConfig, reason) {
      if (buttonConfig.element) {
        // Animate out
        buttonConfig.element.style.transition = `opacity ${this.animationDuration}ms ease-out`;
        buttonConfig.element.style.opacity = "0";

        await new Promise((resolve) =>
          setTimeout(resolve, this.animationDuration)
        );

        buttonConfig.element.style.display = "none";
        buttonConfig.visible = false;

        // Trigger displacement callback
        if (buttonConfig.onDisplaced) {
          try {
            buttonConfig.onDisplaced(buttonConfig.stack, "hidden", reason);
          } catch (error) {
            console.error(
              `❌ Displacement callback error for "${buttonConfig.id}":`,
              error
            );
          }
        }

        if (window.RoamButtonRegistry?.debugMode) {
          console.log(`📤 Button "${buttonConfig.id}" displaced: ${reason}`);
        }
      }
    }
  }

  // ==================== MAIN BUTTON REGISTRY ====================

  class RoamButtonRegistry {
    constructor() {
      this.buttons = new Map();
      this.stacks = {
        "top-left": [],
        "top-right": [],
      };
      this.container = null;
      this.initialized = false;
      this.debugMode = false;

      // Initialize subsystems
      this.contextEngine = new ContextDetectionEngine();
      this.pageMonitor = new EventDrivenPageMonitor(this.contextEngine);
      this.displacementEngine = new ButtonDisplacementEngine(this);

      // Set up context monitoring
      this.pageMonitor.onContextChange((change) => {
        this.handleContextChange(change);
      });
    }

    async initialize() {
      if (this.initialized) return true;

      try {
        await this.setupContainer();
        this.pageMonitor.startMonitoring();
        this.initialized = true;

        if (this.debugMode) {
          console.log("✅ RoamButtonRegistry initialized");
        }
        return true;
      } catch (error) {
        console.error("❌ Registry initialization failed:", error);
        return false;
      }
    }

    // 🧙‍♂️ SANDBOX WISDOM: Completely rewritten setupContainer method
    async setupContainer() {
      // 🧙‍♂️ SANDBOX WISDOM: Find the content area, not the viewport!
      this.container = this.findBestContainer();

      if (!this.container) {
        console.error("❌ No suitable container found for button registry");
        throw new Error("Button container setup failed");
      }

      if (this.debugMode) {
        console.log(`✅ Container found: ${this.container.selector}`);
      }

      // 🧙‍♂️ SANDBOX WISDOM: Use relative positioning within content area
      if (getComputedStyle(this.container.element).position === "static") {
        this.container.element.style.position = "relative";
      }

      if (this.debugMode) {
        console.log("✅ Button container configured with sandbox wisdom");
      }
    }

    // 🧙‍♂️ SANDBOX WISDOM: Add the genius container discovery method
    findBestContainer() {
      // 🧙‍♂️ SANDBOX WISDOM: Try content areas in order of preference
      const candidates = [
        ".roam-article", // Main content area (best choice)
        ".roam-main .roam-article", // Article within main
        ".rm-article-wrapper", // Alternative article wrapper
        ".roam-main", // Main area fallback
        ".rm-reference-main", // Reference area fallback
      ];

      for (const selector of candidates) {
        const element = document.querySelector(selector);
        if (element) {
          // 🧙‍♂️ SANDBOX WISDOM: Validate container size (avoid tiny elements)
          const rect = element.getBoundingClientRect();
          if (rect.width > 400 && rect.height > 200) {
            return {
              element,
              selector,
              rect,
            };
          }
        }
      }

      return null;
    }

    handleContextChange(change) {
      // Update visibility for all buttons based on new context
      this.buttons.forEach((buttonConfig) => {
        this.updateButtonVisibility(buttonConfig, change.currentContext);
      });
    }

    updateButtonVisibility(buttonConfig, currentContext) {
      if (!buttonConfig.contextRules) {
        buttonConfig.visible = true;
        this.showButton(buttonConfig);
        return;
      }

      const { showOn, hideOn, requires } = buttonConfig.contextRules;
      let shouldShow = true;

      // Check showOn rules
      if (showOn && Array.isArray(showOn)) {
        shouldShow = showOn.some((context) => currentContext.has(context));
      }

      // Check hideOn rules (overrides showOn)
      if (shouldShow && hideOn && Array.isArray(hideOn)) {
        shouldShow = !hideOn.some((context) => currentContext.has(context));
      }

      // Check requires rules (DOM elements must exist)
      if (shouldShow && requires && Array.isArray(requires)) {
        shouldShow = requires.every((selector) =>
          document.querySelector(selector)
        );
      }

      // Update button visibility
      if (shouldShow && !buttonConfig.visible) {
        this.showButton(buttonConfig);
      } else if (!shouldShow && buttonConfig.visible) {
        this.hideButton(buttonConfig);
      }
    }

    async showButton(buttonConfig) {
      if (!buttonConfig.element || buttonConfig.visible) return;

      buttonConfig.element.style.display = "block";
      buttonConfig.element.style.transition = `opacity ${ANIMATION_DURATION}ms ease-in`;
      buttonConfig.element.style.opacity = "1";
      buttonConfig.visible = true;

      // Trigger show callback
      if (buttonConfig.onShow) {
        try {
          buttonConfig.onShow();
        } catch (error) {
          console.error(
            `❌ Show callback error for "${buttonConfig.id}":`,
            error
          );
        }
      }

      if (this.debugMode) {
        console.log(`👁️ Button "${buttonConfig.id}" shown`);
      }
    }

    async hideButton(buttonConfig) {
      if (!buttonConfig.element || !buttonConfig.visible) return;

      buttonConfig.element.style.transition = `opacity ${ANIMATION_DURATION}ms ease-out`;
      buttonConfig.element.style.opacity = "0";

      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

      buttonConfig.element.style.display = "none";
      buttonConfig.visible = false;

      // Trigger hide callback
      if (buttonConfig.onHide) {
        try {
          buttonConfig.onHide();
        } catch (error) {
          console.error(
            `❌ Hide callback error for "${buttonConfig.id}":`,
            error
          );
        }
      }

      if (this.debugMode) {
        console.log(`🙈 Button "${buttonConfig.id}" hidden`);
      }
    }

    async registerButton(config) {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        id,
        text,
        onClick,
        stack = "top-right",
        priority = false,
        style = {},
        contextRules = {},
        onShow,
        onHide,
        onDisplaced,
        onRemoved,
      } = config;

      // Validation
      if (!id || !text || !onClick) {
        throw new Error("Button must have id, text, and onClick");
      }

      if (this.buttons.has(id)) {
        throw new Error(`Button "${id}" already registered`);
      }

      if (!BUTTON_STACKS[stack]) {
        throw new Error(`Invalid stack: ${stack}`);
      }

      // Create button configuration
      const buttonConfig = {
        id,
        text,
        onClick,
        stack,
        priority,
        style,
        contextRules,
        onShow,
        onHide,
        onDisplaced,
        onRemoved,
        element: null,
        visible: false,
        position: null,
      };

      // Create button element
      this.createButtonElement(buttonConfig);

      // Add to registry and stack
      this.buttons.set(id, buttonConfig);

      if (priority) {
        this.stacks[stack].unshift(buttonConfig);
      } else {
        this.stacks[stack].push(buttonConfig);
      }

      // Handle displacement if necessary
      await this.displacementEngine.processDisplacement(id, stack, priority);

      // Update visibility based on current context
      const currentContext = this.pageMonitor.getCurrentContext();
      this.updateButtonVisibility(buttonConfig, currentContext);

      if (this.debugMode) {
        console.log(
          `✅ Button "${id}" registered at ${stack} #${buttonConfig.position}`
        );
      }

      return {
        success: true,
        id: buttonConfig.id,
        position: buttonConfig.position,
        stack: buttonConfig.stack,
        element: buttonConfig.element,
        visible: buttonConfig.visible,
      };
    }

    createButtonElement(buttonConfig) {
      const button = document.createElement("button");
      button.textContent = buttonConfig.text;
      button.style.cssText = `
        position: absolute;
        padding: 8px 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 200ms ease;
        z-index: 10000;
        display: none;
        opacity: 0;
        user-select: none;
        white-space: nowrap;
        ${Object.entries(buttonConfig.style)
          .map(
            ([key, value]) =>
              `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
          )
          .join("; ")}
      `;

      // Hover effects
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });

      // Click handling with enhanced event data
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          const enhancedEvent = {
            originalEvent: e,
            buttonId: buttonConfig.id,
            buttonPosition: buttonConfig.position,
            buttonStack: buttonConfig.stack,
            currentContext: Array.from(this.pageMonitor.getCurrentContext()),
            registryVersion: EXTENSION_VERSION,
          };

          buttonConfig.onClick(enhancedEvent);
        } catch (error) {
          console.error(`💥 Button "${buttonConfig.id}" click error:`, error);
        }
      });

      // 🧙‍♂️ SANDBOX WISDOM: Append to content container, not overlay
      this.container.element.appendChild(button);
      buttonConfig.element = button;
    }

    updateStackPositions(stack) {
      const stackConfig = BUTTON_STACKS[stack];
      const buttons = this.stacks[stack];

      buttons.forEach((buttonConfig, index) => {
        if (index < stackConfig.positions.length && buttonConfig.element) {
          const pos = stackConfig.positions[index];

          if (pos.x < 0) {
            buttonConfig.element.style.right = `${Math.abs(pos.x)}px`;
            buttonConfig.element.style.left = "auto";
          } else {
            buttonConfig.element.style.left = `${pos.x}px`;
            buttonConfig.element.style.right = "auto";
          }

          buttonConfig.element.style.top = `${pos.y}px`;
          buttonConfig.position = index + 1;

          if (this.debugMode) {
            console.log(
              `📍 Button "${buttonConfig.id}" positioned at ${stack} #${
                index + 1
              } (y: ${pos.y}px)`
            );
          }
        }
      });
    }

    removeButton(id) {
      const buttonConfig = this.buttons.get(id);
      if (!buttonConfig) return false;

      // Remove from DOM
      if (buttonConfig.element) {
        buttonConfig.element.remove();
      }

      // Remove from stack
      const stack = buttonConfig.stack;
      const stackIndex = this.stacks[stack].findIndex((b) => b.id === id);
      if (stackIndex !== -1) {
        this.stacks[stack].splice(stackIndex, 1);
        this.updateStackPositions(stack);
      }

      // Remove from registry
      this.buttons.delete(id);

      // Trigger removal callback
      if (buttonConfig.onRemoved) {
        try {
          buttonConfig.onRemoved("manual");
        } catch (error) {
          console.error(`❌ Removal callback error for "${id}":`, error);
        }
      }

      if (this.debugMode) {
        console.log(`🗑️ Button "${id}" removed`);
      }

      return true;
    }

    getStatus() {
      return {
        initialized: this.initialized,
        totalButtons: this.buttons.size,
        monitoring: this.pageMonitor.isMonitoring,
        currentContext: Array.from(this.pageMonitor.getCurrentContext()),
        stacks: {
          "top-left": {
            buttons: this.stacks["top-left"].length,
            max: BUTTON_STACKS["top-left"].maxButtons,
            buttonIds: this.stacks["top-left"].map((b) => b.id),
          },
          "top-right": {
            buttons: this.stacks["top-right"].length,
            max: BUTTON_STACKS["top-right"].maxButtons,
            buttonIds: this.stacks["top-right"].map((b) => b.id),
          },
        },
        container: this.container?.selector || "none",
      };
    }

    clear() {
      if (this.debugMode) {
        console.log("🧹 Clearing all buttons from registry...");
      }

      this.buttons.forEach((buttonConfig) => {
        if (buttonConfig.element) {
          buttonConfig.element.remove();
        }
      });

      this.buttons.clear();
      this.stacks["top-left"] = [];
      this.stacks["top-right"] = [];

      if (this.debugMode) {
        console.log("✅ All buttons cleared");
      }
    }

    cleanup() {
      this.clear();
      this.pageMonitor.stopMonitoring();

      if (this.container?.element) {
        // 🧙‍♂️ SANDBOX WISDOM: Don't remove the content container!
        // Just reset its position if we modified it
        if (this.container.element.style.position === "relative") {
          this.container.element.style.position = "";
        }
        this.container = null;
      }

      this.initialized = false;

      if (this.debugMode) {
        console.log("🧹 Button registry cleaned up");
      }
    }
  }

  // ==================== EXTENSION BUTTON MANAGER ====================

  class ExtensionButtonManager {
    constructor(extensionName) {
      this.extensionName = extensionName;
      this.registry = null;
      this.registeredButtons = new Set();
    }

    async initialize() {
      if (!window.RoamButtonRegistry) {
        window.RoamButtonRegistry = new RoamButtonRegistry();
      }

      this.registry = window.RoamButtonRegistry;
      await this.registry.initialize();

      return true;
    }

    async registerButton(config) {
      if (!this.registry) {
        await this.initialize();
      }

      // Prefix button ID with extension name
      const prefixedId = `${this.extensionName}-${config.id}`;
      const prefixedConfig = {
        ...config,
        id: prefixedId,
      };

      const result = await this.registry.registerButton(prefixedConfig);

      if (result.success) {
        this.registeredButtons.add(prefixedId);
      }

      return result;
    }

    removeButton(id) {
      const prefixedId = `${this.extensionName}-${id}`;
      const success = this.registry?.removeButton(prefixedId);

      if (success) {
        this.registeredButtons.delete(prefixedId);
      }

      return success;
    }

    cleanup() {
      this.registeredButtons.forEach((buttonId) => {
        this.registry?.removeButton(buttonId);
      });
      this.registeredButtons.clear();
    }

    getStatus() {
      return {
        extensionName: this.extensionName,
        registeredButtons: Array.from(this.registeredButtons),
        registryStatus: this.registry?.getStatus() || null,
      };
    }
  }

  // ==================== GLOBAL API ====================

  // Button Registry API
  window.ButtonRegistryAPI = {
    getRegistry: () => window.RoamButtonRegistry,
    getCapabilities: () => ({
      stacks: {
        "top-left": {
          available: BUTTON_STACKS["top-left"].maxButtons,
          maxButtons: BUTTON_STACKS["top-left"].maxButtons,
        },
        "top-right": {
          available: BUTTON_STACKS["top-right"].maxButtons,
          maxButtons: BUTTON_STACKS["top-right"].maxButtons,
        },
      },
      contexts:
        window.RoamButtonRegistry?.contextEngine?.getAvailableContexts() || [],
    }),
    registerContextDetector: (name, detector) => {
      window.RoamButtonRegistry?.contextEngine?.registerContextDetector(
        name,
        detector
      );
    },
    getAvailableContexts: () => {
      return (
        window.RoamButtonRegistry?.contextEngine?.getAvailableContexts() || []
      );
    },
    onContextChange: (callback) => {
      return window.RoamButtonRegistry?.pageMonitor?.onContextChange(callback);
    },
  };

  // Extension Button Manager
  window.ExtensionButtonManager = ExtensionButtonManager;

  // Username Detection API
  window.RoamUsernamePageDetection = {
    // General username detection
    isOfficialUsernamePage,
    getCurrentPageTitle,
    isKnownGraphMember,

    // Own page detection
    getCurrentUserDisplayName,
    isCurrentUserOnOwnPage,
    isCurrentUserOnOwnPreferencesPage,

    // Testing
    testUsernamePageDetection: () => {
      console.group("🧪 Testing Username Page Detection");

      const currentUser = getCurrentUserDisplayName();
      console.log(`🔍 Current user detected as: "${currentUser}"`);

      // Test general username detection
      console.log("\n📋 Testing general username page detection:");
      const testPages = [
        "Matt Brockwell",
        "John Smith",
        "user123",
        "roam/settings",
        "January 1st, 2024",
        "2024-01-01",
        "help/getting-started",
        "#productivity",
      ];

      testPages.forEach((pageTitle) => {
        const isUsername = isKnownGraphMember(pageTitle);
        console.log(
          `📝 "${pageTitle}": ${isUsername ? "✅ Username" : "❌ Not username"}`
        );
      });

      console.groupEnd();
    },
  };

  // ==================== TESTING FUNCTIONS ====================

  window.EnhancedButtonUtilityTests = {
    testContextDetection: () => {
      const registry = window.RoamButtonRegistry;
      if (!registry) {
        console.error("❌ Button registry not initialized");
        return;
      }

      console.group("🧪 Testing Context Detection");

      const contexts = registry.contextEngine.getAvailableContexts();
      console.log("📋 Available contexts:", contexts);

      const currentContext = registry.pageMonitor.getCurrentContext();
      console.log("🎯 Current context:", Array.from(currentContext));

      console.groupEnd();
    },

    testContextAwareButton: async () => {
      const manager = new ExtensionButtonManager("TestExtension");
      await manager.initialize();

      const result = await manager.registerButton({
        id: "test-context-button",
        text: "🧪 Test Context",
        onClick: (e) => {
          console.log("Context button clicked!", e);
        },
        contextRules: {
          showOn: ["main-pages"],
          hideOn: ["settings"],
        },
      });

      console.log("Test context button result:", result);

      // Clean up after 5 seconds
      setTimeout(() => {
        manager.cleanup();
        console.log("Test button cleaned up");
      }, 5000);
    },

    showStatus: () => {
      const registry = window.RoamButtonRegistry;
      if (registry) {
        console.log("📊 Button Registry Status:", registry.getStatus());
      } else {
        console.log("❌ Button registry not found");
      }
    },
  };

  // ==================== INITIALIZATION ====================

  // Auto-initialize registry when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Registry will be initialized when first extension uses it
    });
  }

  console.log(
    `✅ ${EXTENSION_NAME} v${EXTENSION_VERSION} loaded with sandbox wisdom! 🧙‍♂️`
  );
})();
