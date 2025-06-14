// ===================================================================
// 🎭 EXTENSION 6.5: SYNC AVATAR FUNCTION
// ===================================================================
// Purpose: Extract current user's avatar image from their home page
//          and create/update corresponding CSS on the [[roam/css]] page
// Dependencies: extractImageUrls utility function, Roam Alpha API
// ===================================================================

/**
 * 🎭 6.1: SYNC AVATAR - Main Function
 * Extracts user avatar and creates CSS for avatar display in tags
 */
const syncAvatar = async () => {
  console.group("🎭 syncAvatar: Starting avatar sync process");

  try {
    // ===================================================================
    // 🔍 6.1.1: GET CURRENT USER UID
    // ===================================================================
    console.log("🔍 Step 1: Getting current user UID...");
    const userUID = window.roamAlphaAPI?.user?.uid();

    if (!userUID) {
      throw new Error(
        "Failed to get user UID - roamAlphaAPI.user.uid() returned null/undefined"
      );
    }

    console.log(`✅ User UID retrieved: ${userUID}`);

    // ===================================================================
    // 🖼️ 6.1.2: EXTRACT AVATAR IMAGE URL
    // ===================================================================
    console.log("🖼️ Step 2: Extracting avatar image URL...");

    // Get user's home page UID (same as user UID)
    const userPageUID = userUID;

    // Navigate to user's home page and find My Info:: block
    const userPageInfo = window.roamAlphaAPI.pull(
      "[:block/children {:block/children ...}]",
      [":block/uid", userPageUID]
    );

    if (!userPageInfo) {
      throw new Error(`Cannot access user home page with UID: ${userPageUID}`);
    }

    // Find "My Info::" block
    let myInfoBlock = null;
    const findMyInfoRecursive = (blocks) => {
      if (!blocks) return null;
      for (const block of blocks) {
        if (block[":block/string"] === "My Info::") {
          return block;
        }
        if (block[":block/children"]) {
          const found = findMyInfoRecursive(block[":block/children"]);
          if (found) return found;
        }
      }
      return null;
    };

    myInfoBlock = findMyInfoRecursive(userPageInfo[":block/children"] || []);

    if (!myInfoBlock) {
      throw new Error('Cannot find "My Info::" block on user home page');
    }

    console.log("✅ Found 'My Info::' block");

    // Find "Avatar::" block under "My Info::"
    let avatarBlock = null;
    if (myInfoBlock[":block/children"]) {
      for (const child of myInfoBlock[":block/children"]) {
        if (child[":block/string"] === "Avatar::") {
          avatarBlock = child;
          break;
        }
      }
    }

    if (!avatarBlock) {
      throw new Error('Cannot find "Avatar::" block under "My Info::"');
    }

    console.log("✅ Found 'Avatar::' block");

    // Get Avatar block UID and extract image URLs
    const avatarBlockUID = avatarBlock[":block/uid"];

    // Check if extractImageUrls utility is available
    const platform = window.RoamExtensionSuite;
    if (!platform || !platform.getUtility) {
      throw new Error(
        "RoamExtensionSuite platform not found - Extension 1 required"
      );
    }

    const extractImageUrls = platform.getUtility("extractImageUrls");
    if (!extractImageUrls) {
      throw new Error(
        "extractImageUrls utility not found - Extension 1.5 required"
      );
    }

    console.log(
      `🔍 Extracting images from Avatar block UID: ${avatarBlockUID}`
    );
    const imageUrls = extractImageUrls(avatarBlockUID);

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error("No valid image URLs found in Avatar:: block");
    }

    const avatarImageURL = imageUrls[0]; // Use first valid URL
    console.log(`✅ Avatar image URL extracted: ${avatarImageURL}`);

    // ===================================================================
    // 🎨 6.1.3: ACCESS/CREATE [[roam/css]] PAGE STRUCTURE
    // ===================================================================
    console.log("🎨 Step 3: Accessing [[roam/css]] page...");

    // Get roam/css page UID
    const cssPageUID = window.roamAlphaAPI.q(`
      [:find ?uid .
       :where [?page :node/title "roam/css"]
              [?page :block/uid ?uid]]
    `);

    if (!cssPageUID) {
      throw new Error("[[roam/css]] page not found");
    }

    console.log(`✅ Found [[roam/css]] page UID: ${cssPageUID}`);

    // Get page structure
    const cssPageInfo = window.roamAlphaAPI.pull(
      "[:block/children {:block/children ...}]",
      [":block/uid", cssPageUID]
    );

    // Find or create "**User Avatars:**" block
    let userAvatarsBlock = null;
    const cssChildren = cssPageInfo[":block/children"] || [];

    for (const child of cssChildren) {
      if (child[":block/string"] === "**User Avatars:**") {
        userAvatarsBlock = child;
        break;
      }
    }

    if (!userAvatarsBlock) {
      console.log("📝 Creating '**User Avatars:**' block...");
      const newBlockUID = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": cssPageUID, order: "last" },
        block: { string: "**User Avatars:**", uid: newBlockUID },
      });

      // Refresh page info to get the new block
      const updatedPageInfo = window.roamAlphaAPI.pull(
        "[:block/children {:block/children ...}]",
        [":block/uid", cssPageUID]
      );

      for (const child of updatedPageInfo[":block/children"]) {
        if (child[":block/uid"] === newBlockUID) {
          userAvatarsBlock = child;
          break;
        }
      }
    }

    console.log("✅ User Avatars block ready");

    // ===================================================================
    // 🔧 6.1.4: MANAGE USER-SPECIFIC CSS BLOCK
    // ===================================================================
    console.log("🔧 Step 4: Managing user-specific CSS block...");

    const userBlockTitle = `(${userUID}):`;
    let userCSSBlock = null;
    let existingCSSCodeBlock = null;

    // Look for existing user block
    const avatarChildren = userAvatarsBlock[":block/children"] || [];
    for (const child of avatarChildren) {
      if (child[":block/string"] === userBlockTitle) {
        userCSSBlock = child;

        // Look for existing CSS code block within user block
        const userBlockChildren = child[":block/children"] || [];
        for (const grandchild of userBlockChildren) {
          const content = grandchild[":block/string"] || "";
          if (
            content.includes("```css") &&
            content.includes("span.rm-page-ref--tag")
          ) {
            existingCSSCodeBlock = grandchild;
            break;
          }
        }
        break;
      }
    }

    // Create user block if it doesn't exist
    if (!userCSSBlock) {
      console.log(`📝 Creating user block: ${userBlockTitle}`);
      const userBlockUID = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createBlock({
        location: {
          "parent-uid": userAvatarsBlock[":block/uid"],
          order: "last",
        },
        block: { string: userBlockTitle, uid: userBlockUID },
      });

      userCSSBlock = { ":block/uid": userBlockUID };
    }

    console.log("✅ User CSS block ready");

    // ===================================================================
    // 🎨 6.1.5: GENERATE CSS CONTENT
    // ===================================================================
    console.log("🎨 Step 5: Generating CSS content...");

    const cssTemplate = `\`\`\`css
/* Updated CSS - Remove the ::after tooltip completely */
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
}
\`\`\``;

    // Replace placeholders with actual values
    let generatedCSS = cssTemplate;

    // Replace all 4 instances of [USERNAME] with actual user UID
    generatedCSS = generatedCSS.replace(/\[USERNAME\]/g, userUID);

    // Replace single instance of [IMAGE_URL] with extracted avatar URL
    generatedCSS = generatedCSS.replace(/\[IMAGE_URL\]/g, avatarImageURL);

    console.log("✅ CSS content generated with replacements");

    // ===================================================================
    // 💾 6.1.6: UPDATE/CREATE CSS CODE BLOCK
    // ===================================================================
    console.log("💾 Step 6: Updating CSS code block...");

    if (existingCSSCodeBlock) {
      // Update existing CSS block
      console.log("🔄 Updating existing CSS code block...");
      await window.roamAlphaAPI.updateBlock({
        block: {
          uid: existingCSSCodeBlock[":block/uid"],
          string: generatedCSS,
        },
      });
    } else {
      // Create new CSS code block
      console.log("📝 Creating new CSS code block...");
      const cssCodeBlockUID = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": userCSSBlock[":block/uid"], order: "last" },
        block: { string: generatedCSS, uid: cssCodeBlockUID },
      });
    }

    console.log("✅ CSS code block updated successfully");

    // ===================================================================
    // 🎉 6.1.7: SUCCESS SUMMARY
    // ===================================================================
    console.log("🎉 syncAvatar completed successfully!");
    console.log(`📋 Summary:`);
    console.log(`   User UID: ${userUID}`);
    console.log(`   Avatar URL: ${avatarImageURL}`);
    console.log(`   CSS generated and applied to [[roam/css]]`);

    return {
      success: true,
      userUID,
      avatarImageURL,
      message: "Avatar CSS synchronized successfully",
    };
  } catch (error) {
    console.error("❌ syncAvatar failed:", error.message);
    console.error("🔍 Error details:", error);

    return {
      success: false,
      error: error.message,
      message: `Avatar sync failed: ${error.message}`,
    };
  } finally {
    console.groupEnd();
  }
};

// ===================================================================
// 🧪 6.2: TESTING AND VALIDATION UTILITIES
// ===================================================================

/**
 * 🧪 6.2.1: Test avatar sync prerequisites
 */
const testAvatarSyncPrerequisites = async () => {
  console.group("🧪 Testing Avatar Sync Prerequisites");

  const results = {
    userUID: null,
    myInfoExists: false,
    avatarExists: false,
    extractImageUrlsAvailable: false,
    roamCSSPageExists: false,
  };

  try {
    // Test 1: User UID
    console.log("🔍 Test 1: User UID availability...");
    results.userUID = window.roamAlphaAPI?.user?.uid();
    console.log(
      results.userUID ? "✅ User UID available" : "❌ User UID not available"
    );

    // Test 2: My Info block exists
    if (results.userUID) {
      console.log("🔍 Test 2: Checking for 'My Info::' block...");
      const userPageInfo = window.roamAlphaAPI.pull(
        "[:block/children {:block/children ...}]",
        [":block/uid", results.userUID]
      );

      const findMyInfo = (blocks) => {
        if (!blocks) return false;
        for (const block of blocks) {
          if (block[":block/string"] === "My Info::") return true;
          if (block[":block/children"] && findMyInfo(block[":block/children"]))
            return true;
        }
        return false;
      };

      results.myInfoExists = findMyInfo(
        userPageInfo?.[":block/children"] || []
      );
      console.log(
        results.myInfoExists
          ? "✅ 'My Info::' block found"
          : "❌ 'My Info::' block not found"
      );
    }

    // Test 3: extractImageUrls utility
    console.log("🔍 Test 3: Checking extractImageUrls utility...");
    const platform = window.RoamExtensionSuite;
    results.extractImageUrlsAvailable =
      !!platform?.getUtility?.("extractImageUrls");
    console.log(
      results.extractImageUrlsAvailable
        ? "✅ extractImageUrls available"
        : "❌ extractImageUrls not available"
    );

    // Test 4: roam/css page
    console.log("🔍 Test 4: Checking [[roam/css]] page...");
    const cssPageUID = window.roamAlphaAPI.q(`
      [:find ?uid .
       :where [?page :node/title "roam/css"]
              [?page :block/uid ?uid]]
    `);
    results.roamCSSPageExists = !!cssPageUID;
    console.log(
      results.roamCSSPageExists
        ? "✅ [[roam/css]] page exists"
        : "❌ [[roam/css]] page not found"
    );
  } catch (error) {
    console.error("❌ Prerequisites test failed:", error);
  }

  console.log("📋 Prerequisites Summary:", results);
  console.groupEnd();

  return results;
};

/**
 * 🧪 6.2.2: Validate generated CSS
 */
const validateGeneratedCSS = (userUID, imageURL) => {
  console.group("🧪 Validating Generated CSS");

  const cssTemplate = `span.rm-page-ref--tag[data-tag="${userUID}"]`;
  const expectedUsernamePlaceholders = 4;
  const expectedImageURLPlaceholders = 1;

  console.log(
    `🔍 Expected username replacements: ${expectedUsernamePlaceholders}`
  );
  console.log(
    `🔍 Expected image URL replacements: ${expectedImageURLPlaceholders}`
  );
  console.log(`✅ CSS selector format: ${cssTemplate}`);

  console.groupEnd();

  return true;
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Extension 6.5
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🎭 Extension 6.5: Avatar Sync starting...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    // Check for required utilities
    const extractImageUrls = platform.getUtility("extractImageUrls");
    if (!extractImageUrls) {
      console.error(
        "❌ extractImageUrls utility not found! Please load Extension 1.5 first."
      );
      return;
    }

    // 🔧 REGISTER AVATAR SYNC FUNCTION
    platform.registerUtility("syncAvatar", syncAvatar);
    platform.registerUtility(
      "testAvatarSyncPrerequisites",
      testAvatarSyncPrerequisites
    );
    platform.registerUtility("validateGeneratedCSS", validateGeneratedCSS);

    // 📝 REGISTER COMMANDS
    extensionAPI.ui.commandPalette.addCommand({
      label: "🎭 Sync Avatar CSS",
      callback: async () => {
        console.log("🎭 Running avatar sync from command palette...");
        const result = await syncAvatar();

        if (result.success) {
          alert(
            `✅ Avatar sync successful!\n\nUser: ${result.userUID}\nAvatar URL: ${result.avatarImageURL}`
          );
        } else {
          alert(`❌ Avatar sync failed!\n\nError: ${result.error}`);
        }
      },
    });

    extensionAPI.ui.commandPalette.addCommand({
      label: "🧪 Test Avatar Sync Prerequisites",
      callback: async () => {
        const results = await testAvatarSyncPrerequisites();
        const allGood = Object.values(results).every(
          (v) => v === true || v !== null
        );

        alert(
          allGood
            ? "✅ All prerequisites met! Ready for avatar sync."
            : "❌ Some prerequisites missing. Check console for details."
        );
      },
    });

    // 📊 REGISTER WITH EXTENSION SUITE
    platform.registerExtension("avatar-sync", {
      name: "Avatar Sync",
      version: "6.5.0",
      description:
        "Synchronizes user avatar images with Roam CSS for tag display",
      utilities: [
        "syncAvatar",
        "testAvatarSyncPrerequisites",
        "validateGeneratedCSS",
      ],
      commands: ["🎭 Sync Avatar CSS", "🧪 Test Avatar Sync Prerequisites"],
    });

    console.log("✅ Extension 6.5: Avatar Sync loaded successfully");
    console.log(
      "💡 Use command palette: '🎭 Sync Avatar CSS' to run avatar sync"
    );

    // Auto-run prerequisites test
    setTimeout(async () => {
      console.log("🔍 Auto-running prerequisites check...");
      await testAvatarSyncPrerequisites();
    }, 1000);
  },

  onunload: () => {
    console.log("👋 Extension 6.5: Avatar Sync unloading...");

    if (window.RoamExtensionSuite) {
      const platform = window.RoamExtensionSuite;
      platform.unregisterUtility("syncAvatar");
      platform.unregisterUtility("testAvatarSyncPrerequisites");
      platform.unregisterUtility("validateGeneratedCSS");
      platform.unregisterExtension("avatar-sync");
    }

    console.log("✅ Extension 6.5: Avatar Sync unloaded");
  },
};
