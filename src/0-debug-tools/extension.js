// ===================================================================
// Extension ZERO: Debug Interface - Button System Diagnostics (UPDATED)
// 🐛 DEBUG: Clean interface for troubleshooting extension issues
// 📋 COPY-PASTE: Export functionality for easy sharing
// 🔄 REAL-TIME: Live monitoring of system state
// 🔧 UPDATED: Compatible with new Simple Button Manager architecture
// ===================================================================

(() => {
  "use strict";

  const EXTENSION_NAME = "Extension Zero Debug";
  const EXTENSION_VERSION = "1.1.0";

  // ==================== DEBUG DATA COLLECTION ====================

  class ExtensionDebugger {
    constructor() {
      this.debugData = {};
      this.updateCallbacks = new Set();
    }

    async collectDebugData() {
      const data = {
        timestamp: new Date().toISOString(),
        currentPage: this.getCurrentPageInfo(),
        dependencies: this.checkDependencies(),
        buttonSystems: this.checkButtonSystems(),
        extension6Status: this.checkExtension6Status(),
        contextDetection: this.checkContextDetection(),
        recommendations: [],
      };

      // Generate recommendations based on findings
      data.recommendations = this.generateRecommendations(data);

      this.debugData = data;
      this.notifyUpdateCallbacks();

      return data;
    }

    getCurrentPageInfo() {
      const getCurrentPageTitle = () => {
        try {
          const url = window.location.href;
          const pageMatch = url.match(/\/page\/([^/?#]+)/);
          if (pageMatch) {
            return decodeURIComponent(pageMatch[1]);
          }
          const titleElement = document.querySelector(
            ".roam-article h1, .rm-page-title"
          );
          return titleElement?.textContent?.trim() || null;
        } catch (error) {
          return null;
        }
      };

      return {
        url: window.location.href,
        title: getCurrentPageTitle(),
        timestamp: new Date().toLocaleString(),
      };
    }

    checkDependencies() {
      const deps = {
        extension15: {
          available: !!window.RoamExtensionSuite,
          platform: null,
          utilities: {},
        },
        simpleButtonUtility20: {
          available: false,
          components: {},
          registry: null,
          initialized: false,
        },
      };

      // Check Extension 1.5
      if (window.RoamExtensionSuite) {
        deps.extension15.platform = "✅ Available";
        const platform = window.RoamExtensionSuite;

        const requiredUtilities = [
          "timezoneManager",
          "modalUtilities",
          "profileAnalysisUtilities",
          "getCurrentUser",
          "getGraphMembersFromList",
        ];

        requiredUtilities.forEach((util) => {
          deps.extension15.utilities[util] = !!(
            platform.getUtility && platform.getUtility(util)
          );
        });
      } else {
        deps.extension15.platform = "❌ Not found";
      }

      // 🔧 UPDATED: Better detection for Simple Button Utility 2.0
      deps.simpleButtonUtility20.components = {
        SimpleExtensionButtonManager: !!window.SimpleExtensionButtonManager,
        ButtonConditions: !!window.ButtonConditions,
        SimpleButtonRegistry_Class: !!window.SimpleButtonRegistry, // Could be null (uninitialized) or instance
      };

      // Check if the system is available (core components exist)
      const coreComponentsAvailable =
        !!window.SimpleExtensionButtonManager && !!window.ButtonConditions;

      deps.simpleButtonUtility20.available = coreComponentsAvailable;

      // Check initialization status
      if (
        window.SimpleButtonRegistry &&
        window.SimpleButtonRegistry.constructor
      ) {
        deps.simpleButtonUtility20.initialized = true;
        try {
          deps.simpleButtonUtility20.registry =
            window.SimpleButtonRegistry.getStatus();
        } catch (error) {
          deps.simpleButtonUtility20.registry = `Error: ${error.message}`;
        }
      } else if (window.SimpleButtonRegistry === null) {
        deps.simpleButtonUtility20.initialized = false;
        deps.simpleButtonUtility20.registry = "Available but not initialized";
      } else {
        deps.simpleButtonUtility20.initialized = false;
        deps.simpleButtonUtility20.registry = "Not available";
      }

      return deps;
    }

    checkButtonSystems() {
      const systems = {
        simple_button_utility_20: {
          available: false,
          initialized: false,
          buttons: {},
          status: null,
        },
        legacy_systems: {
          old_extension_16: !!window.RoamButtonRegistry,
          old_extension_20: !!window.ExtensionButtonManager,
        },
      };

      // 🔧 UPDATED: Check if core system is available vs initialized
      const coreAvailable =
        !!window.SimpleExtensionButtonManager && !!window.ButtonConditions;
      systems.simple_button_utility_20.available = coreAvailable;

      if (
        window.SimpleButtonRegistry &&
        typeof window.SimpleButtonRegistry.getStatus === "function"
      ) {
        systems.simple_button_utility_20.initialized = true;
        try {
          systems.simple_button_utility_20.status =
            window.SimpleButtonRegistry.getStatus();

          // Get button details
          if (window.SimpleButtonRegistry.registeredButtons) {
            const buttonDetails = {};
            window.SimpleButtonRegistry.registeredButtons.forEach(
              (config, id) => {
                buttonDetails[id] = {
                  text: config.text,
                  stack: config.stack,
                  priority: config.priority,
                  showOn: config.showOn,
                  hideOn: config.hideOn,
                  hasCondition: !!config.condition,
                };
              }
            );
            systems.simple_button_utility_20.buttons = buttonDetails;
          }
        } catch (error) {
          systems.simple_button_utility_20.status = `Error: ${error.message}`;
        }
      } else if (window.SimpleButtonRegistry === null && coreAvailable) {
        systems.simple_button_utility_20.initialized = false;
        systems.simple_button_utility_20.status =
          "Available but not initialized - no extension has triggered initialization yet";
      } else {
        systems.simple_button_utility_20.initialized = false;
        systems.simple_button_utility_20.status = "Not available";
      }

      return systems;
    }

    checkExtension6Status() {
      const ext6 = {
        userDirectoryButton: null,
        buttonManager: null,
        services: null,
        domElements: [],
      };

      // Check for Extension 6 services
      if (window.RoamExtensionSuite) {
        try {
          const platform = window.RoamExtensionSuite;
          const services =
            platform.getService && platform.getService("clean-user-directory");
          ext6.services = services ? "✅ Registered" : "❌ Not found";
        } catch (error) {
          ext6.services = `Error: ${error.message}`;
        }
      }

      // Check for User Directory buttons in DOM
      const fallbackButtons = document.querySelectorAll(
        ".user-directory-fallback-button"
      );
      const allButtons = Array.from(document.querySelectorAll("button")).filter(
        (btn) =>
          btn.textContent.includes("User Directory") ||
          btn.textContent.includes("👥")
      );

      ext6.domElements = allButtons.map((btn) => ({
        text: btn.textContent,
        classes: btn.className,
        visible: btn.style.display !== "none",
        position: {
          position: btn.style.position,
          top: btn.style.top,
          left: btn.style.left,
          right: btn.style.right,
        },
      }));

      return ext6;
    }

    checkContextDetection() {
      const context = {
        buttonConditions: [],
        conditionResults: {},
        currentContexts: [],
        availableContexts: [],
      };

      // Check Simple Button Utility 2.0 ButtonConditions
      if (window.ButtonConditions) {
        try {
          context.buttonConditions = Object.keys(
            window.ButtonConditions
          ).filter((key) => typeof window.ButtonConditions[key] === "function");

          context.availableContexts = context.buttonConditions;

          // Test each condition
          context.buttonConditions.forEach((conditionName) => {
            try {
              const result = window.ButtonConditions[conditionName]();
              context.conditionResults[conditionName] = result;
              if (result) {
                context.currentContexts.push(conditionName);
              }
            } catch (error) {
              context.conditionResults[
                conditionName
              ] = `Error: ${error.message}`;
            }
          });
        } catch (error) {
          context.conditionResults = { error: error.message };
        }
      }

      return context;
    }

    generateRecommendations(data) {
      const recommendations = [];

      // Extension dependencies
      if (!data.dependencies.extension15.available) {
        recommendations.push({
          type: "error",
          title: "Extension 1.5 Missing",
          message:
            "Load Extension 1.5 first - it provides core utilities for Extension 6",
          action: "Load Extension 1.5 before Extension 6",
        });
      }

      // 🔧 UPDATED: Better recommendations for new button system
      if (!data.dependencies.simpleButtonUtility20.available) {
        recommendations.push({
          type: "error",
          title: "Simple Button Utility 2.0 Missing",
          message:
            "Extension 6 needs Simple Button Utility 2.0 for button management",
          action: "Load Simple Button Utility 2.0",
        });
      } else if (!data.dependencies.simpleButtonUtility20.initialized) {
        recommendations.push({
          type: "info",
          title: "Simple Button Manager Not Yet Initialized",
          message:
            "Button system is available but hasn't been initialized by any extension yet",
          action:
            "This is normal - it will initialize when an extension registers a button",
        });
      }

      // Button system issues
      if (
        data.extension6Status.domElements.length === 0 &&
        data.dependencies.simpleButtonUtility20.available
      ) {
        recommendations.push({
          type: "warning",
          title: "No User Directory Button Found",
          message: "Extension 6 should create a button but none found",
          action: "Check Extension 6 initialization in console",
        });
      }

      if (data.extension6Status.domElements.length > 1) {
        recommendations.push({
          type: "warning",
          title: "Multiple User Directory Buttons",
          message:
            "Found multiple User Directory buttons - possible duplicate loading",
          action: "Reload page and load extensions in correct order",
        });
      }

      // Context detection issues - updated for Simple Button Utility 2.0
      const shouldHaveButton =
        data.contextDetection.conditionResults.isUsernamePage ||
        data.contextDetection.conditionResults.isChatRoom;
      const hasButton = data.extension6Status.domElements.length > 0;

      if (shouldHaveButton && !hasButton) {
        recommendations.push({
          type: "error",
          title: "Missing Button on Conditional Page",
          message:
            "Current page should show User Directory button but none found",
          action: "Check Extension 6 button registration",
        });
      }

      if (!shouldHaveButton && hasButton) {
        recommendations.push({
          type: "warning",
          title: "Button Visible on Wrong Page",
          message: "User Directory button showing on non-conditional page",
          action: "Check button conditional logic",
        });
      }

      return recommendations;
    }

    onUpdate(callback) {
      this.updateCallbacks.add(callback);
      return () => this.updateCallbacks.delete(callback);
    }

    notifyUpdateCallbacks() {
      this.updateCallbacks.forEach((callback) => {
        try {
          callback(this.debugData);
        } catch (error) {
          console.error("Debug update callback error:", error);
        }
      });
    }

    // 🔧 NEW: Helper method to initialize button system for diagnostics
    async initializeButtonSystemForDiagnostics() {
      if (!window.SimpleExtensionButtonManager) {
        return { success: false, error: "Simple Button Manager not available" };
      }

      try {
        const testManager = new window.SimpleExtensionButtonManager(
          "DebugTest"
        );
        await testManager.initialize();
        return { success: true, manager: testManager };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }

  // ==================== DEBUG UI INTERFACE ====================

  class DebugUI {
    constructor(extensionDebugger) {
      this.extensionDebugger = extensionDebugger;
      this.modal = null;
      this.updateInterval = null;
    }

    async show() {
      if (this.modal) {
        this.modal.remove();
      }

      this.modal = this.createModal();
      document.body.appendChild(this.modal);

      // Start auto-refresh
      this.startAutoRefresh();

      // Initial data load
      await this.refresh();
    }

    createModal() {
      const modal = document.createElement("div");
      modal.id = "extension-zero-debug-modal";
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const content = document.createElement("div");
      content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 1200px;
        max-height: 90%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      `;

      // Header
      const header = document.createElement("div");
      header.style.cssText = `
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
        border-radius: 12px 12px 0 0;
      `;

      header.innerHTML = `
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">
            🐛 Extension Zero: Debug Interface v${EXTENSION_VERSION}
          </h2>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
            Real-time system monitoring • Auto-refresh every 5 seconds
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <button id="debug-init-btn" style="
            background: #8b5cf6; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-size: 14px; 
            cursor: pointer;
          ">🔧 Initialize Button System</button>
          <button id="debug-copy-btn" style="
            background: #10b981; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-size: 14px; 
            cursor: pointer;
          ">📋 Copy Report</button>
          <button id="debug-close-btn" style="
            background: #ef4444; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-size: 14px; 
            cursor: pointer;
          ">✕ Close</button>
        </div>
      `;

      // Content area
      const contentArea = document.createElement("div");
      contentArea.id = "debug-content";
      contentArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      `;

      content.appendChild(header);
      content.appendChild(contentArea);
      modal.appendChild(content);

      // Event listeners
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hide();
      });

      header.querySelector("#debug-close-btn").addEventListener("click", () => {
        this.hide();
      });

      header.querySelector("#debug-copy-btn").addEventListener("click", () => {
        this.copyReport();
      });

      header.querySelector("#debug-init-btn").addEventListener("click", () => {
        this.initializeButtonSystem();
      });

      return modal;
    }

    async refresh() {
      const data = await this.extensionDebugger.collectDebugData();
      this.renderContent(data);
    }

    renderContent(data) {
      const content = this.modal.querySelector("#debug-content");
      content.innerHTML = `
        <div style="display: grid; gap: 20px;">
          ${this.renderPageSection(data.currentPage)}
          ${this.renderDependenciesSection(data.dependencies)}
          ${this.renderButtonSystemsSection(data.buttonSystems)}
          ${this.renderContextSection(data.contextDetection)}
          ${this.renderExtension6Section(data.extension6Status)}
          ${this.renderRecommendationsSection(data.recommendations)}
        </div>
      `;
    }

    renderPageSection(page) {
      return `
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            📄 Current Page
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 8px;"><strong>Title:</strong> ${
              page.title || "No title"
            }</div>
            <div style="margin-bottom: 8px;"><strong>URL:</strong> <code style="background: #e0f2fe; padding: 2px 4px; border-radius: 3px;">${
              page.url
            }</code></div>
            <div><strong>Last Updated:</strong> ${page.timestamp}</div>
          </div>
        </div>
      `;
    }

    renderRecommendationsSection(recommendations) {
      if (!recommendations || recommendations.length === 0) {
        return `
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ✅ System Status
            </h3>
            <div style="color: #16a34a; font-weight: 500;">No issues detected - system appears to be working correctly!</div>
          </div>
        `;
      }

      const items = recommendations
        .map((rec) => {
          const color =
            rec.type === "error"
              ? "#ef4444"
              : rec.type === "warning"
              ? "#f59e0b"
              : rec.type === "info"
              ? "#3b82f6"
              : "#8b5cf6";
          const icon =
            rec.type === "error"
              ? "🚨"
              : rec.type === "warning"
              ? "⚠️"
              : rec.type === "info"
              ? "ℹ️"
              : "💡";

          return `
          <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid ${color};">
            <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">
              ${icon} ${rec.title}
            </div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">${rec.message}</div>
            <div style="font-size: 12px; color: #374151; font-style: italic;">Action: ${rec.action}</div>
          </div>
        `;
        })
        .join("");

      return `
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🎯 Recommendations
          </h3>
          ${items}
        </div>
      `;
    }

    renderDependenciesSection(deps) {
      // 🔧 UPDATED: Better status reporting for new system
      const ext15Status =
        deps.extension15 && deps.extension15.available ? "✅" : "❌";
      const simpleButtonStatus =
        deps.simpleButtonUtility20 && deps.simpleButtonUtility20.available
          ? "✅"
          : "❌";
      const initStatus =
        deps.simpleButtonUtility20 && deps.simpleButtonUtility20.initialized
          ? "🟢 Initialized"
          : "🟡 Not Initialized";

      const ext15Utils =
        deps.extension15 && deps.extension15.utilities
          ? Object.entries(deps.extension15.utilities)
              .map(
                ([name, available]) =>
                  `<div>${available ? "✅" : "❌"} ${name}</div>`
              )
              .join("")
          : "";

      const simpleButtonComponents =
        deps.simpleButtonUtility20 && deps.simpleButtonUtility20.components
          ? Object.entries(deps.simpleButtonUtility20.components)
              .map(
                ([name, available]) =>
                  `<div>${available ? "✅" : "❌"} ${name}</div>`
              )
              .join("")
          : "";

      return `
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #6b7280;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🔧 Dependencies
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 12px;">
              <strong>${ext15Status} Extension 1.5</strong>
              <div style="margin-left: 16px; margin-top: 4px; font-size: 13px;">
                ${ext15Utils || "<em>No utilities checked</em>"}
              </div>
            </div>
            <div>
              <strong>${simpleButtonStatus} Simple Button Utility 2.0</strong>
              <div style="margin-left: 16px; margin-top: 4px; font-size: 13px;">
                ${simpleButtonComponents || "<em>No components checked</em>"}
                <div style="margin-top: 4px; color: #6b7280;">${initStatus}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderContextSection(context) {
      const currentContexts =
        context.currentContexts && context.currentContexts.length > 0
          ? context.currentContexts
              .map(
                (c) => `<span style="
        background: #dbeafe; 
        color: #1e40af; 
        padding: 2px 6px; 
        border-radius: 4px; 
        font-size: 12px;
        margin-right: 4px;
      ">${c}</span>`
              )
              .join("")
          : "";

      return `
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🎯 Context Detection
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 8px;"><strong>Current Contexts:</strong></div>
            <div style="margin-bottom: 12px;">${
              currentContexts || "<em>None detected</em>"
            }</div>
            
            <div><strong>Available Conditions:</strong></div>
            <div style="font-size: 13px; margin-top: 4px;">
              ${
                context.availableContexts && context.availableContexts.join
                  ? context.availableContexts.join(", ")
                  : "None available"
              }
            </div>
          </div>
        </div>
      `;
    }

    renderButtonSystemsSection(buttonSystems) {
      const simpleButtonSystem = buttonSystems.simple_button_utility_20 || {};
      const legacySystems = buttonSystems.legacy_systems || {};

      // 🔧 UPDATED: Better status display
      const simpleSystemStatus = simpleButtonSystem.available
        ? simpleButtonSystem.initialized
          ? "🟢 Available & Initialized"
          : "🟡 Available but Not Initialized"
        : "🔴 Not Available";

      const simpleSystemButtons = simpleButtonSystem.buttons
        ? Object.entries(simpleButtonSystem.buttons)
            .map(
              ([id, config]) => `
          <div style="margin: 4px 0; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 13px;">
            <strong>${id}:</strong> "${config.text}"<br>
            <span style="color: #6b7280;">
              Stack: ${config.stack}, Priority: ${
                config.priority ? "High" : "Normal"
              }, 
              Show: ${
                config.showOn && config.showOn.join
                  ? config.showOn.join(", ")
                  : "Always"
              }
            </span>
          </div>
        `
            )
            .join("")
        : "";

      return `
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🔘 Button Systems
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 12px;">
              <strong>Simple Button Utility 2.0:</strong> ${simpleSystemStatus}
              <div style="margin-top: 8px;">
                ${simpleSystemButtons || "<em>No buttons registered yet</em>"}
              </div>
              ${
                simpleButtonSystem.status
                  ? `<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Status: ${simpleButtonSystem.status}</div>`
                  : ""
              }
            </div>
            
            <div>
              <strong>Legacy Systems:</strong>
              <div style="margin-left: 16px; margin-top: 4px; font-size: 13px;">
                <div>${
                  legacySystems.old_extension_16 ? "⚠️" : "✅"
                } Old Extension 16: ${
        legacySystems.old_extension_16 ? "⚠️ Present" : "✅ Absent"
      }</div>
                <div>${
                  legacySystems.old_extension_20 ? "⚠️" : "✅"
                } Old Extension 20: ${
        legacySystems.old_extension_20 ? "⚠️ Present" : "✅ Absent"
      }</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderExtension6Section(ext6) {
      const domElements =
        ext6.domElements && ext6.domElements.length > 0
          ? ext6.domElements
              .map(
                (el, index) => `
        <div style="margin: 4px 0; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 13px;">
          <strong>Button ${index + 1}:</strong> "${el.text}"<br>
          <span style="color: #6b7280;">
            Classes: ${el.classes || "none"}, Visible: ${
                  el.visible ? "yes" : "no"
                }<br>
            Position: ${
              el.position && el.position.position
                ? el.position.position
                : "static"
            } (${el.position && el.position.top ? el.position.top : "auto"}, ${
                  el.position && el.position.left ? el.position.left : "auto"
                }, ${
                  el.position && el.position.right ? el.position.right : "auto"
                })
          </span>
        </div>
      `
              )
              .join("")
          : "";

      return `
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #22c55e;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            👥 Extension 6 Status
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 12px;"><strong>Services:</strong> ${
              ext6.services || "Not checked"
            }</div>
            <div><strong>DOM Elements (${
              ext6.domElements && ext6.domElements.length
                ? ext6.domElements.length
                : 0
            }):</strong></div>
            <div style="margin-top: 8px;">
              ${
                domElements || "<em>No User Directory buttons found in DOM</em>"
              }
            </div>
          </div>
        </div>
      `;
    }

    async copyReport() {
      const data = this.extensionDebugger.debugData;
      const report = this.generateTextReport(data);

      try {
        await navigator.clipboard.writeText(report);

        // Show success feedback
        const btn = this.modal.querySelector("#debug-copy-btn");
        const originalText = btn.textContent;
        btn.textContent = "✅ Copied!";
        btn.style.background = "#10b981";

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = "#10b981";
        }, 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        alert("Failed to copy to clipboard. Check console for raw data.");
        console.log("DEBUG REPORT:", report);
      }
    }

    async initializeButtonSystem() {
      const btn = this.modal.querySelector("#debug-init-btn");
      const originalText = btn.textContent;
      btn.textContent = "🔄 Initializing...";
      btn.disabled = true;

      try {
        const result =
          await this.extensionDebugger.initializeButtonSystemForDiagnostics();

        if (result.success) {
          btn.textContent = "✅ Initialized!";
          btn.style.background = "#10b981";

          // Refresh the data to show the new state
          setTimeout(() => {
            this.refresh();
          }, 1000);
        } else {
          btn.textContent = "❌ Failed";
          btn.style.background = "#ef4444";
          console.error("Button system initialization failed:", result.error);
        }

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = "#8b5cf6";
          btn.disabled = false;
        }, 3000);
      } catch (error) {
        console.error("Error initializing button system:", error);
        btn.textContent = "❌ Error";
        btn.style.background = "#ef4444";

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = "#8b5cf6";
          btn.disabled = false;
        }, 3000);
      }
    }

    generateTextReport(data) {
      return `
EXTENSION ZERO DEBUG REPORT v${EXTENSION_VERSION}
Generated: ${data.timestamp}

CURRENT PAGE:
- Title: ${data.currentPage?.title || "No title"}
- URL: ${data.currentPage?.url}

DEPENDENCIES:
- Extension 1.5: ${
        data.dependencies &&
        data.dependencies.extension15 &&
        data.dependencies.extension15.available
          ? "Available"
          : "Missing"
      }
- Simple Button Utility 2.0: ${
        data.dependencies &&
        data.dependencies.simpleButtonUtility20 &&
        data.dependencies.simpleButtonUtility20.available
          ? "Available"
          : "Missing"
      }
  Initialized: ${
    data.dependencies &&
    data.dependencies.simpleButtonUtility20 &&
    data.dependencies.simpleButtonUtility20.initialized
      ? "Yes"
      : "No"
  }

BUTTON SYSTEMS:
- Simple Button Utility 2.0: ${
        data.buttonSystems &&
        data.buttonSystems.simple_button_utility_20 &&
        data.buttonSystems.simple_button_utility_20.available
          ? "Available"
          : "Not found"
      }
  Initialized: ${
    data.buttonSystems &&
    data.buttonSystems.simple_button_utility_20 &&
    data.buttonSystems.simple_button_utility_20.initialized
      ? "Yes"
      : "No"
  }
  Buttons: ${
    Object.keys(
      (data.buttonSystems &&
        data.buttonSystems.simple_button_utility_20 &&
        data.buttonSystems.simple_button_utility_20.buttons) ||
        {}
    ).join(", ") || "None"
  }

CONTEXT DETECTION:
- Current Contexts: ${
        data.contextDetection &&
        data.contextDetection.currentContexts &&
        data.contextDetection.currentContexts.join
          ? data.contextDetection.currentContexts.join(", ")
          : "None"
      }
- Available Contexts: ${
        data.contextDetection &&
        data.contextDetection.availableContexts &&
        data.contextDetection.availableContexts.join
          ? data.contextDetection.availableContexts.join(", ")
          : "None"
      }

EXTENSION 6:
- Services: ${
        data.extension6Status && data.extension6Status.services
          ? data.extension6Status.services
          : "Unknown"
      }
- DOM Elements: ${
        data.extension6Status && data.extension6Status.domElements
          ? data.extension6Status.domElements.length
          : 0
      } User Directory button(s) found

RECOMMENDATIONS:
${
  data.recommendations && data.recommendations.length > 0
    ? data.recommendations
        .map(
          (rec) => `- ${rec.type.toUpperCase()}: ${rec.title} - ${rec.message}`
        )
        .join("\n")
    : "No issues detected"
}

RAW DATA:
${JSON.stringify(data, null, 2)}
      `.trim();
    }

    startAutoRefresh() {
      // Refresh every 5 seconds
      this.updateInterval = setInterval(() => {
        this.refresh();
      }, 5000);
    }

    hide() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
    }
  }

  // ==================== GLOBAL API ====================

  const extensionDebugger = new ExtensionDebugger();
  const debugUI = new DebugUI(extensionDebugger);

  // Global access
  window.ExtensionZeroDebug = {
    show: () => debugUI.show(),
    hide: () => debugUI.hide(),
    collectData: () => extensionDebugger.collectDebugData(),
    extensionDebugger: extensionDebugger,
    ui: debugUI,
  };

  // Auto-register command
  if (window.roamAlphaAPI?.ui?.commandPalette) {
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Extension Zero: Show Debug Interface",
      callback: () => debugUI.show(),
    });
  }

  console.log(`✅ ${EXTENSION_NAME} v${EXTENSION_VERSION} loaded`);
  console.log(
    "💡 Run: window.ExtensionZeroDebug.show() or use Command Palette"
  );
  console.log(
    "🔧 UPDATED: Now compatible with new Simple Button Manager architecture"
  );
})();
