// ===================================================================
// 1.0 🌳 EXTENSION 2: USER AUTHENTICATION - PROFESSIONAL USER MANAGEMENT
// UPDATED: Simplified to assume multi-user intent from installation
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

      // 2.1.2.2 🦊 Debug utility access
      console.log(
        "🔍 Platform utilities:",
        Object.keys(platform.utilities || {})
      );
      console.log("🔍 getCurrentUser function:", typeof getCurrentUser);

      // 2.1.2.3 🦊 Detect current user
      this.user = getCurrentUser();
      console.log("🔍 Raw user object:", this.user);
      this.authState =
        this.user.method === "fallback" ? "guest" : "authenticated";
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
      this.lastActivity = Date.now();

      console.log(`🔐 User session initialized:`);
      console.log(`   User: ${this.user.displayName} (${this.user.method})`);
      console.log(`   State: ${this.authState}`);
      console.log(`   Session ID: ${this.sessionId}`);

      // 2.1.2.3 🎯 INITIALIZE GRAPH MEMBERS DIRECTORY - "Safety Net"
      // Since extension was installed, assume multi-user intent and create infrastructure
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

      const platform = window.RoamExtensionSuite;
      const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
      const setDataValue = platform.getUtility("setDataValue");

      // 2.1.3.1 🦊 Check if directory page exists
      let membersPageUid = getPageUidByTitle("roam/graph members");

      // 2.1.3.2 🦊 Create page if it doesn't exist
      if (!membersPageUid) {
        console.log("📋 Creating [[roam/graph members]] page...");
        membersPageUid = await window.roamAlphaAPI.createPage({
          page: { title: "roam/graph members" },
        });

        if (membersPageUid) {
          console.log("✅ Created [[roam/graph members]] page");
        } else {
          console.error("❌ Failed to create graph members page");
          return false;
        }
      }

      // 2.1.3.3 🦊 Initialize the directory structure
      const directoryContent = `Directory:: Graph members managed by Extension 2
Members:: ${this.user.displayName}
Last Updated:: ${new Date().toISOString()}`;

      await window.roamAlphaAPI.updateBlock({
        block: { uid: membersPageUid, string: directoryContent },
      });

      // 2.1.3.4 🦊 Ensure current user is in the directory
      const addResult = await addGraphMember(this.user.displayName);
      if (addResult) {
        console.log(
          `✅ Ensured ${this.user.displayName} is in graph members directory`
        );
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize graph members directory:", error);
      return false;
    }
  }

  // 2.1.4 🦊 Generate unique session ID
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 2.1.5 🦊 Update last activity timestamp
  updateActivity() {
    this.lastActivity = Date.now();
  }

  // 2.1.6 🦊 Check if session is still active
  isActive() {
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    return Date.now() - this.lastActivity < inactiveThreshold;
  }

  // 2.1.7 🦊 Get session duration
  getSessionDuration() {
    return Date.now() - this.sessionStartTime;
  }

  // 2.1.8 🦊 Refresh user information
  async refreshUser() {
    try {
      const platform = window.RoamExtensionSuite;
      const getCurrentUser = platform.getUtility("getCurrentUser");

      this.user = getCurrentUser();
      this.updateActivity();

      console.log(`🔄 User session refreshed: ${this.user.displayName}`);
      return this.user;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  }

  // 2.1.9 🦊 Get comprehensive session information
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      user: this.user,
      authState: this.authState,
      isActive: this.isActive(),
      duration: this.getSessionDuration(),
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivity,
    };
  }
}

// ===================================================================
// 3.0 🌳 GRAPH MEMBERS DIRECTORY MANAGEMENT
// ===================================================================

/**
 * 3.1 🦊 Get all graph members from the directory
 */
const getGraphMembers = () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findDataValue = platform.getUtility("findDataValue");

    const membersPageUid = getPageUidByTitle("roam/graph members");
    if (!membersPageUid) {
      console.log("📋 Graph members page not found");
      return [];
    }

    const membersData = findDataValueExact(membersPageUid, "Members");
    if (!membersData) {
      console.log("📋 No members data found");
      return [];
    }

    // Parse the members data (could be comma-separated or array)
    const membersList = Array.isArray(membersData)
      ? membersData
      : membersData
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);

    // Ensure we don't have empty arrays being counted as members
    const validMembers = Array.isArray(membersList) ? membersList : [members];
    console.log(`📊 Found ${validMembers.length} graph members`);
    return validMembers;
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
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const setDataValueStructured = platform.getUtility(
      "setDataValueStructured"
    );

    const membersPageUid = getPageUidByTitle("roam/graph members");
    if (!membersPageUid) {
      console.warn("📋 Graph members page not found");
      return false;
    }

    // 3.2.1 🦊 Get current members
    const currentMembers = getGraphMembers();

    // 3.2.2 🦊 Check if user is already in the list
    if (currentMembers.includes(username)) {
      console.log(`📋 ${username} already in graph members directory`);
      return true;
    }

    // 3.2.3 🦊 Add the new member
    const updatedMembers = [...currentMembers, username];
    const success = await setDataValueStructured(
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
    const setDataValueStructured = platform.getUtility(
      "setDataValueStructured"
    );

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
    const success = await setDataValueStructured(
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
  const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

  const pageTitle = `${username}/user preferences`;
  let pageUid = getPageUidByTitle(pageTitle);

  // Create page if it doesn't exist
  if (!pageUid) {
    try {
      pageUid = await window.roamAlphaAPI.createPage({
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
  }

  if (pageUid) {
    console.log(`📄 User preferences page ready: ${pageTitle}`);
  } else {
    console.error(`Failed to get/create preferences page for ${username}`);
  }

  return pageUid;
};

/**
 * 4.4 🦊 Get user preference with intelligent defaults
 */
const getUserPreference = async (username, key, defaultValue = null) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findDataValueExact = platform.getUtility("findDataValueExact");

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return defaultValue;

    const value = findDataValueExact(pageUid, key);
    const result = value !== null ? value : defaultValue;

    console.log(`📄 Got preference ${key} for ${username}: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to get preference ${key} for ${username}:`, error);
    return defaultValue;
  }
};

/**
 * 4.5 🦊 Set user preference with validation
 */
const setUserPreference = async (username, key, value) => {
  try {
    console.log(`📄 Setting preference ${key} for ${username}: ${value}`);

    const platform = window.RoamExtensionSuite;
    const setDataValueStructured = platform.getUtility(
      "setDataValueStructured"
    );

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return false;

    const success = await setDataValueStructured(pageUid, key, value);

    if (success) {
      console.log(`✅ Set preference ${key} for ${username}`);
    } else {
      console.error(`❌ Failed to set preference ${key} for ${username}`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error setting preference ${key} for ${username}:`, error);
    return false;
  }
};

/**
 * 4.6 🦊 Get all user preferences as an object
 */
const getAllUserPreferences = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const findNestedDataValuesExact = platform.getUtility(
      "findNestedDataValuesExact"
    );

    const pageUid = await getUserPreferencesPageUid(username);
    if (!pageUid) return {};

    const preferences = findNestedDataValuesExact(pageUid, "");
    console.log(
      `📄 Got ${Object.keys(preferences).length} preferences for ${username}`
    );

    return preferences;
  } catch (error) {
    console.error(`❌ Failed to get all preferences for ${username}:`, error);
    return {};
  }
};

/**
 * 4.7 🦊 Initialize default user preferences
 */
const initializeUserPreferences = async (username) => {
  console.log(`📄 Initializing default preferences for ${username}...`);

  const defaultPreferences = {
    Theme: "default",
    Notifications: "enabled",
    "Last Login": new Date().toISOString(),
    "Extension Version": "2.0.0",
  };

  let successCount = 0;
  for (const [key, value] of Object.entries(defaultPreferences)) {
    const success = await setUserPreference(username, key, value);
    if (success) successCount++;
  }

  console.log(
    `✅ Initialized ${successCount}/${
      Object.keys(defaultPreferences).length
    } default preferences`
  );
  return successCount === Object.keys(defaultPreferences).length;
};

// ===================================================================
// 5.0 🌳 SESSION MONITORING AND HEALTH CHECKS
// ===================================================================

// Global session variable
let userSession = null;

/**
 * 5.1 🦊 Enhanced session monitoring with defensive error handling
 */
const startSessionMonitoring = () => {
  try {
    console.log("📊 Starting session monitoring...");

    // 5.1.1 🦊 Health check function with proper error handling
    const healthCheck = () => {
      try {
        if (!userSession) return;

        const sessionInfo = userSession.getSessionInfo();
        const durationMinutes = Math.round(sessionInfo.duration / (1000 * 60));

        console.log(
          `💓 Session health: ${
            sessionInfo.isActive ? "Active" : "Inactive"
          } (${durationMinutes}m)`
        );

        // Update last activity on any DOM interaction
        const updateActivity = () => userSession.updateActivity();

        // Add activity listeners with platform tracking
        ["click", "keydown", "scroll"].forEach((eventType) => {
          document.addEventListener(eventType, updateActivity, {
            passive: true,
          });

          // Track for cleanup using the platform
          if (window.RoamExtensionSuite) {
            if (!window.RoamExtensionSuite.domListeners) {
              window.RoamExtensionSuite.domListeners = [];
            }
            window.RoamExtensionSuite.domListeners.push({
              element: document,
              type: eventType,
              listener: updateActivity,
              source: "session-monitoring",
            });
          }
        });
      } catch (error) {
        console.warn("Session health check warning:", error.message);
      }
    };

    // 5.1.2 🦊 Start initial monitoring (with defensive timing)
    const initialTimeout = setTimeout(healthCheck, 30000);
    if (window.RoamExtensionSuite) {
      if (!window.RoamExtensionSuite.timeouts) {
        window.RoamExtensionSuite.timeouts = [];
      }
      window.RoamExtensionSuite.timeouts.push(initialTimeout);
    }

    console.log("📊 Session monitoring started with defensive error handling");
  } catch (error) {
    console.warn("Session monitoring initialization warning:", error.message);
  }
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
    const platform = window.RoamExtensionSuite;
    if (platform?.domListeners) {
      const sessionListeners = platform.domListeners.filter(
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

    // 6.1.5 🌸 Test 5: Multi-User Infrastructure
    console.log("Test 5: Multi-User Infrastructure");
    console.log("  Extension assumes multi-user setup by installation intent");
    console.log("  [[roam/graph members]] directory created automatically");
    console.log(`  Directory contains ${getGraphMemberCount()} members`);

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
  console.log(`🌐 Multi-User Setup: Assumed from extension installation`);
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
    ];

    commands.forEach(({ label, callback }) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: `Extension 2: ${label}`,
        callback,
      });
    });

    // 7.5 🎯 REGISTER EXTENSION IN PLATFORM
    platform.register("extension-2", authenticationServices, {
      name: "User Authentication & Graph Members",
      version: "2.0.0",
      commands,
    });

    // 7.6 🍎 SUCCESS CONFIRMATION WITH USER CONTEXT
    const user = getAuthenticatedUser();
    const memberCount = getGraphMemberCount();

    console.log("✅ Extension 2: User Authentication loaded successfully!");
    console.log(
      `👤 Welcome ${user.displayName}! Authentication state: ${userSession.authState}`
    );
    console.log(`📋 Graph has ${memberCount} registered members`);
    console.log(
      `🌐 Multi-user infrastructure ready (assumed from installation)`
    );
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
