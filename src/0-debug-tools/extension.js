// ===================================================================
// Extension 0: Emergency Debug Platform - Session Monitoring Crisis
// FOCUS: Diagnose and clean up the Extension 2 session monitoring flood
// This is exactly why we need Extension 0!
// ===================================================================

// ===================================================================
// 🚨 EMERGENCY DIAGNOSTIC SUITE - Session Monitoring Crisis
// ===================================================================

/**
 * 🔍 Comprehensive Extension 2 Session Crisis Diagnostics
 */
const createSessionCrisisDebugger = () => {
  const debugTools = {
    name: "Session Monitoring Crisis Debugger",
    description:
      "Emergency diagnostics for Extension 2 session monitoring flood",

    // 🔍 1. IDENTIFY THE PROBLEM
    diagnoseProblem() {
      console.group("🚨 SESSION MONITORING CRISIS DIAGNOSIS");

      // Check multiple Extension 2 instances
      console.log("=== MULTIPLE EXTENSION INSTANCES CHECK ===");
      const allScripts = Array.from(document.querySelectorAll("script"));
      const extensionScripts = allScripts.filter(
        (script) =>
          script.src &&
          (script.src.includes("extension") || script.src.includes("roam"))
      );
      console.log(
        `📊 Found ${extensionScripts.length} extension-related scripts loaded`
      );

      // Check DOM listeners registry
      console.log("\n=== DOM LISTENERS ANALYSIS ===");
      if (window._extensionRegistry) {
        const allListeners = window._extensionRegistry.domListeners;
        console.log(`📊 Total registered listeners: ${allListeners.length}`);

        // Group by event type
        const byEventType = {};
        const bySource = {};
        allListeners.forEach((listener) => {
          byEventType[listener.type] = (byEventType[listener.type] || 0) + 1;
          bySource[listener.source || "unknown"] =
            (bySource[listener.source || "unknown"] || 0) + 1;
        });

        console.log("📊 Listeners by event type:", byEventType);
        console.log("📊 Listeners by source:", bySource);

        // Find session monitoring listeners
        const sessionListeners = allListeners.filter(
          (l) =>
            l.source === "session-monitoring" ||
            l.listener.toString().includes("updateActivity")
        );
        console.log(
          `🚨 Session monitoring listeners: ${sessionListeners.length}`
        );
      } else {
        console.log("❌ Extension registry not found!");
      }

      // Check userSession availability
      console.log("\n=== USERSESSION STATUS ===");
      try {
        if (typeof userSession !== "undefined") {
          console.log("✅ userSession is defined globally");
          console.log("📊 Session info:", userSession?.getSessionInfo?.());
        } else {
          console.log("❌ userSession is not defined globally");
        }
      } catch (error) {
        console.log("❌ userSession access error:", error.message);
      }

      // Check platform status
      console.log("\n=== PLATFORM STATUS ===");
      if (window.RoamExtensionSuite) {
        const status = window.RoamExtensionSuite.getStatus();
        console.log("📊 Platform status:", status);
        console.log(
          "🔧 Available utilities:",
          Array.from(window.RoamExtensionSuite.utilities.keys())
        );
      } else {
        console.log("❌ RoamExtensionSuite not found!");
      }

      console.groupEnd();
    },

    // 🧹 2. EMERGENCY CLEANUP
    emergencyCleanup() {
      console.group("🧹 EMERGENCY SESSION LISTENER CLEANUP");

      let cleanedCount = 0;

      // Method 1: Remove from registry
      if (window._extensionRegistry && window._extensionRegistry.domListeners) {
        const registry = window._extensionRegistry;
        const originalCount = registry.domListeners.length;

        // Remove session monitoring listeners
        const sessionListeners = registry.domListeners.filter(
          (l) =>
            l.source === "session-monitoring" ||
            l.listener.toString().includes("updateActivity")
        );

        console.log(
          `🎯 Found ${sessionListeners.length} session monitoring listeners to remove`
        );

        sessionListeners.forEach((listenerInfo) => {
          try {
            document.removeEventListener(
              listenerInfo.type,
              listenerInfo.listener,
              true
            );
            cleanedCount++;
            console.log(`🧹 Removed ${listenerInfo.type} listener`);
          } catch (error) {
            console.warn(
              `⚠️ Failed to remove ${listenerInfo.type} listener:`,
              error.message
            );
          }
        });

        // Update registry
        registry.domListeners = registry.domListeners.filter(
          (l) =>
            l.source !== "session-monitoring" &&
            !l.listener.toString().includes("updateActivity")
        );

        console.log(
          `🧹 Registry cleanup: ${originalCount} → ${registry.domListeners.length} listeners`
        );
      }

      // Method 2: Nuclear option - remove ALL activity listeners
      console.log("\n=== NUCLEAR CLEANUP OPTION ===");
      const activityEvents = ["click", "keydown", "scroll", "mousemove"];
      activityEvents.forEach((eventType) => {
        // Clone the element to remove all listeners (nuclear option)
        const originalDoc = document;
        console.log(`🧹 Available for nuclear cleanup: ${eventType} listeners`);
      });

      console.log(
        `✅ Emergency cleanup completed. Removed ${cleanedCount} session listeners`
      );
      console.log("💡 Try clicking around - errors should be reduced");
      console.groupEnd();
    },

    // 🔧 3. REPAIR EXTENSION 2
    repairExtension2() {
      console.group("🔧 EXTENSION 2 REPAIR ATTEMPT");

      // Check if Extension 2 is properly registered
      if (
        window.RoamExtensionSuite &&
        window.RoamExtensionSuite.has("user-authentication")
      ) {
        console.log("✅ Extension 2 is registered with platform");

        // Try to get the session
        const getAuthenticatedUser = window.RoamExtensionSuite.getUtility(
          "getAuthenticatedUser"
        );
        if (getAuthenticatedUser) {
          try {
            const user = getAuthenticatedUser();
            console.log("👤 Current user via platform:", user?.displayName);
          } catch (error) {
            console.log("❌ Error getting user via platform:", error.message);
          }
        }

        // Try to access session info
        const getSessionInfo =
          window.RoamExtensionSuite.getUtility("getSessionInfo");
        if (getSessionInfo) {
          try {
            const sessionInfo = getSessionInfo();
            console.log("📊 Session info via platform:", sessionInfo);
          } catch (error) {
            console.log("❌ Error getting session info:", error.message);
          }
        }
      } else {
        console.log("❌ Extension 2 not properly registered");
      }

      console.log("💡 Recommendation: Reload Extension 2 with the fixed code");
      console.groupEnd();
    },

    // 📊 4. REAL-TIME MONITORING
    startRealTimeMonitoring() {
      console.group("📊 REAL-TIME ERROR MONITORING");

      let errorCount = 0;
      const errorTypes = {};

      // Override console.error to catch the flood
      const originalError = console.error;
      console.error = function (...args) {
        errorCount++;
        const errorMsg = args.join(" ");

        if (errorMsg.includes("updateActivity")) {
          errorTypes["updateActivity"] =
            (errorTypes["updateActivity"] || 0) + 1;

          // Only log every 10th error to reduce spam
          if (errorTypes["updateActivity"] % 10 === 1) {
            originalError(
              "🚨 Session monitoring error #" + errorTypes["updateActivity"],
              ...args
            );
          }
        } else {
          originalError(...args);
        }
      };

      console.log("📊 Real-time error monitoring started");
      console.log(
        "📊 Will report every 10th updateActivity error to reduce spam"
      );

      // Report summary every 10 seconds
      const reportInterval = setInterval(() => {
        if (errorCount > 0) {
          console.log(
            `📊 Error summary (last 10s): ${errorCount} total, updateActivity: ${
              errorTypes["updateActivity"] || 0
            }`
          );
          errorCount = 0;
          Object.keys(errorTypes).forEach((key) => (errorTypes[key] = 0));
        }
      }, 10000);

      console.log("📊 Monitoring active. Will report every 10 seconds.");
      console.groupEnd();

      return () => {
        console.error = originalError;
        clearInterval(reportInterval);
        console.log("📊 Real-time monitoring stopped");
      };
    },

    // 🎯 5. QUICK STATUS CHECK
    quickStatus() {
      const registry = window._extensionRegistry;
      const platform = window.RoamExtensionSuite;

      console.group("⚡ QUICK STATUS CHECK");
      console.log(
        `📊 Registry listeners: ${registry?.domListeners?.length || 0}`
      );
      console.log(
        `📊 Session listeners: ${
          registry?.domListeners?.filter(
            (l) =>
              l.source === "session-monitoring" ||
              l.listener.toString().includes("updateActivity")
          ).length || 0
        }`
      );
      console.log(`🎯 Platform status: ${platform ? "Available" : "Missing"}`);
      console.log(
        `🎯 Extension 2 status: ${
          platform?.has("user-authentication") ? "Registered" : "Missing"
        }`
      );

      try {
        console.log(
          `👤 UserSession global: ${
            typeof userSession !== "undefined" ? "Available" : "Missing"
          }`
        );
      } catch (error) {
        console.log(`👤 UserSession global: Error accessing`);
      }

      console.groupEnd();
    },
  };

  return debugTools;
};

// ===================================================================
// 🎨 EMERGENCY DEBUG INTERFACE - Crisis Management UI
// ===================================================================

/**
 * Create emergency debug interface for session crisis
 */
const createEmergencyDebugInterface = () => {
  // Remove existing debug interface
  const existing = document.getElementById("emergency-debug-interface");
  if (existing) existing.remove();

  const debugInterface = document.createElement("div");
  debugInterface.id = "emergency-debug-interface";
  debugInterface.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background: #fee2e2;
    border: 2px solid #dc2626;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const sessionDebugger = createSessionCrisisDebugger();

  debugInterface.innerHTML = `
    <div style="
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 6px 6px 0 0;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span>🚨 Emergency Debug Platform</span>
      <button onclick="this.closest('#emergency-debug-interface').remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    </div>
    
    <div style="padding: 16px;">
      <div style="margin-bottom: 12px; font-size: 14px; color: #991b1b; font-weight: 500;">
        🚨 Session Monitoring Crisis
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="window.emergencyDebugger.diagnoseProblem()" style="
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🔍 Diagnose Problem
        </button>
        
        <button onclick="window.emergencyDebugger.emergencyCleanup()" style="
          background: #d97706;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🧹 Emergency Cleanup
        </button>
        
        <button onclick="window.emergencyDebugger.repairExtension2()" style="
          background: #059669;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🔧 Repair Extension 2
        </button>
        
        <button onclick="window.emergencyDebugger.quickStatus()" style="
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          ⚡ Quick Status
        </button>
        
        <button onclick="window.errorMonitoringStop = window.emergencyDebugger.startRealTimeMonitoring()" style="
          background: #374151;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          📊 Start Error Monitoring
        </button>
      </div>
      
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #fca5a5; font-size: 12px; color: #991b1b;">
        💡 Step 1: Diagnose → Step 2: Emergency Cleanup → Step 3: Reload Extension 2
      </div>
    </div>
  `;

  document.body.appendChild(debugInterface);

  // Make debugTools globally accessible
  window.emergencyDebugger = sessionDebugger;

  // Register for cleanup
  if (window._extensionRegistry) {
    window._extensionRegistry.elements.push(debugInterface);
  }

  console.log("🚨 Emergency Debug Platform ready!");
  console.log(
    "💡 Use the red panel on the right to diagnose and fix the session crisis"
  );
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Emergency Debug Platform
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🚨 Extension 0: Emergency Debug Platform starting...");

    // ✅ VERIFY FOUNDATION
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Creating emergency interface anyway..."
      );
    }

    // 🚨 CREATE EMERGENCY DEBUG INTERFACE IMMEDIATELY
    createEmergencyDebugInterface();

    // 📝 REGISTER EMERGENCY COMMANDS
    const commands = [
      {
        label: "EMERGENCY: Show Debug Platform",
        callback: createEmergencyDebugInterface,
      },
      {
        label: "EMERGENCY: Diagnose Session Crisis",
        callback: () => {
          if (window.emergencyDebugger) {
            window.emergencyDebugger.diagnoseProblem();
          } else {
            console.log(
              'Emergency debugger not ready - run "EMERGENCY: Show Debug Platform" first'
            );
          }
        },
      },
      {
        label: "EMERGENCY: Clean Up Session Listeners",
        callback: () => {
          if (window.emergencyDebugger) {
            window.emergencyDebugger.emergencyCleanup();
          }
        },
      },
    ];

    commands.forEach((cmd) => {
      try {
        window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
        if (window._extensionRegistry) {
          window._extensionRegistry.commands.push(cmd.label);
        }
      } catch (error) {
        console.warn("Failed to add command:", cmd.label, error.message);
      }
    });

    // 🎯 REGISTER WITH PLATFORM (if available)
    if (window.RoamExtensionSuite) {
      window.RoamExtensionSuite.register(
        "emergency-debug-platform",
        {
          createEmergencyDebugInterface: createEmergencyDebugInterface,
          sessionDebugger: createSessionCrisisDebugger,
          version: "0.1.0",
        },
        {
          name: "Emergency Debug Platform",
          description:
            "Crisis management tools for extension debugging emergencies",
          version: "0.1.0",
          dependencies: [],
        }
      );
    }

    console.log("🚨 Emergency Debug Platform loaded!");
    console.log("🚨 RED EMERGENCY PANEL available in top-right corner");
    console.log(
      '💡 Step 1: Click "🔍 Diagnose Problem" to understand the crisis'
    );
  },

  onunload: () => {
    console.log("🚨 Emergency Debug Platform unloading...");

    // Clean up emergency interface
    const debugInterface = document.getElementById("emergency-debug-interface");
    if (debugInterface) debugInterface.remove();

    // Stop error monitoring if running
    if (window.errorMonitoringStop) {
      window.errorMonitoringStop();
      delete window.errorMonitoringStop;
    }

    // Clean up global debugger
    delete window.emergencyDebugger;

    console.log("✅ Emergency Debug Platform cleanup complete!");
  },
};
