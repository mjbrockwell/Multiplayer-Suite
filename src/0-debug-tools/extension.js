// ===================================================================
// Extension 0: Dynamic Debug Platform - Swappable Intelligence
// Focus: Extension 6 (User Directory) debugging module
// Professional debugging interface for current development priorities
// ===================================================================

// ===================================================================
// 🔍 EXTENSION 6 DEBUG MODULE - User Directory Diagnostics
// ===================================================================

/**
 * Comprehensive Extension 6 debugging dashboard
 */
const createUserDirectoryDebugger = () => {
  const directoryDebugger = {
    name: "User Directory Debugger",
    description:
      "Debug Extension 6: User Directory + Timezones data collection and UI",

    async runDiagnostics() {
      console.group("🔍 Extension 6: User Directory Debug Diagnostics");

      try {
        const platform = window.RoamExtensionSuite;

        // Test 1: Platform Dependencies Check
        console.log("=== DEPENDENCY CHECK ===");
        const requiredDeps = [
          "foundation-registry",
          "utility-library",
          "user-authentication",
          "configuration-manager",
          "user-directory",
        ];
        requiredDeps.forEach((dep) => {
          const status = platform.has(dep) ? "✅" : "❌";
          console.log(`${status} ${dep}: ${platform.has(dep)}`);
        });

        // Test 2: Extension 2 Data Sources
        console.log("\n=== EXTENSION 2 DATA SOURCES ===");
        const getGraphMembers = platform.getUtility("getGraphMembers");
        const getAuthenticatedUser = platform.getUtility(
          "getAuthenticatedUser"
        );

        if (getGraphMembers) {
          const members = getGraphMembers();
          console.log(`📋 Graph Members (${members.length}):`, members);
        } else {
          console.log("❌ getGraphMembers utility not found");
        }

        if (getAuthenticatedUser) {
          const user = getAuthenticatedUser();
          console.log("👤 Current User:", user);
        } else {
          console.log("❌ getAuthenticatedUser utility not found");
        }

        // Test 3: Universal Parser Testing
        console.log("\n=== UNIVERSAL PARSER TESTING ===");
        const findDataValue = platform.getUtility("findDataValue");
        const getPageUidByTitle = platform.getUtility("getPageUidByTitle");

        if (findDataValue && getPageUidByTitle) {
          // Test graph members page
          const membersPageUid = getPageUidByTitle("roam/graph members");
          console.log(`📄 Members Page UID: ${membersPageUid}`);

          if (membersPageUid) {
            const directoryData = findDataValue(membersPageUid, "Directory");
            console.log("📋 Directory:: data:", directoryData);
          } else {
            console.log("❌ roam/graph members page not found");
          }

          // Test current user page
          const currentUser = getAuthenticatedUser();
          if (currentUser) {
            const userPageUid = getPageUidByTitle(currentUser.displayName);
            console.log(
              `👤 User Page UID (${currentUser.displayName}): ${userPageUid}`
            );

            if (userPageUid) {
              const testFields = [
                "Avatar",
                "Location",
                "Role",
                "Timezone",
                "About Me",
              ];
              testFields.forEach((field) => {
                const value = findDataValue(userPageUid, field);
                console.log(`  ${field}: ${value || "Not found"}`);
              });
            }
          }
        } else {
          console.log("❌ Universal parser utilities not found");
        }

        // Test 4: Extension 6 Services
        console.log("\n=== EXTENSION 6 SERVICES ===");
        const directoryServices = [
          "getUserProfileData",
          "getAllUserProfiles",
          "showUserDirectoryModal",
          "checkProfileCompletion",
          "timezoneManager",
        ];

        directoryServices.forEach((service) => {
          const available = platform.getUtility(service) ? "✅" : "❌";
          console.log(`${available} ${service}`);
        });

        // Test 5: Live Data Collection
        console.log("\n=== LIVE DATA COLLECTION TEST ===");
        const getUserProfileData = platform.getUtility("getUserProfileData");
        const getAllUserProfiles = platform.getUtility("getAllUserProfiles");

        if (getUserProfileData && currentUser) {
          console.log("Testing getUserProfileData...");
          const profileData = await getUserProfileData(currentUser.displayName);
          console.log("Profile Data:", profileData);
        }

        if (getAllUserProfiles) {
          console.log("Testing getAllUserProfiles...");
          const allProfiles = await getAllUserProfiles();
          console.log(`All Profiles (${allProfiles.length}):`, allProfiles);
        }

        // Test 6: Page Detection
        console.log("\n=== PAGE DETECTION TEST ===");
        const getCurrentPageTitle = platform.getUtility("getCurrentPageTitle");
        const isGraphMember = platform.getUtility("isGraphMember");

        if (getCurrentPageTitle) {
          const currentPage = getCurrentPageTitle();
          console.log(`📄 Current Page: ${currentPage}`);

          if (currentPage && isGraphMember) {
            const isMember = isGraphMember(currentPage);
            console.log(`👥 Is Graph Member: ${isMember}`);
          }
        }

        console.log("✅ Diagnostics completed");
      } catch (error) {
        console.error("❌ Diagnostic error:", error);
      }

      console.groupEnd();
    },

    async createTestData() {
      console.group("🧪 Creating Test Data for Extension 6");

      try {
        const platform = window.RoamExtensionSuite;
        const createPageIfNotExists = platform.getUtility(
          "createPageIfNotExists"
        );
        const setDataValue = platform.getUtility("setDataValue");
        const getAuthenticatedUser = platform.getUtility(
          "getAuthenticatedUser"
        );

        if (!createPageIfNotExists || !setDataValue) {
          console.log("❌ Required utilities not found");
          return;
        }

        const currentUser = getAuthenticatedUser();
        if (!currentUser) {
          console.log("❌ Current user not found");
          return;
        }

        // Create/ensure graph members page exists
        console.log("📋 Creating/updating graph members directory...");
        const membersPageUid = await createPageIfNotExists(
          "roam/graph members"
        );

        if (membersPageUid) {
          // Add current user to directory
          await setDataValue(
            membersPageUid,
            "Directory",
            [currentUser.displayName],
            true
          );
          console.log(`✅ Added ${currentUser.displayName} to graph members`);
        }

        // Create/update user profile page
        console.log("👤 Creating/updating user profile...");
        const userPageUid = await createPageIfNotExists(
          currentUser.displayName
        );

        if (userPageUid) {
          // Add sample profile data
          await setDataValue(
            userPageUid,
            "Avatar",
            "https://api.dicebear.com/7.x/initials/svg?seed=" +
              currentUser.displayName,
            true
          );
          await setDataValue(
            userPageUid,
            "Location",
            "Oakland, California, US",
            true
          );
          await setDataValue(userPageUid, "Role", "Extension Developer", true);
          await setDataValue(
            userPageUid,
            "Timezone",
            "America/Los_Angeles",
            true
          );
          await setDataValue(
            userPageUid,
            "About Me",
            "Building professional Roam extensions",
            true
          );

          console.log(
            `✅ Created sample profile data for ${currentUser.displayName}`
          );
        }

        console.log("🎯 Test data creation completed!");
        console.log(
          "💡 Try running diagnostics again or opening the directory modal"
        );
      } catch (error) {
        console.error("❌ Test data creation failed:", error);
      }

      console.groupEnd();
    },

    async testDirectoryModal() {
      console.log("🧪 Testing Directory Modal...");

      const platform = window.RoamExtensionSuite;
      const showUserDirectoryModal = platform.getUtility(
        "showUserDirectoryModal"
      );

      if (showUserDirectoryModal) {
        await showUserDirectoryModal();
        console.log("✅ Directory modal launched");
      } else {
        console.log("❌ showUserDirectoryModal not found");
      }
    },

    async testNavigationButtons() {
      console.log("🧪 Testing Navigation Buttons...");

      const platform = window.RoamExtensionSuite;
      const addNavigationButtons = platform.getUtility("addNavigationButtons");

      if (addNavigationButtons) {
        addNavigationButtons();
        console.log("✅ Navigation buttons triggered");
        console.log("💡 Check top-right corner of page for buttons");
      } else {
        console.log("❌ addNavigationButtons not found");
      }
    },

    inspectCurrentState() {
      console.group("🔍 Current State Inspection");

      // Check current page URL and title
      console.log("URL:", window.location.href);

      // Check for existing navigation buttons
      const existingButtons = document.querySelectorAll(
        ".user-directory-nav-button"
      );
      console.log(`Existing nav buttons: ${existingButtons.length}`);

      // Check for modal elements
      const existingModal = document.getElementById("user-directory-modal");
      console.log(`Directory modal exists: ${!!existingModal}`);

      // Check platform status
      if (window.RoamExtensionSuite) {
        console.log("Platform status:", window.RoamExtensionSuite.getStatus());
      }

      console.groupEnd();
    },
  };

  return directoryDebugger;
};

// ===================================================================
// 🎯 DEBUG INTERFACE CREATION - Professional Debug UI
// ===================================================================

/**
 * Create professional debug interface
 */
const createDebugInterface = () => {
  // Remove existing debug interface
  const existing = document.getElementById("extension-debug-interface");
  if (existing) existing.remove();

  const debugInterface = document.createElement("div");
  debugInterface.id = "extension-debug-interface";
  debugInterface.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 320px;
    background: white;
    border: 2px solid #137cbd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const userDirectoryDebugger = createUserDirectoryDebugger();

  debugInterface.innerHTML = `
    <div style="
      background: #137cbd;
      color: white;
      padding: 12px 16px;
      border-radius: 6px 6px 0 0;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span>🛠️ Extension 6 Debug Platform</span>
      <button onclick="this.closest('#extension-debug-interface').remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    </div>
    
    <div style="padding: 16px;">
      <div style="margin-bottom: 12px; font-size: 14px; color: #666;">
        Extension 6: User Directory + Timezones
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="window.debugUserDirectory.runDiagnostics()" style="
          background: #059669;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🔍 Run Full Diagnostics
        </button>
        
        <button onclick="window.debugUserDirectory.createTestData()" style="
          background: #d97706;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🧪 Create Test Data
        </button>
        
        <button onclick="window.debugUserDirectory.testDirectoryModal()" style="
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          📋 Test Directory Modal
        </button>
        
        <button onclick="window.debugUserDirectory.testNavigationButtons()" style="
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🧭 Test Navigation Buttons
        </button>
        
        <button onclick="window.debugUserDirectory.inspectCurrentState()" style="
          background: #374151;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        ">
          🔍 Inspect Current State
        </button>
      </div>
      
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">
        💡 Open browser console (F12) to see debug output
      </div>
    </div>
  `;

  document.body.appendChild(debugInterface);

  // Make debugger globally accessible
  window.debugUserDirectory = userDirectoryDebugger;

  // Register for cleanup
  window._extensionRegistry.elements.push(debugInterface);

  console.log("🛠️ Extension 6 Debug Platform ready!");
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Debug Platform
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🛠️ Extension 0: Debug Platform starting...");

    // ✅ VERIFY FOUNDATION
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    // 🎯 CREATE DEBUG INTERFACE
    setTimeout(createDebugInterface, 1000); // Small delay to ensure page is ready

    // 📝 REGISTER DEBUG COMMANDS
    const commands = [
      {
        label: "Debug: Show Extension 6 Debug Platform",
        callback: createDebugInterface,
      },
      {
        label: "Debug: Run Extension 6 Diagnostics",
        callback: async () => {
          if (window.debugUserDirectory) {
            await window.debugUserDirectory.runDiagnostics();
          } else {
            console.log(
              'Debug platform not ready - run "Debug: Show Extension 6 Debug Platform" first'
            );
          }
        },
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER WITH PLATFORM
    const platform = window.RoamExtensionSuite;
    platform.register(
      "debug-platform",
      {
        createDebugInterface: createDebugInterface,
        debuggers: { userDirectory: createUserDirectoryDebugger },
        version: "0.1.0",
      },
      {
        name: "Debug Platform",
        description:
          "Swappable debug tools focused on current development priorities",
        version: "0.1.0",
        dependencies: ["foundation-registry"],
      }
    );

    console.log("✅ Extension 0: Debug Platform loaded!");
    console.log("🛠️ Debug interface will appear in top-left corner");
    console.log(
      '💡 Also available via Cmd+P → "Debug: Show Extension 6 Debug Platform"'
    );
  },

  onunload: () => {
    console.log("🛠️ Extension 0: Debug Platform unloading...");

    // Clean up debug interface
    const debugInterface = document.getElementById("extension-debug-interface");
    if (debugInterface) debugInterface.remove();

    // Clean up global debugger
    delete window.debugUserDirectory;

    console.log("✅ Extension 0: Debug Platform cleanup complete!");
  },
};
