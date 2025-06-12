// ===================================================================
// Extension 1: Foundation Registry - Professional Architecture (FIXED)
// Fixed: Registry sync issues that prevented other extensions from working
// ===================================================================

// ===================================================================
// 🔧 UTILITY FUNCTIONS - David's Proven Patterns
// ===================================================================

// David's addStyle utility - Simple but bulletproof
const addStyle = (content, id) => {
  // Check for existing style with same ID
  if (id && document.getElementById(id)) {
    return document.getElementById(id);
  }

  // Create new style element
  const style = document.createElement("style");
  style.textContent = content;
  if (id) style.id = id;

  document.head.appendChild(style);

  // 📡 REGISTER FOR AUTOMATIC CLEANUP
  if (window._extensionRegistry) {
    window._extensionRegistry.elements.push(style);
  }

  return style;
};

// Get current user (simplified version, will be enhanced in Extension 2)
const getCurrentUser = () => {
  try {
    // Try Josh Brown's new official API first
    const userUid = window.roamAlphaAPI?.user?.uid?.();
    if (userUid) {
      const userData = window.roamAlphaAPI.pull("[*]", [":user/uid", userUid]);
      return userData?.[":user/display-name"] || "Unknown User";
    }
  } catch (e) {
    console.warn("Official user API not available, using fallback");
  }

  // Fallback to basic detection
  return "Current User";
};

// Generate unique ID
const generateUID = () => {
  return (
    window.roamAlphaAPI?.util?.generateUID?.() ||
    "ext-" + Math.random().toString(36).substr(2, 9)
  );
};

// ===================================================================
// 🌐 GLOBAL EXTENSION PLATFORM - Like David's window.roamjs (FIXED)
// ===================================================================

const createExtensionPlatform = () => {
  const platform = {
    // 📊 EXTENSION REGISTRY
    extensions: new Map(),
    utilities: new Map(),
    eventBus: new Map(),

    // 🎯 EXTENSION MANAGEMENT
    register: (id, api, metadata = {}) => {
      platform.extensions.set(id, {
        id,
        api,
        metadata: {
          name: metadata.name || id,
          version: metadata.version || "1.0.0",
          dependencies: metadata.dependencies || [],
          loaded: Date.now(),
          ...metadata,
        },
      });

      // 🔧 SYNC TO REGISTRY (FIXED)
      if (window._extensionRegistry?.extensions) {
        window._extensionRegistry.extensions.set(id, api);
      }

      console.log(`✅ Extension registered: ${id}`);

      // Notify other extensions
      document.body.dispatchEvent(
        new CustomEvent(`roamjs:${id}:loaded`, {
          detail: { id, api, metadata },
        })
      );

      return true;
    },

    get: (id) => {
      const ext = platform.extensions.get(id);
      return ext ? ext.api : null;
    },

    has: (id) => {
      return platform.extensions.has(id);
    },

    // 🔧 UTILITY SHARING (FIXED - NOW SYNCS TO REGISTRY)
    registerUtility: (name, utility) => {
      // Store in platform
      platform.utilities.set(name, utility);

      // 🔧 SYNC TO REGISTRY (CRITICAL FIX)
      if (window._extensionRegistry?.utilities) {
        window._extensionRegistry.utilities[name] = utility;
      }

      console.log(`🔧 Utility registered: ${name}`);
      return true;
    },

    getUtility: (name) => {
      // Try platform first, then registry as fallback
      return (
        platform.utilities.get(name) ||
        window._extensionRegistry?.utilities?.[name]
      );
    },

    // 📡 EVENT BUS
    emit: (event, data) => {
      const listeners = platform.eventBus.get(event) || [];
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.warn(`Event listener error for ${event}:`, e);
        }
      });
      return listeners.length;
    },

    on: (event, callback) => {
      const listeners = platform.eventBus.get(event) || [];
      listeners.push(callback);
      platform.eventBus.set(event, listeners);
      return () => {
        // Return unsubscribe function
        const currentListeners = platform.eventBus.get(event) || [];
        const index = currentListeners.indexOf(callback);
        if (index > -1) {
          currentListeners.splice(index, 1);
          platform.eventBus.set(event, currentListeners);
        }
      };
    },

    // 📊 STATUS AND DEBUG
    getStatus: () => {
      return {
        extensions: Array.from(platform.extensions.keys()),
        utilities: Array.from(platform.utilities.keys()),
        events: Array.from(platform.eventBus.keys()),
        loadedCount: platform.extensions.size,
        timestamp: new Date().toISOString(),
      };
    },

    debug: () => {
      console.group("🎯 Roam Extension Suite Status");
      console.log("Extensions:", platform.getStatus());
      console.log("Platform object:", platform);

      // 🔧 SYNC STATUS DEBUG (NEW)
      if (window._extensionRegistry) {
        console.log(
          "Registry utilities:",
          Object.keys(window._extensionRegistry.utilities || {})
        );
        console.log(
          "Platform utilities:",
          Array.from(platform.utilities.keys())
        );

        const registryCount = Object.keys(
          window._extensionRegistry.utilities || {}
        ).length;
        const platformCount = platform.utilities.size;
        console.log(
          `Sync status: Registry(${registryCount}) Platform(${platformCount}) ${
            registryCount === platformCount ? "✅" : "❌"
          }`
        );
      }

      console.groupEnd();
      return platform.getStatus();
    },
  };

  return platform;
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Proper Format
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🏛️ Foundation Registry starting...");

    // 🎯 COMPLETE REGISTRY STRUCTURE (FIXED)
    window._extensionRegistry = {
      elements: [], // DOM elements (style tags, etc.)
      observers: [], // MutationObservers
      domListeners: [], // Event listeners
      commands: [], // Command palette commands
      timeouts: [], // setTimeout IDs
      intervals: [], // setInterval IDs
      utilities: {}, // 🔧 CRITICAL FIX - Added utilities object
      extensions: new Map(), // 🔧 CRITICAL FIX - Added extensions map
    };

    // 🌐 CREATE GLOBAL PLATFORM
    window.RoamExtensionSuite = createExtensionPlatform();

    // 🔧 REGISTER CORE UTILITIES (These will now sync properly)
    window.RoamExtensionSuite.registerUtility("addStyle", addStyle);
    window.RoamExtensionSuite.registerUtility("getCurrentUser", getCurrentUser);
    window.RoamExtensionSuite.registerUtility("generateUID", generateUID);

    // 🧪 VERIFY SYNC (NEW)
    console.log("🔧 Verifying utility sync:");
    const testUtils = ["addStyle", "getCurrentUser", "generateUID"];
    testUtils.forEach((utilName) => {
      const inPlatform = !!window.RoamExtensionSuite.getUtility(utilName);
      const inRegistry = !!window._extensionRegistry.utilities[utilName];
      console.log(
        `   ${utilName}: Platform(${inPlatform}) Registry(${inRegistry}) ${
          inPlatform && inRegistry ? "✅" : "❌"
        }`
      );
    });

    // 🎨 PROFESSIONAL STYLING
    const foundationStyles = addStyle(
      `
      /* Professional foundation styles for Roam Extension Suite */
      .roam-extension-suite {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.5;
      }
      
      .roam-extension-suite .professional-button {
        background: #137cbd;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s ease;
      }
      
      .roam-extension-suite .professional-button:hover {
        background: #106ba3;
      }
      
      .roam-extension-suite .professional-button:active {
        background: #0f5a8f;
      }
      
      .roam-extension-suite .status-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #15b371;
        margin-right: 6px;
      }
      
      .roam-extension-suite .debug-panel {
        background: rgba(0, 0, 0, 0.05);
        border: 1px solid #e1e5e9;
        border-radius: 6px;
        padding: 12px;
        margin: 8px 0;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 13px;
      }
    `,
      "roam-extension-suite-foundation"
    );

    // 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Show Extension Suite Status",
        callback: () => {
          const status = window.RoamExtensionSuite.debug();
          console.log("📊 Full Extension Suite Status:", status);
        },
      },
      {
        label: "Extension Suite: List Loaded Extensions",
        callback: () => {
          const extensions = window.RoamExtensionSuite.getStatus().extensions;
          console.log("📦 Loaded Extensions:", extensions);
          if (extensions.length === 0) {
            console.log(
              "💡 No extensions loaded yet. Load Extension 2-9 to see coordination!"
            );
          }
        },
      },
      {
        label: "Extension Suite: Debug Registry Sync",
        callback: () => {
          window.RoamExtensionSuite.debug();
        },
      },
    ];

    // Add commands to Roam
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF
    window.RoamExtensionSuite.register(
      "foundation-registry",
      {
        addStyle,
        getCurrentUser,
        generateUID,
        version: "1.0.0",
      },
      {
        name: "Foundation Registry",
        description:
          "Professional lifecycle management and extension coordination platform",
        version: "1.0.0",
        dependencies: [],
      }
    );

    // 🎉 STARTUP COMPLETE
    console.log("🎯 Foundation Registry loaded successfully!");
    console.log('💡 Try: Cmd+P → "Show Extension Suite Status"');

    // Store cleanup function globally
    window._foundationCleanup = () => {
      console.log("🧹 Foundation Registry unloading...");
    };
  },

  onunload: () => {
    console.log("🧹 Professional cleanup starting...");

    const registry = window._extensionRegistry;
    if (registry) {
      // 🧹 AUTOMATIC CLEANUP - David's comprehensive approach
      registry.elements.forEach((el) => {
        try {
          el.remove();
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });

      registry.observers.forEach((obs) => {
        try {
          obs.disconnect();
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });

      registry.domListeners.forEach((listener) => {
        try {
          listener.el.removeEventListener(listener.type, listener.listener);
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });

      registry.commands.forEach((label) => {
        try {
          window.roamAlphaAPI.ui.commandPalette.removeCommand({ label });
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });

      registry.timeouts.forEach((id) => {
        try {
          clearTimeout(id);
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });

      registry.intervals.forEach((id) => {
        try {
          clearInterval(id);
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
      });
    }

    // Run custom cleanup
    if (window._foundationCleanup) {
      try {
        window._foundationCleanup();
      } catch (e) {
        console.warn("Custom cleanup warning:", e);
      }
    }

    // Clean up globals
    delete window._extensionRegistry;
    delete window._foundationCleanup;
    delete window.RoamExtensionSuite;

    console.log("✅ Professional cleanup complete!");
  },
};
