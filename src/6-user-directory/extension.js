// ===================================================================
// Extension 6: User Directory + Timezones - SELF-HEALING EDITION
// ENHANCED: Auto-completion sandbox integration for self-healing profiles
// Auto-completes missing "My Info::" fields with intelligent defaults
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
// 🧠 SELF-HEALING PROFILE ANALYSIS - From Auto-Completion Sandbox
// ===================================================================

/**
 * 🔍 CORE FUNCTION: Analyze My Info:: structure completeness with LOGIC GATES
 * Enhanced to prevent duplicate field creation
 */
const analyzeMyInfoStructure = (username) => {
  try {
    console.log(`🔍 Analyzing My Info:: structure for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      return {
        username,
        userPageExists: false,
        myInfoExists: false,
        analysis: `User page "${username}" not found`,
      };
    }

    // Find My Info:: parent block
    const myInfoQuery = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${userPageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);

    const myInfoBlock = myInfoQuery.find(
      ([uid, text]) => text.trim() === "My Info::"
    );

    if (!myInfoBlock) {
      return {
        username,
        userPageExists: true,
        myInfoExists: false,
        analysis: "My Info:: parent block not found",
        needsFullCreation: true,
      };
    }

    const myInfoBlockUid = myInfoBlock[0];

    // Define expected field categories
    const expectedFields = [
      "Avatar::",
      "Location::",
      "Role::",
      "Timezone::",
      "About Me::",
    ];

    // 🚪 LOGIC GATE: Get ALL children and detect duplicates
    const myInfoChildren = window.roamAlphaAPI.data
      .q(
        `
      [:find ?childUid ?childString ?childOrder
       :where 
       [?parent :block/uid "${myInfoBlockUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?childUid]
       [?child :block/string ?childString]
       [?child :block/order ?childOrder]]
    `
      )
      .sort((a, b) => a[2] - b[2]); // Sort by order

    // 🚪 LOGIC GATE: Create field occurrence map to detect duplicates
    const fieldOccurrences = {};
    expectedFields.forEach((field) => {
      fieldOccurrences[field] = myInfoChildren.filter(
        ([uid, text]) => text.trim() === field
      );
    });

    // 🚪 LOGIC GATE: Analyze each expected field (only first occurrence)
    const fieldAnalysis = {};
    const missingFields = [];
    const emptyFields = [];
    const duplicateFields = [];

    expectedFields.forEach((fieldName) => {
      const occurrences = fieldOccurrences[fieldName];

      if (occurrences.length === 0) {
        // Field is completely missing
        missingFields.push(fieldName);
        fieldAnalysis[fieldName] = {
          exists: false,
          hasChildren: false,
          children: [],
          status: "missing",
          duplicates: 0,
        };
      } else {
        // Field exists - use FIRST occurrence only
        const firstOccurrence = occurrences[0];
        const fieldBlockUid = firstOccurrence[0];

        // Track duplicates
        if (occurrences.length > 1) {
          duplicateFields.push({
            fieldName,
            count: occurrences.length,
            duplicateUids: occurrences.slice(1).map(([uid]) => uid),
          });
        }

        // Check if field has children (values)
        const fieldChildren = window.roamAlphaAPI.data.q(`
          [:find ?grandchildUid ?grandchildString
           :where 
           [?parent :block/uid "${fieldBlockUid}"]
           [?parent :block/children ?grandchild]
           [?grandchild :block/uid ?grandchildUid]
           [?grandchild :block/string ?grandchildString]]
        `);

        const hasChildren = fieldChildren.length > 0;

        if (!hasChildren) {
          emptyFields.push({
            fieldName,
            fieldBlockUid,
            fieldOrder: firstOccurrence[2],
          });
        }

        fieldAnalysis[fieldName] = {
          exists: true,
          hasChildren: hasChildren,
          children: fieldChildren.map(([uid, text]) => text),
          blockUid: fieldBlockUid,
          status: hasChildren ? "complete" : "empty",
          duplicates: occurrences.length - 1,
        };
      }
    });

    const completenessScore = Math.round(
      (Object.values(fieldAnalysis).filter((f) => f.hasChildren).length /
        expectedFields.length) *
        100
    );

    // 🚪 LOGIC GATE: Only need healing if truly missing/empty AND no duplicates causing issues
    const hasDuplicates = duplicateFields.length > 0;
    const needsAutoCompletion =
      (missingFields.length > 0 || emptyFields.length > 0) && !hasDuplicates;

    if (hasDuplicates) {
      console.warn(`⚠️ Duplicates detected for ${username}:`, duplicateFields);
    }

    return {
      username,
      userPageExists: true,
      myInfoExists: true,
      myInfoBlockUid,
      fieldAnalysis,
      missingFields,
      emptyFields,
      duplicateFields,
      completenessScore,
      needsAutoCompletion,
      hasDuplicates,
      analysis: `${emptyFields.length} empty fields, ${missingFields.length} missing fields, ${duplicateFields.length} duplicate field sets, ${completenessScore}% complete`,
    };
  } catch (error) {
    console.error(`❌ Error analyzing My Info:: for ${username}:`, error);
    return {
      username,
      error: error.message,
      analysis: "Analysis failed due to error",
    };
  }
};

/**
 * 🎯 SELF-HEALING: Generate intelligent defaults with boilerplate patterns
 */
const generateSelfHealingDefaults = (username, currentUser) => {
  const isCurrentUser = username === currentUser.displayName;

  return {
    "Avatar::":
      isCurrentUser && currentUser.photoUrl
        ? currentUser.photoUrl
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            username
          )}`,

    "Location::": isCurrentUser
      ? "Oakland, California, US" // Default location
      : "__this field is not yet filled__",

    "Role::": isCurrentUser
      ? "Extension Developer"
      : "__this field is not yet filled__",

    "Timezone::": isCurrentUser
      ? "America/Los_Angeles" // Default timezone
      : "__this field is not yet filled__",

    "About Me::": isCurrentUser
      ? "Building professional Roam extensions"
      : "__this field is not yet filled__",
  };
};

/**
 * 🛠️ SELF-HEALING CORE: Auto-complete missing My Info:: fields with LOGIC GATES
 * Enhanced with duplicate prevention and proper healing logic
 */
const performSelfHealing = async (username, options = {}) => {
  try {
    console.log(`🛠️ Self-healing My Info:: for ${username}...`);

    const { dryRun = false, force = false } = options;

    // 🚪 LOGIC GATE: Analyze current structure with duplicate detection
    const analysis = analyzeMyInfoStructure(username);

    // 🚪 LOGIC GATE: Don't heal if duplicates exist (prevent making it worse)
    if (analysis.hasDuplicates && !force) {
      console.warn(
        `⚠️ Skipping healing for ${username} - duplicates detected:`,
        analysis.duplicateFields
      );
      return {
        success: false,
        action: "skipped_due_to_duplicates",
        duplicateFields: analysis.duplicateFields,
        analysis: analysis,
        message: "Healing skipped to prevent creating more duplicates",
      };
    }

    // Handle full creation if My Info:: doesn't exist
    if (analysis.needsFullCreation) {
      console.log(
        `🎯 Creating complete My Info:: structure for ${username}...`
      );
      if (!dryRun) {
        const success = await createCompleteMyInfoStructure(username);
        return {
          success: success,
          action: "full_creation",
          analysis: analysis,
        };
      } else {
        return {
          success: true,
          dryRun: true,
          action: "would_create_full_structure",
          analysis: analysis,
        };
      }
    }

    // 🚪 LOGIC GATE: Check if auto-completion is actually needed
    if (!analysis.needsAutoCompletion && !force) {
      console.log(
        `✅ No self-healing needed for ${username} (${analysis.completenessScore}% complete)`
      );
      return {
        success: true,
        action: "no_healing_needed",
        analysis: analysis,
      };
    }

    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const defaultValues = generateSelfHealingDefaults(username, currentUser);

    // 🚪 LOGIC GATE: Only heal truly missing or empty fields
    const fieldsToHeal = [
      ...analysis.missingFields.map((fieldName) => ({
        fieldName,
        status: "missing",
        safe: true, // Missing fields are always safe to create
      })),
      ...analysis.emptyFields.map((field) => ({
        ...field,
        status: "empty",
        safe: true, // Empty fields are safe to fill
      })),
    ];

    if (fieldsToHeal.length === 0) {
      console.log(`✅ All fields complete for ${username}`);
      return {
        success: true,
        action: "already_complete",
        analysis: analysis,
      };
    }

    console.log(
      `🎯 Self-healing ${fieldsToHeal.length} fields for ${username}:`,
      fieldsToHeal.map((f) => f.fieldName)
    );

    if (dryRun) {
      console.log("🧪 DRY RUN - Would heal these fields:");
      fieldsToHeal.forEach((field) => {
        console.log(
          `  ${field.fieldName} (${field.status}) → "${
            defaultValues[field.fieldName]
          }"`
        );
      });

      return {
        success: true,
        dryRun: true,
        action: "dry_run_healing",
        fieldsToHeal: fieldsToHeal,
        defaultValues: defaultValues,
        analysis: analysis,
      };
    }

    // 🚪 LOGIC GATE: Perform actual self-healing only for safe fields
    const healingResults = [];

    for (const field of fieldsToHeal) {
      if (!field.safe) {
        console.warn(`⚠️ Skipping unsafe field: ${field.fieldName}`);
        continue;
      }

      try {
        const defaultValue = defaultValues[field.fieldName];
        let success = false;

        if (field.status === "missing") {
          // 🚪 LOGIC GATE: Double-check field doesn't exist before creating
          const doubleCheckAnalysis = analyzeMyInfoStructure(username);
          const stillMissing = doubleCheckAnalysis.missingFields.includes(
            field.fieldName
          );

          if (stillMissing) {
            success = await createMyInfoField(
              analysis.myInfoBlockUid,
              field.fieldName,
              defaultValue
            );
            console.log(
              `🔧 Created missing field ${field.fieldName}: "${defaultValue}"`
            );
          } else {
            console.log(`⏭️ Skipping ${field.fieldName} - no longer missing`);
            success = true; // Consider this a success since field now exists
          }
        } else if (field.status === "empty") {
          // 🚪 LOGIC GATE: Verify field is still empty before adding value
          const fieldChildren = window.roamAlphaAPI.data.q(`
            [:find ?grandchildString
             :where 
             [?parent :block/uid "${field.fieldBlockUid}"]
             [?parent :block/children ?grandchild]
             [?grandchild :block/string ?grandchildString]]
          `);

          if (fieldChildren.length === 0) {
            success = await addValueToEmptyField(
              field.fieldBlockUid,
              defaultValue
            );
            console.log(
              `🔧 Healed empty field ${field.fieldName}: "${defaultValue}"`
            );
          } else {
            console.log(`⏭️ Skipping ${field.fieldName} - no longer empty`);
            success = true; // Consider this a success since field now has content
          }
        }

        healingResults.push({
          fieldName: field.fieldName,
          defaultValue: defaultValue,
          success: success,
          action: field.status === "missing" ? "created" : "healed",
        });

        // Small delay between operations to prevent race conditions
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`❌ Error healing ${field.fieldName}:`, error);
        healingResults.push({
          fieldName: field.fieldName,
          defaultValue: defaultValues[field.fieldName],
          success: false,
          error: error.message,
          action: "failed",
        });
      }
    }

    const successCount = healingResults.filter((r) => r.success).length;
    const totalFields = healingResults.length;

    console.log(
      `📊 Self-healing results: ${successCount}/${totalFields} fields healed`
    );

    return {
      success: successCount > 0,
      action: "self_healing_completed",
      fieldsProcessed: totalFields,
      successCount: successCount,
      results: healingResults,
      analysis: analysis,
    };
  } catch (error) {
    console.error(`❌ Self-healing failed for ${username}:`, error);
    return {
      success: false,
      action: "healing_error",
      error: error.message,
    };
  }
};

/**
 * 🏗️ Create complete My Info:: structure from scratch
 */
const createCompleteMyInfoStructure = async (username) => {
  try {
    console.log(`🏗️ Creating complete My Info:: structure for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // Ensure user page exists
    const userPageUid = await createPageIfNotExists(username);
    if (!userPageUid) {
      console.error(`❌ Failed to create page for ${username}`);
      return false;
    }

    // Create My Info:: parent block
    const myInfoBlockUid = await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": userPageUid, order: "last" },
      block: { string: "My Info::" },
    });

    if (!myInfoBlockUid) {
      console.error(`❌ Failed to create My Info:: parent block`);
      return false;
    }

    // Generate defaults and create all fields
    const defaultValues = generateSelfHealingDefaults(username, currentUser);
    let successCount = 0;

    for (const [fieldName, defaultValue] of Object.entries(defaultValues)) {
      try {
        const success = await createMyInfoField(
          myInfoBlockUid,
          fieldName,
          defaultValue
        );
        if (success) {
          successCount++;
          console.log(`✅ Created ${fieldName}: ${defaultValue}`);
        } else {
          console.error(`❌ Failed to create ${fieldName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${fieldName}:`, error);
      }
    }

    const success = successCount === Object.keys(defaultValues).length;
    console.log(
      `🎯 Complete structure creation: ${successCount}/5 fields for ${username}`
    );

    return success;
  } catch (error) {
    console.error(`Error creating complete My Info:: for ${username}:`, error);
    return false;
  }
};

/**
 * 🔧 Helper: Create individual My Info:: field with value
 */
const createMyInfoField = async (parentBlockUid, fieldName, fieldValue) => {
  try {
    // Create field header block
    const fieldBlockUid = await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": parentBlockUid, order: "last" },
      block: { string: fieldName },
    });

    if (!fieldBlockUid) return false;

    // Create value block as child
    await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": fieldBlockUid, order: 0 },
      block: { string: fieldValue },
    });

    return true;
  } catch (error) {
    console.error(`Error creating field ${fieldName}:`, error);
    return false;
  }
};

/**
 * 🔧 Helper: Add value to existing empty field
 */
const addValueToEmptyField = async (fieldBlockUid, value) => {
  try {
    await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": fieldBlockUid, order: 0 },
      block: { string: value },
    });
    return true;
  } catch (error) {
    console.error(`Error adding value to empty field:`, error);
    return false;
  }
};

// ===================================================================
// 👥 ENHANCED USER PROFILE DATA COLLECTION - With Self-Healing
// ===================================================================

/**
 * 🔧 Enhanced getUserProfileData with self-healing integration
 */
const getUserProfileData = async (username, options = {}) => {
  try {
    const { autoHeal = true } = options;

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
        needsSelfHealing: true,
      };
    }

    // 🧠 LOGIC GATE: Self-healing check with duplicate protection
    const analysis = analyzeMyInfoStructure(username);

    if (
      (analysis.needsFullCreation ||
        (analysis.needsAutoCompletion && autoHeal)) &&
      !analysis.hasDuplicates
    ) {
      console.log(`🛠️ Auto-completion triggered for ${username}...`);
      const healingResult = await performSelfHealing(username);

      if (healingResult.success) {
        console.log(`✅ Auto-completion completed for ${username}`);
        // Re-analyze after healing
        const newAnalysis = analyzeMyInfoStructure(username);
        console.log(
          `📊 Post-completion: ${newAnalysis.completenessScore}% complete`
        );
      } else {
        console.warn(
          `⚠️ Auto-completion result for ${username}:`,
          healingResult.action,
          healingResult.message || healingResult.error
        );
      }
    } else if (analysis.hasDuplicates) {
      console.warn(
        `⚠️ Skipping auto-completion for ${username} - duplicates detected`
      );
    }

    // Get My Info data (after potential self-healing)
    const myInfoData = findNestedDataValues(userPageUid, "My Info");

    if (!myInfoData || Object.keys(myInfoData).length === 0) {
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
        needsSelfHealing: true,
      };
    }

    // Handle field name variations and detect placeholders
    const avatar = getCleanFieldValue(myInfoData, ["Avatar"]);
    const location = getCleanFieldValue(myInfoData, ["Location"]);
    const role = getCleanFieldValue(myInfoData, ["Role"]);
    const timezone = getCleanFieldValue(myInfoData, ["Timezone", "Time Zone"]);
    const aboutMe = getCleanFieldValue(myInfoData, ["About Me"]);

    // Calculate profile completeness
    const requiredFields = ["Avatar", "Location", "Role", "Timezone"];
    const fieldValues = [avatar, location, role, timezone];
    const completedFields = fieldValues.filter(
      (value) =>
        value !== null && !value.includes("__this field is not yet filled__")
    ).length;
    const completeness = Math.round(
      (completedFields / requiredFields.length) * 100
    );

    // Get timezone information
    let timezoneInfo = null;
    if (timezone && !timezone.includes("__this field is not yet filled__")) {
      timezoneInfo = timezoneManager.getCurrentTimeForUser(timezone);
    }

    // Identify missing fields
    const missingFields = [];
    if (!avatar) missingFields.push("Avatar");
    if (!location || location.includes("__this field is not yet filled__"))
      missingFields.push("Location");
    if (!role || role.includes("__this field is not yet filled__"))
      missingFields.push("Role");
    if (!timezone || timezone.includes("__this field is not yet filled__"))
      missingFields.push("Timezone");
    if (!aboutMe || aboutMe.includes("__this field is not yet filled__"))
      missingFields.push("About Me");

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
      myInfoData,
      selfHealed: analysis.needsAutoCompletion || analysis.needsFullCreation,
    };
  } catch (error) {
    console.error(`Failed to get profile data for ${username}:`, error);
    return {
      username,
      exists: false,
      error: error.message,
      completeness: 0,
      missingFields: ["Avatar", "Location", "Role", "Timezone", "About Me"],
      needsSelfHealing: true,
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
        "location not set",
        "timezone not set",
        "role not set",
        "team member",
        "graph member",
        "__this field is not yet filled__",
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
 * Get all user profiles with integrated self-healing
 */
const getAllUserProfiles = async (options = {}) => {
  try {
    const { autoHeal = true } = options;

    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");

    const members = getGraphMembers();
    console.log(
      `📊 Collecting profiles for ${members.length} graph members (self-healing: ${autoHeal})...`
    );

    const profiles = await Promise.all(
      members.map(async (username) => {
        try {
          return await getUserProfileData(username, { autoHeal });
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
            needsSelfHealing: true,
          };
        }
      })
    );

    profiles.sort((a, b) => a.username.localeCompare(b.username));

    const healedProfiles = profiles.filter((p) => p.selfHealed).length;
    if (healedProfiles > 0) {
      console.log(`🛠️ Self-healing completed for ${healedProfiles} profiles`);
    }

    console.log(
      `✅ Collected ${profiles.length} user profiles with self-healing`
    );
    return profiles;
  } catch (error) {
    console.error("Failed to collect user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🎨 USER DIRECTORY MODAL - Enhanced with Self-Healing Status
// ===================================================================

/**
 * Create and display professional user directory modal with self-healing indicators
 */
const showUserDirectoryModal = async () => {
  try {
    console.log("📋 Opening Self-Healing User Directory...");

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
      max-width: 95%;
      max-height: 90%;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
    `;

    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading user directory...</div>
        <div style="margin-top: 10px; font-size: 14px; color: #999;">Enhanced My Info:: processing</div>
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

    // Load profiles with self-healing
    const profiles = await getAllUserProfiles({ autoHeal: true });
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    const healedCount = profiles.filter((p) => p.selfHealed).length;

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
            👥 User Directory
          </h2>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            ${profiles.length} graph members • ${
      healedCount > 0 ? `${healedCount} profiles auto-completed • ` : ""
    }Updated ${new Date().toLocaleTimeString()}
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
                createSelfHealingUserRow(profile, currentUser, index)
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
        💡 Enhanced: Auto-completes missing My Info:: fields • Uses Roam user images • Real-time timezone updates
      </div>
    `;

    startRealtimeClockUpdates(modal);

    console.log("✅ Self-Healing User Directory modal opened");
  } catch (error) {
    console.error("Failed to show user directory:", error);
  }
};

/**
 * Create individual user row for directory table with self-healing indicators
 */
const createSelfHealingUserRow = (profile, currentUser, index) => {
  const isCurrentUser = profile.username === currentUser?.displayName;
  const rowClass = isCurrentUser ? "current-user-row" : "user-row";

  const avatarDisplay = profile.avatar
    ? `<img src="${profile.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${profile.username}">`
    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.username
        .charAt(0)
        .toUpperCase()}</div>`;

  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  const completenessColor =
    profile.completeness >= 75
      ? "#059669"
      : profile.completeness >= 50
      ? "#d97706"
      : "#dc2626";

  // Display boilerplate text for unfilled fields
  const displayValue = (value) => {
    if (!value || value.includes("__this field is not yet filled__")) {
      return '<span style="color: #9ca3af; font-style: italic;">not yet filled</span>';
    }
    return value;
  };

  const actionButton = isCurrentUser
    ? `<button onclick="navigateToUserPage('${profile.username}')" style="background: #137cbd; color: white; border: none; border-radius: 3px; padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 500;">Edit My Info</button>`
    : `<button onclick="navigateToUserPage('${profile.username}')" style="background: #f8f9fa; color: #374151; border: 1px solid #d1d5db; border-radius: 3px; padding: 6px 12px; cursor: pointer; font-size: 12px;">View Page</button>`;

  const selfHealedIndicator = profile.selfHealed
    ? '<span style="margin-left: 4px; color: #059669; font-size: 12px;" title="Profile was auto-healed">🛠️</span>'
    : "";

  return `
    <tr class="${rowClass}" style="border-bottom: 1px solid #f1f5f9; ${
    isCurrentUser ? "background: #f0f9ff;" : ""
  } ${index % 2 === 0 ? "background: #fafafa;" : ""}">
      <td style="padding: 12px 16px; vertical-align: middle;">${avatarDisplay}</td>
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
          ${selfHealedIndicator}
        </div>
      </td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${displayValue(
        profile.aboutMe
      )}</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${displayValue(
        profile.location
      )}</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${displayValue(
        profile.role
      )}</td>
      <td style="padding: 12px 16px; vertical-align: middle; color: #4b5563;">${displayValue(
        profile.timezone
      )}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${timeDisplay}</td>
      <td style="padding: 12px 16px; vertical-align: middle;">${actionButton}</td>
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
      if (timezone && !timezone.includes("__this field is not yet filled__")) {
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
// 🧭 NAVIGATION INTEGRATION - With Self-Healing Triggers
// ===================================================================

/**
 * Add navigation buttons with self-healing integration
 */
const addNavigationButtons = () => {
  try {
    document
      .querySelectorAll(".user-directory-nav-button")
      .forEach((btn) => btn.remove());

    console.log(
      "🎯 Adding navigation buttons with self-healing integration..."
    );

    const platform = window.RoamExtensionSuite;
    const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
    const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
    const isGraphMember = platform.getUtility("isGraphMember");

    const currentPageTitle = getCurrentPageTitle();
    const currentUser = getAuthenticatedUser();

    if (!currentPageTitle || !currentUser) return;

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

    const computedStyle = getComputedStyle(targetElement);
    if (computedStyle.position === "static") {
      targetElement.style.position = "relative";
    }

    const isUserPage = isGraphMember(currentPageTitle);
    const isOwnPage = currentPageTitle === currentUser.displayName;

    const directoryButton = document.createElement("button");
    directoryButton.className = "user-directory-nav-button";
    directoryButton.textContent = "👥 Show Directory";
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
    `;

    directoryButton.addEventListener("click", showUserDirectoryModal);

    directoryButton.addEventListener("mouseenter", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)";
      directoryButton.style.transform = "translateY(-1px)";
    });

    directoryButton.addEventListener("mouseleave", () => {
      directoryButton.style.background =
        "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)";
      directoryButton.style.transform = "translateY(0)";
    });

    targetElement.appendChild(directoryButton);
    window._extensionRegistry.elements.push(directoryButton);

    // 🛠️ TRIGGER SELF-HEALING: If on current user's page, check for healing
    if (isOwnPage) {
      setTimeout(async () => {
        const analysis = analyzeMyInfoStructure(currentUser.displayName);
        if (analysis.needsAutoCompletion || analysis.needsFullCreation) {
          console.log(
            `🛠️ Self-healing triggered for ${currentUser.displayName} (on own page)`
          );
          await performSelfHealing(currentUser.displayName);
        }
      }, 2000);
    }

    console.log(`✅ Self-healing navigation buttons added to: ${selectorUsed}`);
  } catch (error) {
    console.error("❌ Error adding navigation buttons:", error);
  }
};

/**
 * Monitor page changes and trigger self-healing
 */
const startSelfHealingMonitoring = () => {
  setTimeout(addNavigationButtons, 1000);

  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(addNavigationButtons, 500);

      // 🛠️ TRIGGER SELF-HEALING: On page navigation
      setTimeout(async () => {
        const platform = window.RoamExtensionSuite;
        const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
        const getAuthenticatedUser = platform.getUtility(
          "getAuthenticatedUser"
        );
        const isGraphMember = platform.getUtility("isGraphMember");

        const currentPageTitle = getCurrentPageTitle();
        const currentUser = getAuthenticatedUser();

        if (
          currentPageTitle &&
          currentUser &&
          isGraphMember(currentPageTitle)
        ) {
          const analysis = analyzeMyInfoStructure(currentPageTitle);
          if (analysis.needsAutoCompletion || analysis.needsFullCreation) {
            console.log(
              `🛠️ Self-healing triggered for ${currentPageTitle} (page navigation)`
            );
            await performSelfHealing(currentPageTitle);
          }
        }
      }, 1500);
    }
    setTimeout(checkUrlChange, 1000);
  };

  checkUrlChange();

  console.log("📡 Self-healing monitoring started");
};

// ===================================================================
// 🧪 TESTING AND VALIDATION - Self-Healing Tests
// ===================================================================

/**
 * Run comprehensive self-healing system tests
 */
const runSelfHealingTests = async () => {
  console.group("🧪 Self-Healing User Directory System Tests");

  try {
    const platform = window.RoamExtensionSuite;
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    // Test 1: Self-Healing Analysis
    console.log("Test 1: Self-Healing Analysis");
    const analysis = analyzeMyInfoStructure(currentUser.displayName);
    console.log(`  Analysis result:`, {
      myInfoExists: analysis.myInfoExists,
      needsAutoCompletion: analysis.needsAutoCompletion,
      completenessScore: analysis.completenessScore + "%",
      emptyFields: analysis.emptyFields?.length || 0,
      missingFields: analysis.missingFields?.length || 0,
    });

    // Test 2: Default Value Generation
    console.log("Test 2: Self-Healing Default Generation");
    const defaults = generateSelfHealingDefaults(
      currentUser.displayName,
      currentUser
    );
    console.log("  Generated defaults:", defaults);

    // Test 3: Dry Run Self-Healing
    console.log("Test 3: Dry Run Self-Healing");
    const dryRunResult = await performSelfHealing(currentUser.displayName, {
      dryRun: true,
    });
    console.log("  Dry run result:", {
      success: dryRunResult.success,
      action: dryRunResult.action,
      fieldsToHeal: dryRunResult.fieldsToHeal?.length || 0,
    });

    // Test 4: Profile Data with Self-Healing
    console.log("Test 4: Profile Data Collection with Self-Healing");
    const profile = await getUserProfileData(currentUser.displayName, {
      autoHeal: false,
    }); // Disable for test
    console.log("  Profile result:", {
      exists: profile.exists,
      completeness: profile.completeness + "%",
      selfHealed: profile.selfHealed,
      missingFields: profile.missingFields.length,
    });

    // Test 5: Boilerplate Detection
    console.log("Test 5: Boilerplate Field Detection");
    const testValues = {
      filled: "Real content",
      boilerplate: "__this field is not yet filled__",
      empty: "",
      placeholder: "not set",
    };

    Object.entries(testValues).forEach(([key, value]) => {
      const cleanValue = getCleanFieldValue({ test: value }, ["test"]);
      console.log(`  ${key} ("${value}") → ${cleanValue || "null"}`);
    });

    console.log("✅ Self-Healing System Tests completed successfully");
  } catch (error) {
    console.error("❌ Self-healing test failed:", error);
  }

  console.groupEnd();
};

/**
 * Display self-healing system status
 */
const showSelfHealingStatus = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembers = platform.getUtility("getGraphMembers");
    const currentUser = platform.getUtility("getAuthenticatedUser")();

    const members = getGraphMembers();
    console.group("🛠️ Self-Healing User Directory System Status");
    console.log(`🫂 Graph Members: ${members.length}`);
    console.log(`👤 Current User: ${currentUser.displayName}`);

    // Quick analysis of all members
    const analyses = [];
    for (const member of members.slice(0, 5)) {
      // Limit to first 5 for performance
      const analysis = analyzeMyInfoStructure(member);
      analyses.push({
        username: member,
        needsHealing:
          analysis.needsAutoCompletion || analysis.needsFullCreation,
        completeness: analysis.completenessScore || 0,
      });
    }

    const needsHealingCount = analyses.filter((a) => a.needsHealing).length;
    const avgCompleteness = Math.round(
      analyses.reduce((sum, a) => sum + a.completeness, 0) / analyses.length
    );

    console.log(
      `🛠️ Members needing self-healing: ${needsHealingCount}/${analyses.length}`
    );
    console.log(`📊 Average profile completeness: ${avgCompleteness}%`);
    console.log("🔧 Self-Healing Features:");
    console.log("  ✅ Auto-detection of incomplete My Info:: structures");
    console.log("  ✅ Intelligent default generation with Roam user images");
    console.log(
      "  ✅ Boilerplate '__this field is not yet filled__' for missing data"
    );
    console.log("  ✅ Page navigation triggers for self-healing");
    console.log("  ✅ Directory modal integration with healing indicators");

    console.groupEnd();
  } catch (error) {
    console.error("Failed to show self-healing status:", error);
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Self-Healing Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("👥 Enhanced User Directory + Timezones starting...");

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
    if (
      !platform.getUtility("findNestedDataValues") ||
      !platform.getUtility("setDataValue")
    ) {
      console.error(
        "❌ Enhanced utilities not found! Please load Extension 1.5 with nested data support."
      );
      return;
    }

    // 🛠️ REGISTER SELF-HEALING SERVICES
    const selfHealingServices = {
      // Core self-healing functions
      analyzeMyInfoStructure: analyzeMyInfoStructure,
      performSelfHealing: performSelfHealing,
      generateSelfHealingDefaults: generateSelfHealingDefaults,
      createCompleteMyInfoStructure: createCompleteMyInfoStructure,
      createMyInfoField: createMyInfoField,
      addValueToEmptyField: addValueToEmptyField,

      // Enhanced user profile functions
      getUserProfileData: getUserProfileData,
      getAllUserProfiles: getAllUserProfiles,
      getCleanFieldValue: getCleanFieldValue,

      // UI functions
      showUserDirectoryModal: showUserDirectoryModal,
      createSelfHealingUserRow: createSelfHealingUserRow,

      // Timezone functions
      timezoneManager: timezoneManager,
      getCurrentTimeForUser: (tz) => timezoneManager.getCurrentTimeForUser(tz),
      validateTimezone: (tz) => timezoneManager.validateTimezone(tz),
      getCommonTimezones: () => timezoneManager.getCommonTimezones(),

      // Navigation functions
      addNavigationButtons: addNavigationButtons,

      // Testing functions
      runSelfHealingTests: runSelfHealingTests,
      showSelfHealingStatus: showSelfHealingStatus,
    };

    Object.entries(selfHealingServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 📝 REGISTER ENHANCED COMMANDS
    const commands = [
      {
        label: "Directory: Show User Directory",
        callback: showUserDirectoryModal,
      },
      {
        label: "Directory: Auto-Complete My Profile",
        callback: async () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            console.log(`🛠️ Auto-completing ${currentUser.displayName}...`);
            const result = await performSelfHealing(currentUser.displayName);
            if (result.success) {
              console.log(
                `✅ Auto-completion completed: ${
                  result.successCount || 0
                } fields completed`
              );
            } else {
              console.log(
                `ℹ️ Auto-completion result: ${result.action} ${
                  result.message || result.error || ""
                }`
              );
            }
          }
        },
      },
      {
        label: "Directory: Analyze My Profile Completeness",
        callback: () => {
          const currentUser = platform.getUtility("getAuthenticatedUser")();
          if (currentUser) {
            const analysis = analyzeMyInfoStructure(currentUser.displayName);
            console.group(`🔍 Profile Analysis: ${currentUser.displayName}`);
            console.log("Analysis result:", analysis);
            console.groupEnd();
          }
        },
      },
      {
        label: "Directory: Auto-Complete All Users",
        callback: async () => {
          const confirmed = confirm(
            "⚠️ This will auto-complete My Info:: for ALL graph members. Continue?"
          );
          if (confirmed) {
            console.log("🛠️ Auto-completing all users...");
            await getAllUserProfiles({ autoHeal: true });
            console.log("✅ Batch auto-completion completed!");
          }
        },
      },
      {
        label: "Directory: Run System Tests",
        callback: runSelfHealingTests,
      },
      {
        label: "Directory: Show System Status",
        callback: showSelfHealingStatus,
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🛠️ START SELF-HEALING MONITORING
    startSelfHealingMonitoring();

    // 🛠️ INITIAL SELF-HEALING CHECK
    setTimeout(async () => {
      const currentUser = platform.getUtility("getAuthenticatedUser")();
      const analysis = analyzeMyInfoStructure(currentUser.displayName);

      if (analysis.needsAutoCompletion || analysis.needsFullCreation) {
        console.log(
          `🛠️ Initial self-healing triggered for ${currentUser.displayName}...`
        );
        const result = await performSelfHealing(currentUser.displayName);
        if (result.success) {
          console.log(
            `✅ Initial self-healing completed: ${
              result.successCount || 0
            } fields healed`
          );
        }
      } else {
        console.log(
          `✅ ${currentUser.displayName} profile is complete (${analysis.completenessScore}%)`
        );
      }
    }, 3000);

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-directory",
      {
        services: selfHealingServices,
        timezoneManager: timezoneManager,
        version: "6.3.1",
      },
      {
        name: "Enhanced User Directory + Timezones",
        description:
          "Auto-completing My Info:: structures with intelligent defaults and logic gates",
        version: "6.3.1",
        dependencies: requiredDependencies,
      }
    );

    // 🎉 STARTUP COMPLETE
    const currentUser = platform.getUtility("getAuthenticatedUser")();
    const memberCount = platform.getUtility("getGraphMemberCount")();

    console.log("✅ Enhanced User Directory + Timezones loaded successfully!");
    console.log("🔧 FIXED: Logic gates prevent duplicate creation");
    console.log("🔧 FIXED: Button styling restored to warm yellow");
    console.log("🔧 FIXED: Uses standard Roam font");
    console.log(`👥 Directory ready for ${memberCount} graph members`);
    console.log(
      `🕐 Timezone support: ${
        timezoneManager.getCommonTimezones().length
      } common timezones`
    );
    console.log('💡 Try: Cmd+P → "Directory: Show User Directory"');

    console.log(
      `👤 Current user: ${currentUser.displayName} (auto-completion available as needed)`
    );
  },

  onunload: () => {
    console.log("👥 Enhanced User Directory + Timezones unloading...");

    // Clean up navigation buttons
    document
      .querySelectorAll(".user-directory-nav-button")
      .forEach((btn) => btn.remove());

    // Clean up modals
    const modals = document.querySelectorAll(
      "#user-directory-modal, #completion-nudge-modal"
    );
    modals.forEach((modal) => modal.remove());

    console.log("✅ Enhanced User Directory + Timezones cleanup complete!");
  },
};
