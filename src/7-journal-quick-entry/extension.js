// 🌳 Extension 7: Journal Entry Creator - Lean & Robust v1.0
// 🎯 Target: ~150-200 lines vs original 800+ lines
// 🚀 Leverages Extension Suite Infrastructure for Maximum Efficiency

const journalEntryCreator = (() => {
  // 🌟 State Management (Simplified)
  let extensionAPI = null;
  let quickEntryButton = null;
  let isInitialized = false;

  // Safety variable (Extension Six handles directory buttons)
  let standingButton = null;

  // 🌟 Logging with Registry Integration
  const log = (message, level = "INFO") => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Journal Entry ${timestamp}] ${level}: ${message}`);

    // Integration with suite logging if available
    if (window.RoamExtensionSuite?.log) {
      window.RoamExtensionSuite.log(`JournalEntry: ${message}`);
    }
  };

  // 🌟 Get Platform Utilities (Leveraging Extension Suite)
  const getPlatform = () => window.RoamExtensionSuite;
  const getCoreData = () => getPlatform()?.get("core-data");
  const getUIEngine = () => getPlatform()?.get("ui-engine");
  const getUtilities = () => getPlatform()?.getUtility;

  // ═══════════════════════════════════════════════════════════════
  // 📅 DATE & FORMATTING - Using Roam Native + Simple Extensions
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Leveraging Roam Alpha API for date formatting
  const getTodaysRoamDate = () => {
    return window.roamAlphaAPI.util.dateToPageTitle(new Date());
  };

  const getTodaysDayName = () => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔍 PAGE DETECTION - Using Core Data & Simple Logic
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Smart page detection using Core Data
  const detectPageContext = () => {
    try {
      const coreData = getCoreData();
      const currentUser = coreData?.getCurrentUser?.() || {
        displayName: getCurrentUserFallback(),
      };

      // Get current page title
      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return { type: "other", page: null };

      // Check for Chat Room (flexible detection)
      if (pageTitle.toLowerCase().includes("chat room")) {
        return { type: "chatroom", page: pageTitle };
      }

      // Check for username page
      if (currentUser.displayName && pageTitle === currentUser.displayName) {
        return { type: "username", page: pageTitle };
      }

      return { type: "other", page: pageTitle };
    } catch (error) {
      log(`Error detecting page context: ${error.message}`, "ERROR");
      return { type: "other", page: null };
    }
  };

  // 🌟 Fallback current user detection (Enhanced)
  const getCurrentUserFallback = () => {
    // Try official Roam API first
    try {
      const userUid = window.roamAlphaAPI.graph?.getUser?.()?.uid;
      if (userUid) {
        const userData = window.roamAlphaAPI.pull("[*]", [
          ":user/uid",
          userUid,
        ]);
        const displayName =
          userData?.displayName ||
          userData?.email ||
          userData?.[":user/display-name"];
        if (displayName) return displayName;
      }
    } catch (error) {
      // Silent fallback
    }

    // Try newer Roam API method
    try {
      const userUid = window.roamAlphaAPI.user?.uid?.();
      if (userUid) {
        const userData = window.roamAlphaAPI.pull("[*]", [
          ":user/uid",
          userUid,
        ]);
        const displayName =
          userData?.displayName ||
          userData?.email ||
          userData?.[":user/display-name"];
        if (displayName) return displayName;
      }
    } catch (error) {
      // Silent fallback
    }

    // Fallback to DOM detection (multiple selectors)
    try {
      const selectors = [
        'button[data-testid="user-menu"]',
        ".rm-user-name",
        ".rm-profile-dropdown-content",
        '[data-testid="user-profile"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = element?.textContent?.trim();
        if (text && text !== "User" && text.length > 0) {
          return text;
        }
      }
    } catch (error) {
      // Silent fallback
    }

    // Last resort: try localStorage (David's method)
    try {
      const globalAppState = JSON.parse(
        localStorage.getItem("globalAppState") || '["","",[]]'
      );
      const userIndex = globalAppState.findIndex((s) => s === "~:user");
      if (userIndex > 0 && globalAppState[userIndex + 1]) {
        const userData = globalAppState[userIndex + 1];
        if (Array.isArray(userData) && userData.length > 0) {
          return userData[0]; // Usually the display name
        }
      }
    } catch (error) {
      // Silent fallback
    }

    return "Current User";
  };

  // 🌟 Simple current page detection
  const getCurrentPageTitle = () => {
    try {
      const url = window.location.href;

      // Daily note pattern
      const dailyMatch = url.match(/\/(\d{2}-\d{2}-\d{4})$/);
      if (dailyMatch) return dailyMatch[1];

      // Page UID pattern
      if (url.includes("/page/")) {
        const pageMatch = url.match(/\/page\/(.+)$/);
        if (pageMatch) {
          const pageUid = pageMatch[1];
          const pageTitle = window.roamAlphaAPI.data.q(`
            [:find ?title .
             :where [?e :block/uid "${pageUid}"] [?e :node/title ?title]]
          `);
          if (pageTitle) return pageTitle;
        }
      }

      // Title element fallback
      const titleEl = document.querySelector("title");
      if (titleEl) {
        const title = titleEl.textContent.replace(" - Roam", "").trim();
        return title !== "Roam" ? title : null;
      }

      return null;
    } catch (error) {
      log(`Error getting page title: ${error.message}`, "ERROR");
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎨 USER PREFERENCES - Leveraging Extension 1.5 Utilities
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Get user's journal color preference
  const getUserJournalColor = () => {
    try {
      const coreData = getCoreData();
      const currentUser = coreData?.getCurrentUser?.() || {
        displayName: getCurrentUserFallback(),
      };

      if (!currentUser.displayName) return "blue";

      const prefsPageName = `${currentUser.displayName}/user preferences`;
      const prefsBlocks = window.roamAlphaAPI.data.q(`
        [:find ?string
         :where 
         [?page :node/title "${prefsPageName}"]
         [?page :block/children ?block]
         [?block :block/string ?string]]
      `);

      // Search for color preference
      for (const [blockString] of prefsBlocks) {
        if (
          blockString.toLowerCase().includes("journal") &&
          blockString.toLowerCase().includes("color")
        ) {
          const colorMatch = blockString.match(
            /\b(red|orange|yellow|green|blue|violet|purple|brown|grey|gray|white)\b/i
          );
          if (colorMatch) {
            log(`Found color preference: ${colorMatch[1]}`, "SUCCESS");
            return colorMatch[1].toLowerCase();
          }
        }
      }

      return "blue"; // Default
    } catch (error) {
      log(`Error getting journal color: ${error.message}`, "ERROR");
      return "blue";
    }
  };

  // 🌟 Map color preference to Roam color tag
  const getColorTag = (colorPreference) => {
    const colorMap = {
      red: "#clr-lgt-red-act",
      orange: "#clr-lgt-orn-act",
      yellow: "#clr-lgt-ylo-act",
      green: "#clr-lgt-grn-act",
      blue: "#clr-lgt-blu-act",
      violet: "#clr-lgt-ppl-act",
      purple: "#clr-lgt-ppl-act",
      brown: "#clr-lgt-brn-act",
      grey: "#clr-lgt-gry-act",
      gray: "#clr-lgt-gry-act",
      white: "#clr-wht-act",
    };
    return colorMap[colorPreference] || "#clr-lgt-blu-act";
  };

  // ═══════════════════════════════════════════════════════════════
  // ✨ ENTRY EXISTENCE CHECKING - Smart Detection Logic
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Check if today's journal entry exists (Username page)
  const shouldShowUsernameButton = (pageName) => {
    try {
      const todaysDate = getTodaysRoamDate();

      const allBlocks = window.roamAlphaAPI.data.q(`
        [:find ?string
         :where 
         [?page :node/title "${pageName}"]
         [?page :block/children ?child]
         [?descendant :block/parents ?child]
         [?descendant :block/string ?string]]
      `);

      // Check if today's entry exists (contains today's date and #st0)
      const todaysEntryExists = allBlocks.some(([blockString]) => {
        const lowerString = blockString.toLowerCase();
        const lowerDate = todaysDate.toLowerCase();

        // Check for various date formats (case-insensitive)
        const hasDate =
          lowerString.includes(`[[${lowerDate}]]`) ||
          lowerString.includes(`[[${lowerDate.toUpperCase()}]]`) ||
          lowerString.includes(lowerDate) ||
          lowerString.includes(lowerDate.toUpperCase());

        const hasTag = lowerString.includes("#st0");
        return hasDate && hasTag;
      });

      return !todaysEntryExists;
    } catch (error) {
      log(`Error checking username button: ${error.message}`, "ERROR");
      return false;
    }
  };

  // 🌟 Chat room button always shows (for threaded conversations)
  const shouldShowChatRoomButton = (pageName) => {
    // Always show button for threaded conversation support
    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // 🏗️ ENTRY CREATION - Using Extension 1.5 Utilities
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Create journal entry on username page
  const createUsernameEntry = async (pageName) => {
    try {
      log("Creating username page journal entry", "INFO");

      const utilities = getUtilities();
      if (!utilities) throw new Error("Extension utilities not available");

      // Ensure Journal:: block exists using Extension 1.5
      const journalBlockUid = await utilities("cascadeToBlock")(
        pageName,
        ["Journal::"],
        true
      );

      if (!journalBlockUid) throw new Error("Could not create Journal:: block");

      // Build journal entry content
      const colorPreference = getUserJournalColor();
      const colorTag = getColorTag(colorPreference);
      const todaysDate = getTodaysRoamDate();
      const dayName = getTodaysDayName();
      const datelineContent = `#st0 [[${todaysDate}]]  -  ${dayName} ${colorTag}`;

      // Create the entry
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": journalBlockUid, order: 0 },
        block: { string: datelineContent },
      });

      // Add child block for writing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const datelineUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?parent :block/uid "${journalBlockUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string "${datelineContent}"]]
      `);

      if (datelineUid) {
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": datelineUid, order: 0 },
          block: { string: "" },
        });

        // Focus cursor in new block
        await new Promise((resolve) => setTimeout(resolve, 200));
        const childUid = window.roamAlphaAPI.data.q(`
          [:find ?uid .
           :where 
           [?parent :block/uid "${datelineUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]]
        `);

        if (childUid) {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: { "block-uid": childUid, "window-id": "main-window" },
          });
        }
      }

      log("Username journal entry created successfully", "SUCCESS");
      return true;
    } catch (error) {
      log(`Error creating username entry: ${error.message}`, "ERROR");
      throw error;
    }
  };

  // 🌟 Create chat room entry (find or create header + add as last child)
  const createChatRoomEntry = async (pageName) => {
    try {
      log("Adding message to chat room thread", "INFO");

      const pageUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?page :node/title "${pageName}"]
         [?page :block/uid ?uid]]
      `);

      if (!pageUid) throw new Error("Could not find Chat Room page UID");

      // Get current user for prepending
      const coreData = getCoreData();
      const currentUser = coreData?.getCurrentUser?.() || {
        displayName: getCurrentUserFallback(),
      };

      const todaysDate = getTodaysRoamDate();
      const dayName = getTodaysDayName();
      const headerContent = `#st0 #clr-wht-act [[${todaysDate}]]  -  ${dayName}`;

      // Step 1: Find existing header or create new one
      let headerUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?parent :block/uid "${pageUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string "${headerContent}"]]
      `);

      if (!headerUid) {
        // Create new header if it doesn't exist
        log("Creating new daily header for chat room", "INFO");
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": pageUid, order: 0 },
          block: { string: headerContent },
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        headerUid = window.roamAlphaAPI.data.q(`
          [:find ?uid .
           :where 
           [?parent :block/uid "${pageUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string "${headerContent}"]]
        `);
      } else {
        log(
          "Found existing daily header, adding to conversation thread",
          "INFO"
        );
      }

      if (!headerUid) throw new Error("Could not find or create daily header");

      // Step 2: Add new message as LAST child of the header (for threaded conversation)
      const childContent = `#ts0 #[[${currentUser.displayName}]]  ▸  `;
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": headerUid, order: "last" },
        block: { string: childContent },
      });

      // Step 3: Focus cursor at end of the prepended text
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Find the new child block we just created
      const allChildren = window.roamAlphaAPI.data.q(`
        [:find ?uid ?string
         :where 
         [?parent :block/uid "${headerUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string ?string]]
      `);

      // Find our newly created block (should be the one with our exact content)
      const newChildUid = allChildren.find(
        ([uid, string]) => string === childContent
      )?.[0];

      if (newChildUid) {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": newChildUid,
            "window-id": "main-window",
          },
          selection: { start: childContent.length, end: childContent.length },
        });
        log("Cursor positioned after username in new message", "SUCCESS");
      }

      log(
        "Chat room message added to conversation thread successfully",
        "SUCCESS"
      );
      return true;
    } catch (error) {
      log(`Error creating chat room entry: ${error.message}`, "ERROR");
      throw error;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎨 UI MANAGEMENT - Leveraging UI Engine
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Button management (Extension Six handles directory buttons)
  const updateButtons = () => {
    try {
      const pageContext = detectPageContext();

      // Clear existing buttons
      hideButtons();

      // Show quick entry button only where needed
      if (
        pageContext.type === "username" &&
        shouldShowUsernameButton(pageContext.page)
      ) {
        showQuickEntryButton("Add daily entry", () =>
          createUsernameEntry(pageContext.page)
        );
      } else if (pageContext.type === "chatroom") {
        // Always show for chat rooms (threaded conversation support)
        showQuickEntryButton("Add chat message", () =>
          createChatRoomEntry(pageContext.page)
        );
      }

      // Note: Extension Six handles all directory/navigation buttons
    } catch (error) {
      log(`Error updating buttons: ${error.message}`, "ERROR");
      console.error("Button update error details:", error);
    }
  };

  // 🌟 Show quick entry button (UI Engine + Manual Fallback)
  const showQuickEntryButton = (text, onClick) => {
    const uiEngine = getUIEngine();

    // Try UI Engine first
    if (uiEngine?.showButton) {
      quickEntryButton = uiEngine.showButton({
        text,
        icon: "✏️",
        position: "top-right",
        onClick: async () => {
          try {
            await onClick();
            hideButtons(); // Hide after successful creation

            // Visual feedback
            if (quickEntryButton) {
              quickEntryButton.innerHTML = `<span>✅</span><span>Entry Added!</span>`;
            }
          } catch (error) {
            log(`Button click error: ${error.message}`, "ERROR");
            if (quickEntryButton) {
              quickEntryButton.innerHTML = `<span>❌</span><span>Try Again</span>`;
            }
          }
        },
      });
      log("Quick entry button created via UI Engine", "SUCCESS");
    } else {
      // Fallback: Manual button creation
      log("UI Engine not available, creating manual button", "INFO");
      createManualQuickEntryButton(text, onClick);
    }
  };

  // 🌟 Manual button creation (positioned higher, same line as directory button)
  const createManualQuickEntryButton = (text, onClick) => {
    try {
      if (quickEntryButton) {
        quickEntryButton.remove();
        quickEntryButton = null;
      }

      // Position higher to align with directory button (top line)
      const topPosition = "60px";

      quickEntryButton = document.createElement("div");
      quickEntryButton.id = "journal-quick-entry-button";
      quickEntryButton.style.cssText = `
        position: fixed;
        top: ${topPosition};
        right: 20px;
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border: 1px solid #f59e0b;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        z-index: 9997;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #92400e;
        cursor: pointer;
        user-select: none;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        font-weight: 600;
        font-size: 14px;
        opacity: 0;
        transform: translateX(320px);
      `;

      quickEntryButton.innerHTML = `
        <span style="font-size: 16px;">✏️</span>
        <span>${text}</span>
      `;

      // Click handler
      quickEntryButton.addEventListener("click", async () => {
        try {
          // Visual feedback BEFORE hiding
          quickEntryButton.innerHTML = `<span style="font-size: 16px;">⏳</span><span>Adding message...</span>`;
          quickEntryButton.style.background =
            "linear-gradient(135deg, #fef3c7, #fde68a)";

          await onClick();

          // Success feedback
          if (quickEntryButton) {
            quickEntryButton.innerHTML = `<span style="font-size: 16px;">✅</span><span>Message Added!</span>`;
            quickEntryButton.style.background =
              "linear-gradient(135deg, #dcfce7, #bbf7d0)";
            quickEntryButton.style.borderColor = "#16a34a";
            quickEntryButton.style.color = "#15803d";
          }

          // Hide after delay to show success message
          setTimeout(() => {
            hideButtons();
          }, 2000);
        } catch (error) {
          log(`Button click error: ${error.message}`, "ERROR");

          // Error feedback with context-aware hiding
          if (quickEntryButton) {
            quickEntryButton.innerHTML = `<span style="font-size: 16px;">❌</span><span>Try Again</span>`;
            quickEntryButton.style.background =
              "linear-gradient(135deg, #fecaca, #fca5a5)";
            quickEntryButton.style.borderColor = "#dc2626";
            quickEntryButton.style.color = "#991b1b";
          }

          // For chat rooms, reset button after error
          // For username pages, hide after delay
          const pageContext = detectPageContext();
          if (pageContext.type === "chatroom") {
            // Reset button for retry in chat room
            setTimeout(() => {
              if (quickEntryButton) {
                quickEntryButton.innerHTML = `<span style="font-size: 16px;">✏️</span><span>Add chat message</span>`;
                quickEntryButton.style.background =
                  "linear-gradient(135deg, #fef3c7, #fde68a)";
                quickEntryButton.style.borderColor = "#f59e0b";
                quickEntryButton.style.color = "#92400e";
              }
            }, 2500);
          } else {
            // Hide after delay for username pages
            setTimeout(() => {
              hideButtons();
            }, 3000);
          }
        }
      });

      // Hover effects
      quickEntryButton.addEventListener("mouseenter", () => {
        quickEntryButton.style.transform =
          "translateX(0) translateY(-2px) scale(1.02)";
        quickEntryButton.style.boxShadow = "0 6px 16px rgba(245, 158, 11, 0.4)";
        quickEntryButton.style.background =
          "linear-gradient(135deg, #fde68a, #fcd34d)";
      });

      quickEntryButton.addEventListener("mouseleave", () => {
        quickEntryButton.style.transform =
          "translateX(0) translateY(0) scale(1)";
        quickEntryButton.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
        quickEntryButton.style.background =
          "linear-gradient(135deg, #fef3c7, #fde68a)";
      });

      document.body.appendChild(quickEntryButton);

      // Animate in
      setTimeout(() => {
        quickEntryButton.style.opacity = "1";
        quickEntryButton.style.transform = "translateX(0)";
      }, 100);

      log(`Manual quick entry button created: "${text}"`, "SUCCESS");
    } catch (error) {
      log(`Error creating manual button: ${error.message}`, "ERROR");
    }
  };

  // 🌟 Show standing navigation button (UI Engine + Manual Fallback)
  const showStandingButton = (pageContext) => {
    const uiEngine = getUIEngine();

    // Try UI Engine first
    if (uiEngine?.showButton) {
      const config =
        pageContext.type === "username"
          ? {
              text: "User Data",
              icon: "📋",
              onClick: () => navigateToUserData(pageContext.page),
            }
          : { text: "User Directory", icon: "👥", onClick: showDirectoryModal };

      standingButton = uiEngine.showButton({
        ...config,
        position: "top-left",
        className: "journal-standing-button",
      });
      log("Standing button created via UI Engine", "SUCCESS");
    } else {
      // Fallback: Manual button creation
      log("UI Engine not available, creating manual standing button", "INFO");
      createManualStandingButton(pageContext);
    }
  };

  // 🌟 Manual standing button creation (fallback)
  const createManualStandingButton = (pageContext) => {
    try {
      if (standingButton) {
        standingButton.remove();
        standingButton = null;
      }

      const config =
        pageContext.type === "username"
          ? {
              text: "User Data",
              icon: "📋",
              onClick: () => navigateToUserData(pageContext.page),
            }
          : { text: "User Directory", icon: "👥", onClick: showDirectoryModal };

      // Calculate left position
      let leftPosition = "320px";
      try {
        const mainContent =
          document.querySelector(".roam-main") ||
          document.querySelector(".roam-body") ||
          document.querySelector("#main-content");
        if (mainContent) {
          const rect = mainContent.getBoundingClientRect();
          leftPosition = `${rect.left + 20}px`;
        }
      } catch (error) {
        // Use fallback position
      }

      standingButton = document.createElement("div");
      standingButton.id = "journal-standing-button";
      standingButton.style.cssText = `
        position: fixed;
        top: 60px;
        left: ${leftPosition};
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border: 1px solid #f59e0b;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #92400e;
        cursor: pointer;
        user-select: none;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        font-weight: 600;
        font-size: 14px;
      `;

      standingButton.innerHTML = `
        <span style="font-size: 16px;">${config.icon}</span>
        <span>${config.text}</span>
      `;

      standingButton.addEventListener("click", config.onClick);

      // Hover effects
      standingButton.addEventListener("mouseenter", () => {
        standingButton.style.transform = "translateY(-2px) scale(1.02)";
        standingButton.style.boxShadow = "0 6px 16px rgba(245, 158, 11, 0.4)";
        standingButton.style.background =
          "linear-gradient(135deg, #fde68a, #fcd34d)";
      });

      standingButton.addEventListener("mouseleave", () => {
        standingButton.style.transform = "translateY(0) scale(1)";
        standingButton.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
        standingButton.style.background =
          "linear-gradient(135deg, #fef3c7, #fde68a)";
      });

      document.body.appendChild(standingButton);
      log(`Manual standing button created: ${config.text}`, "SUCCESS");
    } catch (error) {
      log(`Error creating manual standing button: ${error.message}`, "ERROR");
    }
  };

  // 🌟 Hide all buttons (UI Engine + Manual)
  const hideButtons = () => {
    // Hide quick entry button
    if (quickEntryButton) {
      if (quickEntryButton.remove) {
        quickEntryButton.remove();
      } else if (quickEntryButton.parentNode) {
        quickEntryButton.parentNode.removeChild(quickEntryButton);
      }
      quickEntryButton = null;
    }

    // Hide standing button
    if (standingButton) {
      if (standingButton.remove) {
        standingButton.remove();
      } else if (standingButton.parentNode) {
        standingButton.parentNode.removeChild(standingButton);
      }
      standingButton = null;
    }

    // Additional cleanup - remove any leftover buttons by ID
    const leftoverQuickEntry = document.getElementById(
      "journal-quick-entry-button"
    );
    if (leftoverQuickEntry) {
      leftoverQuickEntry.remove();
    }

    const leftoverStanding = document.getElementById("journal-standing-button");
    if (leftoverStanding) {
      leftoverStanding.remove();
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎯 LIFECYCLE & INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Extension lifecycle
  const onload = ({ extensionAPI: api }) => {
    try {
      log("🚀 Journal Entry Creator v1.0 loading...", "SUCCESS");
      extensionAPI = api;

      // Settings panel
      extensionAPI.settings.panel.create({
        tabTitle: "Journal Entry Creator",
        settings: [
          {
            id: "enableQuickEntry",
            name: "Enable Quick Entry Buttons",
            description:
              "Show quick entry buttons on username and chat room pages",
            action: { type: "switch" },
          },
        ],
      });

      // Register with Extension Suite
      const journalAPI = {
        createUsernameEntry,
        createChatRoomEntry,
        detectPageContext,
        getUserJournalColor,
        updateButtons,
        getTodaysRoamDate,
        getTodaysDayName,
      };

      if (window.RoamExtensionSuite) {
        window.RoamExtensionSuite.register(
          "journal-entry-creator",
          journalAPI,
          {
            version: "1.0.0",
            dependencies: ["core-data", "ui-engine", "extension-1.5"],
            description:
              "Lean journal entry creation with smart context detection",
          }
        );
      }

      // Backward compatibility
      window.journalEntryCreator = journalAPI;

      isInitialized = true;

      // Setup monitoring and initial button check
      setTimeout(() => {
        updateButtons();
        setupPageMonitoring();
      }, 1000);

      log("✅ Journal Entry Creator loaded successfully", "SUCCESS");
    } catch (error) {
      log(`Error loading Journal Entry Creator: ${error.message}`, "ERROR");
    }
  };

  // 🌟 Simple page monitoring
  const setupPageMonitoring = () => {
    let lastUrl = window.location.href;

    const checkForPageChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(updateButtons, 500);
      }
    };

    // Monitor URL changes
    setInterval(checkForPageChange, 1000);

    // Monitor DOM changes for dynamic navigation
    const observer = new MutationObserver((mutations) => {
      const hasSignificantChange = mutations.some(
        (mutation) =>
          mutation.type === "childList" &&
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === 1 &&
              (node.classList?.contains("roam-article") ||
                node.classList?.contains("roam-log-container"))
          )
      );

      if (hasSignificantChange) {
        setTimeout(updateButtons, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  const onunload = () => {
    try {
      log("Journal Entry Creator unloading...", "INFO");

      hideButtons();
      isInitialized = false;
      extensionAPI = null;

      if (window.journalEntryCreator) {
        delete window.journalEntryCreator;
      }

      log("✅ Journal Entry Creator unloaded successfully", "SUCCESS");
    } catch (error) {
      log(`Error unloading: ${error.message}`, "ERROR");
    }
  };

  return { onload, onunload };
})();

export default journalEntryCreator;
