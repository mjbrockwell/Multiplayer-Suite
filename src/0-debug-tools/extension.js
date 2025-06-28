// ===================================================================
// Extension ZERO: Debug Interface - Button System Diagnostics
// 🐛 DEBUG: Clean interface for troubleshooting extension issues
// 📋 COPY-PASTE: Export functionality for easy sharing
// 🔄 REAL-TIME: Live monitoring of system state
// ===================================================================

(() => {
  "use strict";

  const EXTENSION_NAME = "Extension Zero Debug";
  const EXTENSION_VERSION = "1.0.0";

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
        extension16: {
          available: false,
          components: {},
          registry: null,
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
          deps.extension15.utilities[util] = !!platform.getUtility(util);
        });
      } else {
        deps.extension15.platform = "❌ Not found";
      }

      // Check Extension 1.6
      deps.extension16.components = {
        ExtensionButtonManager: !!window.ExtensionButtonManager,
        RoamButtonRegistry: !!window.RoamButtonRegistry,
        ButtonRegistryAPI: !!window.ButtonRegistryAPI,
      };

      deps.extension16.available = Object.values(
        deps.extension16.components
      ).every(Boolean);

      if (window.RoamButtonRegistry) {
        try {
          deps.extension16.registry = window.RoamButtonRegistry.getStatus();
        } catch (error) {
          deps.extension16.registry = `Error: ${error.message}`;
        }
      }

      return deps;
    }

    checkButtonSystems() {
      const systems = {
        old_system: {
          available: !!window.RoamButtonRegistry,
          buttons: {},
          status: null,
        },
        new_system: {
          available: !!window.SimpleButtonRegistry,
          buttons: {},
          status: null,
        },
      };

      // Check old system (Extension 1.6)
      if (window.RoamButtonRegistry) {
        try {
          systems.old_system.status = window.RoamButtonRegistry.getStatus();

          // Get button details
          if (window.RoamButtonRegistry.buttons) {
            const buttonDetails = {};
            window.RoamButtonRegistry.buttons.forEach((config, id) => {
              buttonDetails[id] = {
                text: config.text,
                visible: config.visible,
                stack: config.stack,
                contextRules: config.contextRules,
              };
            });
            systems.old_system.buttons = buttonDetails;
          }
        } catch (error) {
          systems.old_system.status = `Error: ${error.message}`;
        }
      }

      // Check new system (Extension 2.0)
      if (window.SimpleButtonRegistry) {
        try {
          systems.new_system.status = window.SimpleButtonRegistry.getStatus();

          // Get button details
          const buttonDetails = {};
          window.SimpleButtonRegistry.registeredButtons.forEach(
            (config, id) => {
              buttonDetails[id] = {
                text: config.text,
                showOn: config.showOn,
                hideOn: config.hideOn,
                condition: !!config.condition,
              };
            }
          );
          systems.new_system.buttons = buttonDetails;
        } catch (error) {
          systems.new_system.status = `Error: ${error.message}`;
        }
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
          const services = platform.getService?.("clean-user-directory");
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
        currentContexts: [],
        availableContexts: [],
        usernamePageDetection: null,
        chatRoomDetection: null,
      };

      // Check Extension 1.6 context detection
      if (window.RoamButtonRegistry?.pageMonitor) {
        try {
          context.currentContexts = Array.from(
            window.RoamButtonRegistry.pageMonitor.getCurrentContext()
          );
        } catch (error) {
          context.currentContexts = [`Error: ${error.message}`];
        }
      }

      if (window.RoamButtonRegistry?.contextEngine) {
        try {
          context.availableContexts =
            window.RoamButtonRegistry.contextEngine.getAvailableContexts();
        } catch (error) {
          context.availableContexts = [`Error: ${error.message}`];
        }
      }

      // Test specific page detection
      const pageTitle = this.getCurrentPageInfo().title;
      if (pageTitle) {
        // Test username page detection
        context.usernamePageDetection = {
          pageTitle,
          isUsernamePageContext:
            context.currentContexts.includes("username-pages"),
          isChatRoomContext:
            context.currentContexts.includes("chat-room-pages"),
        };
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

      if (!data.dependencies.extension16.available) {
        recommendations.push({
          type: "error",
          title: "Extension 1.6 Missing",
          message: "Extension 6 needs Extension 1.6 for button management",
          action: "Load Extension 1.6 Button Utility",
        });
      }

      // Button system issues
      if (
        data.extension6Status.domElements.length === 0 &&
        data.dependencies.extension16.available
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

      // Context detection issues
      const shouldHaveButton =
        data.contextDetection.currentContexts.includes("username-pages") ||
        data.contextDetection.currentContexts.includes("chat-room-pages");
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
            🐛 Extension Zero - Debug Interface
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
            Real-time button system diagnostics
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button id="debug-refresh-btn" style="
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">🔄 Refresh</button>
          <button id="debug-copy-btn" style="
            padding: 8px 16px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">📋 Copy Report</button>
          <button id="debug-close-btn" style="
            padding: 8px 16px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">✕ Close</button>
        </div>
      `;

      // Content area
      const contentArea = document.createElement("div");
      contentArea.id = "debug-content-area";
      contentArea.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 24px;
      `;

      content.appendChild(header);
      content.appendChild(contentArea);
      modal.appendChild(content);

      // Event listeners
      header.querySelector("#debug-refresh-btn").onclick = () => this.refresh();
      header.querySelector("#debug-copy-btn").onclick = () => this.copyReport();
      header.querySelector("#debug-close-btn").onclick = () => this.hide();

      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) this.hide();
      };

      return modal;
    }

    async refresh() {
      const data = await this.extensionDebugger.collectDebugData();
      this.renderDebugData(data);
    }

    renderDebugData(data) {
      const contentArea = this.modal.querySelector("#debug-content-area");

      contentArea.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          ${this.renderCurrentPageSection(data.currentPage)}
          ${this.renderRecommendationsSection(data.recommendations)}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          ${this.renderDependenciesSection(data.dependencies)}
          ${this.renderContextSection(data.contextDetection)}
        </div>

        <div style="margin-bottom: 24px;">
          ${this.renderButtonSystemsSection(data.buttonSystems)}
        </div>

        <div>
          ${this.renderExtension6Section(data.extension6Status)}
        </div>
      `;
    }

    renderCurrentPageSection(pageInfo) {
      return `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            📄 Current Page
          </h3>
          <div style="font-size: 14px; line-height: 1.5;">
            <div><strong>Title:</strong> ${pageInfo.title || "No title"}</div>
            <div style="margin-top: 8px; word-break: break-all;"><strong>URL:</strong> ${
              pageInfo.url
            }</div>
            <div style="margin-top: 8px;"><strong>Updated:</strong> ${
              pageInfo.timestamp
            }</div>
          </div>
        </div>
      `;
    }

    renderRecommendationsSection(recommendations) {
      if (recommendations.length === 0) {
        return `
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ✅ Recommendations
            </h3>
            <div style="color: #059669; font-size: 14px;">All systems appear to be working correctly!</div>
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
              : "#3b82f6";
          const icon =
            rec.type === "error" ? "🚨" : rec.type === "warning" ? "⚠️" : "💡";

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
      const ext15Status = deps.extension15.available ? "✅" : "❌";
      const ext16Status = deps.extension16.available ? "✅" : "❌";

      const ext15Utils = Object.entries(deps.extension15.utilities)
        .map(
          ([name, available]) => `<div>${available ? "✅" : "❌"} ${name}</div>`
        )
        .join("");

      const ext16Components = Object.entries(deps.extension16.components)
        .map(
          ([name, available]) => `<div>${available ? "✅" : "❌"} ${name}</div>`
        )
        .join("");

      return `
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #6b7280;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🔧 Dependencies
          </h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 12px;">
              <strong>${ext15Status} Extension 1.5</strong>
              <div style="margin-left: 16px; margin-top: 4px; font-size: 13px;">
                ${ext15Utils}
              </div>
            </div>
            <div>
              <strong>${ext16Status} Extension 1.6</strong>
              <div style="margin-left: 16px; margin-top: 4px; font-size: 13px;">
                ${ext16Components}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderContextSection(context) {
      const currentContexts = context.currentContexts
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
        .join("");

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
            
            ${
              context.usernamePageDetection
                ? `
              <div style="margin-top: 12px; padding: 8px; background: white; border-radius: 4px;">
                <div><strong>Page Analysis:</strong></div>
                <div style="font-size: 13px; margin-top: 4px;">
                  Username page: ${
                    context.usernamePageDetection.isUsernamePageContext
                      ? "✅"
                      : "❌"
                  }<br>
                  Chat room page: ${
                    context.usernamePageDetection.isChatRoomContext
                      ? "✅"
                      : "❌"
                  }
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    renderButtonSystemsSection(systems) {
      const oldSystemButtons = Object.entries(systems.old_system.buttons)
        .map(
          ([id, config]) => `
        <div style="margin: 4px 0; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 13px;">
          <strong>${id}</strong>: "${config.text}" 
          <span style="color: ${config.visible ? "#059669" : "#dc2626"};">
            (${config.visible ? "visible" : "hidden"})
          </span>
          <br>
          <span style="color: #6b7280;">
            Stack: ${config.stack}, Rules: ${JSON.stringify(
            config.contextRules
          )}
          </span>
        </div>
      `
        )
        .join("");

      const newSystemButtons = Object.entries(systems.new_system.buttons)
        .map(
          ([id, config]) => `
        <div style="margin: 4px 0; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 13px;">
          <strong>${id}</strong>: "${config.text}"<br>
          <span style="color: #6b7280;">
            ShowOn: ${JSON.stringify(config.showOn)}, HideOn: ${JSON.stringify(
            config.hideOn
          )}
          </span>
        </div>
      `
        )
        .join("");

      return `
        <div style="background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🏗️ Button Systems
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 14px;">Extension 1.6 System ${
                systems.old_system.available ? "✅" : "❌"
              }</h4>
              ${oldSystemButtons || "<em>No buttons registered</em>"}
            </div>
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 14px;">Extension 2.0 System ${
                systems.new_system.available ? "✅" : "❌"
              }</h4>
              ${newSystemButtons || "<em>No buttons registered</em>"}
            </div>
          </div>
        </div>
      `;
    }

    renderExtension6Section(ext6) {
      const domElements = ext6.domElements
        .map(
          (el, index) => `
        <div style="margin: 4px 0; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 13px;">
          <strong>Button ${index + 1}:</strong> "${el.text}"<br>
          <span style="color: #6b7280;">
            Classes: ${el.classes || "none"}, Visible: ${
            el.visible ? "yes" : "no"
          }<br>
            Position: ${el.position.position || "static"} (${
            el.position.top || "auto"
          }, ${el.position.left || "auto"}, ${el.position.right || "auto"})
          </span>
        </div>
      `
        )
        .join("");

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
              ext6.domElements.length
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

    generateTextReport(data) {
      return `
EXTENSION ZERO DEBUG REPORT
Generated: ${data.timestamp}

CURRENT PAGE:
- Title: ${data.currentPage.title || "No title"}
- URL: ${data.currentPage.url}

DEPENDENCIES:
- Extension 1.5: ${
        data.dependencies.extension15.available ? "Available" : "Missing"
      }
- Extension 1.6: ${
        data.dependencies.extension16.available ? "Available" : "Missing"
      }

BUTTON SYSTEMS:
- Extension 1.6 System: ${
        data.buttonSystems.old_system.available ? "Available" : "Not found"
      }
  Buttons: ${
    Object.keys(data.buttonSystems.old_system.buttons).join(", ") || "None"
  }
- Extension 2.0 System: ${
        data.buttonSystems.new_system.available ? "Available" : "Not found"
      }
  Buttons: ${
    Object.keys(data.buttonSystems.new_system.buttons).join(", ") || "None"
  }

CONTEXT DETECTION:
- Current Contexts: ${
        data.contextDetection.currentContexts.join(", ") || "None"
      }
- Available Contexts: ${
        data.contextDetection.availableContexts.join(", ") || "None"
      }

EXTENSION 6:
- Services: ${data.extension6Status.services || "Unknown"}
- DOM Elements: ${
        data.extension6Status.domElements.length
      } User Directory button(s) found

RECOMMENDATIONS:
${
  data.recommendations
    .map((rec) => `- ${rec.type.toUpperCase()}: ${rec.title} - ${rec.message}`)
    .join("\n") || "No issues detected"
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
})();
