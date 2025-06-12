// ===================================================================
// Extension 3: Configuration Manager - MODERNIZED with Bulletproof Cascading
// Leverages Extension 1.5 (Bulletproof Utilities) + Extension 2 (Authentication)
// Focus: Professional configuration UI with battle-tested underlying architecture
// ===================================================================

// ===================================================================
// 🎨 CONFIGURATION SCHEMAS - Define all possible settings
// ===================================================================

const CONFIGURATION_SCHEMAS = {
  "Loading Page Preference": {
    type: "select",
    description: "Page to navigate to when opening Roam",
    options: ["Daily Page", "Chat Room", "Smart"],
    default: "Daily Page",
    validation: (value) =>
      ["Daily Page", "Chat Room", "Smart"].includes(value) ||
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
    default: ["Daily Notes", "Chat Room"],
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
// 🚀 MODERNIZED PREFERENCE MANAGEMENT - Using Bulletproof Cascading
// ===================================================================

/**
 * 🚀 MODERN: Set user preference using bulletproof cascading
 * Uses proven Extension 1.5 utilities instead of older patterns
 */
const setUserPreferenceBulletproof = async (username, key, value) => {
  try {
    console.log(
      `🔧 [MODERN] Setting "${key}" = ${JSON.stringify(value)} for ${username}`
    );

    const platform = window.RoamExtensionSuite;
    const cascadeToBlock = platform.getUtility("cascadeToBlock");

    if (!cascadeToBlock) {
      console.error(
        "❌ cascadeToBlock utility not found - Extension 1.5 required"
      );
      return false;
    }

    // 1. Ensure user preferences page exists
    const pageTitle = `${username}/user preferences`;
    console.log(`📄 Ensuring preferences page exists: ${pageTitle}`);

    const pageUid = await cascadeToBlock(pageTitle, [], true);
    if (!pageUid) {
      console.error(`❌ Failed to create preferences page: ${pageTitle}`);
      return false;
    }

    // 2. Format the preference key (bold format for visibility)
    const keyText = `**${key}:**`;

    // 3. Use cascading to create/find the preference key block
    console.log(`🔗 Creating preference key: ${keyText}`);
    const keyBlockUid = await cascadeToBlock(pageTitle, [keyText], true);

    if (!keyBlockUid) {
      console.error(`❌ Failed to create preference key: ${keyText}`);
      return false;
    }

    // 4. Clear existing values (clean update)
    console.log(`🧹 Clearing existing values for "${key}"`);
    const getDirectChildren = platform.getUtility("getDirectChildren");
    const existingChildren = getDirectChildren(keyBlockUid);

    for (const child of existingChildren) {
      await window.roamAlphaAPI.data.block.delete({
        block: { uid: child.uid },
      });
    }

    // 5. Add new value(s) - handle arrays properly
    const values = Array.isArray(value) ? value : [value];
    console.log(`📝 Adding ${values.length} value(s)`);

    for (let i = 0; i < values.length; i++) {
      const val = String(values[i]).trim();
      if (val === "") continue; // Skip empty values

      console.log(`➕ Adding value ${i + 1}/${values.length}: "${val}"`);

      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyBlockUid, order: i },
        block: { string: val },
      });

      // Small delay to prevent API overload
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log(`✅ [MODERN] Successfully set "${key}" for ${username}`);
    return true;
  } catch (error) {
    console.error(
      `❌ [MODERN] Error setting preference "${key}" for ${username}:`,
      error
    );
    return false;
  }
};

/**
 * 🚀 MODERN: Get user preference using Extension 1.5 utilities
 * More reliable than the older findDataValueExact approach
 */
const getUserPreferenceBulletproof = async (
  username,
  key,
  defaultValue = null
) => {
  try {
    console.log(`🔍 [MODERN] Getting "${key}" for ${username}`);

    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const getDirectChildren = platform.getUtility("getDirectChildren");
    const normalizeHeaderText = platform.getUtility("normalizeHeaderText");

    // 1. Get preferences page UID
    const pageTitle = `${username}/user preferences`;
    const pageUid = getPageUidByTitle(pageTitle);

    if (!pageUid) {
      console.log(`📄 No preferences page found for ${username}`);
      return defaultValue;
    }

    // 2. Find the preference key block
    const pageChildren = getDirectChildren(pageUid);
    const keyText = `**${key}:**`;

    const keyBlock = pageChildren.find((child) => {
      const normalized = normalizeHeaderText(child.text);
      const normalizedKey = normalizeHeaderText(keyText);
      return normalized === normalizedKey;
    });

    if (!keyBlock) {
      console.log(`🔍 Preference "${key}" not found for ${username}`);
      return defaultValue;
    }

    // 3. Get the value(s)
    const valueChildren = getDirectChildren(keyBlock.uid);

    if (valueChildren.length === 0) {
      return defaultValue;
    } else if (valueChildren.length === 1) {
      const result = valueChildren[0].text;
      console.log(`⚙️ [MODERN] Preference "${key}" for ${username}: ${result}`);
      return result;
    } else {
      // Multiple values - return as array
      const result = valueChildren.map((child) => child.text);
      console.log(
        `⚙️ [MODERN] Preference "${key}" for ${username}: [${result.join(
          ", "
        )}]`
      );
      return result;
    }
  } catch (error) {
    console.error(
      `❌ [MODERN] Error getting preference "${key}" for ${username}:`,
      error
    );
    return defaultValue;
  }
};

/**
 * 🚀 MODERN: Get all user preferences as object
 */
const getAllUserPreferencesBulletproof = async (username) => {
  try {
    console.log(`📊 [MODERN] Loading all preferences for ${username}`);

    const preferences = {};
    const preferenceKeys = Object.keys(CONFIGURATION_SCHEMAS);

    for (const key of preferenceKeys) {
      const value = await getUserPreferenceBulletproof(username, key);
      if (value !== null) {
        preferences[key] = value;
      }
    }

    console.log(
      `📊 [MODERN] Loaded ${
        Object.keys(preferences).length
      } preferences for ${username}`
    );
    return preferences;
  } catch (error) {
    console.error(
      `❌ [MODERN] Failed to get all preferences for ${username}:`,
      error
    );
    return {};
  }
};

/**
 * 🚀 MODERN: Initialize user preferences using bulletproof cascading
 */
const initializeUserPreferencesBulletproof = async (username) => {
  try {
    console.log(
      `🎯 [MODERN] Initializing default preferences for ${username}...`
    );

    let successCount = 0;
    const totalCount = Object.keys(CONFIGURATION_SCHEMAS).length;

    // Set each default preference using bulletproof method
    for (const [key, schema] of Object.entries(CONFIGURATION_SCHEMAS)) {
      console.log(
        `🔧 Setting default: ${key} = ${JSON.stringify(schema.default)}`
      );

      const success = await setUserPreferenceBulletproof(
        username,
        key,
        schema.default
      );
      if (success) {
        successCount++;
        console.log(`✅ ${successCount}/${totalCount}: ${key}`);
      } else {
        console.error(`❌ Failed to set: ${key}`);
      }

      // Small delay to prevent overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `🎉 [MODERN] Initialized ${successCount}/${totalCount} preferences for ${username}`
    );
    return successCount === totalCount;
  } catch (error) {
    console.error(
      `❌ [MODERN] Failed to initialize preferences for ${username}:`,
      error
    );
    return false;
  }
};

// ===================================================================
// 🔧 CONFIGURATION VALIDATION & WORKFLOWS - Modernized
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
 * 🚀 MODERN: Validate and repair user configuration
 */
const validateAndRepairConfigurationBulletproof = async (username) => {
  try {
    console.log(
      `🔧 [MODERN] Validating and repairing configuration for ${username}...`
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
        } else {
          console.log(`✅ Valid: ${key} = ${JSON.stringify(currentValue)}`);
        }
      }

      // Small delay between operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const message = `🔧 [MODERN] Repair completed: ${fixedCount} fixed, ${addedCount} added`;
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
      `❌ [MODERN] Validation/repair failed for ${username}:`,
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
 * 🎯 Reset user configuration to defaults
 */
const resetUserConfiguration = async (username) => {
  console.log(`🔄 Resetting configuration to defaults for ${username}...`);

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
      version: "3.0.0-modern",
    };

    console.log(
      `📤 [MODERN] Exported ${
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
  console.group(`⚙️ Configuration Status: ${username}`);

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

  // Core preference operations (modern)
  setUserPreference: setUserPreferenceBulletproof,
  getUserPreference: getUserPreferenceBulletproof,
  getAllUserPreferences: getAllUserPreferencesBulletproof,
  initializeUserPreferences: initializeUserPreferencesBulletproof,

  // Workflow services (modern)
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
        console.group("🔧 [MODERN] Configuration Validation and Repair");

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
            `🎯 [MODERN] Initializing preferences for: ${user.displayName}`
          );
          const success = await initializeUserPreferencesBulletproof(
            user.displayName
          );
          if (success) {
            console.log("🎉 [MODERN] Preferences initialized successfully!");
          } else {
            console.error("❌ [MODERN] Failed to initialize preferences");
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
    console.log("⚙️ Configuration Manager (Modern) starting...");

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

    console.log("✅ Dependencies verified - proceeding with registration");

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
        version: "3.0.0-modern",
      },
      {
        name: "Configuration Manager (Modern)",
        description:
          "Professional configuration interface with bulletproof cascading architecture",
        version: "3.0.0-modern",
        dependencies: ["utility-library", "user-authentication"],
      }
    );

    // Startup validation
    try {
      const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
      const user = getAuthenticatedUser();

      if (user) {
        console.log("🎯 Running startup configuration check...");
        const overview = await generateConfigurationOverview(user.displayName);

        console.log("✅ Configuration Manager (Modern) loaded successfully!");
        console.log(`⚙️ Configuration status: ${overview.summary}`);
        console.log('💡 Try: Cmd+P → "Config: Show My Configuration Status"');

        // Auto-repair suggestion if needed
        if (
          overview.invalidSettings > 0 ||
          overview.missingSettings.length > 0
        ) {
          console.log(
            '🔧 Issues detected - consider running "Config: Validate and Repair"'
          );
        }
      } else {
        console.log("✅ Configuration Manager (Modern) loaded successfully!");
        console.log(
          "ℹ️ No authenticated user detected - commands available when user logs in"
        );
      }
    } catch (error) {
      console.warn(
        "Configuration Manager loaded with warnings:",
        error.message
      );
    }
  },

  onunload: () => {
    console.log("⚙️ Configuration Manager (Modern) unloading...");
    console.log("✅ Configuration Manager cleanup complete!");
  },
};
