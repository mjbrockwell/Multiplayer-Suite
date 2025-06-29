// 🌳 Extension 7: Journal Entry Creator - Refactored with Button Manager Integration
// ✨ Clean integration with Extension 1.6 (Simple Button Utility 2.0)
// 🎯 Smart journal creation with sophisticated conditional logic
// 🎨 Standardized warm yellow styling for consistency

const journalEntryCreator = (() => {
  // 🌟 State Management
  let extensionAPI = null;
  let buttonManager = null;
  let isInitialized = false;

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
  const getUtilities = () => getPlatform()?.getUtility;

  // ═══════════════════════════════════════════════════════════════
  // 🔧 DEPENDENCY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Check if Extension 1.6 (Simple Button Utility 2.0) is available
  const checkButtonUtilityDependency = () => {
    if (!window.SimpleExtensionButtonManager) {
      log(
        "❌ Simple Button Utility 2.0 SimpleExtensionButtonManager not found",
        "WARN"
      );
      return false;
    }

    if (!window.ButtonConditions) {
      log("❌ Simple Button Utility 2.0 ButtonConditions not found", "WARN");
      return false;
    }

    log("✅ Simple Button Utility 2.0 properly available", "SUCCESS");
    return true;
  };

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

      // 🔧 FIXED QUERY: Look for descendants, not just direct children
      const allDescendants = window.roamAlphaAPI.data.q(`
      [:find ?string
       :where 
       [?page :node/title "${prefsPageName}"]
       [?page :block/children ?child]
       [?descendant :block/parents ?child]
       [?descendant :block/string ?string]]
    `);

      log(
        `🔍 Found ${allDescendants.length} descendant blocks to search`,
        "DEBUG"
      );

      // 🎯 IMPROVED SEARCH: Look for journal color key blocks (handle multiple formats)
      let journalColorKeyFound = false;
      let journalColorKeyUid = null;
      let foundKeyText = null;

      for (const [blockString] of allDescendants) {
        // Look for any journal color key format (flexible matching)
        if (
          blockString.includes("**Journal") &&
          blockString.includes("Color:**")
        ) {
          journalColorKeyFound = true;
          foundKeyText = blockString;
          // Get the UID of this key block
          journalColorKeyUid = window.roamAlphaAPI.data.q(`
          [:find ?uid .
           :where 
           [?block :block/string "${blockString}"]
           [?block :block/uid ?uid]]
        `);
          log(`✅ Found Journal Color key block: "${blockString}"`, "DEBUG");
          break;
        }
      }

      if (journalColorKeyFound && journalColorKeyUid) {
        // 🎯 Get the child blocks of the Journal Color key (the actual color values)
        const colorValues = window.roamAlphaAPI.data.q(`
        [:find ?string
         :where 
         [?parent :block/uid "${journalColorKeyUid}"]
         [?parent :block/children ?child]
         [?child :block/string ?string]]
      `);

        if (colorValues.length > 0) {
          const colorValue = colorValues[0][0].trim().toLowerCase();
          log(`🎨 Found color preference: "${colorValue}"`, "SUCCESS");
          return colorValue;
        }
      }

      // 🔍 FALLBACK: Original pattern search for backward compatibility (case-insensitive)
      log("🔄 Using fallback search pattern...", "DEBUG");
      for (const [blockString] of allDescendants) {
        const lowerString = blockString.toLowerCase();
        if (lowerString.includes("journal") && lowerString.includes("color")) {
          const colorMatch = blockString.match(
            /\b(red|orange|yellow|green|blue|violet|purple|brown|grey|gray|white)\b/i
          );
          if (colorMatch) {
            log(
              `Found color preference (fallback): ${colorMatch[1]}`,
              "SUCCESS"
            );
            return colorMatch[1].toLowerCase();
          }
        }
      }

      // 🔍 FINAL FALLBACK: Look for any valid color values in descendants
      log("🔄 Final fallback: searching for any color values...", "DEBUG");
      const validColors = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "violet",
        "purple",
        "brown",
        "grey",
        "gray",
        "white",
      ];

      for (const [blockString] of allDescendants) {
        const trimmedString = blockString.trim().toLowerCase();
        if (validColors.includes(trimmedString)) {
          log(
            `Found color preference (final fallback): ${trimmedString}`,
            "SUCCESS"
          );
          return trimmedString;
        }
      }

      log("🔵 No color preference found, using default: blue", "INFO");
      return "blue"; // Default
    } catch (error) {
      log(`❌ Error getting journal color: ${error.message}`, "ERROR");
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

  // 🌟 Check if today's daily banner exists (Chat Room page)
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
      const todaysBannerExists = pageChildren.some(([blockString]) => {
        const lowerString = blockString.toLowerCase();
        const hasStTag = lowerString.includes("#st0");
        const todaysDateLower = todaysDate.toLowerCase();
        const hasDateLink = lowerString.includes(`[[${todaysDateLower}]]`);

        if (hasStTag && hasDateLink) {
          log(`🎯 Found TODAY'S banner: "${blockString}"`, "SUCCESS");
          return true;
        }

        return false;
      });

      log(`🎯 Today's banner exists: ${todaysBannerExists}`, "DEBUG");
      log(`🔘 Should show button: ${!todaysBannerExists}`, "INFO");

      return !todaysBannerExists;
    } catch (error) {
      log(`❌ Error checking chat room button: ${error.message}`, "ERROR");
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎯 SMART BANNER PLACEMENT LOGIC
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Find topmost existing date banner for smart placement
  const findTopmostDateBannerPosition = (pageUid) => {
    try {
      log(
        `🔍 Finding topmost date banner position for page: ${pageUid}`,
        "DEBUG"
      );

      // Get all direct children with their order
      const pageChildren = window.roamAlphaAPI.data.q(`
        [:find ?uid ?string ?order
         :where 
         [?page :block/uid "${pageUid}"]
         [?page :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string ?string]
         [?child :block/order ?order]]
      `);

      log(
        `📋 Found ${pageChildren.length} direct children to analyze`,
        "DEBUG"
      );

      // Filter for existing date banners
      const dateBanners = [];
      const datePattern = /\[\[.+\]\]/; // Matches [[date]] pattern

      pageChildren.forEach(([uid, blockString, order]) => {
        const lowerString = blockString.toLowerCase();
        const hasStTag = lowerString.includes("#st0");
        const hasDateLink = datePattern.test(blockString);

        if (hasStTag && hasDateLink) {
          dateBanners.push({
            uid,
            order,
            text: blockString,
          });
          log(
            `📌 Found date banner: order=${order}, text="${blockString}"`,
            "DEBUG"
          );
        }
      });

      if (dateBanners.length === 0) {
        log(`📍 No existing date banners found, placing at top`, "INFO");
        return {
          strategy: "first",
          order: 0,
        };
      }

      // Find the topmost (lowest order number) date banner
      const sortedBanners = dateBanners.sort((a, b) => a.order - b.order);
      const topmostBanner = sortedBanners[0];

      log(
        `🎯 Topmost banner found: order=${topmostBanner.order}, uid=${topmostBanner.uid}`,
        "SUCCESS"
      );
      log(
        `📍 New banner will be placed at order=${topmostBanner.order}`,
        "INFO"
      );

      return {
        strategy: "before",
        order: topmostBanner.order,
        targetUid: topmostBanner.uid,
      };
    } catch (error) {
      log(
        `❌ Error finding topmost banner position: ${error.message}`,
        "ERROR"
      );
      // Fallback to bottom placement
      return {
        strategy: "last",
        order: "last",
      };
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

  // 🌟 Create daily banner in chat room with SMART PLACEMENT
  const createChatRoomEntry = async (pageName) => {
    try {
      log(
        `🚀 STARTING smart chat room banner creation for page: "${pageName}"`,
        "INFO"
      );

      // Get page UID
      const pageUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?page :node/title "${pageName}"]
         [?page :block/uid ?uid]]
      `);

      if (!pageUid) {
        throw new Error(`Could not find Chat Room page UID for "${pageName}"`);
      }

      // 🎯 Smart placement logic
      const placement = findTopmostDateBannerPosition(pageUid);
      log(
        `📍 Placement strategy: ${placement.strategy}, order: ${placement.order}`,
        "INFO"
      );

      // Build banner content
      const todaysDate = getTodaysRoamDate();
      const dayName = getTodaysDayName();
      const bannerContent = `#st0 #clr-wht-act [[${todaysDate}]]  -  ${dayName}`;

      // 🎯 Create the banner block with smart placement
      await window.roamAlphaAPI.data.block.create({
        location: {
          "parent-uid": pageUid,
          order: placement.order, // This will push existing banners down when placing "before"
        },
        block: { string: bannerContent },
      });

      log(`✅ Banner created with order: ${placement.order}`, "SUCCESS");

      // Find and focus on new block
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newBannerUid = window.roamAlphaAPI.data.q(`
        [:find ?uid .
         :where 
         [?parent :block/uid "${pageUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?uid]
         [?child :block/string "${bannerContent}"]]
      `);

      if (newBannerUid) {
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": newBannerUid, order: 0 },
          block: { string: "" },
        });

        // Focus cursor
        await new Promise((resolve) => setTimeout(resolve, 200));
        const childUid = window.roamAlphaAPI.data.q(`
          [:find ?uid .
           :where 
           [?parent :block/uid "${newBannerUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]]
        `);

        if (childUid) {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: { "block-uid": childUid, "window-id": "main-window" },
          });
        }
      }

      log("Daily banner created successfully with smart placement", "SUCCESS");
      return true;
    } catch (error) {
      log(`Error in createChatRoomEntry: ${error.message}`, "ERROR");
      throw error;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎯 BUTTON MANAGEMENT - Extension 1.6 Integration
  // ═══════════════════════════════════════════════════════════════

  // 🌟 Initialize button management with Extension 1.6
  const initializeButtonManagement = async () => {
    try {
      log(
        "🎯 Journal Entry Creator: Initializing Simple Button Utility 2.0...",
        "INFO"
      );

      // Check dependency availability
      if (!checkButtonUtilityDependency()) {
        log(
          "❌ Simple Button Utility 2.0 not available - NO BUTTONS will be created",
          "WARN"
        );
        log("💡 Please load Simple Button Utility 2.0 first", "WARN");
        return {
          success: false,
          reason: "Simple Button Utility 2.0 not available",
        };
      }

      // Wait for Simple Button Utility 2.0 to be ready
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        try {
          // Create button manager
          buttonManager = new window.SimpleExtensionButtonManager(
            "JournalEntryCreator"
          );
          await buttonManager.initialize();
          break;
        } catch (error) {
          retries++;
          log(
            `⏳ Simple Button Utility 2.0 not ready, retrying... (${retries}/${maxRetries})`,
            "DEBUG"
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (retries >= maxRetries) {
        log(
          "❌ Failed to initialize Simple Button Utility 2.0 after 10 retries",
          "ERROR"
        );
        return {
          success: false,
          reason: "Simple Button Utility 2.0 initialization timeout",
        };
      }

      // 🎯 EXACT STYLING: Warm yellow gradient with elegant brown border
      const buttonStyle = {
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)", // Softer warm yellow
        border: "1.5px solid #8b4513", // Elegant brown border
        color: "#78716c", // Muted brown text
        fontWeight: "600",
        padding: "10px 16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
      };

      // 🌟 Register Username Page Journal Entry Button
      const usernameButtonResult = await buttonManager.registerButton({
        id: "journal-entry-button",
        text: "✏️ Add journal entry for today?",
        stack: "top-right", // Position at top-right as requested
        priority: false, // Play nice with other extensions
        style: buttonStyle,
        condition: () => {
          // Custom condition function - only show if username page AND no entry exists today
          const context = detectPageContext();
          return (
            context.type === "username" &&
            shouldShowUsernameButton(context.page)
          );
        },
        onClick: async () => {
          try {
            const context = detectPageContext();
            await createUsernameEntry(context.page);
            buttonManager.registry.rebuildAllButtons();
            log("✅ Journal entry created successfully!", "SUCCESS");
          } catch (error) {
            log(`❌ Failed to create journal entry: ${error.message}`, "ERROR");
          }
        },
      });

      // 🌟 Register Chat Room Banner Button
      const chatRoomButtonResult = await buttonManager.registerButton({
        id: "chat-banner-button",
        text: "📅 Add banner for today?",
        stack: "top-right", // Position at top-right as requested
        priority: false, // Play nice with other extensions
        style: buttonStyle,
        condition: () => {
          // Custom condition function - only show if chat room page AND no banner exists today
          const context = detectPageContext();
          return (
            context.type === "chatroom" &&
            shouldShowChatRoomButton(context.page)
          );
        },
        onClick: async () => {
          try {
            const context = detectPageContext();
            await createChatRoomEntry(context.page);
            buttonManager.registry.rebuildAllButtons();
            log("✅ Daily banner created successfully!", "SUCCESS");
          } catch (error) {
            log(`❌ Failed to create daily banner: ${error.message}`, "ERROR");
          }
        },
      });

      // Report results
      let successCount = 0;
      if (usernameButtonResult.success) {
        log(
          `✅ Journal entry button registered at ${usernameButtonResult.stack}`,
          "SUCCESS"
        );
        successCount++;
      } else {
        log(
          `❌ Failed to register journal entry button: ${usernameButtonResult.error}`,
          "ERROR"
        );
      }

      if (chatRoomButtonResult.success) {
        log(
          `✅ Chat room banner button registered at ${chatRoomButtonResult.stack}`,
          "SUCCESS"
        );
        successCount++;
      } else {
        log(
          `❌ Failed to register chat room banner button: ${chatRoomButtonResult.error}`,
          "ERROR"
        );
      }

      if (successCount > 0) {
        log(
          `🎉 Button management initialized successfully! (${successCount}/2 buttons registered)`,
          "SUCCESS"
        );
        log(
          "🎯 Buttons will appear based on sophisticated conditional logic",
          "INFO"
        );
        return { success: true, registeredButtons: successCount };
      } else {
        log("❌ No buttons were successfully registered", "ERROR");
        return { success: false, reason: "Button registration failed" };
      }
    } catch (error) {
      log(
        `❌ Button management initialization failed: ${error.message}`,
        "ERROR"
      );
      return { success: false, reason: error.message };
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
        "Journal Entry Creator v2.0 - Button Manager Integration loading...",
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
              "Show smart journal entry buttons on username and chat room pages",
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
        getTodaysRoamDate,
        getTodaysDayName,
        findTopmostDateBannerPosition,
        shouldShowUsernameButton,
        shouldShowChatRoomButton,
      };

      if (window.RoamExtensionSuite) {
        window.RoamExtensionSuite.register(
          "journal-entry-creator",
          journalAPI,
          {
            version: "2.0.0-button-manager-integration",
            dependencies: [
              "core-data",
              "extension-1.5",
              "simple-button-utility",
            ],
            description:
              "Smart journal entry creation with Button Manager integration and sophisticated conditional logic",
          }
        );
      }

      // Backward compatibility
      window.journalEntryCreator = journalAPI;

      isInitialized = true;

      // Initialize button management with proper delay
      setTimeout(async () => {
        try {
          const result = await initializeButtonManagement();
          if (result.success) {
            log("🎉 Button management initialized successfully!", "SUCCESS");
          } else {
            log(`⚠️ Button management failed: ${result.reason}`, "WARN");
          }
        } catch (error) {
          log(
            `❌ Failed to initialize button management: ${error.message}`,
            "ERROR"
          );
        }
      }, 2000); // Delay to ensure Extension 1.6 is ready

      log(
        "Journal Entry Creator loaded successfully with Button Manager Integration!",
        "SUCCESS"
      );
      log("🗑️ REMOVED: Ultra-nuclear button system", "INFO");
      log(
        "🎯 NEW: Extension 1.6 (Simple Button Utility 2.0) integration",
        "INFO"
      );
      log("🎨 STYLING: Standardized warm yellow with brown border", "INFO");
      log("✨ CONDITIONAL: Sophisticated logic for button visibility", "INFO");
      log("📍 POSITION: Top-right stack for action buttons", "INFO");
    } catch (error) {
      log(`Error loading Journal Entry Creator: ${error.message}`, "ERROR");
    }
  };

  const onunload = () => {
    try {
      log("Journal Entry Creator unloading...", "INFO");

      // Clean up button management
      if (buttonManager) {
        try {
          buttonManager.cleanup();
          log("✅ Button management cleaned up", "SUCCESS");
        } catch (error) {
          log(`❌ Button manager cleanup error: ${error.message}`, "ERROR");
        }
      }

      isInitialized = false;
      extensionAPI = null;
      buttonManager = null;

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
