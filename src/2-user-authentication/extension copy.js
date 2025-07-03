// ===================================================================
// Extension 2.0: User Authentication + User Preferences + Profile System
// Complete clean implementation - depends only on Extension 1.5
// Features: User authentication + user preferences + profile initialization
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
  const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

  const pageTitle = `${username}/user preferences`;

  // Check if page already exists
  let pageUid = getPageUidByTitle(pageTitle);

  if (!pageUid) {
    // Create the page using direct Roam API
    try {
      pageUid = await window.roamAlphaAPI.data.page.create({
        page: { title: pageTitle },
      });
      console.log(`📄 Created user preferences page: ${pageTitle}`);
    } catch (error) {
      console.error(
        `Failed to create preferences page for ${username}:`,
        error
      );
      return null;
    }
  } else {
    console.log(`📄 User preferences page already exists: ${pageTitle}`);
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
    const getDirectChildren = platform.getUtility("getDirectChildren");

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return false;

    // Get existing children to check if preference already exists
    const children = getDirectChildren(pageUid);
    const keyText = useAttributeFormat ? `${key}::` : `**${key}:**`;

    let preferenceBlock = children.find(
      (child) => child.text.includes(key) || child.text.startsWith(keyText)
    );

    if (!preferenceBlock) {
      // Create preference block
      try {
        const blockUid = await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": pageUid, order: "last" },
          block: { string: keyText },
        });

        // Create value block under preference
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": blockUid, order: "last" },
          block: {
            string: Array.isArray(value) ? value.join(", ") : String(value),
          },
        });

        console.log(`✅ Set preference "${key}" for ${username}: ${value}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to create preference "${key}":`, error);
        return false;
      }
    } else {
      // Update existing preference
      try {
        const prefChildren = getDirectChildren(preferenceBlock.uid);
        const valueText = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        if (prefChildren.length > 0) {
          // Update first child with new value
          await window.roamAlphaAPI.data.block.update({
            block: { uid: prefChildren[0].uid, string: valueText },
          });
        } else {
          // Create value block
          await window.roamAlphaAPI.data.block.create({
            location: { "parent-uid": preferenceBlock.uid, order: "last" },
            block: { string: valueText },
          });
        }

        console.log(`✅ Updated preference "${key}" for ${username}: ${value}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update preference "${key}":`, error);
        return false;
      }
    }
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
// 👤 2.0 USER PROFILE SYSTEM - New Profile Initialization
// ===================================================================

/**
 * 👤 2.1 Initialize user profile structure using Subjournals pattern
 * Creates the complete "My Info::" structure with bulletproof retry logic
 * @param {string} username - Username to initialize profile for
 * @returns {boolean} - Success status
 */
const initializeUserProfile = async (username) => {
  const startTime = Date.now();
  const TIMEOUT = 5000; // 5 second timeout
  const workingOn = { step: null, uid: null, content: null };
  let loopCount = 0;

  console.log(`🎯 Initializing user profile structure for ${username}...`);

  while (Date.now() - startTime < TIMEOUT) {
    loopCount++;

    try {
      // STEP 1: Ensure user page exists
      let userPageUid = await getOrCreatePageUid(username);
      if (!userPageUid) {
        if (workingOn.step !== "page") {
          workingOn.step = "page";
          workingOn.uid = null;
          workingOn.content = username;
          console.log(`➕ Creating user page: ${username}`);
          userPageUid = await window.roamAlphaAPI.data.page.create({
            page: { title: username },
          });
        }
        continue; // Retry
      }

      // STEP 2: Ensure "My Info::" block exists
      const myInfoBlock = await findOrCreateBlock(userPageUid, "My Info::");
      if (!myInfoBlock) {
        if (workingOn.step !== "myinfo" || workingOn.uid !== userPageUid) {
          workingOn.step = "myinfo";
          workingOn.uid = userPageUid;
          workingOn.content = "My Info::";
          await createBlockSimple(userPageUid, "My Info::");
        }
        continue; // Retry
      }

      // STEP 3: Create profile fields
      const profileFields = [
        { name: "Avatar::", defaultValue: "__not yet entered__" },
        { name: "Location::", defaultValue: "__not yet entered__" },
        { name: "Role::", defaultValue: "__not yet entered__" },
        { name: "Timezone::", defaultValue: "__not yet entered__" },
        { name: "About Me::", defaultValue: "__not yet entered__" },
      ];

      let allFieldsCreated = true;
      let createdCount = 0;
      let skippedCount = 0;

      for (const field of profileFields) {
        const fieldBlock = await findOrCreateBlock(myInfoBlock.uid, field.name);

        if (!fieldBlock) {
          if (
            workingOn.step !== `field-${field.name}` ||
            workingOn.uid !== myInfoBlock.uid
          ) {
            workingOn.step = `field-${field.name}`;
            workingOn.uid = myInfoBlock.uid;
            workingOn.content = field.name;
            await createBlockSimple(myInfoBlock.uid, field.name);
          }
          allFieldsCreated = false;
          break; // Exit field loop, retry main loop
        }

        // Check if field has content
        const hasContent = await blockHasChildren(fieldBlock.uid);
        if (!hasContent) {
          if (
            workingOn.step !== `value-${field.name}` ||
            workingOn.uid !== fieldBlock.uid
          ) {
            workingOn.step = `value-${field.name}`;
            workingOn.uid = fieldBlock.uid;
            workingOn.content = field.defaultValue;
            await createBlockSimple(fieldBlock.uid, field.defaultValue);
          }
          allFieldsCreated = false;
          break; // Exit field loop, retry main loop
        } else {
          skippedCount++;
        }
      }

      if (!allFieldsCreated) {
        continue; // Retry main loop
      }

      // SUCCESS - all fields exist with content
      createdCount = profileFields.length - skippedCount;
      console.log(`✅ Profile initialization complete for ${username}:`);
      console.log(`   - ${createdCount} fields created with defaults`);
      console.log(`   - ${skippedCount} fields already had content`);
      console.log(
        `   - Total loops: ${loopCount}, Time: ${Date.now() - startTime}ms`
      );

      return true;
    } catch (error) {
      console.error(`❌ Loop ${loopCount} error:`, error.message);
    }
  }

  throw new Error(
    `Profile initialization timeout after ${TIMEOUT}ms (${loopCount} loops)`
  );
};

// ===================================================================
// 🔧 SUPPORTING FUNCTIONS - Subjournals Pattern
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

    // Create the page
    pageUid = window.roamAlphaAPI.util.generateUID();
    await window.roamAlphaAPI.data.page.create({
      page: { title, uid: pageUid },
    });
    return pageUid;
  } catch (error) {
    console.error(`getOrCreatePageUid failed for "${title}":`, error);
    return null;
  }
};

/**
 * Find or create block using Subjournals pattern
 */
const findOrCreateBlock = async (parentUid, blockText) => {
  try {
    // Search for existing block
    const existing = window.roamAlphaAPI.q(`
      [:find (pull ?child [:block/uid :block/string])
       :where 
       [?parent :block/uid "${parentUid}"] [?child :block/parents ?parent]
       [?child :block/string ?string] [(clojure.string/starts-with? ?string "${blockText}")]]
    `);

    if (existing.length > 0) {
      const found = existing[0][0];
      return {
        uid: found[":block/uid"] || found.uid,
        string: found[":block/string"] || found.string,
      };
    }

    // Block doesn't exist, caller should create it
    return null;
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

/**
 * 👤 2.2 Check if user profile is complete
 * Verifies that all required profile fields exist and are filled
 * @param {string} username - Username to check
 * @returns {Object} - Profile completeness info
 */
const checkUserProfileCompleteness = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findNestedDataValuesExact = platform.getUtility(
      "findNestedDataValuesExact"
    );
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      return {
        exists: false,
        hasMyInfo: false,
        completeness: 0,
        missingFields: ["User page does not exist"],
      };
    }

    const myInfoData = findNestedDataValuesExact(userPageUid, "My Info");
    if (!myInfoData || Object.keys(myInfoData).length === 0) {
      return {
        exists: true,
        hasMyInfo: false,
        completeness: 0,
        missingFields: ["My Info:: block missing"],
      };
    }

    const requiredFields = [
      "avatar",
      "location",
      "role",
      "timezone",
      "aboutMe",
    ];
    const missingFields = [];
    const incompleteFields = [];

    for (const field of requiredFields) {
      const value = myInfoData[field];
      if (!value || value === "__missing field__") {
        missingFields.push(field);
      } else if (value === "__not yet entered__") {
        incompleteFields.push(field);
      }
    }

    const completedFields =
      requiredFields.length - missingFields.length - incompleteFields.length;
    const completeness = Math.round(
      (completedFields / requiredFields.length) * 100
    );

    return {
      exists: true,
      hasMyInfo: true,
      completeness,
      totalFields: requiredFields.length,
      completedFields,
      missingFields,
      incompleteFields,
      needsInitialization: missingFields.length > 0,
    };
  } catch (error) {
    console.error(
      `❌ Error checking profile completeness for ${username}:`,
      error
    );
    return {
      exists: false,
      hasMyInfo: false,
      completeness: 0,
      missingFields: [`Error: ${error.message}`],
    };
  }
};

/**
 * 👤 2.3 Auto-initialize profile for current user
 * Convenience function to initialize profile for the currently authenticated user
 * @returns {boolean} - Success status
 */
const initializeCurrentUserProfile = async () => {
  const currentUser = getCurrentUsername();

  if (!currentUser) {
    console.error("❌ No current user found for profile initialization");
    return false;
  }

  console.log(`🎯 Auto-initializing profile for current user: ${currentUser}`);

  // First check completeness
  const completeness = await checkUserProfileCompleteness(currentUser);
  console.log(`📊 Current profile status:`, completeness);

  if (completeness.needsInitialization) {
    console.log(`🔧 Profile needs initialization, proceeding...`);
    return await initializeUserProfile(currentUser);
  } else {
    console.log(`✅ Profile already complete (${completeness.completeness}%)`);
    return true;
  }
};

// ===================================================================
// 🔍 3.0 USER AUTHENTICATION - Simple Current User Detection
// ===================================================================

/**
 * 🔍 3.1 Get current authenticated user
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
 * 🔍 3.2 Check if user is authenticated (not a fallback user)
 * Determines if the current user is properly authenticated
 * @returns {boolean} - True if user is authenticated
 */
const isUserAuthenticated = () => {
  const user = getAuthenticatedUser();
  return user && user.method !== "fallback" && user.method !== "error";
};

/**
 * 🔍 3.3 Get current user's display name
 * Convenience function to get just the display name
 * @returns {string|null} - Display name or null
 */
const getCurrentUsername = () => {
  const user = getAuthenticatedUser();
  return user ? user.displayName : null;
};

// ===================================================================
// 🧪 4.0 TESTING AND VALIDATION FUNCTIONS
// ===================================================================

/**
 * 🧪 4.1 Test user preferences functionality
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
 * 🧪 4.2 Test user profile functionality
 * Comprehensive test of profile initialization and checking
 * @param {string} username - Optional username to test (defaults to current user)
 */
const testUserProfile = async (username = null) => {
  console.group("🧪 TESTING: User Profile System");

  try {
    const currentUser = username || getCurrentUsername();

    if (!currentUser) {
      console.error("❌ No user specified and cannot get current user");
      return;
    }

    console.log(`🎯 Testing profile for: ${currentUser}`);

    // Test 1: Check current profile completeness
    console.log("\n1️⃣ Testing checkUserProfileCompleteness...");
    const completeness = await checkUserProfileCompleteness(currentUser);
    console.log(`✅ Profile completeness:`, completeness);

    // Test 2: Initialize profile if needed
    console.log("\n2️⃣ Testing initializeUserProfile...");
    const initialized = await initializeUserProfile(currentUser);
    console.log(`✅ Profile initialization result: ${initialized}`);

    // Test 3: Check completeness again
    console.log("\n3️⃣ Re-checking profile completeness...");
    const newCompleteness = await checkUserProfileCompleteness(currentUser);
    console.log(`✅ Updated profile completeness:`, newCompleteness);

    // Test 4: Test auto-initialization
    console.log("\n4️⃣ Testing initializeCurrentUserProfile...");
    const autoInitialized = await initializeCurrentUserProfile();
    console.log(`✅ Auto-initialization result: ${autoInitialized}`);

    console.log("\n🎉 User profile tests completed!");
  } catch (error) {
    console.error("❌ User profile test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 4.3 Test authentication functionality
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
 * 🧪 4.4 Test preference page creation
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
 * 🧪 4.5 Run all system tests
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

  // Test 4: Profile functionality
  console.log("\n=== TEST 4: PROFILE FUNCTIONALITY ===");
  if (user) {
    await testUserProfile(user.displayName);
  }

  console.log("\n✅ All Extension 2.0 tests completed!");
  console.log("💡 Check console output above for detailed results");

  console.groupEnd();
};

// ===================================================================
// 🔧 5.0 UTILITY HELPER FUNCTIONS
// ===================================================================

/**
 * 🔧 5.1 Get user preference with fallback chain
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
 * 🔧 5.2 Bulk set user preferences
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
 * 🔧 5.3 Export user preferences
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

/**
 * 🔧 5.4 Complete user setup (preferences + profile)
 * Initializes both preferences and profile for a user
 * @param {string} username - Username to set up
 * @returns {Object} - Setup results
 */
const completeUserSetup = async (username) => {
  try {
    console.log(`🎯 Running complete user setup for: ${username}`);

    const results = {
      username,
      preferencesInitialized: false,
      profileInitialized: false,
      success: false,
    };

    // Initialize preferences
    console.log("📋 Initializing user preferences...");
    results.preferencesInitialized = await initializeUserPreferences(username);

    // Initialize profile
    console.log("👤 Initializing user profile...");
    results.profileInitialized = await initializeUserProfile(username);

    results.success =
      results.preferencesInitialized && results.profileInitialized;

    console.log(`✅ Complete user setup for ${username}:`, results);
    return results;
  } catch (error) {
    console.error(`❌ Complete user setup failed for ${username}:`, error);
    return {
      username,
      preferencesInitialized: false,
      profileInitialized: false,
      success: false,
      error: error.message,
    };
  }
};

// ===================================================================
// 🚀 6.0 ROAM EXTENSION EXPORT - Complete Registration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log(
      "👥 Extension 2.0: User Authentication + Preferences + Profile starting..."
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

    // 👤 Register user profile utilities
    const userProfileUtilities = {
      initializeUserProfile,
      checkUserProfileCompleteness,
      initializeCurrentUserProfile,
      completeUserSetup,
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
      testUserProfile,
      testAuthentication,
      testPreferencePageCreation,
      runAllTests,
    };

    // Register all utilities with the platform
    Object.entries({
      ...userPreferencesUtilities,
      ...userProfileUtilities,
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
        userProfile: userProfileUtilities,
        authentication: authenticationUtilities,
        testing: testingUtilities,
        version: "2.0.0",
      },
      {
        name: "Extension 2.0: User Authentication + Preferences + Profile",
        description:
          "Complete user authentication, preferences management, and profile initialization system",
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
        label: "Auth: Test User Profile",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            await testUserProfile(currentUser);
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
        label: "Auth: Initialize My Preferences",
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
        label: "Auth: Initialize My Profile",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            const success = await initializeUserProfile(currentUser);
            console.log(
              `🎯 Profile initialization: ${success ? "successful" : "failed"}`
            );
            if (success) {
              console.log(
                "💡 Check your user page - profile structure created with defaults"
              );
            }
          } else {
            console.error("❌ No current user found");
          }
        },
      },
      {
        label: "Auth: Complete User Setup (Preferences + Profile)",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            const results = await completeUserSetup(currentUser);
            console.log(`🎯 Complete setup results:`, results);
            if (results.success) {
              console.log(
                "🎉 Complete user setup successful! Check your user page and preferences page."
              );
            }
          } else {
            console.error("❌ No current user found");
          }
        },
      },
      {
        label: "Auth: Check My Profile Completeness",
        callback: async () => {
          const currentUser = getCurrentUsername();
          if (currentUser) {
            const completeness = await checkUserProfileCompleteness(
              currentUser
            );
            console.log(
              `📊 Profile completeness for ${currentUser}:`,
              completeness
            );
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
    console.log(
      "✅ Extension 2.0: User Authentication + Preferences + Profile loaded!"
    );
    console.log(
      "🦊 Features: User preferences + authentication + profile initialization"
    );
    console.log("🧹 Dependencies: Extension 1.5 utilities only");
    console.log(
      `👤 Current user: ${currentUser?.displayName || "Not detected"}`
    );
    console.log(
      `🔐 Authentication status: ${
        isUserAuthenticated() ? "Authenticated" : "Fallback/Guest"
      }`
    );
    console.log(
      '💡 Try: Cmd+P → "Auth: Complete User Setup (Preferences + Profile)"'
    );

    // Auto-setup current user on startup if detected
    if (currentUser) {
      console.log("🔍 Auto-running setup for current user...");
      setTimeout(async () => {
        testAuthentication();

        // Auto-initialize profile if needed
        const completeness = await checkUserProfileCompleteness(
          currentUser.displayName
        );
        if (completeness.needsInitialization) {
          console.log("🔧 Auto-initializing profile for current user...");
          await initializeCurrentUserProfile();
        }
      }, 1000);
    }
  },

  onunload: () => {
    console.log(
      "👥 Extension 2.0: User Authentication + Preferences + Profile unloading..."
    );

    // Any cleanup would be handled by the extension registry

    console.log(
      "✅ Extension 2.0: User Authentication + Preferences + Profile cleanup complete!"
    );
  },
};
