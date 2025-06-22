// 🌳 Enhanced Smart Username Tagger - Integrated with Utilities Suite
// 🌳 Preserves specialized timing logic + adds robust utilities integration
// 🌳 Updated: Better user detection, member validation, preferences support
// 🌳 NEW: Chat room date context support + exclusion criteria

const smartUsernameTagger = (() => {
  // 🌲 1.0 - Internal State (unchanged - this works well)
  let processedBlocks = new Set();
  let pendingBlocks = new Set();
  let idleTimer = null;
  let isProcessing = false;

  // 🌸 1.1 - Debug Function (unchanged)
  const debug = (message) => {
    console.log("Smart Tagger:", message);
  };

  // 🔧 1.2 - ENHANCED: Get Block Author with Robust User Detection (EXACT COPY)
  const getBlockAuthor = (blockUid) => {
    try {
      // Try the original method first (fastest)
      const blockData = window.roamAlphaAPI.pull(`[:block/uid :create/user]`, [
        ":block/uid",
        blockUid,
      ]);

      if (!blockData || !blockData[":create/user"]) {
        return null;
      }

      const userDbId = blockData[":create/user"][":db/id"];
      const userData = window.roamAlphaAPI.pull(
        `[:user/display-name]`,
        userDbId
      );

      const username = userData?.[":user/display-name"] || null;

      // 🆕 ENHANCEMENT: Validate against member list if utilities available
      if (
        username &&
        window._extensionRegistry?.utilities?.getGraphMembersFromList
      ) {
        const getGraphMembersFromList =
          window._extensionRegistry.utilities.getGraphMembersFromList;
        const validMembers = getGraphMembersFromList(
          "roam/graph members",
          "Directory"
        );

        if (validMembers.length > 0 && !validMembers.includes(username)) {
          debug(
            `⚠️ User "${username}" not in member directory, but proceeding with tagging`
          );
          // Note: We still proceed with tagging, just log the validation
        }
      }

      return username;
    } catch (error) {
      debug(`Error getting block author: ${error.message}`);

      // 🆕 FALLBACK: Try utilities-based user detection
      if (window._extensionRegistry?.utilities?.getCurrentUser) {
        try {
          const getCurrentUser =
            window._extensionRegistry.utilities.getCurrentUser;
          const currentUser = getCurrentUser();
          debug(`📝 Fallback: Using current user ${currentUser.displayName}`);
          return currentUser.displayName;
        } catch (fallbackError) {
          debug(
            `Fallback user detection also failed: ${fallbackError.message}`
          );
        }
      }

      return null;
    }
  };

  // 🌺 1.3 - ENHANCED: Extract Block UID with Utilities Fallback (EXACT COPY)
  const getBlockUidFromDOM = (element) => {
    try {
      const blockElement = element.closest(".rm-block");
      if (!blockElement) return null;

      // Try original methods first (fastest)
      let blockUid =
        blockElement.getAttribute("data-uid") ||
        blockElement.id?.replace("block-input-", "") ||
        blockElement.querySelector("[data-uid]")?.getAttribute("data-uid");

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

      // 🆕 ADDITIONAL FALLBACK: Use utilities if available
      if (!blockUid && window._extensionRegistry?.utilities?.generateUID) {
        debug("⚠️ Could not determine block UID, this may cause issues");
      }

      return blockUid;
    } catch (error) {
      debug(`Error extracting block UID: ${error.message}`);
      return null;
    }
  };

  // 🌺 1.4 - Check if block has username tags (EXACT COPY - works well)
  const hasUsernameTag = (blockContent, username) => {
    if (!blockContent || !username) return false;

    const newTagPattern = new RegExp(
      `#ts0\\s+#\\[\\[${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]`,
      "i"
    );

    const oldTagPattern = new RegExp(
      `#\\[\\[${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]`,
      "i"
    );

    return newTagPattern.test(blockContent) || oldTagPattern.test(blockContent);
  };

  // 🌺 1.5 - Check if block is being edited (EXACT COPY - specialized logic)
  const isBlockBeingEdited = (blockElement) => {
    return (
      blockElement.classList.contains("rm-block--edit") ||
      blockElement.querySelector(".rm-block-input:focus") ||
      blockElement.querySelector("textarea:focus") ||
      blockElement.contains(document.activeElement)
    );
  };

  // 🌺 1.6 - Check conversation context (EXACT COPY - domain-specific)
  const isInConversation = (blockElement) => {
    let current = blockElement;
    while (current && current !== document.body) {
      if (current.querySelector('.rm-page-ref[data-tag="ch0"]')) {
        const directChildren = current.querySelectorAll(
          ":scope > .rm-block-children > .rm-block"
        );
        return Array.from(directChildren).some(
          (child) => child === blockElement
        );
      }
      current = current.parentElement;
    }
    return false;
  };

  // 🆕 1.7 - NEW: Check if block is under [[roam/comments]]
  const isUnderRoamComments = (blockElement) => {
    let current = blockElement;
    while (current && current !== document.body) {
      const textElement = current.querySelector(".rm-block-text");
      if (textElement) {
        const content = textElement.textContent || "";
        if (
          content.includes("[[roam/comments]]") ||
          content.includes("roam/comments")
        ) {
          return true;
        }
      }
      current = current.parentElement?.closest(".rm-block");
    }
    return false;
  };

  // 🆕 1.8 - NEW: Check if block contains #ch0 header
  const containsCh0Header = (blockElement) => {
    const textElement = blockElement.querySelector(".rm-block-text");
    if (!textElement) return false;

    const content = textElement.textContent || "";

    // Check for already tagged ch0 blocks OR new ch0 blocks
    return (
      (content.includes("#ts0") && content.includes("ch0")) ||
      content.includes("#ch0") ||
      blockElement.querySelector('.rm-page-ref[data-tag="ch0"]') ||
      blockElement.querySelector('[data-tag="ch0"]')
    );
  };

  // 🆕 1.9 - NEW: Check chat room date context
  const isInChatRoomDateContext = (blockElement) => {
    try {
      // Step 1: Must be on a chat room page
      const pageTitle = document.title || "";
      if (!pageTitle.toLowerCase().includes("chat room")) {
        return false;
      }

      // Step 2: Must not be under roam/comments
      if (isUnderRoamComments(blockElement)) {
        debug(`Skipping block under [[roam/comments]]`);
        return false;
      }

      // Step 3: Must not be a ch0 header itself
      if (containsCh0Header(blockElement)) {
        debug(`Skipping #ch0 header block`);
        return false;
      }

      // Step 4: Find parent block
      const parentBlockElement =
        blockElement.parentElement?.closest(".rm-block");
      if (!parentBlockElement) {
        return false;
      }

      // Step 5: Parent must contain date pattern
      const parentTextElement =
        parentBlockElement.querySelector(".rm-block-text");
      if (!parentTextElement) {
        return false;
      }

      const parentContent = parentTextElement.textContent || "";

      // Look for [[...]] patterns that could be dates
      const dateReferencePattern = /\[\[([^\]]+)\]\]/g;
      const matches = [...parentContent.matchAll(dateReferencePattern)];

      if (matches.length === 0) {
        return false;
      }

      // Step 6: Must be direct child of parent
      const blockChildren = blockElement.parentElement;
      const parentChildren = parentBlockElement.querySelector(
        ":scope > .rm-block-children"
      );

      if (blockChildren !== parentChildren) {
        return false;
      }

      return true;
    } catch (error) {
      debug(`Error checking chat room date context: ${error.message}`);
      return false;
    }
  };

  // 🆕 1.10 - NEW: Combined context checker
  const isInTaggableContext = (blockElement) => {
    return (
      isInConversation(blockElement) || isInChatRoomDateContext(blockElement)
    );
  };

  // 🔧 1.11 - ENHANCED: Add username tags with Utilities Integration (EXACT COPY)
  const addUsernameTag = async (blockUid, username) => {
    try {
      // 🆕 Try utilities-based block update first
      if (window._extensionRegistry?.utilities?.updateBlock) {
        const updateBlock = window._extensionRegistry.utilities.updateBlock;
        const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
          ":block/uid",
          blockUid,
        ]);

        if (!blockData) return false;
        const currentContent = blockData[":block/string"] || "";

        if (hasUsernameTag(currentContent, username)) {
          debug(`Block ${blockUid} already has tags for ${username}`);
          return true;
        }

        const newContent = `#ts0 #[[${username}]]  ▸  ${currentContent}`;

        try {
          await updateBlock({
            uid: blockUid,
            text: newContent,
          });
          debug(
            `✅ Added #ts0 #[[${username}]] to block ${blockUid} (via utilities)`
          );
          return true;
        } catch (utilityError) {
          debug(
            `⚠️ Utility update failed, falling back to direct API: ${utilityError.message}`
          );
        }
      }

      // 🔄 FALLBACK: Original method
      const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
        ":block/uid",
        blockUid,
      ]);
      if (!blockData) return false;

      const currentContent = blockData[":block/string"] || "";

      if (hasUsernameTag(currentContent, username)) {
        debug(`Block ${blockUid} already has tags for ${username}`);
        return true;
      }

      const newContent = `#ts0 #[[${username}]]  ▸  ${currentContent}`;

      await window.roamAlphaAPI.data.block.update({
        block: { uid: blockUid, string: newContent },
      });

      debug(
        `✅ Added #ts0 #[[${username}]] to block ${blockUid} (via direct API)`
      );
      return true;
    } catch (error) {
      debug(`❌ Error adding username tags: ${error.message}`);
      return false;
    }
  };

  // 🆕 1.12 - NEW: Get User Preferences for Tagging Behavior (ENHANCED with chat room)
  const getUserPreferences = () => {
    const defaultPrefs = {
      enableTagging: true,
      idleDelay: 2000,
      processExistingOnLoad: true,
      validateMembership: false,
      enableChatRoomTagging: true, // 🆕 NEW
    };

    try {
      // Try to get preferences from utilities
      if (window._extensionRegistry?.utilities?.findNestedDataValuesExact) {
        const getCurrentUser =
          window._extensionRegistry.utilities.getCurrentUser;
        const getPageUidByTitle =
          window._extensionRegistry.utilities.getPageUidByTitle;
        const findNestedDataValuesExact =
          window._extensionRegistry.utilities.findNestedDataValuesExact;

        const currentUser = getCurrentUser();
        if (currentUser?.displayName) {
          const userPageUid = getPageUidByTitle(currentUser.displayName);
          if (userPageUid) {
            const preferences = findNestedDataValuesExact(
              userPageUid,
              "Smart Tagger Settings"
            );
            return { ...defaultPrefs, ...preferences };
          }
        }
      }
    } catch (error) {
      debug(`Could not load user preferences: ${error.message}`);
    }

    return defaultPrefs;
  };

  // 🌲 2.0 - Smart Processing Logic (UPDATED: use combined context)
  const processPendingBlocks = async () => {
    if (isProcessing || pendingBlocks.size === 0) return;

    const preferences = getUserPreferences();
    if (!preferences.enableTagging) {
      debug("⏸️ Tagging disabled in user preferences");
      return;
    }

    isProcessing = true;
    debug(`Processing ${pendingBlocks.size} pending blocks...`);

    for (const blockUid of pendingBlocks) {
      if (processedBlocks.has(blockUid)) {
        pendingBlocks.delete(blockUid);
        continue;
      }

      // Find DOM element (original logic preserved)
      const blockElements = document.querySelectorAll(".rm-block");
      let blockElement = null;

      for (const el of blockElements) {
        if (getBlockUidFromDOM(el) === blockUid) {
          blockElement = el;
          break;
        }
      }

      if (blockElement && isBlockBeingEdited(blockElement)) {
        debug(`Skipping ${blockUid} - still being edited`);
        continue;
      }

      // 🆕 UPDATED: Check combined taggable context
      if (blockElement && !isInTaggableContext(blockElement)) {
        debug(`Skipping ${blockUid} - not in taggable context`);
        pendingBlocks.delete(blockUid);
        continue;
      }

      // Get author and add tags
      const authorName = getBlockAuthor(blockUid);
      if (authorName) {
        const success = await addUsernameTag(blockUid, authorName);
        if (success) {
          processedBlocks.add(blockUid);
          pendingBlocks.delete(blockUid);
        }
      } else {
        pendingBlocks.delete(blockUid);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    isProcessing = false;
    debug("Pending blocks processing complete");
  };

  // 🌲 3.0 - Event Handlers (UPDATED: use combined context)
  const handleBlockBlur = (event) => {
    const blockElement = event.target.closest(".rm-block");
    if (!blockElement || !isInTaggableContext(blockElement)) return;

    const blockUid = getBlockUidFromDOM(blockElement);
    if (blockUid && !processedBlocks.has(blockUid)) {
      debug(`Block ${blockUid} lost focus, adding to pending queue`);
      pendingBlocks.add(blockUid);

      const preferences = getUserPreferences();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(processPendingBlocks, preferences.idleDelay);
    }
  };

  const handleKeyDown = async (event) => {
    clearTimeout(idleTimer);

    if (event.key === "Enter") {
      const blockElement = event.target.closest(".rm-block");
      if (blockElement && isInTaggableContext(blockElement)) {
        const blockUid = getBlockUidFromDOM(blockElement);
        if (blockUid && !processedBlocks.has(blockUid)) {
          debug(`Enter pressed - immediately processing block ${blockUid}`);

          setTimeout(async () => {
            const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
              ":block/uid",
              blockUid,
            ]);
            const blockContent = blockData?.[":block/string"] || "";

            if (blockContent.trim().length === 0) {
              debug(`Skipping empty block ${blockUid}`);
              return;
            }

            const authorName = getBlockAuthor(blockUid);
            if (authorName) {
              const success = await addUsernameTag(blockUid, authorName);
              if (success) {
                processedBlocks.add(blockUid);
                pendingBlocks.delete(blockUid);
              }
            }
          }, 100);
        }
      }
    }
  };

  const handlePageChange = () => {
    debug("Page change detected, processing pending blocks");
    clearTimeout(idleTimer);
    processPendingBlocks();
  };

  // 🌲 4.0 - Process Existing Conversations (ENHANCED with chat room support)
  const processExistingConversations = async () => {
    const preferences = getUserPreferences();
    if (!preferences.processExistingOnLoad) {
      debug("⏸️ Processing existing conversations disabled in preferences");
      return;
    }

    debug("Scanning existing conversations for direct children only...");

    // 🔄 EXISTING: Process #ch0 conversations (EXACT COPY)
    const ch0Tags = document.querySelectorAll('.rm-page-ref[data-tag="ch0"]');

    for (const ch0Tag of ch0Tags) {
      const conversationBlock = ch0Tag.closest(".rm-block");
      if (!conversationBlock) continue;

      const directChildren = conversationBlock.querySelectorAll(
        ":scope > .rm-block-children > .rm-block"
      );

      debug(`Found ${directChildren.length} direct children in conversation`);

      for (const childBlock of directChildren) {
        if (isBlockBeingEdited(childBlock)) {
          debug("Skipping block in edit mode during initial scan");
          continue;
        }

        const blockUid = getBlockUidFromDOM(childBlock);
        if (blockUid && !processedBlocks.has(blockUid)) {
          const authorName = getBlockAuthor(blockUid);
          if (authorName) {
            await addUsernameTag(blockUid, authorName);
            processedBlocks.add(blockUid);
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }
    }

    // 🆕 NEW: Process chat room date contexts
    if (preferences.enableChatRoomTagging) {
      const pageTitle = document.title || "";
      if (pageTitle.toLowerCase().includes("chat room")) {
        debug(`📅 Processing chat room page: "${pageTitle}"`);

        // Find all blocks that might contain [[date]] references
        const allBlocks = document.querySelectorAll(".rm-block");

        for (const block of allBlocks) {
          const textElement = block.querySelector(".rm-block-text");
          if (!textElement) continue;

          const content = textElement.textContent || "";

          // Check if this block contains [[date]] references
          if (/\[\[([^\]]+)\]\]/.test(content)) {
            // Find direct children of this date block
            const directChildren = block.querySelectorAll(
              ":scope > .rm-block-children > .rm-block"
            );

            debug(
              `Found ${
                directChildren.length
              } direct children under date block: "${content.substring(
                0,
                50
              )}..."`
            );

            for (const childBlock of directChildren) {
              if (isBlockBeingEdited(childBlock)) {
                debug("Skipping block in edit mode during chat room scan");
                continue;
              }

              // Check exclusions
              if (
                isUnderRoamComments(childBlock) ||
                containsCh0Header(childBlock)
              ) {
                debug("Skipping excluded block during chat room scan");
                continue;
              }

              const blockUid = getBlockUidFromDOM(childBlock);
              if (blockUid && !processedBlocks.has(blockUid)) {
                const authorName = getBlockAuthor(blockUid);
                if (authorName) {
                  await addUsernameTag(blockUid, authorName);
                  processedBlocks.add(blockUid);
                  await new Promise((resolve) => setTimeout(resolve, 100));
                }
              }
            }
          }
        }
      }
    }

    debug("Existing conversations and chat rooms processed");
  };

  // 🌲 5.0 - Setup Event Listeners (EXACT COPY - works well)
  const setupEventListeners = () => {
    document.addEventListener("focusout", handleBlockBlur, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);
    debug("Event listeners setup complete");
  };

  const removeEventListeners = () => {
    document.removeEventListener("focusout", handleBlockBlur, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    window.removeEventListener("beforeunload", handlePageChange);
    window.removeEventListener("hashchange", handlePageChange);

    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  // 🍎 6.0 - Extension Lifecycle (ENHANCED with chat room setting)
  const onload = ({ extensionAPI }) => {
    debug(
      "🚀 Loading Enhanced Smart Username Tagger with chat room support..."
    );

    // 🆕 Enhanced settings panel with chat room support
    extensionAPI.settings.panel.create({
      tabTitle: "Smart Username Tagger",
      settings: [
        {
          id: "processExisting",
          name: "Process existing conversations on load",
          description:
            "Add #ts0 and #[[username]] tags to existing conversation messages when extension loads",
          action: { type: "switch" },
        },
        {
          id: "enableChatRoomTagging", // 🆕 NEW
          name: "Enable chat room tagging",
          description:
            "Tag messages in chat room pages under [[date]] headings",
          action: { type: "switch" },
        },
        {
          id: "idleDelay",
          name: "Idle delay (seconds)",
          description:
            "Wait time for focus-loss events (Enter key processes immediately)",
          action: { type: "input", placeholder: "2" },
        },
        {
          id: "validateMembership",
          name: "Validate against member directory",
          description:
            "Check if users exist in the graph member directory (requires utilities)",
          action: { type: "switch" },
        },
        {
          id: "enableUtilities",
          name: "Use utilities for enhanced functionality",
          description:
            "Enable integration with the utilities suite for better reliability",
          action: { type: "switch" },
        },
      ],
    });

    setupEventListeners();

    // Process existing conversations with preferences
    const preferences = getUserPreferences();
    const processExisting = extensionAPI.settings.get("processExisting");

    if (processExisting !== false && preferences.processExistingOnLoad) {
      setTimeout(processExistingConversations, 3000);
    }

    // 🔍 Log utilities integration status
    const utilitiesAvailable = !!window._extensionRegistry?.utilities;
    const pageTitle = document.title || "";
    const isChatRoom = pageTitle.toLowerCase().includes("chat room");

    debug(`✅ Enhanced Smart Username Tagger loaded`);
    debug(
      `🔧 Utilities integration: ${utilitiesAvailable ? "ENABLED" : "DISABLED"}`
    );
    debug(`📅 Chat room context: ${isChatRoom ? "DETECTED" : "NOT DETECTED"}`);
    debug(
      `⚙️ Processing existing conversations: ${
        preferences.processExistingOnLoad ? "ENABLED" : "DISABLED"
      }`
    );
    debug(
      `🏷️ Chat room tagging: ${
        preferences.enableChatRoomTagging ? "ENABLED" : "DISABLED"
      }`
    );

    if (utilitiesAvailable) {
      const availableUtilities = Object.keys(
        window._extensionRegistry.utilities
      );
      debug(`📦 Available utilities: ${availableUtilities.length} functions`);
    }
  };

  const onunload = () => {
    debug("Unloading Enhanced Smart Username Tagger...");
    removeEventListeners();
    processedBlocks.clear();
    pendingBlocks.clear();
    debug("✅ Enhanced Smart Username Tagger unloaded");
  };

  return {
    onload,
    onunload,
  };
})();

export default smartUsernameTagger;
