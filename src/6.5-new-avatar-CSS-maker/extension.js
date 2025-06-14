// =================================================================
// EXTENSION 6.5 - COMPLETE AVATAR SYSTEM
// Roam Depot Extension for unified avatar deployment
// =================================================================

// Extension metadata and configuration
const extension = {
  extensionID: "multiuser-avatar-system",
  name: "Multiuser Avatar System",
  description: "Complete avatar system deployment for multiuser Roam graphs",
  authors: ["Extension Suite"],
  version: "6.5.0",
};

let extensionAPI = null;

// =================================================================
// EXTENSION LIFECYCLE FUNCTIONS
// =================================================================

function onload({ extensionAPI: api }) {
  console.log("🚀 Loading Extension 6.5 - Multiuser Avatar System");

  extensionAPI = api;

  // Check dependencies
  if (!window.RoamExtensionSuite) {
    console.log(
      "⚠️ RoamExtensionSuite not found - Extension 6.5 requires the Extension Suite to be loaded first"
    );
    return;
  }

  // Make main function globally accessible for debugging
  window.extension65_deployCompleteAvatarSystem =
    extension65_deployCompleteAvatarSystem;
  window.deploySyncAvatarFunction = deploySyncAvatarFunction;

  // Add command to run the avatar system deployment
  extensionAPI.ui.commandPalette.addCommand({
    label: "Deploy Complete Avatar System",
    callback: () => {
      console.log(
        "🎯 User triggered avatar system deployment from command palette"
      );
      extension65_deployCompleteAvatarSystem();
    },
  });

  // Auto-deploy on load (optional - you can remove this if you want manual triggering only)
  console.log("🔧 Auto-deploying avatar system on extension load...");
  setTimeout(() => {
    extension65_deployCompleteAvatarSystem();
  }, 1000); // Small delay to ensure everything is loaded

  console.log("✅ Extension 6.5 loaded successfully");
  console.log(
    "🧪 Debug: You can now run extension65_deployCompleteAvatarSystem() from console"
  );
}

function onunload() {
  console.log("🔄 Unloading Extension 6.5 - Multiuser Avatar System");

  // Cleanup global functions
  delete window.extension65_deployCompleteAvatarSystem;
  delete window.deploySyncAvatarFunction;

  // Cleanup tooltip intervals and observers
  try {
    // Clear any tooltip cleanup intervals
    Object.keys(window).forEach((key) => {
      if (key.startsWith("tooltipCleanupInterval_")) {
        clearInterval(window[key]);
        delete window[key];
      }
    });

    // Clear tooltip observers
    Object.keys(window).forEach((key) => {
      if (key.startsWith("bulletproofObserver_")) {
        if (window[key] && window[key].disconnect) {
          window[key].disconnect();
        }
        delete window[key];
      }
    });

    // Clean up any remaining tooltips
    const tooltips = document.querySelectorAll(".manual-instant-tooltip");
    tooltips.forEach((tooltip) => tooltip.remove());

    // Clear tooltip registry
    if (window.activeTooltips) {
      window.activeTooltips.clear();
    }

    console.log("🧹 Extension 6.5 cleanup completed");
  } catch (error) {
    console.log("⚠️ Error during Extension 6.5 cleanup:", error.message);
  }
}

// =================================================================
// MAIN DEPLOYMENT FUNCTION
// =================================================================

async function extension65_deployCompleteAvatarSystem() {
  console.log("🚀 STARTING Extension 6.5 - Complete Avatar System Deployment");
  console.log(
    "📋 This will deploy: syncAvatar function + ClojureScript component + mass button deployment + dynamic tooltips"
  );

  const results = {
    success: false,
    steps: {
      syncAvatarFunction: { status: "pending" },
      clojureScriptComponent: { status: "pending" },
      massButtonDeployment: { status: "pending" },
      tooltipSystem: { status: "pending" },
    },
    deployedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    componentBlockUid: null,
  };

  try {
    // =============================================================
    // STEP 1: Deploy syncAvatar Function ✅
    // =============================================================
    console.log("\n🔧 STEP 1: Deploying syncAvatar function...");

    try {
      await deploySyncAvatarFunction();
      results.steps.syncAvatarFunction = { status: "success" };
      console.log("✅ syncAvatar function deployed successfully");
    } catch (error) {
      results.steps.syncAvatarFunction = {
        status: "error",
        error: error.message,
      };
      console.log("❌ syncAvatar function deployment failed:", error.message);
      // Continue anyway - other parts might still work
    }

    // =============================================================
    // STEP 2: Deploy ClojureScript Component & Harvest UID ✅
    // =============================================================
    console.log(
      "\n🧩 STEP 2: Deploying ClojureScript component and harvesting UID..."
    );

    try {
      const componentResult = await deployAvatarSyncComponent();
      if (componentResult.success && componentResult.componentBlockUid) {
        results.componentBlockUid = componentResult.componentBlockUid;
        results.steps.clojureScriptComponent = {
          status: "success",
          componentBlockUid: componentResult.componentBlockUid,
          renderString: componentResult.renderString,
        };
        console.log(
          "✅ ClojureScript component deployed, UID harvested:",
          componentResult.componentBlockUid
        );
      } else {
        throw new Error("Component deployment succeeded but no UID harvested");
      }
    } catch (error) {
      results.steps.clojureScriptComponent = {
        status: "error",
        error: error.message,
      };
      console.log(
        "❌ ClojureScript component deployment failed:",
        error.message
      );
      // This is critical - can't proceed to mass deployment without UID
      throw new Error(
        "Cannot proceed to mass deployment without component UID"
      );
    }

    // =============================================================
    // STEP 3: Mass Deploy Buttons to All Users ✅
    // =============================================================
    console.log("\n👥 STEP 3: Mass deploying avatar buttons to all users...");

    try {
      const massDeployResult = await deployAvatarButtonsToAllUsers(
        results.componentBlockUid
      );
      results.steps.massButtonDeployment = {
        status: massDeployResult.success ? "success" : "partial",
        deployedCount: massDeployResult.deployedCount,
        skippedCount: massDeployResult.skippedCount,
        errorCount: massDeployResult.errorCount,
        deploymentResults: massDeployResult.deploymentResults,
      };
      results.deployedCount = massDeployResult.deployedCount;
      results.skippedCount = massDeployResult.skippedCount;
      results.errorCount = massDeployResult.errorCount;

      if (massDeployResult.success) {
        console.log(
          `✅ Mass deployment completed: ${massDeployResult.deployedCount} deployed, ${massDeployResult.skippedCount} skipped, ${massDeployResult.errorCount} errors`
        );
      } else {
        console.log(
          `⚠️ Mass deployment completed with issues: ${massDeployResult.error}`
        );
      }
    } catch (error) {
      results.steps.massButtonDeployment = {
        status: "error",
        error: error.message,
      };
      console.log("❌ Mass button deployment failed:", error.message);
      // Continue to tooltip setup anyway
    }

    // =============================================================
    // STEP 4: Setup Dynamic Tooltip System ✅
    // =============================================================
    console.log("\n💬 STEP 4: Setting up dynamic tooltip system...");

    try {
      await setupDynamicTooltipSystem();
      results.steps.tooltipSystem = { status: "success" };
      console.log("✅ Dynamic tooltip system activated");
    } catch (error) {
      results.steps.tooltipSystem = { status: "error", error: error.message };
      console.log("❌ Tooltip system setup failed:", error.message);
      // This is non-critical - main functionality still works
    }

    // =============================================================
    // FINAL SUCCESS EVALUATION ✅
    // =============================================================
    const criticalStepsSuccess =
      results.steps.syncAvatarFunction.status === "success" &&
      results.steps.clojureScriptComponent.status === "success";

    results.success = criticalStepsSuccess;

    if (results.success) {
      console.log("\n🎉 EXTENSION 6.5 DEPLOYMENT COMPLETE!");
      console.log("✅ Core avatar system is fully operational");
      console.log(
        `📊 Button deployment: ${results.deployedCount} deployed, ${results.skippedCount} skipped, ${results.errorCount} errors`
      );
      console.log(
        `🧪 To test: Add an image under your "Avatar::" block, then click the sync button on your user page`
      );
      console.log(`📝 Component UID: ${results.componentBlockUid}`);

      // =============================================================
      // AUTO-RUN SYNCAVATAR FOR IMMEDIATE SETUP ✅
      // =============================================================
      console.log("\n🚀 AUTO-RUNNING syncAvatar for immediate avatar setup...");

      if (typeof window.syncAvatar === "function") {
        try {
          const syncResult = await window.syncAvatar();
          if (syncResult.success) {
            console.log("🎉 AUTO-SYNC COMPLETE! Your avatar is now active!");
            console.log(
              `✅ Try typing #[[${syncResult.userDisplayName}]] to see your avatar`
            );
            console.log(
              "🔄 Use the button on your user page to update it anytime"
            );
          } else {
            console.log(
              "⚠️ Auto-sync completed with issues:",
              syncResult.error
            );
            console.log(
              "💡 You can still use the button on your user page to sync manually"
            );
          }
        } catch (autoSyncError) {
          console.log("⚠️ Auto-sync failed:", autoSyncError.message);
          console.log(
            "💡 You can still use the button on your user page to sync manually"
          );
        }
      } else {
        console.log("⚠️ syncAvatar function not available for auto-run");
        console.log("💡 Use the button on your user page to sync manually");
      }
    } else {
      console.log("\n⚠️ EXTENSION 6.5 DEPLOYMENT COMPLETED WITH ISSUES");
      console.log(
        "❌ Critical components failed - please check error messages above"
      );
    }

    return results;
  } catch (error) {
    console.log("\n💥 EXTENSION 6.5 DEPLOYMENT FAILED:", error.message);
    results.success = false;
    results.error = error.message;
    return results;
  }
}

// =================================================================
// COMPONENT 1: SYNCAVATAR FUNCTION DEPLOYER
// =================================================================

async function deploySyncAvatarFunction() {
  console.log("   🔧 Creating syncAvatar function...");

  async function deploySyncAvatarFunction() {
    console.log("   🔧 Creating syncAvatar function...");

    try {
      // Create the WORKING syncAvatar function
      window.syncAvatar = async function () {
        console.log("🚀 STARTING FULL syncAvatar - Clean Slate Version");

        try {
          // Get current user data
          const userUID = roamAlphaAPI.user.uid();
          const userInfo = roamAlphaAPI.pull("[*]", [":user/uid", userUID]);
          const userDisplayName = userInfo[":user/display-name"];

          const displayPage = userInfo[":user/display-page"];
          const pageDbId = displayPage[":db/id"];
          const fullPageData = roamAlphaAPI.pull("[*]", pageDbId);
          const homePageUid = fullPageData[":block/uid"];

          console.log("✅ User:", userDisplayName);
          console.log("✅ Home page UID:", homePageUid);

          // Extract fresh avatar image URL
          const platform = window.RoamExtensionSuite;
          const findNestedDataValuesExact = platform.getUtility(
            "findNestedDataValuesExact"
          );
          const myInfoData = findNestedDataValuesExact(homePageUid, "My Info");

          if (!myInfoData || !myInfoData.avatar) {
            throw new Error("No avatar found in My Info structure");
          }

          // Navigate to avatar block and extract image URL
          const myInfoChildren = roamAlphaAPI.data
            .q(
              `
                  [:find ?uid ?string ?order
                   :where 
                   [?parent :block/uid "${homePageUid}"]
                   [?parent :block/children ?child]
                   [?child :block/uid ?uid]
                   [?child :block/string ?string]
                   [?child :block/order ?order]]
                `
            )
            .sort((a, b) => a[2] - b[2]);

          const myInfoBlock = myInfoChildren.find(([uid, text]) =>
            text.toLowerCase().includes("my info")
          );

          const avatarParentChildren = roamAlphaAPI.data
            .q(
              `
                  [:find ?uid ?string ?order
                   :where 
                   [?parent :block/uid "${myInfoBlock[0]}"]
                   [?parent :block/children ?child]
                   [?child :block/uid ?uid]
                   [?child :block/string ?string]
                   [?child :block/order ?order]]
                `
            )
            .sort((a, b) => a[2] - b[2]);

          const avatarBlock = avatarParentChildren.find(([uid, text]) =>
            text.toLowerCase().includes("avatar")
          );

          const avatarChildren = roamAlphaAPI.data
            .q(
              `
                  [:find ?uid ?string ?order
                   :where 
                   [?parent :block/uid "${avatarBlock[0]}"]
                   [?parent :block/children ?child]
                   [?child :block/uid ?uid]
                   [?child :block/string ?string]
                   [?child :block/order ?order]]
                `
            )
            .sort((a, b) => a[2] - b[2]);

          const avatarChildUid = avatarChildren[0][0];
          const extractImageUrls = platform.getUtility("extractImageUrls");
          const imageUrls = extractImageUrls(avatarChildUid);
          const imageURL = imageUrls[0];

          console.log(
            "✅ Fresh image URL extracted:",
            imageURL.substring(0, 50) + "..."
          );

          // Clean slate CSS update
          const cascadeToBlock = platform.getUtility("cascadeToBlock");
          const parentBlockUid = await cascadeToBlock(
            "roam/css",
            ["**User Avatars:**", `${userDisplayName}:`],
            true
          );

          console.log("✅ CSS parent block:", parentBlockUid);

          // Delete all existing CSS blocks (CLEAN SLATE)
          const existingChildren = roamAlphaAPI.data.q(`
                  [:find ?uid ?string
                   :where 
                   [?parent :block/uid "${parentBlockUid}"]
                   [?parent :block/children ?child]
                   [?child :block/uid ?uid]
                   [?child :block/string ?string]]
                `);

          console.log(
            `🗑️  Deleting ${existingChildren.length} existing CSS blocks...`
          );

          // Delete all existing blocks
          for (const [blockUid, content] of existingChildren) {
            await roamAlphaAPI.data.block.delete({ block: { uid: blockUid } });
            console.log(`🗑️  Deleted: ${blockUid}`);
          }

          // Create fresh CSS with NEW image URL
          console.log("📝 Creating fresh CSS block with NEW image...");

          const cssTemplate = `/* Updated CSS - Complete Avatar Styling */
span.rm-page-ref--tag[data-tag="[USERNAME]"] {
    display: inline-flex !important;
    color: transparent !important;
    overflow: visible !important;
    width: 2.4rem !important;
    height: 2.4rem !important;
    border: solid 1.5px #555 !important;
    border-radius: 100% !important;
    transition: 0.2s !important;
    position: relative !important;
    vertical-align: middle !important;
    margin: 0 3px !important;
    background: none !important;
    cursor: pointer !important;
}
span.rm-page-ref--tag[data-tag="[USERNAME]"]::before {
    content: "" !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-image: url("[IMAGE_URL]") !important;
    background-position: center !important;
    background-size: cover !important;
    border-radius: 100% !important;
    transition: 0.2s !important;
}
span.rm-page-ref--tag[data-tag="[USERNAME]"]:hover {
    transform: scale(1.05) !important;
    border-color: #333 !important;
    overflow: visible !important;
}
span.rm-page-ref--tag[data-tag="[USERNAME]"]:hover::before {
    transform: scale(1.02) !important;
}`;

          const finalCSS = cssTemplate
            .replace(/\[USERNAME\]/g, userDisplayName)
            .replace(/\[IMAGE_URL\]/g, imageURL);

          const codeBlockContent = `\`\`\`css
${finalCSS}
\`\`\``;

          // Create ONE fresh block with NEW image
          await roamAlphaAPI.data.block.create({
            location: {
              "parent-uid": parentBlockUid,
              order: 0,
            },
            block: {
              string: codeBlockContent,
            },
          });

          console.log("✅ Fresh CSS block created with NEW image!");

          console.log("\n🎉 FULL SYNC COMPLETE!");
          console.log("✅ User:", userDisplayName);
          console.log("✅ Fresh Image URL:", imageURL.substring(0, 50) + "...");
          console.log(
            "🧪 Try typing #[[" +
              userDisplayName +
              "]] to see your UPDATED avatar!"
          );
          console.log("🧹 Old CSS blocks deleted, fresh block created!");

          return {
            success: true,
            userDisplayName,
            imageURL,
            clearedBlocks: existingChildren.length,
          };
        } catch (error) {
          console.log("\n❌ FULL SYNC FAILED:", error.message);
          console.log("Stack:", error.stack);
          return {
            success: false,
            error: error.message,
          };
        }
      };

      console.log("   ✅ syncAvatar function attached to window object");
      return true;
    } catch (functionCreationError) {
      console.log(
        "   ❌ Error creating syncAvatar function:",
        functionCreationError
      );
      return false;
    }
  }
  console.log("   ✅ syncAvatar function attached to window object");
}

// =================================================================
// COMPONENT 2: CLOJURESCRIPT COMPONENT DEPLOYER
// =================================================================

async function deployAvatarSyncComponent() {
  console.log("   🧩 Deploying ClojureScript component...");

  try {
    // =============================================================
    // STEP 1: Define the ClojureScript Component ✅
    // =============================================================
    const clojureScriptComponent = `(ns avatar-sync-button
  (:require
   [roam.datascript :as rd]
   [reagent.core :as r]))

(defn get-current-user-uid []
  "Get the current user's UID using roamAlphaAPI"
  (try
    (let [user-data (.. js/window -roamAlphaAPI -user (uid))]
      user-data)
    (catch js/Error e
      (.log js/console "Error getting user UID:" e)
      nil)))

(defn get-current-user-display-name [current-user-uid]
  "Get the current user's display name from their UID"
  (try
    (let [user-data (.. js/window -roamAlphaAPI (pull "[*]" #js [":user/uid" current-user-uid]))
          display-name (aget user-data ":user/display-name")]
      display-name)
    (catch js/Error e
      (.log js/console "Error getting user display name:" e)
      nil)))

(defn get-page-title-from-block [block-uid]
  "Get the page title from a block UID"
  (try
    (let [page-query (rd/q '[:find ?title .
                            :in $ ?uid
                            :where 
                            [?b :block/uid ?uid]
                            [?b :block/page ?p]
                            [?p :node/title ?title]]
                          block-uid)]
      page-query)
    (catch js/Error e
      (.log js/console "Error getting page title:" e)
      nil)))

(defn is-user-on-own-page? [current-user-uid page-title]
  "Check if the current user is viewing their own user page"
  (let [display-name (get-current-user-display-name current-user-uid)]
    (and current-user-uid 
         display-name
         page-title 
         (= display-name page-title))))

(defn call-sync-avatar []
  "Call the syncAvatar JavaScript function"
  (try
    (if (and js/window (.-syncAvatar js/window))
      (do
        (.log js/console "Calling syncAvatar function...")
        ((.-syncAvatar js/window)))
      (.log js/console "syncAvatar function not found on window object"))
    (catch js/Error e
      (.log js/console "Error calling syncAvatar:" e))))

(defn main [{:keys [block-uid]}]
  "Main component function"
  (let [current-user-uid (get-current-user-uid)
        page-title (get-page-title-from-block block-uid)
        show-button? (is-user-on-own-page? current-user-uid page-title)]
    
    (if show-button?
      [:div {:style {:display "inline-block" 
                     :margin-left "10px"
                     :vertical-align "middle"}}
       [:style "
         .avatar-sync-btn {
           background-color: #e6f3ff;
           color: navy;
           border: 1.5px solid navy;
           padding: 8px 16px;
           border-radius: 4px;
           cursor: pointer;
           font-size: 14px;
           font-weight: 500;
           transition: all 0.2s ease;
           box-shadow: 0 1px 3px rgba(0,0,139,0.1);
         }
         .avatar-sync-btn:hover {
           background-color: #d1e9ff;
           transform: translateY(-1px);
           box-shadow: 0 3px 8px rgba(0,0,139,0.2);
         }
         .avatar-sync-btn:active {
           transform: translateY(0);
           box-shadow: 0 1px 2px rgba(0,0,139,0.2);
         }"]
       [:button {:on-click call-sync-avatar
                 :class "avatar-sync-btn"
                 :title "Push this button to update your personal css on the [[roam/css]] page with the current contents of the block nested beneath your \\"Avatar:\\" block"}
        "click to sync my Avatar"]]
      ;; Don't render anything if user is not on their own page
      [:div {:style {:display "none"}}])))`;

    // =============================================================
    // STEP 2: Create Hierarchy in [[roam/render]] ✅
    // =============================================================
    const platform = window.RoamExtensionSuite;
    if (!platform) {
      throw new Error(
        "RoamExtensionSuite not found - please ensure extension suite is loaded"
      );
    }

    const cascadeToBlock = platform.getUtility("cascadeToBlock");
    if (!cascadeToBlock) {
      throw new Error("cascadeToBlock utility not found");
    }

    const parentBlockUid = await cascadeToBlock(
      "roam/render",
      [
        "**Components added by Extensions:**",
        "**Added by Multiuser Suite:**",
        "**User Avatar Sync Button**",
      ],
      true // createPage = true
    );

    if (!parentBlockUid) {
      throw new Error("Failed to create hierarchy in [[roam/render]]");
    }

    // =============================================================
    // STEP 3: Check for Existing Component ✅
    // =============================================================
    const existingChildren = roamAlphaAPI.data.q(`
          [:find ?uid ?string
           :where 
           [?parent :block/uid "${parentBlockUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]]
        `);

    // =============================================================
    // STEP 4: Create/Update Component Block ✅
    // =============================================================
    const codeBlockContent = `\`\`\`clojure
${clojureScriptComponent}
\`\`\``;

    if (existingChildren.length > 0) {
      // Update existing block
      const existingBlockUid = existingChildren[0][0];
      await roamAlphaAPI.data.block.update({
        block: {
          uid: existingBlockUid,
          string: codeBlockContent,
        },
      });
    } else {
      // Create new block
      await roamAlphaAPI.data.block.create({
        location: {
          "parent-uid": parentBlockUid,
          order: 0,
        },
        block: {
          string: codeBlockContent,
        },
      });
    }

    // =============================================================
    // STEP 5: Harvest Component Block UID ✅
    // =============================================================
    // Wait for Roam to process the block creation/update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Query for the component block UID
    const componentBlocks = roamAlphaAPI.data.q(`
          [:find ?uid ?string
           :where 
           [?parent :block/uid "${parentBlockUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]]
        `);

    // Find the block that contains our clojure code
    const componentBlock = componentBlocks.find(
      ([uid, text]) =>
        text.includes("```clojure") && text.includes("avatar-sync-button")
    );

    let componentBlockUid = null;
    if (componentBlock) {
      componentBlockUid = componentBlock[0];
    } else {
      throw new Error("Could not locate component block UID");
    }

    return {
      success: true,
      parentBlockUid,
      componentBlockUid,
      renderString: `{{roam/render: ((${componentBlockUid}))}}`,
      message: "Avatar Sync Component deployed successfully!",
    };
  } catch (error) {
    throw new Error(`Component deployment failed: ${error.message}`);
  }
}

// =================================================================
// COMPONENT 3: MASS BUTTON DEPLOYER
// =================================================================

async function deployAvatarButtonsToAllUsers(componentBlockUid) {
  console.log("   👥 Mass deploying avatar buttons...");

  if (!componentBlockUid) {
    throw new Error("No component UID provided for mass deployment");
  }

  let deployedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const deploymentResults = [];

  try {
    // =============================================================
    // STEP 1: Get Graph Members from Directory ✅
    // =============================================================
    // Find the roam/graph members page
    const membersPageQuery = roamAlphaAPI.data.q(`
          [:find ?uid
           :where 
           [?page :node/title "roam/graph members"]
           [?page :block/uid ?uid]]
        `);

    if (!membersPageQuery || membersPageQuery.length === 0) {
      throw new Error("[[roam/graph members]] page not found");
    }

    const membersPageUid = membersPageQuery[0][0];

    // Find Directory:: block
    const directoryBlockQuery = roamAlphaAPI.data.q(`
          [:find ?uid ?string
           :where 
           [?parent :block/uid "${membersPageUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]]
        `);

    const directoryBlock = directoryBlockQuery.find(([uid, text]) =>
      text.toLowerCase().includes("directory")
    );

    if (!directoryBlock) {
      throw new Error("Directory:: block not found in [[roam/graph members]]");
    }

    const directoryBlockUid = directoryBlock[0];

    // Get all member names from Directory:: children
    const memberQuery = roamAlphaAPI.data
      .q(
        `
          [:find ?uid ?string ?order
           :where 
           [?parent :block/uid "${directoryBlockUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]
           [?child :block/order ?order]]
        `
      )
      .sort((a, b) => a[2] - b[2]); // Sort by order

    const memberNames = memberQuery.map(([uid, text]) => text.trim());
    console.log(`   📋 Found ${memberNames.length} members to process`);

    // =============================================================
    // STEP 2: Deploy to Each Member ✅
    // =============================================================
    for (let i = 0; i < memberNames.length; i++) {
      const memberName = memberNames[i];

      try {
        // Find member's page
        const memberPageQuery = roamAlphaAPI.data.q(`
                  [:find ?uid
                   :where 
                   [?page :node/title "${memberName}"]
                   [?page :block/uid ?uid]]
                `);

        let memberPageUid;
        if (!memberPageQuery || memberPageQuery.length === 0) {
          // Create member page if it doesn't exist
          await roamAlphaAPI.data.page.create({
            page: { title: memberName },
          });

          // Wait for page creation and re-query
          await new Promise((resolve) => setTimeout(resolve, 300));
          const newPageQuery = roamAlphaAPI.data.q(`
                      [:find ?uid
                       :where 
                       [?page :node/title "${memberName}"]
                       [?page :block/uid ?uid]]
                    `);
          memberPageUid = newPageQuery[0][0];
        } else {
          memberPageUid = memberPageQuery[0][0];
        }

        // Find or create "My Info::" block
        let myInfoBlockUid = await findOrCreateMyInfoBlock(
          memberPageUid,
          memberName
        );

        // Find or create "Avatar::" block under "My Info::"
        let avatarBlockUid = await findOrCreateAvatarBlock(
          myInfoBlockUid,
          memberName
        );

        // Check if component already deployed
        const avatarBlockData = roamAlphaAPI.pull("[:block/string]", [
          ":block/uid",
          avatarBlockUid,
        ]);
        const currentText = avatarBlockData[":block/string"] || "";

        if (currentText.includes("{{roam/render:")) {
          skippedCount++;
          deploymentResults.push({
            member: memberName,
            status: "skipped",
            reason: "already deployed",
          });
        } else {
          // Append component to Avatar:: block
          const newText =
            currentText + ` {{roam/render: ((${componentBlockUid}))}}`;

          await roamAlphaAPI.data.block.update({
            block: {
              uid: avatarBlockUid,
              string: newText,
            },
          });

          deployedCount++;
          deploymentResults.push({
            member: memberName,
            status: "deployed",
            avatarBlockUid,
          });
        }

        // Small delay to avoid overwhelming Roam
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (memberError) {
        errorCount++;
        deploymentResults.push({
          member: memberName,
          status: "error",
          error: memberError.message,
        });
      }
    }

    return {
      success: true,
      deployedCount,
      skippedCount,
      errorCount,
      deploymentResults,
      message: `Deployment complete: ${deployedCount} deployed, ${skippedCount} skipped, ${errorCount} errors`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      deployedCount,
      skippedCount,
      errorCount,
    };
  }
}

// Helper functions for mass deployment
async function findOrCreateMyInfoBlock(pageUid, memberName) {
  const pageChildren = roamAlphaAPI.data
    .q(
      `
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `
    )
    .sort((a, b) => a[2] - b[2]);

  const myInfoBlock = pageChildren.find(([uid, text]) =>
    text.toLowerCase().includes("my info")
  );

  if (myInfoBlock) {
    return myInfoBlock[0];
  } else {
    await roamAlphaAPI.data.block.create({
      location: {
        "parent-uid": pageUid,
        order: 0,
      },
      block: {
        string: "My Info::",
      },
    });

    // Wait and re-query for the new block
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newPageChildren = roamAlphaAPI.data.q(`
          [:find ?uid ?string
           :where 
           [?parent :block/uid "${pageUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]]
        `);

    const newMyInfoBlock = newPageChildren.find(([uid, text]) =>
      text.toLowerCase().includes("my info")
    );

    return newMyInfoBlock[0];
  }
}

async function findOrCreateAvatarBlock(myInfoBlockUid, memberName) {
  const myInfoChildren = roamAlphaAPI.data
    .q(
      `
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${myInfoBlockUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `
    )
    .sort((a, b) => a[2] - b[2]);

  const avatarBlock = myInfoChildren.find(([uid, text]) =>
    text.toLowerCase().includes("avatar")
  );

  if (avatarBlock) {
    return avatarBlock[0];
  } else {
    await roamAlphaAPI.data.block.create({
      location: {
        "parent-uid": myInfoBlockUid,
        order: 0,
      },
      block: {
        string: "Avatar::",
      },
    });

    // Wait and re-query for the new block
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newMyInfoChildren = roamAlphaAPI.data.q(`
          [:find ?uid ?string
           :where 
           [?parent :block/uid "${myInfoBlockUid}"]
           [?parent :block/children ?child]
           [?child :block/uid ?uid]
           [?child :block/string ?string]]
        `);

    const newAvatarBlock = newMyInfoChildren.find(([uid, text]) =>
      text.toLowerCase().includes("avatar")
    );

    return newAvatarBlock[0];
  }
}

// =================================================================
// COMPONENT 4: DYNAMIC TOOLTIP SYSTEM
// =================================================================

async function setupDynamicTooltipSystem() {
  console.log("   💬 Setting up dynamic tooltip system...");

  // Get current user's display name for dynamic tooltips
  const userUID = roamAlphaAPI.user.uid();
  if (!userUID) {
    console.log(
      "   ⚠️ Cannot get user UID for tooltips - using generic system"
    );
    return;
  }

  const userInfo = roamAlphaAPI.pull("[*]", [":user/uid", userUID]);
  const userDisplayName = userInfo[":user/display-name"];
  if (!userDisplayName) {
    console.log(
      "   ⚠️ Cannot get user display name for tooltips - using generic system"
    );
    return;
  }

  console.log(`   📝 Setting up tooltips for user: ${userDisplayName}`);

  // Create the dynamic tooltip function
  const tooltipFunction = `
// ULTRA-AGGRESSIVE tooltip cleanup system for ${userDisplayName}
function createBulletproofTooltipsFor_${userDisplayName.replace(
    /\s+/g,
    "_"
  )}() {
    console.log("🛡️ Creating BULLETPROOF tooltips for ${userDisplayName}...");
    
    // Global tooltip registry for tracking
    window.activeTooltips = window.activeTooltips || new Set();
    
    // Global cleanup function
    function forceCleanupAllTooltips() {
        const orphanedTooltips = document.querySelectorAll('.manual-instant-tooltip');
        orphanedTooltips.forEach(tooltip => {
            tooltip.remove();
        });
        window.activeTooltips.clear();
    }
    
    // Aggressive cleanup timer - checks every 100ms
    if (!window.tooltipCleanupInterval_${userDisplayName.replace(
      /\s+/g,
      "_"
    )}) {
        window.tooltipCleanupInterval_${userDisplayName.replace(
          /\s+/g,
          "_"
        )} = setInterval(() => {
            const tooltips = document.querySelectorAll('.manual-instant-tooltip');
            tooltips.forEach(tooltip => {
                const isMouseOverAnyAvatar = document.querySelector('span.rm-page-ref--tag[data-tag="${userDisplayName}"]:hover');
                if (!isMouseOverAnyAvatar) {
                    tooltip.remove();
                }
            });
        }, 100);
    }
    
    const avatars = document.querySelectorAll('span.rm-page-ref--tag[data-tag="${userDisplayName}"]:not(.bulletproof-tooltip-added)');
    
    avatars.forEach((avatar, index) => {
        let tooltip = null;
        let isHovering = false;
        
        // INSTANT show function
        function showTooltip(e) {
            if (tooltip) return;
            
            isHovering = true;
            
            // Force cleanup any existing tooltips first
            forceCleanupAllTooltips();
            
            tooltip = document.createElement('div');
            tooltip.className = 'manual-instant-tooltip';
            tooltip.textContent = '${userDisplayName}';
            tooltip.setAttribute('data-avatar-index', index);
            
            // Blueprint-style appearance
            Object.assign(tooltip.style, {
                position: 'fixed',
                zIndex: '999999',
                backgroundColor: 'rgba(16, 22, 26, 0.9)',
                color: 'rgb(245, 248, 250)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: '400',
                lineHeight: '1.2',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 0 1px rgba(16, 22, 26, 0.1), 0 4px 8px rgba(16, 22, 26, 0.2)',
                transition: 'none',
                display: 'block'
            });
            
            document.body.appendChild(tooltip);
            window.activeTooltips.add(tooltip);
            
            // Position tooltip
            const avatarRect = avatar.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const left = avatarRect.left - tooltipRect.width - 8;
            const top = avatarRect.top + (avatarRect.height / 2) - (tooltipRect.height / 2);
            
            tooltip.style.left = Math.max(10, left) + 'px';
            tooltip.style.top = Math.max(10, top) + 'px';
        }
        
        // AGGRESSIVE hide function with multiple triggers
        function hideTooltip(e, reason = 'normal') {
            isHovering = false;
            
            // Add small delay to prevent flicker when moving between child elements
            setTimeout(() => {
                if (!isHovering && tooltip) {
                    tooltip.remove();
                    window.activeTooltips.delete(tooltip);
                    tooltip = null;
                }
            }, 10);
        }
        
        // Multiple event listeners for bulletproof cleanup
        avatar.addEventListener('mouseenter', showTooltip);
        avatar.addEventListener('mouseleave', (e) => hideTooltip(e, 'mouseleave'));
        avatar.addEventListener('click', (e) => hideTooltip(e, 'click'));
        avatar.addEventListener('blur', (e) => hideTooltip(e, 'blur'));
        
        // Additional aggressive cleanup triggers
        avatar.addEventListener('mouseout', (e) => {
            // Only hide if we're really leaving the element
            if (!avatar.contains(e.relatedTarget)) {
                hideTooltip(e, 'mouseout');
            }
        });
        
        // Mark as processed
        avatar.classList.add('bulletproof-tooltip-added');
    });
}

// Document-level cleanup triggers (backup safety net)
function setupGlobalCleanupTriggersFor_${userDisplayName.replace(
    /\s+/g,
    "_"
  )}() {
    // Cleanup on any scroll
    document.addEventListener('scroll', () => {
        const tooltips = document.querySelectorAll('.manual-instant-tooltip');
        if (tooltips.length > 0) {
            tooltips.forEach(tooltip => tooltip.remove());
            if (window.activeTooltips) window.activeTooltips.clear();
        }
    }, { passive: true, capture: true });
    
    // Cleanup on any click anywhere
    document.addEventListener('click', (e) => {
        // Don't cleanup if clicking on an avatar
        if (!e.target.closest('span.rm-page-ref--tag[data-tag="${userDisplayName}"]')) {
            const tooltips = document.querySelectorAll('.manual-instant-tooltip');
            if (tooltips.length > 0) {
                tooltips.forEach(tooltip => tooltip.remove());
                if (window.activeTooltips) window.activeTooltips.clear();
            }
        }
    }, { capture: true });
    
    // Cleanup on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const tooltips = document.querySelectorAll('.manual-instant-tooltip');
            if (tooltips.length > 0) {
                tooltips.forEach(tooltip => tooltip.remove());
                if (window.activeTooltips) window.activeTooltips.clear();
            }
        }
    });
    
    // Cleanup when page visibility changes (tab switch, etc.)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            const tooltips = document.querySelectorAll('.manual-instant-tooltip');
            if (tooltips.length > 0) {
                tooltips.forEach(tooltip => tooltip.remove());
                if (window.activeTooltips) window.activeTooltips.clear();
            }
        }
    });
}

// Clear existing and setup new system
function clearAndSetupBulletproofTooltipsFor_${userDisplayName.replace(
    /\s+/g,
    "_"
  )}() {
    // Clear existing tooltips and intervals
    const existingTooltips = document.querySelectorAll('.manual-instant-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
    
    if (window.tooltipCleanupInterval_${userDisplayName.replace(/\s+/g, "_")}) {
        clearInterval(window.tooltipCleanupInterval_${userDisplayName.replace(
          /\s+/g,
          "_"
        )});
        window.tooltipCleanupInterval_${userDisplayName.replace(
          /\s+/g,
          "_"
        )} = null;
    }
    
    // Remove existing classes
    const avatars = document.querySelectorAll('span.rm-page-ref--tag[data-tag="${userDisplayName}"]');
    avatars.forEach(avatar => {
        avatar.classList.remove('manual-instant-added', 'bulletproof-tooltip-added');
    });
    
    // Setup new bulletproof system
    setupGlobalCleanupTriggersFor_${userDisplayName.replace(/\s+/g, "_")}();
    createBulletproofTooltipsFor_${userDisplayName.replace(/\s+/g, "_")}();
}

// Run the bulletproof setup
clearAndSetupBulletproofTooltipsFor_${userDisplayName.replace(/\s+/g, "_")}();

// Observer for new avatars with cleanup
const bulletproofObserver_${userDisplayName.replace(
    /\s+/g,
    "_"
  )} = new MutationObserver(() => {
    // Cleanup any orphaned tooltips first
    const orphaned = document.querySelectorAll('.manual-instant-tooltip');
    orphaned.forEach(tooltip => {
        const hasMatchingAvatar = document.querySelector('span.rm-page-ref--tag[data-tag="${userDisplayName}"]:hover');
        if (!hasMatchingAvatar) {
            tooltip.remove();
        }
    });
    
    // Then setup new tooltips
    setTimeout(createBulletproofTooltipsFor_${userDisplayName.replace(
      /\s+/g,
      "_"
    )}, 50);
});

bulletproofObserver_${userDisplayName.replace(
    /\s+/g,
    "_"
  )}.observe(document.body, { childList: true, subtree: true });

console.log("🛡️ BULLETPROOF tooltips with aggressive cleanup activated for ${userDisplayName}!");
`;

  // Execute the tooltip function
  eval(tooltipFunction);

  console.log(`   ✅ Dynamic tooltip system activated for ${userDisplayName}`);
}

// =================================================================
// EXTENSION EXPORT
// =================================================================

// Export for Roam Depot
window.RoamLazy = window.RoamLazy || {};
window.RoamLazy.MultiuserAvatarSystem = {
  onload,
  onunload,
  extension,
};

// =================================================================
// AUTO-EXECUTION (since Roam isn't calling onload automatically)
// =================================================================

console.log("🚀 Extension 6.5 loaded - checking for auto-execution...");

// Wait for dependencies and auto-execute
function autoExecuteExtension() {
  if (window.RoamExtensionSuite && window.roamAlphaAPI) {
    console.log("✅ Dependencies ready - auto-executing extension...");

    // Call onload manually with mock API
    onload({
      extensionAPI: {
        ui: {
          commandPalette: {
            addCommand: (cmd) => {
              console.log("✅ Auto-registered command:", cmd.label);
              window.autoAvatarCommand = cmd.callback;
            },
          },
        },
      },
    });

    console.log("🎉 Extension 6.5 auto-execution complete!");
  } else {
    console.log("⏳ Dependencies not ready, retrying in 1 second...");
    setTimeout(autoExecuteExtension, 1000);
  }
}

// Start auto-execution after a brief delay
setTimeout(autoExecuteExtension, 500);
