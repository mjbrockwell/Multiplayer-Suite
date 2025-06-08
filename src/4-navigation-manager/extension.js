// ===================================================================
// Extension 4: Navigation + Protection - REWRITTEN
// FIXED: Uses Directory:: as ONLY source of truth for user page protection
// No pattern matching - direct lookup against [[roam/graph members]]
// Dependencies: Extensions 1, 1.5, 2, 3
// ===================================================================

// ===================================================================
// 🧭 SMART LANDING SYSTEM - Intelligent Navigation Experience
// ===================================================================

/**
 * Smart landing page calculation based on user context
 */
const calculateSmartLanding = async (user) => {
  try {
    // Get user preferences first
    const platform = window.RoamExtensionSuite;
    const getUserPreference = platform.getUtility("getUserPreference");
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");

    // Check if we have specific preferences
    const landingPreference = await getUserPreference(
      user.displayName,
      "Loading Page Preference",
      "Daily Page"
    );

    // If user has a specific preference (not "Smart"), use it
    if (landingPreference && landingPreference !== "Smart") {
      return landingPreference;
    }

    // Smart calculation based on context
    const currentHour = new Date().getHours();
    const currentPage = getCurrentPageTitle();

    // Morning (6-12): Suggest daily notes or user page
    if (currentHour >= 6 && currentHour < 12) {
      return Math.random() > 0.5 ? "Daily Notes" : user.displayName;
    }

    // Afternoon (12-18): Suggest work-related pages
    if (currentHour >= 12 && currentHour < 18) {
      // Check if user has Chat Room in shortcuts
      const shortcuts = await getUserPreference(
        user.displayName,
        "Personal Shortcuts",
        ""
      );
      const parsedShortcuts = platform.getUtility("parsePersonalShortcuts")(
        shortcuts
      );

      if (parsedShortcuts.includes("Chat Room")) {
        return "Chat Room";
      }
      return user.displayName;
    }

    // Evening (18+): Suggest personal pages
    return user.displayName;
  } catch (error) {
    console.warn("Smart landing calculation failed:", error.message);
    return "Daily Notes"; // Safe fallback
  }
};

/**
 * Handle smart landing navigation with session management
 */
const handleSmartLanding = async () => {
  try {
    // Check if we've already redirected this session
    if (sessionStorage.getItem("roam_landing_redirected") === "true") {
      return; // Don't redirect again
    }

    // Check if we're on today's daily note page
    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getTodaysRoamDate = platform.getUtility("getTodaysRoamDate");
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");

    const currentPage = getCurrentPageTitle();
    const todaysDate = getTodaysRoamDate();
    const user = getAuthenticatedUser();

    if (!user) {
      console.warn("No authenticated user found for smart landing");
      return;
    }

    // Check if current page is today's daily note
    const todayPageTitle = window.roamAlphaAPI.util.dateToPageTitle(new Date());

    if (currentPage !== todayPageTitle) {
      return; // Not on daily note, don't redirect
    }

    // Get user's landing preference
    const getUserPreference = platform.getUtility("getUserPreference");
    const landingPreference = await getUserPreference(
      user.displayName,
      "Loading Page Preference",
      "Daily Page"
    );

    // If preference is "Daily Page", stay put
    if (landingPreference === "Daily Page") {
      sessionStorage.setItem("roam_landing_redirected", "true");
      return;
    }

    // Calculate target page
    let targetPage;
    if (landingPreference === "Smart") {
      targetPage = await calculateSmartLanding(user);
    } else if (landingPreference === user.displayName) {
      targetPage = user.displayName;
    } else {
      targetPage = landingPreference;
    }

    // Navigate to target page
    if (targetPage && targetPage !== currentPage) {
      console.log(`🧭 Smart landing: ${currentPage} → ${targetPage}`);

      // Navigate using Roam's navigation
      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      const createPageIfNotExists = platform.getUtility(
        "createPageIfNotExists"
      );

      let pageUid = getPageUidByTitle(targetPage);
      if (!pageUid) {
        pageUid = await createPageIfNotExists(targetPage);
      }

      if (pageUid) {
        window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid: pageUid } });
      }
    }

    // Mark as redirected to prevent loops
    sessionStorage.setItem("roam_landing_redirected", "true");
  } catch (error) {
    console.error("Smart landing failed:", error);
    sessionStorage.setItem("roam_landing_redirected", "true"); // Prevent retry loops
  }
};

// ===================================================================
// 🛡️ PAGE PROTECTION SYSTEM - Source of Truth Based
// ===================================================================

/**
 * Get the authoritative list of graph members from Directory::
 */
const getGraphMembersList = () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    if (getGraphMembers) {
      return getGraphMembers();
    }

    // Fallback: direct query if utility not available
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findDataValue = platform.getUtility("findDataValue");

    const membersPageUid = getPageUidByTitle("roam/graph members");
    if (!membersPageUid) return [];

    const members = findDataValue(membersPageUid, "Directory");
    if (!members) return [];

    return Array.isArray(members) ? members : [members];
  } catch (error) {
    console.warn("Failed to get graph members list:", error);
    return [];
  }
};

/**
 * Extract potential page owner from page title
 * Returns the username if this could be a user page, null otherwise
 */
const extractPotentialPageOwner = (pageTitle) => {
  if (!pageTitle) return null;

  // If page contains "/", the part before "/" might be a username
  if (pageTitle.includes("/")) {
    return pageTitle.split("/")[0];
  }

  // Otherwise, the full page title might be a username
  return pageTitle;
};

/**
 * REWRITTEN: Check if page is protected based ONLY on Directory:: source of truth
 */
const isPageProtectedByUser = (pageTitle) => {
  if (!pageTitle) return { isProtected: false };

  try {
    // Get authoritative list of graph members
    const graphMembers = getGraphMembersList();

    if (!graphMembers || graphMembers.length === 0) {
      return { isProtected: false }; // No members list = no protection
    }

    // Extract potential page owner
    const potentialOwner = extractPotentialPageOwner(pageTitle);

    if (!potentialOwner) {
      return { isProtected: false };
    }

    // Check if potential owner is in the authoritative Directory:: list
    const isInDirectory = graphMembers.includes(potentialOwner);

    if (isInDirectory) {
      return {
        isProtected: true,
        pageOwner: potentialOwner,
        pageType: pageTitle.includes("/") ? "subpage" : "main",
      };
    }

    return { isProtected: false };
  } catch (error) {
    console.warn("Error checking page protection:", error);
    return { isProtected: false }; // Fail safe - allow editing
  }
};

/**
 * Detect if block is within a roam/comments tree
 */
const isInCommentsTree = (blockElement) => {
  if (!blockElement) return false;

  let current = blockElement;
  while (current && current !== document.body) {
    // Check if this block or any ancestor contains [[roam/comments]]
    const blockContent = current.querySelector(".rm-block-text");
    if (blockContent && blockContent.textContent.includes("roam/comments")) {
      return true;
    }

    // Check data attributes that might indicate roam/comments
    const pathPageLinks = current.getAttribute("data-path-page-links");
    const pageLinks = current.getAttribute("data-page-links");

    if (
      (pathPageLinks && pathPageLinks.includes("roam/comments")) ||
      (pageLinks && pageLinks.includes("roam/comments"))
    ) {
      return true;
    }

    // Move up to parent block
    current = current.parentElement?.closest(".rm-block");
  }

  return false;
};

/**
 * REWRITTEN: Check edit permissions using source of truth logic
 */
const checkEditPermission = async (blockElement) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getUserPreference = platform.getUtility("getUserPreference");

    const currentUser = getAuthenticatedUser();
    const currentPage = getCurrentPageTitle();

    if (!currentUser || !currentPage) {
      return { allowed: true }; // Can't determine, allow edit
    }

    // Always allow if in comments tree
    if (isInCommentsTree(blockElement)) {
      return { allowed: true, reason: "comments-tree" };
    }

    // Check if this page is protected based on Directory:: source of truth
    const protection = isPageProtectedByUser(currentPage);

    if (!protection.isProtected) {
      return { allowed: true }; // Not a user page, allow editing
    }

    // This is a user page - check if current user is the owner
    if (protection.pageOwner === currentUser.displayName) {
      return { allowed: true, reason: "own-page" }; // User editing their own page
    }

    // Different user's page - check their immutable preference
    const isImmutable = await getUserPreference(
      protection.pageOwner,
      "Immutable Home Page",
      "no" // Default to allowing edits
    );

    if (isImmutable === "yes") {
      return {
        allowed: false,
        reason: "immutable",
        pageOwner: protection.pageOwner,
        pageType: protection.pageType,
        showModal: true,
      };
    }

    // User allows edits to their page
    return { allowed: true, reason: "user-allows-edits" };
  } catch (error) {
    console.warn("Permission check failed:", error.message);
    return { allowed: true }; // Fail open for user experience
  }
};

/**
 * Show protection modal with helpful alternatives
 */
const showProtectionModal = (pageOwner, pageType, attemptingUser) => {
  // Remove any existing modal
  const existingModal = document.querySelector(
    ".roam-extension-suite-protection-modal"
  );
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal
  const modal = document.createElement("div");
  modal.className = "roam-extension-suite-protection-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 6px;
    padding: 24px;
    max-width: 500px;
    margin: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  `;

  const pageTypeDescription =
    pageType === "subpage" ? "page and subpages" : "page";

  modalContent.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 20px; margin-right: 8px;">🔒</span>
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Protected User Page</h3>
    </div>
    <p style="margin: 0 0 20px 0; line-height: 1.5; color: #374151;">
      <strong>${pageOwner}</strong> has set their ${pageTypeDescription} to be immutable, so blocks cannot be edited. 
      However, you can add a comment to any block by hovering over it with the 
      <kbd style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">Cmd</kbd> 
      key pressed.
    </p>
    <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 14px; color: #666;">
      <strong>Source:</strong> This page is protected because "${pageOwner}" is listed in the 
      <strong>roam/graph members → Directory::</strong> and has immutable settings enabled.
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="open-my-page" style="background: #137cbd; color: white; border: none; border-radius: 3px; padding: 8px 16px; cursor: pointer; font-weight: 500;">
        Open My Page
      </button>
      <button class="close-modal" style="background: #f3f4f6; color: #374151; border: none; border-radius: 3px; padding: 8px 16px; cursor: pointer; font-weight: 500;">
        OK
      </button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Add event listeners
  const closeModal = () => modal.remove();

  modalContent
    .querySelector(".close-modal")
    .addEventListener("click", closeModal);
  modalContent
    .querySelector(".open-my-page")
    .addEventListener("click", async () => {
      const platform = window.RoamExtensionSuite;
      const createPageIfNotExists = platform.getUtility(
        "createPageIfNotExists"
      );

      const myPageUid = await createPageIfNotExists(attemptingUser.displayName);
      if (myPageUid) {
        window.roamAlphaAPI.ui.mainWindow.openPage({
          page: { uid: myPageUid },
        });
      }
      closeModal();
    });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Register for cleanup
  window._extensionRegistry.elements.push(modal);
};

/**
 * Intercept edit attempts and check permissions
 */
const interceptEditAttempts = () => {
  const handleFocusIn = async (event) => {
    const blockElement = event.target.closest(".rm-block");
    if (!blockElement) return;

    // Check if this is an edit attempt (focusing on textarea)
    if (event.target.matches("textarea.rm-block-input")) {
      const permission = await checkEditPermission(blockElement);

      if (!permission.allowed && permission.showModal) {
        // Prevent edit
        event.target.blur();

        // Show protection modal
        const platform = window.RoamExtensionSuite;
        const getAuthenticatedUser = platform.getUtility(
          "getAuthenticatedUser"
        );
        const currentUser = getAuthenticatedUser();

        showProtectionModal(
          permission.pageOwner,
          permission.pageType,
          currentUser
        );

        console.log(
          `🛡️ Edit blocked on ${permission.pageOwner}'s immutable ${permission.pageType} page`
        );
      }
    }
  };

  // Listen for focus events that might indicate edit attempts
  document.addEventListener("focusin", handleFocusIn, true);

  // Register listener for cleanup
  window._extensionRegistry.domListeners.push({
    el: document,
    type: "focusin",
    listener: handleFocusIn,
  });
};

// ===================================================================
// 🎯 PAGE NAVIGATION UTILITIES - Smart Navigation Helpers
// ===================================================================

/**
 * Enhanced navigation with error handling
 */
const navigateToPage = async (pageTitle) => {
  if (!pageTitle) return false;

  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");

    let pageUid = getPageUidByTitle(pageTitle);

    if (!pageUid) {
      pageUid = await createPageIfNotExists(pageTitle);
    }

    if (pageUid) {
      window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid: pageUid } });
      console.log(`🧭 Navigated to: ${pageTitle}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Navigation failed to ${pageTitle}:`, error);
    return false;
  }
};

/**
 * Get current page info for debugging
 */
const getCurrentPageInfo = () => {
  const platform = window.RoamExtensionSuite;
  const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
  const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

  const title = getCurrentPageTitle();
  const uid = title ? getPageUidByTitle(title) : null;
  const protection = isPageProtectedByUser(title);

  return {
    title,
    uid,
    url: window.location.href,
    isDailyNote: title
      ? window.roamAlphaAPI.util.dateToPageTitle(new Date()) === title
      : false,
    protection,
  };
};

// ===================================================================
// 🧪 TESTING AND DEBUGGING UTILITIES
// ===================================================================

/**
 * Test the protection system with current page
 */
const testProtectionSystem = async () => {
  try {
    console.group("🧪 Protection System Test");

    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");

    const currentPage = getCurrentPageTitle();
    const currentUser = getAuthenticatedUser();

    console.log("Current Page:", currentPage);
    console.log("Current User:", currentUser?.displayName);

    // Test protection detection
    const protection = isPageProtectedByUser(currentPage);
    console.log("Protection Check:", protection);

    // Test graph members list
    const members = getGraphMembersList();
    console.log("Graph Members:", members);

    // Test edit permission
    const focusedBlock = document.querySelector(".rm-block--focused");
    if (focusedBlock) {
      const permission = await checkEditPermission(focusedBlock);
      console.log("Edit Permission:", permission);

      if (!permission.allowed && permission.showModal) {
        showProtectionModal(
          permission.pageOwner,
          permission.pageType,
          currentUser
        );
      }
    } else {
      console.log(
        "No focused block found - focus on a block to test edit permission"
      );
    }

    console.groupEnd();
  } catch (error) {
    console.error("Protection test failed:", error);
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🧭 Navigation + Protection starting (REWRITTEN)...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    const requiredDependencies = [
      "utility-library",
      "user-authentication",
      "configuration-manager",
    ];

    for (const dep of requiredDependencies) {
      if (!platform.has(dep)) {
        console.error(
          `❌ ${dep} not found! Please load required dependencies first.`
        );
        return;
      }
    }

    // 🎯 INITIALIZE SYSTEMS
    try {
      // Start page protection monitoring
      interceptEditAttempts();
      console.log("🛡️ Source-of-truth page protection system active");

      // Set up smart landing (delayed to let page load)
      const setupSmartLanding = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        await handleSmartLanding();
      };

      // Only run smart landing if we haven't already redirected
      if (sessionStorage.getItem("roam_landing_redirected") !== "true") {
        setupSmartLanding();
      }
    } catch (error) {
      console.error("❌ Failed to initialize navigation systems:", error);
    }

    // 🔧 REGISTER UTILITIES
    const navigationServices = {
      navigateToPage: navigateToPage,
      getCurrentPageInfo: getCurrentPageInfo,
      handleSmartLanding: handleSmartLanding,
      checkEditPermission: checkEditPermission,
      isInCommentsTree: isInCommentsTree,
      calculateSmartLanding: calculateSmartLanding,
      isPageProtectedByUser: isPageProtectedByUser,
      getGraphMembersList: getGraphMembersList,
      testProtectionSystem: testProtectionSystem,
    };

    Object.entries(navigationServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Nav: Show Current Page Info",
        callback: () => {
          const pageInfo = getCurrentPageInfo();
          console.group("🧭 Current Page Information");
          console.log("Title:", pageInfo.title);
          console.log("UID:", pageInfo.uid);
          console.log("URL:", pageInfo.url);
          console.log("Is Daily Note:", pageInfo.isDailyNote);
          console.log("Protection Status:", pageInfo.protection);
          console.groupEnd();
        },
      },
      {
        label: "Nav: Test Protection System",
        callback: testProtectionSystem,
      },
      {
        label: "Nav: Show Graph Members List",
        callback: () => {
          const members = getGraphMembersList();
          console.group("📋 Graph Members (Source of Truth)");
          console.log(`Found ${members.length} members in Directory::`);
          members.forEach((member, index) => {
            console.log(`${index + 1}. ${member}`);
          });
          console.groupEnd();
        },
      },
      {
        label: "Nav: Test Smart Landing",
        callback: async () => {
          // Clear session flag to allow testing
          sessionStorage.removeItem("roam_landing_redirected");
          console.log("🧪 Testing smart landing...");
          await handleSmartLanding();
        },
      },
      {
        label: "Nav: Navigate to My Page",
        callback: async () => {
          const getAuthenticatedUser = platform.getUtility(
            "getAuthenticatedUser"
          );
          const user = getAuthenticatedUser();
          if (user) {
            const success = await navigateToPage(user.displayName);
            console.log(
              `🧭 Navigation to ${user.displayName}: ${
                success ? "Success" : "Failed"
              }`
            );
          }
        },
      },
      {
        label: "Nav: Reset Landing Redirect",
        callback: () => {
          sessionStorage.removeItem("roam_landing_redirected");
          console.log(
            "🔄 Landing redirect flag reset - refresh page to test landing"
          );
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "navigation-protection",
      {
        services: navigationServices,
        version: "1.1.0",
      },
      {
        name: "Navigation + Protection (Source of Truth)",
        description:
          "Smart landing + user page protection based on Directory:: source of truth",
        version: "1.1.0",
        dependencies: [
          "foundation-registry",
          "utility-library",
          "user-authentication",
          "configuration-manager",
        ],
      }
    );

    // 🎉 STARTUP COMPLETE
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
    const user = getAuthenticatedUser();
    const pageInfo = getCurrentPageInfo();
    const memberCount = getGraphMembersList().length;

    console.log("✅ Navigation + Protection (REWRITTEN) loaded successfully!");
    console.log("🔧 FIXED: Uses Directory:: as ONLY source of truth");
    console.log("🔧 FIXED: No pattern matching - direct lookup only");
    console.log("🔧 FIXED: Fails safe (allows editing) when uncertain");
    console.log(`🧭 Current page: ${pageInfo.title || "Unknown"}`);
    console.log(`👤 User: ${user?.displayName || "Unknown"}`);
    console.log(`📋 Protecting pages for ${memberCount} graph members`);
    console.log('💡 Try: Cmd+P → "Nav: Test Protection System"');

    // Show protection status for current page
    if (pageInfo.protection.isProtected) {
      console.log(
        `🛡️ Current page is protected by ${pageInfo.protection.pageOwner}`
      );
    } else {
      console.log("🔓 Current page is not protected (not a user page)");
    }

    // Show smart landing status
    const redirected =
      sessionStorage.getItem("roam_landing_redirected") === "true";
    console.log(
      `🚀 Smart landing: ${
        redirected ? "Already processed this session" : "Active"
      }`
    );
  },

  onunload: () => {
    console.log("🧭 Navigation + Protection unloading...");

    // Remove any protection modals
    const modals = document.querySelectorAll(
      ".roam-extension-suite-protection-modal"
    );
    modals.forEach((modal) => modal.remove());

    console.log("✅ Navigation + Protection cleanup complete!");
  },
};
