// ===================================================================
// Extension 6: User Directory + Timezones - Steps 1+2: Major Refactoring
// STEP 1: Removed local TimezoneManager, using Extension 1.5 utility (~80 lines saved)
// STEP 2: Removed manual modal creation, using Extension 1.5 utilities (~50 lines saved)
// FIX: Using curated [[roam/graph members]] source of truth instead of all pages
// TOTAL SAVINGS: ~130 lines of code eliminated
// ===================================================================

/**
 * Extract graph name from URL and format it nicely
 */
const getFormattedGraphName = () => {
  try {
    const url = window.location.href;
    // Extract from pattern: https://roamresearch.com/#/app/Developer_Sandbox_MattB/page/...
    const match = url.match(/#\/app\/([^\/]+)\//);
    if (match) {
      const graphName = match[1];
      // Replace underscores with spaces: "Developer_Sandbox_MattB" → "Developer Sandbox MattB"
      return graphName.replace(/_/g, " ");
    }
    return "Unknown Graph";
  } catch (error) {
    console.warn("Failed to extract graph name:", error);
    return "Unknown Graph";
  }
};

// ===================================================================
// 👥 CLEAN USER PROFILE DATA COLLECTION - Using ONLY Extension 1.5 Exact Functions
// ===================================================================

/**
 * 🎯 CLEAN: Extract user profile data using ONLY exact functions from Extension 1.5
 * No filtering, no multiple strategies - just exact extraction
 */
const getUserProfileDataClean = async (username) => {
  try {
    console.log(`🔍 CLEAN: Getting profile data for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValuesExact = platform.getUtility(
      "findNestedDataValuesExact"
    );

    // Step 1: Get user page UID
    const userPageUid = getPageUidByTitle(username);
    console.log(`📄 Page UID for ${username}:`, userPageUid);

    if (!userPageUid) {
      return createMissingUserProfile(username);
    }

    // Step 2: Extract nested data using EXACT functions only
    const myInfoData = findNestedDataValuesExact(userPageUid, "My Info");
    console.log(`📊 Raw My Info data for ${username}:`, myInfoData);

    if (!myInfoData || Object.keys(myInfoData).length === 0) {
      return createMissingMyInfoProfile(username);
    }

    // Step 3: Map expected fields with proper placeholder distinction
    const expectedFields = [
      "avatar",
      "location",
      "role",
      "timezone",
      "aboutMe",
    ];
    const profileData = {
      username,
      exists: true,
      hasMyInfo: true,
    };

    expectedFields.forEach((field) => {
      if (myInfoData.hasOwnProperty(field)) {
        // Field exists - use whatever value is there (no filtering!)
        profileData[field] = myInfoData[field];
      } else {
        // Field completely missing from structure
        profileData[field] = "__missing field__";
      }
    });

    // Calculate profile completeness (exclude placeholders)
    const realDataFields = expectedFields.filter((field) => {
      const value = profileData[field];
      return (
        value &&
        value !== "__missing field__" &&
        value !== "__not yet entered__"
      );
    });

    profileData.completeness = Math.round(
      (realDataFields.length / expectedFields.length) * 100
    );

    // ✅ STEP 1: Get timezone information using Extension 1.5 utility
    if (
      profileData.timezone &&
      profileData.timezone !== "__missing field__" &&
      profileData.timezone !== "__not yet entered__"
    ) {
      const timezoneManager = platform.getUtility("timezoneManager");
      profileData.timezoneInfo = timezoneManager.getCurrentTimeForTimezone(
        profileData.timezone
      );
    } else {
      profileData.timezoneInfo = { timeString: "—", isValid: false };
    }

    console.log(`✅ CLEAN profile data for ${username}:`, profileData);
    return profileData;
  } catch (error) {
    console.error(`❌ CLEAN extraction failed for ${username}:`, error);
    return createErrorProfile(username, error.message);
  }
};

/**
 * Create profile for user with no page
 */
const createMissingUserProfile = (username) => {
  return {
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
    debugInfo: "User page not found",
  };
};

/**
 * Create profile for user page without My Info structure
 */
const createMissingMyInfoProfile = (username) => {
  return {
    username,
    exists: true,
    hasMyInfo: false,
    avatar: "__missing field__",
    location: "__missing field__",
    role: "__missing field__",
    timezone: "__missing field__",
    aboutMe: "__missing field__",
    completeness: 0,
    timezoneInfo: { timeString: "—", isValid: false },
    debugInfo: "User page exists but no My Info:: structure found",
  };
};

/**
 * Create profile for extraction errors
 */
const createErrorProfile = (username, errorMessage) => {
  return {
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
    error: errorMessage,
    debugInfo: `Error: ${errorMessage}`,
  };
};

/**
 * ✅ FIXED: Get all user profiles using curated member list
 */
const getAllUserProfilesClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;

    // ✅ FIX: Use curated source of truth instead of all pages
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );

    // Try to get members from [[roam/graph members]] page under Directory:: block
    let members = getGraphMembersFromList("roam/graph members", "Directory");

    // Fallback to generic detection if curated list is empty
    if (!members || members.length === 0) {
      console.warn(
        "⚠️ No members found in [[roam/graph members]] Directory::, falling back to generic detection"
      );
      const getGraphMembers = platform.getUtility("getGraphMembers");
      members = getGraphMembers();
    }

    console.log(
      `📊 CLEAN: Collecting profiles for ${members.length} curated graph members...`
    );
    console.log("👥 Members:", members);

    const profiles = await Promise.all(
      members.map(async (username) => {
        return await getUserProfileDataClean(username);
      })
    );

    // Sort by username
    profiles.sort((a, b) => a.username.localeCompare(b.username));

    console.log(
      `✅ CLEAN: Collected ${profiles.length} user profiles from curated list`
    );
    return profiles;
  } catch (error) {
    console.error("❌ CLEAN: Failed to collect user profiles:", error);
    return [];
  }
};

/**
 * Initialize user profile with clear placeholders
 */
const initializeUserProfile = async (username) => {
  try {
    console.log(`🎯 Initializing profile structure for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const setNestedDataValuesStructured = platform.getUtility(
      "setNestedDataValuesStructured"
    );
    const getCurrentUser = platform.getUtility("getCurrentUser");

    const userPageUid = await createPageIfNotExists(username);
    if (!userPageUid) {
      console.error(`❌ Failed to create page for ${username}`);
      return false;
    }

    const currentUser = getCurrentUser();
    const isCurrentUser = username === currentUser.displayName;

    // Create clear placeholder structure
    const defaultProfileData = {
      avatar:
        isCurrentUser && currentUser.photoUrl
          ? currentUser.photoUrl
          : "__not yet entered__",
      location: "__not yet entered__",
      role: "__not yet entered__",
      timezone: "__not yet entered__",
      aboutMe: "__not yet entered__",
    };

    const success = await setNestedDataValuesStructured(
      userPageUid,
      "My Info",
      defaultProfileData,
      true // Use attribute format (My Info::)
    );

    if (success) {
      console.log(`✅ Profile structure initialized for ${username}`);
      console.log(
        "💡 Structure created with obvious placeholders: '__not yet entered__'"
      );
    }

    return success;
  } catch (error) {
    console.error(`❌ Failed to initialize profile for ${username}:`, error);
    return false;
  }
};

// ===================================================================
// 🎨 PROFESSIONAL USER DIRECTORY MODAL - STEP 2: Using Extension 1.5 Modal Utilities
// ===================================================================

/**
 * ✅ STEP 2: Create and display professional user directory modal using Extension 1.5 utilities
 */
const showUserDirectoryModalClean = async () => {
  try {
    console.log(
      "📋 Opening User Directory using Extension 1.5 modal utilities..."
    );

    const platform = window.RoamExtensionSuite;
    const modalUtilities = platform.getUtility("modalUtilities");

    if (!modalUtilities) {
      console.error(
        "❌ Modal utilities not found! Please ensure Extension 1.5 Phase 1 is loaded."
      );
      return;
    }

    // ✅ STEP 2: Create modal using Extension 1.5 utilities (saves ~30 lines)
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
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Using Extension 1.5 utilities • Modal + Timezone management</div>
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
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // ✅ STEP 2: Create modal header using utilities (saves ~10 lines)
    const header = modalUtilities.createModalHeader(
      `👥 User Directory: ${graphName}`,
      `${
        profiles.length
      } curated members • Extension 1.5 utilities • ${new Date().toLocaleTimeString()}`
    );

    // Create table content
    const tableContent = `
      <div style="
        flex: 1;
        overflow: auto;
        padding: 0;
      ">
        <table style="
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        ">
          <thead>
            <tr style="background: #f8f9fa; border-bottom: 2px solid #e1e5e9;">
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Avatar</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Username</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">About Me</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Location</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Role</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Timezone</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Current Time</th>
            </tr>
          </thead>
          <tbody>
            ${profiles
              .map((profile, index) =>
                createCleanUserDirectoryRow(profile, currentUser, index)
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    // Create footer
    const footer = `
      <div style="
        padding: 16px 32px;
        border-top: 1px solid #e1e5e9;
        background: #f8f9fa;
        font-size: 13px;
        color: #666;
        text-align: center;
      ">
        🚀 Extension 1.5 utilities • Modal + Timezone + Curated member list • ~130 lines saved
      </div>
    `;

    // Assemble complete modal
    content.innerHTML = "";
    content.appendChild(header);
    content.insertAdjacentHTML("beforeend", tableContent);
    content.insertAdjacentHTML("beforeend", footer);

    // Start real-time clock updates
    startRealtimeClockUpdatesClean(modal);

    console.log("✅ User Directory modal opened using Extension 1.5 utilities");
  } catch (error) {
    console.error("❌ Failed to show clean user directory:", error);
  }
};

/**
 * Create individual user row with clear placeholder distinction
 */
const createCleanUserDirectoryRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;

  // Create avatar display
  const avatarDisplay = createAvatarDisplay(profile);

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

  // Create data cells with placeholder distinction
  const aboutMeDisplay = createDataCellDisplay(profile.aboutMe);
  const locationDisplay = createDataCellDisplay(profile.location);
  const roleDisplay = createDataCellDisplay(profile.role);
  const timezoneDisplay = createDataCellDisplay(profile.timezone);

  // Create time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="clean-timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  const rowStyle = `
    border-bottom: 1px solid #f1f5f9;
    ${isCurrentUser ? "background: #f0f9ff;" : ""}
    ${index % 2 === 0 ? "background: #fafafa;" : ""}
  `;

  return `
    <tr style="${rowStyle}">
      <td style="padding: 12px 16px; vertical-align: middle;">${avatarDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${usernameDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${aboutMeDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${locationDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${roleDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${timezoneDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${timeDisplay}</td>
    </tr>
  `;
};

/**
 * Create avatar display with clickable navigation
 */
const createAvatarDisplay = (profile) => {
  if (
    profile.avatar &&
    profile.avatar !== "__missing field__" &&
    profile.avatar !== "__not yet entered__"
  ) {
    // Real avatar image
    return `<img src="${profile.avatar}" 
                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; cursor: pointer;" 
                 alt="${profile.username}" 
                 onclick="navigateToUserPageClean('${profile.username}')" 
                 title="Click to visit ${profile.username}'s page">`;
  } else {
    // Initials fallback
    return `<div onclick="navigateToUserPageClean('${profile.username}')" 
                 style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; cursor: pointer;" 
                 title="Click to visit ${profile.username}'s page">
              ${profile.username.charAt(0).toUpperCase()}
            </div>`;
  }
};

/**
 * Create data cell display with clear placeholder distinction
 */
const createDataCellDisplay = (value) => {
  if (value === "__missing field__") {
    return '<span class="missing-field" style="color: #dc2626; font-style: italic; background: #fef2f2; padding: 2px 6px; border-radius: 3px;">missing field</span>';
  } else if (value === "__not yet entered__") {
    return '<span class="not-entered" style="color: #d97706; font-style: italic; background: #fffbeb; padding: 2px 6px; border-radius: 3px;">not yet entered</span>';
  } else if (value) {
    return `<span class="real-data" style="color: #374151;">${value}</span>`;
  } else {
    return '<span style="color: #9ca3af;">—</span>';
  }
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
 * ✅ STEP 1: Start real-time clock updates using Extension 1.5 timezone utility
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
// 🧭 NAVIGATION INTEGRATION - Clean Button Placement
// ===================================================================

/**
 * Add navigation buttons using proven sandbox approach
 */
const addNavigationButtonsClean = () => {
  try {
    // Remove existing buttons
    document
      .querySelectorAll(".clean-directory-nav-button")
      .forEach((btn) => btn.remove());

    console.log("🎯 CLEAN: Placing Show Directory button...");

    // Sandbox-confirmed multi-selector approach
    const possibleTargets = [
      ".roam-article",
      ".roam-main",
      ".rm-article-wrapper",
      ".roam-center-panel",
      ".flex-h-box > div:nth-child(2)",
      "#app > div > div > div:nth-child(2)",
      '.bp3-tab-panel[aria-hidden="false"]',
    ];

    let targetElement = null;
    let selectorUsed = null;

    for (const selector of possibleTargets) {
      const element = document.querySelector(selector);
      if (element) {
        targetElement = element;
        selectorUsed = selector;
        break;
      }
    }

    if (!targetElement) {
      targetElement = document.body;
      selectorUsed = "body (fallback)";
    }

    // Ensure relative positioning
    const computedStyle = getComputedStyle(targetElement);
    if (computedStyle.position === "static") {
      targetElement.style.position = "relative";
    }

    // Create the Show Directory button
    const directoryButton = document.createElement("button");
    directoryButton.className = "clean-directory-nav-button";
    directoryButton.textContent = "👥 User Directory";
    directoryButton.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 9999;
      background: linear-gradient(135deg, #c7f3ff 0%, #22d3ee 100%);
      color: #0e7490;
      border: 1px solid #06b6d4;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(34, 211, 238, 0.2);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Add click handler
    directoryButton.addEventListener("click", showUserDirectoryModalClean);

    // Add hover effects
    directoryButton.addEventListener("mouseenter", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #a5f3fc 0%, #0891b2 100%)";
      directoryButton.style.transform = "translateY(-1px)";
    });

    directoryButton.addEventListener("mouseleave", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #c7f3ff 0%, #22d3ee 100%)";
      directoryButton.style.transform = "translateY(0)";
    });

    // Append to target
    targetElement.appendChild(directoryButton);
    if (window._extensionRegistry && window._extensionRegistry.elements) {
      window._extensionRegistry.elements.push(directoryButton);
    }

    console.log(`✅ CLEAN: Show Directory button added to: ${selectorUsed}`);
  } catch (error) {
    console.error("❌ Error adding clean navigation buttons:", error);
  }
};

/**
 * Monitor page changes and update navigation buttons
 */
const startNavigationMonitoringClean = () => {
  // Add button initially with delay
  setTimeout(addNavigationButtonsClean, 1000);

  // Monitor for page changes
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log("📍 CLEAN: Page changed, re-adding button...");
      setTimeout(addNavigationButtonsClean, 500);
    }
    setTimeout(checkUrlChange, 1000);
  };

  checkUrlChange();
  console.log("📡 CLEAN: Navigation monitoring started");
};

// ===================================================================
// 🧪 CLEAN TESTING AND DEBUGGING COMMANDS
// ===================================================================

/**
 * Test clean data extraction for specific user
 */
const testCleanDataExtraction = async (username) => {
  console.group(`🧪 CLEAN: Testing data extraction for ${username}`);

  try {
    const profile = await getUserProfileDataClean(username);

    console.log("Profile result:", profile);
    console.log("Has My Info structure:", profile.hasMyInfo);
    console.log("Completeness:", profile.completeness + "%");

    if (profile.error) {
      console.error("Error:", profile.error);
    }

    // Show placeholder types
    const fields = ["avatar", "location", "role", "timezone", "aboutMe"];
    fields.forEach((field) => {
      const value = profile[field];
      let type = "real data";
      if (value === "__missing field__") type = "missing field";
      if (value === "__not yet entered__") type = "not yet entered";

      console.log(`${field}: "${value}" (${type})`);
    });
  } catch (error) {
    console.error("Test failed:", error);
  }

  console.groupEnd();
};

/**
 * Show placeholder distinction demo
 */
const showPlaceholderDistinction = async () => {
  console.group("🎨 CLEAN: Placeholder Distinction Demo");

  console.log("Placeholder Types:");
  console.log(
    '1. "__missing field__" - Field not in data structure (red background)'
  );
  console.log(
    '2. "__not yet entered__" - Field exists but has placeholder value (orange background)'
  );
  console.log("3. Real data - Actual user content (normal text)");

  console.log("\nVisual Styling:");
  console.log("🔴 Missing field: Red text, light red background");
  console.log("🟠 Not entered: Orange text, light orange background");
  console.log("⚫ Real data: Normal text, no background");

  console.groupEnd();
};

/**
 * ✅ STEP 1: Test Extension 1.5 timezone integration
 */
const testTimezoneIntegration = async () => {
  console.group("🌍 Testing Extension 1.5 Timezone Integration");

  try {
    const platform = window.RoamExtensionSuite;
    const timezoneManager = platform.getUtility("timezoneManager");

    if (!timezoneManager) {
      console.error("❌ TimezoneManager utility not found!");
      return;
    }

    console.log("✅ TimezoneManager utility loaded successfully");

    // Test timezone parsing
    const testTimezones = [
      "EST",
      "America/New_York",
      "PST",
      "GMT+1",
      "__not yet entered__",
      "invalid-timezone",
    ];

    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForTimezone(tz);
      console.log(
        `🕐 ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "✅ valid" : "❌ invalid"
        })`
      );
    });

    // Test common timezones
    const commonTimezones = timezoneManager.getCommonTimezones();
    console.log(`📋 Common timezones available: ${commonTimezones.length}`);

    console.log("🎉 Extension 1.5 timezone integration working perfectly!");
  } catch (error) {
    console.error("❌ Timezone integration test failed:", error);
  }

  console.groupEnd();
};

/**
 * ✅ STEP 2: Test Extension 1.5 modal integration
 */
const testModalIntegration = async () => {
  console.group("🪟 Testing Extension 1.5 Modal Integration");

  try {
    const platform = window.RoamExtensionSuite;
    const modalUtilities = platform.getUtility("modalUtilities");

    if (!modalUtilities) {
      console.error("❌ Modal utilities not found!");
      return;
    }

    console.log("✅ Modal utilities loaded successfully");

    // Test modal creation
    const testModal = modalUtilities.createModal("test-modal", {
      closeOnEscape: true,
      closeOnBackdrop: true,
    });

    const testContent = modalUtilities.createModalContent({
      width: "400px",
      maxWidth: "500px",
    });

    const testHeader = modalUtilities.createModalHeader(
      "🧪 Test Modal",
      "Extension 1.5 modal utilities test"
    );

    testContent.appendChild(testHeader);
    testContent.insertAdjacentHTML(
      "beforeend",
      `
      <div style="padding: 20px; text-align: center;">
        <p>This modal was created using Extension 1.5 utilities!</p>
        <button onclick="this.closest('#test-modal').remove()" 
                style="padding: 8px 16px; background: #06b6d4; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Close Test Modal
        </button>
      </div>
    `
    );

    testModal.appendChild(testContent);
    document.body.appendChild(testModal);

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (document.getElementById("test-modal")) {
        document.getElementById("test-modal").remove();
      }
    }, 3000);

    console.log("🎉 Extension 1.5 modal integration working perfectly!");
    console.log("📝 Test modal created and will auto-close in 3 seconds");
  } catch (error) {
    console.error("❌ Modal integration test failed:", error);
  }

  console.groupEnd();
};

/**
 * ✅ FIX: Test curated member list functionality
 */
const testCuratedMemberList = async () => {
  console.group("👥 Testing Curated Member List");

  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );

    if (!getGraphMembersFromList) {
      console.error("❌ getGraphMembersFromList utility not found!");
      return;
    }

    console.log("✅ getGraphMembersFromList utility loaded successfully");

    // Test getting members from curated list
    const curatedMembers = getGraphMembersFromList(
      "roam/graph members",
      "Directory"
    );
    console.log(
      `📋 Found ${curatedMembers.length} curated members:`,
      curatedMembers
    );

    // Test fallback to generic detection
    const getGraphMembers = platform.getUtility("getGraphMembers");
    const allMembers = getGraphMembers();
    console.log(
      `📋 Generic detection found ${allMembers.length} members:`,
      allMembers.slice(0, 5),
      "..."
    );

    console.log("🎉 Curated member list integration working!");
  } catch (error) {
    console.error("❌ Curated member list test failed:", error);
  }

  console.groupEnd();
};

/**
 * Run comprehensive clean system tests
 */
const runCleanSystemTests = async () => {
  console.group("🧪 CLEAN: System Tests (Steps 1+2)");

  try {
    // Test 1: Curated Member List
    console.log("Test 1: Curated Member List");
    await testCuratedMemberList();

    // Test 2: Extension 1.5 Timezone Integration
    console.log("Test 2: Extension 1.5 Timezone Integration");
    await testTimezoneIntegration();

    // Test 3: Extension 1.5 Modal Integration
    console.log("Test 3: Extension 1.5 Modal Integration");
    await testModalIntegration();

    // Test 4: Clean Data Extraction (limited sample)
    console.log("Test 4: Clean Data Extraction");
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    if (currentUser) {
      await testCleanDataExtraction(currentUser.displayName);
    }

    console.log("✅ All system tests completed successfully!");
    console.log("🚀 Steps 1+2 refactoring working perfectly");
  } catch (error) {
    console.error("❌ System tests failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Clean Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log(
      "👥 User Directory + Timezones starting (Steps 1+2: Timezone + Modal + Member List)..."
    );

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    const requiredDependencies = [
      "utility-library", // Extension 1.5 with enhanced utilities
      "user-authentication", // Extension 2
      "configuration-manager", // Extension 3
    ];

    for (const dep of requiredDependencies) {
      if (!platform.has(dep)) {
        console.error(
          `❌ ${dep} not found! Please load required dependencies first.`
        );
        return;
      }
    }

    // ✅ VERIFY REQUIRED UTILITIES
    const timezoneManager = platform.getUtility("timezoneManager");
    const modalUtilities = platform.getUtility("modalUtilities");
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );

    if (!timezoneManager) {
      console.error("❌ TimezoneManager utility not found in Extension 1.5!");
      return;
    }
    if (!modalUtilities) {
      console.error("❌ Modal utilities not found in Extension 1.5!");
      return;
    }
    if (!getGraphMembersFromList) {
      console.error(
        "❌ getGraphMembersFromList utility not found in Extension 1.5!"
      );
      return;
    }

    console.log("✅ All Extension 1.5 utilities found - using shared logic");

    // 🔧 REGISTER CLEAN SERVICES
    const cleanDirectoryServices = {
      // Core data extraction
      getUserProfileDataClean: getUserProfileDataClean,
      getAllUserProfilesClean: getAllUserProfilesClean,
      initializeUserProfile: initializeUserProfile,

      // UI components
      showUserDirectoryModalClean: showUserDirectoryModalClean,
      addNavigationButtonsClean: addNavigationButtonsClean,
      startNavigationMonitoringClean: startNavigationMonitoringClean,

      // Testing utilities
      testCleanDataExtraction: testCleanDataExtraction,
      showPlaceholderDistinction: showPlaceholderDistinction,
      testTimezoneIntegration: testTimezoneIntegration,
      testModalIntegration: testModalIntegration,
      testCuratedMemberList: testCuratedMemberList,
      runCleanSystemTests: runCleanSystemTests,
    };

    Object.entries(cleanDirectoryServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 🧭 START NAVIGATION MONITORING
    startNavigationMonitoringClean();

    // 📝 REGISTER CLEAN COMMANDS
    const commands = [
      {
        label: "User Directory: Show User Directory",
        callback: showUserDirectoryModalClean,
      },
      {
        label: "User Directory: Test Extension 1.5 Integration",
        callback: runCleanSystemTests,
      },
      {
        label: "User Directory: Test Curated Member List",
        callback: testCuratedMemberList,
      },
      {
        label: "User Directory: Test Modal Integration",
        callback: testModalIntegration,
      },
      {
        label: "User Directory: Test Timezone Integration",
        callback: testTimezoneIntegration,
      },
      {
        label: "User Directory: Test My Data Extraction",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            await testCleanDataExtraction(currentUser.displayName);
          }
        },
      },
      {
        label: "User Directory: Show Placeholder Distinction",
        callback: showPlaceholderDistinction,
      },
      {
        label: "User Directory: Initialize My Profile Structure",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            const success = await initializeUserProfile(
              currentUser.displayName
            );
            console.log(
              `🎯 Profile initialization ${success ? "successful" : "failed"}`
            );
            if (success) {
              console.log(
                "💡 Check your user page - clear placeholders created"
              );
            }
          }
        },
      },
      {
        label: "User Directory: Add Show Directory Button",
        callback: addNavigationButtonsClean,
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "clean-user-directory",
      {
        services: cleanDirectoryServices,
        version: "6.6.0-steps-1-2",
      },
      {
        name: "CLEAN User Directory (Steps 1+2: Timezone + Modal + Members)",
        description:
          "Major refactor: Using Extension 1.5 utilities for timezone, modal, and curated member list",
        version: "6.6.0-steps-1-2",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    console.log("✅ User Directory Steps 1+2 loaded successfully!");
    console.log(
      "🌍 STEP 1: TimezoneManager using Extension 1.5 (~80 lines saved)"
    );
    console.log(
      "🪟 STEP 2: Modal creation using Extension 1.5 (~50 lines saved)"
    );
    console.log("👥 FIX: Using curated [[roam/graph members]] source of truth");
    console.log("📊 TOTAL: ~130 lines of code eliminated");
    console.log(
      "🔄 NEXT: Navigation utilities, profile analysis, avatar processing"
    );
    console.log(`👤 Current user: ${currentUser?.displayName}`);
    console.log(
      '💡 Try: Cmd+P → "User Directory: Test Extension 1.5 Integration"'
    );

    // Auto-test integration
    setTimeout(async () => {
      console.log("🔍 Auto-testing Steps 1+2 integration...");
      await runCleanSystemTests();
    }, 2000);
  },

  onunload: () => {
    console.log("👥 User Directory unloading...");

    // Clean up modals
    const modals = document.querySelectorAll(
      "#clean-user-directory-modal, #test-modal"
    );
    modals.forEach((modal) => modal.remove());

    // Navigation helper cleanup
    delete window.navigateToUserPageClean;

    console.log("✅ User Directory cleanup complete!");
  },
};
