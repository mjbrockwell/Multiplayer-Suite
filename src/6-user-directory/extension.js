// ===================================================================
// Extension 6: User Directory + Timezones - Professional Graph Member Interface
// Leverages Extensions 1, 1.5, 2, 3 for complete user directory functionality
// Focus: User profiles, timezone intelligence, directory management, completion nudging
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
      // Convert to IANA format (simplified)
      if (offset === 0) return "UTC";
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
   * Get timezone offset for sorting
   */
  getTimezoneOffset(timezoneString) {
    const timezone = this.parseTimezone(timezoneString);
    if (!timezone) return 0;

    try {
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const local = new Date(
        utc.toLocaleString("en-US", { timeZone: timezone })
      );
      return (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
    } catch (error) {
      return 0;
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
// 👥 USER PROFILE DATA COLLECTION - Comprehensive User Information
// ===================================================================

/**
 * Collect complete user profile data with validation
 */
const getUserProfileData = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findDataValue = platform.getUtility("findDataValue");

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
      };
    }

    // Collect all profile attributes
    const avatar = findDataValue(userPageUid, "Avatar");
    const location = findDataValue(userPageUid, "Location");
    const role = findDataValue(userPageUid, "Role");
    const timezone = findDataValue(userPageUid, "Timezone");
    const aboutMe = findDataValue(userPageUid, "About Me");

    // Calculate profile completeness
    const fields = [avatar, location, role, timezone];
    const completedFields = fields.filter(
      (field) => field !== null && field.trim !== ""
    ).length;
    const completeness = Math.round((completedFields / fields.length) * 100);

    // Get timezone information
    let timezoneInfo = null;
    if (timezone) {
      timezoneInfo = timezoneManager.getCurrentTimeForUser(timezone);
    }

    return {
      username,
      exists: true,
      avatar: avatar || null,
      location: location || null,
      role: role || null,
      timezone: timezone || null,
      aboutMe: aboutMe || null,
      completeness,
      timezoneInfo,
      missingFields: fields
        .map((field, index) =>
          field === null
            ? ["Avatar", "Location", "Role", "Timezone"][index]
            : null
        )
        .filter(Boolean),
    };
  } catch (error) {
    console.error(`Failed to get profile data for ${username}:`, error);
    return {
      username,
      exists: false,
      error: error.message,
      completeness: 0,
    };
  }
};

/**
 * Get all user profiles for directory
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
      members.map((username) => getUserProfileData(username))
    );

    // Sort by username
    profiles.sort((a, b) => a.username.localeCompare(b.username));

    console.log(`✅ Collected ${profiles.length} user profiles`);
    return profiles;
  } catch (error) {
    console.error("Failed to collect user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🎨 USER DIRECTORY MODAL - Professional Interface
// ===================================================================

/**
 * Create and display professional user directory modal
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening User Directory...");

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
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Collecting user profiles and timezone data</div>
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
            } graph members • Updated ${new Date().toLocaleTimeString()}
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
        💡 Tip: Click usernames to visit pages • Times update automatically • Add timezone info to your profile for accurate display
      </div>
    `;

    // Start real-time clock updates
    startRealtimeClockUpdates(modal);

    console.log("✅ User Directory modal opened");
  } catch (error) {
    console.error("Failed to show user directory:", error);
  }
};

/**
 * Create individual user row for directory table
 */
const createUserDirectoryRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;
  const rowClass = isCurrentUser ? "current-user-row" : "user-row";

  // Avatar display
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
      ">Edit Profile</button>`
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
 * Start real-time clock updates for timezone displays
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
 * Navigate to user page (helper function)
 */
window.navigateToUserPage = (username) => {
  const userPageUrl = `#/app/${window.roamAlphaAPI.graph.name}/page/${username}`;
  window.location.href = userPageUrl;

  // Close modal
  const modal = document.getElementById("user-directory-modal");
  if (modal) modal.remove();
};

// ===================================================================
// 📝 COMPLETION NUDGE SYSTEM - Profile Completion Prompting
// ===================================================================

/**
 * Check if current user needs profile completion nudging
 */
const checkProfileCompletion = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    if (!currentUser) return false;

    const profile = await getUserProfileData(currentUser.displayName);

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
 */
const showCompletionNudgeModal = async (profileData) => {
  try {
    console.log("💡 Showing profile completion nudge...");

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

    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1a202c;">
          Complete Your Profile
        </h2>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
          Your profile is ${profileData.profile.completeness}% complete
        </div>
        
        <div style="
          background: #f8f9fa;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
          text-align: left;
        ">
          <div style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 12px;">
            Missing Information:
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
            Complete Profile
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

    console.log("✅ Profile completion nudge displayed");
  } catch (error) {
    console.error("Failed to show completion nudge:", error);
  }
};

// ===================================================================
// 🔄 NAVIGATION INTEGRATION - Context-Aware User Page Buttons
// ===================================================================

/**
 * Add context-aware navigation buttons to user pages
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
      editButton.textContent = "✏️ Edit Profile";
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
          console.log("✅ Profile appears complete!");
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
 * Monitor page changes and update navigation buttons
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
// ⚙️ CONFIGURATION SCHEMA EXTENSION - Add Timezone Support
// ===================================================================

/**
 * Extend Configuration Manager with timezone schema
 */
const extendConfigurationSchemas = () => {
  try {
    const platform = window.RoamExtensionSuite;

    if (!platform.has("configuration-manager")) {
      console.warn(
        "Configuration Manager not found - skipping schema extension"
      );
      return false;
    }

    // This would ideally extend the schemas in Extension 3
    // For now, we'll just register our timezone validation
    const timezoneSchema = {
      type: "select",
      description: "Your timezone for accurate time display in directory",
      options: timezoneManager.getCommonTimezones().map((tz) => tz.value),
      default: "America/New_York",
      validation: (value) => {
        return (
          timezoneManager.validateTimezone(value) || "Invalid timezone format"
        );
      },
    };

    // Register timezone utilities
    platform.registerUtility("validateTimezone", (tz) =>
      timezoneManager.validateTimezone(tz)
    );
    platform.registerUtility("parseTimezone", (tz) =>
      timezoneManager.parseTimezone(tz)
    );
    platform.registerUtility("getCommonTimezones", () =>
      timezoneManager.getCommonTimezones()
    );

    console.log("✅ Extended configuration schemas with timezone support");
    return true;
  } catch (error) {
    console.error("Failed to extend configuration schemas:", error);
    return false;
  }
};

// ===================================================================
// 🧪 TESTING AND VALIDATION - Directory System Health Checks
// ===================================================================

/**
 * Run comprehensive directory system tests
 */
const runDirectoryTests = async () => {
  console.group("🧪 User Directory System Tests");

  try {
    // Test 1: User Profile Data Collection
    console.log("Test 1: User Profile Data Collection");
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const profile = await getUserProfileData(currentUser.displayName);
    console.log(`  Profile completeness: ${profile.completeness}%`);
    console.log(
      `  Missing fields: ${profile.missingFields.join(", ") || "None"}`
    );

    // Test 2: Timezone Management
    console.log("Test 2: Timezone Management");
    const testTimezones = ["EST", "America/New_York", "GMT+1", "PST"];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(
        `  ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "valid" : "invalid"
        })`
      );
    });

    // Test 3: Graph Members Collection
    console.log("Test 3: Graph Members Collection");
    const allProfiles = await getAllUserProfiles();
    console.log(`  Collected ${allProfiles.length} user profiles`);
    console.log(
      `  Average completeness: ${Math.round(
        allProfiles.reduce((sum, p) => sum + p.completeness, 0) /
          allProfiles.length
      )}%`
    );

    // Test 4: Profile Completion Check
    console.log("Test 4: Profile Completion Check");
    const completionCheck = await checkProfileCompletion();
    console.log(`  Should nudge: ${completionCheck.shouldNudge}`);
    if (completionCheck.shouldNudge) {
      console.log(`  Missing: ${completionCheck.missingFields.join(", ")}`);
    }

    console.log("✅ All directory tests completed successfully");
  } catch (error) {
    console.error("❌ Directory test failed:", error);
  }

  console.groupEnd();
};

/**
 * Display directory system status
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

    console.group("📊 User Directory System Status");
    console.log(`📋 Graph Members: ${members.length}`);
    console.log(`👤 Current User: ${currentUser.displayName}`);
    console.log(`📊 Average Profile Completeness: ${averageCompleteness}%`);
    console.log(
      `🕐 Timezone Manager: ${
        timezoneManager.getCommonTimezones().length
      } supported timezones`
    );
    console.log("🎯 Features:");
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
    console.log("👥 User Directory + Timezones starting...");

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

    // 🎯 REGISTER DIRECTORY SERVICES
    const platform = window.RoamExtensionSuite;

    const directoryServices = {
      // User profile services
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,

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

    // 🔧 EXTEND CONFIGURATION SCHEMAS
    extendConfigurationSchemas();

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
              `📊 Profile ${
                check.profile.completeness
              }% complete. Missing: ${check.missingFields.join(", ")}`
            );
            showCompletionNudgeModal(check);
          } else {
            console.log("✅ Profile appears complete!");
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
          '💡 Profile completion nudge available - use "Directory: Check My Profile Completion"'
        );
      }
    }, 3000);

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-directory",
      {
        services: directoryServices,
        timezoneManager: timezoneManager,
        version: "6.0.0",
      },
      {
        name: "User Directory + Timezones",
        description:
          "Professional user directory with real-time timezone intelligence and profile management",
        version: "6.0.0",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const platform_current = window.RoamExtensionSuite;
    const currentUser = platform_current.getUtility("getAuthenticatedUser")();
    const memberCount = platform_current.getUtility("getGraphMemberCount")();

    console.log("✅ User Directory + Timezones loaded successfully!");
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
      console.log(`📊 Your profile: ${profile.completeness}% complete`);
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
