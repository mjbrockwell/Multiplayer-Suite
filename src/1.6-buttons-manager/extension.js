// ===================================================================
// Simple Button Utility Extension 3.0 - Compound Button Support
// 🎯 NEW: Compound buttons with section support
// ✅ GUARANTEED: 100% backward compatibility with existing extensions
// 🔧 ENHANCED: Professional multi-section button architecture
// ===================================================================

(() => {
  "use strict";

  const EXTENSION_NAME = "Simple Button Utility";
  const EXTENSION_VERSION = "3.0.0"; // 🚀 NEW: Compound button support
  const ANIMATION_DURATION = 200;

  // ==================== SECTION TYPE DEFINITIONS ====================

  const SECTION_TYPES = {
    icon: {
      defaultStyle: {
        padding: "8px 10px",
        minWidth: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      purpose: "Configuration, status indicators",
    },
    main: {
      defaultStyle: {
        padding: "8px 16px",
        fontWeight: "600",
        flex: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      purpose: "Primary action button",
    },
    action: {
      defaultStyle: {
        padding: "8px 12px",
        minWidth: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      purpose: "Secondary actions",
    },
    dismiss: {
      defaultStyle: {
        padding: "8px 10px",
        color: "#8b4513",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "bold",
      },
      purpose: "Hide button (automatically added)",
    },
  };

  // ==================== CENTRALIZED PAGE TITLE DETECTION ====================

  function getCurrentPageTitle() {
    try {
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

      const url = window.location.href;
      const pageMatch = url.match(/\/page\/([^/?#]+)/);
      if (pageMatch) {
        const pageId = decodeURIComponent(pageMatch[1]);
        console.warn(`⚠️ Falling back to page ID (not title): "${pageId}"`);
        return pageId;
      }

      console.warn("❌ Could not determine page title");
      return null;
    } catch (error) {
      console.error("❌ Failed to get current page title:", error);
      return null;
    }
  }

  // ==================== BUTTON STACK POSITIONING ====================

  const BUTTON_STACKS = {
    "top-left": {
      maxButtons: 2,
      positions: [
        { x: 14, y: 6 },
        { x: 14, y: 54 },
      ],
    },
    "top-right": {
      maxButtons: 5,
      positions: [
        { x: -14, y: 6 },
        { x: -14, y: 54 },
        { x: -14, y: 102 },
        { x: -14, y: 150 },
        { x: -14, y: 198 },
      ],
    },
  };

  // ==================== PAGE CHANGE DETECTOR ====================

  class SimplePageChangeDetector {
    constructor() {
      this.currentUrl = window.location.href;
      this.currentTitle = document.title;
      this.listeners = new Set();
      this.isMonitoring = false;
    }

    startMonitoring() {
      if (this.isMonitoring) return;
      this.setupURLListeners();
      this.setupTitleListener();
      this.setupPeriodicCheck();
      this.isMonitoring = true;
      console.log("🚀 Simple page monitoring started");
    }

    stopMonitoring() {
      if (!this.isMonitoring) return;
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
      this.boundURLChange = () => this.checkForPageChange();
      window.addEventListener("popstate", this.boundURLChange);

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
      const self = this;
      this.titleObserver = new MutationObserver(() => {
        if (document.title !== self.currentTitle) {
          setTimeout(() => self.checkForPageChange(), 50);
        }
      });

      this.titleObserver.observe(document.head, {
        childList: true,
        subtree: true,
      });
    }

    setupPeriodicCheck() {
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

  // ==================== BUTTON CONDITIONS ====================

  const ButtonConditions = {
    isUsernamePage: () => {
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;

      if (window.GraphMemberCache?.isMember) {
        const isCachedMember = window.GraphMemberCache.isMember(pageTitle);
        if (window.SimpleButtonRegistry?.debugMode) {
          console.log(
            `🎯 Cache-based username detection for "${pageTitle}": ${isCachedMember}`
          );
        }
        return isCachedMember;
      }

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

    isChatRoom: () => {
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;
      const lowerTitle = pageTitle.toLowerCase();
      const containsChatRoom = lowerTitle.includes("chat room");
      if (window.SimpleButtonRegistry?.debugMode) {
        console.log(
          `🗨️ Chat room detection for "${pageTitle}": ${containsChatRoom}`
        );
      }
      return containsChatRoom;
    },

    isDailyNote: () => {
      const url = window.location.href;
      return (
        /\/page\/\d{2}-\d{2}-\d{4}/.test(url) ||
        /\/page\/\d{4}-\d{2}-\d{2}/.test(url) ||
        /\/page\/[A-Z][a-z]+.*\d{4}/.test(url)
      );
    },

    isMainPage: () => {
      return (
        !!document.querySelector(".roam-article") &&
        window.location.href.includes("/page/")
      );
    },

    isSettingsPage: () => {
      return (
        window.location.href.includes("/settings") ||
        window.location.href.includes("roam/settings")
      );
    },

    custom: (conditionFn) => {
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

  // ==================== SIMPLE BUTTON REGISTRY v3.0 ====================

  class SimpleButtonRegistry {
    constructor() {
      this.registeredButtons = new Map();
      this.activeButtons = new Map();
      this.stacks = { "top-left": [], "top-right": [] };
      this.container = null;
      this.debugMode = false;
      this.pageDetector = new SimplePageChangeDetector();

      this.pageDetector.onPageChange(() => {
        this.rebuildAllButtons();
      });
    }

    async initialize() {
      this.setupContainer();
      this.pageDetector.startMonitoring();
      this.rebuildAllButtons();
      console.log(
        "✅ Simple Button Registry v3.0 initialized with compound button support"
      );
      return true;
    }

    setupContainer() {
      this.container = null;
      console.log("✅ Container setup configured for dynamic detection");
    }

    getCurrentContainer() {
      const candidates = [
        ".roam-article",
        ".roam-main .roam-article",
        ".roam-main",
      ];
      for (const selector of candidates) {
        const element = document.querySelector(selector);
        if (element && document.contains(element)) {
          if (getComputedStyle(element).position === "static") {
            element.style.position = "relative";
          }
          return element;
        }
      }
      console.warn("⚠️ No suitable container found, using document.body");
      return document.body;
    }

    // ==================== CORE REBUILD LOGIC ====================

    rebuildAllButtons() {
      console.log("🔄 Rebuilding all buttons for current page...");
      if (this.debugMode) {
        console.log("📍 Current location:", {
          url: window.location.href,
          title: getCurrentPageTitle(),
        });
      }

      this.clearAllButtons();
      this.clearAllStacks();

      if (this.debugMode) {
        console.log(
          `📋 Evaluating ${this.registeredButtons.size} registered buttons`
        );
      }

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

      visibleButtons.sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return 0;
      });

      visibleButtons.forEach((config) => {
        this.assignButtonToStack(config);
      });

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
      Object.keys(this.stacks).forEach((stackName) => {
        this.stacks[stackName].forEach((config, index) => {
          this.createAndPlaceButton(config, stackName, index);
        });
      });
    }

    // ==================== ✨ NEW: COMPOUND BUTTON DETECTION ====================

    createAndPlaceButton(config, stackName, stackIndex) {
      // 🚀 NEW: Detection logic for simple vs compound buttons
      if (
        config.sections &&
        Array.isArray(config.sections) &&
        config.sections.length > 0
      ) {
        console.log(
          `🔧 Creating compound button "${config.id}" with ${config.sections.length} sections`
        );
        return this.createCompoundButton(config, stackName, stackIndex);
      } else {
        console.log(
          `🔧 Creating simple button "${config.id}" (backward compatible)`
        );
        return this.createSimpleButton(config, stackName, stackIndex);
      }
    }

    // ==================== ✅ SIMPLE BUTTON (100% BACKWARD COMPATIBLE) ====================

    createSimpleButton(config, stackName, stackIndex) {
      // ✅ EXACT v2.1 behavior - no changes to existing functionality
      const buttonContainer = document.createElement("div");
      buttonContainer.style.position = "absolute";
      buttonContainer.style.display = "flex";
      buttonContainer.style.alignItems = "center";
      buttonContainer.style.zIndex = "10000";

      const mainButton = document.createElement("button");
      mainButton.textContent = config.text;

      const stackConfig = BUTTON_STACKS[stackName];
      const position = stackConfig.positions[stackIndex];

      Object.assign(mainButton.style, {
        padding: "8px 12px",
        paddingRight: "32px",
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
        position: "relative",
      });

      if (config.style) {
        Object.assign(mainButton.style, config.style);
        if (!config.style.paddingRight) {
          mainButton.style.paddingRight = "32px";
        }
      }

      // Dismiss button (exact v2.1 behavior)
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
        color: #8b4513;
        font-size: 14px;
        font-weight: bold;
        border-radius: 2px;
        transition: all 150ms ease;
        user-select: none;
        line-height: 1;
      `;

      dismissButton.addEventListener("mouseenter", () => {
        dismissButton.style.backgroundColor = "rgba(139, 69, 19, 0.15)";
        dismissButton.style.color = "#6b4423";
      });

      dismissButton.addEventListener("mouseleave", () => {
        dismissButton.style.backgroundColor = "transparent";
        dismissButton.style.color = "#8b4513";
      });

      dismissButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🗑️ Dismissing simple button "${config.id}"`);
        if (buttonContainer.parentNode) {
          buttonContainer.remove();
        }
        this.activeButtons.delete(config.id);
        console.log(`✅ Simple button "${config.id}" dismissed`);
      });

      mainButton.appendChild(dismissButton);
      buttonContainer.appendChild(mainButton);

      // Position the container
      if (position.x < 0) {
        buttonContainer.style.right = `${Math.abs(position.x)}px`;
        buttonContainer.style.left = "auto";
      } else {
        buttonContainer.style.left = `${position.x}px`;
        buttonContainer.style.right = "auto";
      }
      buttonContainer.style.top = `${position.y}px`;

      // Main button click handler
      mainButton.addEventListener("click", (e) => {
        if (e.target === dismissButton) {
          return;
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
              title: getCurrentPageTitle(),
            },
          });
        } catch (error) {
          console.error(`❌ Simple button "${config.id}" click error:`, error);
        }
      });

      // Hover effects
      mainButton.addEventListener("mouseenter", () => {
        mainButton.style.transform = "translateY(-1px)";
        mainButton.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      mainButton.addEventListener("mouseleave", () => {
        mainButton.style.transform = "translateY(0)";
        mainButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });

      const container = this.getCurrentContainer();
      container.appendChild(buttonContainer);
      this.activeButtons.set(config.id, buttonContainer);

      console.log(
        `✅ Simple button "${config.id}" placed at ${stackName} #${
          stackIndex + 1
        }`
      );
    }

    // ==================== 🚀 NEW: COMPOUND BUTTON IMPLEMENTATION ====================

    createCompoundButton(config, stackName, stackIndex) {
      const buttonContainer = document.createElement("div");
      buttonContainer.style.position = "absolute";
      buttonContainer.style.display = "flex";
      buttonContainer.style.alignItems = "stretch";
      buttonContainer.style.zIndex = "10000";
      buttonContainer.style.borderRadius = "6px";
      buttonContainer.style.overflow = "hidden";
      buttonContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      buttonContainer.style.transition = "all 200ms ease";

      const stackConfig = BUTTON_STACKS[stackName];
      const position = stackConfig.positions[stackIndex];

      // Process sections and auto-add dismiss if not present
      let sections = [...config.sections];
      const hasDismissSection = sections.some(
        (section) => section.type === "dismiss"
      );
      if (!hasDismissSection) {
        sections.push({
          type: "dismiss",
          content: "×",
          onClick: () => this.dismissCompoundButton(config.id, buttonContainer),
        });
      }

      // Create each section
      sections.forEach((section, index) => {
        const sectionElement = this.createSection(
          section,
          index,
          sections.length,
          config,
          stackName,
          stackIndex
        );
        buttonContainer.appendChild(sectionElement);
      });

      // Position the container
      if (position.x < 0) {
        buttonContainer.style.right = `${Math.abs(position.x)}px`;
        buttonContainer.style.left = "auto";
      } else {
        buttonContainer.style.left = `${position.x}px`;
        buttonContainer.style.right = "auto";
      }
      buttonContainer.style.top = `${position.y}px`;

      // Container hover effects
      buttonContainer.addEventListener("mouseenter", () => {
        buttonContainer.style.transform = "translateY(-1px)";
        buttonContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      buttonContainer.addEventListener("mouseleave", () => {
        buttonContainer.style.transform = "translateY(0)";
        buttonContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });

      const container = this.getCurrentContainer();
      container.appendChild(buttonContainer);
      this.activeButtons.set(config.id, buttonContainer);

      console.log(
        `✅ Compound button "${config.id}" placed at ${stackName} #${
          stackIndex + 1
        } with ${sections.length} sections`
      );
    }

    createSection(
      section,
      index,
      totalSections,
      buttonConfig,
      stackName,
      stackIndex
    ) {
      const sectionElement = document.createElement("div");

      // Get section type configuration
      const sectionType = SECTION_TYPES[section.type] || SECTION_TYPES.action;

      // Apply base styling
      Object.assign(sectionElement.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 150ms ease",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        color: "#333",
        fontSize: "13px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        ...sectionType.defaultStyle,
      });

      // Apply custom section styles
      if (section.style) {
        Object.assign(sectionElement.style, section.style);
      }

      // Add visual separators between sections
      if (index > 0) {
        sectionElement.style.borderLeft = "1px solid rgba(0,0,0,0.1)";
      }

      // Set section content
      if (section.content) {
        if (typeof section.content === "string") {
          sectionElement.textContent = section.content;
        } else {
          sectionElement.appendChild(section.content);
        }
      }

      // Add tooltip if provided
      if (section.tooltip) {
        sectionElement.setAttribute("title", section.tooltip);
      }

      // Section-specific hover effects
      sectionElement.addEventListener("mouseenter", () => {
        switch (section.type) {
          case "dismiss":
            sectionElement.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
            sectionElement.style.color = "#dc3545";
            break;
          case "icon":
            sectionElement.style.backgroundColor = "rgba(255, 193, 7, 0.1)";
            break;
          case "main":
            sectionElement.style.backgroundColor = "rgba(0, 123, 255, 0.1)";
            break;
          default:
            sectionElement.style.backgroundColor = "rgba(108, 117, 125, 0.1)";
        }
      });

      sectionElement.addEventListener("mouseleave", () => {
        sectionElement.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        sectionElement.style.color =
          section.type === "dismiss" ? "#8b4513" : "#333";
      });

      // Click handling
      sectionElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          if (section.onClick) {
            section.onClick({
              sectionType: section.type,
              sectionIndex: index,
              buttonId: buttonConfig.id,
              buttonStack: stackName,
              buttonPosition: stackIndex + 1,
              currentPage: {
                url: window.location.href,
                title: getCurrentPageTitle(),
              },
            });
          }
        } catch (error) {
          console.error(`❌ Section "${section.type}" click error:`, error);
        }
      });

      return sectionElement;
    }

    dismissCompoundButton(buttonId, buttonContainer) {
      console.log(`🗑️ Dismissing compound button "${buttonId}"`);
      if (buttonContainer.parentNode) {
        buttonContainer.remove();
      }
      this.activeButtons.delete(buttonId);
      console.log(`✅ Compound button "${buttonId}" dismissed`);
    }

    // ==================== VISIBILITY AND CONDITION LOGIC ====================

    shouldButtonBeVisible(config) {
      const { showOn, hideOn, condition } = config;

      if (this.debugMode) {
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

      return true;
    }

    // ==================== PUBLIC API ====================

    registerButton(config) {
      const { id, text, onClick, sections } = config;

      // Enhanced validation for compound buttons
      if (sections) {
        if (!Array.isArray(sections)) {
          throw new Error(`Button "${id}" sections must be an array`);
        }
        // Validate each section
        sections.forEach((section, index) => {
          if (!section.type) {
            throw new Error(`Button "${id}" section ${index} must have a type`);
          }
          if (!SECTION_TYPES[section.type]) {
            throw new Error(
              `Button "${id}" section ${index} has invalid type: ${section.type}`
            );
          }
        });
      } else {
        // Standard validation for simple buttons
        if (!id || !text || !onClick) {
          throw new Error("Simple button must have id, text, and onClick");
        }
      }

      if (this.registeredButtons.has(id)) {
        throw new Error(`Button "${id}" already registered`);
      }

      const stack = config.stack || "top-right";
      if (!BUTTON_STACKS[stack]) {
        throw new Error(
          `Invalid stack: ${stack}. Must be: ${Object.keys(BUTTON_STACKS).join(
            ", "
          )}`
        );
      }

      // Store configuration
      this.registeredButtons.set(id, {
        id,
        text: text || null, // ✅ Backward compatibility
        onClick: onClick || null, // ✅ Backward compatibility
        sections: sections || null, // 🚀 New compound functionality
        stack,
        priority: config.priority || false,
        showOn: config.showOn || null,
        hideOn: config.hideOn || null,
        condition: config.condition || null,
        style: config.style || {},
      });

      if (this.pageDetector.isMonitoring) {
        this.rebuildAllButtons();
      }

      const buttonType = sections ? "compound" : "simple";
      console.log(
        `✅ ${buttonType} button "${id}" registered for ${stack} stack${
          config.priority ? " (priority)" : ""
        }`
      );

      return { success: true, id, stack, type: buttonType };
    }

    removeButton(id) {
      const removed = this.registeredButtons.delete(id);
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
        version: EXTENSION_VERSION,
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
        capabilities: {
          simpleButtons: true,
          compoundButtons: true,
          sectionTypes: Object.keys(SECTION_TYPES),
        },
      };
    }

    cleanup() {
      this.clearAllButtons();
      this.clearAllStacks();
      this.registeredButtons.clear();
      this.pageDetector.stopMonitoring();
      console.log("🧹 Simple Button Registry v3.0 cleaned up");
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

  window.SimpleButtonRegistry = null;
  window.SimpleExtensionButtonManager = SimpleExtensionButtonManager;
  window.ButtonConditions = ButtonConditions;

  // ==================== TESTING UTILITIES ====================

  window.SimpleButtonUtilityTests = {
    // ✅ Test backward compatibility
    testSimpleButton: async () => {
      const manager = new SimpleExtensionButtonManager("CompatibilityTest");
      await manager.initialize();

      // This should work EXACTLY as before
      await manager.registerButton({
        id: "simple-test",
        text: "🧪 Simple Test",
        onClick: () =>
          console.log("Simple button clicked! (v2.1 compatibility)"),
        showOn: ["isMainPage"],
        stack: "top-right",
      });

      console.log("✅ Simple button compatibility test complete");
    },

    // 🚀 Test new compound functionality
    testCompoundButton: async () => {
      const manager = new SimpleExtensionButtonManager("CompoundTest");
      await manager.initialize();

      await manager.registerButton({
        id: "compound-test",
        sections: [
          {
            type: "icon",
            content: "⚙️",
            tooltip: "Settings",
            onClick: () => console.log("Settings clicked!"),
            style: { background: "#FBE3A6" },
          },
          {
            type: "main",
            content: "Configure",
            onClick: () => console.log("Main action clicked!"),
          },
          {
            type: "action",
            content: "📊",
            tooltip: "Stats",
            onClick: () => console.log("Stats clicked!"),
          },
          // dismiss section auto-added
        ],
        showOn: ["isMainPage"],
        stack: "top-right",
      });

      console.log("🚀 Compound button test complete");
      console.log(
        "💡 Try clicking different sections: [⚙️] [Configure] [📊] [×]"
      );
    },

    // 🔄 Test mixed button types
    testMixedButtons: async () => {
      const manager = new SimpleExtensionButtonManager("MixedTest");
      await manager.initialize();

      // Simple button
      await manager.registerButton({
        id: "mixed-simple",
        text: "📝 Simple",
        onClick: () => console.log("Mixed simple clicked!"),
        showOn: ["isMainPage"],
        stack: "top-left",
      });

      // Compound button
      await manager.registerButton({
        id: "mixed-compound",
        sections: [
          {
            type: "icon",
            content: "🎯",
            onClick: () => console.log("Icon clicked!"),
          },
          {
            type: "main",
            content: "Compound",
            onClick: () => console.log("Main clicked!"),
          },
        ],
        showOn: ["isMainPage"],
        stack: "top-left",
      });

      console.log("🔄 Mixed button test complete");
      console.log(
        "🎯 Should see both simple [📝 Simple] [×] and compound [🎯] [Compound] [×] buttons"
      );
    },

    // 📊 Show system status
    showStatus: () => {
      if (window.SimpleButtonRegistry) {
        const status = window.SimpleButtonRegistry.getStatus();
        console.log("📊 v3.0 System Status:", status);
        console.log(
          `🎯 Capabilities: Simple buttons (${status.capabilities.simpleButtons}), Compound buttons (${status.capabilities.compoundButtons})`
        );
        console.log(
          `🧩 Section types available: ${status.capabilities.sectionTypes.join(
            ", "
          )}`
        );
      } else {
        console.log("❌ Registry not initialized");
      }
    },

    // Clean up all tests
    cleanup: () => {
      if (window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry.cleanup();
        console.log("🧹 All test buttons cleaned up");
      }
    },

    enableDebugMode: () => {
      if (window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry.debugMode = true;
        console.log(
          "🐛 Debug mode enabled - detailed logs during button operations"
        );
      }
    },

    disableDebugMode: () => {
      if (window.SimpleButtonRegistry) {
        window.SimpleButtonRegistry.debugMode = false;
        console.log("✅ Debug mode disabled");
      }
    },
  };

  console.log(`✅ ${EXTENSION_NAME} v${EXTENSION_VERSION} loaded!`);
  console.log(
    "🎯 NEW: Compound button support with 100% backward compatibility"
  );
  console.log("🧪 Test commands:");
  console.log(
    "  • window.SimpleButtonUtilityTests.testSimpleButton() - Test v2.1 compatibility"
  );
  console.log(
    "  • window.SimpleButtonUtilityTests.testCompoundButton() - Test new compound buttons"
  );
  console.log(
    "  • window.SimpleButtonUtilityTests.testMixedButtons() - Test both types together"
  );
  console.log(
    "  • window.SimpleButtonUtilityTests.showStatus() - Show system capabilities"
  );
})();
