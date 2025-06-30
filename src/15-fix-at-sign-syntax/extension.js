// ===================================================================
// Extension 15: Notification Syntax Cleanup Script - PRODUCTION VERSION
// 🔧 Auto-fix @[[ → [[@ for Better User Experience
// ===================================================================
// Purpose: Automatically corrects @[[Username]] to [[@Username]] syntax
// Method: Uses Roam API to fix content in database (only method that works)
// Triggers: Page navigation, manual command
// Performance: Lightweight API queries with smart debouncing
// ===================================================================

/**
 * 🔧 CONFIGURATION
 */
const EXTENSION_CONFIG = {
  name: "Notification Syntax Cleanup",
  id: "notification-syntax-cleanup",
  debounceDelay: 1000, // ms to wait before running cleanup after page changes
  enableLogging: false, // Set to true for debugging
  runOnPageLoad: true,
  runOnNavigation: true,
};

/**
 * 📊 STATISTICS TRACKING
 */
let cleanupStats = {
  totalFixesApplied: 0,
  blocksProcessed: 0,
  pagesProcessed: 0,
  sessionsRun: 0,
  lastRunTime: null,
  lastFixTime: null,
};

/**
 * ⚡ PERFORMANCE DEBOUNCER
 */
let cleanupTimeout = null;
const debouncedCleanup = (callback) => {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
  }
  cleanupTimeout = setTimeout(() => {
    callback();
    cleanupTimeout = null;
  }, EXTENSION_CONFIG.debounceDelay);
};

/**
 * 🎯 CORE CLEANUP FUNCTION - ROAM API METHOD
 * The only method that actually works - fixes content in Roam's database
 */
const performNotificationCleanup = async () => {
  if (!window.roamAlphaAPI) {
    if (EXTENSION_CONFIG.enableLogging) {
      console.log("❌ [Cleanup] Roam API not available");
    }
    return { success: false, message: "Roam API not available" };
  }

  const startTime = performance.now();
  let fixesApplied = 0;
  let blocksProcessed = 0;

  try {
    cleanupStats.sessionsRun++;
    cleanupStats.lastRunTime = new Date();

    if (EXTENSION_CONFIG.enableLogging) {
      console.log(
        "🔧 [Cleanup] Starting notification syntax cleanup via Roam API..."
      );
    }

    // Query for all blocks containing @[[ patterns
    const query = `[:find ?uid ?string :where [?e :block/uid ?uid] [?e :block/string ?string] [(clojure.string/includes? ?string "@[[")]]`;
    const results = window.roamAlphaAPI.q(query);

    blocksProcessed = results.length;
    cleanupStats.blocksProcessed += blocksProcessed;

    if (results.length === 0) {
      if (EXTENSION_CONFIG.enableLogging) {
        console.log("✅ [Cleanup] No malformed notification syntax found");
      }
      return {
        success: true,
        fixesApplied: 0,
        blocksProcessed: 0,
        duration: performance.now() - startTime,
        message: "No issues found",
      };
    }

    if (EXTENSION_CONFIG.enableLogging) {
      console.log(
        `🔧 [Cleanup] Found ${results.length} blocks with @[[ patterns`
      );
    }

    // Process each block with malformed syntax
    const updatePromises = results.map(async ([uid, originalString]) => {
      if (originalString.includes("@[[")) {
        const fixedString = originalString.replace(/@\[\[/g, "[[@");
        const matchCount = (originalString.match(/@\[\[/g) || []).length;

        try {
          await window.roamAlphaAPI.updateBlock({
            block: {
              uid: uid,
              string: fixedString,
            },
          });

          fixesApplied += matchCount;

          if (EXTENSION_CONFIG.enableLogging) {
            console.log(
              `✅ [Cleanup] Fixed block ${uid}: ${matchCount} pattern(s) corrected`
            );
          }

          return { success: true, uid, matchCount };
        } catch (error) {
          console.error(`❌ [Cleanup] Failed to update block ${uid}:`, error);
          return { success: false, uid, error: error.message };
        }
      }
      return { success: true, uid, matchCount: 0 };
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    cleanupStats.totalFixesApplied += fixesApplied;
    cleanupStats.pagesProcessed++;

    if (fixesApplied > 0) {
      cleanupStats.lastFixTime = new Date();
    }

    const duration = performance.now() - startTime;

    if (fixesApplied > 0) {
      console.log(
        `✅ [Cleanup] Successfully fixed ${fixesApplied} notification syntax errors in ${blocksProcessed} blocks (${duration.toFixed(
          2
        )}ms)`
      );
    } else if (EXTENSION_CONFIG.enableLogging) {
      console.log(
        `✅ [Cleanup] Completed cleanup scan: ${blocksProcessed} blocks checked, no fixes needed (${duration.toFixed(
          2
        )}ms)`
      );
    }

    return {
      success: true,
      fixesApplied,
      blocksProcessed,
      duration,
      message:
        fixesApplied > 0
          ? `Fixed ${fixesApplied} notification syntax errors`
          : "No fixes needed",
    };
  } catch (error) {
    console.error(
      "❌ [Cleanup] Error during notification syntax cleanup:",
      error
    );
    return {
      success: false,
      fixesApplied: 0,
      blocksProcessed: 0,
      duration: performance.now() - startTime,
      error: error.message,
    };
  }
};

/**
 * 🎯 PAGE NAVIGATION HANDLER
 */
const handlePageNavigation = () => {
  if (!EXTENSION_CONFIG.runOnNavigation) return;

  // Debounced cleanup after navigation
  debouncedCleanup(performNotificationCleanup);
};

/**
 * 🔍 DOM CHANGE HANDLER
 * Detects when new content might have been added
 */
const handleDOMChanges = (mutations) => {
  // Look for significant content changes that might introduce new @[[ patterns
  const hasSignificantChanges = mutations.some((mutation) => {
    if (mutation.type === "childList") {
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this looks like a new block or content area
          return (
            node.classList &&
            (node.classList.contains("roam-block") ||
              node.classList.contains("rm-block") ||
              node.classList.contains("roam-article") ||
              node.querySelector(".roam-block, .rm-block"))
          );
        }
        return false;
      });
    }
    return false;
  });

  if (hasSignificantChanges) {
    // Debounced cleanup for DOM changes
    debouncedCleanup(performNotificationCleanup);
  }
};

/**
 * 📈 STATISTICS REPORTING
 */
const getCleanupStatistics = () => {
  return {
    ...cleanupStats,
    isActive: true,
    config: EXTENSION_CONFIG,
    version: "1.0.0",
  };
};

/**
 * 🔧 MANUAL CLEANUP TRIGGER
 */
const triggerManualCleanup = async () => {
  console.log("🔧 [Cleanup] Manual cleanup triggered");
  const result = await performNotificationCleanup();
  console.log("🔧 [Cleanup] Manual cleanup result:", result);
  return result;
};

/**
 * 🚀 MAIN EXTENSION OBJECT
 */
const notificationCleanupExtension = {
  // Extension state
  contentObserver: null,
  navigationObserver: null,

  /**
   * 🎯 EXTENSION ONLOAD
   */
  onload: ({ extensionAPI }) => {
    console.log(
      "🔧 [Cleanup] Notification Syntax Cleanup extension starting..."
    );

    try {
      // Reset session statistics
      cleanupStats.sessionsRun = 0;

      // Create DOM observer for content changes
      notificationCleanupExtension.contentObserver = new MutationObserver(
        handleDOMChanges
      );
      notificationCleanupExtension.contentObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Create navigation observer
      notificationCleanupExtension.navigationObserver = new MutationObserver(
        (mutations) => {
          // Detect page navigation by looking for article/main content changes
          const hasPageChange = mutations.some(
            (mutation) =>
              mutation.type === "childList" &&
              Array.from(mutation.addedNodes).some(
                (node) =>
                  node.nodeType === Node.ELEMENT_NODE &&
                  (node.classList.contains("roam-article") ||
                    node.classList.contains("roam-main") ||
                    node.querySelector(".roam-article, .roam-main"))
              )
          );

          if (hasPageChange) {
            handlePageNavigation();
          }
        }
      );
      notificationCleanupExtension.navigationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Expose global API for manual control and debugging
      if (!window.RoamExtensions) {
        window.RoamExtensions = {};
      }
      window.RoamExtensions.NotificationCleanup = {
        trigger: triggerManualCleanup,
        getStats: getCleanupStatistics,
        config: EXTENSION_CONFIG,
        version: "1.0.0",
      };

      // Run initial cleanup after a short delay
      if (EXTENSION_CONFIG.runOnPageLoad) {
        setTimeout(() => {
          performNotificationCleanup();
        }, 2000);
      }

      console.log(
        "✅ [Cleanup] Notification Syntax Cleanup extension loaded successfully"
      );
      console.log("📋 [Cleanup] Available commands:");
      console.log(
        "   window.RoamExtensions.NotificationCleanup.trigger() - Manual cleanup"
      );
      console.log(
        "   window.RoamExtensions.NotificationCleanup.getStats() - Get statistics"
      );
    } catch (error) {
      console.error(
        "❌ [Cleanup] Failed to initialize Notification Syntax Cleanup extension:",
        error
      );
    }
  },

  /**
   * 🧹 EXTENSION ONUNLOAD
   */
  onunload: () => {
    console.log(
      "🧹 [Cleanup] Notification Syntax Cleanup extension unloading..."
    );

    try {
      // Disconnect observers
      if (notificationCleanupExtension.contentObserver) {
        notificationCleanupExtension.contentObserver.disconnect();
        notificationCleanupExtension.contentObserver = null;
      }

      if (notificationCleanupExtension.navigationObserver) {
        notificationCleanupExtension.navigationObserver.disconnect();
        notificationCleanupExtension.navigationObserver = null;
      }

      // Clear any pending timeouts
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
        cleanupTimeout = null;
      }

      // Remove global API
      if (window.RoamExtensions && window.RoamExtensions.NotificationCleanup) {
        delete window.RoamExtensions.NotificationCleanup;
      }

      console.log("✅ [Cleanup] Extension unloaded successfully");
      console.log("📊 [Cleanup] Final session statistics:", cleanupStats);
    } catch (error) {
      console.error("❌ [Cleanup] Error during extension unload:", error);
    }
  },
};

// ===================================================================
// EXTENSION EXPORT
// ===================================================================

export default notificationCleanupExtension;
