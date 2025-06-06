// ===================================================================
// 1.0 🌳 EXTENSION 2: USER AUTHENTICATION - PROFESSIONAL USER MANAGEMENT
// UPDATED: Now manages [[roam/graph members]] directory as source of truth
// Rewritten to leverage Extension 1.5 Utility Library
// Focus: Authentication workflows, user sessions, and graph member directory
// ===================================================================

// ===================================================================
// 2.0 🌳 AUTHENTICATION WORKFLOW MANAGEMENT - Higher-Level Services
// ===================================================================

/**
 * 2.1 🍎 Enhanced user session management with authentication state
 */
class UserSession {
  constructor() {
    // 2.1.1 🍎 Core session state
    this.sessionId = null;
    this.user = null;
    this.authState = "unknown"; // unknown, authenticated, guest, error
    this.lastActivity = 0;
    this.sessionStartTime = 0;
  }

  // 2.1.2 🦊 Session initialization with platform integration
  async initialize() {
    try {
      // 2.1.2.1 🦊 Get utilities from platform
      const platform = window.RoamExtensionSuite;
      const getCurrentUser = platform.getUtility("getCurrentUser");
      const isMultiUserGraph = platform.getUtility("isMultiUserGraph");

      // 2.1.2.2 🦊 Detect current user
      this.user = getCurrentUser();
      this.authState =
        this.user.method === "fallback" ? "guest" : "authenticated";
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
      this.lastActivity = Date.now();

      // 2.1.2.3 🦊 Check if we're in a multi-user environment
      const isMultiUser = isMultiUserGraph();

      console.log(`🔐 User session initialized:`);
      console.log(`   User: ${this.user.displayName} (${this.user.method})`);
      console.log(`   State: ${this.authState}`);
      console.log(`   Multi-user graph: ${isMultiUser}`);
      console.log(`   Session ID: ${this.sessionId}`);

      // 2.1.2.4 🎯 INITIALIZE GRAPH MEMBERS DIRECTORY - "Safety Net"
      await this.initializeGraphMembersDirectory();

      return this;
    } catch (error) {
      console.error("Failed to initialize user session:", error);
      this.authState = "error";
      throw error;
    }
  }

  /**
   * 2.1.3 🦊 Initialize [[roam/graph members]] directory and ensure current user is listed
   * This is our "safety net" to maintain source of truth for active users
   */
  async initializeGraphMembersDirectory() {
    try {
      console.log("📋 Initializing graph members directory...");

      // 2.1.3.1 🦊 Get platform utilities
      const platform = window.RoamExtensionSuite;
      const createPageIfNotExists = platform.getUtility(
        "createPageIfNotExists"
      );
      const findDataValue = platform.getUtility("findDataValue");
      const setDataValue = platform.getUtility("setDataValue");
      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

      // 2.1.3.2 🦊 Create the graph members page if it doesn't exist
      const membersPageUid = await createPageIfNotExists("roam/graph members");
      if (!membersPageUid) {
        console.error("❌ Failed to create roam/graph members page");
        return false;
      }

      // 2.1.3.3 🦊 Check if Directory:: header exists
      let currentMembers = findDataValue(membersPageUid, "Directory");

      // 2.1.3.4 🦊 If Directory:: doesn't exist, create it with current user
      if (currentMembers === null) {
        console.log("📋 Creating Directory:: header with initial member list");
        await setDataValue(
          membersPageUid,
          "Directory",
          [this.user.displayName],
          true
        ); // true = use attribute format
        console.log(`✅ Created Directory:: with ${this.user.displayName}`);
        return true;
      }

      // 2.1.3.5 🦊 Ensure currentMembers is an array
      if (!Array.isArray(currentMembers)) {
        currentMembers = [currentMembers];
      }

      // 2.1.3.6 🦊 Check if current user is in the list
      if (!currentMembers.includes(this.user.displayName)) {
        // Add current user to the list
        const updatedMembers = [...currentMembers, this.user.displayName];
        await setDataValue(membersPageUid, "Directory", updatedMembers, true); // true = use attribute format
        console.log(
          `✅ Added ${this.user.displayName} to graph members directory`
        );
      } else {
        console.log(
          `📋 ${this.user.displayName} already in graph members directory`
        );
      }

      console.log(
        `📊 Graph members directory: ${
          currentMembers.length +
          (currentMembers.includes(this.user.displayName) ? 0 : 1)
        } members`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize graph members directory:", error);
      return false;
    }
  }

  // 2.1.4 🌸 Session ID generation utility
  generateSessionId() {
    const platform = window.RoamExtensionSuite;
    const generateUID = platform.getUtility("generateUID");
    return `session-${generateUID()}-${Date.now()}`;
  }

  // 2.1.5 🐇 User activity tracking
  updateActivity() {
    this.lastActivity = Date.now();
  }

  // 2.1.6 🌸 Session duration calculation
  getSessionDuration() {
    return Date.now() - this.sessionStartTime;
  }

  // 2.1.7 🌸 Session activity status check
  isActive() {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.lastActivity < fiveMinutes;
  }

  // 2.1.8 🌸 Session information aggregation
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      user: this.user,
      authState: this.authState,
      duration: this.getSessionDuration(),
      isActive: this.isActive(),
      lastActivity: new Date(this.lastActivity).toISOString(),
    };
  }

  // 2.1.9 🦊 User data refresh functionality
  async refreshUser() {
    const platform = window.RoamExtensionSuite;
    const clearUserCache = platform.getUtility("clearUserCache");
    const getCurrentUser = platform.getUtility("getCurrentUser");

    // Clear cache and get fresh user data
    clearUserCache();
    this.user = getCurrentUser();
    this.authState =
      this.user.method === "fallback" ? "guest" : "authenticated";
    this.updateActivity();

    console.log(
      `🔄 User session refreshed: ${this.user.displayName} (${this.user.method})`
    );
    return this.user;
  }
}

// 2.2 🍎 Global session instance
let userSession = null;

// ===================================================================
// 3.0 🌳 GRAPH MEMBERS DIRECTORY SERVICES - Source of Truth Management
// ===================================================================

/**
 * 3.1 🦊 Get all members from the graph members directory
 */
const getGraphMembers = () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findDataValue = platform.getUtility("findDataValue");

    const membersPageUid = getPageUidByTitle("roam/graph members");
    if (!membersPageUid) {
      console.warn("📋 Graph members page not found");
      return [];
    }

    const members = findDataValue(membersPageUid, "Directory");
    if (members === null) {
      console.warn("📋 Directory:: not found in graph members page");
      return [];
    }

    // Ensure we return an array
    const membersList = Array.isArray(members) ? members : [members];
    console.log(`📊 Found ${membersList.length} graph members`);
    return membersList;
  } catch (error) {
    console.error("❌ Failed to get graph members:", error);
    return [];
  }
};

/**
 * 3.2 🦊 Add a member to the graph members directory
 */
const addGraphMember = async (username) => {
  try {
    console.log(`📋 Adding ${username} to graph members directory...`);

    const platform = window.RoamExtensionSuite;
    const createPageIfNotExists = platform.getUtility("createPageIfNotExists");
    const setDataValue = platform.getUtility("setDataValue");

    // 3.2.1 🦊 Ensure the page exists
    const membersPageUid = await createPageIfNotExists("roam/graph members");
    if (!membersPageUid) return false;

    // 3.2.2 🦊 Get current members
    const currentMembers = getGraphMembers();

    // 3.2.3 🦊 Check if user is already in the list
    if (currentMembers.includes(username)) {
      console.log(`📋 ${username} already in graph members directory`);
      return true;
    }

    // 3.2.4 🦊 Add the new member
    const updatedMembers = [...currentMembers, username];
    const success = await setDataValue(
      membersPageUid,
      "Directory",
      updatedMembers,
      true
    );

    if (success) {
      console.log(`✅ Added ${username} to graph members directory`);
    } else {
      console.error(`❌ Failed to add ${username} to graph members directory`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error adding ${username} to graph members:`, error);
    return false;
  }
};

/**
 * 3.3 🦊 Remove a member from the graph members directory
 */
const removeGraphMember = async (username) => {
  try {
    console.log(`📋 Removing ${username} from graph members directory...`);

    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const setDataValue = platform.getUtility("setDataValue");

    const membersPageUid = getPageUidByTitle("roam/graph members");
    if (!membersPageUid) {
      console.warn("📋 Graph members page not found");
      return false;
    }

    // 3.3.1 🦊 Get current members
    const currentMembers = getGraphMembers();

    // 3.3.2 🦊 Check if user is in the list
    if (!currentMembers.includes(username)) {
      console.log(`📋 ${username} not found in graph members directory`);
      return true;
    }

    // 3.3.3 🦊 Remove the member
    const updatedMembers = currentMembers.filter(
      (member) => member !== username
    );
    const success = await setDataValue(
      membersPageUid,
      "Directory",
      updatedMembers,
      true
    );

    if (success) {
      console.log(`✅ Removed ${username} from graph members directory`);
    } else {
      console.error(
        `❌ Failed to remove ${username} from graph members directory`
      );
    }

    return success;
  } catch (error) {
    console.error(`❌ Error removing ${username} from graph members:`, error);
    return false;
  }
};

/**
 * 3.4 🌸 Check if a user is a graph member
 */
const isGraphMember = (username) => {
  const members = getGraphMembers();
  return members.includes(username);
};

/**
 * 3.5 🌸 Get graph member count
 */
const getGraphMemberCount = () => {
  return getGraphMembers().length;
};

// ===================================================================
// 4.0 🌳 AUTHENTICATION SERVICES - High-Level User Operations
// ===================================================================

/**
 * 4.1 🦊 Get current authenticated user with session tracking
 */
const getAuthenticatedUser = () => {
  if (!userSession) {
    console.warn(
      "User session not initialized - call initializeAuthentication first"
    );
    return null;
  }

  userSession.updateActivity();
  return userSession.user;
};

/**
 * 4.2 🌸 Check if user is authenticated (not a fallback user)
 */
const isUserAuthenticated = () => {
  if (!userSession) return false;
  return userSession.authState === "authenticated";
};

/**
 * 4.3 🦊 Get user preferences page UID with auto-creation
 */
const getUserPreferencesPageUid = async (username) => {
  const platform = window.RoamExtensionSuite;
  const createPageIfNotExists = platform.getUtility("createPageIfNotExists");

  const pageTitle = `${username}/user preferences`;
  const pageUid = await createPageIfNotExists(pageTitle);

  if (pageUid) {
    console.log(`📄 User preferences page ready: ${pageTitle}`);
  } else {
    console.error(`Failed to create preferences page for ${username}`);
  }

  return pageUid;
};

/**
 * 4.4 🦊 Get user preference with intelligent defaults
 */
const getUserPreference = async (username, key, defaultValue = null) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findDataValue = platform.getUtility("findDataValue");

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return defaultValue;

    const value = findDataValue(pageUid, key);
    const result = value !== null ? value : defaultValue;

    console.log(`⚙️ Preference "${key}" for ${username}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Failed to get preference "${key}" for ${username}:`, error);
    return defaultValue;
  }
};

/**
 * 4.5 🦊 Set user preference with proper structure
 */
const setUserPreference = async (
  username,
  key,
  value,
  useAttributeFormat = false
) => {
  try {
    const platform = window.RoamExtensionSuite;
    const setDataValue = platform.getUtility("setDataValue");

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return false;

    const success = await setDataValue(pageUid, key, value, useAttributeFormat);

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
 * 4.6 🦊 Get all user preferences as object
 */
const getAllUserPreferences = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findDataValue = platform.getUtility("findDataValue");
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

    const pageTitle = `${username}/user preferences`;
    const pageUid = getPageUidByTitle(pageTitle);

    if (!pageUid) {
      console.log(`📄 No preferences page found for ${username}`);
      return {};
    }

    // 4.6.1 🌸 Common preference keys to check
    const preferenceKeys = [
      "Loading Page Preference",
      "Immutable Home Page",
      "Weekly Bundle",
      "Journal Header Color",
      "Personal Shortcuts",
    ];

    const preferences = {};

    // 4.6.2 🦊 Collect preference values
    for (const key of preferenceKeys) {
      const value = findDataValue(pageUid, key);
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
 * 4.7 🦊 Initialize default preferences for new users
 */
const initializeUserPreferences = async (username) => {
  try {
    console.log(`🎯 Initializing default preferences for ${username}...`);

    // 4.7.1 🍎 Default preference values
    const defaults = {
      "Loading Page Preference": "Daily Page",
      "Immutable Home Page": "yes",
      "Weekly Bundle": "no",
      "Journal Header Color": "blue",
      "Personal Shortcuts": ["Daily Notes", "Chat Room"],
    };

    let successCount = 0;

    // 4.7.2 🦊 Set each default preference
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
// 5.0 🌳 SESSION MONITORING - FIXED Activity Tracking with Defensive Programming
// ===================================================================

/**
 * 5.1 🦊 Start session monitoring with defensive activity tracking
 * FIXED: Prevents null reference errors during extension lifecycle
 */
const startSessionMonitoring = () => {
  // 5.1.1 🌸 Early exit if no session
  if (!userSession) {
    console.warn("⚠️ Cannot start session monitoring - userSession is null");
    return;
  }

  console.log("📊 Starting session monitoring with defensive checks...");

  // 5.1.2 🍎 Track user activity with various DOM events
  const activityEvents = ["click", "keydown", "scroll", "mousemove"];

  activityEvents.forEach((eventType) => {
    // 5.1.2.1 ✅ DEFENSIVE LISTENER - Checks if userSession exists before calling
    const listener = () => {
      try {
        // Only update activity if userSession exists and has the method
        if (userSession && typeof userSession.updateActivity === "function") {
          userSession.updateActivity();
        }
      } catch (error) {
        // Silent error handling to prevent console spam
        console.warn(
          `Session activity update error (${eventType}):`,
          error.message
        );
      }
    };

    document.addEventListener(eventType, listener, true);

    // 5.1.2.2 ✅ Register for cleanup with more metadata for debugging
    window._extensionRegistry.domListeners.push({
      el: document,
      type: eventType,
      listener: listener,
      source: "session-monitoring", // For debugging
      created: Date.now(),
    });
  });

  // 5.1.3 🦊 Periodic session health check (every 30 seconds)
  const healthCheck = () => {
    try {
      if (
        userSession &&
        typeof userSession.isActive === "function" &&
        userSession.isActive()
      ) {
        console.log(
          `💓 Session active: ${
            userSession.user?.displayName || "Unknown"
          } (${Math.round(userSession.getSessionDuration() / 1000)}s)`
        );
        // Schedule next check
        const nextTimeout = setTimeout(healthCheck, 30000);
        window._extensionRegistry.timeouts.push(nextTimeout);
      } else {
        console.log("💤 Session inactive - stopping health checks");
      }
    } catch (error) {
      console.warn("Session health check error:", error.message);
    }
  };

  // 5.1.4 ✅ Start health checks after 30 seconds (defensive timing)
  const initialTimeout = setTimeout(healthCheck, 30000);
  window._extensionRegistry.timeouts.push(initialTimeout);

  console.log("📊 Session monitoring started with defensive error handling");
};

/**
 * 5.2 🧹 Enhanced session cleanup with better error handling
 */
const cleanupSessionMonitoring = () => {
  try {
    console.log("🧹 Cleaning up session monitoring...");

    // 5.2.1 🧹 Clear the session reference
    if (userSession) {
      console.log(
        `📊 Session duration: ${Math.round(
          userSession.getSessionDuration() / 1000
        )}s`
      );
      userSession = null;
    }

    // 5.2.2 🧹 Count and report cleanup
    const registry = window._extensionRegistry;
    if (registry) {
      const sessionListeners = registry.domListeners.filter(
        (l) => l.source === "session-monitoring"
      );
      console.log(
        `🧹 Removing ${sessionListeners.length} session monitoring listeners`
      );
    }

    console.log("✅ Session monitoring cleanup complete");
  } catch (error) {
    console.warn("Session cleanup warning:", error.message);
  }
};

// ===================================================================
// 6.0 🌳 TESTING AND VALIDATION UTILITIES
// ===================================================================

/**
 * 6.1 🦊 Run comprehensive authentication tests
 */
const runAuthenticationTests = async () => {
  console.group("🧪 Authentication System Tests");

  try {
    // 6.1.1 🌸 Test 1: User Detection
    console.log("Test 1: User Detection");
    const user = getAuthenticatedUser();
    console.log(`  Current user: ${user?.displayName} (${user?.method})`);
    console.log(`  Authenticated: ${isUserAuthenticated()}`);

    // 6.1.2 🌸 Test 2: Session Information
    console.log("Test 2: Session Information");
    const sessionInfo = userSession?.getSessionInfo();
    console.log("  Session info:", sessionInfo);

    // 6.1.3 🌸 Test 3: Graph Members Directory
    console.log("Test 3: Graph Members Directory");
    const members = getGraphMembers();
    console.log(`  Graph members (${members.length}):`, members);
    console.log(
      `  Current user is member: ${isGraphMember(user?.displayName)}`
    );

    // 6.1.4 🌸 Test 4: Preferences
    console.log("Test 4: User Preferences");
    if (user) {
      const preferences = await getAllUserPreferences(user.displayName);
      console.log(
        `  Found ${Object.keys(preferences).length} preferences:`,
        preferences
      );

      // Test setting a preference
      const testResult = await setUserPreference(
        user.displayName,
        "Test Setting",
        `Test ${Date.now()}`
      );
      console.log(`  Set test preference: ${testResult}`);
    }

    // 6.1.5 🌸 Test 5: Multi-user Detection
    console.log("Test 5: Multi-user Graph Detection");
    const platform = window.RoamExtensionSuite;
    const isMultiUserGraph = platform.getUtility("isMultiUserGraph");
    console.log(`  Multi-user graph: ${isMultiUserGraph()}`);

    console.log("✅ All tests completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
};

/**
 * 6.2 🦜 Display authentication status dashboard
 */
const showAuthenticationDashboard = () => {
  if (!userSession) {
    console.log("❌ Authentication not initialized");
    return;
  }

  const sessionInfo = userSession.getSessionInfo();
  const durationMinutes = Math.round(sessionInfo.duration / (1000 * 60));
  const members = getGraphMembers();

  console.group("🔐 Authentication Dashboard");
  console.log(`👤 User: ${sessionInfo.user.displayName}`);
  console.log(`🔍 Detection Method: ${sessionInfo.user.method}`);
  console.log(`🎯 Authentication State: ${sessionInfo.authState}`);
  console.log(`⏱️ Session Duration: ${durationMinutes} minutes`);
  console.log(`💓 Active: ${sessionInfo.isActive ? "Yes" : "No"}`);
  console.log(`🆔 Session ID: ${sessionInfo.sessionId}`);
  console.log(`📧 Email: ${sessionInfo.user.email || "Not available"}`);
  console.log(
    `🖼️ Photo: ${sessionInfo.user.photoUrl ? "Available" : "Not available"}`
  );
  console.log(`📋 Graph Members (${members.length}): ${members.join(", ")}`);
  console.groupEnd();
};

// ===================================================================
// 7.0 🌳 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔐 User Authentication starting...");

    // 7.1 ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    if (!window.RoamExtensionSuite.getUtility("getCurrentUser")) {
      console.error(
        "❌ Utility Library not found! Please load Extension 1.5 first."
      );
      return;
    }

    // 7.2 🎯 INITIALIZE USER SESSION
    try {
      userSession = new UserSession();
      await userSession.initialize();

      // Start monitoring user activity with defensive programming
      startSessionMonitoring();
    } catch (error) {
      console.error("❌ Failed to initialize user session:", error);
      return;
    }

    // 7.3 🔧 REGISTER HIGH-LEVEL AUTHENTICATION SERVICES
    const platform = window.RoamExtensionSuite;

    const authenticationServices = {
      // 7.3.1 🍎 Core authentication
      getAuthenticatedUser: getAuthenticatedUser,
      isUserAuthenticated: isUserAuthenticated,
      refreshUserSession: () => userSession?.refreshUser(),
      getSessionInfo: () => userSession?.getSessionInfo(),

      // 7.3.2 🍎 Graph members directory
      getGraphMembers: getGraphMembers,
      addGraphMember: addGraphMember,
      removeGraphMember: removeGraphMember,
      isGraphMember: isGraphMember,
      getGraphMemberCount: getGraphMemberCount,

      // 7.3.3 🍎 User preferences
      getUserPreference: getUserPreference,
      setUserPreference: setUserPreference,
      getAllUserPreferences: getAllUserPreferences,
      initializeUserPreferences: initializeUserPreferences,
      getUserPreferencesPageUid: getUserPreferencesPageUid,

      // 7.3.4 🍎 Testing utilities
      runAuthenticationTests: runAuthenticationTests,
      showAuthenticationDashboard: showAuthenticationDashboard,
    };

    Object.entries(authenticationServices).forEach(([name, service]) => {
      platform.registerUtility(name, service);
    });

    // 7.4 📝 REGISTER COMMANDS
    const commands = [
      {
        label: "Auth: Show User Dashboard",
        callback: showAuthenticationDashboard,
      },
      {
        label: "Auth: Run Authentication Tests",
        callback: runAuthenticationTests,
      },
      {
        label: "Auth: Show Graph Members",
        callback: () => {
          const members = getGraphMembers();
          console.group(`📋 Graph Members Directory (${members.length})`);
          members.forEach((member, index) => {
            console.log(`${index + 1}. ${member}`);
          });
          console.groupEnd();
        },
      },
      {
        label: "Auth: Refresh User Session",
        callback: async () => {
          if (userSession) {
            const user = await userSession.refreshUser();
            console.log(`🔄 User session refreshed: ${user.displayName}`);
          }
        },
      },
      {
        label: "Auth: Initialize My Preferences",
        callback: async () => {
          const user = getAuthenticatedUser();
          if (user) {
            const success = await initializeUserPreferences(user.displayName);
            console.log(
              `🎯 Preference initialization ${
                success ? "successful" : "failed"
              }`
            );
          }
        },
      },
      {
        label: "Auth: Show My Preferences",
        callback: async () => {
          const user = getAuthenticatedUser();
          if (user) {
            const preferences = await getAllUserPreferences(user.displayName);
            console.group(`⚙️ Preferences for ${user.displayName}`);
            Object.entries(preferences).forEach(([key, value]) => {
              console.log(`${key}: ${JSON.stringify(value)}`);
            });
            console.groupEnd();
          }
        },
      },
    ];

    // 7.4.1 🦊 Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 7.5 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "user-authentication",
      {
        session: userSession,
        services: authenticationServices,
        version: "2.0.1", // Incremented for session monitoring fix
      },
      {
        name: "User Authentication",
        description:
          "Professional user session management and graph members directory with defensive session monitoring",
        version: "2.0.1",
        dependencies: ["foundation-registry", "utility-library"],
      }
    );

    // 7.6 🎉 STARTUP COMPLETE
    const user = getAuthenticatedUser();
    const memberCount = getGraphMemberCount();
    console.log("✅ User Authentication loaded successfully!");
    console.log(
      `👤 Welcome ${user.displayName}! Authentication state: ${userSession.authState}`
    );
    console.log(`📋 Graph has ${memberCount} registered members`);
    console.log('💡 Try: Cmd+P → "Auth: Show User Dashboard"');

    // 7.6.1 🦊 Auto-initialize preferences for new users
    const preferences = await getAllUserPreferences(user.displayName);
    if (Object.keys(preferences).length === 0) {
      console.log("🎯 No preferences found - initializing defaults...");
      await initializeUserPreferences(user.displayName);
    }
  },

  onunload: () => {
    console.log("🔐 User Authentication unloading...");

    // 7.7 🧹 Enhanced cleanup with session monitoring cleanup
    cleanupSessionMonitoring();

    console.log("✅ User Authentication cleanup complete!");
  },
};
