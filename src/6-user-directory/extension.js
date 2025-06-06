// ===================================================================
// Extension 6: User Directory + Timezones - REVAMPED Professional Interface
// NEW: Uses "My Info::" nested structure as single source of truth
// Leverages Extensions 1, 1.5, 2, 3 + enhanced nested data parsing
// Focus: Unified user profiles, timezone intelligence, auto-creation, completion nudging
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
// 👥 USER PROFILE DATA COLLECTION - NEW My Info:: Structure
// ===================================================================

/**
 * Get user profile data from My Info:: nested structure
 * NEW: Single source of truth under "My Info::" parent block
 */
const getUserProfileData = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValues = platform.getUtility("findNestedDataValues");

    const userPageUid = getPageUidByTitle(username);
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
      };
    }

    // 🆕 NEW: Get all user info from nested "My Info::" structure
    const myInfoData = findNestedDataValues(userPageUid, "My Info");

    if (!myInfoData) {
      // My Info:: block doesn't exist yet
      return {
        username,
        exists: true,
        avatar: null,
        location: null,
        role: null,
        timezone: null,
        aboutMe: null,
        completeness: 0,
        missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
        needsMyInfoCreation: true,
      };
    }

    // Extract profile data from nested structure
    const avatar = myInfoData["Avatar"] || null;
    const location = myInfoData["Location"] || null;
    const role = myInfoData["Role"] || null;
    const timezone = myInfoData["Timezone"] || null;
    const aboutMe = myInfoData["About Me"] || null;

    // Calculate profile completeness
    const requiredFields = ["Avatar", "Location", "Role", "Timezone"];
    const completedFields = requiredFields.filter(
      (field) => myInfoData[field]
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
    const missingFields = requiredFields.filter((field) => !myInfoData[field]);

    return {
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
      myInfoData, // Include raw nested data for debugging
    };
  } catch (error) {
    console.error(`Failed to get profile data for ${username}:`, error);
    return {
      username,
      exists: false,
      error: error.message,
      completeness: 0,
      missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
    };
  }
};

/**
 * 🆕 NEW: Initialize My Info:: structure for a user
 * Creates the parent block and default child structure
 */
const initializeMyInfoStructure = async (username) => {
  try {
    console.log(`🎯 Initializing My Info:: structure for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const setNestedDataValues = platform.getUtility("setNestedDataValues");
    const getCurrentUser = platform.getUtility("getCurrentUser");

    // Ensure user page exists
    const userPageUid = await createPageIfNotExists(username);
    if (!userPageUid) {
      console.error(`❌ Failed to create page for ${username}`);
      return false;
    }

    // Get current user for smart defaults
    const currentUser = getCurrentUser();
    const isCurrentUser = username === currentUser.displayName;

    // Create default My Info structure
    const defaultMyInfo = {
      Avatar:
        isCurrentUser && currentUser.photoUrl
          ? currentUser.photoUrl
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              username
            )}`,
      Location: isCurrentUser ? "Oakland, California, US" : "Location not set",
      Role: isCurrentUser ? "Extension Developer" : "Team Member",
      Timezone: isCurrentUser ? "America/Los_Angeles" : "America/New_York",
      "About Me": isCurrentUser
        ? "Building professional Roam extensions"
        : "Graph member",
    };

    // Set nested data structure using attribute format (true)
    const success = await setNestedDataValues(
      userPageUid,
      "My Info",
      defaultMyInfo,
      true // Use attribute format for navigable data
    );

    if (success) {
      console.log(`✅ My Info:: structure created for ${username}`);
      console.log("📊 Default data:", defaultMyInfo);
    } else {
      console.error(`❌ Failed to create My Info:: structure for ${username}`);
    }

    return success;
  } catch (error) {
    console.error(`Error initializing My Info:: for ${username}:`, error);
    return false;
  }
};

/**
 * 🆕 NEW: Update specific field in My Info:: structure
 */
const updateMyInfoField = async (username, fieldName, fieldValue) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValues = platform.getUtility("findNestedDataValues");
    const setNestedDataValues = platform.getUtility("setNestedDataValues");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      console.error(`❌ User page not found for ${username}`);
      return false;
    }

    // Get current My Info data
    let currentMyInfo = findNestedDataValues(userPageUid, "My Info") || {};

    // Update the specific field
    currentMyInfo[fieldName] = fieldValue;

    // Save updated structure
    const success = await setNestedDataValues(
      userPageUid,
      "My Info",
      currentMyInfo,
      true
    );

    if (success) {
      console.log(`✅ Updated ${fieldName} for ${username}: ${fieldValue}`);
    } else {
      console.error(`❌ Failed to update ${fieldName} for ${username}`);
    }

    return success;
  } catch (error) {
    console.error(`Error updating My Info field for ${username}:`, error);
    return false;
  }
};

/**
 * Get all user profiles for directory (updated for My Info:: structure)
 */
const getAllUserProfiles = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    const members = getGraphMembers();
    console.log(
      `📊 Collecting My Info:: profiles for ${members.length} graph members...`
    );

    const profiles = await Promise.all(
      members.map((username) => getUserProfileData(username))
    );

    // Sort by username
    profiles.sort((a, b) => a.username.localeCompare(b.username));

    // Auto-initialize missing My Info:: structures
    const missingProfiles = profiles.filter((p) => p.needsMyInfoCreation);
    if (missingProfiles.length > 0) {
      console.log(
        `🎯 Auto-initializing My Info:: for ${missingProfiles.length} users...`
      );

      for (const profile of missingProfiles) {
        await initializeMyInfoStructure(profile.username);
      }

      // Re-collect profiles after initialization
      const updatedProfiles = await Promise.all(
        members.map((username) => getUserProfileData(username))
      );

      console.log(
        `✅ Collected ${updatedProfiles.length} user profiles with My Info:: structures`
      );
      return updatedProfiles.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
    }

    console.log(`✅ Collected ${profiles.length} user profiles`);
    return profiles;
  } catch (error) {
    console.error("Failed to collect user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🎨 USER DIRECTORY MODAL - Professional Interface (Updated)
// ===================================================================

/**
 * Create and display professional user directory modal
 * UPDATED: Now uses My Info:: structure data
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening User Directory with My Info:: data...");

    // Remove any existing modal
    const existingModal = document.getElementById("user-directory-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal container
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

    // Create modal content
    const content = document.createElement("div");
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      max-width: 95%;
      max-height: 90%;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
    `;

    // Loading state
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading user directory...</div>
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Collecting My Info:: structures and timezone data</div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Register for cleanup
    window._extensionRegistry.elements.push(modal);

    // Close on escape or background click
    const closeModal = () => {
      modal.remove();
    };

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Load data and build interface
    const profiles = await getAllUserProfiles();
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // Build complete modal content
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
            📋 User Directory
          </h2>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            ${
              profiles.length
            } graph members • My Info:: structure • Updated ${new Date().toLocaleTimeString()}
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
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Actions</th>
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
        💡 Tip: Click usernames to visit pages • Times update automatically • All data stored under "My Info::" • Missing profiles auto-created
      </div>
    `;

    // Start real-time clock updates
    startRealtimeClockUpdates(modal);

    console.log("✅ User Directory modal opened with My Info:: data");
  } catch (error) {
    console.error("Failed to show user directory:", error);
  }
};

/**
 * Create individual user row for directory table (same logic, updated data source)
 */
const createUserDirectoryRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;
  const rowClass = isCurrentUser ? "current-user-row" : "user-row";

  // Avatar display - now from My Info:: structure
  const avatarDisplay = profile.avatar
    ? `<img src="${profile.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${profile.username}">`
    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.username
        .charAt(0)
        .toUpperCase()}</div>`;

  // Current time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  // Completeness indicator
  const completenessColor =
    profile.completeness >= 75
      ? "#059669"
      : profile.completeness >= 50
      ? "#d97706"
      : "#dc2626";

  const actionButton = isCurrentUser
    ? `<button onclick="navigateToUserPage('${profile.username}')" style="
        background: #137cbd;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">Edit My Info</button>`
    : `<button onclick="navigateToUserPage('${profile.username}')" style="
        background: #f8f9fa;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
      ">View Page</button>`;

  return `
    <tr class="${rowClass}" style="
      border-bottom: 1px solid #f1f5f9;
      ${isCurrentUser ? "background: #f0f9ff;" : ""}
      ${index % 2 === 0 ? "background: #fafafa;" : ""}
    ">
      <td style="padding: 12px 16px; vertical-align: middle;">
        ${avatarDisplay}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 500; color: #1a202c;">${
            profile.username
          }</span>
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
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">
        ${profile.aboutMe || '<span style="color: #9ca3af;">—</span>'}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">
        ${profile.location || '<span style="color: #9ca3af;">—</span>'}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">
        ${profile.role || '<span style="color: #9ca3af;">—</span>'}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">
        ${profile.timezone || '<span style="color: #9ca3af;">—</span>'}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle;">
        ${timeDisplay}
      </td>
      <td style="padding: 12px 16px; vertical-align: middle;">
        ${actionButton}
      </td>
    </tr>
  `;
};

/**
 * Start real-time clock updates for timezone displays (unchanged)
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

  // Update every minute
  const interval = setInterval(updateClocks, 60000);

  // Stop when modal is removed
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
 * Navigate to user page (helper function - unchanged)
 */
window.navigateToUserPage = (username) => {
  const userPageUrl = `#/app/${window.roamAlphaAPI.graph.name}/page/${username}`;
  window.location.href = userPageUrl;

  // Close modal
  const modal = document.getElementById("user-directory-modal");
  if (modal) modal.remove();
};

// ===================================================================
// 📝 COMPLETION NUDGE SYSTEM - Updated for My Info:: Structure
// ===================================================================

/**
 * Check if current user needs profile completion nudging
 * UPDATED: Now checks My Info:: completeness
 */
const checkProfileCompletion = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    if (!currentUser) return false;

    const profile = await getUserProfileData(currentUser.displayName);

    // Check if My Info:: needs initialization
    if (profile.needsMyInfoCreation) {
      return {
        shouldNudge: true,
        profile: profile,
        missingFields: ["My Info:: structure needs creation"],
        needsInitialization: true,
      };
    }

    // Only nudge if completeness is below 75% and user exists
    if (
      profile.exists &&
      profile.completeness < 75 &&
      profile.missingFields.length > 0
    ) {
      return {
        shouldNudge: true,
        profile: profile,
        missingFields: profile.missingFields,
        needsInitialization: false,
      };
    }

    return { shouldNudge: false };
  } catch (error) {
    console.error("Failed to check profile completion:", error);
    return { shouldNudge: false };
  }
};

/**
 * Show profile completion nudge modal
 * UPDATED: Now mentions My Info:: structure
 */
const showCompletionNudgeModal = async (profileData) => {
  try {
    console.log("💡 Showing My Info:: completion nudge...");

    // Remove any existing nudge modal
    const existingModal = document.getElementById("completion-nudge-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "completion-nudge-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    `;

    const completenessColor =
      profileData.profile.completeness >= 50 ? "#d97706" : "#dc2626";

    const modalTitle = profileData.needsInitialization
      ? "Set Up Your Profile"
      : "Complete Your Profile";

    const modalMessage = profileData.needsInitialization
      ? "Your My Info:: structure will be auto-created with smart defaults"
      : `Your profile is ${profileData.profile.completeness}% complete`;

    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1a202c;">
          ${modalTitle}
        </h2>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
          ${modalMessage}
        </div>
        
        <div style="
          background: #f8f9fa;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
          text-align: left;
        ">
          <div style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 12px;">
            ${
              profileData.needsInitialization
                ? "Will Create:"
                : "Missing Information:"
            }
          </div>
          ${profileData.missingFields
            .map(
              (field) => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: ${completenessColor};"></div>
              <span style="font-size: 13px; color: #4b5563;">${field}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="window.navigateToUserPage('${
            profileData.profile.username
          }'); this.closest('#completion-nudge-modal').remove();" style="
            background: #137cbd;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">
            ${
              profileData.needsInitialization
                ? "Set Up Profile"
                : "Complete Profile"
            }
          </button>
          <button onclick="this.closest('#completion-nudge-modal').remove();" style="
            background: #f8f9fa;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
          ">
            Maybe Later
          </button>
        </div>
        
        <div style="margin-top: 16px; font-size: 12px; color: #999; text-align: center;">
          All profile data is stored under "My Info::" on your page
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Register for cleanup
    window._extensionRegistry.elements.push(modal);

    // Close on escape or background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modal.remove();
    });

    console.log("✅ My Info:: completion nudge displayed");
  } catch (error) {
    console.error("Failed to show completion nudge:", error);
  }
};

// ===================================================================
// 🔄 NAVIGATION INTEGRATION - Context-Aware User Page Buttons
// ===================================================================

/**
 * Add context-aware navigation buttons to user pages (unchanged logic)
 */
const addNavigationButtons = () => {
  try {
    // Remove any existing buttons
    document
      .querySelectorAll(".user-directory-nav-button")
      .forEach((btn) => btn.remove());

    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
    const isGraphMember = platform.getUtility("isGraphMember");

    const currentPageTitle = getCurrentPageTitle();
    const currentUser = getAuthenticatedUser();

    if (!currentPageTitle || !currentUser) return;

    // Check if we're on a user page
    const isUserPage = isGraphMember(currentPageTitle);
    if (!isUserPage) return;

    // Determine button type
    const isOwnPage = currentPageTitle === currentUser.displayName;

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "user-directory-nav-button";
    buttonContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    `;

    // Always show directory button
    const directoryButton = document.createElement("button");
    directoryButton.textContent = "📋 View Directory";
    directoryButton.style.cssText = `
      background: #137cbd;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background-color 0.2s ease;
    `;
    directoryButton.addEventListener("click", showUserDirectoryModal);
    directoryButton.addEventListener("mouseenter", () => {
      directoryButton.style.background = "#106ba3";
    });
    directoryButton.addEventListener("mouseleave", () => {
      directoryButton.style.background = "#137cbd";
    });

    buttonContainer.appendChild(directoryButton);

    // Add edit button only on own page
    if (isOwnPage) {
      const editButton = document.createElement("button");
      editButton.textContent = "✏️ Edit My Info";
      editButton.style.cssText = `
        background: #059669;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: background-color 0.2s ease;
      `;
      editButton.addEventListener("click", async () => {
        const completionCheck = await checkProfileCompletion();
        if (completionCheck.shouldNudge) {
          showCompletionNudgeModal(completionCheck);
        } else {
          console.log("✅ My Info:: profile appears complete!");
        }
      });
      editButton.addEventListener("mouseenter", () => {
        editButton.style.background = "#047857";
      });
      editButton.addEventListener("mouseleave", () => {
        editButton.style.background = "#059669";
      });

      buttonContainer.appendChild(editButton);
    }

    // Add to page
    document.body.appendChild(buttonContainer);

    // Register for cleanup
    window._extensionRegistry.elements.push(buttonContainer);

    console.log(
      `✅ Added navigation buttons for ${currentPageTitle} (${
        isOwnPage ? "own" : "other"
      } page)`
    );
  } catch (error) {
    console.error("Failed to add navigation buttons:", error);
  }
};

/**
 * Monitor page changes and update navigation buttons (unchanged)
 */
const startNavigationMonitoring = () => {
  // Initial button addition
  setTimeout(addNavigationButtons, 1000);

  // Monitor URL changes
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(addNavigationButtons, 500);
    }
    setTimeout(checkUrlChange, 1000);
  };

  checkUrlChange();

  console.log("📡 Navigation monitoring started");
};

// ===================================================================
// 🧪 TESTING AND VALIDATION - Updated for My Info:: Structure
// ===================================================================

/**
 * Run comprehensive directory system tests
 * UPDATED: Now tests My Info:: structure
 */
const runDirectoryTests = async () => {
  console.group("🧪 User Directory System Tests (My Info:: Structure)");

  try {
    // Test 1: User Profile Data Collection
    console.log("Test 1: My Info:: Profile Data Collection");
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const profile = await getUserProfileData(currentUser.displayName);
    console.log(`  Profile completeness: ${profile.completeness}%`);
    console.log(
      `  Missing fields: ${profile.missingFields.join(", ") || "None"}`
    );
    console.log(`  My Info:: data:`, profile.myInfoData);

    // Test 2: My Info:: Structure Creation
    console.log("Test 2: My Info:: Structure Initialization");
    if (profile.needsMyInfoCreation) {
      console.log(
        "  🎯 My Info:: structure missing - testing auto-creation..."
      );
      const success = await initializeMyInfoStructure(currentUser.displayName);
      console.log(`  Auto-creation: ${success ? "✅ Success" : "❌ Failed"}`);
    } else {
      console.log("  ✅ My Info:: structure already exists");
    }

    // Test 3: Nested Data Parsing
    console.log("Test 3: Nested Data Parsing");
    const findNestedDataValues = platform.getUtility("findNestedDataValues");
    const userPageUid = platform.getUtility("getPageUidByTitle")(
      currentUser.displayName
    );
    if (userPageUid) {
      const nestedData = findNestedDataValues(userPageUid, "My Info");
      console.log("  My Info:: raw data:", nestedData);
    }

    // Test 4: Timezone Management (unchanged)
    console.log("Test 4: Timezone Management");
    const testTimezones = ["EST", "America/New_York", "GMT+1", "PST"];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(
        `  ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "valid" : "invalid"
        })`
      );
    });

    // Test 5: Graph Members Collection
    console.log("Test 5: Graph Members Collection");
    const allProfiles = await getAllUserProfiles();
    console.log(`  Collected ${allProfiles.length} user profiles`);
    console.log(
      `  Average completeness: ${Math.round(
        allProfiles.reduce((sum, p) => sum + p.completeness, 0) /
          allProfiles.length
      )}%`
    );

    // Test 6: Profile Completion Check
    console.log("Test 6: Profile Completion Check");
    const completionCheck = await checkProfileCompletion();
    console.log(`  Should nudge: ${completionCheck.shouldNudge}`);
    console.log(
      `  Needs initialization: ${completionCheck.needsInitialization || false}`
    );
    if (completionCheck.shouldNudge) {
      console.log(`  Missing: ${completionCheck.missingFields.join(", ")}`);
    }

    console.log("✅ All My Info:: directory tests completed successfully");
  } catch (error) {
    console.error("❌ Directory test failed:", error);
  }

  console.groupEnd();
};

/**
 * Display directory system status
 * UPDATED: Now shows My Info:: structure status
 */
const showDirectoryStatus = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    const members = getGraphMembers();
    const profiles = await getAllUserProfiles();
    const averageCompleteness = Math.round(
      profiles.reduce((sum, p) => sum + p.completeness, 0) / profiles.length
    );

    const profilesWithMyInfo = profiles.filter(
      (p) => !p.needsMyInfoCreation
    ).length;

    console.group("📊 User Directory System Status (My Info:: Structure)");
    console.log(`📋 Graph Members: ${members.length}`);
    console.log(`👤 Current User: ${currentUser.displayName}`);
    console.log(
      `📊 Profiles with My Info::: ${profilesWithMyInfo}/${profiles.length}`
    );
    console.log(`📊 Average Profile Completeness: ${averageCompleteness}%`);
    console.log(
      `🕐 Timezone Manager: ${
        timezoneManager.getCommonTimezones().length
      } supported timezones`
    );
    console.log("🎯 Features:");
    console.log("  ✅ My Info:: Structure Auto-Creation");
    console.log("  ✅ Nested Data Parsing");
    console.log("  ✅ User Directory Modal");
    console.log("  ✅ Real-time Timezone Display");
    console.log("  ✅ Profile Completion Nudging");
    console.log("  ✅ Context-aware Navigation");
    console.groupEnd();
  } catch (error) {
    console.error("Failed to show directory status:", error);
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log(
      "👥 User Directory + Timezones starting (My Info:: Structure)..."
    );

    // ✅ VERIFY DEPENDENCIES
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

    // ✅ VERIFY ENHANCED UTILITIES
    const platform = window.RoamExtensionSuite;
    if (
      !platform.getUtility("findNestedDataValues") ||
      !platform.getUtility("setNestedDataValues")
    ) {
      console.error(
        "❌ Enhanced utilities with nested data parsing not found! Please load Extension 1.5 with nested data support."
      );
      return;
    }

    // 🎯 REGISTER DIRECTORY SERVICES
    const directoryServices = {
      // User profile services (updated)
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,
      initializeMyInfoStructure: initializeMyInfoStructure,
      updateMyInfoField: updateMyInfoField,

      // Directory UI services
      showUserDirectoryModal: showUserDirectoryModal,
      showCompletionNudgeModal: showCompletionNudgeModal,
      checkProfileCompletion: checkProfileCompletion,

      // Timezone services
      timezoneManager: timezoneManager,
      getCurrentTimeForUser: (tz) => timezoneManager.getCurrentTimeForUser(tz),
      validateTimezone: (tz) => timezoneManager.validateTimezone(tz),
      getCommonTimezones: () => timezoneManager.getCommonTimezones(),

      // Navigation services
      addNavigationButtons: addNavigationButtons,

      // Testing services
      runDirectoryTests: runDirectoryTests,
      showDirectoryStatus: showDirectoryStatus,
    };

    Object.entries(directoryServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Directory: Show User Directory",
        callback: showUserDirectoryModal,
      },
      {
        label: "Directory: Check My Profile Completion",
        callback: async () => {
          const check = await checkProfileCompletion();
          if (check.shouldNudge) {
            console.log(
              check.needsInitialization
                ? "🎯 My Info:: structure needs initialization"
                : `📊 Profile ${
                    check.profile.completeness
                  }% complete. Missing: ${check.missingFields.join(", ")}`
            );
            showCompletionNudgeModal(check);
          } else {
            console.log("✅ My Info:: profile appears complete!");
          }
        },
      },
      {
        label: "Directory: Initialize My Info Structure", // 🆕 NEW COMMAND
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            const success = await initializeMyInfoStructure(
              currentUser.displayName
            );
            console.log(
              `🎯 My Info:: initialization ${success ? "successful" : "failed"}`
            );
          }
        },
      },
      {
        label: "Directory: Show System Status",
        callback: showDirectoryStatus,
      },
      {
        label: "Directory: Run System Tests",
        callback: runDirectoryTests,
      },
      {
        label: "Directory: Test Timezone Parsing",
        callback: () => {
          console.group("🕐 Timezone Parsing Test");
          const testCases = [
            "EST",
            "America/New_York",
            "GMT+1",
            "PST",
            "Asia/Tokyo",
            "Invalid/Timezone",
          ];
          testCases.forEach((tz) => {
            const result = timezoneManager.getCurrentTimeForUser(tz);
            console.log(
              `${tz}: ${result.timeString} (${
                result.isValid ? "valid" : "invalid"
              })`
            );
          });
          console.groupEnd();
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 START NAVIGATION MONITORING
    startNavigationMonitoring();

    // 📊 AUTO-CHECK PROFILE COMPLETION (once per session)
    setTimeout(async () => {
      const completionCheck = await checkProfileCompletion();
      if (completionCheck.shouldNudge) {
        console.log(
          completionCheck.needsInitialization
            ? '🎯 My Info:: needs initialization - use "Directory: Initialize My Info Structure"'
            : '💡 Profile completion nudge available - use "Directory: Check My Profile Completion"'
        );
      }
    }, 3000);

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-directory",
      {
        services: directoryServices,
        timezoneManager: timezoneManager,
        version: "6.1.0", // Incremented for My Info:: structure
      },
      {
        name: "User Directory + Timezones (My Info:: Structure)",
        description:
          "Professional user directory with My Info:: nested structure, timezone intelligence and auto-creation",
        version: "6.1.0",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const memberCount = platform.getUtility("getGraphMemberCount")();

    console.log("✅ User Directory + Timezones loaded successfully!");
    console.log("🆕 NEW: My Info:: nested structure as source of truth");
    console.log(`👥 Directory ready for ${memberCount} graph members`);
    console.log(
      `🕐 Timezone support: ${
        timezoneManager.getCommonTimezones().length
      } common timezones`
    );
    console.log('💡 Try: Cmd+P → "Directory: Show User Directory"');

    // Quick status check
    setTimeout(async () => {
      const profile = await getUserProfileData(currentUser.displayName);
      console.log(
        profile.needsMyInfoCreation
          ? "🎯 My Info:: structure will be auto-created when needed"
          : `📊 Your My Info:: profile: ${profile.completeness}% complete`
      );
    }, 1000);
  },

  onunload: () => {
    console.log("👥 User Directory + Timezones unloading...");

    // Clean up navigation buttons
    document
      .querySelectorAll(".user-directory-nav-button")
      .forEach((btn) => btn.remove());

    // Close any open modals
    const modals = document.querySelectorAll(
      "#user-directory-modal, #completion-nudge-modal"
    );
    modals.forEach((modal) => modal.remove());

    console.log("✅ User Directory + Timezones cleanup complete!");
  },
};
