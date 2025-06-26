// 🗨️ Conversation UI Enhancement
// Adds timestamps to conversation headers and reaction/delete buttons to messages

const conversationUIEnhancement = (() => {
  // State
  let observer = null;
  let styleElement = null;
  let currentUser = null;

  const debug = (message) => {
    console.log("🗨️ Conv UI:", message);
  };

  // 🔍 Current User Detection
  const getCurrentUser = () => {
    if (currentUser) return currentUser;

    try {
      // Find a recent block to identify current user
      const recentBlocks = window.roamAlphaAPI.data.q(`
        [:find ?uid ?createTime
         :limit 3
         :where 
         [?e :block/uid ?uid]
         [?e :create/time ?createTime]
         :order-by [[?createTime :desc]]]
      `);

      for (const [uid, createTime] of recentBlocks) {
        const blockData = window.roamAlphaAPI.pull(
          `[:block/uid :create/user]`,
          [":block/uid", uid]
        );

        if (blockData && blockData[":create/user"]) {
          const userDbId = blockData[":create/user"][":db/id"];
          const userData = window.roamAlphaAPI.pull(
            `[:user/display-name]`,
            userDbId
          );

          if (userData && userData[":user/display-name"]) {
            currentUser = userData[":user/display-name"];
            debug(`Current user detected: ${currentUser}`);
            return currentUser;
          }
        }
      }

      debug("Could not detect current user");
      return null;
    } catch (error) {
      debug(`Error detecting current user: ${error.message}`);
      return null;
    }
  };

  // 📅 Date Formatting
  const formatTimestamp = (date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add ordinal suffix
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `started ${time} on ${dayName}, ${monthName} ${getOrdinal(day)}`;
  };

  // 🎯 Block Author Detection
  const getBlockAuthor = (blockUid) => {
    try {
      const blockData = window.roamAlphaAPI.pull(
        `[:block/uid :create/user :create/time]`,
        [":block/uid", blockUid]
      );

      if (!blockData || !blockData[":create/user"]) {
        return null;
      }

      const userDbId = blockData[":create/user"][":db/id"];
      const userData = window.roamAlphaAPI.pull(
        `[:user/display-name]`,
        userDbId
      );

      if (!userData) {
        return null;
      }

      return {
        displayName: userData[":user/display-name"] || "Unknown User",
        createdAt: blockData[":create/time"] || null,
        userDbId: userDbId,
      };
    } catch (error) {
      debug(`Error getting block author: ${error.message}`);
      return null;
    }
  };

  // 🔍 Extract Block UID from DOM
  const getBlockUidFromDOM = (messageBlock) => {
    try {
      const blockElement = messageBlock.closest(".rm-block");
      if (!blockElement) return null;

      let blockUid =
        blockElement.getAttribute("data-uid") ||
        blockElement.id?.replace("block-input-", "") ||
        blockElement.querySelector("[data-uid]")?.getAttribute("data-uid");

      // Fallback: try timestamp method
      const createTime = blockElement.getAttribute("data-create-time");
      if (createTime && !blockUid) {
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

      return blockUid;
    } catch (error) {
      debug(`Error extracting block UID: ${error.message}`);
      return null;
    }
  };

  // 🗑️ Soft Delete Function
  const softDeleteBlock = async (blockUid, authorName) => {
    try {
      const confirmed = confirm(
        `Replace content of this message by ${authorName} with deletion marker?`
      );

      if (!confirmed) {
        return false;
      }

      debug(`Soft deleting block ${blockUid}...`);

      const deletionText = "__content deleted by author__";

      if (window.roamAlphaAPI.data?.block?.update) {
        await window.roamAlphaAPI.data.block.update({
          block: { uid: blockUid, string: deletionText },
        });
      } else if (window.roamAlphaAPI.updateBlock) {
        await window.roamAlphaAPI.updateBlock({
          block: { uid: blockUid, string: deletionText },
        });
      } else {
        throw new Error("Update API not found");
      }

      debug(`Successfully soft deleted block ${blockUid}`);
      return true;
    } catch (error) {
      debug(`Error soft deleting block: ${error.message}`);
      alert(`Error soft deleting block: ${error.message}`);
      return false;
    }
  };

  // 🎨 Emoji Menu Trigger
  const findBlockBullet = (block) => {
    const possibleSelectors = [
      ".rm-bullet",
      ".controls",
      ".bp3-icon-dot",
      ".rm-block__input .rm-bullet",
      ".roam-bullet",
      ".rm-block-control",
      ".rm-bullet-container .bp3-icon",
      ".block-bullet-view",
      ".block-control",
      ".rm-bullet__inner",
      '[data-icon="dot"]',
    ];

    for (const selector of possibleSelectors) {
      const bullet = block.querySelector(selector);
      if (bullet) {
        return bullet;
      }
    }

    const firstChildElements = Array.from(block.children).slice(0, 2);
    for (const el of firstChildElements) {
      const potentialBullet = el.querySelector("span, div, button");
      if (potentialBullet) {
        return potentialBullet;
      }
    }

    const clickables = block.querySelectorAll(
      'button, [role="button"], .rm-block-main > span:first-child'
    );
    if (clickables.length > 0) {
      return clickables[0];
    }

    return null;
  };

  const handleReactionSubmenu = () => {
    try {
      const menuItems = Array.from(document.querySelectorAll(".bp3-menu-item"));

      if (menuItems.length === 0) {
        return false;
      }

      const reactionItem = menuItems.find((item) => {
        const text = item.textContent.toLowerCase().trim();
        return text.includes("reaction") || text.includes("emoji");
      });

      if (!reactionItem) {
        return false;
      }

      const isSubmenu =
        reactionItem.querySelector(".bp3-submenu-icon") !== null ||
        reactionItem.textContent.includes("sub menu") ||
        reactionItem.classList.contains("bp3-submenu");

      if (isSubmenu) {
        const mouseoverEvent = new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        reactionItem.dispatchEvent(mouseoverEvent);

        setTimeout(() => {
          const submenuPopovers = document.querySelectorAll(
            ".bp3-submenu-popover"
          );

          if (submenuPopovers.length === 0) {
            reactionItem.click();
            return true;
          }

          const latestPopover = submenuPopovers[submenuPopovers.length - 1];
          const submenuItems = latestPopover.querySelectorAll(".bp3-menu-item");

          if (submenuItems.length === 0) {
            reactionItem.click();
            return true;
          }

          const firstSubmenuItem = submenuItems[0];
          firstSubmenuItem.click();

          return true;
        }, 200);

        return true;
      } else {
        reactionItem.click();
        return true;
      }
    } catch (e) {
      console.error("Error in handleReactionSubmenu:", e);
      return false;
    }
  };

  const triggerEmojiMenu = (block) => {
    try {
      const bullet = findBlockBullet(block);
      if (!bullet) {
        debug("Could not find bullet for emoji menu");
        return false;
      }

      bullet.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
        })
      );

      setTimeout(() => handleReactionSubmenu(), 150);
      return true;
    } catch (e) {
      console.error("Error triggering emoji menu:", e);
      return false;
    }
  };

  // 🎨 CSS Injection
  const injectCSS = () => {
    if (styleElement) {
      styleElement.remove();
    }

    styleElement = document.createElement("style");
    styleElement.id = "conversation-ui-enhanced-styles";
    styleElement.textContent = `
      /* 🗨️ Conversation Header Tag Styling */
      span.rm-page-ref[data-tag="ch0"] {
        font-size: 0pt;
      }
      
      span.rm-page-ref[data-tag="ch0"]::before {
        content: "💬";
        position: relative;
        top: 1px;
        font-size: 14pt;
        background-image: linear-gradient(90deg, #E6E9FF, #D6DBFF);
        background-size: 100%;
        border-radius: 5px;
        padding: 2px 7px 2px 7px;
        color: #130101 !important;
        font-weight: 600;
        box-shadow: 1px 3px 5px -1px #000000, 0px -1px 5px #DFDFDF;
      }
      
      .rm-page-ref[data-tag="ch0"]::after {
        font-size: 14pt;
        content: ' ';
      }

      /* 🗨️ Conversation Header Block Styling */
      [data-page-links*="ch0"] > .rm-block-main {
        color: #2d3748;
        background-color: #fafbff !important;
        border: 1px outset #667eea;
        border-radius: 7px;
        border-style: solid !important;
        margin-bottom: 5px;
        box-shadow: 0px 1px 3px -1px #000000, 0px -1px 5px #DFDFDF;
        border-left: 4px solid #667eea !important;
        padding: 12px 16px;
        font-weight: bold;
        position: relative;
      }

      /* 📅 Conversation Header Timestamp */
      .conv-header-timestamp {
        position: absolute;
        top: 50%;
        right: 16px;
        transform: translateY(-50%);
        font-size: 12px;
        color: #6b7280;
        font-weight: 400;
        opacity: 0.8;
        white-space: nowrap;
        pointer-events: none;
      }

      /* 🗨️ Message Block Actions Container */
      .conv-message-actions {
        position: absolute;
        top: 8px;
        right: 70px;
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.4;
        transition: opacity 0.2s ease;
        z-index: 10;
        pointer-events: auto;
      }

      .rm-block:hover .conv-message-actions {
        opacity: 0.8;
      }

      .conv-message-actions:hover {
        opacity: 1 !important;
      }

      /* ❤️ Heart Button */
      .conv-heart-btn {
        width: 18px;
        height: 18px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 50%;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .conv-heart-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .conv-heart-btn:active {
        transform: scale(0.95);
      }

      .conv-heart-btn svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: #666;
        stroke-width: 2;
        transition: all 0.2s ease;
      }

      .conv-heart-btn:hover svg {
        fill: #e91e63;
        stroke: #e91e63;
      }

      /* ❌ Delete Button */
      .conv-delete-btn {
        width: 18px;
        height: 18px;
        background: #9e9e9e !important;
        color: white !important;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .conv-delete-btn:hover {
        transform: scale(1.1);
        background: #757575 !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .conv-delete-btn:active {
        transform: scale(0.95);
        background: #616161 !important;
      }

      /* 🚫 Disabled Delete Button */
      .conv-delete-btn.disabled {
        background: #e0e0e0 !important;
        color: #bdbdbd !important;
        cursor: not-allowed !important;
        opacity: 0.6 !important;
        border: 1px solid #d0d0d0 !important;
      }

      .conv-delete-btn.disabled:hover {
        background: #e0e0e0 !important;
        color: #bdbdbd !important;
        transform: none !important;
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
      }

      /* 🗨️ Conversation Container Styling */
      [data-page-links*="ch0"] > .rm-block-children {
        background-color: #f8f9ff;
        border: 1px solid #e6e9ff;
        margin-bottom: 5px;
        border-radius: 4px;
        padding: 8px;
      }

      /* 📝 Message Block Styling */
      .rm-block:has(span.rm-page-ref[data-tag="ch0"]) > .rm-block-children > .rm-block {
        margin: 12px 0;
        padding: 8px 12px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border-left: 3px solid #e0e6ed;
        position: relative;
      }

      /* 🗑️ Soft Deleted Block Styling */
      .soft-deleted-content {
        opacity: 0.6;
        font-style: italic;
        color: #666;
        background: #f5f5f5;
        padding: 4px 8px;
        border-radius: 4px;
        border-left: 3px solid #ccc;
        margin: 2px 0;
      }

      /* 🎯 Hide actions during edit mode */
      .rm-block--edit .conv-message-actions {
        opacity: 0.2;
        pointer-events: none;
      }
    `;

    document.head.appendChild(styleElement);
    debug("CSS styles injected");
  };

  // 📅 Add Conversation Header Timestamp
  const addConversationTimestamp = (headerBlock) => {
    try {
      // Skip if already has timestamp
      if (headerBlock.querySelector(".conv-header-timestamp")) {
        return;
      }

      const blockUid = getBlockUidFromDOM(headerBlock);
      if (!blockUid) return;

      const blockData = window.roamAlphaAPI.pull(`[:block/uid :create/time]`, [
        ":block/uid",
        blockUid,
      ]);

      if (!blockData || !blockData[":create/time"]) return;

      const createdAt = blockData[":create/time"];
      const createdDate = new Date(createdAt);
      const timestampText = formatTimestamp(createdDate);

      const timestampElement = document.createElement("div");
      timestampElement.className = "conv-header-timestamp";
      timestampElement.textContent = timestampText;

      const blockMain = headerBlock.querySelector(".rm-block-main");
      if (blockMain) {
        blockMain.appendChild(timestampElement);
        debug(`Added timestamp: ${timestampText}`);
      }
    } catch (error) {
      debug(`Error adding conversation timestamp: ${error.message}`);
    }
  };

  // 🎯 Add Message Actions (Heart + Delete)
  const addMessageActions = (messageBlock) => {
    try {
      // Skip if already has actions
      if (messageBlock.querySelector(".conv-message-actions")) {
        return;
      }

      const blockUid = getBlockUidFromDOM(messageBlock);
      if (!blockUid) return;

      const authorInfo = getBlockAuthor(blockUid);
      if (!authorInfo) return;

      const currentUserName = getCurrentUser();
      const isOwnBlock =
        currentUserName && authorInfo.displayName === currentUserName;

      // Check if block is soft deleted
      const blockContent = messageBlock.textContent || "";
      const isAlreadyDeleted = blockContent.includes(
        "__content deleted by author__"
      );

      // Create actions container
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "conv-message-actions";

      // Heart button (always show)
      const heartBtn = document.createElement("div");
      heartBtn.className = "conv-heart-btn";
      heartBtn.title = "Add reaction";
      heartBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      `;

      heartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        debug(`Heart clicked for message by ${authorInfo.displayName}`);

        // Visual feedback
        heartBtn.style.transform = "scale(0.9)";
        setTimeout(() => {
          heartBtn.style.transform = "";
        }, 150);

        triggerEmojiMenu(messageBlock);
      });

      actionsContainer.appendChild(heartBtn);

      // Delete button (only for own blocks)
      if (isOwnBlock) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "conv-delete-btn";
        deleteBtn.innerHTML = "×";

        if (isAlreadyDeleted) {
          deleteBtn.classList.add("disabled");
          deleteBtn.title = "Message is marked as deleted";
          deleteBtn.disabled = true;
        } else {
          deleteBtn.title = "Soft delete: Replace content with deletion marker";
          deleteBtn.disabled = false;

          deleteBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            debug(
              `Delete clicked for block ${blockUid} by ${authorInfo.displayName}`
            );

            // Visual feedback
            deleteBtn.style.transform = "scale(0.9)";
            setTimeout(() => {
              deleteBtn.style.transform = "";
            }, 100);

            const deleted = await softDeleteBlock(
              blockUid,
              authorInfo.displayName
            );
            if (deleted) {
              debug(`Block ${blockUid} soft deleted successfully`);

              // Mark content as soft deleted
              const blockText = messageBlock.querySelector(".rm-block-text");
              if (blockText) {
                blockText.classList.add("soft-deleted-content");
              }
            }
          });
        }

        actionsContainer.appendChild(deleteBtn);
      }

      // Add to message block
      messageBlock.appendChild(actionsContainer);
      debug(
        `Added actions for message by ${authorInfo.displayName}${
          isOwnBlock ? " (own)" : ""
        }`
      );
    } catch (error) {
      debug(`Error adding message actions: ${error.message}`);
    }
  };

  // 🔄 Process Conversations
  const processConversations = () => {
    debug("Processing conversations...");

    // Find conversation headers
    const conversationHeaders = document.querySelectorAll(
      '.rm-page-ref[data-tag="ch0"]'
    );

    conversationHeaders.forEach((header) => {
      const headerBlock = header.closest(".rm-block");
      if (!headerBlock) return;

      // Add timestamp to header
      addConversationTimestamp(headerBlock);

      // Find and process message blocks
      const messageBlocks = headerBlock.querySelectorAll(
        ":scope > .rm-block-children > .rm-block"
      );

      messageBlocks.forEach((messageBlock) => {
        addMessageActions(messageBlock);
      });
    });

    debug("Conversation processing complete");
  };

  // 👀 DOM Observer Setup
  const setupObserver = () => {
    const targetNode =
      document.querySelector(".roam-body") ||
      document.querySelector(".roam-app");

    if (!targetNode) {
      debug("Could not find target for observer");
      return;
    }

    observer = new MutationObserver(() => {
      setTimeout(processConversations, 200);
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    debug("Observer initialized");
  };

  // 🚀 Extension Lifecycle
  const onload = ({ extensionAPI }) => {
    debug("Loading Conversation UI Enhancement...");

    // Create settings panel
    extensionAPI.settings.panel.create({
      tabTitle: "Conversation UI",
      settings: [
        {
          id: "headerTag",
          name: "Conversation Header Tag",
          description: "Tag for conversation headers",
          action: {
            type: "input",
            placeholder: "ch0",
          },
        },
      ],
    });

    // Initialize
    injectCSS();
    setupObserver();

    // Process existing conversations
    setTimeout(processConversations, 1000);

    debug("Conversation UI Enhancement loaded successfully");
  };

  const onunload = () => {
    debug("Unloading...");

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }

    // Clean up added elements
    document
      .querySelectorAll(".conv-message-actions")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".conv-header-timestamp")
      .forEach((el) => el.remove());
    document.querySelectorAll(".soft-deleted-content").forEach((el) => {
      el.classList.remove("soft-deleted-content");
    });

    // Reset state
    currentUser = null;

    debug("Unloaded successfully");
  };

  return {
    onload,
    onunload,
  };
})();

export default conversationUIEnhancement;
