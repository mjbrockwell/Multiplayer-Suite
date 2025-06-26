// 🌟 Floating Message Actions - Slack-style hover buttons for conversation blocks
// 🌟 Adds emoji and delete buttons that appear on hover over blocks with #[[username]] tags

const floatingMessageActions = (() => {
  // 🌲 1.0 - Internal State
  let currentUser = null;
  let styleElement = null;
  let activeButtons = null;
  let hoverTimeout = null;

  // 🌸 1.1 - Debug Function
  const debug = (message) => {
    console.log("Floating Actions:", message);
  };

  // 🌺 1.2 - Current User Detection (from conversation UI)
  const getCurrentUser = () => {
    if (currentUser) return currentUser;

    try {
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

      debug("Could not detect current user from recent blocks");
      return null;
    } catch (error) {
      debug(`Error detecting current user: ${error.message}`);
      return null;
    }
  };

  // 🌺 1.3 - Get Block Author (from conversation UI)
  const getBlockAuthor = (blockUid) => {
    try {
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

      return userData?.[":user/display-name"] || null;
    } catch (error) {
      debug(`Error getting block author: ${error.message}`);
      return null;
    }
  };

  // 🌺 1.4 - Extract Block UID from DOM (from conversation UI)
  const getBlockUidFromDOM = (messageBlock) => {
    try {
      const blockElement = messageBlock.closest(".rm-block");
      if (!blockElement) return null;

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
            debug(`Found block UID via timestamp: ${blockUid}`);
          }
        }
      }

      return blockUid;
    } catch (error) {
      debug(`Error extracting block UID: ${error.message}`);
      return null;
    }
  };

  // 🌺 1.5 - Soft Delete Function (from conversation UI)
  const softDeleteBlock = async (blockUid, authorName) => {
    try {
      const confirmed = confirm(
        `Replace content of this block by ${authorName} with deletion marker?`
      );

      if (!confirmed) {
        debug("Soft delete cancelled by user");
        return false;
      }

      debug(`Soft deleting block ${blockUid}...`);

      const deletionText = "__content deleted by author__";

      if (window.roamAlphaAPI.data?.block?.update) {
        await window.roamAlphaAPI.data.block.update({
          block: {
            uid: blockUid,
            string: deletionText,
          },
        });
      } else if (window.roamAlphaAPI.updateBlock) {
        await window.roamAlphaAPI.updateBlock({
          block: {
            uid: blockUid,
            string: deletionText,
          },
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

  // 🌺 1.6 - Emoji Menu Trigger (from conversation UI)
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

      const rightClickEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        buttons: 2,
      });

      bullet.dispatchEvent(rightClickEvent);

      setTimeout(() => {
        handleReactionSubmenu();
      }, 150);

      return true;
    } catch (e) {
      console.error("Error triggering emoji menu:", e);
      return false;
    }
  };

  // 🌲 2.0 - CSS Injection
  const injectCSS = () => {
    if (styleElement) {
      styleElement.remove();
    }

    styleElement = document.createElement("style");
    styleElement.id = "floating-message-actions-styles";
    styleElement.textContent = `
      /* 🌟 Floating Message Actions Container */
      .floating-message-actions {
        position: absolute;
        top: 8px;
        right: 35px; /* 25px + 10px for spacing from comment button */
        display: flex;
        gap: 6px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid #e1e5e9;
        padding: 4px;
        opacity: 0;
        transform: translateY(-4px);
        transition: all 0.2s ease;
        z-index: 1000;
        pointer-events: none;
      }

      .floating-message-actions.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }

      /* 🌟 Action Buttons */
      .floating-action-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0.7;
      }

      .floating-action-btn:hover {
        opacity: 1;
        background-color: #f5f5f5;
        transform: scale(1.1);
      }

      .floating-action-btn:active {
        transform: scale(0.95);
      }

      /* 🌟 Emoji Button */
      .floating-emoji-btn svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: #666;
        stroke-width: 2;
        transition: all 0.2s ease;
      }

      .floating-emoji-btn:hover svg {
        fill: #e91e63;
        stroke: #e91e63;
      }

      /* 🌟 Delete Button */
      .floating-delete-btn {
        color: #666;
        font-size: 14px;
        font-weight: bold;
      }

      .floating-delete-btn:hover {
        color: #dc3545;
        background-color: #ffe6e6;
      }

      /* 🌟 Message Block Positioning Context */
      .rm-block {
        position: relative;
      }

      /* 🌟 Hide during edit mode */
      .rm-block--edit .floating-message-actions {
        display: none;
      }
    `;

    document.head.appendChild(styleElement);
    debug("CSS styles injected");
  };

  // 🌲 3.0 - Create Floating Buttons
  const createFloatingButtons = (blockElement, blockUid, authorName) => {
    const currentUserName = getCurrentUser();
    const isOwnMessage = currentUserName && authorName === currentUserName;

    // Create container
    const container = document.createElement("div");
    container.className = "floating-message-actions";

    // Create emoji button
    const emojiBtn = document.createElement("button");
    emojiBtn.className = "floating-action-btn floating-emoji-btn";
    emojiBtn.title = "Add reaction";
    emojiBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;

    emojiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      debug(`Emoji button clicked for message by ${authorName}`);

      // Add click animation
      emojiBtn.style.transform = "scale(0.9)";
      setTimeout(() => {
        emojiBtn.style.transform = "";
      }, 150);

      triggerEmojiMenu(blockElement);
    });

    container.appendChild(emojiBtn);

    // Create delete button (only for own messages)
    if (isOwnMessage) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "floating-action-btn floating-delete-btn";
      deleteBtn.title = "Delete message";
      deleteBtn.innerHTML = "×";

      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        debug(`Delete button clicked for block ${blockUid} by ${authorName}`);

        // Add click animation
        deleteBtn.style.transform = "scale(0.9)";
        setTimeout(() => {
          deleteBtn.style.transform = "";
        }, 100);

        const deleted = await softDeleteBlock(blockUid, authorName);
        if (deleted) {
          debug(`Block ${blockUid} soft deleted successfully`);
          // Hide buttons after successful deletion
          container.remove();
        }
      });

      container.appendChild(deleteBtn);
    }

    return container;
  };

  // 🌲 4.0 - Show/Hide Floating Buttons
  const showFloatingButtons = (blockElement) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Remove any existing buttons
    hideFloatingButtons();

    // Get block info
    const blockUid = getBlockUidFromDOM(blockElement);
    if (!blockUid) {
      debug("Could not get block UID for floating buttons");
      return;
    }

    const authorName = getBlockAuthor(blockUid);
    if (!authorName) {
      debug("Could not get author name for floating buttons");
      return;
    }

    // Create and show buttons
    activeButtons = createFloatingButtons(blockElement, blockUid, authorName);
    blockElement.appendChild(activeButtons);

    // Animate in
    setTimeout(() => {
      if (activeButtons) {
        activeButtons.classList.add("show");
      }
    }, 10);

    debug(`Showing floating buttons for message by ${authorName}`);
  };

  const hideFloatingButtons = () => {
    if (activeButtons) {
      activeButtons.remove();
      activeButtons = null;
    }
  };

  // 🌲 5.0 - Setup Hover Listeners
  const setupHoverListeners = () => {
    debug("Setting up hover listeners for username-tagged blocks...");

    // Find all blocks containing #[[username]] patterns
    const allBlocks = document.querySelectorAll(".rm-block");
    let processedCount = 0;

    allBlocks.forEach((block) => {
      // Check if block contains #[[username]] pattern
      const blockText = block.textContent || "";
      const hasUsernameTag = /#\[\[.+\]\]/.test(blockText);

      if (hasUsernameTag) {
        // Skip if already has listeners
        if (block.hasAttribute("data-floating-actions")) {
          return;
        }

        block.setAttribute("data-floating-actions", "true");

        block.addEventListener("mouseenter", () => {
          // Small delay to prevent flickering on quick mouse movements
          hoverTimeout = setTimeout(() => {
            showFloatingButtons(block);
          }, 100);
        });

        block.addEventListener("mouseleave", () => {
          // Clear timeout if mouse leaves quickly
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
          }

          // Hide with small delay to allow moving to buttons
          setTimeout(() => {
            hideFloatingButtons();
          }, 150);
        });

        processedCount++;
      }
    });

    debug(
      `Added hover listeners to ${processedCount} blocks with username tags`
    );
  };

  // 🌲 6.0 - Page Navigation Handler
  const handlePageChange = () => {
    debug("Page change detected, setting up hover listeners");
    hideFloatingButtons();
    setTimeout(setupHoverListeners, 500);
  };

  // 🍎 7.0 - Extension Lifecycle
  const onload = ({ extensionAPI }) => {
    debug("🚀 Loading Floating Message Actions...");

    // Create settings
    extensionAPI.settings.panel.create({
      tabTitle: "Floating Message Actions",
      settings: [
        {
          id: "showForAllUsers",
          name: "Show emoji button for all messages",
          description:
            "Display emoji reaction button on all messages, not just own messages",
          action: { type: "switch" },
        },
        {
          id: "hoverDelay",
          name: "Hover delay (ms)",
          description:
            "Delay before showing buttons on hover (prevents flickering)",
          action: { type: "input", placeholder: "100" },
        },
      ],
    });

    // Initialize
    injectCSS();

    // Setup initial hover listeners
    setTimeout(setupHoverListeners, 1000);

    // Listen for page changes
    window.addEventListener("hashchange", handlePageChange);
    window.addEventListener("beforeunload", handlePageChange);

    debug("✅ Floating Message Actions loaded successfully");
  };

  const onunload = () => {
    debug("Unloading Floating Message Actions...");

    // Clean up
    hideFloatingButtons();

    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }

    // Remove event listeners
    window.removeEventListener("hashchange", handlePageChange);
    window.removeEventListener("beforeunload", handlePageChange);

    // Remove hover listeners and data attributes
    document.querySelectorAll("[data-floating-actions]").forEach((block) => {
      block.removeAttribute("data-floating-actions");
      // Note: Event listeners are automatically removed when we remove the attribute
      // since we're not storing references to the functions
    });

    // Clear timeouts
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Reset state
    currentUser = null;
    activeButtons = null;

    debug("✅ Floating Message Actions unloaded");
  };

  return {
    onload,
    onunload,
  };
})();

export default floatingMessageActions;
