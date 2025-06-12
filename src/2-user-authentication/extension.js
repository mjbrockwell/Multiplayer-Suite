// ===================================================================
// Extension 2.0: User Authentication + User Preferences System
// Complete clean implementation - depends only on Extension 1.5
// Features: User authentication + user preferences management
// ===================================================================

// ===================================================================
// 🦊 1.0 USER PREFERENCES SYSTEM - Complete Implementation
// ===================================================================

/**
 * 🦊 1.1 Get user preferences page UID with auto-creation
 * Creates the user's preference page if it doesn't exist
 * @param {string} username - Username for the preferences page
 * @returns {string|null} - UID of the preferences page or null if failed
 */
const getUserPreferencesPageUid = async (username) => {
  const platform = window.RoamExtensionSuite;
  const cascadeToBlock = platform.getUtility("cascadeToBlock");

  const pageTitle = `${username}/user preferences`;

  // Use bulletproof cascading to create page if it doesn't exist
  const pageUid = await cascadeToBlock(pageTitle, [], true);

  if (pageUid) {
    console.log(`📄 User preferences page ready: ${pageTitle}`);
  } else {
    console.error(`Failed to create preferences page for ${username}`);
  }

  return pageUid;
};

/**
 * 🦊 1.2 Get user preference with intelligent defaults
 * Retrieves a specific preference value for a user
 * @param {string} username - Username to get preference for
 * @param {string} key - Preference key to retrieve
 * @param {any} defaultValue - Default value if preference not found
 * @returns {any} - Preference value or default
 */
const getUserPreference = async (username, key, defaultValue = null) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findDataValueExact = platform.getUtility("findDataValueExact");

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return defaultValue;

    const value = findDataValueExact(pageUid, key);
    const result = value !== null ? value : defaultValue;

    console.log(`⚙️ Preference "${key}" for ${username}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Failed to get preference "${key}" for ${username}:`, error);
    return defaultValue;
  }
};

/**
 * 🦊 1.3 Set user preference with proper structure
 * Sets a preference value for a user
 * @param {string} username - Username to set preference for
 * @param {string} key - Preference key to set
 * @param {any} value - Value to set
 * @param {boolean} useAttributeFormat - Whether to use Roam attribute format
 * @returns {boolean} - Success status
 */
const setUserPreference = async (
  username,
  key,
  value,
  useAttributeFormat = false
) => {
  try {
    const platform = window.RoamExtensionSuite;
    const setDataValueStructured = platform.getUtility(
      "setDataValueStructured"
    );

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return false;

    const success = await setDataValueStructured(
      pageUid,
      key,
      value,
      useAttributeFormat
    );

    if (success) {
      console.log(`✅ Set preference "${key}" for ${username}: ${value}`);
    } else {
      console.error(`❌ Failed to set preference "${key}" for ${username}`);
    }

    return success;
  } catch (error) {
    console.error(`Error setting preference "${key}" for ${username}:`, error);
    return false;
  }
};

/**
 * 🦊 1.4 Get all user preferences as object
 * Retrieves all preferences for a user as a key-value object
 * @param {string} username - Username to get preferences for
 * @returns {Object} - Object containing all preferences
 */
const getAllUserPreferences = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findDataValueExact = platform.getUtility("findDataValueExact");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const pageTitle = `${username}/user preferences`;
    const pageUid = getPageUidByTitle(pageTitle);

    if (!pageUid) {
      console.log(`📄 No preferences page found for ${username}`);
      return {};
    }

    // Common preference keys to check
    const preferenceKeys = [
      "Loading Page Preference",
      "Immutable Home Page",
      "Weekly Bundle",
      "Journal Header Color",
      "Personal Shortcuts",
    ];

    const preferences = {};

    // Collect preference values
    for (const key of preferenceKeys) {
      const value = findDataValueExact(pageUid, key);
      if (value !== null) {
        preferences[key] = value;
      }
    }

    console.log(
      `📊 Loaded ${Object.keys(preferences).length} preferences for ${username}`
    );
    return preferences;
  } catch (error) {
    console.error(`Failed to get all preferences for ${username}:`, error);
    return {};
  }
};

/**
 * 🦊 1.5 Initialize default preferences for new users
 * Sets up default preference values for a new user
 * @param {string} username - Username to initialize preferences for
 * @returns {boolean} - Success status
 */
const initializeUserPreferences = async (username) => {
  try {
    console.log(`🎯 Initializing default preferences for ${username}...`);

    // Default preference values
    const defaults = {
      "Loading Page Preference": "Daily Page",
      "Immutable Home Page": "yes",
      "Weekly Bundle": "no",
      "Journal Header Color": "blue",
      "Personal Shortcuts": ["Daily Notes", "Chat Room"],
    };

    let successCount = 0;

    // Set each default preference
    for (const [key, value] of Object.entries(defaults)) {
      const success = await setUserPreference(username, key, value);
      if (success) successCount++;
    }

    console.log(
      `✅ Initialized ${successCount}/${
        Object.keys(defaults).length
      } default preferences`
    );
    return successCount === Object.keys(defaults).length;
  } catch (error) {
    console.error(`Failed to initialize preferences for ${username}:`, error);
    return false;
  }
};

// ===================================================================
// 🔍 2.0 USER AUTHENTICATION - Simple Current User Detection
// ===================================================================

/**
 * 🔍 2.1 Get current authenticated user
 * Returns the current user detected by Extension 1.5
 * @returns {Object|null} - User object or null if not detected
 */
const getAuthenticatedUser = () => {
  const platform = window.RoamExtensionSuite;
  const getCurrentUser = platform.getUtility("getCurrentUser");

  const user = getCurrentUser();
  if (user && user.method !== "error") {
    return user;
  }

  console.warn("Could not detect authenticated user");
  return null;
};

/**
 * 🔍 2.2 Check if user is authenticated (not a fallback user)
 * Determines if the current user is properly authenticated
 * @returns {boolean} - True if user is authenticated
 */
const isUserAuthenticated = () => {
  const user = getAuthenticatedUser();
  return user && user.method !== "fallback" && user.method !== "error";
};

/**
 * 🔍 2.3 Get current user's display name
 * Convenience function to get just the display name
 * @returns {string|null} - Display name or null
 */
const getCurrentUsername = () => {
  const user = getAuthenticatedUser();
  return user ? user.displayName : null;
};

// ===================================================================
// 🧪 3.0 TESTING AND VALIDATION FUNCTIONS
// ===================================================================

/**
 * 🧪 3.1 Test user preferences functionality
 * Comprehensive test of all preference operations
 * @param {string} username - Optional username to test (defaults to current user)
 */
const testUserPreferences = async (username = null) => {
  console.group("🧪 TESTING: User Preferences System");

  try {
    const currentUser = username || getCurrentUsername();

    if (!currentUser) {
      console.error("❌ No user specified and cannot get current user");
      return;
    }

    console.log(`🎯 Testing preferences for: ${currentUser}`);

    // Test 1: Initialize default preferences
    console.log("\n1️⃣ Testing initializeUserPreferences...");
    const initialized = await initializeUserPreferences(currentUser);
    console.log(`✅ Initialization result: ${initialized}`);

    // Test 2: Get individual preference
    console.log("\n2️⃣ Testing getUserPreference...");
    const loadingPage = await getUserPreference(
      currentUser,
      "Loading Page Preference",
      "Daily Page"
    );
    console.log(`✅ Loading Page Preference: ${loadingPage}`);

    // Test 3: Set a preference
    console.log("\n3️⃣ Testing setUserPreference...");
    const setResult = await setUserPreference(
      currentUser,
      "Test Preference",
      "Test Value"
    );
    console.log(`✅ Set preference result: ${setResult}`);

    // Test 4: Get all preferences
    console.log("\n4️⃣ Testing getAllUserPreferences...");
    const allPrefs = await getAllUserPreferences(currentUser);
    console.log(`✅ All preferences:`, allPrefs);

    // Test 5: Cleanup test preference
    console.log("\n5️⃣ Cleaning up test preference...");
    const cleanupResult = await setUserPreference(
      currentUser,
      "Test Preference",
      ""
    );
    console.log(`✅ Cleanup result: ${cleanupResult}`);

    console.log("\n🎉 User preferences tests completed!");
  } catch (error) {
    console.error("❌ User preferences test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 3.2 Test authentication functionality
 * Tests user detection and authentication status
 */
const testAuthentication = () => {
  console.group("🧪 TESTING: User Authentication");

  const user = getAuthenticatedUser();
  const isAuth = isUserAuthenticated();
  const username = getCurrentUsername();

  console.log(`Current user: ${user?.displayName || "None"}`);
  console.log(`Detection method: ${user?.method || "None"}`);
  console.log(`Is authenticated: ${isAuth}`);
  console.log(`Username: ${username || "Not available"}`);
  console.log(`Email: ${user?.email || "Not available"}`);
  console.log(`UID: ${user?.uid || "Not available"}`);

  // Test user detection methods
  if (user) {
    console.log("\n📊 Detection details:");
    console.log(`- Method used: ${user.method}`);
    console.log(`- Reliability: ${isAuth ? "High" : "Low (fallback)"}`);
    console.log(`- Can use for preferences: ${username ? "Yes" : "No"}`);
  }

  console.groupEnd();
};

/**
 * 🧪 3.3 Test preference page creation
 * Tests the preference page creation process
 */
const testPreferencePageCreation = async () => {
  console.group("🧪 TESTING: Preference Page Creation");

  const username = getCurrentUsername();
  if (!username) {
    console.error("❌ No current user found for testing");
    console.groupEnd();
    return;
  }

  try {
    console.log(`🎯 Testing preference page creation for: ${username}`);

    const pageUid = await getUserPreferencesPageUid(username);

    if (pageUid) {
      console.log(`✅ Preference page UID: ${pageUid}`);

      // Verify page exists
      const platform = window.RoamExtensionSuite;
      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      const verifyUid = getPageUidByTitle(`${username}/user preferences`);

      console.log(`✅ Page verification: ${verifyUid ? "Found" : "Not found"}`);
      console.log(`✅ UIDs match: ${pageUid === verifyUid}`);
    } else {
      console.error("❌ Failed to create preference page");
    }
  } catch (error) {
    console.error("❌ Preference page creation test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 3.4 Run all system tests
 * Comprehensive test suite for Extension 2
 */
const runAllTests = async () => {
  console.group("🧪 Extension 2.0: Complete System Tests");

  console.log("🚀 Starting Extension 2.0 test suite...\n");

  // Test 1: Authentication
  console.log("=== TEST 1: AUTHENTICATION ===");
  testAuthentication();

  // Test 2: Preference page creation
  console.log("\n=== TEST 2: PREFERENCE PAGE CREATION ===");
  await testPreferencePageCreation();

  // Test 3: Preferences functionality
  console.log("\n=== TEST 3: PREFERENCES FUNCTIONALITY ===");
  const user = getAuthenticatedUser();
  if (user) {
    await testUserPreferences(user.displayName);
  }

  console.log("\n✅ All Extension 2.0 tests completed!");
  console.log("💡 Check console output above for detailed results");

  console.groupEnd();
};

// ===================================================================
// 🔧 4.0 UTILITY HELPER FUNCTIONS
// ===================================================================

/**
 * 🔧 4.1 Get user preference with fallback chain
 * Gets a preference with multiple fallback options
 * @param {string} username - Username
 * @param {string} key - Preference key
 * @param {Array} fallbacks - Array of fallback values to try
 * @returns {any} - First non-null value found
 */
const getUserPreferenceWithFallbacks = async (
  username,
  key,
  fallbacks = []
) => {
  const primaryValue = await getUserPreference(username, key);

  if (primaryValue !== null) {
    return primaryValue;
  }

  // Try fallbacks in order
  for (const fallback of fallbacks) {
    if (fallback !== null && fallback !== undefined) {
      console.log(`🔄 Using fallback for "${key}": ${fallback}`);
      return fallback;
    }
  }

  return null;
};

/**
 * 🔧 4.2 Bulk set user preferences
 * Sets multiple preferences at once
 * @param {string} username - Username
 * @param {Object} preferences - Object of key-value pairs
 * @returns {Object} - Results object with success count and details
 */
const bulkSetUserPreferences = async (username, preferences) => {
  const results = {
    successCount: 0,
    failureCount: 0,
    details: {},
  };

  for (const [key, value] of Object.entries(preferences)) {
    try {
      const success = await setUserPreference(username, key, value);
      results.details[key] = success ? "success" : "failed";

      if (success) {
        results.successCount++;
      } else {
        results.failureCount++;
      }
    } catch (error) {
      results.details[key] = `error: ${error.message}`;
      results.failureCount++;
    }
  }

  console.log(
    `🔧 Bulk set completed: ${results.successCount} success, ${results.failureCount} failed`
  );
  return results;
};

/**
 * 🔧 4.3 Export user preferences
 * Exports all preferences as a JSON-compatible object
 * @param {string} username - Username to export preferences for
 * @returns {Object} - Exportable preferences object
 */
const exportUserPreferences = async (username) => {
  const preferences = await getAllUserPreferences(username);

  const exportData = {
    username,
    timestamp: new Date().toISOString(),
    preferences,
    version: "2.0.0",
  };

  console.log(
    `📤 Exported ${Object.keys(preferences).length} preferences for ${username}`
  );
  return exportData;
};

// ===================================================================
// 🚀 5.0 ROAM EXTENSION EXPORT - Complete Registration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log(
      "👥 Extension 2.0: User Authentication + Preferences starting..."
    );

    // Verify Extension 1.5 is loaded
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    // Check for required dependency
    if (!platform.has("utility-library")) {
      console.error(
        "❌ utility-library not found! Please load Extension 1.5 first."
      );
      return;
    }

    console.log("✅ Extension 1.5 utilities found");

    // 🔧 Register user preferences utilities with platform
    const userPreferencesUtilities = {
      getUserPreferencesPageUid,
      getUserPreference,
      setUserPreference,
      getAllUserPreferences,
      initializeUserPreferences,
      getUserPreferenceWithFallbacks,
      bulkSetUserPreferences,
      exportUserPreferences,
    };

    // 🔍 Register authentication utilities
    const authenticationUtilities = {
      getAuthenticatedUser,
      isUserAuthenticated,
      getCurrentUsername,
    };

    // 🧪 Register testing utilities
    const testingUtilities = {
      testUserPreferences,
      testAuthentication,
      testPreferencePageCreation,
      runAllTests,
    };

    // Register all utilities with the platform
    Object.entries({
      ...userPreferencesUtilities,
      ...authenticationUtilities,
      ...testingUtilities,
    }).forEach(([name, utility]) => {
      platform.registerUtility(name, utility);
    });

    // Register self with platform
    platform.register(
      "user-authentication",
      {
        userPreferences: userPreferencesUtilities,
        authentication: authenticationUtilities,
        testing: testingUtilities,
        version: "2.0.0",
      },
      {
        name: "Extension 2.0: User Authentication + Preferences",
        description:
          "Complete user authentication and preferences management system",
        version: "2.0.0",
        dependencies: ["utility-library"],
      }
    );

    // 📝 Register command palette commands
    const commands = [
      {
        label: "Auth: Test User Preferences",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            await testUserPreferences(currentUser);
          } else {
            console.error("❌ Cannot test - no current user found");
          }
        },
      },
      {
        label: "Auth: Test Authentication",
        callback: testAuthentication,
      },
      {
        label: "Auth: Initialize Current User Preferences",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            const success = await initializeUserPreferences(currentUser);
            console.log(
              `🎯 Preference initialization: ${
                success ? "successful" : "failed"
              }`
            );
            if (success) {
              console.log(
                "💡 Check your user preferences page - defaults created"
              );
            }
          } else {
            console.error("❌ No current user found");
          }
        },
      },
      {
        label: "Auth: Export My Preferences",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            const exportData = await exportUserPreferences(currentUser);
            console.log("📤 Exported preferences:", exportData);
          } else {
            console.error("❌ No current user found");
          }
        },
      },
      {
        label: "Auth: Run All Tests",
        callback: runAllTests,
      },
    ];

    // Register commands with Roam and extension registry
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎉 Startup complete
    const currentUser = getAuthenticatedUser();
    console.log("✅ Extension 2.0: User Authentication + Preferences loaded!");
    console.log("🦊 Features: User preferences + authentication + testing");
    console.log("🧹 Dependencies: Extension 1.5 utilities only");
    console.log(
      `👤 Current user: ${currentUser?.displayName || "Not detected"}`
    );
    console.log(
      `🔐 Authentication status: ${
        isUserAuthenticated() ? "Authenticated" : "Fallback/Guest"
      }`
    );
    console.log('💡 Try: Cmd+P → "Auth: Run All Tests"');

    // Auto-test on startup if user is detected
    if (currentUser) {
      console.log("🔍 Auto-running authentication test...");
      setTimeout(() => {
        testAuthentication();
      }, 1000);
    }
  },

  onunload: () => {
    console.log(
      "👥 Extension 2.0: User Authentication + Preferences unloading..."
    );

    // Any cleanup would be handled by the extension registry

    console.log(
      "✅ Extension 2.0: User Authentication + Preferences cleanup complete!"
    );
  },
};
