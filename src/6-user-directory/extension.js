// ===================================================================
// Extension 6: Clean User Directory + Timezones - Complete Rebuild
// CLEAN: Uses ONLY Extension 1.5 exact functions, no filtering
// Focus: Professional UI, clear placeholder distinction, real data display
// ===================================================================

// ===================================================================
// 🌍 TIMEZONE INTELLIGENCE ENGINE - Professional Time Management
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

/**
 * Clean timezone parsing and calculation system
 */
class TimezoneManager {
  constructor() {
    // Common timezone abbreviations to IANA mapping
    this.timezoneMap = {
      EST: "America/New_York",
      EDT: "America/New_York",
      CST: "America/Chicago",
      CDT: "America/Chicago",
      MST: "America/Denver",
      MDT: "America/Denver",
      PST: "America/Los_Angeles",
      PDT: "America/Los_Angeles",
      GMT: "Europe/London",
      BST: "Europe/London",
      CET: "Europe/Paris",
      CEST: "Europe/Paris",
      JST: "Asia/Tokyo",
      AEST: "Australia/Sydney",
      AEDT: "Australia/Sydney",
      IST: "Asia/Kolkata",
      SGT: "Asia/Singapore",
    };
  }

  /**
   * Parse timezone string to IANA identifier
   */
  parseTimezone(timezoneString) {
    if (!timezoneString) return null;

    const cleaned = timezoneString.trim();

    // Check if it's already an IANA identifier
    if (cleaned.includes("/")) {
      return this.validateTimezone(cleaned) ? cleaned : null;
    }

    // Check abbreviation mapping
    const upperCased = cleaned.toUpperCase();
    if (this.timezoneMap[upperCased]) {
      return this.timezoneMap[upperCased];
    }

    // Handle UTC offsets like "GMT+1", "UTC-5"
    const offsetMatch = cleaned.match(/^(GMT|UTC)([+-]\d{1,2})$/i);
    if (offsetMatch) {
      const offset = parseInt(offsetMatch[2]);
      const offsetMap = {
        "-8": "America/Los_Angeles",
        "-7": "America/Denver",
        "-6": "America/Chicago",
        "-5": "America/New_York",
        0: "UTC",
        1: "Europe/Paris",
        8: "Asia/Singapore",
        9: "Asia/Tokyo",
      };
      return offsetMap[offset.toString()] || null;
    }

    return null;
  }

  /**
   * Validate if timezone is supported
   */
  validateTimezone(timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current time in user's timezone
   */
  getCurrentTimeForUser(timezoneString) {
    const timezone = this.parseTimezone(timezoneString);
    if (!timezone) {
      return {
        timeString: "—",
        isValid: false,
        error: "Invalid timezone",
      };
    }

    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return {
        timeString: formatter.format(now),
        timezone: timezoneString,
        ianaTimezone: timezone,
        isValid: true,
      };
    } catch (error) {
      return {
        timeString: "—",
        timezone: timezoneString,
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get common timezones for dropdown
   */
  getCommonTimezones() {
    return [
      { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
      { value: "America/Chicago", label: "Central Time (CST/CDT)" },
      { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Central European Time" },
      { value: "Asia/Tokyo", label: "Japan Standard Time" },
      { value: "Asia/Shanghai", label: "China Standard Time" },
      { value: "Asia/Kolkata", label: "India Standard Time" },
      { value: "Australia/Sydney", label: "Australian Eastern Time" },
    ];
  }
}

// Global timezone manager instance
const timezoneManager = new TimezoneManager();

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

    // Get timezone information if timezone exists and is real
    if (
      profileData.timezone &&
      profileData.timezone !== "__missing field__" &&
      profileData.timezone !== "__not yet entered__"
    ) {
      profileData.timezoneInfo = timezoneManager.getCurrentTimeForUser(
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
    aboutme: "__missing field__",
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
    aboutme: "__missing field__",
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
    aboutme: "__missing field__",
    completeness: 0,
    timezoneInfo: { timeString: "—", isValid: false },
    error: errorMessage,
    debugInfo: `Error: ${errorMessage}`,
  };
};

/**
 * Get all user profiles using clean extraction
 */
const getAllUserProfilesClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    const members = getGraphMembers();
    console.log(
      `📊 CLEAN: Collecting profiles for ${members.length} graph members...`
    );

    const profiles = await Promise.all(
      members.map(async (username) => {
        return await getUserProfileDataClean(username);
      })
    );

    // Sort by username
    profiles.sort((a, b) => a.username.localeCompare(b.username));

    console.log(`✅ CLEAN: Collected ${profiles.length} user profiles`);
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
      aboutme: "__not yet entered__",
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
// 🎨 PROFESSIONAL USER DIRECTORY MODAL - Clean UI with Placeholder Distinction
// ===================================================================

/**
 * Create and display professional user directory modal
 */
const showUserDirectoryModalClean = async () => {
  try {
    console.log("📋 Opening User Directory...");

    // Remove existing modal
    const existingModal = document.getElementById("clean-user-directory-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "clean-user-directory-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create modal content
    const content = document.createElement("div");
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 1200px;
      max-height: 90%;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
    `;

    // Show loading state
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading user directory...</div>
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Using Extension 1.5 exact functions • No filtering</div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Register for cleanup
    window._extensionRegistry.elements.push(modal);

    // Close modal handlers
    const closeModal = () => modal.remove();
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Load profiles using clean extraction
    const profiles = await getAllUserProfilesClean();
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const graphName = getFormattedGraphName();

    // Render complete modal
    content.innerHTML = `
      <div style="
        padding: 24px 32px 20px;
        border-bottom: 1px solid #e1e5e9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a202c;">
            👥 User Directory: ${graphName}
          </h2>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            ${
              profiles.length
            } graph members • Extension 1.5 exact functions • ${new Date().toLocaleTimeString()}
          </div>
        </div>
        <button 
          onclick="this.closest('#clean-user-directory-modal').remove()"
          style="
            background: none;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            color: #666;
          "
        >
          Close
        </button>
      </div>
      
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
      
      <div style="
        padding: 16px 32px;
        border-top: 1px solid #e1e5e9;
        background: #f8f9fa;
        font-size: 13px;
        color: #666;
        text-align: center;
      ">
        🧹 Extension 1.5 exact functions • No filtering • Clear placeholder distinction
      </div>
    `;

    // Start real-time clock updates
    startRealtimeClockUpdatesClean(modal);

    console.log("✅ User Directory modal opened");
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
  const aboutMeDisplay = createDataCellDisplay(profile.aboutme);
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
 * Start real-time clock updates for the modal
 */
const startRealtimeClockUpdatesClean = (modal) => {
  const updateClocks = () => {
    const timeElements = modal.querySelectorAll(".clean-timezone-time");
    timeElements.forEach((element) => {
      const timezone = element.getAttribute("data-timezone");
      if (
        timezone &&
        timezone !== "__missing field__" &&
        timezone !== "__not yet entered__"
      ) {
        const timeInfo = timezoneManager.getCurrentTimeForUser(timezone);
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
    window._extensionRegistry.elements.push(directoryButton);

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
    const fields = ["avatar", "location", "role", "timezone", "aboutme"];
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
 * Run comprehensive clean system tests
 */
const runCleanSystemTests = async () => {
  console.group("🧪 CLEAN: System Tests");

  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // Test 1: Graph Members Detection
    console.log("Test 1: Graph Members Detection");
    const members = getGraphMembers();
    console.log(`📋 Found ${members.length} members:`, members);

    // Test 2: Clean Data Extraction
    console.log("Test 2: Clean Data Extraction");
    for (const username of members.slice(0, 3)) {
      // Limit for testing
      await testCleanDataExtraction(username);
    }

    // Test 3: Timezone Management
    console.log("Test 3: Timezone Management");
    const testTimezones = [
      "EST",
      "America/New_York",
      "PST",
      "GMT+1",
      "__not yet entered__",
    ];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(
        `🕐 ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "valid" : "invalid"
        })`
      );
    });

    console.log("✅ Clean system tests completed");
  } catch (error) {
    console.error("❌ Clean system test failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Clean Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("👥 User Directory + Timezones starting...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    const requiredDependencies = [
      "utility-library", // Extension 1.5 with exact functions
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

      // Timezone management
      timezoneManager: timezoneManager,

      // Testing utilities
      testCleanDataExtraction: testCleanDataExtraction,
      showPlaceholderDistinction: showPlaceholderDistinction,
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
        label: "User Directory: Run System Tests",
        callback: runCleanSystemTests,
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
        timezoneManager: timezoneManager,
        version: "6.4.0",
      },
      {
        name: "CLEAN User Directory + Timezones",
        description:
          "Clean rebuild using Extension 1.5 exact functions, clear placeholder distinction",
        version: "6.4.0",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    console.log("✅ User Directory loaded successfully!");
    console.log("🧹 CLEAN: Uses ONLY Extension 1.5 exact functions");
    console.log("🧹 CLEAN: No filtering - shows actual data");
    console.log("🧹 CLEAN: Clear placeholder distinction");
    console.log(`👤 Current user: ${currentUser?.displayName}`);
    console.log(
      '💡 Try: Cmd+P → "User Directory: Show Placeholder Distinction"'
    );

    // Show current user's profile structure
    setTimeout(async () => {
      if (currentUser) {
        console.log("🔍 Auto-testing current user data extraction...");
        await testCleanDataExtraction(currentUser.displayName);
      }
    }, 2000);
  },

  onunload: () => {
    console.log("👥 User Directory unloading...");

    // Clean up modals
    const modals = document.querySelectorAll("#clean-user-directory-modal");
    modals.forEach((modal) => modal.remove());

    // Navigation helper cleanup
    delete window.navigateToUserPageClean;

    console.log("✅ User Directory cleanup complete!");
  },
};
