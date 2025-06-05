// ===================================================================
// Extension 2: User Authentication - Professional User Detection
// Based on David Vargas's enterprise-grade patterns from Roam University
// Using Josh Brown's official API + David's localStorage + our proven fallbacks
// ===================================================================

// ===================================================================
// 🔧 CORE USER DETECTION UTILITIES - Professional Business Logic
// ===================================================================

// Josh Brown's Official API (June 2025) - PRIMARY METHOD
const getCurrentUserViaOfficialAPI = () => {
  try {
    const userUid = window.roamAlphaAPI?.user?.uid?.();
    if (userUid) {
      const userData = window.roamAlphaAPI.pull(
        `
        [:user/display-name :user/photo-url :user/uid :user/email]
      `,
        [":user/uid", userUid]
      );

      if (userData) {
        return {
          uid: userUid,
          displayName: userData[":user/display-name"] || "Unknown User",
          photoUrl: userData[":user/photo-url"] || null,
          email: userData[":user/email"] || null,
          method: "official-api",
        };
      }
    }
  } catch (error) {
    console.warn("Official user API not available:", error.message);
  }
  return null;
};

// David's localStorage Method - PROVEN FALLBACK
const getCurrentUserViaLocalStorage = () => {
  try {
    const globalAppState = JSON.parse(
      localStorage.getItem("globalAppState") || '["","",[]]'
    );
    const userIndex = globalAppState.findIndex((s) => s === "~:user");

    if (userIndex > 0 && globalAppState[userIndex + 1]) {
      const userArray = globalAppState[userIndex + 1];

      // Extract key user data from localStorage structure
      const uidIndex = userArray.findIndex((s) => s === "~:uid");
      const nameIndex = userArray.findIndex((s) => s === "~:display-name");
      const emailIndex = userArray.findIndex((s) => s === "~:email");

      const uid = uidIndex > 0 ? userArray[uidIndex + 1] : null;
      const displayName = nameIndex > 0 ? userArray[nameIndex + 1] : null;
      const email = emailIndex > 0 ? userArray[emailIndex + 1] : null;

      if (uid || displayName) {
        return {
          uid: uid || generateUID(),
          displayName: displayName || "Current User",
          photoUrl: null, // localStorage doesn't store photo URLs
          email: email || null,
          method: "localStorage",
        };
      }
    }
  } catch (error) {
    console.warn("localStorage user detection failed:", error.message);
  }
  return null;
};

// Our Proven Recent Block Method - FINAL FALLBACK
const getCurrentUserViaRecentBlocks = () => {
  try {
    // Get recent blocks created in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?user-id ?create-time
       :where 
       [?b :block/uid ?uid]
       [?b :create/user ?user-id]  
       [?b :create/time ?create-time]
       [(> ?create-time ${oneHourAgo})]]
    `);

    if (recentBlocks.length > 0) {
      // Get most recent block's creator
      const mostRecentBlock = recentBlocks.sort((a, b) => b[2] - a[2])[0];
      const userDbId = mostRecentBlock[1];

      // Get user details
      const userData = window.roamAlphaAPI.pull(
        `
        [:user/display-name :user/photo-url :user/uid :user/email]
      `,
        userDbId
      );

      if (userData) {
        return {
          uid: userData[":user/uid"] || generateUID(),
          displayName: userData[":user/display-name"] || "Current User",
          photoUrl: userData[":user/photo-url"] || null,
          email: userData[":user/email"] || null,
          method: "recent-blocks",
        };
      }
    }
  } catch (error) {
    console.warn("Recent blocks user detection failed:", error.message);
  }
  return null;
};

// ===================================================================
// 🧠 SMART USER DETECTION WITH CACHING - David's Optimization Pattern
// ===================================================================

let userCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes like David's patterns

const getCurrentUser = () => {
  // Smart caching - only refresh every 5 minutes
  if (userCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return userCache;
  }

  // Try detection methods in order of reliability
  let user =
    getCurrentUserViaOfficialAPI() ||
    getCurrentUserViaLocalStorage() ||
    getCurrentUserViaRecentBlocks();

  // Fallback to basic user if all methods fail
  if (!user) {
    user = {
      uid: generateUID(),
      displayName: "Unknown User",
      photoUrl: null,
      email: null,
      method: "fallback",
    };
  }

  // Cache successful result
  userCache = user;
  cacheTimestamp = Date.now();

  console.log(`👤 User detected via ${user.method}:`, user.displayName);
  return user;
};

// ===================================================================
// 🔧 UTILITY FUNCTIONS - Clean API for Other Extensions
// ===================================================================

const getCurrentUserUid = () => getCurrentUser().uid;
const getCurrentUserDisplayName = () => getCurrentUser().displayName;
const getCurrentUserPhotoUrl = () => getCurrentUser().photoUrl;
const getCurrentUserEmail = () => getCurrentUser().email;

const getUserById = (uidOrDbId) => {
  try {
    const userData = window.roamAlphaAPI.pull(
      `
      [:user/display-name :user/photo-url :user/uid :user/email]
    `,
      typeof uidOrDbId === "string" ? [":user/uid", uidOrDbId] : uidOrDbId
    );

    if (userData) {
      return {
        uid: userData[":user/uid"],
        displayName: userData[":user/display-name"],
        photoUrl: userData[":user/photo-url"],
        email: userData[":user/email"],
      };
    }
  } catch (error) {
    console.warn("Failed to get user by ID:", error.message);
  }
  return null;
};

const isMultiUserGraph = () => {
  try {
    const allUsers = window.roamAlphaAPI.data.q(`
      [:find (distinct ?user-id)
       :where [?b :create/user ?user-id]]
    `);
    return allUsers.length > 1;
  } catch (error) {
    console.warn("Failed to detect multi-user graph:", error.message);
    return false;
  }
};

const generateUID = () => {
  return (
    window.roamAlphaAPI?.util?.generateUID?.() ||
    "user-" + Math.random().toString(36).substr(2, 9)
  );
};

// Clear cache function for testing/debugging
const clearUserCache = () => {
  userCache = null;
  cacheTimestamp = 0;
  console.log("🔄 User cache cleared");
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("👤 User Authentication starting...");

    // ✅ VERIFY FOUNDATION DEPENDENCY
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    // 🎯 REGISTER UTILITIES WITH PLATFORM
    const platform = window.RoamExtensionSuite;

    platform.registerUtility("getCurrentUser", getCurrentUser);
    platform.registerUtility("getCurrentUserUid", getCurrentUserUid);
    platform.registerUtility(
      "getCurrentUserDisplayName",
      getCurrentUserDisplayName
    );
    platform.registerUtility("getCurrentUserPhotoUrl", getCurrentUserPhotoUrl);
    platform.registerUtility("getCurrentUserEmail", getCurrentUserEmail);
    platform.registerUtility("getUserById", getUserById);
    platform.registerUtility("isMultiUserGraph", isMultiUserGraph);
    platform.registerUtility("clearUserCache", clearUserCache);

    // 📝 REGISTER COMMANDS FOR TESTING/DEBUG
    const commands = [
      {
        label: "User Auth: Show Current User",
        callback: () => {
          const user = getCurrentUser();
          console.log("👤 Current User:", user);
          const multiUser = isMultiUserGraph();
          console.log("📊 Multi-user graph:", multiUser);
        },
      },
      {
        label: "User Auth: Clear Cache & Refresh",
        callback: () => {
          clearUserCache();
          const user = getCurrentUser();
          console.log("🔄 User refreshed:", user);
        },
      },
      {
        label: "User Auth: Test All Detection Methods",
        callback: () => {
          console.group("🧪 Testing User Detection Methods");
          console.log("Official API:", getCurrentUserViaOfficialAPI());
          console.log("localStorage:", getCurrentUserViaLocalStorage());
          console.log("Recent blocks:", getCurrentUserViaRecentBlocks());
          console.log("Final result:", getCurrentUser());
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
      "user-authentication",
      {
        getCurrentUser,
        getCurrentUserUid,
        getCurrentUserDisplayName,
        getCurrentUserPhotoUrl,
        getUserById,
        isMultiUserGraph,
        clearUserCache,
        version: "1.0.0",
      },
      {
        name: "User Authentication",
        description:
          "Professional user detection with Josh Brown API + David Vargas localStorage + proven fallbacks",
        version: "1.0.0",
        dependencies: ["foundation-registry"],
      }
    );

    // 🎉 STARTUP TEST
    const currentUser = getCurrentUser();
    const multiUserStatus = isMultiUserGraph();

    console.log("✅ User Authentication loaded successfully!");
    console.log(
      `👤 Detected user: ${currentUser.displayName} (${currentUser.method})`
    );
    console.log(`📊 Multi-user graph: ${multiUserStatus}`);
    console.log('💡 Try: Cmd+P → "User Auth: Show Current User"');
  },

  onunload: () => {
    console.log("👤 User Authentication unloading...");

    // Clear cache
    clearUserCache();

    console.log("✅ User Authentication cleanup complete!");
  },
};
