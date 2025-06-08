// ===================================================================
// Extension 6: User Directory + Timezones - FIXED DATA & UI
// FIXED: Enhanced data detection, larger modal, clickable names/avatars
// FIXED: Better debugging for data loading issues
// ===================================================================

// ===================================================================
// 🌍 TIMEZONE INTELLIGENCE ENGINE - Professional Time Management
// ===================================================================

/**
 * Comprehensive timezone parsing and calculation system
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
      // For simplicity, map some common offsets
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
// 👥 ENHANCED USER PROFILE DATA COLLECTION - FIXED with Multiple Detection Methods
// ===================================================================

/**
 * 🔧 FIXED: Enhanced getUserProfileData with multiple detection strategies
 */
const getUserProfileData = async (username) => {
  try {
    console.log(`🔍 DEBUGGING: Getting profile data for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValues = platform.getUtility("findNestedDataValues");
    const findDataValue = platform.getUtility("findDataValue");

    const userPageUid = getPageUidByTitle(username);
    console.log(`📄 User page UID for ${username}:`, userPageUid);

    if (!userPageUid) {
      return {
        username,
        exists: false,
        avatar: null,
        location: null,
        role: null,
        timezone: null,
        aboutMe: null,
        completeness: 0,
        missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
        debugInfo: "User page not found",
      };
    }

    // Strategy 1: Try nested data under "My Info::"
    console.log(
      `🔍 Strategy 1: Looking for nested data under "My Info::" for ${username}`
    );
    let myInfoData = findNestedDataValues(userPageUid, "My Info");
    console.log(`📊 My Info nested data for ${username}:`, myInfoData);

    // Strategy 2: Try individual attribute format queries
    console.log(
      `🔍 Strategy 2: Looking for individual attributes for ${username}`
    );
    const individualFields = {
      avatar: findDataValue(userPageUid, "Avatar"),
      location: findDataValue(userPageUid, "Location"),
      role: findDataValue(userPageUid, "Role"),
      timezone: findDataValue(userPageUid, "Timezone"),
      aboutMe: findDataValue(userPageUid, "About Me"),
    };
    console.log(`📊 Individual fields for ${username}:`, individualFields);

    // Strategy 3: Try direct block queries to see what's actually on the page
    console.log(`🔍 Strategy 3: Direct block analysis for ${username}`);
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${userPageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);
    console.log(`📋 All top-level blocks on ${username} page:`, allBlocks);

    // Look for blocks that might contain profile data
    const profileBlocks = allBlocks.filter(([uid, text]) => {
      const lowerText = text.toLowerCase();
      return (
        lowerText.includes("avatar") ||
        lowerText.includes("location") ||
        lowerText.includes("role") ||
        lowerText.includes("timezone") ||
        lowerText.includes("about me") ||
        lowerText.includes("my info")
      );
    });
    console.log(`🎯 Profile-related blocks for ${username}:`, profileBlocks);

    // Combine data from all strategies
    let avatar = null,
      location = null,
      role = null,
      timezone = null,
      aboutMe = null;

    // From nested data
    if (myInfoData && Object.keys(myInfoData).length > 0) {
      avatar = getCleanFieldValue(myInfoData, ["Avatar"]);
      location = getCleanFieldValue(myInfoData, ["Location"]);
      role = getCleanFieldValue(myInfoData, ["Role"]);
      timezone = getCleanFieldValue(myInfoData, ["Timezone", "Time Zone"]);
      aboutMe = getCleanFieldValue(myInfoData, ["About Me"]);
    }

    // From individual fields (override if found)
    if (individualFields.avatar) avatar = individualFields.avatar;
    if (individualFields.location) location = individualFields.location;
    if (individualFields.role) role = individualFields.role;
    if (individualFields.timezone) timezone = individualFields.timezone;
    if (individualFields.aboutMe) aboutMe = individualFields.aboutMe;

    // Clean the values
    avatar = getCleanFieldValue({ value: avatar }, ["value"]);
    location = getCleanFieldValue({ value: location }, ["value"]);
    role = getCleanFieldValue({ value: role }, ["value"]);
    timezone = getCleanFieldValue({ value: timezone }, ["value"]);
    aboutMe = getCleanFieldValue({ value: aboutMe }, ["value"]);

    console.log(`📊 Final cleaned data for ${username}:`, {
      avatar,
      location,
      role,
      timezone,
      aboutMe,
    });

    // Calculate profile completeness
    const requiredFields = ["Avatar", "Location", "Role", "Timezone"];
    const fieldValues = [avatar, location, role, timezone];
    const completedFields = fieldValues.filter(
      (value) => value !== null
    ).length;
    const completeness = Math.round(
      (completedFields / requiredFields.length) * 100
    );

    // Get timezone information
    let timezoneInfo = null;
    if (timezone) {
      timezoneInfo = timezoneManager.getCurrentTimeForUser(timezone);
    }

    // Identify missing fields
    const missingFields = [];
    if (!avatar) missingFields.push("Avatar");
    if (!location) missingFields.push("Location");
    if (!role) missingFields.push("Role");
    if (!timezone) missingFields.push("Timezone");
    if (!aboutMe) missingFields.push("About Me");

    const result = {
      username,
      exists: true,
      avatar,
      location,
      role,
      timezone,
      aboutMe,
      completeness,
      timezoneInfo,
      missingFields,
      debugInfo: {
        strategies: {
          nestedData: myInfoData,
          individualFields,
          profileBlocks: profileBlocks.length,
        },
        finalValues: { avatar, location, role, timezone, aboutMe },
      },
    };

    console.log(`✅ Final profile result for ${username}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Failed to get profile data for ${username}:`, error);
    return {
      username,
      exists: false,
      error: error.message,
      completeness: 0,
      missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
      debugInfo: `Error: ${error.message}`,
    };
  }
};

/**
 * Helper to get clean field values with enhanced placeholder detection
 */
const getCleanFieldValue = (dataObject, fieldNames) => {
  for (const fieldName of fieldNames) {
    const value = dataObject[fieldName];
    if (value && typeof value === "string") {
      const trimmed = value.trim();

      // Enhanced placeholder detection
      const placeholders = [
        "not set",
        "not specified",
        "location not set",
        "timezone not set",
        "role not set",
        "team member",
        "graph member",
        "unknown",
        "tbd",
        "todo",
        "—",
        "-",
        "",
      ];

      const isPlaceholder = placeholders.some((placeholder) =>
        trimmed.toLowerCase().includes(placeholder.toLowerCase())
      );

      if (!isPlaceholder && trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
};

/**
 * Get all user profiles for directory with enhanced error handling
 */
const getAllUserProfiles = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    const members = getGraphMembers();
    console.log(
      `📊 Collecting profiles for ${members.length} graph members...`
    );

    const profiles = await Promise.all(
      members.map(async (username) => {
        try {
          return await getUserProfileData(username);
        } catch (error) {
          console.warn(`⚠️ Failed to get profile for ${username}:`, error);
          return {
            username,
            exists: false,
            error: error.message,
            completeness: 0,
            missingFields: [
              "Avatar",
              "Location",
              "Role",
              "Timezone",
              "About Me",
            ],
            debugInfo: `Error: ${error.message}`,
          };
        }
      })
    );

    profiles.sort((a, b) => a.username.localeCompare(b.username));

    console.log(`✅ Collected ${profiles.length} user profiles`);
    console.log(
      "📊 Profile summary:",
      profiles.map((p) => ({
        username: p.username,
        completeness: p.completeness,
        missingFields: p.missingFields?.length || 0,
      }))
    );

    return profiles;
  } catch (error) {
    console.error("Failed to collect user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🎨 USER DIRECTORY MODAL - FIXED: Larger Size, Clickable Names/Avatars, No Actions
// ===================================================================

/**
 * Create and display enhanced user directory modal - FIXED UI
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening ENHANCED User Directory...");

    const existingModal = document.getElementById("user-directory-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "user-directory-modal";
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

    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading enhanced user directory...</div>
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Multi-strategy data detection • Enhanced debugging</div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    window._extensionRegistry.elements.push(modal);

    const closeModal = () => {
      modal.remove();
    };

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    const profiles = await getAllUserProfiles();
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

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
            🫂 Enhanced User Directory
          </h2>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            ${
              profiles.length
            } graph members • Multi-strategy data detection • Updated ${new Date().toLocaleTimeString()}
          </div>
        </div>
        <button 
          onclick="this.closest('#user-directory-modal').remove()"
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
                createUserDirectoryRow(profile, currentUser, index)
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
        💡 ENHANCED: Multi-strategy data detection • Larger modal • Clickable names/avatars • Enhanced debugging
      </div>
    `;

    startRealtimeClockUpdates(modal);

    console.log(
      "✅ Enhanced User Directory modal opened with better data detection"
    );
  } catch (error) {
    console.error("Failed to show user directory:", error);
  }
};

/**
 * Create individual user row for directory table - FIXED: Clickable names/avatars, no actions
 */
const createUserDirectoryRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;
  const rowClass = isCurrentUser ? "current-user-row" : "user-row";

  const avatarDisplay = profile.avatar
    ? `<img src="${profile.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; cursor: pointer;" alt="${profile.username}" onclick="navigateToUserPage('${profile.username}')" title="Click to visit ${profile.username}'s page">`
    : `<div onclick="navigateToUserPage('${
        profile.username
      }')" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; cursor: pointer;" title="Click to visit ${
        profile.username
      }'s page">${profile.username.charAt(0).toUpperCase()}</div>`;

  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  const completenessColor =
    profile.completeness >= 75
      ? "#059669"
      : profile.completeness >= 50
      ? "#d97706"
      : "#dc2626";

  return `
    <tr class="${rowClass}" style="border-bottom: 1px solid #f1f5f9; ${
    isCurrentUser ? "background: #f0f9ff;" : ""
  } ${index % 2 === 0 ? "background: #fafafa;" : ""}">
      <td style="padding: 12px 16px; vertical-align: middle;">${avatarDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span onclick="navigateToUserPage('${
            profile.username
          }')" style="font-weight: 500; color: #1a202c; cursor: pointer; text-decoration: underline;" title="Click to visit ${
    profile.username
  }'s page">${profile.username}</span>
          ${
            isCurrentUser
              ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500;">You</span>'
              : ""
          }
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${completenessColor}; opacity: 0.7;" title="${
    profile.completeness
  }% complete"></div>
        </div>
      </td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${
        profile.aboutMe || '<span style="color: #9ca3af;">—</span>'
      }</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${
        profile.location || '<span style="color: #9ca3af;">—</span>'
      }</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${
        profile.role || '<span style="color: #9ca3af;">—</span>'
      }</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${
        profile.timezone || '<span style="color: #9ca3af;">—</span>'
      }</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${timeDisplay}</td>
    </tr>
  `;
};

/**
 * Start real-time clock updates
 */
const startRealtimeClockUpdates = (modal) => {
  const updateClocks = () => {
    const timeElements = modal.querySelectorAll(".timezone-time");
    timeElements.forEach((element) => {
      const timezone = element.getAttribute("data-timezone");
      if (timezone) {
        const timeInfo = timezoneManager.getCurrentTimeForUser(timezone);
        if (timeInfo.isValid) {
          element.textContent = timeInfo.timeString;
        }
      }
    });
  };

  const interval = setInterval(updateClocks, 60000);

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
window.navigateToUserPage = (username) => {
  const userPageUrl = `#/app/${window.roamAlphaAPI.graph.name}/page/${username}`;
  window.location.href = userPageUrl;

  const modal = document.getElementById("user-directory-modal");
  if (modal) modal.remove();
};

// ===================================================================
// 🧪 ENHANCED TESTING AND DEBUGGING - Multiple Data Strategies
// ===================================================================

/**
 * Debug a specific user's data detection
 */
const debugUserDataDetection = async (username) => {
  console.group(`🔍 DEBUGGING: Data detection for ${username}`);

  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const userPageUid = getPageUidByTitle(username);
    console.log(`📄 Page UID: ${userPageUid}`);

    if (!userPageUid) {
      console.log(`❌ No page found for ${username}`);
      console.groupEnd();
      return;
    }

    // Show all blocks on the page
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${userPageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `);

    console.log(`📋 All blocks on ${username}'s page:`, allBlocks);

    // Test the actual profile data extraction
    const profileData = await getUserProfileData(username);
    console.log(`📊 Extracted profile data:`, profileData);
  } catch (error) {
    console.error(`❌ Debug failed:`, error);
  }

  console.groupEnd();
};

/**
 * Run comprehensive directory system tests - ENHANCED
 */
const runDirectoryTests = async () => {
  console.group("🧪 ENHANCED User Directory System Tests");

  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // Test 1: Graph Members Detection
    console.log("Test 1: Graph Members Detection");
    const members = getGraphMembers();
    console.log(`📋 Found ${members.length} members:`, members);

    // Test 2: Data Detection for Each User
    console.log("Test 2: Enhanced Data Detection");
    for (const username of members) {
      await debugUserDataDetection(username);
    }

    // Test 3: Timezone Management
    console.log("Test 3: Timezone Management");
    const testTimezones = ["EST", "America/New_York", "PST", "GMT+1"];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(
        `🕐 ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "valid" : "invalid"
        })`
      );
    });

    console.log("✅ Enhanced directory tests completed");
  } catch (error) {
    console.error("❌ Enhanced directory test failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Enhanced Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🫂 ENHANCED User Directory + Timezones starting...");

    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const requiredDependencies = [
      "utility-library",
      "user-authentication",
      "configuration-manager",
    ];

    for (const dep of requiredDependencies) {
      if (!window.RoamExtensionSuite.has(dep)) {
        console.error(
          `❌ ${dep} not found! Please load required dependencies first.`
        );
        return;
      }
    }

    const platform = window.RoamExtensionSuite;

    const directoryServices = {
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,
      getCleanFieldValue: getCleanFieldValue,
      showUserDirectoryModal: showUserDirectoryModal,
      timezoneManager: timezoneManager,
      debugUserDataDetection: debugUserDataDetection,
      runDirectoryTests: runDirectoryTests,
    };

    Object.entries(directoryServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    const commands = [
      {
        label: "Directory: Show ENHANCED User Directory",
        callback: showUserDirectoryModal,
      },
      {
        label: "Directory: Debug My Data Detection",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            await debugUserDataDetection(currentUser.displayName);
          }
        },
      },
      {
        label: "Directory: Debug ALL User Data",
        callback: async () => {
          const members = platform.getUtility("getGraphMembers")();
          console.log("🔍 Starting comprehensive data debug...");
          for (const username of members) {
            await debugUserDataDetection(username);
          }
        },
      },
      {
        label: "Directory: Run ENHANCED System Tests",
        callback: runDirectoryTests,
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    platform.register(
      "user-directory",
      {
        services: directoryServices,
        timezoneManager: timezoneManager,
        version: "6.3.0",
      },
      {
        name: "ENHANCED User Directory + Timezones",
        description:
          "FIXED: Multi-strategy data detection, larger modal, clickable names/avatars",
        version: "6.3.0",
        dependencies: requiredDependencies,
      }
    );

    const currentUser = platform.getUtility("getAuthenticatedUser")();
    console.log("✅ ENHANCED User Directory loaded successfully!");
    console.log("🔧 FIXED: Multi-strategy data detection");
    console.log("🔧 FIXED: Larger modal (90% width, max 1200px)");
    console.log("🔧 FIXED: Clickable names and avatars");
    console.log("🔧 FIXED: Removed Actions column");
    console.log("🔧 FIXED: Enhanced debugging capabilities");
    console.log(`👤 Current user: ${currentUser?.displayName}`);
    console.log('💡 Try: Cmd+P → "Directory: Debug My Data Detection"');

    // Auto-debug current user on startup
    setTimeout(async () => {
      if (currentUser) {
        console.log("🔍 Auto-debugging current user data detection...");
        await debugUserDataDetection(currentUser.displayName);
      }
    }, 2000);
  },

  onunload: () => {
    console.log("🫂 ENHANCED User Directory unloading...");

    const modals = document.querySelectorAll("#user-directory-modal");
    modals.forEach((modal) => modal.remove());

    console.log("✅ ENHANCED User Directory cleanup complete!");
  },
};
