// ===================================================================
// User Profile Nudges Extension - Refactored with Button Manager Integration
// ✨ Clean integration with Extension 1.6 (Simple Button Utility 2.0)
// 🎯 Smart profile completion nudging with sophisticated conditional logic
// 🎨 Standardized warm yellow styling for consistency
// ===================================================================

const userProfileNudgesExtension = (() => {
  // ===================================================================
  // 🎯 STATE MANAGEMENT
  // ===================================================================
  let isInitialized = false;
  let extensionAPI = null;
  let buttonManager = null;
  let currentUser = null;
  let profileModal = null;

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
    console.log(`[Profile Nudges ${timestamp}] ${category}: ${message}`);
  };

  // ===================================================================
  // 🔧 DEPENDENCY MANAGEMENT
  // ===================================================================

  // 🌟 Check if Extension 1.6 (Simple Button Utility 2.0) is available
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

  // ===================================================================
  // 🔍 USER & PAGE DETECTION - Core Intelligence Preserved
  // ===================================================================

  const getCurrentUserSafe = () => {
    try {
      if (currentUser) return currentUser;

      const getCurrentUser = getUtility("getCurrentUser");
      if (!getCurrentUser) {
        log("getCurrentUser utility not available", "WARNING");
        return null;
      }

      const user = getCurrentUser();
      if (user && user.displayName && user.method === "official-api") {
        currentUser = user;
        log(`Current user identified: ${user.displayName}`);
        return user;
      }

      log("No valid user detected", "WARNING");
      return null;
    } catch (error) {
      log(`Error getting current user: ${error.message}`, "ERROR");
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

  const isOnOwnUsernamePage = () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) return false;

      const currentPage = getCurrentPageTitle();
      if (!currentPage) return false;

      // Check if current page matches user's display name exactly
      return currentPage === user.displayName;
    } catch (error) {
      log(`Error checking if on own username page: ${error.message}`, "ERROR");
      return false;
    }
  };

  // ===================================================================
  // 📊 PROFILE ANALYSIS - Core Intelligence Preserved
  // ===================================================================

  const checkProfileCompleteness = () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) {
        return {
          isComplete: true,
          percentage: 100,
          reason: "No user detected",
        };
      }

      const getPageUidByTitle = getUtility("getPageUidByTitle");
      const findNestedDataValuesExact = getUtility("findNestedDataValuesExact");
      const profileAnalysisUtilities = getUtility("profileAnalysisUtilities");

      if (
        !getPageUidByTitle ||
        !findNestedDataValuesExact ||
        !profileAnalysisUtilities
      ) {
        log("Required utilities not available for profile analysis", "WARNING");
        return {
          isComplete: true,
          percentage: 100,
          reason: "Utilities not available",
        };
      }

      // Get user's page UID
      const userPageUid = getPageUidByTitle(user.displayName);
      if (!userPageUid) {
        log(`No page found for user: ${user.displayName}`, "INFO");
        return {
          isComplete: false,
          percentage: 0,
          missingFields: ["all"],
          reason: "No user page",
        };
      }

      // Extract profile data from My Info section
      const profileData = findNestedDataValuesExact(userPageUid, "My Info");
      if (!profileData || Object.keys(profileData).length === 0) {
        log(`No "My Info" section found for user: ${user.displayName}`, "INFO");
        return {
          isComplete: false,
          percentage: 0,
          missingFields: ["all"],
          reason: "No My Info section",
        };
      }

      // Define required fields
      const requiredFields = [
        "avatar",
        "location",
        "role",
        "timezone",
        "aboutMe",
      ];

      // Calculate completeness using Extension 1.5 utility
      const completeness =
        profileAnalysisUtilities.calculateProfileCompleteness(
          profileData,
          requiredFields
        );

      // Determine missing fields
      const missingFields = requiredFields.filter((field) => {
        const value = profileData[field];
        return (
          !value ||
          value === "__missing field__" ||
          value === "__not yet entered__"
        );
      });

      const isComplete = completeness >= 80; // Back to 80% - allow ONE field blank but not two

      log(
        `Profile completeness for ${user.displayName}: ${completeness}% (Complete: ${isComplete})`,
        "INFO"
      );

      return {
        isComplete,
        percentage: completeness,
        missingFields,
        profileData,
        reason: isComplete
          ? "Profile complete"
          : `Missing: ${missingFields.join(", ")}`,
      };
    } catch (error) {
      log(`Error checking profile completeness: ${error.message}`, "ERROR");
      return { isComplete: true, percentage: 100, reason: "Error occurred" };
    }
  };

  // ===================================================================
  // 🎯 BUTTON MANAGEMENT - Extension 1.6 Integration
  // ===================================================================

  // 🌟 Initialize button management with Extension 1.6
  const initializeButtonManagement = async () => {
    try {
      log(
        "🎯 Profile Nudges: Initializing Simple Button Utility 2.0...",
        "INFO"
      );

      // Check dependency availability
      if (!checkButtonUtilityDependency()) {
        log(
          "❌ Simple Button Utility 2.0 not available - NO BUTTON will be created",
          "WARNING"
        );
        log("💡 Please load Simple Button Utility 2.0 first", "WARNING");
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
            "ProfileNudges"
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

      // 🎯 EXACT STYLING: Warm yellow gradient with elegant brown border (consistent with other buttons)
      const buttonStyle = {
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)", // Softer warm yellow
        border: "1.5px solid #8b4513", // Elegant brown border
        color: "#78716c", // Muted brown text
        fontWeight: "600",
        padding: "10px 16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
      };

      // 🌟 Register Profile Nudge Button
      const nudgeButtonResult = await buttonManager.registerButton({
        id: "profile-nudge-button",
        text: "✨ Click for profile helper",
        stack: "top-right", // Position at top-right with other action buttons
        priority: false, // Play nice with other extensions
        style: buttonStyle,
        condition: () => {
          // 🎯 SOPHISTICATED CONDITIONAL LOGIC: Only show if on own username page AND profile incomplete
          const onUsernamePage = isOnOwnUsernamePage();
          if (!onUsernamePage) return false;

          const completeness = checkProfileCompleteness();
          const shouldShow = !completeness.isComplete;

          if (shouldShow) {
            log(
              `Profile incomplete (${completeness.percentage}%) - button should show`,
              "DEBUG"
            );
          } else {
            log(
              `Profile complete (${completeness.percentage}%) - button hidden`,
              "DEBUG"
            );
          }

          return shouldShow;
        },
        onClick: async () => {
          try {
            await showProfileEditModal();
            log("✅ Profile edit modal opened successfully!", "SUCCESS");
          } catch (error) {
            log(
              `❌ Failed to open profile edit modal: ${error.message}`,
              "ERROR"
            );
          }
        },
      });

      // Report results
      if (nudgeButtonResult.success) {
        log(
          `✅ Profile nudge button registered at ${nudgeButtonResult.stack}`,
          "SUCCESS"
        );
        log(
          "🎯 Button will appear when profile is incomplete on username page",
          "INFO"
        );
        return { success: true, registeredButtons: 1 };
      } else {
        log(
          `❌ Failed to register profile nudge button: ${nudgeButtonResult.error}`,
          "ERROR"
        );
        return { success: false, reason: nudgeButtonResult.error };
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
  // 🎨 UI COMPONENTS - Modal Functionality Preserved
  // ===================================================================

  const showProfileEditModal = async () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) return;

      const modalUtilities = getUtility("modalUtilities");
      if (!modalUtilities) {
        log("Modal utilities not available", "ERROR");
        return;
      }

      // Get current profile completeness
      const completeness = checkProfileCompleteness();

      // Create modal
      profileModal = modalUtilities.createModal("profile-edit-modal", {
        closeOnEscape: true,
        closeOnBackdrop: true,
      });

      const content = modalUtilities.createModalContent({
        width: "95%",
        maxWidth: "900px", // 50% bigger: 600px -> 900px
        maxHeight: "90%", // Slightly taller too
      });

      // Create modal with purple banner
      profileModal = modalUtilities.createModal("profile-edit-modal", {
        closeOnEscape: true,
        closeOnBackdrop: true,
      });

      const modalContent = modalUtilities.createModalContent({
        width: "95%",
        maxWidth: "900px", // 50% bigger: 600px -> 900px
        maxHeight: "90%", // Slightly taller too
      });

      // Custom purple banner header instead of default
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
          ✨ Complete Your Profile
        </h2>
        <div style="margin-top: 6px; font-size: 16px; opacity: 0.9;">
          ${completeness.percentage}% complete - Help others know more about you!
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
        if (profileModal) {
          profileModal.remove();
          profileModal = null;
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
        max-height: 70vh;
        font-size: 16px;  /* Bigger font */
      `;

      // Add progress bar
      const progressContainer = document.createElement("div");
      progressContainer.innerHTML = `
        <div style="background: #f3f4f6; border-radius: 8px; height: 8px; margin-bottom: 24px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${completeness.percentage}%; transition: width 0.3s ease;"></div>
        </div>
      `;

      // Create form fields
      const fieldsContainer = document.createElement("div");
      fieldsContainer.style.cssText =
        "display: flex; flex-direction: column; gap: 24px;"; // Bigger gaps

      const fieldDefinitions = [
        {
          key: "avatar",
          label: "Profile Image URL",
          placeholder: "https://example.com/your-photo.jpg",
          type: "url",
        },
        {
          key: "location",
          label: "Location",
          placeholder: "City, Country",
          type: "text",
        },
        {
          key: "role",
          label: "Role/Title",
          placeholder: "Your role or title",
          type: "text",
        },
        {
          key: "timezone",
          label: "Timezone",
          placeholder: "EST, PST, GMT+1, etc.",
          type: "text",
        },
        {
          key: "aboutMe",
          label: "About Me",
          placeholder: "Brief description about yourself...",
          type: "textarea",
        },
      ];

      fieldDefinitions.forEach((field) => {
        const fieldDiv = document.createElement("div");

        // Check if this field is missing/empty
        const currentValue = completeness.profileData?.[field.key];
        const isEmpty =
          !currentValue ||
          currentValue === "__missing field__" ||
          currentValue === "__not yet entered__";

        const label = document.createElement("label");
        label.textContent = field.label;
        label.style.cssText = `
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
          font-size: 16px;  /* Bigger font */
        `;

        let input;
        if (field.type === "textarea") {
          input = document.createElement("textarea");
          input.style.minHeight = "100px"; // Taller textarea
          input.style.resize = "vertical";
        } else {
          input = document.createElement("input");
          input.type = field.type;
        }

        input.placeholder = field.placeholder;

        // Base styling
        const baseStyles = `
          width: 100%;
          padding: 14px 16px;  /* More generous padding */
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;  /* Bigger font */
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
        `;

        // Add yellow background for empty fields (subtle pizzazz!)
        const backgroundStyle = isEmpty
          ? `background: #fefce8; border-color: #fbbf24;` // Soft yellow for empty
          : `background: white;`; // White for filled

        input.style.cssText = baseStyles + backgroundStyle;

        input.addEventListener("focus", () => {
          input.style.borderColor = "#6366f1";
          input.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
        });

        input.addEventListener("blur", () => {
          input.style.borderColor = isEmpty ? "#fbbf24" : "#e5e7eb";
          input.style.boxShadow = "none";
        });

        // Update background as user types
        input.addEventListener("input", () => {
          const hasValue = input.value.trim().length > 0;
          input.style.background = hasValue ? "white" : "#fefce8";
          input.style.borderColor = hasValue ? "#e5e7eb" : "#fbbf24";
        });

        // Pre-fill with existing data
        if (
          currentValue &&
          currentValue !== "__missing field__" &&
          currentValue !== "__not yet entered__"
        ) {
          input.value = currentValue;
        }

        input.setAttribute("data-field", field.key);

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        fieldsContainer.appendChild(fieldDiv);
      });

      // Save button
      const saveButton = document.createElement("button");
      saveButton.textContent = "💾 Save Profile";
      saveButton.style.cssText = `
        width: 100%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 16px 24px;  /* More generous padding */
        font-size: 18px;     /* Bigger font */
        font-weight: 600;
        cursor: pointer;
        margin-top: 32px;    /* More space */
        transition: transform 0.2s ease;
      `;

      saveButton.addEventListener("mouseenter", () => {
        saveButton.style.transform = "translateY(-1px)";
      });

      saveButton.addEventListener("mouseleave", () => {
        saveButton.style.transform = "translateY(0)";
      });

      saveButton.addEventListener("click", async () => {
        await saveProfileData();
      });

      // Assemble modal
      formContainer.appendChild(progressContainer);
      formContainer.appendChild(fieldsContainer);
      formContainer.appendChild(saveButton);

      content.appendChild(header);
      content.appendChild(formContainer);
      profileModal.appendChild(content);

      document.body.appendChild(profileModal);

      log("Profile edit modal created", "SUCCESS");
    } catch (error) {
      log(`Error showing profile edit modal: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 💾 PROFILE DATA MANAGEMENT - Core Logic Preserved
  // ===================================================================

  // Field name mapping: form keys to actual Roam field names
  const getActualFieldName = (formFieldKey) => {
    const fieldNameMap = {
      avatar: "Avatar",
      location: "Location",
      role: "Role",
      timezone: "Timezone",
      aboutMe: "About Me", // This is the key fix!
    };

    return fieldNameMap[formFieldKey] || formFieldKey;
  };

  // Helper function to find existing field block, with better field name mapping
  const findExistingFieldBlock = (parentUid, formFieldKey) => {
    try {
      const getDirectChildren = getUtility("getDirectChildren");
      if (!getDirectChildren) return null;

      const children = getDirectChildren(parentUid);

      // Convert form field key to actual Roam field name
      const actualFieldName = getActualFieldName(formFieldKey);
      const fieldPattern = `${actualFieldName}::`;

      // Look for blocks that START WITH the field pattern (handles render components, etc.)
      const matchingBlock = children.find((child) => {
        const childText = child.text.trim();
        return (
          childText.startsWith(fieldPattern) ||
          childText.toLowerCase().startsWith(fieldPattern.toLowerCase())
        );
      });

      if (matchingBlock) {
        log(
          `Found existing field block for ${formFieldKey} (${actualFieldName})`,
          "INFO"
        );
        return matchingBlock.uid;
      }

      log(
        `No existing field block found for ${formFieldKey} (${actualFieldName})`,
        "INFO"
      );
      return null;
    } catch (error) {
      log(
        `Error finding field block for ${formFieldKey}: ${error.message}`,
        "ERROR"
      );
      return null;
    }
  };

  // Helper function to update or create field value, using cascading logic like subjournals
  const updateOrCreateFieldValue = async (fieldBlockUid, value) => {
    try {
      const getDirectChildren = getUtility("getDirectChildren");
      const generateUID = getUtility("generateUID");

      if (!getDirectChildren || !generateUID) {
        log("Required utilities not available for field update", "ERROR");
        return false;
      }

      const children = getDirectChildren(fieldBlockUid);

      if (children.length > 0) {
        // Update existing first child
        const firstChildUid = children[0].uid;
        await window.roamAlphaAPI.data.block.update({
          block: { uid: firstChildUid, string: value },
        });
        log(`Updated existing field value`, "INFO");
      } else {
        // Create new child block
        const newValueUid = generateUID();
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": fieldBlockUid, order: 0 },
          block: { uid: newValueUid, string: value },
        });
        log(`Created new field value`, "INFO");
      }

      return true;
    } catch (error) {
      log(`Error updating field value: ${error.message}`, "ERROR");
      return false;
    }
  };

  const saveProfileData = async () => {
    try {
      const user = getCurrentUserSafe();
      if (!user) return;

      const getPageUidByTitle = getUtility("getPageUidByTitle");
      const ensureBlockExists = getUtility("ensureBlockExists");
      const findBlockByText = getUtility("findBlockByText");
      const generateUID = getUtility("generateUID");

      if (!getPageUidByTitle || !ensureBlockExists || !generateUID) {
        log("Required utilities not available for saving", "ERROR");
        return;
      }

      // Get form data
      const formInputs = profileModal.querySelectorAll("input, textarea");
      const profileData = {};

      formInputs.forEach((input) => {
        const fieldName = input.getAttribute("data-field");
        const value = input.value.trim();
        if (fieldName && value) {
          profileData[fieldName] = value;
        }
      });

      log(
        `Saving profile data: ${Object.keys(profileData).length} fields`,
        "INFO"
      );

      // Get username page UID
      const userPageUid = getPageUidByTitle(user.displayName);
      if (!userPageUid) {
        log("User page not found", "ERROR");
        return;
      }

      // Step 1: Ensure "My Info::" block exists (cascading approach)
      let myInfoUid = findBlockByText
        ? findBlockByText(userPageUid, "My Info::")
        : null;

      if (!myInfoUid && ensureBlockExists) {
        myInfoUid = await ensureBlockExists(userPageUid, "My Info::");
      }

      if (!myInfoUid) {
        log("Failed to find or create My Info block", "ERROR");
        return;
      }

      log(`Using My Info block: ${myInfoUid}`, "INFO");

      // Step 2: For each field, use cascading logic with proper field name mapping
      let successCount = 0;

      for (const [formFieldKey, value] of Object.entries(profileData)) {
        try {
          // Get the actual Roam field name
          const actualFieldName = getActualFieldName(formFieldKey);

          // Find existing field block using form field key (which handles the mapping)
          let fieldBlockUid = findExistingFieldBlock(myInfoUid, formFieldKey);

          if (!fieldBlockUid) {
            // Create new field block using ACTUAL field name
            const fieldText = `${actualFieldName}::`;
            if (ensureBlockExists) {
              fieldBlockUid = await ensureBlockExists(myInfoUid, fieldText);
            }
          }

          if (fieldBlockUid) {
            // Update or create the field value
            const success = await updateOrCreateFieldValue(
              fieldBlockUid,
              value
            );
            if (success) {
              successCount++;
              log(
                `Successfully saved ${formFieldKey} (${actualFieldName})`,
                "INFO"
              );
            }
          } else {
            log(
              `Failed to create field block for ${formFieldKey} (${actualFieldName})`,
              "ERROR"
            );
          }
        } catch (fieldError) {
          log(
            `Error saving field ${formFieldKey}: ${fieldError.message}`,
            "ERROR"
          );
        }
      }

      if (successCount > 0) {
        log(
          `Successfully saved ${successCount}/${
            Object.keys(profileData).length
          } fields`,
          "SUCCESS"
        );

        // Close modal
        if (profileModal) {
          profileModal.remove();
          profileModal = null;
        }

        // ✨ NEW: Trigger button manager to re-evaluate conditions
        // This will hide the button if profile is now complete
        if (buttonManager && buttonManager.registry) {
          buttonManager.registry.rebuildAllButtons();
          log("🔄 Triggered button condition re-evaluation", "INFO");
        }
      } else {
        log("Failed to save any profile data", "ERROR");
      }
    } catch (error) {
      log(`Error saving profile data: ${error.message}`, "ERROR");
    }
  };

  // ===================================================================
  // 🎛️ EXTENSION LIFECYCLE
  // ===================================================================

  const onload = ({ extensionAPI: api }) => {
    try {
      log(
        "User Profile Nudges Extension v2.0 - Button Manager Integration loading...",
        "SUCCESS"
      );

      extensionAPI = api;

      // Check for Extension 1.5 dependencies
      const requiredUtilities = [
        "getCurrentUser",
        "getPageUidByTitle",
        "findNestedDataValuesExact",
        "modalUtilities",
        "profileAnalysisUtilities",
        "setNestedDataValuesStructured",
      ];

      const missingUtilities = requiredUtilities.filter(
        (util) => !getUtility(util)
      );

      if (missingUtilities.length > 0) {
        log(
          `Missing required utilities: ${missingUtilities.join(", ")}`,
          "ERROR"
        );
        log("Please ensure Extension 1.5 is loaded first", "ERROR");
        return;
      }

      // Create settings panel
      if (extensionAPI.settings) {
        extensionAPI.settings.panel.create({
          tabTitle: "Profile Nudges",
          settings: [
            {
              id: "enableNudges",
              name: "Enable Profile Nudges",
              description: "Show helpful buttons to complete your profile",
              action: { type: "switch" },
            },
          ],
        });
      }

      // Export public API
      window.userProfileNudges = {
        checkProfileCompleteness,
        showProfileEditModal,
        getCurrentUserSafe,
        isOnOwnUsernamePage,
        initializeButtonManagement, // ✨ NEW: Expose for manual initialization
        debug: {
          checkCompleteness: checkProfileCompleteness,
          forceShowModal: showProfileEditModal,
          testButtonCondition: () => {
            return (
              isOnOwnUsernamePage() && !checkProfileCompleteness().isComplete
            );
          },
        },
      };

      isInitialized = true;

      // Initialize button management with proper delay
      setTimeout(async () => {
        const nudgesEnabled = extensionAPI.settings?.get("enableNudges");
        if (nudgesEnabled !== false) {
          try {
            log("Starting profile nudge button management...", "INFO");
            const result = await initializeButtonManagement();
            if (result.success) {
              log(
                "🎉 Profile nudge button management initialized successfully!",
                "SUCCESS"
              );
            } else {
              log(
                `⚠️ Profile nudge button management failed: ${result.reason}`,
                "WARNING"
              );
            }
          } catch (error) {
            log(
              `❌ Failed to initialize profile nudge button management: ${error.message}`,
              "ERROR"
            );
          }
        }
      }, 2000); // Delay to ensure Extension 1.6 is ready

      log(
        "User Profile Nudges Extension loaded successfully with Button Manager Integration!",
        "SUCCESS"
      );
      log("🗑️ REMOVED: Complex button coordination system", "INFO");
      log(
        "🎯 NEW: Extension 1.6 (Simple Button Utility 2.0) integration",
        "INFO"
      );
      log("🎨 STYLING: Standardized warm yellow with brown border", "INFO");
      log(
        "✨ CONDITIONAL: Sophisticated logic for profile completeness",
        "INFO"
      );
      log("📍 POSITION: Top-right stack with automatic coordination", "INFO");
      log(
        "💡 Try: Navigate to your username page with incomplete profile",
        "INFO"
      );
    } catch (error) {
      log(`CRITICAL ERROR in onload: ${error.message}`, "ERROR");
    }
  };

  const onunload = () => {
    try {
      log("User Profile Nudges Extension unloading...", "INFO");

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
      if (profileModal) {
        profileModal.remove();
        profileModal = null;
      }

      // Clean up global API
      if (window.userProfileNudges) {
        delete window.userProfileNudges;
      }

      // Reset state
      currentUser = null;
      extensionAPI = null;
      buttonManager = null;
      isInitialized = false;

      log("User Profile Nudges Extension unloaded successfully", "SUCCESS");
    } catch (error) {
      console.error("Error in User Profile Nudges onunload:", error);
    }
  };

  return {
    onload,
    onunload,
  };
})();

export default userProfileNudgesExtension;
