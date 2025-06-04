// 🌳 Extension 1: Core Infrastructure v3.0 - Registry + Event Bus Only
// 🌳 Purpose: Pure foundation layer for Roam Multiplayer Suite - manages extension coordination and communication
// 🌳 Dependencies: None (this IS the foundation)
// 🌳 Architecture: Clean separation of registry and event bus with zero business logic

const coreInfrastructure = (() => {
  // 🌲 1.0 - EXTENSION STATE
  let isInitialized = false;
  let extensionAPI = null;

  // 🌸 1.1 - LOGGING SYSTEM
  // Simple, consistent logging that other extensions can use
  const log = (message, category = "INFO", source = "Core") => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${source} ${timestamp}] ${category}: ${message}`);
  };

  // 🌳 2.0 - EXTENSION REGISTRY SYSTEM
  // 🌳 The "phone book" that lets extensions find and talk to each other

  // 🌲 2.1 - Registry State
  if (!window.RoamMultiplayerSuite) {
    window.RoamMultiplayerSuite = (() => {
      // 🍎 Internal registry storage
      const extensions = new Map(); // extensionId -> { id, api, metadata }
      const loadOrder = []; // Order extensions were registered
      const systemLog = []; // Registry operation history

      // 🌸 Registry logging (separate from main logging)
      const registryLog = (message, category = "REGISTRY") => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${category} ${timestamp}] ${message}`;
        console.log(logEntry);

        // 🦔 Store logs for debugging (keep last 100)
        systemLog.unshift({
          timestamp,
          category,
          message,
          fullTime: new Date().toISOString(),
        });
        if (systemLog.length > 100) systemLog.length = 100;
      };

      // 🌲 2.2 - Core Registry Functions

      // 🌺 Register a new extension with the suite
      const register = (id, api, metadata = {}) => {
        if (extensions.has(id)) {
          registryLog(`⚠️ Extension ${id} already registered, updating...`);
        } else {
          registryLog(`✅ Registering extension: ${id}`);
        }

        // 🌸 Store extension with metadata
        extensions.set(id, {
          id,
          api,
          metadata: {
            version: metadata.version || "1.0.0",
            dependencies: metadata.dependencies || [],
            loadedAt: Date.now(),
            description: metadata.description || "",
            ...metadata,
          },
        });

        // 🦔 Track load order for dependency resolution
        if (!loadOrder.includes(id)) {
          loadOrder.push(id);
        }

        const apiMethods = api ? Object.keys(api).length : 0;
        registryLog(
          `📋 Extension ${id} registered with ${apiMethods} API methods`
        );

        // 🌿 Check for missing dependencies
        const deps = metadata.dependencies || [];
        const missingDeps = deps.filter((dep) => !extensions.has(dep));
        if (missingDeps.length > 0) {
          registryLog(
            `⚠️ Extension ${id} missing dependencies: ${missingDeps.join(
              ", "
            )}`,
            "WARNING"
          );
        }

        return true;
      };

      // 🌺 Get an extension's API by ID
      const get = (id) => {
        const extension = extensions.get(id);
        if (!extension) {
          registryLog(`❌ Extension ${id} not found`);
          return null;
        }
        return extension.api;
      };

      // 🌺 Check if extension exists
      const has = (id) => {
        return extensions.has(id);
      };

      // 🌺 Call a method on another extension safely
      const call = (extensionId, methodName, ...args) => {
        const api = get(extensionId);
        if (!api) {
          registryLog(
            `❌ Cannot call ${extensionId}.${methodName} - extension not found`
          );
          return null;
        }

        if (typeof api[methodName] !== "function") {
          registryLog(`❌ Method ${methodName} not found in ${extensionId}`);
          return null;
        }

        try {
          registryLog(`🔧 Calling ${extensionId}.${methodName}()`, "CALL");
          return api[methodName](...args);
        } catch (error) {
          registryLog(
            `❌ Error calling ${extensionId}.${methodName}: ${error.message}`,
            "ERROR"
          );
          return null;
        }
      };

      // 🌺 List all registered extensions
      const list = () => {
        return Array.from(extensions.keys());
      };

      // 🌺 Get comprehensive system status
      const getStatus = () => {
        const status = {};
        for (const [id, ext] of extensions) {
          status[id] = {
            loaded: true,
            apiMethods: ext.api ? Object.keys(ext.api).length : 0,
            loadedAt: new Date(ext.metadata.loadedAt).toISOString(),
            version: ext.metadata.version,
            description: ext.metadata.description,
            dependencies: ext.metadata.dependencies,
          };
        }

        return {
          totalExtensions: extensions.size,
          loadOrder,
          extensions: status,
          systemHealth: extensions.size > 0 ? "Operational" : "No Extensions",
        };
      };

      // 🌺 Debug function for development
      const debug = () => {
        registryLog("=== EXTENSION REGISTRY DEBUG ===", "DEBUG");
        const status = getStatus();
        registryLog(`Total Extensions: ${status.totalExtensions}`, "DEBUG");
        registryLog(`Load Order: ${status.loadOrder.join(" → ")}`, "DEBUG");

        for (const [id, info] of Object.entries(status.extensions)) {
          registryLog(
            `${id}: ${info.apiMethods} methods, v${info.version}`,
            "DEBUG"
          );
          if (info.dependencies.length > 0) {
            registryLog(
              `  Dependencies: ${info.dependencies.join(", ")}`,
              "DEBUG"
            );
          }
        }

        registryLog("=== REGISTRY DEBUG COMPLETE ===", "DEBUG");
        return status;
      };

      // 🌺 Get recent registry logs
      const getLogs = () => {
        return systemLog.slice(0, 50);
      };

      // 🌺 Clear registry logs
      const clearLogs = () => {
        systemLog.length = 0;
        registryLog("System logs cleared", "SYSTEM");
      };

      // 🌳 Export registry API
      return {
        register,
        get,
        has,
        call,
        list,
        getStatus,
        debug,
        getLogs,
        clearLogs,
      };
    })();

    // 🌸 Add utility logging function to registry
    window.RoamMultiplayerSuite.log = (msg, source = "Extension") => {
      log(msg, "INFO", source);
    };
  }

  // 🌳 3.0 - CENTRAL EVENT BUS SYSTEM
  // 🌳 The "messenger service" that eliminates duplicate observers and coordinates events

  if (!window.RoamMultiplayerSuite.events) {
    window.RoamMultiplayerSuite.events = (() => {
      // 🌲 3.1 - Event Bus State
      const subscribers = new Map(); // eventType -> [{ callback, extensionId, options }]
      const eventLog = []; // Event history for debugging
      const performance = { events: 0, broadcasts: 0, subscriptions: 0 };

      // 🍎 Global observers (single instances - this is the key innovation!)
      let domObserver = null;
      let focusObserver = null;
      let pageObserver = null;

      // 🦔 Debouncing and throttling utilities
      const debouncers = new Map(); // eventType -> timeout
      const throttlers = new Map(); // eventType -> { lastCall, timeout }

      // 🌸 Event bus logging
      const eventLog_ = (message, category = "EVENT") => {
        const timestamp = new Date().toLocaleTimeString();

        // 🦔 Only log if debug mode is enabled (reduces noise)
        if (window.RoamMultiplayerSuite.events.debugMode) {
          console.log(`[${category} ${timestamp}] ${message}`);
        }

        eventLog.unshift({
          timestamp,
          category,
          message,
          fullTime: new Date().toISOString(),
        });
        if (eventLog.length > 200) eventLog.length = 200;
      };

      // 🌲 3.2 - Core Event Bus Functions

      // 🌺 Subscribe to an event type
      const subscribe = (eventType, callback, extensionId, options = {}) => {
        if (typeof callback !== "function") {
          eventLog_(
            `❌ Invalid callback for ${eventType} from ${extensionId}`,
            "ERROR"
          );
          return false;
        }

        // 🌸 Initialize subscribers list for this event type
        if (!subscribers.has(eventType)) {
          subscribers.set(eventType, []);
        }

        // 🌿 Create subscription with enhanced options
        const subscription = {
          callback,
          extensionId: extensionId || "unknown",
          priority: options.priority || 0, // Higher = executes first
          once: options.once || false, // One-time subscription
          debounce: options.debounce || 0, // Debounce delay in ms
          throttle: options.throttle || 0, // Throttle delay in ms
          filter: options.filter || null, // Function to filter events
          id: `${extensionId}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        };

        subscribers.get(eventType).push(subscription);

        // 🦔 Sort by priority (higher executes first)
        subscribers.get(eventType).sort((a, b) => b.priority - a.priority);

        performance.subscriptions++;
        eventLog_(
          `✅ ${extensionId} subscribed to '${eventType}' (priority: ${subscription.priority})`
        );

        return subscription.id;
      };

      // 🌺 Unsubscribe from an event
      const unsubscribe = (eventType, subscriptionId) => {
        if (!subscribers.has(eventType)) return false;

        const subs = subscribers.get(eventType);
        const index = subs.findIndex((sub) => sub.id === subscriptionId);

        if (index !== -1) {
          const removed = subs.splice(index, 1)[0];
          eventLog_(
            `🗑 Unsubscribed ${removed.extensionId} from '${eventType}'`
          );
          return true;
        }
        return false;
      };

      // 🌺 Broadcast an event to all subscribers
      const broadcast = (eventType, data = {}, meta = {}) => {
        if (!subscribers.has(eventType)) {
          return; // No subscribers, nothing to do
        }

        const startTime = performance.now();

        // 🌸 Create event data object
        const eventData = {
          type: eventType,
          data,
          timestamp: Date.now(),
          source: meta.source || "system",
          ...meta,
        };

        performance.events++;
        performance.broadcasts++;

        eventLog_(
          `📡 Broadcasting '${eventType}' to ${
            subscribers.get(eventType).length
          } subscribers`,
          "BROADCAST"
        );

        const subs = subscribers.get(eventType);
        const toRemove = [];

        // 🌿 Execute all subscriber callbacks
        subs.forEach((subscription, index) => {
          try {
            // 🦔 Apply filter if provided
            if (subscription.filter && !subscription.filter(eventData)) {
              return;
            }

            // 🦔 Handle debouncing
            if (subscription.debounce > 0) {
              const debounceKey = `${subscription.id}-${eventType}`;
              if (debouncers.has(debounceKey)) {
                clearTimeout(debouncers.get(debounceKey));
              }

              debouncers.set(
                debounceKey,
                setTimeout(() => {
                  subscription.callback(eventData);
                  debouncers.delete(debounceKey);
                }, subscription.debounce)
              );
              return;
            }

            // 🦔 Handle throttling
            if (subscription.throttle > 0) {
              const throttleKey = `${subscription.id}-${eventType}`;
              const throttleData = throttlers.get(throttleKey);
              const now = Date.now();

              if (
                throttleData &&
                now - throttleData.lastCall < subscription.throttle
              ) {
                return; // Skip this call
              }

              throttlers.set(throttleKey, { lastCall: now });
            }

            // 🌸 Execute the callback
            subscription.callback(eventData);

            // 🦔 Mark for removal if 'once' option
            if (subscription.once) {
              toRemove.push(index);
            }
          } catch (error) {
            eventLog_(
              `❌ Error in ${subscription.extensionId} callback for '${eventType}': ${error.message}`,
              "ERROR"
            );
          }
        });

        // 🌿 Remove 'once' subscriptions
        toRemove.reverse().forEach((index) => {
          const removed = subs.splice(index, 1)[0];
          eventLog_(
            `🔄 Removed 'once' subscription for ${removed.extensionId}`
          );
        });

        // 🦔 Performance tracking
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        if (duration > 10) {
          eventLog_(
            `⏱ Event '${eventType}' took ${duration}ms to process`,
            "PERFORMANCE"
          );
        }
      };

      // 🌲 3.3 - Global DOM Observer (Single Instance - Key Innovation!)
      const setupDOMObserver = () => {
        if (domObserver) return; // Already set up

        // 🌸 Find Roam's main container
        const targetNode =
          document.querySelector(".roam-body") ||
          document.querySelector(".roam-app") ||
          document.body;

        if (!targetNode) {
          eventLog_("❌ Could not find target node for DOM observer", "ERROR");
          return;
        }

        let processingTimer = null;
        let pendingMutations = [];

        // 🌿 Single observer for ALL extensions
        domObserver = new MutationObserver((mutations) => {
          pendingMutations.push(...mutations);

          // 🦔 Debounce processing to avoid excessive events
          clearTimeout(processingTimer);
          processingTimer = setTimeout(() => {
            const allMutations = [...pendingMutations];
            pendingMutations = [];

            // 🌸 Analyze mutations for different event types
            const analysis = analyzeMutations(allMutations);

            // 🌿 Broadcast specific events based on analysis
            if (analysis.hasBlockChanges) {
              broadcast("dom-blocks-changed", {
                mutations: allMutations,
                analysis,
              });
            }

            if (analysis.hasPageRefChanges) {
              broadcast("dom-page-refs-changed", {
                mutations: allMutations,
                analysis,
              });
            }

            if (analysis.hasNewBlocks) {
              broadcast("dom-new-blocks", {
                mutations: allMutations,
                analysis,
              });
            }

            // 🌸 General DOM change event
            broadcast("dom-changed", { mutations: allMutations, analysis });
          }, 150); // Balanced debounce delay
        });

        // 🌸 Configure observer for comprehensive tracking
        domObserver.observe(targetNode, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["data-uid", "class", "data-page-links"],
        });

        eventLog_("✅ Global DOM observer initialized", "SYSTEM");
      };

      // 🌲 3.4 - Mutation Analysis Helper
      const analyzeMutations = (mutations) => {
        const analysis = {
          hasBlockChanges: false,
          hasPageRefChanges: false,
          hasNewBlocks: false,
          hasTimestampTags: false,
          hasConversationTags: false,
          addedNodes: [],
          removedNodes: [],
          modifiedAttributes: [],
        };

        // 🌿 Analyze each mutation for relevant changes
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            // 🌸 Check added nodes
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                analysis.addedNodes.push(node);

                // 🦔 Check for blocks
                if (
                  node.matches?.(".rm-block") ||
                  node.querySelector?.(".rm-block")
                ) {
                  analysis.hasBlockChanges = true;
                  analysis.hasNewBlocks = true;
                }

                // 🦔 Check for page refs
                if (
                  node.matches?.(".rm-page-ref") ||
                  node.querySelector?.(".rm-page-ref")
                ) {
                  analysis.hasPageRefChanges = true;
                }

                // 🦔 Check for specific tags
                if (node.querySelector?.('.rm-page-ref[data-tag="ts0"]')) {
                  analysis.hasTimestampTags = true;
                }

                if (node.querySelector?.('.rm-page-ref[data-tag="ch0"]')) {
                  analysis.hasConversationTags = true;
                }
              }
            });

            // 🌸 Check removed nodes
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                analysis.removedNodes.push(node);

                if (
                  node.matches?.(".rm-block") ||
                  node.querySelector?.(".rm-block")
                ) {
                  analysis.hasBlockChanges = true;
                }
              }
            });
          }

          // 🌸 Track attribute changes
          if (mutation.type === "attributes") {
            analysis.modifiedAttributes.push({
              target: mutation.target,
              attributeName: mutation.attributeName,
              oldValue: mutation.oldValue,
            });
          }
        });

        return analysis;
      };

      // 🌲 3.5 - Page Change Observer
      const setupPageObserver = () => {
        if (pageObserver) return;

        let currentUrl = window.location.href;
        let currentPageTitle = null;

        // 🌸 Check for page changes
        const checkPageChange = () => {
          const newUrl = window.location.href;
          const newPageTitle = getCurrentPageTitle();

          if (newUrl !== currentUrl || newPageTitle !== currentPageTitle) {
            const oldUrl = currentUrl;
            const oldPageTitle = currentPageTitle;

            currentUrl = newUrl;
            currentPageTitle = newPageTitle;

            // 🌿 Broadcast page change event
            broadcast("page-changed", {
              newUrl,
              oldUrl,
              newPageTitle,
              oldPageTitle,
              pageType: detectPageType(newPageTitle),
            });

            eventLog_(
              `📄 Page changed: ${oldPageTitle || "unknown"} → ${
                newPageTitle || "unknown"
              }`
            );
          }
        };

        // 🌸 Multiple detection methods
        window.addEventListener("hashchange", checkPageChange);
        window.addEventListener("popstate", checkPageChange);

        // 🦔 Polling fallback for SPA navigation
        pageObserver = setInterval(checkPageChange, 1000);

        eventLog_("✅ Page change observer initialized", "SYSTEM");
      };

      // 🌲 3.6 - Focus/Blur Observer
      const setupFocusObserver = () => {
        if (focusObserver) return;

        // 🌸 Handle focus events
        const handleFocusIn = (event) => {
          const blockElement = event.target.closest(".rm-block");
          if (blockElement) {
            broadcast("block-focus", {
              blockElement,
              target: event.target,
              blockUid: getBlockUidFromDOM(blockElement),
            });
          }
        };

        // 🌸 Handle blur events
        const handleFocusOut = (event) => {
          const blockElement = event.target.closest(".rm-block");
          if (blockElement) {
            broadcast("block-blur", {
              blockElement,
              target: event.target,
              blockUid: getBlockUidFromDOM(blockElement),
            });
          }
        };

        // 🌸 Handle key events
        const handleKeyDown = (event) => {
          broadcast("key-pressed", {
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            target: event.target,
            blockElement: event.target.closest(".rm-block"),
          });

          if (event.key === "Enter") {
            const blockElement = event.target.closest(".rm-block");
            if (blockElement) {
              broadcast("block-enter-pressed", {
                blockElement,
                target: event.target,
                blockUid: getBlockUidFromDOM(blockElement),
              });
            }
          }
        };

        // 🌿 Set up event listeners
        document.addEventListener("focusin", handleFocusIn, true);
        document.addEventListener("focusout", handleFocusOut, true);
        document.addEventListener("keydown", handleKeyDown, true);

        focusObserver = {
          destroy: () => {
            document.removeEventListener("focusin", handleFocusIn, true);
            document.removeEventListener("focusout", handleFocusOut, true);
            document.removeEventListener("keydown", handleKeyDown, true);
          },
        };

        eventLog_("✅ Focus/blur observer initialized", "SYSTEM");
      };

      // 🌲 3.7 - Utility Functions

      // 🌺 Get current page title from URL
      const getCurrentPageTitle = () => {
        try {
          const url = window.location.href;

          // 🌸 Check for page UID pattern
          if (url.includes("/page/")) {
            const pageMatch = url.match(/\/page\/(.+)$/);
            if (pageMatch) {
              const pageUid = pageMatch[1];
              if (window.roamAlphaAPI) {
                const pageTitle = window.roamAlphaAPI.data.q(`
                  [:find ?title .
                   :where 
                   [?e :block/uid "${pageUid}"]
                   [?e :node/title ?title]]
                `);
                if (pageTitle) return pageTitle;
              }
            }
          }

          // 🌸 Check for daily note pattern
          const dailyNoteMatch = url.match(/\/(\d{2}-\d{2}-\d{4})$/);
          if (dailyNoteMatch) {
            return dailyNoteMatch[1];
          }

          // 🌸 Fallback to document title
          const titleElement = document.querySelector("title");
          if (titleElement) {
            const title = titleElement.textContent;
            const cleanTitle = title.replace(" - Roam", "").trim();
            if (cleanTitle && cleanTitle !== "Roam") {
              return cleanTitle;
            }
          }

          return null;
        } catch (error) {
          return null;
        }
      };

      // 🌺 Detect page type
      const detectPageType = (pageTitle) => {
        if (!pageTitle) return "unknown";

        if (pageTitle === "Chat Room") return "chatroom";
        if (pageTitle.match(/^\d{2}-\d{2}-\d{4}$/)) return "daily-note";
        if (pageTitle.includes("/user data")) return "user-data";
        if (pageTitle.includes("/user preferences")) return "user-preferences";

        return "page";
      };

      // 🌺 Get block UID from DOM element
      const getBlockUidFromDOM = (element) => {
        try {
          const blockElement = element.closest(".rm-block");
          if (!blockElement) return null;

          return (
            blockElement.getAttribute("data-uid") ||
            blockElement.id?.replace("block-input-", "") ||
            blockElement.querySelector("[data-uid]")?.getAttribute("data-uid")
          );
        } catch (error) {
          return null;
        }
      };

      // 🌲 3.8 - Initialization and Cleanup

      // 🌺 Initialize all observers
      const init = () => {
        setupDOMObserver();
        setupPageObserver();
        setupFocusObserver();

        // 🌸 Page lifecycle events
        window.addEventListener("beforeunload", () => {
          broadcast("page-before-unload", { url: window.location.href });
        });

        eventLog_("🚀 Central Event Bus initialized", "SYSTEM");
      };

      // 🌺 Cleanup all observers
      const destroy = () => {
        if (domObserver) {
          domObserver.disconnect();
          domObserver = null;
        }

        if (pageObserver) {
          clearInterval(pageObserver);
          pageObserver = null;
        }

        if (focusObserver) {
          focusObserver.destroy();
          focusObserver = null;
        }

        // 🦔 Clear all timers
        debouncers.forEach((timer) => clearTimeout(timer));
        throttlers.clear();
        debouncers.clear();

        subscribers.clear();

        eventLog_("🧹 Central Event Bus destroyed", "SYSTEM");
      };

      // 🌲 3.9 - Debug and Monitoring

      // 🌺 Get event bus metrics
      const getMetrics = () => {
        return {
          ...performance,
          activeSubscriptions: Array.from(subscribers.entries()).map(
            ([eventType, subs]) => ({
              eventType,
              subscriberCount: subs.length,
              extensions: subs.map((s) => s.extensionId),
            })
          ),
          observersActive: {
            dom: !!domObserver,
            page: !!pageObserver,
            focus: !!focusObserver,
          },
        };
      };

      // 🌺 Debug function
      const debug = () => {
        eventLog_("=== EVENT BUS DEBUG ===", "DEBUG");
        const metrics = getMetrics();

        eventLog_(`Total Events: ${metrics.events}`, "DEBUG");
        eventLog_(`Total Broadcasts: ${metrics.broadcasts}`, "DEBUG");
        eventLog_(`Total Subscriptions: ${metrics.subscriptions}`, "DEBUG");

        metrics.activeSubscriptions.forEach((sub) => {
          eventLog_(
            `${sub.eventType}: ${
              sub.subscriberCount
            } subscribers (${sub.extensions.join(", ")})`,
            "DEBUG"
          );
        });

        eventLog_("=== EVENT BUS DEBUG COMPLETE ===", "DEBUG");
        return metrics;
      };

      // 🌸 Initialize immediately
      setTimeout(init, 100);

      // 🌳 Export event bus API
      return {
        subscribe,
        unsubscribe,
        broadcast,
        getMetrics,
        debug,
        getLogs: () => eventLog.slice(0, 100),
        clearLogs: () => {
          eventLog.length = 0;
        },
        debugMode: false, // Can be enabled for verbose logging

        // 🌿 Convenience methods
        once: (eventType, callback, extensionId) =>
          subscribe(eventType, callback, extensionId, { once: true }),
        debounced: (eventType, callback, extensionId, delay) =>
          subscribe(eventType, callback, extensionId, { debounce: delay }),
        throttled: (eventType, callback, extensionId, delay) =>
          subscribe(eventType, callback, extensionId, { throttle: delay }),

        // 🌸 Manual broadcasting
        emit: broadcast,

        // 🌸 Cleanup
        destroy,
      };
    })();
  }

  // 🌳 4.0 - SYSTEM HEALTH AND TESTING

  // 🌺 4.1 - Self-test function
  const runSelfTest = () => {
    log("=== CORE INFRASTRUCTURE SELF TEST v3.0 ===", "TEST");

    const tests = [
      {
        name: "🌳 Multiplayer Suite Registry Available",
        test: () => !!window.RoamMultiplayerSuite,
      },
      {
        name: "🌳 Central Event Bus Available",
        test: () => !!window.RoamMultiplayerSuite.events,
      },
      {
        name: "🌳 Event Bus Observers Active",
        test: () => {
          const metrics = window.RoamMultiplayerSuite.events.getMetrics();
          return metrics.observersActive.dom && metrics.observersActive.page;
        },
      },
      {
        name: "🌳 Registry Registration Test",
        test: () => {
          const testSuccess = window.RoamMultiplayerSuite.register(
            "test-extension",
            {
              testMethod: () => "test successful",
            }
          );
          const retrieved = window.RoamMultiplayerSuite.get("test-extension");
          return (
            testSuccess &&
            retrieved &&
            retrieved.testMethod() === "test successful"
          );
        },
      },
      {
        name: "🌳 Event Bus Communication Test",
        test: () => {
          let testPassed = false;
          const subscriptionId = window.RoamMultiplayerSuite.events.subscribe(
            "test-event",
            () => {
              testPassed = true;
            },
            "self-test"
          );
          window.RoamMultiplayerSuite.events.broadcast("test-event", {
            test: true,
          });
          window.RoamMultiplayerSuite.events.unsubscribe(
            "test-event",
            subscriptionId
          );
          return testPassed;
        },
      },
    ];

    let allPassed = true;
    const results = [];

    tests.forEach((test) => {
      try {
        const passed = test.test();
        const status = passed ? "✅ PASS" : "❌ FAIL";
        log(`${test.name}: ${status}`, passed ? "SUCCESS" : "ERROR");
        results.push({ name: test.name, passed });
        if (!passed) allPassed = false;
      } catch (error) {
        log(`${test.name}: ❌ ERROR - ${error.message}`, "ERROR");
        results.push({ name: test.name, passed: false, error: error.message });
        allPassed = false;
      }
    });

    log(
      `🌳 Self Test Result: ${
        allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
      }`,
      allPassed ? "SUCCESS" : "ERROR"
    );

    return { allPassed, results };
  };

  // 🌺 4.2 - Get system status
  const getSystemStatus = () => {
    try {
      const eventMetrics = window.RoamMultiplayerSuite.events.getMetrics();

      return {
        timestamp: new Date().toISOString(),
        version: "3.0.0",
        isInitialized,
        registry: {
          available: !!window.RoamMultiplayerSuite,
          extensionCount: window.RoamMultiplayerSuite?.list()?.length || 0,
          registered:
            window.RoamMultiplayerSuite?.has("core-infrastructure") || false,
        },
        eventBus: {
          available: !!window.RoamMultiplayerSuite.events,
          totalEvents: eventMetrics.events,
          totalBroadcasts: eventMetrics.broadcasts,
          activeSubscriptions: eventMetrics.activeSubscriptions.length,
          observersActive: eventMetrics.observersActive,
        },
        systemHealth:
          "🌳 Clean Foundation v3.0 - Roam Multiplayer Suite Registry + Event Bus",
        features: [
          "Extension Registry System",
          "Central Event Bus",
          "Single DOM Observer",
          "Event Coordination",
          "Performance Monitoring",
          "Dependency Management",
        ],
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        version: "3.0.0",
        isInitialized,
        systemHealth: "Error",
        error: error.message,
      };
    }
  };

  // 🌳 5.0 - EXTENSION LIFECYCLE

  // 🌺 5.1 - Extension load
  const onload = async ({ extensionAPI: api }) => {
    try {
      log(
        "🚀 Roam Multiplayer Suite - Core Infrastructure v3.0 loading - Registry + Event Bus Only...",
        "SUCCESS"
      );

      extensionAPI = api;

      // 🌸 Create settings panel
      extensionAPI.settings.panel.create({
        tabTitle: "Roam Multiplayer Suite - Core v3.0",
        settings: [
          {
            id: "enableEventBusDebug",
            name: "🌳 Enable Event Bus Debug Mode",
            description: "Show detailed event system logging",
            action: { type: "switch" },
          },
          {
            id: "enableSelfTest",
            name: "Enable Self-Test on Load",
            description: "Run comprehensive self-test when extension loads",
            action: { type: "switch" },
          },
        ],
      });

      // 🌸 Configure event bus debug mode
      const eventDebug = extensionAPI.settings.get("enableEventBusDebug");
      if (eventDebug) {
        window.RoamMultiplayerSuite.events.debugMode = true;
      }

      // 🌸 Create API for registry registration
      const coreInfrastructureAPI = {
        // 🌳 Registry access
        registry: {
          register: window.RoamMultiplayerSuite.register,
          get: window.RoamMultiplayerSuite.get,
          has: window.RoamMultiplayerSuite.has,
          call: window.RoamMultiplayerSuite.call,
          list: window.RoamMultiplayerSuite.list,
          getStatus: window.RoamMultiplayerSuite.getStatus,
          debug: window.RoamMultiplayerSuite.debug,
        },

        // 🌳 Event bus access
        events: {
          subscribe: window.RoamMultiplayerSuite.events.subscribe,
          unsubscribe: window.RoamMultiplayerSuite.events.unsubscribe,
          broadcast: window.RoamMultiplayerSuite.events.broadcast,
          once: window.RoamMultiplayerSuite.events.once,
          debounced: window.RoamMultiplayerSuite.events.debounced,
          throttled: window.RoamMultiplayerSuite.events.throttled,
          getMetrics: window.RoamMultiplayerSuite.events.getMetrics,
          debug: window.RoamMultiplayerSuite.events.debug,
        },

        // 🌳 System functions
        runSelfTest,
        getSystemStatus,
        log,
      };

      // 🌸 Register self with registry
      const registrationSuccess = window.RoamMultiplayerSuite.register(
        "core-infrastructure",
        coreInfrastructureAPI,
        {
          version: "3.0.0",
          dependencies: [],
          description:
            "Core infrastructure providing registry and event bus foundation for Roam Multiplayer Suite",
        }
      );

      if (registrationSuccess) {
        log(
          "✅ Successfully registered with Roam Multiplayer Suite Registry",
          "SUCCESS"
        );
      } else {
        log(
          "❌ Failed to register with Roam Multiplayer Suite Registry",
          "ERROR"
        );
      }

      // 🌸 Backward compatibility
      window.coreInfrastructure = coreInfrastructureAPI;

      isInitialized = true;
      log(
        "✅ Roam Multiplayer Suite - Core Infrastructure v3.0 loaded successfully",
        "SUCCESS"
      );

      // 🌸 Test event system integration
      setTimeout(() => {
        log("=== CORE INFRASTRUCTURE INTEGRATION TEST ===", "TEST");

        const metrics = window.RoamMultiplayerSuite.events.getMetrics();
        log(
          `Event observers active: ${JSON.stringify(metrics.observersActive)}`,
          "TEST"
        );
        log(`Total events: ${metrics.events}`, "TEST");

        // 🌿 Broadcast ready event
        window.RoamMultiplayerSuite.events.broadcast(
          "core-infrastructure-ready",
          {
            version: "3.0.0",
            features: ["registry", "event-bus", "observers"],
          }
        );

        log("=== CORE INFRASTRUCTURE TEST COMPLETE ===", "TEST");
      }, 2000);

      // 🌸 Auto-run self-test if enabled
      const enableSelfTest = extensionAPI.settings.get("enableSelfTest");
      if (enableSelfTest !== false) {
        setTimeout(() => {
          log("Running auto self-test...");
          runSelfTest();
        }, 1000);
      }
    } catch (error) {
      log(
        `CRITICAL ERROR in Core Infrastructure onload: ${error.message}`,
        "ERROR"
      );
    }
  };

  // 🌺 5.2 - Extension unload
  const onunload = () => {
    try {
      log("Core Infrastructure v3.0 unloading...", "INFO");

      // 🌸 Destroy event bus
      if (window.RoamExtensionSuite?.events?.destroy) {
        window.RoamExtensionSuite.events.destroy();
      }

      // 🌸 Clean up backward compatibility
      if (window.coreInfrastructure) {
        delete window.coreInfrastructure;
      }

      extensionAPI = null;
      isInitialized = false;

      log("✅ Core Infrastructure v3.0 unloaded successfully", "SUCCESS");
    } catch (error) {
      console.error("Error in Core Infrastructure onunload:", error);
    }
  };

  // 🌳 Export extension lifecycle
  return {
    onload,
    onunload,
  };
})();

export default coreInfrastructure;
