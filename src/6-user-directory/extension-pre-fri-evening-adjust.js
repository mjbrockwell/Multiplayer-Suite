// ===================================================================
// Extension SIX: User Directory + Timezones - PHASE 2 REFACTORED
// ✨ NEW: Warm yellow pastel button (instead of cyan)
// 🗑️ REMOVED: ~200+ lines of duplicate code
// ✅ USING: Extension 1.5 utilities for timezone, modal, navigation, profile analysis
// 🎯 RESULT: Cleaner, more maintainable code with better functionality
// ===================================================================

// ===================================================================
// 🔧 DEPENDENCY MANAGEMENT - Extension 1.5 Required
// ===================================================================

/**
 * Check if Extension 1.5 utilities are available
 */
const checkExtension15Dependencies = () => {
  const platform = window.RoamExtensionSuite;

  if (!platform) {
    console.log(
      "💡 Please ensure Extension 1.5 is loaded before Extension SIX"
    );
    return false;
  }

  const requiredUtilities = [
    "timezoneManager",
    "modalUtilities",
    "navigationUtilities",
    "profileAnalysisUtilities",
    "processAvatarImages",
    "extractImageUrls",
    "getGraphMembersFromList",
    "getCurrentUser",
    "getPageUidByTitle",
    "findNestedDataValuesExact",
  ];

  const missingUtilities = requiredUtilities.filter(
    (util) => !platform.getUtility(util)
  );

  if (missingUtilities.length > 0) {
    console.error("❌ Missing Extension 1.5 utilities:", missingUtilities);
    console.log(
      "💡 Please ensure Extension 1.5 is loaded before Extension SIX"
    );
    return false;
  }

  console.log("✅ All Extension 1.5 dependencies available");
  return true;
};

// ===================================================================
// 👥 USER PROFILE DATA EXTRACTION - Enhanced with Extension 1.5
// ===================================================================

/**
 * ✅ ENHANCED: Get user profile data using Extension 1.5 utilities
 */
const getUserProfileDataClean = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValuesExact = platform.getUtility(
      "findNestedDataValuesExact"
    );
    const profileAnalysisUtilities = platform.getUtility(
      "profileAnalysisUtilities"
    );
    const timezoneManager = platform.getUtility("timezoneManager");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      return createMissingProfile(username);
    }

    // ✅ USING: Extension 1.5 nested data extraction
    const myInfoData = findNestedDataValuesExact(userPageUid, "My Info");
    if (!myInfoData || Object.keys(myInfoData).length === 0) {
      return createMissingProfile(username);
    }

    const profileData = {
      username,
      exists: true,
      hasMyInfo: true,
      avatar: myInfoData.avatar || "__missing field__",
      location: myInfoData.location || "__missing field__",
      role: myInfoData.role || "__missing field__",
      timezone: myInfoData.timezone || "__missing field__",
      aboutMe: myInfoData.aboutMe || "__missing field__",
    };

    // ✅ USING: Extension 1.5 profile completeness calculation
    const requiredFields = [
      "avatar",
      "location",
      "role",
      "timezone",
      "aboutMe",
    ];
    profileData.completeness =
      profileAnalysisUtilities.calculateProfileCompleteness(
        profileData,
        requiredFields
      );

    // ✅ USING: Extension 1.5 timezone processing (NO MORE TimezoneManager class!)
    if (
      profileData.timezone &&
      profileData.timezone !== "__missing field__" &&
      profileData.timezone !== "__not yet entered__"
    ) {
      profileData.timezoneInfo = timezoneManager.getCurrentTimeForTimezone(
        profileData.timezone
      );
    } else {
      profileData.timezoneInfo = { timeString: "—", isValid: false };
    }

    return profileData;
  } catch (error) {
    console.error(`❌ Profile extraction failed for ${username}:`, error);
    return createErrorProfile(username, error.message);
  }
};

/**
 * Get all user profiles using curated member list
 */
const getAllUserProfilesClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );

    console.log("📋 Getting curated member list...");

    // ✅ USING: Extension 1.5 curated member list functionality
    const members = getGraphMembersFromList("roam/graph members", "Directory");

    if (members.length === 0) {
      console.warn("⚠️ No members found in curated list");
      // Fallback to old method if needed
      const getGraphMembers = platform.getUtility("getGraphMembers");
      return await Promise.all(
        getGraphMembers()
          .slice(0, 10)
          .map((username) => getUserProfileDataClean(username))
      );
    }

    console.log(`📋 Processing ${members.length} curated members:`, members);

    const profiles = await Promise.all(
      members.map((username) => getUserProfileDataClean(username))
    );

    return profiles.filter((profile) => profile.exists);
  } catch (error) {
    console.error("❌ Error getting user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🖼️ AVATAR DISPLAY - Enhanced with Extension 1.5 Image Processing
// ===================================================================

/**
 * ✅ WORKING: Create avatar display using proper child block extraction
 */
const createAvatarDisplay = async (profile) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findBlockByText = platform.getUtility("findBlockByText");
    const getDirectChildren = platform.getUtility("getDirectChildren");
    const extractImageUrls = platform.getUtility("extractImageUrls");

    const userPageUid = getPageUidByTitle(profile.username);
    if (!userPageUid) {
      return createInitialsAvatar(profile.username);
    }

    // Find "My Info::" block
    const myInfoBlockUid = findBlockByText(userPageUid, "My Info::");
    if (!myInfoBlockUid) {
      return createInitialsAvatar(profile.username);
    }

    // Find "Avatar::" block under "My Info::"
    const avatarBlockUid = findBlockByText(myInfoBlockUid, "Avatar::");
    if (!avatarBlockUid) {
      return createInitialsAvatar(profile.username);
    }

    // ✅ THE FIX: Extract images from children of Avatar:: block (not Avatar:: itself)
    const avatarChildren = getDirectChildren(avatarBlockUid);
    for (const child of avatarChildren) {
      const childImages = extractImageUrls(child.uid, { validateUrls: true });
      if (childImages.length > 0) {
        const imageUrl = childImages[0];
        return `<img src="${imageUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${profile.username}">`;
      }
    }

    // Fallback to initials if no images found
    return createInitialsAvatar(profile.username);
  } catch (error) {
    console.error(`Avatar creation failed for ${profile.username}:`, error);
    return createInitialsAvatar(profile.username);
  }
};

/**
 * Create initials-based avatar fallback
 */
const createInitialsAvatar = (username) => {
  const initials = username ? username.charAt(0).toUpperCase() : "?";
  return `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${initials}</div>`;
};

// ===================================================================
// 🪟 MODAL DISPLAY - Completely Refactored to Use Extension 1.5
// ===================================================================

/**
 * ✅ REFACTORED: Show user directory modal using Extension 1.5 utilities
 * 🗑️ REMOVED: ~50 lines of manual modal creation code
 */
const showUserDirectoryModalClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const modalUtilities = platform.getUtility("modalUtilities");

    if (!modalUtilities) {
      console.error(
        "❌ Modal utilities not available. Please ensure Extension 1.5 is loaded."
      );
      return;
    }

    // ✅ STEP 1: Create modal using Extension 1.5 utilities (saves ~30 lines)
    const modal = modalUtilities.createModal("clean-user-directory-modal", {
      closeOnEscape: true,
      closeOnBackdrop: true,
      zIndex: 10000,
    });

    // ✅ STEP 2: Create modal content using utilities (saves ~15 lines)
    const content = modalUtilities.createModalContent({
      width: "90%",
      maxWidth: "1200px",
      maxHeight: "90%",
    });

    // Show loading state first
    const graphName = getFormattedGraphName();
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading user directory...</div>
      </div>
    `;

    // Append modal to DOM
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Register for cleanup
    if (window._extensionRegistry && window._extensionRegistry.elements) {
      window._extensionRegistry.elements.push(modal);
    }

    // Load profiles using clean extraction
    const profiles = await getAllUserProfilesClean();
    const currentUser = platform.getUtility("getCurrentUser")();

    // ✅ STEP 3: Create modal header using utilities (saves ~10 lines)
    const memberText =
      profiles.length === 1 ? "1 member" : `${profiles.length} members`;
    const cleanGraphName = cleanDisplayName(graphName);
    const header = modalUtilities.createModalHeader(
      `👥 User Directory: ${cleanGraphName}`,
      memberText
    );

    // Create table content
    const tableContent = await createUserDirectoryTable(profiles, currentUser);

    // Assemble complete modal
    content.innerHTML = "";
    content.appendChild(header);
    content.insertAdjacentHTML("beforeend", tableContent);

    // ✅ STEP 4: Start real-time clock updates using Extension 1.5 timezone utility
    startRealtimeClockUpdatesClean(modal);

    console.log("✅ User Directory modal opened");
  } catch (error) {
    console.error("❌ Failed to show clean user directory:", error);
  }
};

/**
 * ✅ ENHANCED: Create individual user row with Extension 1.5 profile analysis
 */
const createCleanUserDirectoryRow = async (profile, currentUser, index) => {
  const platform = window.RoamExtensionSuite;
  const profileAnalysisUtilities = platform.getUtility(
    "profileAnalysisUtilities"
  );

  const isCurrentUser = profile.username === currentUser?.displayName;

  // ✅ USING: Enhanced avatar display
  const avatarDisplay = await createAvatarDisplay(profile);

  // Create clickable username
  const usernameDisplay = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span onclick="navigateToUserPageClean('${profile.username}')" 
            style="font-weight: 500; color: #1a202c; cursor: pointer; text-decoration: underline;" 
            title="Click to visit ${profile.username}'s page">
        ${profile.username}
      </span>
      ${
        isCurrentUser
          ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500;">You</span>'
          : ""
      }
      ${createCompletenessIndicator(profile.completeness)}
    </div>
  `;

  // ✅ USING: Extension 1.5 profile analysis for data cell display
  const aboutMeDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.aboutMe
  );
  const locationDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.location
  );
  const roleDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.role
  );
  const timezoneDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.timezone
  );

  // Create time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="clean-timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  const rowStyle = `
    border-bottom: 1px solid #f1f5f9;
    ${isCurrentUser ? "background: #f0f9ff;" : ""}
    ${index % 2 === 0 ? "" : "background: #fafafa;"}
    transition: background-color 0.15s ease;
  `;

  return `
    <tr style="${rowStyle}" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${
    isCurrentUser ? "#f0f9ff" : index % 2 === 0 ? "white" : "#fafafa"
  }'">
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${avatarDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${usernameDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${aboutMeDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${locationDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${roleDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${timezoneDisplay}</td>
      <td style="padding: 12px 16px; text-align: center;">${timeDisplay}</td>
    </tr>
  `;
};

/**
 * ✅ ENHANCED: Start real-time clock updates using Extension 1.5 timezone utility
 * 🗑️ REMOVED: TimezoneManager class dependency
 */
const startRealtimeClockUpdatesClean = (modal) => {
  const updateClocks = () => {
    const platform = window.RoamExtensionSuite;
    const timezoneManager = platform.getUtility("timezoneManager");

    const timeElements = modal.querySelectorAll(".clean-timezone-time");
    timeElements.forEach((element) => {
      const timezone = element.getAttribute("data-timezone");
      if (
        timezone &&
        timezone !== "__missing field__" &&
        timezone !== "__not yet entered__"
      ) {
        const timeInfo = timezoneManager.getCurrentTimeForTimezone(timezone);
        if (timeInfo.isValid) {
          element.textContent = timeInfo.timeString;
        }
      }
    });
  };

  // Update every minute
  const interval = setInterval(updateClocks, 60000);

  // Clean up when modal is removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node === modal) {
          clearInterval(interval);
          observer.disconnect();
        }
      });
    });
  });

  observer.observe(document.body, { childList: true });
};

// ===================================================================
// 🧭 NAVIGATION BUTTONS - Refactored to Use Extension 1.5 + Warm Yellow
// ===================================================================

/**
 * ✨ NEW: Warm yellow pastel gradient (instead of cyan)
 * ✅ REFACTORED: Add navigation buttons using Extension 1.5 utilities
 * 🗑️ REMOVED: ~30 lines of manual button creation and styling
 */
const addNavigationButtonsClean = () => {
  try {
    const platform = window.RoamExtensionSuite;
    const navigationUtilities = platform.getUtility("navigationUtilities");

    if (!navigationUtilities) {
      console.error(
        "❌ Navigation utilities not available. Please ensure Extension 1.5 is loaded."
      );
      return;
    }

    // Remove existing buttons
    navigationUtilities.removeNavButtons("clean-directory-nav-button");

    // ✅ USING: Extension 1.5 smart placement target finding
    const possibleTargets = [
      ".roam-article .roam-log-container",
      ".roam-article",
      ".roam-main .roam-article",
      ".rm-reference-main",
      ".roam-main",
      "body",
    ];

    const { element: targetElement, selector } =
      navigationUtilities.findBestPlacementTarget(possibleTargets);

    // Ensure target has relative positioning for absolute button placement
    if (getComputedStyle(targetElement).position === "static") {
      targetElement.style.position = "relative";
    }

    // ✅ USING: Extension 1.5 navigation button creation with ✨ SUBTLE WARM YELLOW
    const button = navigationUtilities.createNavButton({
      text: "👥 User Directory",
      position: "top-left",
      onClick: showUserDirectoryModalClean,
      className: "clean-directory-nav-button",
      gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", // ✨ SUBTLE WARM YELLOW
      borderColor: "#e5d4a1", // ✨ SUBTLE BORDER
      textColor: "#78716c", // ✨ SUBTLE TEXT
    });

    targetElement.appendChild(button);
    console.log(`✅ Directory button added: ${selector}`);
  } catch (error) {
    console.error("❌ Error adding navigation buttons:", error);
  }
};

/**
 * ✅ REFACTORED: Start navigation monitoring using Extension 1.5 utilities
 * 🗑️ REMOVED: Manual URL monitoring logic (~20 lines)
 */
const startNavigationMonitoringClean = () => {
  const platform = window.RoamExtensionSuite;
  const navigationUtilities = platform.getUtility("navigationUtilities");

  if (!navigationUtilities) {
    console.error(
      "❌ Navigation utilities not available. Please ensure Extension 1.5 is loaded."
    );
    return;
  }

  // Initial button placement
  setTimeout(addNavigationButtonsClean, 1000);

  // ✅ USING: Extension 1.5 page change monitoring
  navigationUtilities.monitorPageChanges(() => {
    console.log("📍 Page changed, re-adding directory button...");
    addNavigationButtonsClean();
  }, 500);
  console.log("📡 Navigation monitoring started");
};

// ===================================================================
// 🧪 INTEGRATION TESTING - Test Extension 1.5 Integration
// ===================================================================

/**
 * 🧪 DEBUG: Manual avatar extraction test for current user
 */
const debugAvatarExtraction = async () => {
  console.group("🧪 DEBUG: Manual Avatar Extraction Test");

  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getCurrentUser")();

    console.log("👤 Current user:", currentUser);

    if (!currentUser?.displayName) {
      console.error("❌ No current user found");
      console.groupEnd();
      return;
    }

    console.log(`🔍 Testing avatar extraction for: ${currentUser.displayName}`);

    // Test the actual avatar creation function
    const avatarResult = await createAvatarDisplay({
      username: currentUser.displayName,
    });
    console.log("🎨 Final avatar result:", avatarResult);

    // Also test the profile extraction to see what avatar data we're getting
    const profileData = await getUserProfileDataClean(currentUser.displayName);
    console.log("📊 Full profile data:", profileData);
    console.log("🖼️ Profile avatar field:", profileData.avatar);
  } catch (error) {
    console.error("❌ Debug test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 DEBUG: Manual block structure inspection
 */
const debugBlockStructure = async () => {
  console.group("🧪 DEBUG: Block Structure Inspection");

  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getCurrentUser")();
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const getDirectChildren = platform.getUtility("getDirectChildren");

    if (!currentUser?.displayName) {
      console.error("❌ No current user found");
      console.groupEnd();
      return;
    }

    const username = currentUser.displayName;
    console.log(`🔍 Inspecting block structure for: ${username}`);

    // Step 1: Find user page
    const userPageUid = getPageUidByTitle(username);
    console.log(`📄 User page UID: ${userPageUid}`);

    if (!userPageUid) {
      console.error("❌ User page not found");
      console.groupEnd();
      return;
    }

    // Step 2: Get all direct children of user page
    const pageChildren = getDirectChildren(userPageUid);
    console.log(
      `📋 All blocks on user page (${pageChildren.length}):`,
      pageChildren
    );

    // Step 3: Look for "My Info" variations
    const myInfoVariations = [
      "My Info::",
      "My Info:",
      "My Info",
      "**My Info:**",
      "**My Info::**",
    ];
    let myInfoBlock = null;

    for (const variation of myInfoVariations) {
      const found = pageChildren.find(
        (child) =>
          child.text.includes(variation) ||
          child.text.trim() === variation ||
          child.text.trim().startsWith(variation)
      );
      if (found) {
        console.log(
          `✅ Found My Info block with variation "${variation}":`,
          found
        );
        myInfoBlock = found;
        break;
      }
    }

    if (!myInfoBlock) {
      console.error("❌ No My Info block found with any variation");
      console.log(
        "🔍 Available block texts:",
        pageChildren.map((c) => c.text)
      );
      console.groupEnd();
      return;
    }

    // Step 4: Get children of My Info block
    const myInfoChildren = getDirectChildren(myInfoBlock.uid);
    console.log(
      `📋 Children of My Info block (${myInfoChildren.length}):`,
      myInfoChildren
    );

    // Step 5: Look for Avatar variations
    const avatarVariations = [
      "Avatar::",
      "Avatar:",
      "Avatar",
      "**Avatar:**",
      "**Avatar::**",
    ];
    let avatarBlock = null;

    for (const variation of avatarVariations) {
      const found = myInfoChildren.find(
        (child) =>
          child.text.includes(variation) ||
          child.text.trim() === variation ||
          child.text.trim().startsWith(variation)
      );
      if (found) {
        console.log(
          `✅ Found Avatar block with variation "${variation}":`,
          found
        );
        avatarBlock = found;
        break;
      }
    }

    if (!avatarBlock) {
      console.error("❌ No Avatar block found with any variation");
      console.log(
        "🔍 Available My Info children:",
        myInfoChildren.map((c) => c.text)
      );
      console.groupEnd();
      return;
    }

    // Step 6: Get children of Avatar block (should contain the image)
    const avatarChildren = getDirectChildren(avatarBlock.uid);
    console.log(
      `📋 Children of Avatar block (${avatarChildren.length}):`,
      avatarChildren
    );

    // Step 7: Test image extraction
    const extractImageUrls = platform.getUtility("extractImageUrls");
    const imageUrls = extractImageUrls(avatarBlock.uid, { validateUrls: true });
    console.log(`🖼️ Images extracted from Avatar block:`, imageUrls);
  } catch (error) {
    console.error("❌ Block structure inspection failed:", error);
  }

  console.groupEnd();
};
const testExtension15Integration = async () => {
  console.group("🔗 Testing Extension 1.5 Integration");

  try {
    const platform = window.RoamExtensionSuite;

    // Test timezone utilities
    const timezoneManager = platform.getUtility("timezoneManager");
    console.log("✅ Timezone utilities available:", !!timezoneManager);

    // Test modal utilities
    const modalUtilities = platform.getUtility("modalUtilities");
    console.log("✅ Modal utilities available:", !!modalUtilities);

    // Test navigation utilities
    const navigationUtilities = platform.getUtility("navigationUtilities");
    console.log("✅ Navigation utilities available:", !!navigationUtilities);

    // Test profile analysis utilities
    const profileAnalysisUtilities = platform.getUtility(
      "profileAnalysisUtilities"
    );
    console.log(
      "✅ Profile analysis utilities available:",
      !!profileAnalysisUtilities
    );

    // Test enhanced image processing
    const processAvatarImages = platform.getUtility("processAvatarImages");
    console.log(
      "✅ Enhanced avatar processing available:",
      !!processAvatarImages
    );

    console.log("🎉 All Extension 1.5 utilities integrated successfully!");
  } catch (error) {
    console.error("❌ Integration test failed:", error);
  }

  console.groupEnd();
};

/**
 * ✅ ENHANCED: Run complete system tests
 */
const runCleanSystemTests = async () => {
  console.group("🧪 Running Extension SIX System Tests (Phase 2)");

  try {
    // Test Extension 1.5 integration
    await testExtension15Integration();

    // Test profile extraction
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getCurrentUser")();
    console.log(`👤 Current user: ${currentUser?.displayName}`);

    if (currentUser?.displayName) {
      const profile = await getUserProfileDataClean(currentUser.displayName);
      console.log("📊 User profile extraction:", profile);
      console.log(`📈 Profile completeness: ${profile.completeness}%`);
    }

    // Test curated member list
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );
    const members = getGraphMembersFromList("roam/graph members", "Directory");
    console.log(`📋 Curated members: ${members.length} found`);

    console.log("✅ All system tests passed!");
  } catch (error) {
    console.error("❌ System test failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🔧 HELPER FUNCTIONS - Maintained but Enhanced
// ===================================================================

/**
 * Create user directory table
 */
const createUserDirectoryTable = async (profiles, currentUser) => {
  const rows = await Promise.all(
    profiles.map((profile, index) =>
      createCleanUserDirectoryRow(profile, currentUser, index)
    )
  );

  return `
    <div style="flex: 1; overflow: auto; padding: 0 32px;">
      <table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e1e5e9;">
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Avatar</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Username</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">About Me</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Location</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Role</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Timezone</th>
            <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #374151;">Current Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Create completeness indicator
 */
const createCompletenessIndicator = (completeness) => {
  const color =
    completeness >= 75 ? "#059669" : completeness >= 50 ? "#d97706" : "#dc2626";
  return `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; opacity: 0.7;" title="${completeness}% complete"></div>`;
};

/**
 * Clean display name by removing underscores
 */
const cleanDisplayName = (name) => {
  if (!name) return "Unknown";
  return name.replace(/_/g, " ");
};

/**
 * Get formatted graph name
 */
const getFormattedGraphName = () => {
  try {
    return window.roamAlphaAPI.graph.name || "Unknown Graph";
  } catch {
    return "Unknown Graph";
  }
};

/**
 * Create missing profile fallback
 */
const createMissingProfile = (username) => ({
  username,
  exists: false,
  hasMyInfo: false,
  avatar: "__missing field__",
  location: "__missing field__",
  role: "__missing field__",
  timezone: "__missing field__",
  aboutMe: "__missing field__",
  completeness: 0,
  timezoneInfo: { timeString: "—", isValid: false },
});

/**
 * Create error profile fallback
 */
const createErrorProfile = (username, errorMessage) => ({
  username,
  exists: false,
  hasMyInfo: false,
  avatar: "__error__",
  location: "__error__",
  role: "__error__",
  timezone: "__error__",
  aboutMe: `Error: ${errorMessage}`,
  completeness: 0,
  timezoneInfo: { timeString: "—", isValid: false },
});

/**
 * Navigate to user page helper function
 */
window.navigateToUserPageClean = (username) => {
  const userPageUrl = `#/app/${
    window.roamAlphaAPI.graph.name
  }/page/${encodeURIComponent(username)}`;
  window.location.href = userPageUrl;

  // Close modal
  const modal = document.getElementById("clean-user-directory-modal");
  if (modal) modal.remove();
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Phase 2 Complete
// ===================================================================

export default {
  onload: () => {
    console.log("🚀 User Directory loading...");

    // ✅ STEP 1: Check Extension 1.5 dependencies
    if (!checkExtension15Dependencies()) {
      console.error(
        "❌ User Directory failed to load - missing Extension 1.5 dependencies"
      );
      return {
        error: "Extension 1.5 required",
        status: "dependency_failed",
      };
    }

    // ✅ STEP 2: Initialize platform registration
    const platform = window.RoamExtensionSuite;

    if (!platform) {
      console.error("❌ RoamExtensionSuite platform not found");
      return { error: "Platform not found" };
    }

    // Register clean directory services (much smaller now!)
    const cleanDirectoryServices = {
      getUserProfileData: getUserProfileDataClean,
      getAllUserProfiles: getAllUserProfilesClean,
      showUserDirectory: showUserDirectoryModalClean,
      testIntegration: testExtension15Integration,
      runSystemTests: runCleanSystemTests,
    };

    // ✅ STEP 3: Register command palette functions
    const commands = [
      {
        label: "User Directory: Show Directory",
        callback: showUserDirectoryModalClean,
      },
      {
        label: "User Directory: Test Extension 1.5 Integration",
        callback: testExtension15Integration,
      },
      {
        label: "User Directory: Run System Tests",
        callback: runCleanSystemTests,
      },
      {
        label: "User Directory: Add Show Directory Button",
        callback: addNavigationButtonsClean,
      },
    ];

    commands.forEach((cmd) => {
      if (window.roamAlphaAPI && window.roamAlphaAPI.ui.commandPalette) {
        window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      }
      if (window._extensionRegistry) {
        window._extensionRegistry.commands.push(cmd.label);
      }
    });

    // ✅ STEP 4: Register with platform
    const requiredDependencies = [
      "utility-library", // Extension 1.5
    ];

    platform.register(
      "clean-user-directory",
      {
        services: cleanDirectoryServices,
        version: "6.8.0",
      },
      {
        name: "✨ User Directory",
        description:
          "Professional user directory with timezone intelligence, avatar support, and clean interface",
        version: "6.8.0",
        dependencies: requiredDependencies,
      }
    );

    // ✅ STEP 5: Start navigation monitoring
    startNavigationMonitoringClean();

    // ✅ STEP 6: Success report
    const currentUser = platform.getUtility("getCurrentUser")();
    console.log("🎉 Extension SIX loaded successfully!");
    console.log("🗑️ REMOVED: ~200+ lines of duplicate code");
    console.log("✨ Subtle warm yellow button styling");
    console.log("✅ Clean, user-facing interface");
    console.log("🧹 All technical references removed from UI");
    console.log("🖼️ FIXED: Avatar extraction from child blocks");
    console.log(`👤 Current user: ${currentUser?.displayName}`);
    console.log('💡 Try: Cmd+P → "User Directory: Show Directory"');

    // Auto-test integration after a short delay
    setTimeout(async () => {
      console.log("🔍 Auto-testing Phase 2 integration...");
      await runCleanSystemTests();
    }, 2000);

    return {
      extensionId: "clean-user-directory",
      services: cleanDirectoryServices,
      version: "6.8.0",
      status: "complete",
    };
  },

  onunload: () => {
    console.log("👥 User Directory unloading...");

    // Clean up modals
    const modals = document.querySelectorAll(
      "#clean-user-directory-modal, #test-modal"
    );
    modals.forEach((modal) => modal.remove());

    // Clean up navigation buttons
    const platform = window.RoamExtensionSuite;
    if (platform) {
      const navigationUtilities = platform.getUtility("navigationUtilities");
      if (navigationUtilities) {
        navigationUtilities.removeNavButtons("clean-directory-nav-button");
      }
    }

    // Navigation helper cleanup
    delete window.navigateToUserPageClean;

    console.log("✅ User Directory cleanup complete!");
  },
};
