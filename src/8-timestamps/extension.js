// 🌳 Extension 8: Timestamp Pills for Multiplayer
// 🌳 Transforms manual #ts0 tags into contextual timestamp pills
// 🌳 Optimized for multi-user graphs with timezone awareness
// 🌳 Enhanced with robust retry system for failure recovery

const Extension8TimestampPills = (() => {
  // 🌲 Internal State
  let observer = null;
  let styleElement = null;
  let isInitialized = false;
  let platform = null;
  let retryQueue = new Map(); // Map of element -> retry attempts
  let retryTimer = null;

  // 🌸 Configuration
  let config = {
    showSeconds: false,
    use24Hour: true,
    tagName: "ts0", // Configurable tag name
    categories: {
      today: {
        display: "today",
        className: "ts-today",
        color: "#dbeafe", // Light blue
      },
      yesterday: {
        display: "yesterday",
        className: "ts-yesterday",
        color: "#ede9fe", // Light purple
      },
      week: {
        className: "ts-week",
        color: "#dcfce7", // Light green
      },
      older: {
        className: "ts-older",
        color: "#fed7aa", // Light orange
      },
    },
    retry: {
      maxAttempts: 4, // Try up to 4 times total
      baseDelay: 1000, // Start with 1 second
      maxDelay: 30000, // Cap at 30 seconds
      exponentialBase: 3, // 1s, 3s, 9s, 27s progression
    },
  };

  // 🌸 Debug Logging
  const debug = (message, data = null) => {
    console.log(`[TS8] ${message}`, data || "");
  };

  // 🌺 PLATFORM INTEGRATION

  // 🌺 Get utilities from Extension 1.5
  const getUtilities = () => {
    if (!platform) {
      platform = window.RoamExtensionSuite;
      if (!platform) {
        debug("⚠️ Extension platform not available");
        return null;
      }
    }

    return {
      getCurrentUser: platform.getUtility("getCurrentUser"),
      findDataValueExact: platform.getUtility("findDataValueExact"),
      extractImageUrls: platform.getUtility("extractImageUrls"),
    };
  };

  // 🌺 TIME FORMATTING LOGIC

  // 🌺 Get simplified time display data
  const getTimeDisplayData = (createTime) => {
    try {
      const now = new Date();
      const messageDate = new Date(createTime);

      // Reset times to start of day for comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDay = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      const diffMs = today.getTime() - messageDay.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Format time for display (respecting 24hr preference)
      const timeStr = messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: config.showSeconds ? "2-digit" : undefined,
        hour12: !config.use24Hour,
      });

      // Full date for tooltip with day name
      const fullDateStr =
        messageDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) + ` at ${timeStr}`;

      // Determine category and display text
      if (diffDays === 0) {
        // Today - just show the time (today is implied)
        return {
          category: "today",
          display: timeStr, // Just the time, no "today" text
          className: config.categories.today.className,
          navigationDate: messageDate,
          tooltip: fullDateStr,
        };
      } else if (diffDays === 1) {
        // Yesterday - show "yesterday" + time
        return {
          category: "yesterday",
          display: `${config.categories.yesterday.display}|${timeStr}`, // Use | as line break separator
          className: config.categories.yesterday.className,
          navigationDate: messageDate,
          tooltip: fullDateStr,
        };
      } else if (diffDays <= 7) {
        // This week - show "DDD|time" format (stacked: Tue / 2:30pm)
        const dayName = messageDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        return {
          category: "week",
          display: `${dayName}|${timeStr}`, // Use | as line break separator
          className: config.categories.week.className,
          navigationDate: messageDate,
          tooltip: fullDateStr,
        };
      } else {
        // Older - show "MMM N|time" format (stacked: Mar 15 / 2:30pm)
        const monthName = messageDate.toLocaleDateString("en-US", {
          month: "short",
        });
        const dayNum = messageDate.getDate();

        return {
          category: "older",
          display: `${monthName} ${dayNum}|${timeStr}`, // Use | as line break separator
          className: config.categories.older.className,
          navigationDate: messageDate,
          tooltip: fullDateStr,
        };
      }
    } catch (error) {
      debug(`Error formatting time: ${error.message}`);
      return {
        category: "error",
        display: "Unknown",
        className: "ts-error",
        navigationDate: null,
        tooltip: "Unable to determine date and time",
      };
    }
  };

  // 🌺 RETRY SYSTEM

  // 🌺 Check if Roam API is ready
  const isRoamApiReady = () => {
    try {
      return !!(
        window.roamAlphaAPI &&
        window.roamAlphaAPI.pull &&
        typeof window.roamAlphaAPI.pull === "function"
      );
    } catch (error) {
      return false;
    }
  };

  // 🌺 Add element to retry queue
  const addToRetryQueue = (element, failureType, error) => {
    const key =
      element.getAttribute("data-ts0-element-id") || Math.random().toString(36);

    if (!element.hasAttribute("data-ts0-element-id")) {
      element.setAttribute("data-ts0-element-id", key);
    }

    const existingRetry = retryQueue.get(key);
    const attempts = existingRetry ? existingRetry.attempts + 1 : 1;

    if (attempts > config.retry.maxAttempts) {
      debug(
        `Giving up on element after ${config.retry.maxAttempts} attempts`,
        element
      );
      setFailureState(
        element,
        "max-retries",
        `Failed after ${config.retry.maxAttempts} attempts`
      );
      retryQueue.delete(key);
      return;
    }

    const nextDelay = Math.min(
      config.retry.baseDelay *
        Math.pow(config.retry.exponentialBase, attempts - 1),
      config.retry.maxDelay
    );

    retryQueue.set(key, {
      element,
      attempts,
      failureType,
      error,
      nextRetry: Date.now() + nextDelay,
    });

    debug(
      `Added to retry queue (attempt ${attempts}/${config.retry.maxAttempts}, next in ${nextDelay}ms): ${failureType}`,
      error
    );

    // Set loading state
    setLoadingState(element, attempts);

    // Schedule retry processing
    scheduleRetryProcessing();
  };

  // 🌺 Set loading state for retrying elements
  const setLoadingState = (element, attempts) => {
    element.setAttribute("data-ts0-processed", "retrying");
    element.setAttribute("data-display", `Loading...\n(${attempts})`);
    element.setAttribute("data-time-class", "ts-loading");
    element.setAttribute("title", `Retrying... (attempt ${attempts})`);
  };

  // 🌺 Set failure state for elements that can't be processed
  const setFailureState = (element, failureType, message) => {
    element.setAttribute("data-ts0-processed", "error");
    element.setAttribute("data-failure-type", failureType);

    switch (failureType) {
      case "no-uid":
        element.setAttribute("data-display", "No UID");
        element.setAttribute("title", "Could not determine block identifier");
        break;
      case "no-time":
        element.setAttribute("data-display", "No Time");
        element.setAttribute("title", "Could not determine creation time");
        break;
      case "api-not-ready":
        element.setAttribute("data-display", "API Wait");
        element.setAttribute("title", "Roam API not ready, will retry");
        break;
      case "max-retries":
        element.setAttribute("data-display", "Failed");
        element.setAttribute("title", message);
        break;
      default:
        element.setAttribute("data-display", "Error");
        element.setAttribute("title", message || "Unknown error occurred");
    }

    element.setAttribute("data-time-class", "ts-error");
  };

  // 🌺 Schedule retry processing
  const scheduleRetryProcessing = () => {
    if (retryTimer) return; // Already scheduled

    retryTimer = setTimeout(() => {
      processRetryQueue();
      retryTimer = null;
    }, 500); // Check every 500ms for due retries
  };

  // 🌺 Process retry queue
  const processRetryQueue = () => {
    const now = Date.now();
    const toRetry = [];

    for (const [key, retryData] of retryQueue.entries()) {
      if (retryData.nextRetry <= now) {
        toRetry.push({ key, ...retryData });
      }
    }

    if (toRetry.length === 0) {
      // Check if there are future retries to schedule
      const futureRetries = Array.from(retryQueue.values()).filter(
        (r) => r.nextRetry > now
      );
      if (futureRetries.length > 0) {
        const nextRetry = Math.min(...futureRetries.map((r) => r.nextRetry));
        const delay = Math.max(500, nextRetry - now);
        retryTimer = setTimeout(() => {
          processRetryQueue();
          retryTimer = null;
        }, delay);
      }
      return;
    }

    debug(`Processing ${toRetry.length} retry attempts...`);

    toRetry.forEach(({ key, element, attempts, failureType }) => {
      try {
        // Check if element still exists in DOM
        if (!document.contains(element)) {
          debug(`Element no longer in DOM, removing from retry queue`);
          retryQueue.delete(key);
          return;
        }

        debug(`Retrying ${failureType} (attempt ${attempts}): `, element);

        // Remove from queue temporarily (will be re-added if it fails again)
        retryQueue.delete(key);

        // Attempt to process again
        processTimestampTag(element, true); // isRetry = true
      } catch (error) {
        debug(`Retry failed: ${error.message}`);
        addToRetryQueue(element, failureType, error.message);
      }
    });

    // Schedule next check if there are more retries pending
    if (retryQueue.size > 0) {
      scheduleRetryProcessing();
    }
  };

  // 🌺 Manual retry function for user control
  const retryAllFailed = () => {
    debug("Manual retry triggered for all failed elements");

    // Find all failed elements
    const failedElements = document.querySelectorAll(
      `[data-tag="${config.tagName}"][data-ts0-processed="error"]`
    );

    failedElements.forEach((element) => {
      const failureType =
        element.getAttribute("data-failure-type") || "unknown";
      element.removeAttribute("data-ts0-processed");
      element.removeAttribute("data-failure-type");
      addToRetryQueue(element, failureType, "manual retry");
    });

    debug(`Added ${failedElements.length} failed elements to retry queue`);
  };

  // 🌺 BLOCK UID EXTRACTION (Multiplayer Adaptation)

  // 🌺 Extract block UID from DOM element (adapted for multiplayer)
  const getBlockUidFromDOM = (element) => {
    try {
      debug("Attempting to extract block UID from:", element);

      // First, try to find the closest block container with various selectors
      let blockElement =
        element.closest(".rm-block__input") ||
        element.closest(".rm-block") ||
        element.closest(".roam-block") ||
        element.closest("[data-block-uid]") ||
        element.closest("[data-uid]") ||
        element.closest(".rm-block-text") ||
        element.closest(".rm-block-main");

      debug("Found block container:", blockElement);

      if (!blockElement) {
        // Fallback: traverse up the DOM tree looking for block identifiers
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (
            parent.hasAttribute("data-uid") ||
            parent.hasAttribute("data-block-uid") ||
            parent.id?.includes("block-input-") ||
            parent.classList.contains("rm-block")
          ) {
            blockElement = parent;
            debug("Found block via traversal:", blockElement);
            break;
          }
          parent = parent.parentElement;
        }
      }

      if (!blockElement) {
        debug("No block container found after exhaustive search");
        return null;
      }

      // Try multiple methods to get block UID
      let blockUid = null;

      // Method 1: data-uid attribute (Roam standard)
      blockUid = blockElement.getAttribute("data-uid");
      if (blockUid) {
        debug(`Found block UID via data-uid: ${blockUid}`);
        return blockUid;
      }

      // Method 2: data-block-uid attribute (multiplayer specific)
      blockUid = blockElement.getAttribute("data-block-uid");
      if (blockUid) {
        debug(`Found block UID via data-block-uid: ${blockUid}`);
        return blockUid;
      }

      // Method 3: ID attribute pattern (block-input-{complex-id})
      const elementId = blockElement.id;
      if (elementId && elementId.includes("block-input-")) {
        const rawUid = elementId.replace("block-input-", "");
        // Handle Roam's complex ID format: user-body-outline-page-BLOCKUID
        // Extract just the last part which is the actual block UID
        const parts = rawUid.split("-");
        if (parts.length >= 2) {
          blockUid = parts[parts.length - 1]; // Get the last part
          debug(`Found block UID via ID parsing: ${blockUid} (from ${rawUid})`);
          return blockUid;
        } else {
          blockUid = rawUid;
          debug(`Found block UID via ID: ${blockUid}`);
          return blockUid;
        }
      }

      // Method 4: Search for data-uid in direct children
      const uidElement = blockElement.querySelector(
        "[data-uid]:not([data-link-uid]), [data-block-uid]"
      );
      if (uidElement) {
        blockUid =
          uidElement.getAttribute("data-uid") ||
          uidElement.getAttribute("data-block-uid");
        debug(`Found block UID via child element: ${blockUid}`);
        return blockUid;
      }

      // Method 5: Look for textarea or input with block-uid pattern
      const inputElement = blockElement.querySelector(
        "textarea[id*='block-input-'], input[id*='block-input-']"
      );
      if (inputElement && inputElement.id) {
        blockUid = inputElement.id.replace("block-input-", "");
        debug(`Found block UID via input element: ${blockUid}`);
        return blockUid;
      }

      // Method 6: Check if the block element itself has a class or data attribute pattern
      const classes = Array.from(blockElement.classList);
      for (const className of classes) {
        if (className.includes("block-") && className.length > 10) {
          // Might be a block UID in class name
          const possibleUid = className
            .replace(/^.*block-/, "")
            .replace(/\W/g, "");
          if (possibleUid.length >= 9) {
            // Roam UIDs are typically 9+ chars
            debug(`Found potential block UID via class: ${possibleUid}`);
            return possibleUid;
          }
        }
      }

      debug("Could not extract block UID from DOM element after all methods");
      debug(
        "Block element attributes:",
        Array.from(blockElement.attributes).map((a) => `${a.name}="${a.value}"`)
      );
      return null;
    } catch (error) {
      debug(`Error extracting block UID: ${error.message}`);
      return null;
    }
  };

  // 🌺 ROAM API INTEGRATION (Multiplayer-aware)

  // 🌺 Get block creation time from API
  const getBlockCreateTime = (blockUid) => {
    try {
      debug(`Querying API for block ${blockUid}...`);

      // Check if API is ready first
      if (!isRoamApiReady()) {
        debug("Roam API not ready");
        return null;
      }

      // Try Roam API first
      if (window.roamAlphaAPI?.pull) {
        const blockData = window.roamAlphaAPI.pull(
          "[:block/uid :create/time]",
          [":block/uid", blockUid]
        );

        if (blockData && blockData[":create/time"]) {
          const createTime = blockData[":create/time"];
          debug(`Found create time for ${blockUid}: ${createTime}`);
          return createTime;
        }
      }

      // Fallback: check if multiplayer system provides alternative timestamp access
      // This could be adapted based on your multiplayer system's API
      if (window.MultiplayerAPI?.getBlockTimestamp) {
        const timestamp = window.MultiplayerAPI.getBlockTimestamp(blockUid);
        if (timestamp) {
          debug(`Found create time via multiplayer API: ${timestamp}`);
          return timestamp;
        }
      }

      debug(`No create time found for block ${blockUid}`);
      return null;
    } catch (error) {
      debug(`Error querying block create time: ${error.message}`);
      return null;
    }
  };

  // 🌺 DOM PROCESSING

  // 🌺 Process a single #ts0 tag
  const processTimestampTag = (tagElement, isRetry = false) => {
    try {
      // Skip if already processed (unless this is a retry)
      if (!isRetry && tagElement.hasAttribute("data-ts0-processed")) {
        return;
      }

      debug("Processing timestamp tag...", tagElement);

      // Get block UID
      const blockUid = getBlockUidFromDOM(tagElement);
      if (!blockUid) {
        debug("Could not get block UID");
        if (isRetry) {
          setFailureState(
            tagElement,
            "no-uid",
            "Could not determine block identifier"
          );
        } else {
          addToRetryQueue(tagElement, "no-uid", "Block UID extraction failed");
        }
        return;
      }

      // Check if Roam API is ready
      if (!isRoamApiReady()) {
        debug("Roam API not ready");
        if (isRetry) {
          setFailureState(tagElement, "api-not-ready", "Roam API not ready");
        } else {
          addToRetryQueue(tagElement, "api-not-ready", "Roam API not ready");
        }
        return;
      }

      // Get creation time
      const createTime = getBlockCreateTime(blockUid);
      if (!createTime) {
        debug("Could not get creation time");
        if (isRetry) {
          setFailureState(
            tagElement,
            "no-time",
            "Could not determine creation time"
          );
        } else {
          addToRetryQueue(
            tagElement,
            "no-time",
            "Block creation time not found"
          );
        }
        return;
      }

      // Format time display
      const timeData = getTimeDisplayData(createTime);

      // Set data attributes for CSS styling
      tagElement.setAttribute("data-ts0-processed", "success");
      // Convert pipe separator to actual newline for CSS display
      tagElement.setAttribute(
        "data-display",
        timeData.display.replace(/\|/g, "\n")
      );
      tagElement.setAttribute("data-time-class", timeData.className);
      tagElement.setAttribute("data-original-time", createTime);
      tagElement.setAttribute("title", timeData.tooltip);

      // Remove any retry-related attributes
      tagElement.removeAttribute("data-failure-type");
      tagElement.removeAttribute("data-ts0-element-id");

      debug(
        `Successfully processed timestamp tag: ${timeData.display} (${timeData.category})`
      );
    } catch (error) {
      debug(`Error processing timestamp tag: ${error.message}`);
      if (isRetry) {
        setFailureState(
          tagElement,
          "processing-error",
          `Error: ${error.message}`
        );
      } else {
        addToRetryQueue(tagElement, "processing-error", error.message);
      }
    }
  };

  // 🌺 Find and process all timestamp tags
  const processAllTimestampTags = () => {
    debug("Scanning for timestamp tags...");

    // Find all timestamp page references (adapt selector as needed)
    const timestampTags = document.querySelectorAll(
      `.rm-page-ref[data-tag="${config.tagName}"], ` +
        `a[data-link-title="${config.tagName}"], ` +
        `.roam-tag[data-tag="${config.tagName}"]`
    );

    debug(`Found ${timestampTags.length} timestamp tags`);

    timestampTags.forEach((tag, index) => {
      debug(`Processing tag ${index + 1}/${timestampTags.length}`);
      processTimestampTag(tag);
    });

    if (timestampTags.length > 0) {
      debug(`Processed ${timestampTags.length} timestamp tags`);
    }
  };

  // 🌺 CSS INJECTION

  // 🌺 Inject timestamp pill styles
  const injectTimestampStyles = () => {
    if (styleElement) {
      styleElement.remove();
    }

    styleElement = document.createElement("style");
    styleElement.id = "ts8-timestamp-styles";
    styleElement.textContent = `
      /* 🌳 Base timestamp tag transformation */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed],
      a[data-link-title="${config.tagName}"][data-ts0-processed],
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed] {
        font-size: 0 !important;
        display: inline-block !important;
        position: relative !important;
      }

      /* 🌳 Timestamp pill overlay */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]::before,
      a[data-link-title="${config.tagName}"][data-ts0-processed]::before,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]::before {
        content: attr(data-display) !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        padding: 6px 8px !important;
        border-radius: 10px !important;
        white-space: pre-line !important;
        display: inline-block !important;
        position: relative !important;
        top: -4px !important;
        vertical-align: middle !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
        line-height: 1.1 !important;
        text-align: center !important;
        cursor: pointer !important;
        min-height: 26px !important;
        min-width: 38px !important;
      }

      /* 🌳 Convert pipe separator to line break for stacked display */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]::before,
      a[data-link-title="${config.tagName}"][data-ts0-processed]::before,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]::before {
        content: attr(data-display) !important;
        white-space: pre !important;
      }

      /* 🌳 Enhanced tooltip styling */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]:hover::after,
      a[data-link-title="${config.tagName}"][data-ts0-processed]:hover::after,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]:hover::after {
        content: attr(title) !important;
        position: absolute !important;
        bottom: 100% !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: rgba(0, 0, 0, 0.9) !important;
        color: white !important;
        padding: 8px 12px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        z-index: 1000 !important;
        pointer-events: none !important;
        margin-bottom: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }

      /* 🌳 Hover effect */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]:hover::before,
      a[data-link-title="${config.tagName}"][data-ts0-processed]:hover::before,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]:hover::before {
        transform: scale(1.05) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
        border-color: rgba(0, 0, 0, 0.15) !important;
      }

      /* 🌳 Active/click effect */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]:active::before,
      a[data-link-title="${config.tagName}"][data-ts0-processed]:active::before,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]:active::before {
        transform: scale(0.95) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }

      /* 🌳 Color themes for different time periods */
      
      /* Today - Light Blue with better contrast */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-today"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-today"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-today"]::before {
        background: linear-gradient(135deg, #eff6ff, #dbeafe) !important;
        color: #1e3a8a !important;
        border-color: rgba(30, 58, 138, 0.2) !important;
      }

      /* Yesterday - Light Purple with better contrast */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-yesterday"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-yesterday"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-yesterday"]::before {
        background: linear-gradient(135deg, #f5f3ff, #ede9fe) !important;
        color: #4c1d95 !important;
        border-color: rgba(76, 29, 149, 0.2) !important;
      }

      /* This week - Light Green with better contrast */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-week"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-week"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-week"]::before {
        background: linear-gradient(135deg, #f0fdf4, #dcfce7) !important;
        color: #14532d !important;
        border-color: rgba(20, 83, 45, 0.2) !important;
      }

      /* Older - Light Orange with better contrast */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-older"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-older"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-older"]::before {
        background: linear-gradient(135deg, #fffbeb, #fed7aa) !important;
        color: #9a3412 !important;
        border-color: rgba(154, 52, 18, 0.2) !important;
      }

      /* Loading state - Animated Light Gray */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-loading"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-loading"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-loading"]::before {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb) !important;
        color: #6b7280 !important;
        border-color: rgba(107, 114, 128, 0.2) !important;
        animation: ts-loading-pulse 1.5s ease-in-out infinite !important;
      }

      /* Error state - Light Red */
      .rm-page-ref[data-tag="${config.tagName}"][data-time-class="ts-error"]::before,
      a[data-link-title="${config.tagName}"][data-time-class="ts-error"]::before,
      .roam-tag[data-tag="${config.tagName}"][data-time-class="ts-error"]::before {
        background: linear-gradient(135deg, #fecaca, #fecacaE6) !important;
        color: #991b1b !important;
        border-color: rgba(153, 27, 27, 0.2) !important;
      }

      /* 🌳 Loading animation */
      @keyframes ts-loading-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* 🌳 Hide the original tag text completely */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed] .rm-page-ref__label,
      a[data-link-title="${config.tagName}"][data-ts0-processed] *,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed] * {
        display: none !important;
      }

      /* 🌳 Ensure proper spacing */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed],
      a[data-link-title="${config.tagName}"][data-ts0-processed],
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed] {
        margin: 0 3px !important;
      }

      /* 🌳 Add subtle focus outline for accessibility */
      .rm-page-ref[data-tag="${config.tagName}"][data-ts0-processed]:focus::before,
      a[data-link-title="${config.tagName}"][data-ts0-processed]:focus::before,
      .roam-tag[data-tag="${config.tagName}"][data-ts0-processed]:focus::before {
        outline: 2px solid rgba(59, 130, 246, 0.5) !important;
        outline-offset: 1px !important;
      }
    `;

    document.head.appendChild(styleElement);
    debug("Timestamp styles injected");
  };

  // 🌺 OBSERVER SETUP

  // 🌺 Set up DOM mutation observer
  const setupObserver = () => {
    const targetNode =
      document.querySelector(".roam-body") ||
      document.querySelector(".roam-app") ||
      document.querySelector(".rm-article-wrapper") ||
      document.body;

    if (!targetNode) {
      debug("Could not find target for observer");
      return;
    }

    observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new node contains timestamp tags
              const hasTimestampTags =
                node.querySelector?.(
                  `.rm-page-ref[data-tag="${config.tagName}"]`
                ) ||
                node.matches?.(`.rm-page-ref[data-tag="${config.tagName}"]`) ||
                node.querySelector?.(
                  `a[data-link-title="${config.tagName}"]`
                ) ||
                node.matches?.(`a[data-link-title="${config.tagName}"]`) ||
                node.querySelector?.(
                  `.roam-tag[data-tag="${config.tagName}"]`
                ) ||
                node.matches?.(`.roam-tag[data-tag="${config.tagName}"]`);

              if (hasTimestampTags) {
                shouldProcess = true;
              }
            }
          });
        }
      });

      if (shouldProcess) {
        // Small delay to let DOM settle
        setTimeout(processAllTimestampTags, 100);
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    debug("DOM observer set up successfully");
  };

  // 🌺 CONFIGURATION

  // 🌺 Update configuration
  const updateConfig = (newConfig) => {
    config = { ...config, ...newConfig };
    debug("Configuration updated", config);

    // Re-inject styles with new config
    injectTimestampStyles();

    // Re-process existing tags
    processAllTimestampTags();
  };

  // 🌺 PUBLIC API & LIFECYCLE

  // 🌺 Initialize extension
  const init = () => {
    if (isInitialized) {
      debug("Extension already initialized");
      return;
    }

    debug("Initializing Extension 8: Timestamp Pills...");

    // Check for platform integration
    const utilities = getUtilities();
    if (utilities) {
      debug("✅ Platform utilities available");
    } else {
      debug("⚠️ Platform utilities not available, running standalone");
    }

    // Inject styles first
    injectTimestampStyles();

    // Set up DOM observer
    setupObserver();

    // Process existing tags
    setTimeout(() => {
      processAllTimestampTags();
    }, 1000);

    isInitialized = true;
    debug("Extension 8: Timestamp Pills initialized successfully");
  };

  // 🌺 Cleanup extension
  const cleanup = () => {
    debug("Cleaning up Extension 8: Timestamp Pills...");

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    // Clear retry queue
    retryQueue.clear();

    // Remove data attributes from processed tags
    document
      .querySelectorAll(`[data-tag="${config.tagName}"][data-ts0-processed]`)
      .forEach((tag) => {
        tag.removeAttribute("data-ts0-processed");
        tag.removeAttribute("data-display");
        tag.removeAttribute("data-time-class");
        tag.removeAttribute("data-original-time");
        tag.removeAttribute("data-failure-type");
        tag.removeAttribute("data-ts0-element-id");
        tag.removeAttribute("title");
      });

    isInitialized = false;
    debug("Cleanup completed");
  };

  // 🌺 Manual refresh function
  const refresh = () => {
    debug("Manual refresh triggered");
    processAllTimestampTags();
  };

  // 🌺 Force refresh function (clears processed flags first)
  const forceRefresh = () => {
    debug("Force refresh triggered - clearing all processed flags");

    // Clear all processed flags first
    document
      .querySelectorAll(`[data-tag="${config.tagName}"][data-ts0-processed]`)
      .forEach((tag) => {
        tag.removeAttribute("data-ts0-processed");
        tag.removeAttribute("data-display");
        tag.removeAttribute("data-time-class");
        tag.removeAttribute("data-original-time");
        tag.removeAttribute("title");
        tag.removeAttribute("data-failure-type");
        tag.removeAttribute("data-ts0-element-id");
      });

    // Wait a moment then process
    setTimeout(() => {
      processAllTimestampTags();
    }, 100);
  };

  // 🌺 Debug functions
  const getRetryQueueStatus = () => {
    const status = {
      queueSize: retryQueue.size,
      retries: Array.from(retryQueue.entries()).map(([key, data]) => ({
        key,
        attempts: data.attempts,
        failureType: data.failureType,
        nextRetry: new Date(data.nextRetry).toLocaleTimeString(),
        timeUntilRetry: Math.max(0, data.nextRetry - Date.now()),
      })),
    };
    console.table(status.retries);
    return status;
  };

  // 🍎 ROAM EXTENSION INTERFACE

  const onload = ({ extensionAPI }) => {
    debug("Extension loading...");

    // Register with platform if available
    if (window.RoamExtensionSuite) {
      window.RoamExtensionSuite.register("Extension8_TimestampPills", {
        version: "1.1.0",
        description:
          "Transforms #ts0 tags into contextual timestamp pills with retry system",
        api: {
          updateConfig,
          refresh,
          forceRefresh,
          retryAllFailed,
          debug,
          getConfig: () => config,
          getRetryQueueStatus,
        },
      });
    }

    // Create settings panel
    if (extensionAPI?.settings?.panel?.create) {
      extensionAPI.settings.panel.create({
        tabTitle: "Timestamp Pills",
        settings: [
          {
            id: "tagName",
            name: "Tag Name",
            description: "The tag to transform into timestamp pills",
            action: { type: "input", placeholder: "ts0" },
          },
          {
            id: "use24Hour",
            name: "Use 24-hour time format",
            description: "Show time in 24-hour format in tooltips",
            action: { type: "switch" },
          },
          {
            id: "showSeconds",
            name: "Show seconds in tooltips",
            description: "Include seconds in timestamp tooltips",
            action: { type: "switch" },
          },
        ],
      });
    }

    // Initialize the extension
    init();

    // Export functions for manual control
    window.Extension8_TimestampPills = {
      refresh,
      forceRefresh,
      updateConfig,
      retryAllFailed,
      getConfig: () => config,
      getRetryQueueStatus,
      debug: (enabled) => {
        if (enabled) {
          window.ts8Debug = debug;
        } else {
          delete window.ts8Debug;
        }
      },
    };

    debug("Extension loaded successfully");
    debug(
      "💡 Available commands: window.Extension8_TimestampPills.forceRefresh(), .retryAllFailed(), .getRetryQueueStatus(), .refresh()"
    );
  };

  const onunload = () => {
    debug("Extension unloading...");

    cleanup();

    if (window.Extension8_TimestampPills) {
      delete window.Extension8_TimestampPills;
    }

    if (window.ts8Debug) {
      delete window.ts8Debug;
    }

    // Unregister from platform
    if (window.RoamExtensionSuite?.unregister) {
      window.RoamExtensionSuite.unregister("Extension8_TimestampPills");
    }

    debug("Extension unloaded");
  };

  return {
    onload,
    onunload,
  };
})();

export default Extension8TimestampPills;
