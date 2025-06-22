// 🌳 Enhanced Smart Username Tagger - Integrated with Utilities Suite
// 🌳 Preserves specialized timing logic + adds robust utilities integration
// 🌳 NEW: Chat room date context support + #ch0 conversation support
// 🌳 Updated: Better user detection, member validation, preferences support

const smartUsernameTagger = (() => {
  // 🌲 1.0 - Internal State (unchanged - this works well)
  let processedBlocks = new Set();
  let pendingBlocks = new Set();
  let idleTimer = null;
  let isProcessing = false;

  // 🌸 1.1 - Debug Function (ENHANCED with immediate test)
  const debug = (message) => {
    console.log("Smart Tagger:", message);
  };

  // 🚨 IMMEDIATE TEST: Verify debug function works
  debug("🚀 DEBUG FUNCTION TEST - Extension is initializing!");

  // 🚨 Test console output immediately
  console.log("🚨 DIRECT CONSOLE TEST - Extension loaded!");
  console.warn("⚠️ CONSOLE WARNING TEST - This should be visible!");
  console.error("❌ CONSOLE ERROR TEST - This should be red!");

  // 🔧 1.2 - ENHANCED: Get Block Author with Robust User Detection
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

  // 🌺 1.3 - ENHANCED: Extract Block UID with Utilities Fallback
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

  // 🌺 1.4 - Check if block has username tags (unchanged - works well)
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

  // 🌺 1.5 - Check if block is being edited (unchanged - specialized logic)
  const isBlockBeingEdited = (blockElement) => {
    return (
      blockElement.classList.contains("rm-block--edit") ||
      blockElement.querySelector(".rm-block-input:focus") ||
      blockElement.querySelector("textarea:focus") ||
      blockElement.contains(document.activeElement)
    );
  };

  // 🌺 1.6 - Check conversation context (unchanged - domain-specific)
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

  // 🆕 1.7 - NEW: Check chat room date context (ENHANCED with roam/comments exclusion)
  const isInChatRoomDateContext = (blockElement) => {
    debug(`🔍 === CHAT ROOM DATE CONTEXT DEBUG START ===`);

    try {
      // 1. Check if we're on a "chat room" page (case-insensitive)
      const pageTitle = document.title || "";
      debug(`📄 Page title: "${pageTitle}"`);
      debug(
        `🔍 Contains 'chat room'? ${pageTitle
          .toLowerCase()
          .includes("chat room")}`
      );

      if (!pageTitle.toLowerCase().includes("chat room")) {
        debug(`❌ Not a chat room page: "${pageTitle}"`);
        debug(
          `🔍 === CHAT ROOM DATE CONTEXT DEBUG END (FAILED: NOT CHAT ROOM) ===`
        );
        return false;
      }

      debug(`✅ Confirmed chat room page!`);

      // 🆕 2. EXCLUSION: Check if block is under [[roam/comments]]
      debug(`🚫 Checking for roam/comments exclusion...`);
      let current = blockElement;
      while (current && current !== document.body) {
        const textElement = current.querySelector(".rm-block-text");
        if (textElement) {
          const content = textElement.textContent || "";
          if (
            content.includes("[[roam/comments]]") ||
            content.includes("roam/comments")
          ) {
            debug(
              `🚫 ❌ Block is under [[roam/comments]], EXCLUDING from tagging`
            );
            debug(`🚫 Comments block content: "${content}"`);
            debug(
              `🔍 === CHAT ROOM DATE CONTEXT DEBUG END (EXCLUDED: ROAM COMMENTS) ===`
            );
            return false;
          }
        }
        current = current.parentElement?.closest(".rm-block");
      }
      debug(`🚫 ✅ Not under roam/comments, proceeding...`);

      // 3. Analyze block structure in detail
      debug(`🧱 Block element:`, blockElement);
      debug(`🧱 Block classes:`, blockElement.className);
      debug(`🧱 Block parent:`, blockElement.parentElement);
      debug(`🧱 Block parent classes:`, blockElement.parentElement?.className);

      // Find the direct parent block - try multiple approaches
      let parentBlockElement = null;

      // Method 1: parentElement.closest
      parentBlockElement = blockElement.parentElement?.closest(".rm-block");
      debug(`🔍 Method 1 parent block:`, parentBlockElement);

      if (!parentBlockElement) {
        // Method 2: walk up the DOM tree manually
        let current = blockElement.parentElement;
        while (current && current !== document.body) {
          debug(`🔍 Checking element:`, current.className);
          if (
            current.classList?.contains("rm-block") &&
            current !== blockElement
          ) {
            parentBlockElement = current;
            debug(`🔍 Method 2 found parent:`, parentBlockElement);
            break;
          }
          current = current.parentElement;
        }
      }

      if (!parentBlockElement) {
        debug(`❌ No parent block found with either method`);
        debug(
          `🔍 === CHAT ROOM DATE CONTEXT DEBUG END (FAILED: NO PARENT) ===`
        );
        return false;
      }

      debug(`✅ Parent block found:`, parentBlockElement);

      // 4. Check if parent block contains [[date]] pattern - multiple approaches
      let parentContent = "";

      // Method 1: .rm-block-text
      const parentTextElement =
        parentBlockElement.querySelector(".rm-block-text");
      if (parentTextElement) {
        parentContent = parentTextElement.textContent || "";
        debug(`🔍 Parent content (via .rm-block-text): "${parentContent}"`);
      } else {
        debug(`⚠️ No .rm-block-text found, trying alternative methods`);

        // Method 2: direct text content
        parentContent = parentBlockElement.textContent || "";
        debug(`🔍 Parent content (via textContent): "${parentContent}"`);

        // Method 3: innerHTML inspection
        debug(
          `🔍 Parent innerHTML:`,
          parentBlockElement.innerHTML.substring(0, 200)
        );
      }

      // Look for various date patterns
      debug(`🔍 Searching for date patterns in: "${parentContent}"`);

      // Pattern 1: [[...]] brackets
      const dateReferencePattern = /\[\[([^\]]+)\]\]/g;
      const bracketMatches = [...parentContent.matchAll(dateReferencePattern)];
      debug(`🔍 [[bracket]] matches:`, bracketMatches);

      // Pattern 2: Common date formats (fallback)
      const commonDatePattern =
        /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2}(ST|ND|RD|TH)?,?\s+\d{4}/i;
      const dateMatches = parentContent.match(commonDatePattern);
      debug(`🔍 Common date matches:`, dateMatches);

      if (bracketMatches.length === 0 && !dateMatches) {
        debug(`❌ No date references found in parent: "${parentContent}"`);
        debug(`🔍 === CHAT ROOM DATE CONTEXT DEBUG END (FAILED: NO DATE) ===`);
        return false;
      }

      debug(`✅ Date references found!`);

      // 5. Validate that we're exactly one level deeper than the parent
      debug(`🔍 Validating parent-child relationship...`);

      const blockChildren = blockElement.parentElement;
      const parentChildren = parentBlockElement.querySelector(
        ":scope > .rm-block-children"
      );

      debug(`🔍 Block children container:`, blockChildren);
      debug(`🔍 Parent children container:`, parentChildren);
      debug(`🔍 Are they the same?`, blockChildren === parentChildren);

      if (blockChildren !== parentChildren) {
        debug(`❌ Block is not a direct child of the date block`);
        debug(
          `🔍 === CHAT ROOM DATE CONTEXT DEBUG END (FAILED: NOT DIRECT CHILD) ===`
        );
        return false;
      }

      debug(`✅✅✅ Chat room date context CONFIRMED!`);
      debug(`📝 Parent content: "${parentContent.substring(0, 100)}..."`);
      debug(`🔍 === CHAT ROOM DATE CONTEXT DEBUG END (SUCCESS!) ===`);
      return true;
    } catch (error) {
      debug(`❌ Error checking chat room date context: ${error.message}`);
      debug(`🔍 Stack trace:`, error.stack);
      debug(`🔍 === CHAT ROOM DATE CONTEXT DEBUG END (ERROR) ===`);
      return false;
    }
  };

  // 🆕 1.8 - NEW: Combined context checker (ENHANCED DEBUG)
  const isInTaggableContext = (blockElement) => {
    debug(`🎯 === COMBINED CONTEXT CHECK START ===`);

    const conversationResult = isInConversation(blockElement);
    debug(`🎯 #ch0 conversation context: ${conversationResult}`);

    const chatRoomResult = isInChatRoomDateContext(blockElement);
    debug(`🎯 Chat room date context: ${chatRoomResult}`);

    const finalResult = conversationResult || chatRoomResult;
    debug(`🎯 Final taggable context result: ${finalResult}`);
    debug(`🎯 === COMBINED CONTEXT CHECK END ===`);

    return finalResult;
  };

  // 🔧 1.9 - ENHANCED: Add username tags with Utilities Integration (unchanged)
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

  // 🆕 1.10 - NEW: Get User Preferences for Tagging Behavior
  const getUserPreferences = () => {
    const defaultPrefs = {
      enableTagging: true,
      idleDelay: 2000,
      processExistingOnLoad: true,
      validateMembership: false,
      enableChatRoomTagging: true, // 🆕 NEW: Enable chat room tagging
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

  // 🌲 2.0 - Smart Processing Logic (UPDATED: enhanced with new context support)
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

      // 🆕 UPDATED: Check BOTH contexts
      if (blockElement && !isInTaggableContext(blockElement)) {
        debug(
          `Skipping ${blockUid} - not in taggable context (neither #ch0 nor chat room date)`
        );
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

  // 🌲 3.0 - Event Handlers (UPDATED: use combined context checker + ENHANCED DEBUG)
  const handleBlockBlur = (event) => {
    debug(`🔥 === BLOCK BLUR EVENT TRIGGERED ===`);
    debug(`🔥 Event target:`, event.target);
    debug(`🔥 Event target classes:`, event.target.className);

    const blockElement = event.target.closest(".rm-block");
    debug(`🔥 Found block element:`, blockElement);
    debug(`🔥 Block element classes:`, blockElement?.className);

    if (!blockElement) {
      debug(`🔥 No block element found, exiting blur handler`);
      return;
    }

    debug(`🔥 Checking if in taggable context...`);
    const inTaggableContext = isInTaggableContext(blockElement);
    debug(`🔥 In taggable context? ${inTaggableContext}`);

    if (!inTaggableContext) {
      debug(`🔥 Not in taggable context, exiting blur handler`);
      return;
    }

    const blockUid = getBlockUidFromDOM(blockElement);
    debug(`🔥 Block UID: ${blockUid}`);
    debug(`🔥 Already processed? ${processedBlocks.has(blockUid)}`);

    if (blockUid && !processedBlocks.has(blockUid)) {
      debug(`🔥 Adding block ${blockUid} to pending queue (blur)`);
      pendingBlocks.add(blockUid);

      const preferences = getUserPreferences();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(processPendingBlocks, preferences.idleDelay);
      debug(`🔥 Set idle timer for ${preferences.idleDelay}ms`);
    }
  };

  const handleKeyDown = async (event) => {
    debug(`⌨️ === KEY DOWN EVENT: ${event.key} ===`);

    clearTimeout(idleTimer);

    if (event.key === "Enter") {
      debug(`⌨️ ENTER key detected!`);
      debug(`⌨️ Event target:`, event.target);
      debug(`⌨️ Event target classes:`, event.target.className);

      const blockElement = event.target.closest(".rm-block");
      debug(`⌨️ Found block element:`, blockElement);
      debug(`⌨️ Block element classes:`, blockElement?.className);

      if (!blockElement) {
        debug(`⌨️ No block element found, exiting key handler`);
        return;
      }

      debug(`⌨️ Checking if in taggable context...`);
      const inTaggableContext = isInTaggableContext(blockElement);
      debug(`⌨️ In taggable context? ${inTaggableContext}`);

      if (blockElement && inTaggableContext) {
        const blockUid = getBlockUidFromDOM(blockElement);
        debug(`⌨️ Block UID: ${blockUid}`);
        debug(`⌨️ Already processed? ${processedBlocks.has(blockUid)}`);

        if (blockUid && !processedBlocks.has(blockUid)) {
          debug(`⌨️ Processing block ${blockUid} immediately (Enter key)`);

          // 🆕 INCREASED TIMEOUT: Give Roam more time to create block metadata
          setTimeout(async () => {
            debug(`⌨️ 500ms timeout expired, processing block ${blockUid}`);

            const blockData = window.roamAlphaAPI.pull(`[:block/string]`, [
              ":block/uid",
              blockUid,
            ]);
            const blockContent = blockData?.[":block/string"] || "";
            debug(`⌨️ Block content: "${blockContent}"`);

            if (blockContent.trim().length === 0) {
              debug(`⌨️ Skipping empty block ${blockUid}`);
              return;
            }

            debug(`⌨️ Getting block author (attempt 1)...`);
            let authorName = getBlockAuthor(blockUid);
            debug(`⌨️ Block author (attempt 1): ${authorName}`);

            // 🆕 RETRY LOGIC: If no author found, wait and try again
            if (!authorName) {
              debug(
                `⌨️ No author found on first attempt, retrying in 1 second...`
              );
              setTimeout(async () => {
                debug(`⌨️ Getting block author (attempt 2)...`);
                authorName = getBlockAuthor(blockUid);
                debug(`⌨️ Block author (attempt 2): ${authorName}`);

                if (!authorName) {
                  debug(
                    `⌨️ Still no author found on second attempt, retrying in 2 seconds...`
                  );
                  setTimeout(async () => {
                    debug(`⌨️ Getting block author (attempt 3 - final)...`);
                    authorName = getBlockAuthor(blockUid);
                    debug(`⌨️ Block author (attempt 3): ${authorName}`);

                    if (authorName) {
                      debug(`⌨️ Adding username tag (attempt 3)...`);
                      const success = await addUsernameTag(
                        blockUid,
                        authorName
                      );
                      if (success) {
                        processedBlocks.add(blockUid);
                        pendingBlocks.delete(blockUid);
                        debug(
                          `⌨️ ✅ Successfully tagged block ${blockUid} (attempt 3)`
                        );
                      } else {
                        debug(
                          `⌨️ ❌ Failed to tag block ${blockUid} (attempt 3)`
                        );
                      }
                    } else {
                      debug(
                        `⌨️ ❌ Final attempt failed - no author found for block ${blockUid}`
                      );
                    }
                  }, 2000);
                } else {
                  debug(`⌨️ Adding username tag (attempt 2)...`);
                  const success = await addUsernameTag(blockUid, authorName);
                  if (success) {
                    processedBlocks.add(blockUid);
                    pendingBlocks.delete(blockUid);
                    debug(
                      `⌨️ ✅ Successfully tagged block ${blockUid} (attempt 2)`
                    );
                  } else {
                    debug(`⌨️ ❌ Failed to tag block ${blockUid} (attempt 2)`);
                  }
                }
              }, 1000);
            } else {
              debug(`⌨️ Adding username tag (attempt 1)...`);
              const success = await addUsernameTag(blockUid, authorName);
              if (success) {
                processedBlocks.add(blockUid);
                pendingBlocks.delete(blockUid);
                debug(
                  `⌨️ ✅ Successfully tagged block ${blockUid} (attempt 1)`
                );
              } else {
                debug(`⌨️ ❌ Failed to tag block ${blockUid} (attempt 1)`);
              }
            }
          }, 500); // 🆕 INCREASED from 100ms to 500ms
        }
      } else {
        debug(`⌨️ Block not in taggable context or no block element`);
      }
    }
  };

  const handlePageChange = () => {
    debug("Page change detected, processing pending blocks");
    clearTimeout(idleTimer);
    processPendingBlocks();
  };

  // 🌲 4.0 - Process Existing Conversations (UPDATED: includes chat rooms)
  const processExistingConversations = async () => {
    const preferences = getUserPreferences();
    if (!preferences.processExistingOnLoad) {
      debug("⏸️ Processing existing conversations disabled in preferences");
      return;
    }

    debug(
      "Scanning existing conversations AND chat rooms for taggable blocks..."
    );

    // 🔄 EXISTING: Process #ch0 conversations
    const ch0Tags = document.querySelectorAll('.rm-page-ref[data-tag="ch0"]');

    for (const ch0Tag of ch0Tags) {
      const conversationBlock = ch0Tag.closest(".rm-block");
      if (!conversationBlock) continue;

      const directChildren = conversationBlock.querySelectorAll(
        ":scope > .rm-block-children > .rm-block"
      );

      debug(
        `Found ${directChildren.length} direct children in #ch0 conversation`
      );

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

    debug("✅ Existing conversations AND chat rooms processed");
  };

  // 🌲 5.0 - Setup Event Listeners (ENHANCED DEBUG + ALTERNATIVE APPROACHES)
  const setupEventListeners = () => {
    debug("🔧 Starting event listener setup...");
    console.log("🔧 DIRECT: Starting event listener setup...");

    try {
      // Test multiple event listener approaches
      debug("🔧 Method 1: Adding focusout listener with capture=true");
      document.addEventListener("focusout", handleBlockBlur, true);

      debug("🔧 Method 2: Adding keydown listener with capture=true");
      document.addEventListener("keydown", handleKeyDown, true);

      // Also try without capture phase
      debug("🔧 Method 3: Adding blur listener without capture");
      document.addEventListener(
        "blur",
        (event) => {
          debug("🔥 BLUR EVENT (non-capture) detected!");
          handleBlockBlur(event);
        },
        false
      );

      // Also try keyup as backup
      debug("🔧 Method 4: Adding keyup listener as backup");
      document.addEventListener(
        "keyup",
        (event) => {
          debug("⌨️ KEYUP EVENT detected!");
          if (event.key === "Enter") {
            debug("⌨️ KEYUP ENTER detected!");
            handleKeyDown(event);
          }
        },
        true
      );

      // Test if we can detect ANY keyboard events
      debug("🔧 Method 5: Adding universal keydown test");
      document.addEventListener(
        "keydown",
        (event) => {
          debug(
            `🔧 UNIVERSAL KEYDOWN: ${event.key} (target: ${event.target.tagName})`
          );
        },
        true
      );

      debug("🔧 Method 6: Adding window-level events");
      window.addEventListener("beforeunload", handlePageChange);
      window.addEventListener("hashchange", handlePageChange);

      debug("✅ All event listeners setup complete");
      console.log("✅ DIRECT: All event listeners setup complete");
    } catch (error) {
      debug(`❌ Error setting up event listeners: ${error.message}`);
      console.error("❌ DIRECT: Error setting up event listeners:", error);
    }
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

  // 🍎 6.0 - Extension Lifecycle (ENHANCED with immediate testing)
  const onload = ({ extensionAPI }) => {
    console.log("🚀 === EXTENSION LOADING START ===");
    debug(
      "🚀 Loading Enhanced Smart Username Tagger with chat room support..."
    );

    // 🚨 IMMEDIATE TESTS
    console.log("🚨 Testing basic functionality...");
    debug("🚨 Debug function working!");

    // Test page title detection
    const pageTitle = document.title || "";
    debug(`📄 Current page title: "${pageTitle}"`);
    debug(
      `📄 Is chat room page? ${pageTitle.toLowerCase().includes("chat room")}`
    );

    // Test DOM availability
    debug(`🌐 Document ready state: ${document.readyState}`);
    debug(`🌐 Body available: ${!!document.body}`);
    debug(`🌐 Roam API available: ${!!window.roamAlphaAPI}`);

    // Test block detection
    const allBlocks = document.querySelectorAll(".rm-block");
    debug(`🧱 Found ${allBlocks.length} blocks on page`);

    if (allBlocks.length > 0) {
      debug(`🧱 First block classes: ${allBlocks[0].className}`);
      debug(
        `🧱 First block content: "${allBlocks[0].textContent?.substring(
          0,
          50
        )}..."`
      );
    }

    // 🆕 Enhanced settings panel with chat room support
    try {
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
            id: "enableChatRoomTagging",
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
      debug("✅ Settings panel created successfully");
    } catch (settingsError) {
      debug(`❌ Settings panel creation failed: ${settingsError.message}`);
    }

    // Setup event listeners with enhanced debugging
    setupEventListeners();

    // Process existing conversations with preferences
    const preferences = getUserPreferences();
    const processExisting = extensionAPI.settings.get("processExisting");

    if (processExisting !== false && preferences.processExistingOnLoad) {
      debug("🔄 Will process existing conversations in 3 seconds...");
      setTimeout(() => {
        debug("🔄 Processing existing conversations now...");
        processExistingConversations();
      }, 3000);
    } else {
      debug("⏸️ Skipping existing conversation processing");
    }

    // 🔍 Log utilities integration status
    const utilitiesAvailable = !!window._extensionRegistry?.utilities;
    const isChatRoom = pageTitle.toLowerCase().includes("chat room");

    debug(`✅ Enhanced Smart Username Tagger loaded`);
    debug(
      `🔧 Utilities integration: ${utilitiesAvailable ? "ENABLED" : "DISABLED"}`
    );
    debug(`📅 Chat room context: ${isChatRoom ? "DETECTED" : "NOT DETECTED"}`);
    debug(
      `⚙️ Processing existing: ${
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

    console.log("✅ === EXTENSION LOADING COMPLETE ===");

    // 🚨 FINAL TEST: Trigger a manual test after everything is set up
    setTimeout(() => {
      debug(
        "🚨 DELAYED TEST: Extension fully initialized, ready for user interaction!"
      );
      console.log(
        "🚨 DELAYED TEST: Extension ready - try typing something now!"
      );
    }, 1000);
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
