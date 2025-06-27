// 🌳 Extension 7: Journal Entry Creator - Final Version with Perfect Nuclear Button
// 🎯 Fixed positioning, warm yellow colors, perfect width matching
// ✨ Nuclear approach - simple, reliable, beautiful

const journalEntryCreator = (() => {
  // 🌟 State Management (Simplified)
  let extensionAPI = null;
  let quickEntryButton = null;
  let isInitialized = false;

  // Safety variable (Extension Six handles directory buttons)
  let standingButton = null;

  // 🌟 Enhanced Logging with Registry Integration
  const log = (message, level = "INFO") => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji =
      {
        DEBUG: "🔍",
        INFO: "ℹ️",
        SUCCESS: "✅",
        WARN: "⚠️",
        ERROR: "❌",
      }[level] || "📝";

    console.log(`[Journal Entry ${timestamp}] ${emoji} ${level}: ${message}`);

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
      log("🔍 Starting page context detection...", "DEBUG");

      const coreData = getCoreData();
      const currentUser = coreData?.getCurrentUser?.() || {
        displayName: getCurrentUserFallback(),
      };

      log(`👤 Current user: "${currentUser.displayName}"`, "DEBUG");

      // Get current page title
      const pageTitle = getCurrentPageTitle();
      log(`📄 Current page title: "${pageTitle}"`, "DEBUG");

      if (!pageTitle) {
        log("❌ No page title found", "WARN");
        return { type: "other", page: null };
      }

      // Check for Chat Room (flexible detection)
      if (pageTitle.toLowerCase().includes("chat room")) {
        log(`🗨️ Detected CHAT ROOM page: "${pageTitle}"`, "SUCCESS");
        return { type: "chatroom", page: pageTitle };
      }

      // Check for username page
      log(
        `Comparing user "${currentUser.displayName}" with page "${pageTitle}"`,
        "DEBUG"
      );
      if (currentUser.displayName && pageTitle === currentUser.displayName) {
        log(`👤 Detected USERNAME page: "${pageTitle}"`, "SUCCESS");
        return { type: "username", page: pageTitle };
      } else if (currentUser.displayName) {
        log(
          `👤 Not a username page: user="${currentUser.displayName}" != page="${pageTitle}"`,
          "DEBUG"
        );
      } else {
        log(
          `👤 No current user detected, cannot determine if username page`,
          "WARN"
        );
      }

      log(`📝 Detected OTHER page type: "${pageTitle}"`, "INFO");
      return { type: "other", page: pageTitle };
    } catch (error) {
      log(`❌ Error detecting page context: ${error.message}`, "ERROR");
      log(`❌ Error stack: ${error.stack}`, "ERROR");
      return { type: "other", page: null };
    }
  };

  // 🌟 Simple current user detection (Keep It Simple!)
  const getCurrentUserFallback = () => {
    try {
      const userUid = window.roamAlphaAPI.user.uid();
      if (userUid) {
        const userData = window.roamAlphaAPI.pull("[*]", [
          ":user/uid",
          userUid,
        ]);
        const displayName =
          userData?.[":user/display-name"] || userData?.displayName;
        if (displayName) {
          log(`User detected: ${displayName}`, "SUCCESS");
          return displayName;
        }
      }
    } catch (error) {
      log(`User detection failed: ${error.message}`, "ERROR");
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

  // 🌟 Check if today's daily banner exists (Chat Room page) - FIXED LOGIC
  const shouldShowChatRoomButton = (pageName) => {
    try {
      log(`🔍 Checking if banner exists for chat room: "${pageName}"`, "DEBUG");

      const todaysDate = getTodaysRoamDate();
      log(`📅 Today's date: "${todaysDate}"`, "DEBUG");

      // Get DIRECT children only (same as creation logic)
      const pageChildren = window.roamAlphaAPI.data.q(`
        [:find ?string
         :where 
         [?page :node/title "${pageName}"]
         [?page :block/children ?child]
         [?child :block/string ?string]]
      `);

      log(`🔍 Found ${pageChildren.length} direct children to check`, "DEBUG");

      // Check if today's banner exists (contains #st0 and today's date link)
      let bannerCount = 0;
      let todaysBannerCount = 0;

      const todaysBannerExists = pageChildren.some(([blockString]) => {
        const lowerString = blockString.toLowerCase();
        const hasStTag = lowerString.includes("#st0");

        if (hasStTag) {
          bannerCount++;
          log(`📋 Found #st0 block: "${blockString}"`, "DEBUG");
        }

        // Check for today's date (exact match)
        const todaysDateLower = todaysDate.toLowerCase();
        const hasDateLink = lowerString.includes(`[[${todaysDateLower}]]`);

        if (hasStTag && hasDateLink) {
          todaysBannerCount++;
          log(
            `🎯 Found TODAY'S banner #${todaysBannerCount}: "${blockString}"`,
            "SUCCESS"
          );
          return true;
        }

        return false;
      });

      log(`📊 Found ${bannerCount} total #st0 blocks`, "DEBUG");
      log(`📊 Found ${todaysBannerCount} today's banners`, "DEBUG");
      log(`🎯 Today's banner exists: ${todaysBannerExists}`, "DEBUG");
      log(`🔘 Should show button: ${!todaysBannerExists}`, "INFO");

      return !todaysBannerExists;
    } catch (error) {
      log(`❌ Error checking chat room button: ${error.message}`, "ERROR");
      log(`❌ Error stack: ${error.stack}`, "ERROR");
      return false;
    }
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

  // 🌟 Create daily banner in chat room (with smart placement + debug logging)
  const createChatRoomEntry = async (pageName) => {
    try {
      log(
        `🚀 STARTING chat room banner creation for page: "${pageName}"`,
        "INFO"
      );

      // Step 1: Get page UID (following username pattern)
      log("Step 1: Finding page UID...", "DEBUG");
      const pageUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?page :node/title "${pageName}"]
         [?page :block/uid ?uid]]
      `);

      if (!pageUid) {
        log(`❌ ERROR: Could not find page UID for "${pageName}"`, "ERROR");
        throw new Error(`Could not find Chat Room page UID for "${pageName}"`);
      }
      log(`✅ Found page UID: ${pageUid}`, "SUCCESS");

      // Step 2: Build banner content (following username pattern)
      const todaysDate = getTodaysRoamDate();
      const dayName = getTodaysDayName();
      const bannerContent = `#st0 #clr-wht-act [[${todaysDate}]]  -  ${dayName}`;
      log(`📅 Banner content: "${bannerContent}"`, "DEBUG");

      // Step 3: Find existing date banners for placement logic
      log("Step 3: Finding existing date banners...", "DEBUG");

      // Declare insertLocation in broader scope
      let insertLocation;

      try {
        // Simplified approach: get all direct children of the page first
        const pageChildren = window.roamAlphaAPI.data.q(`
          [:find ?uid ?string ?order
           :where 
           [?page :node/title "${pageName}"]
           [?page :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]
           [?child :block/order ?order]]
        `);

        log(`Found ${pageChildren.length} direct children of page`, "DEBUG");

        // Filter for date banners among direct children only
        const dateBanners = pageChildren.filter(([uid, blockString, order]) => {
          const lowerString = blockString.toLowerCase();
          const hasStTag = lowerString.includes("#st0");
          const hasDateLink = /\[\[.*\]\]/.test(blockString);
          const isDateBanner = hasStTag && hasDateLink;

          if (isDateBanner) {
            log(
              `📋 Found date banner: "${blockString}" (order: ${order})`,
              "DEBUG"
            );
          }

          return isDateBanner;
        });

        log(`Found ${dateBanners.length} existing date banners`, "INFO");

        // Step 4: Determine placement
        if (dateBanners.length === 0) {
          log("📍 No existing banners - placing at BOTTOM of page", "INFO");
          insertLocation = {
            "parent-uid": pageUid,
            order: "last",
          };
        } else {
          // Find banner with lowest order (topmost)
          const sortedBanners = dateBanners.sort(([, , a], [, , b]) => a - b);
          const topmostOrder = sortedBanners[0][2];

          log(
            `📍 Placing ABOVE topmost banner (order: ${topmostOrder})`,
            "INFO"
          );
          insertLocation = {
            "parent-uid": pageUid,
            order: topmostOrder,
          };
        }

        log(
          `📍 Insert location: parent=${insertLocation["parent-uid"]}, order=${insertLocation.order}`,
          "DEBUG"
        );
      } catch (placementError) {
        log(
          `⚠️ Placement detection failed: ${placementError.message}, defaulting to bottom`,
          "WARN"
        );
        insertLocation = {
          "parent-uid": pageUid,
          order: "last",
        };
      }

      // Step 5: Create the banner block (following username pattern)
      log("Step 5: Creating banner block...", "DEBUG");
      try {
        await window.roamAlphaAPI.data.block.create({
          location: insertLocation,
          block: { string: bannerContent },
        });
        log("✅ Banner block created successfully", "SUCCESS");
      } catch (createError) {
        log(`❌ Banner creation failed: ${createError.message}`, "ERROR");
        throw createError;
      }

      // Step 6: Wait and find the newly created banner (following username pattern)
      log("Step 6: Finding newly created banner...", "DEBUG");
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newBannerUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?parent :block/uid "${pageUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string "${bannerContent}"]]
      `);

      if (!newBannerUid) {
        log(
          `❌ Could not find newly created banner with content: "${bannerContent}"`,
          "ERROR"
        );
        throw new Error("Could not find newly created banner");
      }
      log(`✅ Found new banner UID: ${newBannerUid}`, "SUCCESS");

      // Step 7: Create child block (following username pattern)
      log("Step 7: Creating child block...", "DEBUG");
      try {
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": newBannerUid, order: 0 },
          block: { string: "" },
        });
        log("✅ Child block created successfully", "SUCCESS");
      } catch (childError) {
        log(`❌ Child block creation failed: ${childError.message}`, "ERROR");
        throw childError;
      }

      // Step 8: Focus on child block (following username pattern)
      log("Step 8: Setting focus on child block...", "DEBUG");
      await new Promise((resolve) => setTimeout(resolve, 300));

      const childUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?parent :block/uid "${newBannerUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]]
      `);

      if (childUid) {
        try {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: {
              "block-uid": childUid,
              "window-id": "main-window",
            },
          });
          log(`✅ Focus set on child block: ${childUid}`, "SUCCESS");
        } catch (focusError) {
          log(`⚠️ Focus setting failed: ${focusError.message}`, "WARN");
          // Don't throw - banner was created successfully
        }
      } else {
        log("⚠️ Could not find child block for focus", "WARN");
        // Don't throw - banner was created successfully
      }

      log(
        "🎉 Daily banner created successfully with smart placement!",
        "SUCCESS"
      );
      return true;
    } catch (error) {
      log(`💥 FATAL ERROR in createChatRoomEntry: ${error.message}`, "ERROR");
      log(`💥 Error stack: ${error.stack}`, "ERROR");
      throw error;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎨 UI MANAGEMENT - NUCLEAR BUTTON SYSTEM
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Button management (Extension Six handles directory buttons)
  const updateButtons = () => {
    try {
      log("🔄 Starting button update process...", "DEBUG");

      const pageContext = detectPageContext();
      log(
        `📋 Page context result: type="${pageContext.type}", page="${pageContext.page}"`,
        "DEBUG"
      );

      // Clear existing buttons
      log("🧹 Clearing existing buttons...", "DEBUG");
      hideButtons();

      // Show quick entry button only where needed
      if (
        pageContext.type === "username" &&
        shouldShowUsernameButton(pageContext.page)
      ) {
        log("🏠 Showing USERNAME daily entry button", "INFO");
        showQuickEntryButton("Add daily entry", () =>
          createUsernameEntry(pageContext.page)
        );
      } else if (
        pageContext.type === "chatroom" &&
        shouldShowChatRoomButton(pageContext.page)
      ) {
        log("🗨️ Showing CHAT ROOM daily banner button", "INFO");
        showQuickEntryButton("Add a daily banner?", () =>
          createChatRoomEntry(pageContext.page)
        );
      } else {
        log(`🚫 No button needed for page type: ${pageContext.type}`, "DEBUG");

        // Additional debug info
        if (pageContext.type === "username") {
          log(
            "👤 Username page detected but button condition not met",
            "DEBUG"
          );
        } else if (pageContext.type === "chatroom") {
          log(
            "🗨️ Chat room page detected but button condition not met",
            "DEBUG"
          );
        }
      }

      log("✅ Button update process completed", "DEBUG");

      // Note: Extension Six handles all directory/navigation buttons
    } catch (error) {
      log(`❌ Error updating buttons: ${error.message}`, "ERROR");
      log(`❌ Error stack: ${error.stack}`, "ERROR");
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

  // ===================================================================
  // 🚨 NUCLEAR BUTTON SYSTEM - PERFECT POSITIONING & WIDTH MATCHING
  // ===================================================================

  // 🌟 Nuclear Manual button creation with perfect positioning and size matching
  const createManualQuickEntryButton = (text, onClick) => {
    try {
      log(
        "🌻 NUCLEAR BUTTON: Creating with perfect positioning and width matching...",
        "INFO"
      );

      // Remove any existing button
      const existing = document.getElementById("journal-quick-entry-button");
      if (existing) {
        existing.remove();
        log("🗑️ Removed existing button", "DEBUG");
      }

      // PERFECT POSITIONING & BEAUTIFUL WARM YELLOW STYLING + 12PX WIDER
      const styling = {
        top: "180px", // Perfect position below purple button
        right: "20px", // Perfect horizontal alignment
        // 🌻 WARM YELLOW GRADIENT - beautiful and pleasant!
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        borderColor: "#f59e0b",
        textColor: "#92400e",
        shadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
      };

      log("📍 Nuclear positioning and styling:", styling);

      // Create button with PERFECT positioning, warm colors, and matching width
      const button = document.createElement("div");
      button.id = "journal-quick-entry-button";
      button.style.cssText = `
        position: fixed !important;
        top: ${styling.top} !important;
        right: ${styling.right} !important;
        background: ${styling.background} !important;
        border: 2px solid ${styling.borderColor} !important;
        border-radius: 12px !important;
        box-shadow: ${styling.shadow} !important;
        z-index: 9998 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        color: ${styling.textColor} !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 12px 26px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        min-width: 212px !important;
        justify-content: center !important;
        white-space: nowrap !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        opacity: 1 !important;
        transform: none !important;
      `;

      button.innerHTML = `
        <span style="font-size: 16px;">✏️</span>
        <span>${text}</span>
      `;

      // Click handler with warm color feedback
      button.addEventListener("click", async () => {
        try {
          log("🔥 Nuclear button clicked!", "INFO");

          // Visual feedback - keep warm colors
          button.innerHTML = `<span style="font-size: 16px;">⏳</span><span>Creating...</span>`;
          button.style.background =
            "linear-gradient(135deg, #fde68a, #fcd34d) !important";

          await onClick();

          // Success - green but still warm
          button.innerHTML = `<span style="font-size: 16px;">✅</span><span>Entry Added!</span>`;
          button.style.background =
            "linear-gradient(135deg, #10b981, #059669) !important";
          button.style.borderColor = "#047857 !important";
          button.style.color = "#065f46 !important";

          // Hide after success
          setTimeout(() => {
            if (button && button.parentNode) {
              button.remove();
            }
          }, 2000);
        } catch (error) {
          log(`Nuclear button click error: ${error.message}`, "ERROR");

          // Error feedback - red but not too harsh
          button.innerHTML = `<span style="font-size: 16px;">❌</span><span>Try Again</span>`;
          button.style.background =
            "linear-gradient(135deg, #f87171, #ef4444) !important";
          button.style.borderColor = "#dc2626 !important";
          button.style.color = "#7f1d1d !important";

          // Reset after error back to warm yellow
          setTimeout(() => {
            button.innerHTML = `<span style="font-size: 16px;">✏️</span><span>${text}</span>`;
            button.style.background = styling.background + " !important";
            button.style.borderColor = styling.borderColor + " !important";
            button.style.color = styling.textColor + " !important";
          }, 3000);
        }
      });

      // Warm hover effects
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-2px) scale(1.02) !important";
        button.style.boxShadow =
          "0 6px 16px rgba(245, 158, 11, 0.4) !important";
        // Slightly deeper warm yellow on hover
        button.style.background =
          "linear-gradient(135deg, #fde68a, #fcd34d) !important";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "none !important";
        button.style.boxShadow = styling.shadow + " !important";
        button.style.background = styling.background + " !important";
      });

      // Add to page
      document.body.appendChild(button);

      log("🌻 PERFECT NUCLEAR BUTTON CREATED!", "SUCCESS");
      log("📍 Position: 180px from top, 20px from right", "DEBUG");
      log("📏 Width: 212px (12px wider for perfect matching)", "DEBUG");

      return button;
    } catch (error) {
      log(`💥 Nuclear button creation failed: ${error.message}`, "ERROR");
      throw error;
    }
  };

  // 🌟 Enhanced hide function
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
      // Prevent multiple instances
      if (window.journalEntryCreatorActive) {
        log(
          "Extension already loaded, skipping duplicate initialization",
          "WARN"
        );
        return;
      }
      window.journalEntryCreatorActive = true;

      log(
        "Journal Entry Creator v1.0 + Perfect Nuclear Button loading...",
        "SUCCESS"
      );
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
            version: "1.0.0-perfect-nuclear-button",
            dependencies: ["core-data", "ui-engine", "extension-1.5"],
            description:
              "Lean journal entry creation with smart context detection + Perfect Nuclear Button",
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

      log(
        "Journal Entry Creator loaded successfully with Perfect Nuclear Button!",
        "SUCCESS"
      );
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

      // Clean up instance protection
      if (window.journalEntryCreatorActive) {
        delete window.journalEntryCreatorActive;
      }

      if (window.journalEntryCreator) {
        delete window.journalEntryCreator;
      }

      log("Journal Entry Creator unloaded successfully", "SUCCESS");
    } catch (error) {
      log(`Error unloading: ${error.message}`, "ERROR");
    }
  };

  return { onload, onunload };
})();

export default journalEntryCreator;
