// ===================================================================
// Preferences Editor Extension - Built on Profile Nudges Pattern
// 🎛️ Intelligent preferences editing with sophisticated conditional logic
// 🎯 Smart detection of own user preferences page
// 🎨 Standardized warm yellow styling for consistency
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
        text: "🎛️ Edit preferences",
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
  // 🎨 UI COMPONENTS - Modal Functionality
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

      // Create modal
      preferencesModal = modalUtilities.createModal("preferences-edit-modal", {
        closeOnEscape: true,
        closeOnBackdrop: true,
      });

      const modalContent = modalUtilities.createModalContent({
        width: "95%",
        maxWidth: "900px",
        maxHeight: "90%",
      });

      // Ensure relative positioning for scroll indicator
      modalContent.style.position = "relative";

      // Custom header with consistent styling
      const header = document.createElement("div");
      header.style.cssText = `
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 24px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 20px 20px 0 0;
      `;

      const headerContent = document.createElement("div");
      headerContent.innerHTML = `
        <h2 style="margin: 0; font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 12px;">
          🎛️ TESTING - Edit Your Preferences
        </h2>
        <div style="margin-top: 6px; font-size: 16px; opacity: 0.9;">
          TEST MODE - Customize your Roam experience
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

      // Create form content
      const formContainer = document.createElement("div");
      formContainer.style.cssText = `
        padding: 32px;
        overflow-y: auto;
        max-height: 60vh;
        font-size: 16px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      `;

      // Add webkit scrollbar styling for better visibility
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.textContent = `
        .preferences-modal-form::-webkit-scrollbar {
          width: 8px;
        }
        .preferences-modal-form::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .preferences-modal-form::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .preferences-modal-form::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      document.head.appendChild(scrollbarStyle);
      formContainer.classList.add("preferences-modal-form");

      // Create form fields
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
        "Protect your home page from edits by others (allows comments)",
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

      // Save button
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
        margin-top: 32px;
        transition: transform 0.2s ease;
      `;

      saveButton.addEventListener("mouseenter", () => {
        saveButton.style.transform = "translateY(-1px)";
      });

      saveButton.addEventListener("mouseleave", () => {
        saveButton.style.transform = "translateY(0)";
      });

      saveButton.addEventListener("click", async () => {
        await handleSavePreferences();
      });

      // Assemble modal
      formContainer.appendChild(fieldsContainer);
      formContainer.appendChild(saveButton);

      // Add scroll indicator overlay
      const scrollIndicator = document.createElement("div");
      scrollIndicator.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30px;
        background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
        pointer-events: none;
        border-radius: 0 0 20px 20px;
      `;

      modalContent.appendChild(header);
      modalContent.appendChild(formContainer);
      modalContent.appendChild(scrollIndicator);
      preferencesModal.appendChild(modalContent);

      // Hide scroll indicator when at bottom
      formContainer.addEventListener("scroll", () => {
        const isAtBottom =
          formContainer.scrollTop + formContainer.clientHeight >=
          formContainer.scrollHeight - 10;
        scrollIndicator.style.opacity = isAtBottom ? "0" : "1";
      });

      document.body.appendChild(preferencesModal);

      log("Preferences edit modal created", "SUCCESS");
    } catch (error) {
      log(`Error showing preferences edit modal: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 🎨 FIELD CREATION HELPERS
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

    // Trimmed to 6 well-supported fonts
    const fonts = [
      "Noto Sans", // Default - comprehensive, neutral
      "Georgia", // Serif - classic, readable
      "Merriweather", // Serif - modern, web-optimized
      "Avenir", // Sans - geometric, clean
      "Roboto", // Sans - modern, friendly
      "Inter", // Sans - popular for UI/interfaces
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
      optionElement.value = font;
      optionElement.textContent = font;
      select.appendChild(optionElement);
    });

    // Set current value
    const initialFont =
      currentValue && fonts.includes(currentValue) ? currentValue : fonts[0];
    select.value = initialFont;

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

    const updatePreview = (fontName) => {
      // Create completely isolated preview elements
      previewText.innerHTML = "";

      // First line - normal text
      const normalDiv = document.createElement("div");
      normalDiv.textContent = "The quick brown fox jumps over the lazy dog";
      normalDiv.style.cssText = `
        all: unset !important;
        font-family: ${fontName}, serif !important;
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
      boldDiv.textContent = `Bold text looks like this in ${fontName}`;
      boldDiv.style.cssText = `
        all: unset !important;
        font-family: ${fontName}, serif !important;
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
        font-family: ${fontName}, serif !important;
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
  // 💾 SAVE PREFERENCES HANDLER
  // ===================================================================

  const handleSavePreferences = async () => {
    try {
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

      const success = await savePreferences(updatedPreferences);

      if (success) {
        log("✅ All preferences saved successfully!", "SUCCESS");

        // Close modal
        if (preferencesModal) {
          preferencesModal.remove();
          preferencesModal = null;
        }

        // Trigger button condition re-evaluation
        if (buttonManager && buttonManager.registry) {
          buttonManager.registry.rebuildAllButtons();
          log("🔄 Triggered button condition re-evaluation", "INFO");
        }

        // TODO: Here we'll add the action logic for color/font changes
        await handlePreferenceActions(updatedPreferences);
      } else {
        log("❌ Some preferences failed to save", "ERROR");
      }
    } catch (error) {
      log(`Error saving preferences: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 🎯 PREFERENCE ACTIONS (Placeholder for future implementation)
  // ===================================================================

  const handlePreferenceActions = async (updatedPreferences) => {
    try {
      log("🎯 Handling preference actions...", "INFO");

      // Check if journal color was changed
      if (updatedPreferences["Journal Header Color"]) {
        log(
          `📝 Journal color changed to: ${updatedPreferences["Journal Header Color"]}`,
          "INFO"
        );
        // TODO: Apply journal color changes
      }

      // Check if font was changed
      if (updatedPreferences["Graph Display Font"]) {
        log(
          `🔤 Font changed to: ${updatedPreferences["Graph Display Font"]}`,
          "INFO"
        );
        // TODO: Apply font changes
      }

      log("✅ Preference actions completed", "SUCCESS");
    } catch (error) {
      log(`Error handling preference actions: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 🎛️ EXTENSION LIFECYCLE
  // ===================================================================

  const onload = ({ extensionAPI: api }) => {
    try {
      log("Preferences Editor Extension loading...", "SUCCESS");

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
                "Show preferences editor button on your preferences page",
              action: { type: "switch" },
            },
          ],
        });
      }

      // Export public API
      window.preferencesEditor = {
        showPreferencesEditModal,
        getCurrentPreferences,
        isOnOwnUserPreferencesPage,
        initializeButtonManagement,
        debug: {
          testButtonCondition: isOnOwnUserPreferencesPage,
          getCurrentUser: getCurrentUserSafe,
          getCurrentPage: getCurrentPageTitle,
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
            log("Starting preferences editor button management...", "INFO");
            const result = await initializeButtonManagement();
            if (result.success) {
              log(
                "🎉 Preferences editor button management initialized successfully!",
                "SUCCESS"
              );
            } else {
              log(
                `⚠️ Preferences editor button management failed: ${result.reason}`,
                "WARNING"
              );
            }
          } catch (error) {
            log(
              `❌ Failed to initialize preferences editor button management: ${error.message}`,
              "ERROR"
            );
          }
        }
      }, 2000);

      log("Preferences Editor Extension loaded successfully!", "SUCCESS");
      log(
        "🎛️ NEW: Intelligent preferences editing with conditional logic",
        "INFO"
      );
      log(
        "🎯 DETECTION: Only shows button on own user preferences page",
        "INFO"
      );
      log("🎨 STYLING: Consistent warm yellow with brown border", "INFO");
      log("📍 POSITION: Top-right stack with automatic coordination", "INFO");
      log(
        "💡 Try: Navigate to your '{username}/user preferences' page",
        "INFO"
      );
    } catch (error) {
      log(`CRITICAL ERROR in onload: ${error.message}`, "ERROR");
    }
  };

  const onunload = () => {
    try {
      log("Preferences Editor Extension unloading...", "INFO");

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

      log("Preferences Editor Extension unloaded successfully", "SUCCESS");
    } catch (error) {
      console.error("Error in Preferences Editor onunload:", error);
    }
  };

  return {
    onload,
    onunload,
  };
})();

export default preferencesEditorExtension;
