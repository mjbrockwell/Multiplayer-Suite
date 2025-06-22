// 🌳 Smart Username Tagger - Clean Production Version
// 🌳 Auto-tags messages with #ts0 and #[[username]] in two contexts:
// 🌳 1. Direct children of #ch0 conversation blocks
// 🌳 2. Direct children of [[date]] blocks on "chat room" pages
// 🌳 Excludes: #ch0 headers, [[roam/comments]], already tagged blocks

const smartUsernameTagger = (() => {
  // ===================================================================
  // 🌲 1. STATE & CONFIGURATION
  // ===================================================================

  let processedBlocks = new Set();
  let pendingBlocks = new Set();
  let idleTimer = null;
  let isProcessing = false;

  const debug = (message) => {
    console.log("Smart Tagger:", message);
  };

  const getUserPreferences = () => ({
    enableTagging: true,
    idleDelay: 2000,
    processExistingOnLoad: true,
    enableChatRoomTagging: true,
  });

  // ===================================================================
  // 🌲 2. UTILITIES & AUTHOR DETECTION
  // ===================================================================

  const getBlockUidFromDOM = (element) => {
    const blockElement = element.closest(".rm-block");
    if (!blockElement) return null;

    return (
      blockElement.getAttribute("data-uid") ||
      blockElement.id?.replace("block-input-", "") ||
      blockElement.querySelector("[data-uid]")?.getAttribute("data-uid")
    );
  };

  const getBlockAuthor = (blockUid) => {
    try {
      const blockData = window.roamAlphaAPI.pull(`[:block/uid :create/user]`, [
        ":block/uid",
        blockUid,
      ]);

      if (!blockData || !blockData[":create/user"]) return null;

      const userDbId = blockData[":create/user"][":db/id"];
      const userData = window.roamAlphaAPI.pull(
        `[:user/display-name]`,
        userDbId
      );

      return userData?.[":user/display-name"] || null;
    } catch (error) {
      debug(`Error getting block author: ${error.message}`);
      return null;
    }
  };

  const hasUsernameTag = (blockContent, username) => {
    if (!blockContent || !username) return false;

    const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tagPattern = new RegExp(
      `#ts0\\s+#\\[\\[${escapedUsername}\\]\\]`,
      "i"
    );

    return tagPattern.test(blockContent);
  };

  const addUsernameTag = async (blockUid, username) => {
    try {
      // Try utilities first if available
      if (window._extensionRegistry?.utilities?.updateBlock) {
        const updateBlock = window._extensionRegistry.utilities.updateBlock;
        const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
          ":block/uid",
          blockUid,
        ]);

        if (!blockData) return false;
        const currentContent = blockData[":block/string"] || "";

        if (hasUsernameTag(currentContent, username)) return true;

        const newContent = `#ts0 #[[${username}]]  ▸  ${currentContent}`;
        await updateBlock({ uid: blockUid, text: newContent });
        return true;
      }

      // Fallback to direct API
      const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
        ":block/uid",
        blockUid,
      ]);
      if (!blockData) return false;

      const currentContent = blockData[":block/string"] || "";
      if (hasUsernameTag(currentContent, username)) return true;

      const newContent = `#ts0 #[[${username}]]  ▸  ${currentContent}`;
      await window.roamAlphaAPI.data.block.update({
        block: { uid: blockUid, string: newContent },
      });

      return true;
    } catch (error) {
      debug(`Error adding username tags: ${error.message}`);
      return false;
    }
  };

  // ===================================================================
  // 🌲 3. CONTEXT DETECTION
  // ===================================================================

  const isBlockBeingEdited = (blockElement) => {
    return (
      blockElement.classList.contains("rm-block--edit") ||
      blockElement.querySelector(".rm-block-input:focus") ||
      blockElement.querySelector("textarea:focus") ||
      blockElement.contains(document.activeElement)
    );
  };

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

  const isInChatRoomDateContext = (blockElement) => {
    try {
      // Must be on a chat room page
      const pageTitle = document.title || "";
      if (!pageTitle.toLowerCase().includes("chat room")) return false;

      // Must not be under roam/comments
      if (isUnderRoamComments(blockElement)) return false;

      // Must not be a ch0 header itself
      if (containsCh0Header(blockElement)) return false;

      // Find parent block
      const parentBlockElement =
        blockElement.parentElement?.closest(".rm-block");
      if (!parentBlockElement) return false;

      // Parent must contain date pattern
      const parentTextElement =
        parentBlockElement.querySelector(".rm-block-text");
      if (!parentTextElement) return false;

      const parentContent = parentTextElement.textContent || "";
      const hasDatePattern =
        /\[\[([^\]]+)\]\]/.test(parentContent) ||
        /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2}(ST|ND|RD|TH)?,?\s+\d{4}/i.test(
          parentContent
        );

      if (!hasDatePattern) return false;

      // Must be direct child of parent
      const blockChildren = blockElement.parentElement;
      const parentChildren = parentBlockElement.querySelector(
        ":scope > .rm-block-children"
      );

      return blockChildren === parentChildren;
    } catch (error) {
      debug(`Error checking chat room date context: ${error.message}`);
      return false;
    }
  };

  const isInTaggableContext = (blockElement) => {
    return (
      isInConversation(blockElement) || isInChatRoomDateContext(blockElement)
    );
  };

  // ===================================================================
  // 🌲 4. PROCESSING LOGIC
  // ===================================================================

  const processBlockWithRetry = async (blockUid) => {
    const maxAttempts = 3;
    const delays = [500, 1000, 2000]; // Progressive delays

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));

      const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
        ":block/uid",
        blockUid,
      ]);
      const blockContent = blockData?.[":block/string"] || "";

      if (blockContent.trim().length === 0) {
        debug(`Skipping empty block ${blockUid}`);
        return false;
      }

      const authorName = getBlockAuthor(blockUid);
      if (authorName) {
        const success = await addUsernameTag(blockUid, authorName);
        if (success) {
          debug(
            `✅ Tagged block ${blockUid} with ${authorName} (attempt ${
              attempt + 1
            })`
          );
          return true;
        }
      }

      if (attempt < maxAttempts - 1) {
        debug(
          `Retry ${attempt + 1} failed for block ${blockUid}, trying again...`
        );
      }
    }

    debug(`❌ All attempts failed for block ${blockUid}`);
    return false;
  };

  const processPendingBlocks = async () => {
    if (isProcessing || pendingBlocks.size === 0) return;

    const preferences = getUserPreferences();
    if (!preferences.enableTagging) return;

    isProcessing = true;
    debug(`Processing ${pendingBlocks.size} pending blocks...`);

    for (const blockUid of pendingBlocks) {
      if (processedBlocks.has(blockUid)) {
        pendingBlocks.delete(blockUid);
        continue;
      }

      // Find DOM element and validate context
      const blockElements = document.querySelectorAll(".rm-block");
      let blockElement = null;

      for (const el of blockElements) {
        if (getBlockUidFromDOM(el) === blockUid) {
          blockElement = el;
          break;
        }
      }

      if (
        !blockElement ||
        isBlockBeingEdited(blockElement) ||
        !isInTaggableContext(blockElement)
      ) {
        pendingBlocks.delete(blockUid);
        continue;
      }

      const success = await processBlockWithRetry(blockUid);
      if (success) {
        processedBlocks.add(blockUid);
      }
      pendingBlocks.delete(blockUid);

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    isProcessing = false;
  };

  // ===================================================================
  // 🌲 5. EVENT HANDLERS
  // ===================================================================

  const handleBlockBlur = (event) => {
    const blockElement = event.target.closest(".rm-block");
    if (!blockElement || !isInTaggableContext(blockElement)) return;

    const blockUid = getBlockUidFromDOM(blockElement);
    if (blockUid && !processedBlocks.has(blockUid)) {
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
          setTimeout(async () => {
            const success = await processBlockWithRetry(blockUid);
            if (success) {
              processedBlocks.add(blockUid);
              pendingBlocks.delete(blockUid);
            }
          }, 100);
        }
      }
    }
  };

  const handlePageChange = () => {
    clearTimeout(idleTimer);
    processPendingBlocks();
  };

  // ===================================================================
  // 🌲 6. INITIALIZATION & CLEANUP
  // ===================================================================

  const processExistingConversations = async () => {
    const preferences = getUserPreferences();
    if (!preferences.processExistingOnLoad) return;

    debug("Processing existing conversations...");

    // Process #ch0 conversations
    const ch0Tags = document.querySelectorAll('.rm-page-ref[data-tag="ch0"]');
    for (const ch0Tag of ch0Tags) {
      const conversationBlock = ch0Tag.closest(".rm-block");
      if (!conversationBlock) continue;

      const directChildren = conversationBlock.querySelectorAll(
        ":scope > .rm-block-children > .rm-block"
      );
      for (const childBlock of directChildren) {
        if (isBlockBeingEdited(childBlock)) continue;

        const blockUid = getBlockUidFromDOM(childBlock);
        if (blockUid && !processedBlocks.has(blockUid)) {
          const success = await processBlockWithRetry(blockUid);
          if (success) processedBlocks.add(blockUid);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Process chat room date contexts
    if (preferences.enableChatRoomTagging) {
      const pageTitle = document.title || "";
      if (pageTitle.toLowerCase().includes("chat room")) {
        const allBlocks = document.querySelectorAll(".rm-block");

        for (const block of allBlocks) {
          const textElement = block.querySelector(".rm-block-text");
          if (!textElement) continue;

          const content = textElement.textContent || "";
          if (/\[\[([^\]]+)\]\]/.test(content)) {
            const directChildren = block.querySelectorAll(
              ":scope > .rm-block-children > .rm-block"
            );

            for (const childBlock of directChildren) {
              if (isBlockBeingEdited(childBlock)) continue;

              const blockUid = getBlockUidFromDOM(childBlock);
              if (blockUid && !processedBlocks.has(blockUid)) {
                const success = await processBlockWithRetry(blockUid);
                if (success) processedBlocks.add(blockUid);
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            }
          }
        }
      }
    }

    debug("✅ Existing conversations processed");
  };

  const setupEventListeners = () => {
    document.addEventListener("focusout", handleBlockBlur, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);
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

  // ===================================================================
  // 🌲 7. EXTENSION LIFECYCLE
  // ===================================================================

  const onload = ({ extensionAPI }) => {
    debug("🚀 Loading Smart Username Tagger...");

    // Create settings panel
    extensionAPI.settings.panel.create({
      tabTitle: "Smart Username Tagger",
      settings: [
        {
          id: "processExisting",
          name: "Process existing conversations on load",
          description:
            "Add tags to existing conversation messages when extension loads",
          action: { type: "switch" },
        },
        {
          id: "enableChatRoomTagging",
          name: "Enable chat room tagging",
          description: "Tag messages in chat room pages under date headings",
          action: { type: "switch" },
        },
        {
          id: "idleDelay",
          name: "Idle delay (seconds)",
          description: "Wait time for focus-loss events",
          action: { type: "input", placeholder: "2" },
        },
      ],
    });

    setupEventListeners();

    // Process existing conversations
    const processExisting = extensionAPI.settings.get("processExisting");
    if (processExisting !== false) {
      setTimeout(processExistingConversations, 3000);
    }

    // Log status
    const pageTitle = document.title || "";
    const isChatRoom = pageTitle.toLowerCase().includes("chat room");
    const utilitiesAvailable = !!window._extensionRegistry?.utilities;

    debug(`✅ Smart Username Tagger loaded`);
    debug(`📅 Context: ${isChatRoom ? "Chat Room" : "Regular Page"}`);
    debug(
      `🔧 Utilities: ${utilitiesAvailable ? "Available" : "Not Available"}`
    );
  };

  const onunload = () => {
    debug("Unloading Smart Username Tagger...");
    removeEventListeners();
    processedBlocks.clear();
    pendingBlocks.clear();
    debug("✅ Smart Username Tagger unloaded");
  };

  return { onload, onunload };
})();

export default smartUsernameTagger;
