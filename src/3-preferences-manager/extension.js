// ===================================================================
// Extension 3: Configuration Manager - Professional Settings Interface
// Leverages Extension 1.5 (Utilities) + Extension 2 (Authentication)
// Focus: Configuration UI, validation, workflows, and management interface
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
      if (value.length > 12) return "Maximum 12 shortcuts recommended";
      if (value.some((v) => typeof v !== "string" || v.trim() === ""))
        return "All shortcuts must be non-empty page names";
      return true;
    },
  },
};

// ===================================================================
// 🔧 CONFIGURATION VALIDATION ENGINE
// ===================================================================

/**
 * Validate a configuration value against its schema
 */
const validateConfigurationValue = (key, value) => {
  const schema = CONFIGURATION_SCHEMAS[key];
  if (!schema) {
    return { valid: false, error: `Unknown configuration key: ${key}` };
  }

  try {
    const validationResult = schema.validation(value);
    if (validationResult === true) {
      return { valid: true };
    } else {
      return { valid: false, error: validationResult };
    }
  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
};

/**
 * Get default value for a configuration key
 */
const getConfigurationDefault = (key) => {
  const schema = CONFIGURATION_SCHEMAS[key];
  return schema ? schema.default : null;
};

/**
 * Get configuration schema for a key
 */
const getConfigurationSchema = (key) => {
  return CONFIGURATION_SCHEMAS[key] || null;
};

/**
 * Validate entire configuration object
 */
const validateConfiguration = (configuration) => {
  const results = {};
  const errors = [];

  Object.entries(configuration).forEach(([key, value]) => {
    const validation = validateConfigurationValue(key, value);
    results[key] = validation;
    if (!validation.valid) {
      errors.push(`${key}: ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    results,
    errors,
    summary: `${Object.keys(results).length - errors.length}/${
      Object.keys(results).length
    } valid`,
  };
};

// ===================================================================
// 🎯 CONFIGURATION WORKFLOWS - High-Level Management
// ===================================================================

/**
 * Initialize user configuration with validated defaults
 */
const initializeUserConfiguration = async (username) => {
  try {
    console.log(`🎯 Initializing validated configuration for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const setUserPreference = platform.getUtility("setUserPreference");

    let successCount = 0;
    const errors = [];

    for (const [key, schema] of Object.entries(CONFIGURATION_SCHEMAS)) {
      try {
        const success = await setUserPreference(username, key, schema.default);
        if (success) {
          successCount++;
          console.log(`✅ ${key}: ${schema.default}`);
        } else {
          errors.push(`Failed to set ${key}`);
        }
      } catch (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }

    const total = Object.keys(CONFIGURATION_SCHEMAS).length;
    console.log(
      `📊 Configuration initialized: ${successCount}/${total} settings`
    );

    if (errors.length > 0) {
      console.warn("❌ Configuration errors:", errors);
    }

    return {
      success: successCount === total,
      successCount,
      total,
      errors,
    };
  } catch (error) {
    console.error(`Failed to initialize configuration for ${username}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate and repair user configuration
 */
const validateAndRepairConfiguration = async (username) => {
  try {
    console.log(`🔧 Validating configuration for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const getAllUserPreferences = platform.getUtility("getAllUserPreferences");
    const setUserPreference = platform.getUtility("setUserPreference");

    // Get current configuration
    const currentConfig = await getAllUserPreferences(username);

    // Validate against schemas
    const validation = validateConfiguration(currentConfig);

    console.log(`📊 Validation results: ${validation.summary}`);

    // Repair invalid values
    let repairCount = 0;
    for (const [key, result] of Object.entries(validation.results)) {
      if (!result.valid) {
        const defaultValue = getConfigurationDefault(key);
        if (defaultValue !== null) {
          try {
            await setUserPreference(username, key, defaultValue);
            console.log(
              `🔧 Repaired ${key}: ${currentConfig[key]} → ${defaultValue}`
            );
            repairCount++;
          } catch (error) {
            console.warn(`Failed to repair ${key}:`, error.message);
          }
        }
      }
    }

    // Check for missing configurations
    let addedCount = 0;
    for (const key of Object.keys(CONFIGURATION_SCHEMAS)) {
      if (!(key in currentConfig)) {
        const defaultValue = getConfigurationDefault(key);
        try {
          await setUserPreference(username, key, defaultValue);
          console.log(`➕ Added missing ${key}: ${defaultValue}`);
          addedCount++;
        } catch (error) {
          console.warn(`Failed to add missing ${key}:`, error.message);
        }
      }
    }

    return {
      validation,
      repairCount,
      addedCount,
      success: validation.errors.length === 0,
    };
  } catch (error) {
    console.error(`Failed to validate configuration for ${username}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Export user configuration to copyable format
 */
const exportUserConfiguration = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getAllUserPreferences = platform.getUtility("getAllUserPreferences");

    const config = await getAllUserPreferences(username);
    const validation = validateConfiguration(config);

    const exportData = {
      username,
      exportedAt: new Date().toISOString(),
      version: "3.0.0",
      configuration: config,
      validation: validation.summary,
      schemas: CONFIGURATION_SCHEMAS,
    };

    const exportString = JSON.stringify(exportData, null, 2);

    console.group(`📤 Configuration Export for ${username}`);
    console.log("Validation:", validation.summary);
    console.log("Export data:");
    console.log(exportString);
    console.groupEnd();

    // Copy to clipboard if available
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(exportString);
        console.log("📋 Configuration copied to clipboard!");
      } catch (error) {
        console.log("📋 Clipboard copy failed, use console output");
      }
    }

    return exportData;
  } catch (error) {
    console.error(`Failed to export configuration for ${username}:`, error);
    throw error;
  }
};

/**
 * Import and apply configuration from export data
 */
const importUserConfiguration = async (username, importData) => {
  try {
    console.log(`📥 Importing configuration for ${username}...`);

    const platform = window.RoamExtensionSuite;
    const setUserPreference = platform.getUtility("setUserPreference");

    // Validate import data structure
    if (!importData.configuration) {
      throw new Error("Invalid import data: missing configuration");
    }

    // Validate configuration values
    const validation = validateConfiguration(importData.configuration);

    if (!validation.valid) {
      console.warn("⚠️ Import validation warnings:", validation.errors);
    }

    // Apply configuration
    let successCount = 0;
    const errors = [];

    for (const [key, value] of Object.entries(importData.configuration)) {
      // Only import known configuration keys
      if (CONFIGURATION_SCHEMAS[key]) {
        try {
          const success = await setUserPreference(username, key, value);
          if (success) {
            successCount++;
            console.log(`✅ Imported ${key}: ${value}`);
          } else {
            errors.push(`Failed to import ${key}`);
          }
        } catch (error) {
          errors.push(`${key}: ${error.message}`);
        }
      } else {
        console.warn(`⚠️ Skipping unknown configuration key: ${key}`);
      }
    }

    const total = Object.keys(importData.configuration).length;
    console.log(`📊 Import completed: ${successCount}/${total} settings`);

    return {
      success: errors.length === 0,
      successCount,
      total,
      errors,
      validation,
    };
  } catch (error) {
    console.error(`Failed to import configuration for ${username}:`, error);
    throw error;
  }
};

// ===================================================================
// 🎨 CONFIGURATION UI HELPERS - Professional Interface Support
// ===================================================================

/**
 * Generate configuration overview for display
 */
const generateConfigurationOverview = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getAllUserPreferences = platform.getUtility("getAllUserPreferences");

    const config = await getAllUserPreferences(username);
    const validation = validateConfiguration(config);

    const overview = {
      username,
      totalSettings: Object.keys(CONFIGURATION_SCHEMAS).length,
      configuredSettings: Object.keys(config).length,
      validSettings: Object.keys(validation.results).filter(
        (k) => validation.results[k].valid
      ).length,
      invalidSettings: validation.errors.length,
      missingSettings: Object.keys(CONFIGURATION_SCHEMAS).filter(
        (k) => !(k in config)
      ),
      summary: validation.summary,
      details: Object.entries(CONFIGURATION_SCHEMAS).map(([key, schema]) => ({
        key,
        description: schema.description,
        type: schema.type,
        currentValue: config[key],
        defaultValue: schema.default,
        isValid: validation.results[key]?.valid ?? false,
        isConfigured: key in config,
        error: validation.results[key]?.error,
      })),
    };

    return overview;
  } catch (error) {
    console.error(
      `Failed to generate configuration overview for ${username}:`,
      error
    );
    throw error;
  }
};

/**
 * Display configuration in console with professional formatting
 */
const displayConfigurationStatus = async (username) => {
  try {
    const overview = await generateConfigurationOverview(username);

    console.group(`⚙️ Configuration Status: ${username}`);
    console.log(`📊 Summary: ${overview.summary}`);
    console.log(
      `✅ Valid: ${overview.validSettings}/${overview.totalSettings}`
    );

    if (overview.invalidSettings > 0) {
      console.log(`❌ Invalid: ${overview.invalidSettings}`);
    }

    if (overview.missingSettings.length > 0) {
      console.log(`➖ Missing: ${overview.missingSettings.join(", ")}`);
    }

    console.group("📋 Configuration Details");
    overview.details.forEach((detail) => {
      const status = detail.isValid ? "✅" : detail.isConfigured ? "❌" : "➖";
      const value =
        detail.currentValue !== undefined ? detail.currentValue : "Not set";
      console.log(`${status} ${detail.key}: ${value}`);

      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });
    console.groupEnd();

    console.groupEnd();

    return overview;
  } catch (error) {
    console.error(
      `Failed to display configuration status for ${username}:`,
      error
    );
    throw error;
  }
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Compact Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("⚙️ Configuration Manager starting...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    if (!window.RoamExtensionSuite.has("user-authentication")) {
      console.error(
        "❌ User Authentication not found! Please load Extension 2 first."
      );
      return;
    }

    // 🎯 REGISTER CONFIGURATION SERVICES
    const platform = window.RoamExtensionSuite;

    const configurationServices = {
      // Validation services
      validateConfigurationValue: validateConfigurationValue,
      validateConfiguration: validateConfiguration,
      getConfigurationDefault: getConfigurationDefault,
      getConfigurationSchema: getConfigurationSchema,

      // Workflow services
      initializeUserConfiguration: initializeUserConfiguration,
      validateAndRepairConfiguration: validateAndRepairConfiguration,
      exportUserConfiguration: exportUserConfiguration,
      importUserConfiguration: importUserConfiguration,

      // UI services
      generateConfigurationOverview: generateConfigurationOverview,
      displayConfigurationStatus: displayConfigurationStatus,

      // Schema access
      getConfigurationSchemas: () => CONFIGURATION_SCHEMAS,
    };

    Object.entries(configurationServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 📝 REGISTER PROFESSIONAL COMMANDS
    const commands = [
      {
        label: "Config: Show My Configuration Status",
        callback: async () => {
          const getAuthenticatedUser = platform.getUtility(
            "getAuthenticatedUser"
          );
          const user = getAuthenticatedUser();
          if (user) {
            await displayConfigurationStatus(user.displayName);
          }
        },
      },
      {
        label: "Config: Validate and Repair My Configuration",
        callback: async () => {
          const getAuthenticatedUser = platform.getUtility(
            "getAuthenticatedUser"
          );
          const user = getAuthenticatedUser();
          if (user) {
            const result = await validateAndRepairConfiguration(
              user.displayName
            );
            console.log(
              `🔧 Repair completed: ${result.repairCount} fixed, ${result.addedCount} added`
            );
          }
        },
      },
      {
        label: "Config: Export My Configuration",
        callback: async () => {
          const getAuthenticatedUser = platform.getUtility(
            "getAuthenticatedUser"
          );
          const user = getAuthenticatedUser();
          if (user) {
            await exportUserConfiguration(user.displayName);
          }
        },
      },
      {
        label: "Config: Initialize Default Configuration",
        callback: async () => {
          const getAuthenticatedUser = platform.getUtility(
            "getAuthenticatedUser"
          );
          const user = getAuthenticatedUser();
          if (user) {
            const result = await initializeUserConfiguration(user.displayName);
            console.log(
              `🎯 Initialization: ${result.successCount}/${result.total} settings configured`
            );
          }
        },
      },
      {
        label: "Config: Show Configuration Schemas",
        callback: () => {
          console.group("📋 Available Configuration Schemas");
          Object.entries(CONFIGURATION_SCHEMAS).forEach(([key, schema]) => {
            console.log(`${key}:`);
            console.log(`  Type: ${schema.type}`);
            console.log(`  Default: ${schema.default}`);
            console.log(`  Description: ${schema.description}`);
            if (schema.options) {
              console.log(`  Options: ${schema.options.join(", ")}`);
            }
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

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "configuration-manager",
      {
        schemas: CONFIGURATION_SCHEMAS,
        services: configurationServices,
        version: "3.0.0",
      },
      {
        name: "Configuration Manager",
        description:
          "Professional configuration interface with validation, workflows, and management",
        version: "3.0.0",
        dependencies: ["foundation-registry", "user-authentication"],
      }
    );

    // 🎉 STARTUP VALIDATION
    try {
      const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");
      const user = getAuthenticatedUser();

      if (user) {
        // Quick validation check
        const overview = await generateConfigurationOverview(user.displayName);

        console.log("✅ Configuration Manager loaded successfully!");
        console.log(`⚙️ Configuration status: ${overview.summary}`);
        console.log('💡 Try: Cmd+P → "Config: Show My Configuration Status"');

        // Auto-repair if needed
        if (
          overview.invalidSettings > 0 ||
          overview.missingSettings.length > 0
        ) {
          console.log(
            '🔧 Issues detected - consider running "Config: Validate and Repair"'
          );
        }
      }
    } catch (error) {
      console.warn(
        "Configuration Manager loaded with warnings:",
        error.message
      );
    }
  },

  onunload: () => {
    console.log("⚙️ Configuration Manager unloading...");
    console.log("✅ Configuration Manager cleanup complete!");
  },
};
