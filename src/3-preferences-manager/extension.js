// ===================================================================
// Extension 3: Configuration Manager - RESURRECTED with Subjournals Pattern
// 🎵 Parrot Duet Edition: "O mio babbino caro" - Now sings beautifully!
// Uses proven step-by-step + retry pattern from working Subjournals extension
// Format: **Field Name:** (bold single colons, not double like Extension 2)
// ===================================================================

// ===================================================================
// 🎨 CONFIGURATION SCHEMAS - Define all possible settings
// ===================================================================

const CONFIGURATION_SCHEMAS = {
  "Loading Page Preference": {
    type: "select",
    description: "Page to navigate to when opening Roam",
    options: ["Daily Page", "Chat Room"],
    default: "Daily Page",
    validation: (value) =>
      ["Daily Page", "Chat Room"].includes(value) ||
      "Invalid landing page option",
  },

  "Immutable Home Page": {
    type: "boolean",
    description:
      "Protect your home page from edits by others (allows comments)",
    options: ["yes", "no"],
    default: "yes",
    validation: (value) => ["yes", "no"].includes(value) || "Must be yes or no",
  },

  "Weekly Bundle": {
    type: "boolean",
    description: "Show weekly summary in journal entries",
    options: ["yes", "no"],
    default: "no",
    validation: (value) => ["yes", "no"].includes(value) || "Must be yes or no",
  },

  "Journal Header Color": {
    type: "select",
    description: "Color for journal entry headers",
    options: [
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
      "brown",
      "grey",
      "white",
    ],
    default: "blue",
    validation: (value) =>
      [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "violet",
        "brown",
        "grey",
        "white",
      ].includes(value) || "Invalid color option",
  },

  "Personal Shortcuts": {
    type: "array",
    description: "Personal navigation shortcuts (recommended: 8-10 pages)",
    default: ["Daily Notes", "Chat Room"], // Will be personalized during initialization
    validation: (value) => {
      if (!Array.isArray(value)) return "Must be an array of page names";
      if (value.length > 15) return "Too many shortcuts (max 15)";
      if (value.some((item) => typeof item !== "string"))
        return "All shortcuts must be page names (strings)";
      return true;
    },
  },
};

// ===================================================================
// 🚀 RESURRECTED PREFERENCE MANAGEMENT - Using Subjournals Pattern
// ===================================================================

/**
 * 🎵 RESURRECTED: Set user preference using proven Subjournals pattern
 * No more broken cascadeToBlock with empty arrays!
 */
const setUserPreferenceBulletproof = async (username, key, value) => {
  const startTime = Date.now();
  const TIMEOUT = 5000; // 5 second timeout
  const workingOn = { step: null, uid: null, content: null };
  let loopCount = 0;

  console.log(
    `🔧 [RESURRECTED] Setting "${key}" = ${JSON.stringify(
      value
    )} for ${username}`
  );

  while (Date.now() - startTime < TIMEOUT) {
    loopCount++;

    try {
      // STEP 1: Ensure preferences page exists
      const pageTitle = `${username}/user preferences`;
      let pageUid = await getOrCreatePageUid(pageTitle);

      if (!pageUid) {
        if (workingOn.step !== "page") {
          workingOn.step = "page";
          workingOn.uid = null;
          workingOn.content = pageTitle;
          console.log(`➕ Creating preferences page: ${pageTitle}`);
          pageUid = await window.roamAlphaAPI.data.page.create({
            page: { title: pageTitle },
          });
        }
        continue; // Retry
      }

      // STEP 2: Ensure preference key block exists (bold format)
      const keyText = `**${key}:**`;
      const keyBlock = await findOrCreateBlock(pageUid, keyText);

      if (!keyBlock) {
        if (workingOn.step !== "key" || workingOn.uid !== pageUid) {
          workingOn.step = "key";
          workingOn.uid = pageUid;
          workingOn.content = keyText;
          await createBlockSimple(pageUid, keyText);
        }
        continue; // Retry
      }

      // STEP 3: Clear existing values (clean update)
      console.log(`🧹 Clearing existing values for "${key}"`);
      const existingChildren = await getBlockChildren(keyBlock.uid);

      for (const child of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: child.uid },
        });
      }

      // Small delay after deletions
      await new Promise((resolve) => setTimeout(resolve, 100));

      // STEP 4: Add new value(s) - handle arrays properly
      const values = Array.isArray(value) ? value : [value];
      console.log(`📝 Adding ${values.length} value(s)`);

      let allValuesAdded = true;
      for (let i = 0; i < values.length; i++) {
        const val = String(values[i]).trim();
        if (val === "") continue; // Skip empty values

        console.log(`➕ Adding value ${i + 1}/${values.length}: "${val}"`);

        try {
          await window.roamAlphaAPI.data.block.create({
            location: { "parent-uid": keyBlock.uid, order: i },
            block: { string: val },
          });

          // Small delay to prevent API overload
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (valueError) {
          console.error(`❌ Failed to add value: ${val}`, valueError);
          allValuesAdded = false;
          break;
        }
      }

      if (!allValuesAdded) {
        continue; // Retry main loop
      }

      // SUCCESS!
      console.log(
        `✅ [RESURRECTED] Successfully set "${key}" for ${username} in ${loopCount} loops (${
          Date.now() - startTime
        }ms)`
      );
      return true;
    } catch (error) {
      console.error(`❌ Loop ${loopCount} error:`, error.message);
    }
  }

  throw new Error(
    `Set preference timeout after ${TIMEOUT}ms (${loopCount} loops)`
  );
};

/**
 * 🎵 RESURRECTED: Get user preference with auto-creation using Subjournals pattern
 */
const getUserPreferenceBulletproof = async (
  username,
  key,
  defaultValue = null
) => {
  try {
    console.log(`🔍 [RESURRECTED] Getting "${key}" for ${username}`);

    // STEP 1: Check if preferences page exists
    const pageTitle = `${username}/user preferences`;
    let pageUid = await getOrCreatePageUid(pageTitle);

    if (!pageUid) {
      console.log(
        `📄 Preferences page doesn't exist, will auto-create on next set operation`
      );
      return defaultValue;
    }

    // STEP 2: Find the preference key block (bold format)
    const keyText = `**${key}:**`;
    const keyBlock = await findBlockByText(pageUid, keyText);

    if (!keyBlock) {
      console.log(`🔍 Preference "${key}" not found for ${username}`);
      return defaultValue;
    }

    // STEP 3: Get the value(s)
    const valueChildren = await getBlockChildren(keyBlock.uid);

    if (valueChildren.length === 0) {
      return defaultValue;
    } else if (valueChildren.length === 1) {
      const result = valueChildren[0].text;
      console.log(
        `⚙️ [RESURRECTED] Preference "${key}" for ${username}: ${result}`
      );
      return result;
    } else {
      // Multiple values - return as array
      const result = valueChildren.map((child) => child.text);
      console.log(
        `⚙️ [RESURRECTED] Preference "${key}" for ${username}: [${result.join(
          ", "
        )}]`
      );
      return result;
    }
  } catch (error) {
    console.error(
      `❌ [RESURRECTED] Error getting preference "${key}" for ${username}:`,
      error
    );
    return defaultValue;
  }
};

/**
 * 🎵 RESURRECTED: Initialize user preferences using proven Subjournals pattern
 */
const initializeUserPreferencesBulletproof = async (username) => {
  const startTime = Date.now();
  const TIMEOUT = 10000; // 10 second timeout for full initialization
  const workingOn = { step: null, uid: null, content: null };
  let loopCount = 0;

  console.log(
    `🎯 [RESURRECTED] Initializing default preferences for ${username}...`
  );

  while (Date.now() - startTime < TIMEOUT) {
    loopCount++;

    try {
      // STEP 1: Ensure preferences page exists
      const pageTitle = `${username}/user preferences`;
      let pageUid = await getOrCreatePageUid(pageTitle);

      if (!pageUid) {
        if (workingOn.step !== "page") {
          workingOn.step = "page";
          workingOn.uid = null;
          workingOn.content = pageTitle;
          console.log(`➕ Creating preferences page: ${pageTitle}`);
          pageUid = await window.roamAlphaAPI.data.page.create({
            page: { title: pageTitle },
          });
        }
        continue; // Retry
      }

      // STEP 2: Create personalized schemas with current username
      const personalizedSchemas = {
        ...CONFIGURATION_SCHEMAS,
        "Personal Shortcuts": {
          ...CONFIGURATION_SCHEMAS["Personal Shortcuts"],
          default: [`${username}/user preferences`, username],
        },
      };

      // STEP 3: Process each schema preference
      const preferenceKeys = Object.keys(personalizedSchemas);
      let allPreferencesSet = true;
      let successCount = 0;

      for (let i = 0; i < preferenceKeys.length; i++) {
        const key = preferenceKeys[i];
        const schema = personalizedSchemas[key];

        console.log(`🔧 Processing ${i + 1}/${preferenceKeys.length}: ${key}`);

        // Check if preference already exists
        const keyText = `**${key}:**`;
        const existingBlock = await findBlockByText(pageUid, keyText);

        if (!existingBlock) {
          // Create preference key block
          if (workingOn.step !== `pref-${key}` || workingOn.uid !== pageUid) {
            workingOn.step = `pref-${key}`;
            workingOn.uid = pageUid;
            workingOn.content = keyText;
            await createBlockSimple(pageUid, keyText);
          }
          allPreferencesSet = false;
          break; // Exit preference loop, retry main loop
        }

        // Check if preference has value
        const hasValue = await blockHasChildren(existingBlock.uid);
        if (!hasValue) {
          // Add default value(s)
          const defaultValues = Array.isArray(schema.default)
            ? schema.default
            : [schema.default];

          console.log(
            `📝 Adding ${defaultValues.length} default value(s) for ${key}`
          );

          // Create all default values
          for (let j = 0; j < defaultValues.length; j++) {
            const val = String(defaultValues[j]).trim();
            if (val === "") continue; // Skip empty values

            if (
              workingOn.step !== `value-${key}-${j}` ||
              workingOn.uid !== existingBlock.uid
            ) {
              workingOn.step = `value-${key}-${j}`;
              workingOn.uid = existingBlock.uid;
              workingOn.content = val;
              await createBlockSimple(existingBlock.uid, val);
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // Verify all values were created
          const newChildCount = await getBlockChildCount(existingBlock.uid);
          if (newChildCount < defaultValues.length) {
            allPreferencesSet = false;
            break; // Exit preference loop, retry main loop
          }

          console.log(
            `✅ Added ${defaultValues.length} default value(s) for ${key}`
          );
          successCount++;
        } else {
          successCount++;
          console.log(
            `✅ ${successCount}/${preferenceKeys.length}: ${key} already configured`
          );
        }

        // Small delay between preferences
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!allPreferencesSet) {
        continue; // Retry main loop
      }

      // SUCCESS - all preferences initialized
      console.log(
        `🎉 [RESURRECTED] Initialized ${preferenceKeys.length} preferences for ${username}`
      );
      console.log(
        `   - Total loops: ${loopCount}, Time: ${Date.now() - startTime}ms`
      );
      return true;
    } catch (error) {
      console.error(`❌ Loop ${loopCount} error:`, error.message);
    }
  }

  throw new Error(
    `Initialize preferences timeout after ${TIMEOUT}ms (${loopCount} loops)`
  );
};

/**
 * 🎵 RESURRECTED: Get all user preferences
 */
const getAllUserPreferencesBulletproof = async (username) => {
  try {
    console.log(`📊 [RESURRECTED] Loading all preferences for ${username}`);

    const preferences = {};
    const preferenceKeys = Object.keys(CONFIGURATION_SCHEMAS);

    for (const key of preferenceKeys) {
      const value = await getUserPreferenceBulletproof(username, key);
      if (value !== null) {
        preferences[key] = value;
      }
    }

    console.log(
      `📊 [RESURRECTED] Loaded ${
        Object.keys(preferences).length
      } preferences for ${username}`
    );
    return preferences;
  } catch (error) {
    console.error(
      `❌ [RESURRECTED] Failed to get all preferences for ${username}:`,
      error
    );
    return {};
  }
};

// ===================================================================
// 🔧 SUPPORTING FUNCTIONS - Subjournals Pattern (Reused from Extension 2)
// ===================================================================

/**
 * Get or create page UID using Subjournals pattern
 */
const getOrCreatePageUid = async (title) => {
  try {
    // Check if page already exists
    let pageUid = window.roamAlphaAPI.q(`
      [:find ?uid :where [?e :node/title "${title}"] [?e :block/uid ?uid]]
    `)?.[0]?.[0];

    if (pageUid) return pageUid;

    // Page doesn't exist, caller should create it
    return null;
  } catch (error) {
    console.error(`getOrCreatePageUid failed for "${title}":`, error);
    return null;
  }
};

/**
 * Find block by text content using Subjournals pattern
 */
const findBlockByText = async (parentUid, searchText) => {
  try {
    // Search for exact match first
    const exact = window.roamAlphaAPI.q(`
      [:find (pull ?child [:block/uid :block/string])
       :where 
       [?parent :block/uid "${parentUid}"] [?child :block/parents ?parent]
       [?child :block/string "${searchText}"]]
    `);

    if (exact.length > 0) {
      const found = exact[0][0];
      return {
        uid: found[":block/uid"] || found.uid,
        string: found[":block/string"] || found.string,
      };
    }

    // Fallback: search with starts-with
    const startsWith = window.roamAlphaAPI.q(`
      [:find (pull ?child [:block/uid :block/string])
       :where 
       [?parent :block/uid "${parentUid}"] [?child :block/parents ?parent]
       [?child :block/string ?string] [(clojure.string/starts-with? ?string "${searchText}")]]
    `);

    if (startsWith.length > 0) {
      const found = startsWith[0][0];
      return {
        uid: found[":block/uid"] || found.uid,
        string: found[":block/string"] || found.string,
      };
    }

    return null;
  } catch (error) {
    console.error(`findBlockByText failed for "${searchText}":`, error);
    return null;
  }
};

/**
 * Find or create block using Subjournals pattern
 */
const findOrCreateBlock = async (parentUid, blockText) => {
  try {
    // Just find - creation handled by caller in retry loop
    return await findBlockByText(parentUid, blockText);
  } catch (error) {
    console.error(`findOrCreateBlock failed for "${blockText}":`, error);
    return null;
  }
};

/**
 * Create block using Subjournals pattern
 */
const createBlockSimple = async (parentUid, content) => {
  try {
    const childCount =
      window.roamAlphaAPI.q(`
      [:find (count ?child) :where 
       [?parent :block/uid "${parentUid}"] [?child :block/parents ?parent]]
    `)?.[0]?.[0] || 0;

    const blockUid = window.roamAlphaAPI.util.generateUID();
    await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": parentUid, order: childCount },
      block: { uid: blockUid, string: content },
    });

    return blockUid;
  } catch (error) {
    console.error(`createBlockSimple failed for "${content}":`, error);
    throw error;
  }
};

/**
 * Get block children using direct API
 */
const getBlockChildren = async (blockUid) => {
  try {
    const children = window.roamAlphaAPI.q(`
      [:find (pull ?child [:block/uid :block/string])
       :where 
       [?parent :block/uid "${blockUid}"] [?child :block/parents ?parent]]
    `);

    return children.map(([child]) => ({
      uid: child[":block/uid"] || child.uid,
      text: child[":block/string"] || child.string,
    }));
  } catch (error) {
    console.error(`getBlockChildren failed for "${blockUid}":`, error);
    return [];
  }
};

/**
 * Get block child count using direct API
 */
const getBlockChildCount = async (blockUid) => {
  try {
    const childCount =
      window.roamAlphaAPI.q(`
      [:find (count ?child) :where 
       [?parent :block/uid "${blockUid}"] [?child :block/parents ?parent]]
    `)?.[0]?.[0] || 0;

    return childCount;
  } catch (error) {
    console.error(`getBlockChildCount failed for "${blockUid}":`, error);
    return 0;
  }
};

/**
 * Check if block has children using Subjournals pattern
 */
const blockHasChildren = async (blockUid) => {
  try {
    const childCount =
      window.roamAlphaAPI.q(`
      [:find (count ?child) :where 
       [?parent :block/uid "${blockUid}"] [?child :block/parents ?parent]]
    `)?.[0]?.[0] || 0;

    return childCount > 0;
  } catch (error) {
    console.error(`blockHasChildren failed for "${blockUid}":`, error);
    return false;
  }
};

// ===================================================================
// 🔧 CONFIGURATION VALIDATION & WORKFLOWS - Enhanced but Stable
// ===================================================================

/**
 * 🔧 Validate individual configuration value
 */
const validateConfigurationValue = (key, value) => {
  const schema = CONFIGURATION_SCHEMAS[key];
  if (!schema) {
    return { valid: false, error: `Unknown configuration key: ${key}` };
  }

  const validationResult = schema.validation(value);
  if (validationResult === true) {
    return { valid: true };
  } else {
    return { valid: false, error: validationResult };
  }
};

/**
 * 🔧 Get configuration default value
 */
const getConfigurationDefault = (key) => {
  const schema = CONFIGURATION_SCHEMAS[key];
  return schema ? schema.default : null;
};

/**
 * 🔧 Get configuration schema
 */
const getConfigurationSchema = (key) => {
  return CONFIGURATION_SCHEMAS[key] || null;
};

/**
 * 🎵 RESURRECTED: Validate and repair user configuration
 */
const validateAndRepairConfigurationBulletproof = async (username) => {
  try {
    console.log(
      `🔧 [RESURRECTED] Validating and repairing configuration for ${username}...`
    );

    let fixedCount = 0;
    let addedCount = 0;
    const issues = [];

    for (const [key, schema] of Object.entries(CONFIGURATION_SCHEMAS)) {
      console.log(`🔍 Checking: ${key}`);

      const currentValue = await getUserPreferenceBulletproof(username, key);

      if (currentValue === null) {
        // Missing - add default
        console.log(
          `➕ Adding missing ${key}: ${JSON.stringify(schema.default)}`
        );
        try {
          const success = await setUserPreferenceBulletproof(
            username,
            key,
            schema.default
          );
          if (success) {
            addedCount++;
            console.log(`✅ Added: ${key}`);
          } else {
            issues.push(`Failed to add ${key}`);
          }
        } catch (error) {
          issues.push(`Error adding ${key}: ${error.message}`);
        }
      } else {
        // Validate existing value
        const validation = validateConfigurationValue(key, currentValue);

        if (!validation.valid) {
          console.log(
            `🔧 Fixing invalid ${key}: ${JSON.stringify(
              currentValue
            )} → ${JSON.stringify(schema.default)}`
          );
          console.log(`   Reason: ${validation.error}`);

          try {
            const success = await setUserPreferenceBulletproof(
              username,
              key,
              schema.default
            );
            if (success) {
              fixedCount++;
              console.log(`✅ Fixed: ${key}`);
            } else {
              issues.push(`Failed to fix ${key}: ${validation.error}`);
            }
          } catch (error) {
            issues.push(`Error fixing ${key}: ${error.message}`);
          }
        } else {
          console.log(`✅ Valid: ${key} = ${JSON.stringify(currentValue)}`);
        }
      }

      // Small delay between operations
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const message = `🔧 [RESURRECTED] Repair completed: ${fixedCount} fixed, ${addedCount} added`;
    console.log(message);

    return {
      fixedCount,
      addedCount,
      totalChecked: Object.keys(CONFIGURATION_SCHEMAS).length,
      issues,
      success: true,
    };
  } catch (error) {
    console.error(
      `❌ [RESURRECTED] Validation/repair failed for ${username}:`,
      error
    );
    return {
      fixedCount: 0,
      addedCount: 0,
      totalChecked: 0,
      issues: [error.message],
      success: false,
      error: error.message,
    };
  }
};

/**
 * 📊 Generate configuration overview
 */
const generateConfigurationOverview = async (username) => {
  try {
    const allPreferences = await getAllUserPreferencesBulletproof(username);
    const totalSettings = Object.keys(CONFIGURATION_SCHEMAS).length;
    const configuredSettings = Object.keys(allPreferences).length;
    const missingSettings = Object.keys(CONFIGURATION_SCHEMAS).filter(
      (key) => !(key in allPreferences)
    );

    let invalidSettings = 0;
    const invalidDetails = [];

    for (const [key, value] of Object.entries(allPreferences)) {
      const validation = validateConfigurationValue(key, value);
      if (!validation.valid) {
        invalidSettings++;
        invalidDetails.push(`${key}: ${validation.error}`);
      }
    }

    const summary =
      invalidSettings === 0 && missingSettings.length === 0
        ? "✅ Perfect"
        : invalidSettings > 0 || missingSettings.length > 0
        ? "⚠️ Needs Repair"
        : "✅ Good";

    return {
      username,
      totalSettings,
      configuredSettings,
      missingSettings,
      invalidSettings,
      invalidDetails,
      summary,
      preferences: allPreferences,
    };
  } catch (error) {
    console.error(`Error generating overview for ${username}:`, error);
    return {
      username,
      error: error.message,
      summary: "❌ Error",
    };
  }
};

/**
 * 🔄 Reset user configuration to defaults
 */
const resetUserConfiguration = async (username) => {
  console.log(
    `🔄 [RESURRECTED] Resetting configuration to defaults for ${username}...`
  );

  try {
    const result = await initializeUserPreferencesBulletproof(username);

    if (result) {
      console.log(`✅ Configuration reset completed for ${username}`);
      return { success: true, message: "Configuration reset to defaults" };
    } else {
      console.error(`❌ Configuration reset failed for ${username}`);
      return {
        success: false,
        message: "Reset failed - check console for details",
      };
    }
  } catch (error) {
    console.error(`Error resetting configuration for ${username}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * 📤 Export user configuration
 */
const exportUserConfiguration = async (username) => {
  try {
    const preferences = await getAllUserPreferencesBulletproof(username);

    const exportData = {
      username,
      timestamp: new Date().toISOString(),
      preferences,
      schemas: CONFIGURATION_SCHEMAS,
      version: "3.0.0-resurrected",
    };

    console.log(
      `📤 [RESURRECTED] Exported ${
        Object.keys(preferences).length
      } preferences for ${username}`
    );
    return exportData;
  } catch (error) {
    console.error(`Error exporting configuration for ${username}:`, error);
    return null;
  }
};

// ===================================================================
// 🎯 USER INTERFACE FUNCTIONS - Professional Status Display
// ===================================================================

/**
 * 📊 Display configuration status
 */
const displayConfigurationStatus = async (username) => {
  console.group(`⚙️ [RESURRECTED] Configuration Status: ${username}`);

  try {
    const overview = await generateConfigurationOverview(username);

    console.log(`📊 Overview: ${overview.summary}`);
    console.log(
      `📈 Progress: ${overview.configuredSettings}/${overview.totalSettings} settings configured`
    );

    if (overview.missingSettings.length > 0) {
      console.log(`❓ Missing settings (${overview.missingSettings.length}):`);
      overview.missingSettings.forEach((setting) => {
        const defaultValue = getConfigurationDefault(setting);
        console.log(
          `   • ${setting}: will default to ${JSON.stringify(defaultValue)}`
        );
      });
    }

    if (overview.invalidSettings > 0) {
      console.log(`⚠️ Invalid settings (${overview.invalidSettings}):`);
      overview.invalidDetails.forEach((detail) => {
        console.log(`   • ${detail}`);
      });
    }

    if (overview.summary === "✅ Perfect") {
      console.log("🎉 All settings are configured correctly!");
    } else {
      console.log('💡 Run "Config: Validate and Repair" to fix issues');
    }

    console.log("\n📋 Current settings:");
    Object.entries(overview.preferences).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });
  } catch (error) {
    console.error("❌ Failed to display configuration status:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🎛️ CONFIGURATION SERVICES - Service Registration
// ===================================================================

const configurationServices = {
  // Validation services
  validateConfigurationValue,
  getConfigurationDefault,
  getConfigurationSchema,

  // Core preference operations (resurrected)
  setUserPreference: setUserPreferenceBulletproof,
  getUserPreference: getUserPreferenceBulletproof,
  getAllUserPreferences: getAllUserPreferencesBulletproof,
  initializeUserPreferences: initializeUserPreferencesBulletproof,

  // Workflow services (resurrected)
  validateAndRepairConfiguration: validateAndRepairConfigurationBulletproof,
  resetUserConfiguration,
  exportUserConfiguration,

  // UI services
  generateConfigurationOverview,
  displayConfigurationStatus,

  // Schema access
  getConfigurationSchemas: () => CONFIGURATION_SCHEMAS,
};

// ===================================================================
// 🎮 COMMAND PALETTE - Professional Configuration Commands
// ===================================================================

const createConfigurationCommands = (platform) => {
  const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");

  return [
    {
      label: "Config: Show My Configuration Status",
      callback: async () => {
        const user = getAuthenticatedUser();
        if (user) {
          await displayConfigurationStatus(user.displayName);
        } else {
          console.error("❌ No authenticated user found");
        }
      },
    },
    {
      label: "Config: Validate and Repair",
      callback: async () => {
        console.group("🔧 [RESURRECTED] Configuration Validation and Repair");

        const user = getAuthenticatedUser();
        if (!user) {
          console.error("❌ No authenticated user found");
          console.groupEnd();
          return;
        }

        console.log(`🎯 Validating configuration for: ${user.displayName}`);

        const result = await validateAndRepairConfigurationBulletproof(
          user.displayName
        );

        if (result.success) {
          console.log(`🎉 Validation complete!`);
          console.log(`   • ${result.fixedCount} settings fixed`);
          console.log(`   • ${result.addedCount} settings added`);
          console.log(`   • ${result.totalChecked} total settings checked`);

          if (result.issues.length > 0) {
            console.log(`⚠️ Issues encountered:`);
            result.issues.forEach((issue) => console.log(`   • ${issue}`));
          }
        } else {
          console.error(`❌ Validation failed: ${result.error}`);
        }

        console.groupEnd();
      },
    },
    {
      label: "Config: Reset to Defaults",
      callback: async () => {
        const user = getAuthenticatedUser();
        if (user) {
          console.log(`🔄 Resetting configuration for: ${user.displayName}`);
          const result = await resetUserConfiguration(user.displayName);
          if (result.success) {
            console.log("✅ Configuration reset successfully!");
          } else {
            console.error(`❌ Reset failed: ${result.message}`);
          }
        }
      },
    },
    {
      label: "Config: Export Configuration",
      callback: async () => {
        const user = getAuthenticatedUser();
        if (user) {
          const exportData = await exportUserConfiguration(user.displayName);
          if (exportData) {
            console.log("📤 Configuration exported:");
            console.log(JSON.stringify(exportData, null, 2));
          }
        }
      },
    },
    {
      label: "Config: Initialize Preferences",
      callback: async () => {
        const user = getAuthenticatedUser();
        if (user) {
          console.log(
            `🎯 [RESURRECTED] Initializing preferences for: ${user.displayName}`
          );
          const success = await initializeUserPreferencesBulletproof(
            user.displayName
          );
          if (success) {
            console.log(
              "🎉 [RESURRECTED] Preferences initialized successfully!"
            );
          } else {
            console.error("❌ [RESURRECTED] Failed to initialize preferences");
          }
        }
      },
    },
    {
      label: "Config: Show All Available Settings",
      callback: () => {
        console.group("📋 Available Configuration Settings");
        Object.entries(CONFIGURATION_SCHEMAS).forEach(([key, schema]) => {
          console.log(`${key}:`);
          console.log(`  Type: ${schema.type}`);
          console.log(`  Default: ${JSON.stringify(schema.default)}`);
          console.log(`  Description: ${schema.description}`);
          if (schema.options) {
            console.log(`  Options: ${schema.options.join(", ")}`);
          }
        });
        console.groupEnd();
      },
    },
  ];
};

// ===================================================================
// 🚀 EXTENSION REGISTRATION - Complete Professional Registration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🎵 Configuration Manager (RESURRECTED) starting...");
    console.log("🦜 Preparing for parrot duet: 'O mio babbino caro'");

    // Verify dependencies
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    if (!platform.has("utility-library")) {
      console.error(
        "❌ Utility Library not found! Please load Extension 1.5 first."
      );
      return;
    }

    if (!platform.has("user-authentication")) {
      console.error(
        "❌ User Authentication not found! Please load Extension 2 first."
      );
      return;
    }

    console.log("✅ Dependencies verified - proceeding with resurrection");

    // Register configuration services
    Object.entries(configurationServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // Initialize command palette
    if (!window._extensionRegistry) {
      window._extensionRegistry = { commands: [] };
    }

    // Register professional commands
    const commands = createConfigurationCommands(platform);
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // Register self with platform
    platform.register(
      "configuration-manager",
      {
        schemas: CONFIGURATION_SCHEMAS,
        services: configurationServices,
        version: "3.0.0-resurrected",
      },
      {
        name: "🎵 Configuration Manager (RESURRECTED)",
        description:
          "Professional configuration interface with proven Subjournals cascading architecture",
        version: "3.0.0-resurrected",
        dependencies: ["utility-library", "user-authentication"],
      }
    );

    // Startup validation with auto-creation
    try {
      const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
      const user = getAuthenticatedUser();

      if (user) {
        console.log(
          "🎯 Running startup configuration check with auto-creation..."
        );

        // First, try to get overview (this will show current state)
        const overview = await generateConfigurationOverview(user.displayName);

        console.log(
          "🎵 Configuration Manager (RESURRECTED) loaded successfully!"
        );
        console.log(`⚙️ Initial configuration status: ${overview.summary}`);

        // AUTO-CREATE: Initialize preferences if missing or incomplete
        if (
          overview.configuredSettings === 0 ||
          overview.missingSettings.length > 0
        ) {
          console.log("🚀 Auto-creating user preferences...");
          try {
            const success = await initializeUserPreferencesBulletproof(
              user.displayName
            );
            if (success) {
              console.log("✅ User preferences auto-created successfully!");
              console.log(
                `📄 Created: [[${user.displayName}/user preferences]]`
              );

              // Show final status
              const finalOverview = await generateConfigurationOverview(
                user.displayName
              );
              console.log(`🎉 Final status: ${finalOverview.summary}`);
            } else {
              console.error(
                "❌ Auto-creation failed - manual initialization may be needed"
              );
            }
          } catch (autoError) {
            console.error("❌ Auto-creation error:", autoError.message);
            console.log(
              '💡 Try manual: Cmd+P → "Config: Initialize Preferences"'
            );
          }
        } else {
          console.log("✅ User preferences already configured!");
        }

        console.log(
          '💡 Available: Cmd+P → "Config: Show My Configuration Status"'
        );
      } else {
        console.log(
          "✅ Configuration Manager (RESURRECTED) loaded successfully!"
        );
        console.log(
          "ℹ️ No authenticated user detected - auto-creation will run when user logs in"
        );
      }
    } catch (error) {
      console.warn(
        "Configuration Manager loaded with warnings:",
        error.message
      );
      console.log('💡 Try manual: Cmd+P → "Config: Initialize Preferences"');
    }

    console.log("🦜🎵 Ready for beautiful parrot duet with Extension 2!");
  },

  onunload: () => {
    console.log("🎵 Configuration Manager (RESURRECTED) unloading...");
    console.log(
      "🦜 Parrot duet complete - 'O mio babbino caro' sung beautifully!"
    );
    console.log("✅ Configuration Manager cleanup complete!");
  },
};
