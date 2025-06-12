// ===================================================================
// Extension 2: ULTRA MINIMAL User Authentication - Self-Contained
// No dependencies on Extension 1.5 utilities during initialization
// ===================================================================

// ===================================================================
// 🎯 SELF-CONTAINED HELPER FUNCTIONS
// ===================================================================

/**
 * Get page UID by title - our own implementation
 */
const getPageUidByTitle = (title) => {
  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?uid
       :where 
       [?page :node/title "${title}"]
       [?page :block/uid ?uid]]
    `);
    return result.length > 0 ? result[0][0] : null;
  } catch (error) {
    console.warn(`Error getting page UID for "${title}":`, error);
    return null;
  }
};

// ===================================================================
// 🎯 CORE USER FUNCTIONS
// ===================================================================

/**
 * Get current authenticated user - safe utility access
 */
const getAuthenticatedUser = () => {
  try {
    // Try to get from Extension 1.5 first
    if (window.RoamExtensionSuite?.getUtility) {
      const getCurrentUser =
        window.RoamExtensionSuite.getUtility("getCurrentUser");
      if (getCurrentUser) {
        const userResult = getCurrentUser();
        console.log("🔐 Got user from Extension 1.5:", userResult);

        // Handle both string and object returns
        if (typeof userResult === "string") {
          return {
            displayName: userResult,
            method: userResult === "Current User" ? "fallback" : "official-api",
          };
        } else if (userResult && typeof userResult === "object") {
          return userResult;
        }
      }
    }

    // Fallback: try direct Roam API
    try {
      const userUid = window.roamAlphaAPI?.user?.uid?.();
      if (userUid) {
        const userData = window.roamAlphaAPI.pull("[*]", [
          ":user/uid",
          userUid,
        ]);
        const displayName =
          userData?.[":user/display-name"] ||
          userData?.[":user/email"] ||
          "Unknown User";
        return { displayName, method: "direct-api" };
      }
    } catch (e) {
      console.warn("Direct API failed:", e);
    }

    // Final fallback
    return { displayName: "Current User", method: "fallback" };
  } catch (error) {
    console.error("❌ Error getting user:", error);
    return { displayName: "Unknown User", method: "fallback" };
  }
};

/**
 * Check if user is authenticated
 */
const isUserAuthenticated = () => {
  const user = getAuthenticatedUser();
  return user && user.method !== "fallback";
};

// ===================================================================
// 📋 BASIC GRAPH MEMBERS FUNCTIONS
// ===================================================================

/**
 * Get graph members page UID, create if needed with proper block structure
 */
const getGraphMembersPageUid = async () => {
  try {
    // Try to find existing page
    let pageUid = getPageUidByTitle("roam/graph members");

    if (!pageUid) {
      // Create the page
      console.log("📋 Creating [[roam/graph members]] page...");
      pageUid = await window.roamAlphaAPI.createPage({
        page: { title: "roam/graph members" },
      });

      if (pageUid) {
        // Create Directory:: parent block
        console.log("📋 Setting up Directory:: structure...");

        const directoryBlock = await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": pageUid, order: 0 },
          block: { string: "Directory::" },
        });

        console.log(
          "✅ Created [[roam/graph members]] page with Directory:: structure"
        );
      }
    }

    return pageUid;
  } catch (error) {
    console.error("❌ Error with graph members page:", error);
    return null;
  }
};

/**
 * Add member to graph - as child block under Directory::
 */
const addGraphMember = async (username) => {
  try {
    if (!username || username === "undefined") {
      console.warn("📋 Invalid username provided");
      return false;
    }

    console.log(`📋 Adding ${username} to graph members...`);

    // Ensure page exists
    const pageUid = await getGraphMembersPageUid();
    if (!pageUid) {
      console.error("❌ Could not create/find graph members page");
      return false;
    }

    // Find the Directory:: block
    const pageData = window.roamAlphaAPI.pull("[:block/children]", [
      ":block/uid",
      pageUid,
    ]);
    const children = pageData?.[":block/children"] || [];

    let directoryBlockUid = null;

    // Find the Directory:: block
    for (const child of children) {
      const childUid = child[":block/uid"];
      const childData = window.roamAlphaAPI.pull("[:block/string]", [
        ":block/uid",
        childUid,
      ]);
      const childString = childData?.[":block/string"] || "";

      if (childString === "Directory::") {
        directoryBlockUid = childUid;
        break;
      }
    }

    // If no Directory:: block found, create it
    if (!directoryBlockUid) {
      directoryBlockUid = await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": pageUid, order: 0 },
        block: { string: "Directory::" },
      });
    }

    // Check if user already exists
    const currentMembers = getGraphMembers();
    if (currentMembers.includes(username)) {
      console.log(`📋 ${username} already in members list`);
      return true;
    }

    // Add user as child block under Directory::
    await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": directoryBlockUid, order: "last" },
      block: { string: username },
    });

    console.log(`✅ Added ${username} as child block under Directory::`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${username} to graph members:`, error);
    return false;
  }
};

/**
 * Get list of graph members - read child blocks under Directory::
 */
const getGraphMembers = () => {
  try {
    const pageUid = getPageUidByTitle("roam/graph members");
    if (!pageUid) {
      console.log("📋 No graph members page found");
      return [];
    }

    // Get page children blocks
    const pageData = window.roamAlphaAPI.pull("[:block/children]", [
      ":block/uid",
      pageUid,
    ]);
    const children = pageData?.[":block/children"] || [];

    // Find the Directory:: block
    for (const child of children) {
      const childUid = child[":block/uid"];
      const childData = window.roamAlphaAPI.pull(
        "[:block/string :block/children]",
        [":block/uid", childUid]
      );
      const childString = childData?.[":block/string"] || "";

      if (childString === "Directory::") {
        // Get the children of the Directory:: block (these are the members)
        const directoryChildren = childData?.[":block/children"] || [];
        const members = [];

        for (const memberChild of directoryChildren) {
          const memberUid = memberChild[":block/uid"];
          const memberData = window.roamAlphaAPI.pull("[:block/string]", [
            ":block/uid",
            memberUid,
          ]);
          const memberName = memberData?.[":block/string"] || "";

          if (memberName.trim()) {
            members.push(memberName.trim());
          }
        }

        console.log(`📋 Found ${members.length} graph members:`, members);
        return members;
      }
    }

    console.log("📋 No Directory:: block found");
    return [];
  } catch (error) {
    console.error("❌ Error getting graph members:", error);
    return [];
  }
};

/**
 * Check if user is a graph member
 */
const isGraphMember = (username) => {
  const members = getGraphMembers();
  return members.includes(username);
};

/**
 * Get graph member count
 */
const getGraphMemberCount = () => {
  return getGraphMembers().length;
};

// ===================================================================
// 🧪 TESTING FUNCTIONS
// ===================================================================

/**
 * Show authentication status
 */
const showAuthenticationStatus = () => {
  console.group("🔐 Authentication Status");

  const user = getAuthenticatedUser();
  const members = getGraphMembers();
  const memberCount = getGraphMemberCount();

  console.log(`👤 Current User: ${user.displayName}`);
  console.log(`🔍 Detection Method: ${user.method}`);
  console.log(`🎯 Authenticated: ${isUserAuthenticated() ? "Yes" : "No"}`);
  console.log(`📋 Graph Members (${memberCount}): ${members.join(", ")}`);
  console.log(
    `👥 User is member: ${isGraphMember(user.displayName) ? "Yes" : "No"}`
  );

  console.groupEnd();
};

/**
 * Run basic tests
 */
const runBasicTests = async () => {
  console.group("🧪 Extension 2 Self-Contained Tests");

  try {
    console.log("Test 1: User Detection");
    const user = getAuthenticatedUser();
    console.log(`  ✅ User: ${user.displayName} (${user.method})`);

    console.log("Test 2: Add Current User");
    const addResult = await addGraphMember(user.displayName);
    console.log(`  ✅ Add result: ${addResult}`);

    console.log("Test 3: Check Members");
    const members = getGraphMembers();
    console.log(`  ✅ Members: ${members.join(", ")}`);

    console.log("Test 4: Verify Membership");
    const isMember = isGraphMember(user.displayName);
    console.log(`  ✅ Is member: ${isMember}`);

    console.log("✅ All tests completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🚀 EXTENSION EXPORT - Ultra Simple
// ===================================================================

export default {
  onload: async () => {
    console.log("🔐 Ultra Minimal User Authentication starting...");

    // Register our utilities if platform exists
    if (window.RoamExtensionSuite?.registerUtility) {
      const utilities = {
        getAuthenticatedUser,
        isUserAuthenticated,
        getGraphMembers,
        addGraphMember,
        isGraphMember,
        getGraphMemberCount,
        showAuthenticationStatus,
        runBasicTests,
      };

      Object.entries(utilities).forEach(([name, utility]) => {
        window.RoamExtensionSuite.registerUtility(name, utility);
        console.log(`🔧 Registered: ${name}`);
      });
    }

    // Get current user
    const user = getAuthenticatedUser();
    console.log(`👤 Current user: ${user.displayName} (${user.method})`);

    // Try to add user to graph members (but don't fail if it doesn't work)
    if (user.displayName && user.displayName !== "undefined") {
      try {
        await addGraphMember(user.displayName);
      } catch (error) {
        console.warn("Could not add user to graph members:", error);
      }
    }

    // Register commands if possible
    try {
      const commands = [
        {
          label: "Auth: Show Status",
          callback: showAuthenticationStatus,
        },
        {
          label: "Auth: Run Tests",
          callback: runBasicTests,
        },
      ];

      commands.forEach(({ label, callback }) => {
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: `Extension 2: ${label}`,
          callback,
        });
      });
    } catch (error) {
      console.warn("Could not register commands:", error);
    }

    // Success report
    const memberCount = getGraphMemberCount();
    console.log("✅ Ultra Minimal User Authentication loaded!");
    console.log(`👤 Welcome ${user.displayName}!`);
    console.log(`📋 Graph has ${memberCount} members`);
    console.log('💡 Try: Cmd+P → "Extension 2: Auth: Show Status"');
  },

  onunload: () => {
    console.log("🔐 Ultra Minimal User Authentication unloading...");
  },
};
