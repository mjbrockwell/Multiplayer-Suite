// Comment Auto Tagger - Enhanced Version with Utility Integration
// Purpose: Detect comment blocks in roam/comments system and add #ch0 prefix to turn them into conversations
// Result: Comment becomes a conversation starter, then Smart Username Tagger handles replies
// Enhanced with: Utility library integration, better memory management, improved reliability

const commentAutoTagger = (() => {
  // Internal State
  let processedBlocks = new Set();
  let pendingBlocks = new Set();
  let idleTimer = null;
  let cleanupTimer = null;
  let isProcessing = false;
  let extensionAPI = null;

  // Access utilities from the registry
  const getUtility = (name) => {
    return window._extensionRegistry?.utilities?.[name] || null;
  };

  // Debug Function with user context
  const debug = (message) => {
    const getCurrentUser = getUtility("getCurrentUser");
    const user = getCurrentUser ? getCurrentUser() : { displayName: "Unknown" };
    console.log(`Comment Auto Tagger [${user.displayName}]:`, message);
  };

  // Enhanced UID generation using utility library
  const generateUID = () => {
    const utilityGenerateUID = getUtility("generateUID");
    return utilityGenerateUID
      ? utilityGenerateUID()
      : window.roamAlphaAPI.util.generateUID();
  };

  // Periodic cleanup of processed blocks (memory management)
  const setupPeriodicCleanup = () => {
    cleanupTimer = setInterval(() => {
      // Clean up old processed blocks every 10 minutes
      // Keep only blocks from last 1000 operations to prevent unlimited growth
      if (processedBlocks.size > 1000) {
        const blocksArray = Array.from(processedBlocks);
        processedBlocks.clear();
        // Keep the most recent 500
        blocksArray.slice(-500).forEach((uid) => processedBlocks.add(uid));
        debug(
          `Cleaned up processed blocks cache. Kept ${processedBlocks.size} recent entries.`
        );
      }
    }, 10 * 60 * 1000); // 10 minutes

    // Register cleanup timer with extension registry
    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push({
        type: "timer",
        timer: cleanupTimer,
        cleanup: () => clearInterval(cleanupTimer),
      });
    }
  };

  // Extract Block UID from DOM
  const getBlockUidFromDOM = (element) => {
    try {
      const blockElement = element.closest(".rm-block");
      if (!blockElement) return null;

      let blockUid = blockElement.getAttribute("data-uid");

      if (!blockUid && blockElement.id) {
        blockUid = blockElement.id.replace("block-input-", "");
      }

      if (!blockUid) {
        const uidElement = blockElement.querySelector("[data-uid]");
        if (uidElement) {
          blockUid = uidElement.getAttribute("data-uid");
        }
      }

      if (!blockUid) {
        const createTime = blockElement.getAttribute("data-create-time");
        if (createTime) {
          const timestampQuery = window.roamAlphaAPI.data.q(`
            [:find ?uid
             :where 
             [?e :create/time ${createTime}]
             [?e :block/uid ?uid]]
          `);
          if (timestampQuery.length > 0) {
            blockUid = timestampQuery[0][0];
          }
        }
      }

      return blockUid;
    } catch (error) {
      debug(`Error extracting block UID: ${error.message}`);
      return null;
    }
  };

  // Check if block already has #ch0 tag
  const hasConversationTag = (blockContent) => {
    if (!blockContent) return false;
    return blockContent.includes("#ch0");
  };

  // Check if block is currently being edited
  const isBlockBeingEdited = (blockElement) => {
    return (
      blockElement.classList.contains("rm-block--edit") ||
      blockElement.querySelector(".rm-block-input:focus") ||
      blockElement.querySelector("textarea:focus") ||
      blockElement.contains(document.activeElement)
    );
  };

  // Check if block is a FIRST-LEVEL comment block (not nested replies)
  const isCommentBlock = (blockElement) => {
    try {
      // First check: Must be in the roam/comments system
      const pathPageLinks = blockElement.getAttribute("data-path-page-links");
      const pageLinks = blockElement.getAttribute("data-page-links");

      let isInCommentSystem = false;

      if (pathPageLinks && pathPageLinks.includes("roam/comments")) {
        isInCommentSystem = true;
      } else if (pageLinks && pageLinks.includes("roam/comments")) {
        isInCommentSystem = true;
      } else {
        // Check ancestors for roam/comments
        let current = blockElement.parentElement?.closest(".rm-block");
        while (current && current !== document.body) {
          const currentPathPageLinks = current.getAttribute(
            "data-path-page-links"
          );
          const currentPageLinks = current.getAttribute("data-page-links");

          if (
            (currentPathPageLinks &&
              currentPathPageLinks.includes("roam/comments")) ||
            (currentPageLinks && currentPageLinks.includes("roam/comments"))
          ) {
            isInCommentSystem = true;
            break;
          }
          current = current.parentElement?.closest(".rm-block");
        }
      }

      if (!isInCommentSystem) {
        debug(`❌ Not in comment system - no roam/comments found`);
        return false;
      }

      // Second check: Must be FIRST-LEVEL comment (direct child of block reference)
      // Look for parent that contains a block reference (.rm-block-ref)
      let parentBlock = blockElement.parentElement?.closest(".rm-block");

      // Check if immediate parent contains a block reference
      if (parentBlock && parentBlock.querySelector(".rm-block-ref")) {
        // Check if this block is a DIRECT child of that parent
        const childrenContainer =
          parentBlock.querySelector(".rm-block-children");
        if (childrenContainer) {
          const directChildren = Array.from(childrenContainer.children).filter(
            (child) =>
              child.classList.contains("rm-block") ||
              child.classList.contains("roam-block-container")
          );

          const isDirectChild = directChildren.includes(blockElement);

          if (isDirectChild) {
            debug(
              `✅ First-level comment block detected - direct child of block reference`
            );
            return true;
          } else {
            debug(`❌ Not first-level - nested under another comment block`);
            return false;
          }
        }
      }

      // Alternative check: Look for comment icon or specific comment block indicators
      // Comment blocks often have specific styling or attributes
      const hasCommentStyling =
        blockElement.querySelector(".comment-icon") ||
        blockElement.querySelector("[data-comment]") ||
        blockElement.classList.contains("comment-block");

      if (hasCommentStyling) {
        debug(`✅ Comment block detected by styling/attributes`);
        return true;
      }

      debug(`❌ Not a first-level comment block`);
      return false;
    } catch (error) {
      debug(`Error checking if comment block: ${error.message}`);
      return false;
    }
  };

  // Add #ch0 tag to turn comment into conversation
  const addConversationTag = async (blockUid) => {
    try {
      const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
        ":block/uid",
        blockUid,
      ]);

      if (!blockData) {
        debug(`❌ Could not get block data for ${blockUid}`);
        return false;
      }

      const currentContent = blockData[":block/string"] || "";

      if (hasConversationTag(currentContent)) {
        debug(`✅ Block ${blockUid} already has #ch0 tag`);
        return true;
      }

      // Add #ch0 tag to turn this comment into a conversation
      const newContent = `#ch0  ${currentContent}`;

      await window.roamAlphaAPI.data.block.update({
        block: { uid: blockUid, string: newContent },
      });

      debug(`✅ Added #ch0 to comment block ${blockUid} - now a conversation!`);
      return true;
    } catch (error) {
      debug(`❌ Error adding #ch0 tag: ${error.message}`);
      return false;
    }
  };

  // Process pending blocks
  const processPendingBlocks = async () => {
    if (isProcessing || pendingBlocks.size === 0) return;

    isProcessing = true;
    debug(`Processing ${pendingBlocks.size} pending comment blocks...`);

    for (const blockUid of pendingBlocks) {
      // Skip if already processed
      if (processedBlocks.has(blockUid)) {
        pendingBlocks.delete(blockUid);
        continue;
      }

      // Find the DOM element to check if still being edited
      const blockElements = document.querySelectorAll(".rm-block");
      let blockElement = null;

      for (const el of blockElements) {
        if (getBlockUidFromDOM(el) === blockUid) {
          blockElement = el;
          break;
        }
      }

      // Skip if block is currently being edited
      if (blockElement && isBlockBeingEdited(blockElement)) {
        debug(`Skipping ${blockUid} - still being edited`);
        continue;
      }

      // Only process if block is in comment system
      if (blockElement && !isCommentBlock(blockElement)) {
        debug(`Skipping ${blockUid} - not a comment block`);
        pendingBlocks.delete(blockUid);
        continue;
      }

      // Add #ch0 tag to turn comment into conversation
      const success = await addConversationTag(blockUid);
      if (success) {
        processedBlocks.add(blockUid);
        pendingBlocks.delete(blockUid);
        debug(`✅ Successfully converted comment ${blockUid} to conversation`);
      }

      // Small delay between blocks
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    isProcessing = false;
    debug("Pending comment blocks processing complete");
  };

  // Event Handlers
  const handleBlockBlur = (event) => {
    const blockElement = event.target.closest(".rm-block");
    if (!blockElement || !isCommentBlock(blockElement)) return;

    const blockUid = getBlockUidFromDOM(blockElement);
    if (blockUid && !processedBlocks.has(blockUid)) {
      debug(`Comment block ${blockUid} lost focus, adding to pending queue`);
      pendingBlocks.add(blockUid);

      // Process after a short delay
      clearTimeout(idleTimer);
      idleTimer = setTimeout(processPendingBlocks, 2000);
    }
  };

  // Auto-indent the newly created block under the conversation
  const autoIndentNewBlock = async (conversationBlockUid) => {
    try {
      // Wait longer for Roam to fully create the new block (increased from 100ms to 300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Find the currently focused block (should be the new block user is typing in)
      const focusedElement = document.activeElement;
      const focusedBlock = focusedElement?.closest(".rm-block");

      if (!focusedBlock) {
        debug(`Could not find focused block for auto-indent`);
        return false;
      }

      const newBlockUid = getBlockUidFromDOM(focusedBlock);
      if (!newBlockUid) {
        debug(`Could not get UID of new block for auto-indent`);
        return false;
      }

      // Don't indent the conversation block itself
      if (newBlockUid === conversationBlockUid) {
        debug(`Skipping auto-indent - same as conversation block`);
        return false;
      }

      // Get current order of the new block to maintain position among siblings
      const newBlockData = window.roamAlphaAPI.pull(`[:block/order]`, [
        ":block/uid",
        newBlockUid,
      ]);
      const currentOrder = newBlockData?.[":block/order"] || 0;

      // Move the new block to be a child of the conversation block
      await window.roamAlphaAPI.data.block.move({
        location: {
          "parent-uid": conversationBlockUid,
          order: 0, // Place as first child
        },
        block: {
          uid: newBlockUid,
        },
      });

      debug(
        `✅ Auto-indented new block ${newBlockUid} under conversation ${conversationBlockUid}`
      );
      return true;
    } catch (error) {
      debug(`❌ Error auto-indenting new block: ${error.message}`);
      return false;
    }
  };

  // Store event handler references for cleanup
  let keyDownHandler = null;

  // Setup Event Listeners with enhanced integration
  const setupEventListeners = (api) => {
    extensionAPI = api; // Store reference for consistent settings access

    // Handle key events (including auto-indent logic)
    keyDownHandler = async (event) => {
      // Reset idle timer on any keypress
      clearTimeout(idleTimer);

      // If user presses Enter in a comment block, process IMMEDIATELY
      if (event.key === "Enter") {
        const blockElement = event.target.closest(".rm-block");
        if (blockElement && isCommentBlock(blockElement)) {
          const blockUid = getBlockUidFromDOM(blockElement);
          if (blockUid && !processedBlocks.has(blockUid)) {
            debug(
              `Enter pressed - immediately processing comment block ${blockUid}`
            );

            // Increased delay from 100ms to 300ms for better reliability
            setTimeout(async () => {
              // Check if block actually has content before tagging
              const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
                ":block/uid",
                blockUid,
              ]);
              const blockContent = blockData?.[":block/string"] || "";

              if (blockContent.trim().length === 0) {
                debug(`Skipping empty comment block ${blockUid}`);
                return;
              }

              const success = await addConversationTag(blockUid);
              if (success) {
                processedBlocks.add(blockUid);
                pendingBlocks.delete(blockUid);
                debug(
                  `✅ Immediately converted comment ${blockUid} to conversation`
                );

                // Auto-indent the new block under the conversation (if enabled)
                // Fixed: Use stored extensionAPI reference instead of global
                const autoIndentEnabled =
                  extensionAPI.settings.get("autoIndent");
                if (autoIndentEnabled !== false) {
                  // Default to true
                  const indentSuccess = await autoIndentNewBlock(blockUid);
                  if (indentSuccess) {
                    debug(
                      `🎯 Auto-indented new block - nudging toward conversation reply`
                    );
                  }
                } else {
                  debug(`Auto-indent disabled in settings`);
                }
              }
            }, 300); // Increased from 100ms
          }
        }
      }
    };

    document.addEventListener("focusout", handleBlockBlur, true);
    document.addEventListener("keydown", keyDownHandler, true);
    window.addEventListener("beforeunload", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);

    // Register event listeners with extension registry for cleanup
    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push({
        type: "event-listeners",
        cleanup: removeEventListeners,
      });
    }

    debug("Event listeners setup complete");
  };

  const handlePageChange = () => {
    debug("Page change detected, processing pending comment blocks");
    clearTimeout(idleTimer);
    processPendingBlocks();
  };

  // Process existing comment blocks on load
  const processExistingComments = async () => {
    debug("Scanning for existing untagged comment blocks...");

    const allBlocks = document.querySelectorAll(".rm-block");
    let processedCount = 0;

    for (const block of allBlocks) {
      // Skip blocks currently being edited
      if (isBlockBeingEdited(block)) {
        continue;
      }

      // Check if this is a comment block
      if (!isCommentBlock(block)) {
        continue;
      }

      const blockUid = getBlockUidFromDOM(block);
      if (blockUid && !processedBlocks.has(blockUid)) {
        const success = await addConversationTag(blockUid);
        if (success) {
          processedBlocks.add(blockUid);
          processedCount++;
        }
        // Small delay between existing blocks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    debug(
      `Existing comments processed: ${processedCount} comment blocks converted to conversations`
    );
  };

  const removeEventListeners = () => {
    document.removeEventListener("focusout", handleBlockBlur, true);
    if (keyDownHandler) {
      document.removeEventListener("keydown", keyDownHandler, true);
      keyDownHandler = null;
    }
    window.removeEventListener("beforeunload", handlePageChange);
    window.removeEventListener("hashchange", handlePageChange);

    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  };

  // Extension Lifecycle
  const onload = ({ extensionAPI }) => {
    debug(
      "🚀 Loading Enhanced Comment Auto Tagger with Utility Integration..."
    );

    // Initialize extension registry integration if available
    if (!window._extensionRegistry) {
      window._extensionRegistry = {
        extensions: new Map(),
        utilities: {},
        commands: [],
        elements: [],
        observers: [],
      };
    }

    extensionAPI.settings.panel.create({
      tabTitle: "Comment Auto Tagger",
      settings: [
        {
          id: "processExisting",
          name: "Process existing comments on load",
          description:
            "Add #ch0 tags to existing comment blocks when extension loads",
          action: { type: "switch" },
        },
        {
          id: "autoIndent",
          name: "Auto-indent after Enter",
          description:
            "Automatically indent new blocks under conversations (opinionated UX nudge)",
          action: { type: "switch" },
        },
        {
          id: "idleDelay",
          name: "Idle delay (seconds)",
          description:
            "Wait time for focus-loss events (Enter key processes immediately)",
          action: { type: "input", placeholder: "2" },
        },
      ],
    });

    setupEventListeners(extensionAPI);
    setupPeriodicCleanup(); // Enhanced memory management

    // Process existing comments if enabled
    const processExisting = extensionAPI.settings.get("processExisting");
    if (processExisting !== false) {
      setTimeout(processExistingComments, 3000);
    }

    // Get current user context for logging
    const getCurrentUser = getUtility("getCurrentUser");
    const user = getCurrentUser ? getCurrentUser() : { displayName: "Unknown" };

    debug("✅ Enhanced Comment Auto Tagger loaded successfully");
    debug(
      `👤 User context: ${user.displayName} (${
        user.method || "unknown method"
      })`
    );
    debug(
      "🎯 Purpose: Add #ch0 to comment blocks to turn them into conversations"
    );
    debug(
      "📋 Detection: Using data-path-page-links containing 'roam/comments'"
    );
    debug(
      "🎨 Auto-indent: Automatically indents new blocks under conversations for better UX"
    );
    debug("🧹 Memory management: Periodic cleanup of processed blocks cache");
    debug(
      "🔧 Utility integration: Using extension registry for cleanup and utilities"
    );
  };

  const onunload = () => {
    debug("Unloading Enhanced Comment Auto Tagger...");
    removeEventListeners();
    processedBlocks.clear();
    pendingBlocks.clear();
    debug("✅ Enhanced Comment Auto Tagger unloaded and cleaned up");
  };

  return {
    onload,
    onunload,
  };
})();

export default commentAutoTagger;
