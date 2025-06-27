// 🎯 ROAM BUTTON UTILITY EXTENSION - PRODUCTION VERSION
// Intelligent button positioning system for Roam Research extensions
// Prevents extension conflicts and provides professional UI coordination

export default {
  onload: ({ extensionAPI }) => {
    console.log("🎯 Roam Button Utility Extension loading...");

    // ==================== CONFIGURATION & CONSTANTS ====================

    const BUTTON_STACKS = {
      "top-left": {
        positions: [
          { x: 20, y: 20, priority: 1 },
          { x: 20, y: 70, priority: 2 },
        ],
        maxButtons: 2,
        buttonHeight: 40,
        spacing: 10,
      },
      "top-right": {
        positions: [
          { x: -100, y: 20, priority: 1 },
          { x: -100, y: 70, priority: 2 },
          { x: -100, y: 120, priority: 3 },
          { x: -100, y: 170, priority: 4 },
          { x: -100, y: 220, priority: 5 },
        ],
        maxButtons: 5,
        buttonHeight: 40,
        spacing: 10,
      },
    };

    const ANIMATION_DURATION = 300;

    // ==================== DISPLACEMENT ENGINE ====================

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
              isPriority ? "PRIORITY" : "NORMAL"
            } insertion for "${triggerButtonId}"`
          );
        }

        try {
          const displacementPlan = this.calculateDisplacementPlan(
            triggerButtonId,
            triggerStack,
            isPriority
          );
          await this.executeDisplacementPlan(displacementPlan);

          if (window.RoamButtonRegistry?.debugMode) {
            console.log(`✅ Displacement complete for "${triggerButtonId}"`);
          }
        } catch (error) {
          console.error(
            `💥 Displacement error for "${triggerButtonId}":`,
            error
          );
        } finally {
          this.processing = false;

          if (this.displacementQueue.length > 0) {
            const next = this.displacementQueue.shift();
            setTimeout(
              () =>
                this.processDisplacement(
                  next.triggerButtonId,
                  next.triggerStack,
                  next.isPriority
                ),
              100
            );
          }
        }
      }

      calculateDisplacementPlan(triggerButtonId, triggerStack, isPriority) {
        const plan = {
          triggerButton: triggerButtonId,
          stack: triggerStack,
          isPriority,
          moves: [],
          removals: [],
          notifications: [],
        };

        const currentStack = this.registry.stacks[triggerStack];
        const stackConfig = BUTTON_STACKS[triggerStack];
        const maxButtons = stackConfig.maxButtons;

        if (isPriority) {
          currentStack.forEach((buttonConfig, currentIndex) => {
            if (buttonConfig.id !== triggerButtonId) {
              const newPosition = currentIndex + 2;

              if (newPosition <= maxButtons) {
                plan.moves.push({
                  buttonId: buttonConfig.id,
                  fromPosition: currentIndex + 1,
                  toPosition: newPosition,
                  fromStack: triggerStack,
                  toStack: triggerStack,
                });
              } else {
                this.handleStackOverflow(buttonConfig, plan);
              }
            }
          });
        } else {
          const newPosition = currentStack.length + 1;

          if (newPosition > maxButtons) {
            this.handleStackOverflow(
              currentStack[currentStack.length - 1],
              plan
            );
          }
        }

        return plan;
      }

      handleStackOverflow(buttonConfig, plan) {
        const otherStack =
          buttonConfig.stack === "top-left" ? "top-right" : "top-left";
        const otherStackConfig = BUTTON_STACKS[otherStack];
        const otherStackCurrent = this.registry.stacks[otherStack];

        if (otherStackCurrent.length < otherStackConfig.maxButtons) {
          plan.moves.push({
            buttonId: buttonConfig.id,
            fromPosition: buttonConfig.position,
            toPosition: otherStackCurrent.length + 1,
            fromStack: buttonConfig.stack,
            toStack: otherStack,
          });

          plan.notifications.push({
            buttonId: buttonConfig.id,
            type: "migrated",
            details: {
              fromStack: buttonConfig.stack,
              toStack: otherStack,
              reason: "stack_overflow",
            },
          });
        } else {
          plan.removals.push({
            buttonId: buttonConfig.id,
            reason: "no_space_available",
            stack: buttonConfig.stack,
            position: buttonConfig.position,
          });

          plan.notifications.push({
            buttonId: buttonConfig.id,
            type: "removed",
            details: {
              reason: "no_space_available",
              originalStack: buttonConfig.stack,
            },
          });
        }
      }

      async executeDisplacementPlan(plan) {
        if (window.RoamButtonRegistry?.debugMode) {
          console.log(
            `🎬 Executing displacement plan with ${plan.moves.length} moves and ${plan.removals.length} removals`
          );
        }

        for (const removal of plan.removals) {
          await this.executeRemoval(removal);
        }

        if (plan.moves.length > 0) {
          await this.executeMovesWithAnimation(plan.moves);
        }

        for (const notification of plan.notifications) {
          this.sendNotificationToExtension(notification);
        }

        this.updateRegistryState(plan);
      }

      async executeRemoval(removal) {
        const buttonConfig = this.registry.buttons.get(removal.buttonId);
        if (!buttonConfig || !buttonConfig.element) return;

        buttonConfig.element.style.transition = `opacity ${this.animationDuration}ms ease`;
        buttonConfig.element.style.opacity = "0";

        await new Promise((resolve) =>
          setTimeout(resolve, this.animationDuration)
        );

        buttonConfig.element.remove();
        this.registry.buttons.delete(removal.buttonId);

        const stack = this.registry.stacks[removal.stack];
        const index = stack.findIndex((b) => b.id === removal.buttonId);
        if (index > -1) {
          stack.splice(index, 1);
        }
      }

      async executeMovesWithAnimation(moves) {
        const animationPromises = moves.map((move) =>
          this.animateButtonMove(move)
        );
        await Promise.all(animationPromises);
      }

      async animateButtonMove(move) {
        const buttonConfig = this.registry.buttons.get(move.buttonId);
        if (!buttonConfig || !buttonConfig.element) return;

        const element = buttonConfig.element;
        const targetStack = BUTTON_STACKS[move.toStack];
        const targetPosition = targetStack.positions[move.toPosition - 1]; // Convert 1-based to 0-based

        if (!targetPosition) return;

        const targetLeft =
          targetPosition.x < 0 ? "auto" : `${targetPosition.x}px`;
        const targetRight =
          targetPosition.x < 0 ? `${Math.abs(targetPosition.x)}px` : "auto";
        const targetTop = `${targetPosition.y}px`;

        element.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.style.transform = "scale(0.95)";
        element.style.opacity = "0.8";

        element.style.left = targetLeft;
        element.style.right = targetRight;
        element.style.top = targetTop;

        await new Promise((resolve) =>
          setTimeout(resolve, this.animationDuration)
        );

        element.style.transform = "scale(1)";
        element.style.opacity = "1";
        element.style.transition = "";

        buttonConfig.stack = move.toStack;
        buttonConfig.position = move.toPosition;

        // Update stack arrays properly
        const fromStack = this.registry.stacks[move.fromStack];
        const toStack = this.registry.stacks[move.toStack];

        const fromIndex = fromStack.findIndex((b) => b.id === move.buttonId);
        if (fromIndex > -1) {
          fromStack.splice(fromIndex, 1);
        }

        // Insert at correct position in target stack (convert 1-based to 0-based)
        const insertIndex = move.toPosition - 1;
        toStack.splice(insertIndex, 0, buttonConfig);

        if (window.RoamButtonRegistry?.debugMode) {
          console.log(
            `✅ Animation complete for "${move.buttonId}": ${move.fromStack} #${move.fromPosition} → ${move.toStack} #${move.toPosition}`
          );
        }
      }

      sendNotificationToExtension(notification) {
        const buttonConfig = this.registry.buttons.get(notification.buttonId);
        if (!buttonConfig) return;

        try {
          if (notification.type === "migrated" && buttonConfig.onDisplaced) {
            buttonConfig.onDisplaced(
              notification.details.fromStack,
              notification.details.toStack,
              notification.details.reason
            );
          }

          if (notification.type === "removed" && buttonConfig.onRemoved) {
            buttonConfig.onRemoved(notification.details.reason);
          }

          const event = new CustomEvent("roam-button-displaced", {
            detail: {
              buttonId: notification.buttonId,
              type: notification.type,
              ...notification.details,
            },
          });
          window.dispatchEvent(event);
        } catch (error) {
          console.error(
            `💥 Error sending notification for "${notification.buttonId}":`,
            error
          );
        }
      }

      updateRegistryState(plan) {
        Object.keys(this.registry.stacks).forEach((stackName) => {
          const stack = this.registry.stacks[stackName];
          stack.forEach((buttonConfig, index) => {
            buttonConfig.position = index + 1;
          });
        });
      }
    }

    // ==================== MAIN REGISTRY CLASS ====================

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
        this.displacementEngine = new ButtonDisplacementEngine(this);
      }

      init() {
        if (this.initialized) return true;

        console.log("🚀 Initializing Roam Button Registry...");

        this.container = this.findContainer();
        if (!this.container) {
          console.error("❌ No suitable container found for button registry");
          return false;
        }

        if (this.debugMode) {
          console.log(`✅ Container found: ${this.container.selector}`);
        }

        if (getComputedStyle(this.container.element).position === "static") {
          this.container.element.style.position = "relative";
        }

        this.initialized = true;
        console.log("✅ Button Registry initialized successfully");
        return true;
      }

      findContainer() {
        const candidates = [
          ".roam-article",
          ".roam-main .roam-article",
          ".rm-article-wrapper",
        ];

        for (const selector of candidates) {
          const element = document.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 400 && rect.height > 200) {
              return { element, selector, rect };
            }
          }
        }
        return null;
      }

      registerButton(config) {
        if (!this.init()) {
          throw new Error("Failed to initialize button registry");
        }

        const {
          id,
          text,
          onClick,
          stack = "top-right",
          priority = false,
          style = {},
          onDisplaced,
          onRemoved,
          extensionName = "Unknown Extension",
        } = config;

        if (!id || !text || !onClick) {
          throw new Error("Button registration requires: id, text, onClick");
        }

        if (this.buttons.has(id)) {
          if (this.debugMode) {
            console.warn(
              `⚠️ Button "${id}" already registered, removing old one`
            );
          }
          this.unregisterButton(id);
        }

        if (this.debugMode) {
          console.log(
            `📝 Registering button "${id}" for ${extensionName} on ${stack} stack (priority: ${priority})`
          );
        }

        const buttonConfig = {
          id,
          text,
          onClick,
          stack,
          priority,
          style,
          onDisplaced,
          onRemoved,
          extensionName,
          element: null,
          position: null,
        };

        this.buttons.set(id, buttonConfig);

        if (priority) {
          this.stacks[stack].unshift(buttonConfig);
          if (this.debugMode) {
            console.log(
              `⚡ Priority button "${id}" jumped to front of ${stack} stack`
            );
          }
        } else {
          this.stacks[stack].push(buttonConfig);
        }

        this.enforceStackLimits(stack);
        this.createButton(buttonConfig);
        this.updateStackPositions(stack); // Always update positions after stack changes

        // Process displacement if priority or stack overflow
        if (priority && this.stacks[stack].length > 1) {
          // Priority button displaced others
          setTimeout(() => {
            this.displacementEngine.processDisplacement(id, stack, priority);
          }, 50);
        } else if (
          this.stacks[stack].length > BUTTON_STACKS[stack].maxButtons
        ) {
          // Stack overflow
          setTimeout(() => {
            this.displacementEngine.processDisplacement(id, stack, priority);
          }, 50);
        }

        if (this.debugMode) {
          console.log(`✅ Button "${id}" registered successfully`);
        }

        return {
          success: true,
          position: buttonConfig.position,
          stack: buttonConfig.stack,
          id: buttonConfig.id,
          element: buttonConfig.element,
        };
      }

      unregisterButton(id) {
        const buttonConfig = this.buttons.get(id);
        if (!buttonConfig) {
          if (this.debugMode) {
            console.warn(`⚠️ Button "${id}" not found for removal`);
          }
          return false;
        }

        if (this.debugMode) {
          console.log(`🗑️ Unregistering button "${id}"`);
        }

        const stack = buttonConfig.stack;
        const stackIndex = this.stacks[stack].indexOf(buttonConfig);
        if (stackIndex > -1) {
          this.stacks[stack].splice(stackIndex, 1);
        }

        if (buttonConfig.element) {
          buttonConfig.element.remove();
        }

        this.buttons.delete(id);
        this.updateStackPositions(stack);

        if (this.debugMode) {
          console.log(`✅ Button "${id}" removed successfully`);
        }
        return true;
      }

      enforceStackLimits(stack) {
        const maxButtons = BUTTON_STACKS[stack].maxButtons;
        const currentStack = this.stacks[stack];

        if (currentStack.length > maxButtons) {
          const removed = currentStack.splice(maxButtons);

          removed.forEach((buttonConfig) => {
            if (this.debugMode) {
              console.log(
                `📤 Removing excess button "${buttonConfig.id}" from ${stack} stack`
              );
            }
            if (buttonConfig.element) {
              buttonConfig.element.remove();
            }
            this.buttons.delete(buttonConfig.id);
          });
        }
      }

      createButton(buttonConfig) {
        const button = document.createElement("button");
        button.className = `roam-button-registry button-${buttonConfig.id}`;
        button.textContent = buttonConfig.text;

        // Default styling with font inheritance
        button.style.cssText = `
          position: absolute;
          background: rgb(251, 238, 166);
          border: 1px solid #8B4513;
          border-radius: 6px;
          color: #8B4513;
          padding: 9px 13px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 9999;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          white-space: nowrap;
          min-width: 80px;
        `;

        // Apply custom styles
        Object.entries(buttonConfig.style).forEach(([property, value]) => {
          button.style[property] = value;
        });

        // Add hover effect
        button.addEventListener("mouseenter", () => {
          button.style.background = buttonConfig.style.background || "#FFF700";
        });

        button.addEventListener("mouseleave", () => {
          button.style.background =
            buttonConfig.style.background || "rgb(251, 238, 166)";
        });

        // Add click handler
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Prevent double-clicks
          if (button.disabled) return;
          button.disabled = true;
          setTimeout(() => {
            button.disabled = false;
          }, 100);

          if (this.debugMode) {
            console.log(`🖱️ Button "${buttonConfig.id}" clicked`);
          }

          try {
            const enhancedEvent = {
              ...e,
              buttonId: buttonConfig.id,
              buttonPosition: buttonConfig.position,
              buttonStack: buttonConfig.stack,
              registryVersion: "1.0.0",
            };

            buttonConfig.onClick(enhancedEvent);
          } catch (error) {
            console.error(`💥 Button "${buttonConfig.id}" click error:`, error);
          }
        });

        buttonConfig.element = button;
        this.container.element.appendChild(button);
      }

      updateStackPositions(stack) {
        const stackConfig = BUTTON_STACKS[stack];
        const buttons = this.stacks[stack];

        buttons.forEach((buttonConfig, index) => {
          if (index < stackConfig.positions.length && buttonConfig.element) {
            const pos = stackConfig.positions[index]; // Use array index directly

            if (pos.x < 0) {
              buttonConfig.element.style.right = `${Math.abs(pos.x)}px`;
              buttonConfig.element.style.left = "auto";
            } else {
              buttonConfig.element.style.left = `${pos.x}px`;
              buttonConfig.element.style.right = "auto";
            }

            buttonConfig.element.style.top = `${pos.y}px`;
            buttonConfig.position = index + 1; // Position is 1-based, index is 0-based

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

      getStatus() {
        return {
          initialized: this.initialized,
          totalButtons: this.buttons.size,
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
    }

    // ==================== EXTENSION BUTTON MANAGER ====================

    class ExtensionButtonManager {
      constructor(extensionName) {
        this.extensionName = extensionName;
        this.registeredButtons = new Map();
        this.fallbackButtons = new Map();
        this.useRegistry = false;
      }

      async initialize() {
        console.log(
          `🎯 ${this.extensionName}: Initializing button management...`
        );

        const registryAvailable = await this.waitForRegistry(3000);

        if (registryAvailable) {
          console.log(`✅ ${this.extensionName}: Button registry available`);
          this.useRegistry = true;
        } else {
          console.warn(
            `⚠️ ${this.extensionName}: Button registry not available, using fallback`
          );
          this.useRegistry = false;
        }
      }

      async waitForRegistry(timeout = 5000) {
        const startTime = Date.now();
        while (
          !window.RoamButtonRegistry?.initialized &&
          Date.now() - startTime < timeout
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return window.RoamButtonRegistry?.initialized || false;
      }

      async registerButton(config) {
        const fullConfig = {
          ...config,
          extensionName: this.extensionName,
          id: `${this.extensionName}-${config.id}`,
        };

        if (this.useRegistry) {
          return this.registerWithRegistry(fullConfig);
        } else {
          return this.registerWithFallback(fullConfig);
        }
      }

      registerWithRegistry(config) {
        try {
          const result = window.RoamButtonRegistry.registerButton(config);

          if (result.success) {
            this.registeredButtons.set(config.id, result);
            console.log(
              `✅ ${this.extensionName}: Button "${config.id}" registered at ${result.stack} #${result.position}`
            );

            if (config.onRegistered) {
              config.onRegistered(result);
            }
          }

          return result;
        } catch (error) {
          console.error(`💥 ${this.extensionName}: Registration error:`, error);
          return { success: false, error: error.message };
        }
      }

      registerWithFallback(config) {
        console.log(
          `🛟 ${this.extensionName}: Using fallback positioning for "${config.id}"`
        );

        const button = document.createElement("button");
        button.textContent = config.text;
        button.onclick = config.onClick;

        const existingCount = this.fallbackButtons.size;
        button.style.cssText = `
          position: fixed;
          top: ${20 + existingCount * 50}px;
          right: 20px;
          z-index: 9999;
          padding: 8px 16px;
          background: #f39c12;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(button);

        const result = {
          success: true,
          position: existingCount + 1,
          stack: "fallback",
          id: config.id,
          element: button,
          message: "Fallback positioning used",
        };

        this.fallbackButtons.set(config.id, result);
        return result;
      }

      cleanup() {
        console.log(`🧹 ${this.extensionName}: Cleaning up buttons...`);

        this.registeredButtons.forEach((result, id) => {
          if (this.useRegistry) {
            window.RoamButtonRegistry.unregisterButton(id);
          }
        });

        this.fallbackButtons.forEach((result, id) => {
          if (result.element) {
            result.element.remove();
          }
        });

        this.registeredButtons.clear();
        this.fallbackButtons.clear();

        console.log(`✅ ${this.extensionName}: Cleanup complete`);
      }
    }

    // ==================== API INTERFACE ====================

    const ButtonRegistryAPI = {
      isAvailable() {
        return (
          window.RoamButtonRegistry && window.RoamButtonRegistry.initialized
        );
      },

      async waitForReady(timeout = 5000) {
        const startTime = Date.now();
        while (!this.isAvailable() && Date.now() - startTime < timeout) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return this.isAvailable();
      },

      getCapabilities() {
        if (!this.isAvailable()) return null;

        return {
          version: "1.0.0",
          stacks: {
            "top-left": {
              maxButtons: BUTTON_STACKS["top-left"].maxButtons,
              available:
                BUTTON_STACKS["top-left"].maxButtons -
                window.RoamButtonRegistry.stacks["top-left"].length,
            },
            "top-right": {
              maxButtons: BUTTON_STACKS["top-right"].maxButtons,
              available:
                BUTTON_STACKS["top-right"].maxButtons -
                window.RoamButtonRegistry.stacks["top-right"].length,
            },
          },
          features: [
            "priority-insertion",
            "displacement-events",
            "auto-cleanup",
            "collision-detection",
            "smooth-animations",
          ],
        };
      },
    };

    // ==================== INITIALIZATION ====================

    // Create global registry instance
    window.RoamButtonRegistry = new RoamButtonRegistry();
    window.ButtonRegistryAPI = ButtonRegistryAPI;
    window.ExtensionButtonManager = ExtensionButtonManager;

    console.log(
      "✅ Button Utility: Font inheritance enabled - buttons will match Roam's font settings"
    );

    // ==================== SETTINGS PANEL ====================

    extensionAPI.settings.panel.create({
      tabTitle: "Button Utility",
      settings: [
        {
          id: "debugMode",
          name: "Debug Mode",
          description: "Enable detailed console logging for button operations",
          action: {
            type: "switch",
            onChange: (newValue) => {
              window.RoamButtonRegistry.debugMode = newValue;
              console.log(
                `🐛 Button Registry debug mode: ${
                  newValue ? "enabled" : "disabled"
                }`
              );
            },
          },
        },
        {
          id: "animationSpeed",
          name: "Animation Speed",
          description: "Speed of button displacement animations",
          action: {
            type: "select",
            items: ["slow", "normal", "fast"],
            onChange: (newValue) => {
              const speeds = { slow: 500, normal: 300, fast: 150 };
              if (window.RoamButtonRegistry.displacementEngine) {
                window.RoamButtonRegistry.displacementEngine.animationDuration =
                  speeds[newValue];
              }
              console.log(
                `🎬 Animation speed set to: ${newValue} (${speeds[newValue]}ms)`
              );
            },
          },
        },
        {
          id: "enableTesting",
          name: "Enable Testing Functions",
          description:
            "Enable developer testing functions (window.ButtonUtilityTests)",
          action: {
            type: "switch",
            onChange: (newValue) => {
              if (newValue) {
                window.ButtonUtilityTests = {
                  testPriorityDisplacement() {
                    console.log("🧪 Testing priority displacement...");
                    window.RoamButtonRegistry.registerButton({
                      id: "priority-test",
                      text: "⚡ PRIORITY",
                      onClick: () => alert("Priority button works!"),
                      stack: "top-right",
                      priority: true,
                      style: { background: "#f1c40f", color: "#2c3e50" },
                      extensionName: "Testing",
                    });
                  },
                  showStatus() {
                    const status = window.RoamButtonRegistry.getStatus();
                    console.log("📊 Button Registry Status:", status);
                    alert(
                      `Registry Status:\n\nTotal: ${status.totalButtons}\nLeft: ${status.stacks["top-left"].buttons}/${status.stacks["top-left"].max}\nRight: ${status.stacks["top-right"].buttons}/${status.stacks["top-right"].max}`
                    );
                  },
                  clearAll() {
                    window.RoamButtonRegistry.clear();
                    console.log("🧹 All buttons cleared");
                  },
                };
                console.log(
                  "🧪 Testing functions enabled at window.ButtonUtilityTests"
                );
              } else {
                delete window.ButtonUtilityTests;
                console.log("🧪 Testing functions disabled");
              }
            },
          },
        },
      ],
    });

    // ==================== FINALIZATION ====================

    console.log("✅ Roam Button Utility Extension loaded successfully!");
    console.log(
      "🎯 Production ready - intelligent button coordination for all extensions"
    );
    console.log(
      "📚 API: window.RoamButtonRegistry, window.ButtonRegistryAPI, window.ExtensionButtonManager"
    );
    console.log(
      "🎨 Font inheritance: Buttons automatically match your Roam font settings"
    );
    console.log("⚙️ Enable testing functions in extension settings if needed");

    // Return cleanup function
    return {
      elements: [],
      observers: [],
      timeouts: [],
      intervals: [],
    };
  },

  onunload: () => {
    console.log("🧹 Roam Button Utility Extension unloading...");

    // Clean up global registry
    if (window.RoamButtonRegistry) {
      window.RoamButtonRegistry.clear();
      delete window.RoamButtonRegistry;
    }

    // Clean up global APIs
    delete window.ButtonRegistryAPI;
    delete window.ExtensionButtonManager;
    delete window.ButtonUtilityTests;

    console.log("✅ Roam Button Utility Extension unloaded");
  },
};
