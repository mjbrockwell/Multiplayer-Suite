// ===================================================================
// Enhanced Preferences Editor Extension - Professional UX + Font Integration + Surgical Color Auto-Fix
// 🎛️ Fixed save button + immediate font application + 25% larger modal
// 🎯 Three-section layout: Fixed header + Scrollable content + Fixed footer
// 🎨 Professional user experience with real-time feedback
// 🔥 NEW: Surgical Journal Color Auto-Fix Integration
// ===================================================================

const preferencesEditorExtension = (() => {
  // ===================================================================
  // 🎯 STATE MANAGEMENT
  // ===================================================================
  let isInitialized = false;
  let extensionAPI = null;
  let buttonManager = null;
  let currentUser = null;
  let preferencesModal = null;
  let initialPreferences = {}; // Track initial state for change detection

  // ===================================================================
  // 🔧 UTILITY ACCESS - Extension 1.5 Integration
  // ===================================================================
  const getUtility = (utilityName) => {
    if (window.RoamExtensionSuite?.getUtility) {
      return window.RoamExtensionSuite.getUtility(utilityName);
    }
    if (window._extensionRegistry?.utilities?.[utilityName]) {
      return window._extensionRegistry.utilities[utilityName];
    }
    if (window[utilityName]) {
      return window[utilityName];
    }
    return null;
  };

  const log = (message, category = "INFO") => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Preferences Editor ${timestamp}] ${category}: ${message}`);
  };

  // ===================================================================
  // 🔧 DEPENDENCY MANAGEMENT
  // ===================================================================

  // Check if Extension 1.6 (Simple Button Utility 2.0) is available
  const checkButtonUtilityDependency = () => {
    if (!window.SimpleExtensionButtonManager) {
      log(
        "❌ Simple Button Utility 2.0 SimpleExtensionButtonManager not found",
        "WARNING"
      );
      return false;
    }

    if (!window.ButtonConditions) {
      log("❌ Simple Button Utility 2.0 ButtonConditions not found", "WARNING");
      return false;
    }

    log("✅ Simple Button Utility 2.0 properly available", "SUCCESS");
    return true;
  };

  // Check if Configuration Manager is available
  const checkConfigurationManagerDependency = () => {
    const getAllUserPreferences = getUtility("getAllUserPreferences");
    const setUserPreference = getUtility("setUserPreference");

    if (!getAllUserPreferences || !setUserPreference) {
      log("❌ Configuration Manager utilities not found", "WARNING");
      return false;
    }

    log("✅ Configuration Manager utilities available", "SUCCESS");
    return true;
  };

  // ===================================================================
  // 🔍 USER & PAGE DETECTION - Core Intelligence
  // ===================================================================

  const getCurrentUserSafe = () => {
    try {
      if (currentUser) return currentUser;

      // Try multiple methods to get current user
      const getCurrentUser = getUtility("getCurrentUser");
      const getAuthenticatedUser = getUtility("getAuthenticatedUser");

      let user = null;

      if (getCurrentUser) {
        user = getCurrentUser();
        if (user && user.displayName && user.method === "official-api") {
          currentUser = user;
          log(
            `Current user identified via getCurrentUser: ${user.displayName}`
          );
          return user;
        }
      }

      if (getAuthenticatedUser) {
        user = getAuthenticatedUser();
        if (user && user.displayName) {
          currentUser = user;
          log(
            `Current user identified via getAuthenticatedUser: ${user.displayName}`
          );
          return user;
        }
      }

      log("No valid user detected", "WARNING");
      return null;
    } catch (error) {
      log(`Error getting current user: ${error.message}`, "ERROR");
      return null;
    }
  };

  const getPageTitleByUid = (pageUid) => {
    try {
      if (!pageUid) return null;

      const result = window.roamAlphaAPI.q(`
        [:find ?title .
         :where 
         [?page :block/uid "${pageUid}"]
         [?page :node/title ?title]]
      `);

      return result || null;
    } catch (error) {
      log(`Error getting page title by UID: ${error.message}`, "ERROR");
      return null;
    }
  };

  const getCurrentPageTitle = () => {
    try {
      // First try Extension 1.5 utility (but it might return UID instead of title)
      const getCurrentPageTitleUtil = getUtility("getCurrentPageTitle");
      if (getCurrentPageTitleUtil) {
        const result = getCurrentPageTitleUtil();
        // If result looks like a UID (no spaces, short), convert it to title
        if (result && !result.includes(" ") && result.length < 15) {
          const actualTitle = getPageTitleByUid(result);
          if (actualTitle) return actualTitle;
        }
        // Otherwise use as-is (might already be the title)
        if (result && result.includes(" ")) return result;
      }

      // Fallback: Extract UID from URL and convert to title
      const url = window.location.href;
      const match = url.match(/#\/app\/[^\/]+\/page\/(.+)$/);
      if (match) {
        const pageIdentifier = decodeURIComponent(match[1]);

        // If it looks like a UID, convert to title
        if (!pageIdentifier.includes(" ") && pageIdentifier.length < 15) {
          const title = getPageTitleByUid(pageIdentifier);
          if (title) return title;
        }

        // Otherwise return as-is
        return pageIdentifier;
      }

      return null;
    } catch (error) {
      log(`Error getting current page title: ${error.message}`, "ERROR");
      return null;
    }
  };

  const isOnOwnUserPreferencesPage = () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) return false;

      const currentPage = getCurrentPageTitle();
      if (!currentPage) return false;

      // Check if current page matches "{username}/user preferences" exactly
      const expectedPageTitle = `${user.displayName}/user preferences`;
      const isMatch = currentPage === expectedPageTitle;

      if (isMatch) {
        log(
          `✅ User is on their own preferences page: ${currentPage}`,
          "DEBUG"
        );
      } else {
        log(
          `❌ Not on own preferences page. Current: "${currentPage}", Expected: "${expectedPageTitle}"`,
          "DEBUG"
        );
      }

      return isMatch;
    } catch (error) {
      log(
        `Error checking if on own user preferences page: ${error.message}`,
        "ERROR"
      );
      return false;
    }
  };

  // ===================================================================
  // 📊 PREFERENCES DATA MANAGEMENT
  // ===================================================================

  const getCurrentPreferences = async () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) {
        log("No current user for preferences retrieval", "WARNING");
        return {};
      }

      const getAllUserPreferences = getUtility("getAllUserPreferences");
      if (!getAllUserPreferences) {
        log("getAllUserPreferences utility not available", "ERROR");
        return {};
      }

      const preferences = await getAllUserPreferences(user.displayName);
      log(
        `Retrieved ${Object.keys(preferences).length} preferences for ${
          user.displayName
        }`,
        "INFO"
      );

      // Store initial preferences for change detection
      initialPreferences = { ...preferences };

      return preferences;
    } catch (error) {
      log(`Error getting current preferences: ${error.message}`, "ERROR");
      return {};
    }
  };

  const savePreferences = async (updatedPreferences) => {
    try {
      const user = getCurrentUserSafe();
      if (!user) {
        log("No current user for preferences saving", "ERROR");
        return false;
      }

      const setUserPreference = getUtility("setUserPreference");
      if (!setUserPreference) {
        log("setUserPreference utility not available", "ERROR");
        return false;
      }

      let successCount = 0;
      const totalPrefs = Object.keys(updatedPreferences).length;

      for (const [key, value] of Object.entries(updatedPreferences)) {
        try {
          const success = await setUserPreference(user.displayName, key, value);
          if (success) {
            successCount++;
            log(
              `✅ Saved preference: ${key} = ${JSON.stringify(value)}`,
              "INFO"
            );
          } else {
            log(`❌ Failed to save preference: ${key}`, "ERROR");
          }
        } catch (prefError) {
          log(
            `❌ Error saving preference ${key}: ${prefError.message}`,
            "ERROR"
          );
        }
      }

      const allSuccessful = successCount === totalPrefs;
      log(
        `Saved ${successCount}/${totalPrefs} preferences`,
        allSuccessful ? "SUCCESS" : "WARNING"
      );
      return allSuccessful;
    } catch (error) {
      log(`Error saving preferences: ${error.message}`, "ERROR");
      return false;
    }
  };

  // ===================================================================
  // 🎯 SURGICAL COLOR AUTO-FIX FUNCTIONS - Extension 3 Integration
  // ===================================================================

  /**
   * 🔍 Find user's home page UID
   */
  const getUserPageUid = async (username) => {
    try {
      const pageUid = window.roamAlphaAPI.q(`
        [:find ?uid :where [?e :node/title "${username}"] [?e :block/uid ?uid]]
      `)?.[0]?.[0];

      if (pageUid) {
        log(`Found user page: ${username} (${pageUid})`, "DEBUG");
        return pageUid;
      } else {
        log(`User page not found: ${username}`, "WARNING");
        return null;
      }
    } catch (error) {
      log(`Error finding user page for ${username}: ${error.message}`, "ERROR");
      return null;
    }
  };

  /**
   * 🔍 Find "Journal::" block on user's page
   */
  const findJournalBlock = async (pageUid) => {
    try {
      const blocks = window.roamAlphaAPI.q(`
        [:find (pull ?block [:block/uid :block/string])
         :where 
         [?page :block/uid "${pageUid}"]
         [?block :block/page ?page]
         [?block :block/string ?string]
         [(clojure.string/starts-with? ?string "Journal::")]]
      `);

      if (blocks.length === 0) {
        log(
          `No block starting with "Journal::" found on page ${pageUid}`,
          "INFO"
        );
        return null;
      }

      if (blocks.length > 1) {
        log(
          `Multiple blocks starting with "Journal::" found, using first one`,
          "WARNING"
        );
      }

      const journalBlock = blocks[0][0];
      const uid = journalBlock[":block/uid"] || journalBlock.uid;
      const text = journalBlock[":block/string"] || journalBlock.string;

      log(`Found Journal:: block: "${text}" (${uid})`, "DEBUG");
      return uid;
    } catch (error) {
      log(`Error finding Journal:: block: ${error.message}`, "ERROR");
      return null;
    }
  };

  /**
   * 🌳 Get ALL descendant blocks (children, grandchildren, etc.) of a block
   */
  const getAllDescendantBlocks = async (parentUid) => {
    try {
      const descendants = window.roamAlphaAPI.q(`
        [:find (pull ?descendant [:block/uid :block/string])
         :where 
         [?parent :block/uid "${parentUid}"]
         [?descendant :block/parents ?parent]
         [?descendant :block/string ?string]]
      `);

      const result = descendants.map(([block]) => ({
        uid: block[":block/uid"] || block.uid,
        text: block[":block/string"] || block.string,
      }));

      log(`Found ${result.length} descendant blocks of ${parentUid}`, "DEBUG");
      return result;
    } catch (error) {
      log(`Error getting descendant blocks: ${error.message}`, "ERROR");
      return [];
    }
  };

  /**
   * 🌈 Get 3-letter color code from full color name
   */
  const getColorCode = (colorName) => {
    const COLOR_MAPPING = {
      red: "red",
      orange: "orn",
      yellow: "ylo",
      green: "grn",
      blue: "blu",
      violet: "ppl",
      brown: "brn",
      grey: "gry",
      white: "wht",
    };
    return COLOR_MAPPING[colorName] || "blu"; // Default to blue
  };

  /**
   * 🎯 SURGICAL JOURNAL COLOR TAG UPDATER
   * Simple, robust, precise: finds Journal:: block, replaces ALL color tags with current preference
   */
  const surgicalUpdateJournalColorTags = async (username) => {
    try {
      log(`Starting surgical color tag update for ${username}`, "INFO");

      // STEP 1: Get user's current color preference
      const getUserPreferenceBulletproof =
        getUtility("getUserPreferenceBulletproof") ||
        getUtility("getUserPreference");
      if (!getUserPreferenceBulletproof) {
        log("No user preference utility available", "ERROR");
        return { success: false, error: "No preference utility found" };
      }

      const currentColor = await getUserPreferenceBulletproof(
        username,
        "Journal Header Color"
      );
      if (!currentColor) {
        log(`No journal color preference found for ${username}`, "WARNING");
        return { success: false, error: "No color preference found" };
      }

      const currentColorCode = getColorCode(currentColor);
      const newColorTag = `#clr-lgt-${currentColorCode}-act`;
      log(`Target color: ${currentColor} → ${newColorTag}`, "INFO");

      // STEP 2: Get user's page UID
      const userPageUid = await getUserPageUid(username);
      if (!userPageUid) {
        log(`Could not find page for user: ${username}`, "ERROR");
        return { success: false, error: `User page not found: ${username}` };
      }

      // STEP 3: Find "Journal::" block on user's page
      const journalBlockUid = await findJournalBlock(userPageUid);
      if (!journalBlockUid) {
        log(`No "Journal::" block found on ${username}'s page`, "INFO");
        return {
          success: true,
          changed: 0,
          message: "No Journal:: block found",
        };
      }

      log(`Found Journal:: block: ${journalBlockUid}`, "SUCCESS");

      // STEP 4: Get ALL descendant blocks of Journal::
      const descendantBlocks = await getAllDescendantBlocks(journalBlockUid);
      log(
        `Found ${descendantBlocks.length} descendant blocks to check`,
        "INFO"
      );

      // STEP 5: Surgical replacement on each block
      let updatedCount = 0;
      let failedCount = 0;
      const colorTagPattern = /#clr-lgt-\w+-act/g;

      for (const block of descendantBlocks) {
        try {
          // Check if block contains any color tags
          if (colorTagPattern.test(block.text)) {
            // Reset regex lastIndex for next use
            colorTagPattern.lastIndex = 0;

            // Replace ALL color tags with current preference
            const updatedText = block.text.replace(
              colorTagPattern,
              newColorTag
            );

            log(
              `Updating block ${block.uid}: "${block.text}" → "${updatedText}"`,
              "DEBUG"
            );

            await window.roamAlphaAPI.data.block.update({
              block: {
                uid: block.uid,
                string: updatedText,
              },
            });

            updatedCount++;
            log(`Block ${block.uid} updated successfully`, "DEBUG");

            // Small delay to prevent API overload
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        } catch (blockError) {
          log(
            `Failed to update block ${block.uid}: ${blockError.message}`,
            "ERROR"
          );
          failedCount++;
        }
      }

      // STEP 6: Report results
      const summary = `Surgically updated ${updatedCount} blocks (${failedCount} failed)`;
      log(summary, updatedCount > 0 ? "SUCCESS" : "INFO");

      return {
        success: updatedCount > 0 || failedCount === 0,
        changed: updatedCount,
        failed: failedCount,
        total: descendantBlocks.length,
        message: summary,
        targetColor: currentColor,
        targetTag: newColorTag,
      };
    } catch (error) {
      log(`Error during surgical update: ${error.message}`, "ERROR");
      return {
        success: false,
        error: error.message,
        changed: 0,
      };
    }
  };

  // ===================================================================
  // 🎯 BUTTON MANAGEMENT - Extension 1.6 Integration
  // ===================================================================

  const initializeButtonManagement = async () => {
    try {
      log(
        "🎯 Preferences Editor: Initializing Simple Button Utility 2.0...",
        "INFO"
      );

      // Check dependencies
      if (!checkButtonUtilityDependency()) {
        log(
          "❌ Simple Button Utility 2.0 not available - NO BUTTON will be created",
          "WARNING"
        );
        return {
          success: false,
          reason: "Simple Button Utility 2.0 not available",
        };
      }

      if (!checkConfigurationManagerDependency()) {
        log(
          "❌ Configuration Manager not available - NO BUTTON will be created",
          "WARNING"
        );
        return {
          success: false,
          reason: "Configuration Manager not available",
        };
      }

      // Wait for Simple Button Utility 2.0 to be ready
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        try {
          buttonManager = new window.SimpleExtensionButtonManager(
            "PreferencesEditor"
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

      // Consistent styling with Profile Nudges extension
      const buttonStyle = {
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)", // Warm yellow gradient
        border: "1.5px solid #8b4513", // Elegant brown border
        color: "#78716c", // Muted brown text
        fontWeight: "600",
        padding: "10px 16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
      };

      // Register Preferences Editor Button
      const preferencesButtonResult = await buttonManager.registerButton({
        id: "preferences-editor-button",
        text: "🎨  Edit preferences",
        stack: "top-right", // Position at top-right with other action buttons
        priority: false, // Play nice with other extensions
        style: buttonStyle,
        condition: () => {
          // Only show if on own user preferences page
          const shouldShow = isOnOwnUserPreferencesPage();

          if (shouldShow) {
            log(
              "User is on own preferences page - button should show",
              "DEBUG"
            );
          } else {
            log("User not on own preferences page - button hidden", "DEBUG");
          }

          return shouldShow;
        },
        onClick: async () => {
          try {
            await showPreferencesEditModal();
            log("✅ Preferences edit modal opened successfully!", "SUCCESS");
          } catch (error) {
            log(
              `❌ Failed to open preferences edit modal: ${error.message}`,
              "ERROR"
            );
          }
        },
      });

      if (preferencesButtonResult.success) {
        log(
          `✅ Preferences editor button registered at ${preferencesButtonResult.stack}`,
          "SUCCESS"
        );
        log(
          "🎯 Button will appear when user is on their own preferences page",
          "INFO"
        );
        return { success: true, registeredButtons: 1 };
      } else {
        log(
          `❌ Failed to register preferences editor button: ${preferencesButtonResult.error}`,
          "ERROR"
        );
        return { success: false, reason: preferencesButtonResult.error };
      }
    } catch (error) {
      log(
        `❌ Button management initialization failed: ${error.message}`,
        "ERROR"
      );
      return { success: false, reason: error.message };
    }
  };

  // ===================================================================
  // 🎨 UI COMPONENTS - Enhanced Modal with Fixed Layout
  // ===================================================================

  const showPreferencesEditModal = async () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) {
        log("No current user for preferences modal", "ERROR");
        return;
      }

      const modalUtilities = getUtility("modalUtilities");
      if (!modalUtilities) {
        log("Modal utilities not available", "ERROR");
        return;
      }

      // Get current preferences
      const currentPreferences = await getCurrentPreferences();

      // Create modal with enhanced sizing (25% larger)
      preferencesModal = modalUtilities.createModal("preferences-edit-modal", {
        closeOnEscape: true,
        closeOnBackdrop: true,
      });

      const modalContent = modalUtilities.createModalContent({
        width: "95%",
        maxWidth: "900px",
        height: "75vh", // Increased from ~60vh (25% larger)
        maxHeight: "800px", // Increased accordingly
      });

      // 🚨 CRITICAL: Three-section layout with flexbox
      modalContent.style.cssText = `
        width: 95%;
        max-width: 900px;
        height: 75vh;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        background: white;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      `;

      // ===================================================================
      // 📱 FIXED HEADER SECTION
      // ===================================================================
      const header = document.createElement("div");
      header.style.cssText = `
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 24px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
      `;

      const headerContent = document.createElement("div");
      headerContent.innerHTML = `
        <h2 style="margin: 0; font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 12px;">
          🎨  Edit Your Preferences
        </h2>
        <div style="margin-top: 6px; font-size: 16px; opacity: 0.9;">
          Customize your Roam experience
        </div>
      `;

      const closeModalButton = document.createElement("button");
      closeModalButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      `;
      closeModalButton.textContent = "×";
      closeModalButton.addEventListener("click", () => {
        if (preferencesModal) {
          preferencesModal.remove();
          preferencesModal = null;
        }
      });

      closeModalButton.addEventListener("mouseenter", () => {
        closeModalButton.style.background = "rgba(255, 255, 255, 0.3)";
        closeModalButton.style.transform = "scale(1.1)";
      });

      closeModalButton.addEventListener("mouseleave", () => {
        closeModalButton.style.background = "rgba(255, 255, 255, 0.2)";
        closeModalButton.style.transform = "scale(1)";
      });

      header.appendChild(headerContent);
      header.appendChild(closeModalButton);

      // ===================================================================
      // 📜 SCROLLABLE CONTENT SECTION
      // ===================================================================
      const scrollableContent = document.createElement("div");
      scrollableContent.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 32px;
        background: white;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      `;

      // Add webkit scrollbar styling for better visibility
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.textContent = `
        .preferences-scrollable-content::-webkit-scrollbar {
          width: 8px;
        }
        .preferences-scrollable-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .preferences-scrollable-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .preferences-scrollable-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      document.head.appendChild(scrollbarStyle);
      scrollableContent.classList.add("preferences-scrollable-content");

      // Create form fields container
      const fieldsContainer = document.createElement("div");
      fieldsContainer.style.cssText =
        "display: flex; flex-direction: column; gap: 24px;";

      // Field 1: Loading Page Preference (combo dropdown + text)
      const loadingPageField = createLoadingPageField(
        currentPreferences["Loading Page Preference"],
        user.displayName
      );
      fieldsContainer.appendChild(loadingPageField);

      // Field 2: Immutable Home Page (yes/no)
      const immutableHomeField = createYesNoField(
        "Immutable Home Page",
        `Protect your home page from edits by others (allows "command key" comments, but no other edits)`,
        currentPreferences["Immutable Home Page"]
      );
      fieldsContainer.appendChild(immutableHomeField);

      // Field 3: Weekly Bundle (yes/no)
      const weeklyBundleField = createYesNoField(
        "Weekly Bundle",
        "Show weekly summary in journal entries",
        currentPreferences["Weekly Bundle"]
      );
      fieldsContainer.appendChild(weeklyBundleField);

      // Field 4: Journal Header Color
      const journalColorField = createColorField(
        "Journal Header Color",
        "Color for journal entry headers",
        currentPreferences["Journal Header Color"]
      );
      fieldsContainer.appendChild(journalColorField);

      // Field 5: Graph Display Font
      const fontField = createFontField(
        "Graph Display Font",
        "Font family for graph display and interface elements",
        currentPreferences["Graph Display Font"]
      );
      fieldsContainer.appendChild(fontField);

      // Field 6: Personal Shortcuts (readonly message)
      const shortcutsField = createPersonalShortcutsField();
      fieldsContainer.appendChild(shortcutsField);

      scrollableContent.appendChild(fieldsContainer);

      // ===================================================================
      // 🔒 FIXED FOOTER SECTION - ALWAYS VISIBLE SAVE BUTTON
      // ===================================================================
      const footer = document.createElement("div");
      footer.style.cssText = `
        background: white;
        padding: 24px 32px;
        border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
      `;

      const saveButton = document.createElement("button");
      saveButton.textContent = "💾 Save Changes";
      saveButton.style.cssText = `
        width: 100%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 16px 24px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      `;

      saveButton.addEventListener("mouseenter", () => {
        saveButton.style.transform = "translateY(-1px)";
        saveButton.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
      });

      saveButton.addEventListener("mouseleave", () => {
        saveButton.style.transform = "translateY(0)";
        saveButton.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
      });

      saveButton.addEventListener("click", async () => {
        await handleSavePreferences();
      });

      footer.appendChild(saveButton);

      // ===================================================================
      // 🏗️ ASSEMBLE MODAL - Three-section layout
      // ===================================================================
      modalContent.appendChild(header);
      modalContent.appendChild(scrollableContent);
      modalContent.appendChild(footer);
      preferencesModal.appendChild(modalContent);

      document.body.appendChild(preferencesModal);

      log(
        "Enhanced preferences edit modal created with fixed footer",
        "SUCCESS"
      );
    } catch (error) {
      log(`Error showing preferences edit modal: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 🎨 FIELD CREATION HELPERS (Same as before, keeping existing functionality)
  // ===================================================================

  const createFieldContainer = (label, description) => {
    const fieldDiv = document.createElement("div");
    fieldDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-weight: 600;
      color: #374151;
      font-size: 16px;
    `;

    const descElement = document.createElement("div");
    descElement.textContent = description;
    descElement.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    `;

    fieldDiv.appendChild(labelElement);
    fieldDiv.appendChild(descElement);

    return fieldDiv;
  };

  const createLoadingPageField = (currentValue, username) => {
    const fieldDiv = createFieldContainer(
      "Loading Page Preference",
      "Page to navigate to when opening Roam"
    );

    const container = document.createElement("div");
    container.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    // Dropdown
    const select = document.createElement("select");
    select.setAttribute("data-field", "Loading Page Preference");
    select.style.cssText = `
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;
    `;

    const options = [
      { value: "Daily Page", text: "Daily Page" },
      { value: username, text: username },
      { value: "Other", text: "Other" },
    ];
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      select.appendChild(optionElement);
    });

    // Text input (for "Other" option) - with pale yellow background
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = "Enter custom page name...";
    textInput.style.cssText = `
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      background: #fefce8;
      display: none;
    `;

    // Set initial values
    if (currentValue === "Daily Page" || currentValue === username) {
      select.value = currentValue;
    } else if (currentValue) {
      select.value = "Other";
      textInput.value = currentValue;
      textInput.style.display = "block";
    } else {
      select.value = "Daily Page"; // Default
    }

    // Handle dropdown changes
    select.addEventListener("change", () => {
      if (select.value === "Other") {
        textInput.style.display = "block";
        textInput.focus();
      } else {
        textInput.style.display = "none";
        textInput.value = "";
      }
    });

    container.appendChild(select);
    container.appendChild(textInput);
    fieldDiv.appendChild(container);

    return fieldDiv;
  };

  const createYesNoField = (label, description, currentValue) => {
    const fieldDiv = createFieldContainer(label, description);

    const select = document.createElement("select");
    select.setAttribute("data-field", label);
    select.style.cssText = `
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;
    `;

    ["yes", "no"].forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });

    // Set current value
    if (currentValue) {
      select.value = currentValue;
    }

    fieldDiv.appendChild(select);
    return fieldDiv;
  };

  const createColorField = (label, description, currentValue) => {
    const fieldDiv = createFieldContainer(label, description);

    const select = document.createElement("select");
    select.setAttribute("data-field", label);
    select.style.cssText = `
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;
    `;

    const colors = [
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
      "brown",
      "grey",
      "white",
    ];
    colors.forEach((color) => {
      const optionElement = document.createElement("option");
      optionElement.value = color;
      optionElement.textContent = color;
      select.appendChild(optionElement);
    });

    // Set current value
    if (currentValue && colors.includes(currentValue)) {
      select.value = currentValue;
    }

    fieldDiv.appendChild(select);
    return fieldDiv;
  };

  const createFontField = (label, description, currentValue) => {
    const fieldDiv = createFieldContainer(label, description);

    // Smart font list with system vs web font detection - EXPANDED!
    const fonts = [
      { name: "Noto Sans", type: "system", fallback: "sans-serif" },
      { name: "Georgia", type: "system", fallback: "serif" },
      {
        name: "Merriweather",
        type: "webfont",
        fallback: "serif",
        source: "google",
      },
      {
        name: "Crimson Text",
        type: "webfont",
        fallback: "serif",
        source: "google",
      },
      { name: "Lora", type: "webfont", fallback: "serif", source: "google" },
      {
        name: "Playfair Display",
        type: "webfont",
        fallback: "serif",
        source: "google",
      },
      {
        name: "Source Serif Pro",
        type: "webfont",
        fallback: "serif",
        source: "google",
      },
      { name: "Avenir", type: "system", fallback: "sans-serif" },
      {
        name: "Roboto",
        type: "webfont",
        fallback: "sans-serif",
        source: "google",
      },
      {
        name: "Inter",
        type: "webfont",
        fallback: "sans-serif",
        source: "google",
      },
    ];

    // Regular select dropdown
    const select = document.createElement("select");
    select.setAttribute("data-field", label);
    select.style.cssText = `
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;
      width: 100%;
      margin-bottom: 12px;
    `;

    fonts.forEach((font) => {
      const optionElement = document.createElement("option");
      optionElement.value = font.name;
      optionElement.textContent = `${font.name}${
        font.type === "webfont" ? " (Web Font)" : ""
      }`;
      select.appendChild(optionElement);
    });

    // Set current value
    const initialFont =
      currentValue && fonts.find((f) => f.name === currentValue)
        ? currentValue
        : fonts[0].name;
    select.value = initialFont;

    // Web font loader function
    const loadWebFont = (fontName, source) => {
      return new Promise((resolve) => {
        if (source === "google") {
          // Check if already loaded
          const existingLink = document.querySelector(
            `link[href*="${fontName.replace(/\s+/g, "+")}"]`
          );
          if (existingLink) {
            resolve(true);
            return;
          }

          // Load from Google Fonts
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
            /\s+/g,
            "+"
          )}:ital,wght@0,400;0,700;1,400&display=swap`;

          link.onload = () => {
            log(`✅ Web font loaded: ${fontName}`, "SUCCESS");
            resolve(true);
          };

          link.onerror = () => {
            log(`❌ Failed to load web font: ${fontName}`, "ERROR");
            resolve(false);
          };

          document.head.appendChild(link);

          // Timeout fallback
          setTimeout(() => resolve(false), 3000);
        } else {
          resolve(true); // System fonts don't need loading
        }
      });
    };

    // Font availability checker
    const checkFontAvailability = (fontName) => {
      // Create a test element to check if font loads
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Test with a fallback font first
      context.font = "16px Arial";
      const fallbackWidth = context.measureText("Test Font").width;

      // Test with the target font
      context.font = `16px ${fontName}, Arial`;
      const testWidth = context.measureText("Test Font").width;

      // If widths differ, font is available
      return testWidth !== fallbackWidth;
    };

    // Font preview area
    const previewContainer = document.createElement("div");
    previewContainer.style.cssText = `
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: #f9fafb;
      margin-top: 8px;
    `;

    const previewLabel = document.createElement("div");
    previewLabel.textContent = "Font Preview:";
    previewLabel.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 600;
    `;

    const previewText = document.createElement("div");
    previewText.style.cssText = `
      font-size: 18px;
      line-height: 1.5;
      color: #374151;
    `;

    const updatePreview = async (fontName) => {
      const font = fonts.find((f) => f.name === fontName);
      if (!font) return;

      // Show loading state
      previewText.innerHTML =
        '<div style="color: #6b7280; font-style: italic;">Loading font preview...</div>';

      // Load web font if needed
      if (font.type === "webfont") {
        const loaded = await loadWebFont(font.name, font.source);
        if (!loaded) {
          previewText.innerHTML = `
            <div style="color: #ef4444; font-weight: 600;">⚠️ ${font.name} could not be loaded</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">
              This font may not display correctly when applied. Try selecting a different font.
            </div>
          `;
          return;
        }

        // Wait a bit for font to register
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Check if font is actually available
      const isAvailable =
        font.type === "system" || checkFontAvailability(font.name);

      if (!isAvailable && font.type === "webfont") {
        previewText.innerHTML = `
          <div style="color: #f59e0b; font-weight: 600;">⚠️ ${font.name} may not be fully loaded</div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">
            Preview may not reflect actual appearance. Font should work when applied.
          </div>
        `;
        return;
      }

      // Create preview with proper font stack
      previewText.innerHTML = "";
      const fontStack =
        font.type === "system"
          ? `${font.name}, ${font.fallback}`
          : `"${font.name}", ${font.fallback}`;

      // First line - normal text
      const normalDiv = document.createElement("div");
      normalDiv.textContent = "The quick brown fox jumps over the lazy dog";
      normalDiv.style.cssText = `
        all: unset !important;
        font-family: ${fontStack} !important;
        font-size: 16px !important;
        font-weight: normal !important;
        font-style: normal !important;
        line-height: 1.4 !important;
        color: #374151 !important;
        margin: 0 0 8px 0 !important;
        padding: 0 !important;
        display: block !important;
      `;

      // Second line - bold text
      const boldDiv = document.createElement("div");
      boldDiv.textContent = `Bold text looks like this in ${font.name}`;
      boldDiv.style.cssText = `
        all: unset !important;
        font-family: ${fontStack} !important;
        font-size: 16px !important;
        font-weight: bold !important;
        font-style: normal !important;
        line-height: 1.4 !important;
        color: #374151 !important;
        margin: 0 0 8px 0 !important;
        padding: 0 !important;
        display: block !important;
      `;

      // Third line - italic text
      const italicDiv = document.createElement("div");
      italicDiv.textContent = "Italic text in this beautiful font";
      italicDiv.style.cssText = `
        all: unset !important;
        font-family: ${fontStack} !important;
        font-size: 16px !important;
        font-weight: normal !important;
        font-style: italic !important;
        line-height: 1.4 !important;
        color: #374151 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
      `;

      previewText.appendChild(normalDiv);
      previewText.appendChild(boldDiv);
      previewText.appendChild(italicDiv);

      // Add font info
      const infoDiv = document.createElement("div");
      infoDiv.style.cssText = `
        margin-top: 12px;
        padding: 8px 12px;
        background: ${font.type === "webfont" ? "#dbeafe" : "#f3f4f6"};
        border-radius: 6px;
        font-size: 12px;
        color: #6b7280;
      `;
      infoDiv.textContent =
        font.type === "webfont"
          ? `✅ Web font loaded from ${font.source}`
          : `✅ System font available`;
      previewText.appendChild(infoDiv);
    };

    // Initial preview
    updatePreview(initialFont);

    // Update preview when selection changes
    select.addEventListener("change", () => {
      updatePreview(select.value);
    });

    previewContainer.appendChild(previewLabel);
    previewContainer.appendChild(previewText);

    fieldDiv.appendChild(select);
    fieldDiv.appendChild(previewContainer);

    return fieldDiv;
  };

  const createPersonalShortcutsField = () => {
    const fieldDiv = createFieldContainer(
      "Personal Shortcuts",
      "Personal navigation shortcuts"
    );

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      padding: 16px;
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      color: #6b7280;
      font-style: italic;
    `;
    messageDiv.textContent =
      "Use the personal shortcuts window at lower left corner of screen to edit personal shortcuts";

    fieldDiv.appendChild(messageDiv);
    return fieldDiv;
  };

  // ===================================================================
  // 🎯 FONT INTEGRATION - Extension 3 Integration
  // ===================================================================

  const checkFontPreferenceChange = (updatedPreferences) => {
    const initialFont = initialPreferences["Graph Display Font"];
    const newFont = updatedPreferences["Graph Display Font"];

    log(
      `Font change check: Initial="${initialFont}", New="${newFont}"`,
      "DEBUG"
    );

    return initialFont !== newFont && newFont;
  };

  // ===================================================================
  // 🎯 JOURNAL COLOR CHANGE DETECTION - New Integration
  // ===================================================================

  const checkJournalColorPreferenceChange = (updatedPreferences) => {
    const initialColor = initialPreferences["Journal Header Color"];
    const newColor = updatedPreferences["Journal Header Color"];

    log(
      `Journal color change check: Initial="${initialColor}", New="${newColor}"`,
      "DEBUG"
    );

    return initialColor !== newColor && newColor;
  };

  const applyFontChange = async (newFont, username) => {
    try {
      log(`🔤 Attempting to apply font change to: ${newFont}`, "INFO");

      // Access Extension 3's font service through platform registry
      const platform = window.RoamExtensionSuite;

      if (!platform) {
        log("❌ RoamExtensionSuite platform not available", "ERROR");
        return { success: false, error: "Platform not available" };
      }

      // Get font info for proper handling - EXPANDED FONT LIST!
      const fontList = [
        { name: "Noto Sans", type: "system", fallback: "sans-serif" },
        { name: "Georgia", type: "system", fallback: "serif" },
        {
          name: "Merriweather",
          type: "webfont",
          fallback: "serif",
          source: "google",
        },
        {
          name: "Crimson Text",
          type: "webfont",
          fallback: "serif",
          source: "google",
        },
        { name: "Lora", type: "webfont", fallback: "serif", source: "google" },
        {
          name: "Playfair Display",
          type: "webfont",
          fallback: "serif",
          source: "google",
        },
        {
          name: "Source Serif Pro",
          type: "webfont",
          fallback: "serif",
          source: "google",
        },
        { name: "Avenir", type: "system", fallback: "sans-serif" },
        {
          name: "Roboto",
          type: "webfont",
          fallback: "sans-serif",
          source: "google",
        },
        {
          name: "Inter",
          type: "webfont",
          fallback: "sans-serif",
          source: "google",
        },
      ];

      const fontInfo = fontList.find((f) => f.name === newFont);

      // If it's a web font, ensure it's loaded first
      if (fontInfo && fontInfo.type === "webfont") {
        log(`📥 Loading web font before application: ${newFont}`, "INFO");

        const loadWebFont = (fontName, source) => {
          return new Promise((resolve) => {
            if (source === "google") {
              const existingLink = document.querySelector(
                `link[href*="${fontName.replace(/\s+/g, "+")}"]`
              );
              if (existingLink) {
                resolve(true);
                return;
              }

              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
                /\s+/g,
                "+"
              )}:ital,wght@0,400;0,700;1,400&display=swap`;

              link.onload = () => resolve(true);
              link.onerror = () => resolve(false);

              document.head.appendChild(link);
              setTimeout(() => resolve(false), 3000);
            } else {
              resolve(true);
            }
          });
        };

        const webFontLoaded = await loadWebFont(fontInfo.name, fontInfo.source);
        if (!webFontLoaded) {
          log(
            `⚠️ Web font loading failed, continuing anyway: ${newFont}`,
            "WARNING"
          );
        }
      }

      const applyUserFont = platform.getUtility("applyUserFont");

      if (!applyUserFont) {
        log("❌ applyUserFont utility not found in platform", "ERROR");
        return { success: false, error: "Font utility not available" };
      }

      // Apply the font using Extension 3's service
      const result = await applyUserFont(username);

      if (result && result.success) {
        log(
          `✅ Font successfully applied: ${result.font || newFont}`,
          "SUCCESS"
        );
        return { success: true, font: result.font || newFont };
      } else {
        log(
          `❌ Font application failed: ${result?.error || "Unknown error"}`,
          "ERROR"
        );
        return {
          success: false,
          error: result?.error || "Font application failed",
        };
      }
    } catch (error) {
      log(`❌ Error in font application: ${error.message}`, "ERROR");
      return { success: false, error: error.message };
    }
  };

  const showUserFeedback = (message, type = "success") => {
    // Create temporary feedback overlay
    const feedback = document.createElement("div");
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      ${
        type === "success"
          ? "background: linear-gradient(135deg, #10b981, #059669); color: white;"
          : "background: linear-gradient(135deg, #ef4444, #dc2626); color: white;"
      }
    `;

    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Animate in
    setTimeout(() => {
      feedback.style.transform = "translateX(0)";
      feedback.style.opacity = "1";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      feedback.style.transform = "translateX(100%)";
      feedback.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(feedback)) {
          document.body.removeChild(feedback);
        }
      }, 300);
    }, 3000);
  };

  // ===================================================================
  // 💾 ENHANCED SAVE PREFERENCES HANDLER - With Font + Surgical Color Integration
  // ===================================================================

  const handleSavePreferences = async () => {
    try {
      // Disable save button and show loading state
      const saveButton = preferencesModal.querySelector("button");
      const originalText = saveButton.textContent;
      saveButton.disabled = true;
      saveButton.textContent = "💾 Saving...";
      saveButton.style.opacity = "0.7";
      saveButton.style.cursor = "not-allowed";

      const formElements = preferencesModal.querySelectorAll("select, input");
      const updatedPreferences = {};

      formElements.forEach((element) => {
        const fieldName = element.getAttribute("data-field");
        if (fieldName) {
          if (fieldName === "Loading Page Preference") {
            // Special handling for loading page preference
            const dropdown = preferencesModal.querySelector(
              `select[data-field="${fieldName}"]`
            );
            const textInput =
              preferencesModal.querySelector(`input[type="text"]`);

            if (dropdown.value === "Other" && textInput.value.trim()) {
              updatedPreferences[fieldName] = textInput.value.trim();
            } else if (dropdown.value !== "Other") {
              updatedPreferences[fieldName] = dropdown.value;
            }
          } else {
            // Regular field handling
            const value = element.value.trim();
            if (value) {
              updatedPreferences[fieldName] = value;
            }
          }
        }
      });

      log(
        `Saving ${Object.keys(updatedPreferences).length} preferences...`,
        "INFO"
      );

      // 1. Save preferences to user's preference page
      const saveSuccess = await savePreferences(updatedPreferences);

      if (!saveSuccess) {
        log("❌ Some preferences failed to save", "ERROR");
        showUserFeedback("❌ Failed to save some preferences", "error");
        return;
      }

      log("✅ All preferences saved successfully!", "SUCCESS");

      // 2. Check if font preference changed and apply immediately
      const fontChanged = checkFontPreferenceChange(updatedPreferences);

      if (fontChanged) {
        log("🔤 Font preference changed, applying immediately...", "INFO");

        const user = getCurrentUserSafe();
        const fontResult = await applyFontChange(fontChanged, user.displayName);

        if (fontResult.success) {
          showUserFeedback(`✅ Font changed to ${fontResult.font}!`, "success");
          log(`✅ Font successfully applied: ${fontResult.font}`, "SUCCESS");
        } else {
          showUserFeedback(
            `❌ Font change failed: ${fontResult.error}`,
            "error"
          );
          log(`❌ Font application failed: ${fontResult.error}`, "ERROR");
        }
      }

      // 3. 🎯 SURGICAL COLOR AUTO-FIX - New Integration!
      const journalColorChanged =
        checkJournalColorPreferenceChange(updatedPreferences);

      if (journalColorChanged) {
        log(
          "🎨 Journal color preference changed, running surgical auto-fix...",
          "INFO"
        );

        const user = getCurrentUserSafe();
        try {
          const surgicalResult = await surgicalUpdateJournalColorTags(
            user.displayName
          );

          if (surgicalResult.success) {
            if (surgicalResult.changed > 0) {
              const message = `✅ Updated ${surgicalResult.changed} journal entries to ${surgicalResult.targetColor}!`;
              showUserFeedback(message, "success");
              log(
                `Surgical auto-fix completed: ${surgicalResult.message}`,
                "SUCCESS"
              );
              log(
                `Target: ${surgicalResult.targetColor} (${surgicalResult.targetTag})`,
                "INFO"
              );
            } else {
              log(
                "No color tags found in Journal:: block - nothing to update",
                "INFO"
              );
            }
          } else {
            log(
              `Surgical auto-fix info: ${
                surgicalResult.message || surgicalResult.error
              }`,
              "INFO"
            );
          }
        } catch (surgicalError) {
          log(
            `Surgical color update warning: ${surgicalError.message}`,
            "WARNING"
          );
          log(
            "Color preference saved successfully, but auto-fix failed",
            "WARNING"
          );
        }
      }

      // 4. Show overall success message (if not already shown by specific changes)
      if (!fontChanged && !journalColorChanged) {
        showUserFeedback("✅ Preferences saved successfully!", "success");
      }

      // 5. Close modal after brief delay
      setTimeout(() => {
        if (preferencesModal) {
          preferencesModal.remove();
          preferencesModal = null;
        }

        // Trigger button condition re-evaluation
        if (buttonManager && buttonManager.registry) {
          buttonManager.registry.rebuildAllButtons();
          log("🔄 Triggered button condition re-evaluation", "INFO");
        }
      }, 1500);
    } catch (error) {
      log(`Error saving preferences: ${error.message}`, "ERROR");
      showUserFeedback(`❌ Error: ${error.message}`, "error");
    } finally {
      // Re-enable save button
      const saveButton = preferencesModal?.querySelector("button");
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "💾 Save Changes";
        saveButton.style.opacity = "1";
        saveButton.style.cursor = "pointer";
      }
    }
  };

  // ===================================================================
  // 🎛️ EXTENSION LIFECYCLE
  // ===================================================================

  const onload = ({ extensionAPI: api }) => {
    try {
      log("Enhanced Preferences Editor Extension loading...", "SUCCESS");

      extensionAPI = api;

      // Check for required dependencies
      const requiredUtilities = [
        "getCurrentUser",
        "modalUtilities",
        "getAllUserPreferences",
        "setUserPreference",
      ];

      const missingUtilities = requiredUtilities.filter(
        (util) => !getUtility(util)
      );

      if (missingUtilities.length > 0) {
        log(
          `Missing required utilities: ${missingUtilities.join(", ")}`,
          "ERROR"
        );
        log(
          "Please ensure Extension 1.5 and Configuration Manager are loaded first",
          "ERROR"
        );
        return;
      }

      // Create settings panel
      if (extensionAPI.settings) {
        extensionAPI.settings.panel.create({
          tabTitle: "Preferences Editor",
          settings: [
            {
              id: "enablePreferencesEditor",
              name: "Enable Preferences Editor",
              description:
                "Show enhanced preferences editor button on your preferences page",
              action: { type: "switch" },
            },
          ],
        });
      }

      // Export public API with surgical functions
      window.preferencesEditor = {
        showPreferencesEditModal,
        getCurrentPreferences,
        isOnOwnUserPreferencesPage,
        initializeButtonManagement,

        // 🎯 Surgical Color Functions - New Exports!
        surgicalUpdateJournalColorTags,
        getUserPageUid,
        findJournalBlock,
        getAllDescendantBlocks,
        getColorCode,

        debug: {
          testButtonCondition: isOnOwnUserPreferencesPage,
          getCurrentUser: getCurrentUserSafe,
          getCurrentPage: getCurrentPageTitle,
          checkFontIntegration: () => {
            const platform = window.RoamExtensionSuite;
            const applyUserFont = platform?.getUtility("applyUserFont");
            return { platform: !!platform, applyUserFont: !!applyUserFont };
          },

          // 🎯 New surgical debugging functions
          testSurgicalColorUpdate: async (username) => {
            const user = getCurrentUserSafe();
            const testUsername = username || user?.displayName;
            if (!testUsername)
              return { error: "No username provided or detected" };

            try {
              const result = await surgicalUpdateJournalColorTags(testUsername);
              return result;
            } catch (error) {
              return { error: error.message };
            }
          },

          checkJournalBlock: async (username) => {
            const user = getCurrentUserSafe();
            const testUsername = username || user?.displayName;
            if (!testUsername)
              return { error: "No username provided or detected" };

            try {
              const pageUid = await getUserPageUid(testUsername);
              if (!pageUid) return { error: "User page not found" };

              const journalUid = await findJournalBlock(pageUid);
              if (!journalUid) return { error: "No Journal:: block found" };

              const descendants = await getAllDescendantBlocks(journalUid);
              return {
                userPage: pageUid,
                journalBlock: journalUid,
                descendants: descendants.length,
                hasColorTags: descendants.some((b) =>
                  /#clr-lgt-\w+-act/.test(b.text)
                ),
              };
            } catch (error) {
              return { error: error.message };
            }
          },

          testFontLoading: async (fontName) => {
            const fontList = [
              { name: "Noto Sans", type: "system", fallback: "sans-serif" },
              { name: "Georgia", type: "system", fallback: "serif" },
              {
                name: "Merriweather",
                type: "webfont",
                fallback: "serif",
                source: "google",
              },
              {
                name: "Crimson Text",
                type: "webfont",
                fallback: "serif",
                source: "google",
              },
              {
                name: "Lora",
                type: "webfont",
                fallback: "serif",
                source: "google",
              },
              {
                name: "Playfair Display",
                type: "webfont",
                fallback: "serif",
                source: "google",
              },
              {
                name: "Source Serif Pro",
                type: "webfont",
                fallback: "serif",
                source: "google",
              },
              { name: "Avenir", type: "system", fallback: "sans-serif" },
              {
                name: "Roboto",
                type: "webfont",
                fallback: "sans-serif",
                source: "google",
              },
              {
                name: "Inter",
                type: "webfont",
                fallback: "sans-serif",
                source: "google",
              },
            ];

            const fontInfo = fontList.find((f) => f.name === fontName);
            if (!fontInfo) return { error: "Font not in list" };

            if (fontInfo.type === "system")
              return { available: true, type: "system" };

            // Test web font loading
            try {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
                /\s+/g,
                "+"
              )}:ital,wght@0,400;0,700;1,400&display=swap`;

              return new Promise((resolve) => {
                link.onload = () =>
                  resolve({ available: true, type: "webfont", loaded: true });
                link.onerror = () =>
                  resolve({ available: false, type: "webfont", loaded: false });
                document.head.appendChild(link);
                setTimeout(
                  () =>
                    resolve({
                      available: false,
                      type: "webfont",
                      timeout: true,
                    }),
                  3000
                );
              });
            } catch (error) {
              return { error: error.message };
            }
          },
        },
      };

      isInitialized = true;

      // Initialize button management with delay
      setTimeout(async () => {
        const editorEnabled = extensionAPI.settings?.get(
          "enablePreferencesEditor"
        );
        if (editorEnabled !== false) {
          try {
            log(
              "Starting enhanced preferences editor button management...",
              "INFO"
            );
            const result = await initializeButtonManagement();
            if (result.success) {
              log(
                "🎉 Enhanced preferences editor button management initialized successfully!",
                "SUCCESS"
              );
            } else {
              log(
                `⚠️ Enhanced preferences editor button management failed: ${result.reason}`,
                "WARNING"
              );
            }
          } catch (error) {
            log(
              `❌ Failed to initialize enhanced preferences editor button management: ${error.message}`,
              "ERROR"
            );
          }
        }
      }, 2000);

      log(
        "Enhanced Preferences Editor Extension loaded successfully!",
        "SUCCESS"
      );
      log("🎛️ NEW: Fixed save button + immediate font application", "INFO");
      log(
        "🎯 DETECTION: Only shows button on own user preferences page",
        "INFO"
      );
      log("🎨 STYLING: Professional three-section layout", "INFO");
      log("📱 LAYOUT: 25% larger modal with fixed footer", "INFO");
      log(
        "🔤 FONT: Smart web font loading + 10 beautiful fonts available",
        "INFO"
      );
      log(
        "🔍 DETECTION: Font availability checking prevents mismatches",
        "INFO"
      );
      log("💾 UX: Save button always visible at bottom", "INFO");
      log("🎯 NEW: Surgical Journal Color Auto-Fix Integration!", "SUCCESS");
      log(
        "🔥 AUTO-FIX: Color changes automatically update all journal entries",
        "INFO"
      );
    } catch (error) {
      log(`CRITICAL ERROR in onload: ${error.message}`, "ERROR");
    }
  };

  const onunload = () => {
    try {
      log("Enhanced Preferences Editor Extension unloading...", "INFO");

      // Clean up button management
      if (buttonManager) {
        try {
          buttonManager.cleanup();
          log("✅ Button management cleaned up", "SUCCESS");
        } catch (error) {
          log(`❌ Button manager cleanup error: ${error.message}`, "ERROR");
        }
      }

      // Clean up UI elements
      if (preferencesModal) {
        preferencesModal.remove();
        preferencesModal = null;
      }

      // Clean up global API
      if (window.preferencesEditor) {
        delete window.preferencesEditor;
      }

      // Reset state
      currentUser = null;
      extensionAPI = null;
      buttonManager = null;
      isInitialized = false;
      initialPreferences = {};

      log(
        "Enhanced Preferences Editor Extension unloaded successfully",
        "SUCCESS"
      );
    } catch (error) {
      console.error("Error in Enhanced Preferences Editor onunload:", error);
    }
  };

  return {
    onload,
    onunload,
  };
})();

export default preferencesEditorExtension;
