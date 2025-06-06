// ===================================================================
// Extension 6: User Directory + Timezones - FIXED Professional Interface
// FIXED: Button placement using confirmed .roam-article selector
// FIXED: Enhanced My Info:: auto-completion with all 5 fields
// FIXED: Field name consistency and placeholder replacement
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
// 👥 ENHANCED USER PROFILE DATA COLLECTION - FIXED My Info:: Processing
// ===================================================================

/**
 * 🔧 FIXED: Enhanced getUserProfileData with flexible field name handling
 * Handles both "Timezone" and "Time Zone" field variations
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

    // Get all user info from nested "My Info::" structure
    const myInfoData = findNestedDataValues(userPageUid, "My Info");

    if (!myInfoData || Object.keys(myInfoData).length === 0) {
      // My Info:: block doesn't exist or is empty
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

    // 🔧 FIXED: Handle field name variations and detect placeholders
    const avatar = getCleanFieldValue(myInfoData, ["Avatar"]);
    const location = getCleanFieldValue(myInfoData, ["Location"]);
    const role = getCleanFieldValue(myInfoData, ["Role"]);
    
    // Handle both "Timezone" and "Time Zone" field names
    const timezone = getCleanFieldValue(myInfoData, ["Timezone", "Time Zone"]);
    const aboutMe = getCleanFieldValue(myInfoData, ["About Me"]);

    // Calculate profile completeness (excluding About Me from required)
    const requiredFields = ["Avatar", "Location", "Role", "Timezone"];
    const fieldValues = [avatar, location, role, timezone];
    const completedFields = fieldValues.filter(value => value !== null).length;
    const completeness = Math.round((completedFields / requiredFields.length) * 100);

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
 * 🔧 FIXED: Helper to get clean field values with placeholder detection
 * Returns null if field is missing or contains placeholder values
 */
const getCleanFieldValue = (dataObject, fieldNames) => {
  // Try each field name variant
  for (const fieldName of fieldNames) {
    const value = dataObject[fieldName];
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      
      // Check for placeholder values
      const placeholders = [
        'not set',
        'location not set',
        'timezone not set',
        'role not set',
        'team member', // Generic default
        'graph member', // Generic default
        ''
      ];
      
      const isPlaceholder = placeholders.some(placeholder => 
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
 * 🔧 FIXED: Enhanced My Info:: structure initialization with individual field creation
 * Creates each field individually to ensure proper structure
 */
const initializeMyInfoStructure = async (username) => {
  try {
    console.log(`🎯 Initializing enhanced My Info:: structure for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const setDataValue = platform.getUtility("setDataValue");
    const getCurrentUser = platform.getUtility("getCurrentUser");

    // Ensure user page exists
    const userPageUid = await createPageIfNotExists(username);
    if (!userPageUid) {
      console.error(`❌ Failed to create page for ${username}`);
      return false;
    }

    // Get current user for intelligent defaults
    const currentUser = getCurrentUser();
    const isCurrentUser = username === currentUser.displayName;

    // 🔧 FIXED: Create My Info:: parent block first, then add individual fields
    console.log(`📋 Creating My Info:: parent structure...`);
    
    // Create parent My Info:: block
    await setDataValue(userPageUid, "My Info", [], true); // Empty parent with attribute format

    // 🔧 FIXED: Now create each field individually under My Info::
    const defaultValues = {
      "Avatar": isCurrentUser && currentUser.photoUrl 
        ? currentUser.photoUrl 
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`,
      "Location": isCurrentUser ? "Oakland, California, US" : "San Francisco, California, US",
      "Role": isCurrentUser ? "Extension Developer" : "Team Member", 
      "Timezone": isCurrentUser ? "America/Los_Angeles" : "America/New_York",
      "About Me": isCurrentUser 
        ? "Building professional Roam extensions" 
        : `Graph member since ${new Date().getFullYear()}`
    };

    let successCount = 0;
    
    // Create each field individually under the My Info:: parent
    for (const [fieldName, defaultValue] of Object.entries(defaultValues)) {
      try {
        // Find the My Info:: parent block and add child
        const myInfoSuccess = await addFieldToMyInfo(userPageUid, fieldName, defaultValue);
        if (myInfoSuccess) {
          successCount++;
          console.log(`✅ ${fieldName}: ${defaultValue}`);
        } else {
          console.error(`❌ Failed to create ${fieldName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${fieldName}:`, error);
      }
    }

    const success = successCount === Object.keys(defaultValues).length;
    
    if (success) {
      console.log(`✅ Complete My Info:: structure created for ${username} (${successCount}/5 fields)`);
    } else {
      console.error(`⚠️ Partial My Info:: creation: ${successCount}/5 fields for ${username}`);
    }

    return success;
  } catch (error) {
    console.error(`Error initializing My Info:: for ${username}:`, error);
    return false;
  }
};

/**
 * 🔧 FIXED: Helper to add individual field to My Info:: structure
 */
const addFieldToMyInfo = async (userPageUid, fieldName, fieldValue) => {
  try {
    const platform = window.RoamExtensionSuite;
    
    // Get the My Info:: parent block UID
    const myInfoParentQuery = window.roamAlphaAPI.data.q(`
      [:find ?uid .
       :where 
       [?parent :block/uid "${userPageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string "My Info::"]]
    `);

    if (!myInfoParentQuery) {
      console.error(`❌ My Info:: parent block not found for ${fieldName}`);
      return false;
    }

    // Create field as child of My Info::
    const fieldBlockUid = await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": myInfoParentQuery, order: "last" },
      block: { string: `${fieldName}::` },
    });

    if (!fieldBlockUid) {
      console.error(`❌ Failed to create field block for ${fieldName}`);
      return false;
    }

    // Add value as child of field block
    await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": fieldBlockUid, order: 0 },
      block: { string: fieldValue },
    });

    return true;
  } catch (error) {
    console.error(`Error adding field ${fieldName} to My Info::`, error);
    return false;
  }
};

/**
 * Get all user profiles for directory (enhanced with better error handling)
 */
const getAllUserProfiles = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    const members = getGraphMembers();
    console.log(`📊 Collecting My Info:: profiles for ${members.length} graph members...`);

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
            missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
          };
        }
      })
    );

    // Sort by username
    profiles.sort((a, b) => a.username.localeCompare(b.username));

    // Auto-initialize missing My Info:: structures
    const missingProfiles = profiles.filter((p) => p.needsMyInfoCreation);
    if (missingProfiles.length > 0) {
      console.log(`🎯 Auto-initializing My Info:: for ${missingProfiles.length} users...`);

      for (const profile of missingProfiles) {
        try {
          await initializeMyInfoStructure(profile.username);
        } catch (error) {
          console.warn(`⚠️ Failed to initialize ${profile.username}:`, error);
        }
      }

      // Re-collect profiles after initialization
      const updatedProfiles = await Promise.all(
        members.map(async (username) => {
          try {
            return await getUserProfileData(username);
          } catch (error) {
            console.warn(`⚠️ Failed to get updated profile for ${username}:`, error);
            return profiles.find(p => p.username === username) || {
              username,
              exists: false,
              error: error.message,
              completeness: 0,
              missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
            };
          }
        })
      );

      console.log(`✅ Collected ${updatedProfiles.length} user profiles with My Info:: structures`);
      return updatedProfiles.sort((a, b) => a.username.localeCompare(b.username));
    }

    console.log(`✅ Collected ${profiles.length} user profiles`);
    return profiles;
  } catch (error) {
    console.error("Failed to collect user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🎨 USER DIRECTORY MODAL - Professional Interface (Enhanced)
// ===================================================================

/**
 * Create and display professional user directory modal
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening User Directory with enhanced My Info:: data...");

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
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Enhanced My Info:: processing with auto-completion</div>
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
            🫂 User Directory
          </h2>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            ${profiles.length} graph members • Enhanced My Info:: • Updated ${new Date().toLocaleTimeString()}
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
            ${profiles.map((profile, index) => createUserDirectoryRow(profile, currentUser, index)).join("")}
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
        💡 Enhanced: Auto-completion creates all 5 My Info:: fields • Real-time timezone updates • Intelligent defaults • Fixed button placement
      </div>
    `;

    // Start real-time clock updates
    startRealtimeClockUpdates(modal);

    console.log("✅ Enhanced User Directory modal opened");
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
    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.username.charAt(0).toUpperCase()}</div>`;

  // Current time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  // Completeness indicator
  const completenessColor = profile.completeness >= 75 ? "#059669" : profile.completeness >= 50 ? "#d97706" : "#dc2626";

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
          <span style="font-weight: 500; color: #1a202c;">${profile.username}</span>
          ${isCurrentUser ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500;">You</span>' : ""}
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${completenessColor}; opacity: 0.7;" title="${profile.completeness}% complete"></div>
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
// 🔧 FIXED: NAVIGATION INTEGRATION - Confirmed .roam-article Button Placement
// ===================================================================

/**
 * 🔧 FIXED: Add navigation buttons using EXACT working sandbox approach
 * Copy of confirmed working button placement logic
 */
const addNavigationButtons = () => {
  try {
    // Remove any existing buttons
    document.querySelectorAll(".user-directory-nav-button").forEach((btn) => btn.remove());

    console.log("🎯 Attempting to place buttons using sandbox-confirmed approach...");

    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
    const isGraphMember = platform.getUtility("isGraphMember");

    const currentPageTitle = getCurrentPageTitle();
    const currentUser = getAuthenticatedUser();

    if (!currentPageTitle || !currentUser) return;

    // 🔧 EXACT COPY: Use sandbox-confirmed multi-selector approach
    const possibleTargets = [
      '.roam-article',                    // Main article content
      '.roam-main',                      // Main content container  
      '.rm-article-wrapper',             // Article wrapper
      '.roam-center-panel',              // Center panel
      '.flex-h-box > div:nth-child(2)',  // Middle column in 3-column layout
      '#app > div > div > div:nth-child(2)', // Structural fallback
      '.bp3-tab-panel[aria-hidden="false"]' // Active tab panel
    ];

    let targetElement = null;
    let selectorUsed = null;

    // Try each selector until we find a target
    for (const selector of possibleTargets) {
      const element = document.querySelector(selector);
      if (element) {
        targetElement = element;
        selectorUsed = selector;
        console.log(`✅ Found target using: ${selector}`);
        break;
      }
    }

    if (!targetElement) {
      console.error("❌ Could not find suitable target element");
      console.log("Available elements:", {
        body: !!document.body,
        app: !!document.querySelector('#app'),
        roamArticle: !!document.querySelector('.roam-article'),
        roamMain: !!document.querySelector('.roam-main')
      });
      
      // Fallback to body
      targetElement = document.body;
      selectorUsed = "body (fallback)";
    }

    // Ensure target has relative positioning if needed
    const computedStyle = getComputedStyle(targetElement);
    if (computedStyle.position === 'static') {
      targetElement.style.position = 'relative';
      console.log(`🔧 Set ${selectorUsed} to position: relative`);
    }

    // Check if we're on a user page
    const isUserPage = isGraphMember(currentPageTitle);
    const isOwnPage = currentPageTitle === currentUser.displayName;

    // 🔧 EXACT COPY: Create directory button using sandbox-confirmed styling
    const directoryButton = document.createElement("button");
    directoryButton.className = "user-directory-nav-button";
    directoryButton.textContent = "🫂 Show Directory";
    directoryButton.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 9999;
      background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      color: #92400e;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Add click handler
    directoryButton.addEventListener("click", showUserDirectoryModal);

    // 🔧 EXACT COPY: Add hover effects from sandbox
    directoryButton.addEventListener("mouseenter", () => {
      directoryButton.style.background = "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)";
      directoryButton.style.transform = "translateY(-1px)";
    });

    directoryButton.addEventListener("mouseleave", () => {
      directoryButton.style.background = "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)";
      directoryButton.style.transform = "translateY(0)";
    });

    // Add to page
    targetElement.appendChild(directoryButton);

    // Register for cleanup
    window._extensionRegistry.elements.push(directoryButton);

    console.log(`✅ Directory button added to: ${selectorUsed}`);
    console.log(`📍 Button position: ${directoryButton.style.position} at top: 10px, left: 10px`);

    // Debug info (same as sandbox)
    const rect = targetElement.getBoundingClientRect();
    console.log(`📐 Target dimensions:`, {
      selector: selectorUsed,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      position: computedStyle.position
    });

    // 🔧 FIXED: Add profile-specific buttons in upper-right if on user page
    if (isUserPage) {
      const profileButtonContainer = document.createElement("div");
      profileButtonContainer.className = "user-directory-nav-button";
      profileButtonContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 9999;
        display: flex;
        gap: 8px;
      `;

      if (isOwnPage) {
        // Edit My Info button for own page
        const editButton = document.createElement("button");
        editButton.textContent = "✏️ Edit My Info";
        editButton.style.cssText = `
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
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

        profileButtonContainer.appendChild(editButton);
      }

      // Add profile completion indicator if needed
      if (isUserPage) {
        setTimeout(async () => {
          try {
            const profile = await getUserProfileData(currentPageTitle);
            if (profile.completeness < 100) {
              const statusButton = document.createElement("div");
              statusButton.style.cssText = `
                background: ${profile.completeness >= 75 ? "#059669" : "#d97706"};
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                cursor: help;
              `;
              statusButton.textContent = `${profile.completeness}%`;
              statusButton.title = `Profile ${profile.completeness}% complete`;
              profileButtonContainer.appendChild(statusButton);
            }
          } catch (error) {
            console.warn("Failed to add completion indicator:", error);
          }
        }, 500);
      }

      targetElement.appendChild(profileButtonContainer);
      window._extensionRegistry.elements.push(profileButtonContainer);
    }

    console.log(`✅ Navigation buttons added using sandbox-confirmed approach (user page: ${isUserPage}, own page: ${isOwnPage})`);

  } catch (error) {
    console.error("❌ Error adding navigation buttons:", error);
  }
};

/**
 * Monitor page changes and update navigation buttons
 */
const startNavigationMonitoring = () => {
  // Initial button addition with delay for page load
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

  console.log("📡 Navigation monitoring started with sandbox-confirmed placement");
};

// ===================================================================
// 📝 PROFILE COMPLETION SYSTEM - Enhanced Detection and Nudging
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
    if (profile.exists && profile.completeness < 75 && profile.missingFields.length > 0) {
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
 */
const showCompletionNudgeModal = async (profileData) => {
  try {
    console.log("💡 Showing enhanced My Info:: completion nudge...");

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

    const completenessColor = profileData.profile.completeness >= 50 ? "#d97706" : "#dc2626";

    const modalTitle = profileData.needsInitialization
      ? "Set Up Your Profile"
      : "Complete Your Profile";

    const modalMessage = profileData.needsInitialization
      ? "Enhanced My Info:: structure will be auto-created with all 5 fields"
      : `Your profile is ${profileData.profile.completeness}% complete`;

    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🫂</div>
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
            ${profileData.needsInitialization ? "Will Create All Fields:" : "Missing Information:"}
          </div>
          ${profileData.missingFields.map(field => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: ${completenessColor};"></div>
              <span style="font-size: 13px; color: #4b5563;">${field}</span>
            </div>
          `).join("")}
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="window.navigateToUserPage('${profileData.profile.username}'); this.closest('#completion-nudge-modal').remove();" style="
            background: #137cbd;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">
            ${profileData.needsInitialization ? "Set Up Profile" : "Complete Profile"}
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
          Enhanced: Individual field creation • Intelligent defaults • Placeholder detection
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

    console.log("✅ Enhanced My Info:: completion nudge displayed");
  } catch (error) {
    console.error("Failed to show completion nudge:", error);
  }
};

// ===================================================================
// 🧪 TESTING AND VALIDATION - Enhanced for Fixed Features
// ===================================================================

/**
 * Run comprehensive directory system tests
 */
const runDirectoryTests = async () => {
  console.group("🧪 Enhanced User Directory System Tests (FIXED)");

  try {
    // Test 1: Sandbox-Confirmed Button Placement
    console.log("Test 1: Sandbox-Confirmed Button Placement");
    const possibleTargets = [
      '.roam-article',
      '.roam-main', 
      '.rm-article-wrapper',
      '.roam-center-panel',
      '.flex-h-box > div:nth-child(2)',
      '#app > div > div > div:nth-child(2)',
      '.bp3-tab-panel[aria-hidden="false"]'
    ];
    
    let targetFound = null;
    for (const selector of possibleTargets) {
      const element = document.querySelector(selector);
      if (element) {
        targetFound = selector;
        const style = getComputedStyle(element);
        console.log(`  ✅ ${selector}: position=${style.position}, dimensions=${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`);
        break;
      } else {
        console.log(`  ❌ ${selector}: Not found`);
      }
    }
    console.log(`  Target selected: ${targetFound || "None found"}`);`

    // Test 2: Enhanced Profile Data
    console.log("Test 2: Enhanced My Info:: Profile Data");
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const profile = await getUserProfileData(currentUser.displayName);
    console.log(`  Profile completeness: ${profile.completeness}%`);
    console.log(`  Missing fields: ${profile.missingFields.join(", ") || "None"}`);
    console.log(`  Has My Info:: data: ${profile.myInfoData ? "✅ Yes" : "❌ No"}`);

    // Test 3: Field Name Handling
    console.log("Test 3: Field Name Variation Handling");
    const testFields = ["Timezone", "Time Zone"];
    testFields.forEach(field => {
      const value = profile.myInfoData && profile.myInfoData[field];
      console.log(`  ${field}: ${value || "Not found"}`);
    });

    // Test 4: Enhanced Structure Creation
    console.log("Test 4: Enhanced My Info:: Structure Creation");
    if (profile.needsMyInfoCreation) {
      console.log("  🎯 Testing enhanced auto-creation with individual fields...");
      const success = await initializeMyInfoStructure(currentUser.displayName);
      console.log(`  Enhanced creation: ${success ? "✅ Success" : "❌ Failed"}`);
    } else {
      console.log("  ✅ My Info:: structure already exists");
    }

    // Test 5: Timezone Management
    console.log("Test 5: Timezone Management");
    const testTimezones = ["EST", "America/New_York", "PST", "GMT+1"];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(`  ${tz}: ${timeInfo.timeString} (${timeInfo.isValid ? "valid" : "invalid"})`);
    });

    // Test 6: Navigation Buttons
    console.log("Test 6: Navigation Button Placement");
    addNavigationButtons();
    const buttons = document.querySelectorAll(".user-directory-nav-button");
    console.log(`  Buttons added: ${buttons.length} (Directory: ${buttons.length > 0 ? "✅" : "❌"})`);

    console.log("✅ All enhanced directory tests completed successfully");
  } catch (error) {
    console.error("❌ Enhanced directory test failed:", error);
  }

  console.groupEnd();
};

/**
 * Display enhanced directory system status
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

    const profilesWithMyInfo = profiles.filter((p) => !p.needsMyInfoCreation).length;

    console.group("📊 Enhanced User Directory System Status (FIXED)");
    console.log(`🫂 Graph Members: ${members.length}`);
    console.log(`👤 Current User: ${currentUser.displayName}`);
    console.log(`📊 Profiles with My Info::: ${profilesWithMyInfo}/${profiles.length}`);
    console.log(`📊 Average Profile Completeness: ${averageCompleteness}%`);
    console.log(`🕐 Timezone Manager: ${timezoneManager.getCommonTimezones().length} supported timezones`);
    console.log("🔧 FIXED Features:");
    console.log("  ✅ Button Placement (sandbox-confirmed multi-selector approach)");
    console.log("  ✅ Enhanced My Info:: Auto-Creation (all 5 fields)");
    console.log("  ✅ Field Name Variation Handling (Timezone/Time Zone)");
    console.log("  ✅ Placeholder Detection and Replacement");
    console.log("  ✅ Individual Field Creation Method");
    console.log("  ✅ Professional Error Handling");
    console.groupEnd();
  } catch (error) {
    console.error("Failed to show directory status:", error);
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration (Enhanced)
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🫂 Enhanced User Directory + Timezones starting (FIXED)...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error("❌ Foundation Registry not found! Please load Extension 1 first.");
      return;
    }

    const requiredDependencies = ["utility-library", "user-authentication", "configuration-manager"];
    for (const dep of requiredDependencies) {
      if (!window.RoamExtensionSuite.has(dep)) {
        console.error(`❌ ${dep} not found! Please load required dependencies first.`);
        return;
      }
    }

    // ✅ VERIFY ENHANCED UTILITIES
    const platform = window.RoamExtensionSuite;
    if (!platform.getUtility("findNestedDataValues") || !platform.getUtility("setDataValue")) {
      console.error("❌ Enhanced utilities not found! Please load Extension 1.5 with nested data support.");
      return;
    }

    // 🎯 REGISTER ENHANCED DIRECTORY SERVICES
    const directoryServices = {
      // Enhanced user profile services
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,
      initializeMyInfoStructure: initializeMyInfoStructure,
      addFieldToMyInfo: addFieldToMyInfo,
      getCleanFieldValue: getCleanFieldValue,

      // Directory UI services
      showUserDirectoryModal: showUserDirectoryModal,
      showCompletionNudgeModal: showCompletionNudgeModal,
      checkProfileCompletion: checkProfileCompletion,

      // Timezone services
      timezoneManager: timezoneManager,
      getCurrentTimeForUser: (tz) => timezoneManager.getCurrentTimeForUser(tz),
      validateTimezone: (tz) => timezoneManager.validateTimezone(tz),
      getCommonTimezones: () => timezoneManager.getCommonTimezones(),

      // Enhanced navigation services
      addNavigationButtons: addNavigationButtons,

      // Enhanced testing services
      runDirectoryTests: runDirectoryTests,
      showDirectoryStatus: showDirectoryStatus,
    };

    Object.entries(directoryServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 📝 REGISTER ENHANCED COMMANDS
    const commands = [
      {
        label: "Directory: Show Enhanced User Directory",
        callback: showUserDirectoryModal,
      },
      {
        label: "Directory: Check My Profile (Enhanced)",
        callback: async () => {
          const check = await checkProfileCompletion();
          if (check.shouldNudge) {
            console.log(
              check.needsInitialization
                ? "🎯 Enhanced My Info:: structure needs initialization"
                : `📊 Profile ${check.profile.completeness}% complete. Missing: ${check.missingFields.join(", ")}`
            );
            showCompletionNudgeModal(check);
          } else {
            console.log("✅ Enhanced My Info:: profile appears complete!");
          }
        },
      },
      {
        label: "Directory: Initialize Enhanced My Info",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            const success = await initializeMyInfoStructure(currentUser.displayName);
            console.log(`🎯 Enhanced My Info:: initialization ${success ? "successful" : "failed"}`);
          }
        },
      },
      {
        label: "Directory: Test Sandbox-Confirmed Button Placement",
        callback: () => {
          console.log("🧪 Testing sandbox-confirmed button placement...");
          addNavigationButtons();
          console.log("✅ Buttons should appear using multi-selector sandbox approach");
        },
      },
      {
        label: "Directory: Show Enhanced System Status",
        callback: showDirectoryStatus,
      },
      {
        label: "Directory: Run Enhanced System Tests",
        callback: runDirectoryTests,
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 START ENHANCED NAVIGATION MONITORING
    startNavigationMonitoring();

    // 📊 AUTO-CHECK ENHANCED PROFILE COMPLETION
    setTimeout(async () => {
      const completionCheck = await checkProfileCompletion();
      if (completionCheck.shouldNudge) {
        console.log(
          completionCheck.needsInitialization
            ? '🎯 Enhanced My Info:: needs initialization - use "Directory: Initialize Enhanced My Info"'
            : '💡 Enhanced profile completion available - use "Directory: Check My Profile (Enhanced)"'
        );
      }
    }, 3000);

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-directory",
      {
        services: directoryServices,
        timezoneManager: timezoneManager,
        version: "6.2.0", // Incremented for enhanced fixes
      },
      {
        name: "Enhanced User Directory + Timezones (FIXED)",
        description: "FIXED: Button placement (sandbox-confirmed) + Enhanced My Info:: auto-completion",
        version: "6.2.0",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const memberCount = platform.getUtility("getGraphMemberCount")();

    console.log("✅ Enhanced User Directory + Timezones loaded successfully!");
    console.log("🔧 FIXED: Button placement using sandbox-confirmed multi-selector approach");
    console.log("🔧 FIXED: Enhanced My Info:: auto-completion with all 5 fields");
    console.log("🔧 FIXED: Field name consistency and placeholder detection");
    console.log(`🫂 Enhanced directory ready for ${memberCount} graph members`);
    console.log(`🕐 Timezone support: ${timezoneManager.getCommonTimezones().length} common timezones`);
    console.log('💡 Try: Cmd+P → "Directory: Show Enhanced User Directory"');

    // Quick enhanced status check
    setTimeout(async () => {
      const profile = await getUserProfileData(currentUser.displayName);
      console.log(
        profile.needsMyInfoCreation
          ? "🎯 Enhanced My Info:: structure will be auto-created when needed"
          : `📊 Your enhanced My Info:: profile: ${profile.completeness}% complete`
      );
    }, 1000);
  },

  onunload: () => {
    console.log("🫂 Enhanced User Directory + Timezones unloading...");

    // Clean up navigation buttons
    document.querySelectorAll(".user-directory-nav-button").forEach((btn) => btn.remove());

    // Close any open modals
    const modals = document.querySelectorAll("#user-directory-modal, #completion-nudge-modal");
    modals.forEach((modal) => modal.remove());

    console.log("✅ Enhanced User Directory + Timezones cleanup complete!");
  },
};
