// ===================================================================
// Extension 6: User Directory + Timezones - FIXED Professional Interface
// FIXES: Autofill intelligence, button placement, field mapping, data operation errors
// Leverages Extensions 1, 1.5, 2, 3 + enhanced nested data parsing
// Focus: Intelligent defaults, professional UI, robust data operations
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
// 🧠 INTELLIGENT AUTOFILL SYSTEM - Smart Defaults Engine
// ===================================================================

/**
 * 🔥 FIXED: Generate intelligent defaults based on user context
 * Replaces placeholder values with smart, contextual defaults
 */
const generateIntelligentDefaults = (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const isCurrentUser = username === currentUser?.displayName;

    // Detect likely location from browser timezone
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let smartLocation = "Location not set";
    let smartTimezone = browserTimezone || "America/Los_Angeles";

    // Map common timezones to likely locations
    const timezoneLocationMap = {
      "America/New_York": "New York, NY, US",
      "America/Chicago": "Chicago, IL, US",
      "America/Denver": "Denver, CO, US",
      "America/Los_Angeles": "Oakland, California, US", // Default from context
      "Europe/London": "London, UK",
      "Europe/Paris": "Paris, France",
      "Asia/Tokyo": "Tokyo, Japan",
      "Asia/Shanghai": "Shanghai, China",
      "Asia/Singapore": "Singapore",
      "Australia/Sydney": "Sydney, Australia",
    };

    if (timezoneLocationMap[browserTimezone]) {
      smartLocation = timezoneLocationMap[browserTimezone];
    }

    // Generate smart avatar URL
    const smartAvatar =
      currentUser?.photoUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        username
      )}&backgroundColor=4f46e5&textColor=ffffff`;

    // Generate contextual role based on username and graph context
    let smartRole = "Team Member";
    if (isCurrentUser) {
      smartRole = "Extension Developer"; // From context
    } else if (username.toLowerCase().includes("admin")) {
      smartRole = "Administrator";
    } else if (username.toLowerCase().includes("dev")) {
      smartRole = "Developer";
    } else if (username.toLowerCase().includes("manager")) {
      smartRole = "Manager";
    }

    // Generate smart about me
    let smartAboutMe = "Graph member";
    if (isCurrentUser) {
      smartAboutMe = "Building professional Roam extensions"; // From context
    } else {
      smartAboutMe = `${smartRole} in our graph workspace`;
    }

    const intelligentDefaults = {
      Avatar: smartAvatar,
      Location: smartLocation,
      Role: smartRole,
      Timezone: smartTimezone, // ✅ FIXED: Use "Timezone" not "Time Zone"
      "About Me": smartAboutMe,
    };

    console.log(
      `🧠 Generated intelligent defaults for ${username}:`,
      intelligentDefaults
    );
    return intelligentDefaults;
  } catch (error) {
    console.error(
      `Error generating intelligent defaults for ${username}:`,
      error
    );

    // Fallback defaults if smart generation fails
    return {
      Avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        username
      )}`,
      Location: "Oakland, California, US",
      Role: "Team Member",
      Timezone: "America/Los_Angeles",
      "About Me": "Graph member",
    };
  }
};

/**
 * 🔥 FIXED: Check if a value is a placeholder that needs replacement
 */
const isPlaceholderValue = (value) => {
  if (!value || typeof value !== "string") return true;

  const placeholderPatterns = [
    "my avatar here",
    "avatar here",
    "placeholder",
    "your avatar",
    "location not set",
    "not set",
    "i'm a groovy dude",
    "groovy dude",
    "digs grooves",
    "default",
    "example",
    "sample",
    "temp",
    "temporary",
  ];

  const cleanValue = value.toLowerCase().trim();
  return placeholderPatterns.some((pattern) => cleanValue.includes(pattern));
};

/**
 * 🔥 FIXED: Replace placeholder values with intelligent defaults
 */
const replaceWithIntelligentDefaults = async (username, currentData) => {
  try {
    console.log(`🔄 Replacing placeholders for ${username}...`);
    console.log("Current data:", currentData);

    const intelligentDefaults = generateIntelligentDefaults(username);
    const updatedData = { ...currentData };
    let replacementCount = 0;

    // Check each field and replace if it's a placeholder
    for (const [field, defaultValue] of Object.entries(intelligentDefaults)) {
      const currentValue =
        currentData[field] ||
        currentData[field.replace(" ", " ")] ||
        currentData[field.replace("Timezone", "Time Zone")];

      if (!currentValue || isPlaceholderValue(currentValue)) {
        updatedData[field] = defaultValue;
        replacementCount++;
        console.log(
          `🔄 Replaced ${field}: "${currentValue}" → "${defaultValue}"`
        );
      } else {
        console.log(
          `✅ Keeping ${field}: "${currentValue}" (not a placeholder)`
        );
      }
    }

    // 🔥 FIXED: Handle field name mapping - ensure we use consistent field names
    if (updatedData["Time Zone"] && !updatedData["Timezone"]) {
      updatedData["Timezone"] = updatedData["Time Zone"];
      delete updatedData["Time Zone"];
      console.log(`🔄 Mapped "Time Zone" → "Timezone"`);
    }

    console.log(`✅ Replaced ${replacementCount} placeholder values`);
    console.log("Updated data:", updatedData);

    return { updatedData, replacementCount };
  } catch (error) {
    console.error(`Error replacing placeholders for ${username}:`, error);
    return { updatedData: currentData, replacementCount: 0 };
  }
};

// ===================================================================
// 👥 USER PROFILE DATA COLLECTION - Enhanced with Field Mapping
// ===================================================================

/**
 * 🔥 FIXED: Get user profile data with intelligent field name mapping
 * Handles "Time Zone" vs "Timezone" field name inconsistencies
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

    if (!myInfoData) {
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

    // 🔥 FIXED: Intelligent field mapping and placeholder detection
    const avatar = myInfoData["Avatar"] || null;
    const location = myInfoData["Location"] || null;
    const role = myInfoData["Role"] || null;

    // Handle both "Timezone" and "Time Zone" field names
    const timezone = myInfoData["Timezone"] || myInfoData["Time Zone"] || null;
    const aboutMe = myInfoData["About Me"] || null;

    // Check for placeholder values and mark them as missing
    const isAvatarPlaceholder = isPlaceholderValue(avatar);
    const isLocationPlaceholder = isPlaceholderValue(location);
    const isRolePlaceholder = isPlaceholderValue(role);
    const isTimezonePlaceholder = isPlaceholderValue(timezone);
    const isAboutMePlaceholder = isPlaceholderValue(aboutMe);

    // Calculate completeness ignoring placeholder values
    const requiredFields = ["Avatar", "Location", "Role", "Timezone"];
    const validFields = [
      !isAvatarPlaceholder && avatar,
      !isLocationPlaceholder && location,
      !isRolePlaceholder && role,
      !isTimezonePlaceholder && timezone,
    ].filter(Boolean).length;

    const completeness = Math.round(
      (validFields / requiredFields.length) * 100
    );

    // Get timezone information (only if not a placeholder)
    let timezoneInfo = null;
    if (timezone && !isTimezonePlaceholder) {
      timezoneInfo = timezoneManager.getCurrentTimeForUser(timezone);
    }

    // Identify missing or placeholder fields
    const missingFields = [];
    if (!avatar || isAvatarPlaceholder) missingFields.push("Avatar");
    if (!location || isLocationPlaceholder) missingFields.push("Location");
    if (!role || isRolePlaceholder) missingFields.push("Role");
    if (!timezone || isTimezonePlaceholder) missingFields.push("Timezone");

    // Flag if placeholders detected (needs intelligent replacement)
    const hasPlaceholders =
      isAvatarPlaceholder ||
      isLocationPlaceholder ||
      isRolePlaceholder ||
      isTimezonePlaceholder ||
      isAboutMePlaceholder;

    return {
      username,
      exists: true,
      avatar: isAvatarPlaceholder ? null : avatar,
      location: isLocationPlaceholder ? null : location,
      role: isRolePlaceholder ? null : role,
      timezone: isTimezonePlaceholder ? null : timezone,
      aboutMe: isAboutMePlaceholder ? null : aboutMe,
      completeness,
      timezoneInfo,
      missingFields,
      hasPlaceholders, // 🆕 New flag for placeholder detection
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
 * 🔥 FIXED: Initialize My Info:: structure with intelligent defaults
 * No more placeholder values - uses smart, contextual defaults
 */
const initializeMyInfoStructure = async (username) => {
  try {
    console.log(
      `🎯 Initializing intelligent My Info:: structure for ${username}...`
    );

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const setDataValue = platform.getUtility("setDataValue"); // 🔥 FIXED: Use individual setDataValue instead of setNestedDataValues

    // Ensure user page exists
    const userPageUid = await createPageIfNotExists(username);
    if (!userPageUid) {
      console.error(`❌ Failed to create page for ${username}`);
      return false;
    }

    // Generate intelligent defaults (no placeholders!)
    const intelligentDefaults = generateIntelligentDefaults(username);

    // 🔥 FIXED: Use individual setDataValue calls instead of setNestedDataValues
    // This avoids the parent-uid argument error
    let successCount = 0;
    const errors = [];

    for (const [field, value] of Object.entries(intelligentDefaults)) {
      try {
        const success = await setDataValue(userPageUid, field, value, true); // true = use attribute format
        if (success) {
          successCount++;
          console.log(`✅ Set ${field}: ${value}`);
        } else {
          errors.push(`Failed to set ${field}`);
        }
      } catch (error) {
        errors.push(`${field}: ${error.message}`);
        console.error(`❌ Failed to set ${field}:`, error);
      }
    }

    const totalFields = Object.keys(intelligentDefaults).length;
    const success = successCount === totalFields;

    if (success) {
      console.log(
        `✅ My Info:: structure created with intelligent defaults for ${username}`
      );
      console.log(`📊 Successfully set ${successCount}/${totalFields} fields`);
    } else {
      console.error(
        `❌ Partial success: ${successCount}/${totalFields} fields set`
      );
      console.error("Errors:", errors);
    }

    return success;
  } catch (error) {
    console.error(`Error initializing My Info:: for ${username}:`, error);
    return false;
  }
};

/**
 * 🔥 FIXED: Update specific field in My Info:: structure using individual setDataValue
 */
const updateMyInfoField = async (username, fieldName, fieldValue) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const setDataValue = platform.getUtility("setDataValue"); // 🔥 FIXED: Use setDataValue directly

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      console.error(`❌ User page not found for ${username}`);
      return false;
    }

    // 🔥 FIXED: Use setDataValue directly instead of trying to update nested structure
    const success = await setDataValue(
      userPageUid,
      fieldName,
      fieldValue,
      true
    ); // true = use attribute format

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
 * 🔥 FIXED: Auto-replace placeholders in existing My Info:: structures
 */
const autoReplacePlaceholders = async (username) => {
  try {
    console.log(`🔄 Auto-replacing placeholders for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const findNestedDataValues = platform.getUtility("findNestedDataValues");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) return false;

    const currentData = findNestedDataValues(userPageUid, "My Info") || {};

    // Check if any placeholders exist
    const hasAnyPlaceholders = Object.values(currentData).some((value) =>
      isPlaceholderValue(value)
    );

    if (!hasAnyPlaceholders) {
      console.log(`✅ No placeholders found for ${username}`);
      return true;
    }

    const { updatedData, replacementCount } =
      await replaceWithIntelligentDefaults(username, currentData);

    if (replacementCount === 0) {
      console.log(`✅ No replacements needed for ${username}`);
      return true;
    }

    // Update each field that was changed
    let updateSuccessCount = 0;
    for (const [field, value] of Object.entries(updatedData)) {
      if (currentData[field] !== value) {
        const success = await updateMyInfoField(username, field, value);
        if (success) updateSuccessCount++;
      }
    }

    console.log(
      `✅ Auto-replaced ${updateSuccessCount} placeholder fields for ${username}`
    );
    return updateSuccessCount > 0;
  } catch (error) {
    console.error(`Error auto-replacing placeholders for ${username}:`, error);
    return false;
  }
};

/**
 * Get all user profiles for directory (enhanced with placeholder replacement)
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
    }

    // 🔥 FIXED: Auto-replace placeholders in existing profiles
    const profilesWithPlaceholders = profiles.filter(
      (p) => p.hasPlaceholders && !p.needsMyInfoCreation
    );
    if (profilesWithPlaceholders.length > 0) {
      console.log(
        `🔄 Auto-replacing placeholders for ${profilesWithPlaceholders.length} profiles...`
      );

      for (const profile of profilesWithPlaceholders) {
        await autoReplacePlaceholders(profile.username);
      }
    }

    // Re-collect profiles after initialization and placeholder replacement
    if (missingProfiles.length > 0 || profilesWithPlaceholders.length > 0) {
      const updatedProfiles = await Promise.all(
        members.map((username) => getUserProfileData(username))
      );

      console.log(
        `✅ Collected ${updatedProfiles.length} user profiles with intelligent defaults`
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
// 🎨 FIXED NAVIGATION BUTTONS - Warm Yellow Upper-Left Placement
// ===================================================================

/**
 * 🔥 FIXED: Add context-aware navigation buttons in main window upper-left corner
 * Positioned relative to main content area, not left sidebar
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

    // 🔥 FIXED: Find main content area and position relative to it
    const mainContent =
      document.querySelector(".roam-article") ||
      document.querySelector(".roam-main") ||
      document.querySelector("#app > div > div");

    if (!mainContent) {
      console.warn("Could not find main content area for button placement");
      return;
    }

    // Create button container positioned relative to main content
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "user-directory-nav-button";
    buttonContainer.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      display: flex;
      gap: 8px;
      flex-direction: column;
    `;

    // Ensure main content has relative positioning
    if (getComputedStyle(mainContent).position === "static") {
      mainContent.style.position = "relative";
    }

    // 🔥 FIXED: Directory button with warm yellow gradient and 🫂 emoji
    const directoryButton = document.createElement("button");
    directoryButton.textContent = "🫂 Show Directory";
    directoryButton.style.cssText = `
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
      min-width: 140px;
      text-align: left;
    `;
    directoryButton.addEventListener("click", showUserDirectoryModal);
    directoryButton.addEventListener("mouseenter", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)";
      directoryButton.style.transform = "translateY(-1px)";
      directoryButton.style.boxShadow = "0 4px 8px rgba(245, 158, 11, 0.3)";
    });
    directoryButton.addEventListener("mouseleave", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)";
      directoryButton.style.transform = "translateY(0)";
      directoryButton.style.boxShadow = "0 2px 4px rgba(245, 158, 11, 0.2)";
    });

    buttonContainer.appendChild(directoryButton);

    // 🔥 FIXED: Profile action button (moved to upper-right to separate from directory)
    if (isOwnPage) {
      const actionContainer = document.createElement("div");
      actionContainer.className = "user-directory-nav-button";
      actionContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 1000;
        display: flex;
        gap: 8px;
      `;

      const profileButton = document.createElement("button");
      profileButton.textContent = "✨ Check Profile";
      profileButton.style.cssText = `
        background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%);
        color: #5b21b6;
        border: 1px solid #7c3aed;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
        transition: all 0.2s ease;
      `;
      profileButton.addEventListener("click", async () => {
        const completionCheck = await checkProfileCompletion();
        if (completionCheck.shouldNudge) {
          showCompletionNudgeModal(completionCheck);
        } else {
          console.log("✅ Your profile looks great!");

          // Show success feedback
          const toast = document.createElement("div");
          toast.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          `;
          toast.textContent = "✅ Your profile looks complete!";
          document.body.appendChild(toast);

          setTimeout(() => toast.remove(), 3000);
        }
      });
      profileButton.addEventListener("mouseenter", () => {
        profileButton.style.background =
          "linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%)";
        profileButton.style.transform = "translateY(-1px)";
      });
      profileButton.addEventListener("mouseleave", () => {
        profileButton.style.background =
          "linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)";
        profileButton.style.transform = "translateY(0)";
      });

      actionContainer.appendChild(profileButton);
      document.body.appendChild(actionContainer);

      // Register action container for cleanup too
      window._extensionRegistry.elements.push(actionContainer);
    }

    // Add directory button container to page
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

// ===================================================================
// 🎨 USER DIRECTORY MODAL - Professional Interface (Enhanced)
// ===================================================================

/**
 * Create and display professional user directory modal
 * Enhanced with better placeholder handling and field mapping
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening User Directory with intelligent defaults...");

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
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Processing intelligent defaults and timezone data</div>
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
            ${
              profiles.length
            } graph members • Intelligent defaults • Updated ${new Date().toLocaleTimeString()}
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
        💡 Tip: Click usernames to visit pages • Times update automatically • Placeholders replaced with intelligent defaults • All data stored under "My Info::"
      </div>
    `;

    // Start real-time clock updates
    startRealtimeClockUpdates(modal);

    console.log("✅ User Directory modal opened with intelligent defaults");
  } catch (error) {
    console.error("Failed to show user directory:", error);
  }
};

/**
 * Create individual user row for directory table (enhanced with better data handling)
 */
const createUserDirectoryRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;
  const rowClass = isCurrentUser ? "current-user-row" : "user-row";

  // Avatar display with fallback
  const avatarDisplay = profile.avatar
    ? `<img src="${profile.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${profile.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.username
        .charAt(0)
        .toUpperCase()}</div>`;

  // Fallback avatar (shown if image fails to load)
  const fallbackAvatar = `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: none; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.username
    .charAt(0)
    .toUpperCase()}</div>`;

  // Current time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  // Completeness indicator with better colors
  const completenessColor =
    profile.completeness >= 75
      ? "#059669"
      : profile.completeness >= 50
      ? "#d97706"
      : "#dc2626";

  const actionButton = isCurrentUser
    ? `<button onclick="navigateToUserPage('${profile.username}')" style="
        background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%);
        color: #5b21b6;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">✨ Edit Profile</button>`
    : `<button onclick="navigateToUserPage('${profile.username}')" style="
        background: #f8f9fa;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
      ">👀 View Page</button>`;

  return `
    <tr class="${rowClass}" style="
      border-bottom: 1px solid #f1f5f9;
      ${isCurrentUser ? "background: #f0f9ff;" : ""}
      ${index % 2 === 0 ? "background: #fafafa;" : ""}
    ">
      <td style="padding: 12px 16px; vertical-align: middle;">
        ${avatarDisplay}${fallbackAvatar}
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
// 📝 COMPLETION NUDGE SYSTEM - Enhanced with Placeholder Detection
// ===================================================================

/**
 * 🔥 FIXED: Check if current user needs profile completion nudging
 * Enhanced to detect placeholders as incomplete fields
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

    // Check for placeholders or missing fields
    if (
      profile.exists &&
      (profile.completeness < 75 || profile.hasPlaceholders)
    ) {
      let missingFields = [...profile.missingFields];

      // Add specific placeholder notification
      if (profile.hasPlaceholders) {
        missingFields.push(
          "Some fields contain placeholder values that need updating"
        );
      }

      return {
        shouldNudge: true,
        profile: profile,
        missingFields: missingFields,
        needsInitialization: false,
        hasPlaceholders: profile.hasPlaceholders,
      };
    }

    return { shouldNudge: false };
  } catch (error) {
    console.error("Failed to check profile completion:", error);
    return { shouldNudge: false };
  }
};

/**
 * Show profile completion nudge modal (enhanced)
 */
const showCompletionNudgeModal = async (profileData) => {
  try {
    console.log("💡 Showing enhanced completion nudge...");

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
      : profileData.hasPlaceholders
      ? "Update Profile Information"
      : "Complete Your Profile";

    const modalMessage = profileData.needsInitialization
      ? "Your My Info:: structure will be auto-created with intelligent defaults"
      : profileData.hasPlaceholders
      ? `Your profile has placeholder values that should be updated (${profileData.profile.completeness}% complete)`
      : `Your profile is ${profileData.profile.completeness}% complete`;

    content.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">${
          profileData.hasPlaceholders ? "🔄" : "📋"
        }</div>
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
                : "Needs Attention:"
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
            background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%);
            color: #5b21b6;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">
            ${
              profileData.needsInitialization
                ? "🎯 Set Up Profile"
                : profileData.hasPlaceholders
                ? "🔄 Update Profile"
                : "✨ Complete Profile"
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
          All profile data is stored under "My Info::" with intelligent defaults
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

    console.log("✅ Enhanced completion nudge displayed");
  } catch (error) {
    console.error("Failed to show completion nudge:", error);
  }
};

// ===================================================================
// 🔄 NAVIGATION INTEGRATION - Context-Aware Monitoring
// ===================================================================

/**
 * Monitor page changes and update navigation buttons
 */
const startNavigationMonitoring = () => {
  // Initial button addition with delay
  setTimeout(addNavigationButtons, 1000);

  // Monitor URL changes
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Remove old buttons and add new ones
      document
        .querySelectorAll(".user-directory-nav-button")
        .forEach((btn) => btn.remove());
      setTimeout(addNavigationButtons, 500);
    }
    setTimeout(checkUrlChange, 1000);
  };

  checkUrlChange();

  console.log(
    "📡 Navigation monitoring started with enhanced button placement"
  );
};

// ===================================================================
// 🧪 TESTING AND VALIDATION - Enhanced for New Features
// ===================================================================

/**
 * 🔥 FIXED: Run comprehensive tests including placeholder detection and replacement
 */
const runDirectoryTests = async () => {
  console.group(
    "🧪 User Directory System Tests (Enhanced with Intelligent Defaults)"
  );

  try {
    // Test 1: User Profile Data Collection with Placeholder Detection
    console.log(
      "Test 1: My Info:: Profile Data Collection with Placeholder Detection"
    );
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const profile = await getUserProfileData(currentUser.displayName);
    console.log(`  Profile completeness: ${profile.completeness}%`);
    console.log(
      `  Missing fields: ${profile.missingFields.join(", ") || "None"}`
    );
    console.log(`  Has placeholders: ${profile.hasPlaceholders || false}`);
    console.log(`  My Info:: data:`, profile.myInfoData);

    // Test 2: Intelligent Defaults Generation
    console.log("Test 2: Intelligent Defaults Generation");
    const intelligentDefaults = generateIntelligentDefaults(
      currentUser.displayName
    );
    console.log("  Generated defaults:", intelligentDefaults);

    // Test 3: Placeholder Detection
    console.log("Test 3: Placeholder Detection");
    const testValues = [
      "my avatar here",
      "PST",
      "I'm a groovy dude",
      "Oakland, California, US",
      "Extension Developer",
    ];
    testValues.forEach((value) => {
      const isPlaceholder = isPlaceholderValue(value);
      console.log(
        `  "${value}": ${isPlaceholder ? "📍 Placeholder" : "✅ Valid"}`
      );
    });

    // Test 4: Auto-Replacement System
    console.log("Test 4: Auto-Replacement System");
    if (profile.hasPlaceholders) {
      console.log("  🔄 Testing automatic placeholder replacement...");
      const replacementResult = await autoReplacePlaceholders(
        currentUser.displayName
      );
      console.log(`  Replacement success: ${replacementResult ? "✅" : "❌"}`);
    } else {
      console.log("  ✅ No placeholders detected - replacement not needed");
    }

    // Test 5: Field Name Mapping
    console.log("Test 5: Field Name Mapping");
    const testData = { "Time Zone": "PST", Timezone: "America/Los_Angeles" };
    const { updatedData } = await replaceWithIntelligentDefaults(
      currentUser.displayName,
      testData
    );
    console.log("  Original:", testData);
    console.log("  Mapped:", updatedData);

    // Test 6: My Info:: Structure Operations
    console.log("Test 6: My Info:: Structure Operations");
    if (profile.needsMyInfoCreation) {
      console.log("  🎯 Testing My Info:: initialization...");
      const initSuccess = await initializeMyInfoStructure(
        currentUser.displayName
      );
      console.log(
        `  Initialization: ${initSuccess ? "✅ Success" : "❌ Failed"}`
      );
    } else {
      console.log("  ✅ My Info:: structure already exists");

      // Test field update
      const testUpdateSuccess = await updateMyInfoField(
        currentUser.displayName,
        "Test Field",
        "Test Value"
      );
      console.log(
        `  Field update test: ${testUpdateSuccess ? "✅ Success" : "❌ Failed"}`
      );
    }

    // Test 7: Timezone Management
    console.log("Test 7: Timezone Management");
    const testTimezones = ["EST", "America/New_York", "GMT+1", "PST"];
    testTimezones.forEach((tz) => {
      const timeInfo = timezoneManager.getCurrentTimeForUser(tz);
      console.log(
        `  ${tz}: ${timeInfo.timeString} (${
          timeInfo.isValid ? "valid" : "invalid"
        })`
      );
    });

    // Test 8: Profile Completion Check with Placeholders
    console.log("Test 8: Enhanced Profile Completion Check");
    const completionCheck = await checkProfileCompletion();
    console.log(`  Should nudge: ${completionCheck.shouldNudge}`);
    console.log(
      `  Needs initialization: ${completionCheck.needsInitialization || false}`
    );
    console.log(
      `  Has placeholders: ${completionCheck.hasPlaceholders || false}`
    );
    if (completionCheck.shouldNudge) {
      console.log(`  Issues: ${completionCheck.missingFields.join(", ")}`);
    }

    console.log("✅ All enhanced directory tests completed successfully");
  } catch (error) {
    console.error("❌ Directory test failed:", error);
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

    const profilesWithMyInfo = profiles.filter(
      (p) => !p.needsMyInfoCreation
    ).length;
    const profilesWithPlaceholders = profiles.filter(
      (p) => p.hasPlaceholders
    ).length;

    console.group("📊 Enhanced User Directory System Status");
    console.log(`📋 Graph Members: ${members.length}`);
    console.log(`👤 Current User: ${currentUser.displayName}`);
    console.log(
      `📊 Profiles with My Info::: ${profilesWithMyInfo}/${profiles.length}`
    );
    console.log(
      `📊 Profiles with placeholders: ${profilesWithPlaceholders}/${profiles.length}`
    );
    console.log(`📊 Average Profile Completeness: ${averageCompleteness}%`);
    console.log(
      `🕐 Timezone Manager: ${
        timezoneManager.getCommonTimezones().length
      } supported timezones`
    );
    console.log("🎯 Enhanced Features:");
    console.log("  ✅ My Info:: Structure Auto-Creation");
    console.log("  ✅ Intelligent Defaults Generation");
    console.log("  ✅ Placeholder Detection & Replacement");
    console.log("  ✅ Field Name Mapping (Time Zone ↔ Timezone)");
    console.log("  ✅ User Directory Modal with Enhanced UI");
    console.log("  ✅ Real-time Timezone Display");
    console.log("  ✅ Enhanced Profile Completion Nudging");
    console.log("  ✅ Context-aware Navigation (Upper-left 🫂)");
    console.log("  ✅ Professional Button Styling");
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
      "👥 User Directory + Timezones starting (FIXED Enhanced Version)..."
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
      !platform.getUtility("setDataValue")
    ) {
      console.error(
        "❌ Required utilities not found! Please load Extension 1.5 with enhanced utilities."
      );
      return;
    }

    // 🎯 REGISTER ENHANCED DIRECTORY SERVICES
    const directoryServices = {
      // Enhanced user profile services
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,
      initializeMyInfoStructure: initializeMyInfoStructure,
      updateMyInfoField: updateMyInfoField,
      autoReplacePlaceholders: autoReplacePlaceholders,

      // Intelligent defaults system
      generateIntelligentDefaults: generateIntelligentDefaults,
      isPlaceholderValue: isPlaceholderValue,
      replaceWithIntelligentDefaults: replaceWithIntelligentDefaults,

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
        label: "Directory: 🫂 Show User Directory",
        callback: showUserDirectoryModal,
      },
      {
        label: "Directory: ✨ Check My Profile Completion",
        callback: async () => {
          const check = await checkProfileCompletion();
          if (check.shouldNudge) {
            console.log(
              check.needsInitialization
                ? "🎯 My Info:: structure needs initialization"
                : check.hasPlaceholders
                ? `🔄 Profile has placeholders (${check.profile.completeness}% complete)`
                : `📊 Profile ${
                    check.profile.completeness
                  }% complete. Missing: ${check.missingFields.join(", ")}`
            );
            showCompletionNudgeModal(check);
          } else {
            console.log("✅ Your profile looks complete!");
          }
        },
      },
      {
        label: "Directory: 🎯 Initialize My Info Structure",
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
        label: "Directory: 🔄 Replace My Placeholders",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            const success = await autoReplacePlaceholders(
              currentUser.displayName
            );
            console.log(
              `🔄 Placeholder replacement ${
                success ? "successful" : "not needed"
              }`
            );
          }
        },
      },
      {
        label: "Directory: 📊 Show System Status",
        callback: showDirectoryStatus,
      },
      {
        label: "Directory: 🧪 Run Enhanced Tests",
        callback: runDirectoryTests,
      },
      {
        label: "Directory: 🧠 Test Intelligent Defaults",
        callback: () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            console.group("🧠 Intelligent Defaults Test");
            const defaults = generateIntelligentDefaults(
              currentUser.displayName
            );
            console.log("Generated defaults:", defaults);
            console.groupEnd();
          }
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 START ENHANCED NAVIGATION MONITORING
    startNavigationMonitoring();

    // 📊 AUTO-CHECK AND ENHANCE PROFILES (once per session)
    setTimeout(async () => {
      const completionCheck = await checkProfileCompletion();
      if (completionCheck.shouldNudge) {
        if (completionCheck.needsInitialization) {
          console.log(
            '🎯 My Info:: needs initialization - use "Directory: 🎯 Initialize My Info Structure"'
          );
        } else if (completionCheck.hasPlaceholders) {
          console.log(
            '🔄 Placeholders detected - use "Directory: 🔄 Replace My Placeholders"'
          );
        } else {
          console.log(
            '💡 Profile completion available - use "Directory: ✨ Check My Profile Completion"'
          );
        }
      }
    }, 3000);

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-directory",
      {
        services: directoryServices,
        timezoneManager: timezoneManager,
        version: "6.2.0", // Incremented for major enhancements
      },
      {
        name: "User Directory + Timezones (Enhanced with Intelligent Defaults)",
        description:
          "Professional user directory with intelligent defaults, placeholder replacement, and enhanced UI",
        version: "6.2.0",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE WITH ENHANCED FEATURES
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const memberCount = platform.getUtility("getGraphMemberCount")();

    console.log("✅ Enhanced User Directory + Timezones loaded successfully!");
    console.log("🔥 NEW FEATURES:");
    console.log("  • 🧠 Intelligent defaults generation");
    console.log("  • 🔄 Automatic placeholder replacement");
    console.log("  • 🫂 Upper-left warm yellow directory button");
    console.log("  • 🎯 Enhanced field name mapping");
    console.log("  • ✨ Improved error handling");
    console.log(`👥 Directory ready for ${memberCount} graph members`);
    console.log(
      `🕐 Timezone support: ${
        timezoneManager.getCommonTimezones().length
      } common timezones`
    );
    console.log('💡 Try: Cmd+P → "Directory: 🫂 Show User Directory"');

    // Quick enhanced status check
    setTimeout(async () => {
      const profile = await getUserProfileData(currentUser.displayName);
      if (profile.needsMyInfoCreation) {
        console.log(
          "🎯 My Info:: structure will be auto-created with intelligent defaults"
        );
      } else if (profile.hasPlaceholders) {
        console.log(
          `🔄 Profile has placeholders that can be auto-replaced (${profile.completeness}% complete)`
        );
      } else {
        console.log(
          `📊 Your enhanced profile: ${profile.completeness}% complete`
        );
      }
    }, 1000);
  },

  onunload: () => {
    console.log("👥 Enhanced User Directory + Timezones unloading...");

    // Clean up navigation buttons
    document
      .querySelectorAll(".user-directory-nav-button")
      .forEach((btn) => btn.remove());

    // Close any open modals
    const modals = document.querySelectorAll(
      "#user-directory-modal, #completion-nudge-modal"
    );
    modals.forEach((modal) => modal.remove());

    console.log("✅ Enhanced User Directory + Timezones cleanup complete!");
  },
};
