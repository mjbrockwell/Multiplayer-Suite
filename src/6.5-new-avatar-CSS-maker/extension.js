// Extension 6.5 Avatar Maker - Rebuilt with Extension 1.5 Utilities
// Features: Race condition-free block creation, universal image extraction, exact data parsing

window.RoamExtensionSuite = window.RoamExtensionSuite || {};

window.RoamExtensionSuite.extensions =
  window.RoamExtensionSuite.extensions || {};

window.RoamExtensionSuite.extensions.avatarMaker = {
  /**
   * Main entry point for syncing user avatar
   * @param {string} username - The username to sync avatar for
   * @returns {Promise<boolean>} - Success status
   */
  async syncAvatar(username) {
    console.log(`🎯 Starting avatar sync for: ${username}`);

    try {
      // Get fresh user data using new utilities
      const user = await this.getUserData(username);
      if (!user) {
        console.log(`❌ No user data found for ${username}`);
        return false;
      }

      // Extract avatar URL using universal image extraction
      const avatarURL = await this.extractAvatarURL(user);
      if (!avatarURL) {
        console.log(`❌ No avatar URL found for ${username}`);
        return false;
      }

      console.log(`✅ Found avatar URL for ${username}: ${avatarURL}`);

      // Generate CSS
      const css = this.generateAvatarCSS(username, avatarURL);

      // Apply to roam/css using bulletproof cascade
      await this.applyAvatarCSS(username, css);

      console.log(`🎉 Avatar sync completed for ${username}`);
      return true;
    } catch (error) {
      console.error(`💥 Error syncing avatar for ${username}:`, error);
      return false;
    }
  },

  /**
   * Get user data using new utilities
   * @param {string} username - The username to get data for
   * @returns {Promise<Object>} - User data object
   */
  async getUserData(username) {
    // Try to get user data from their main page
    const pageUid = await window.roamAlphaAPI.q(`[:find ?uid :where [?uid :node/title "${username}"]]`);
    if (!pageUid?.[0]?.[0]) return null;

    // Use exact data extraction for user info
    const userData = {
      username,
      avatar: await this.findDataValueExact(pageUid[0][0], "Avatar"),
      displayName: await this.findDataValueExact(pageUid[0][0], "Display Name"),
      // Add any other user data fields you want to track
    };

    return userData;
  },

  /**
   * Extract avatar URL using universal image extraction
   * @param {Object} user - User data object
   * @returns {Promise<string>} - Avatar URL
   */
  async extractAvatarURL(user) {
    // Strategy 1: Check user's main page for Avatar data
    if (user.avatar) {
      const images = await this.extractImageUrls(user.avatar);
      if (images.length > 0) return images[0];
    }

    // Strategy 2: Check user preferences page
    const prefsPageUid = await window.roamAlphaAPI.q(
      `[:find ?uid :where [?uid :node/title "${user.username}/preferences"]]`
    );
    if (prefsPageUid?.[0]?.[0]) {
      const prefsAvatar = await this.findDataValueExact(prefsPageUid[0][0], "Avatar");
      if (prefsAvatar) {
        const images = await this.extractImageUrls(prefsAvatar);
        if (images.length > 0) return images[0];
      }
    }

    // Strategy 3: Check platform user data
    const currentUser = await this.getCurrentUser();
    if (currentUser?.username === user.username || currentUser?.displayName === user.username) {
      const platformAvatar = currentUser.photoURL || currentUser.photoUrl;
      if (platformAvatar) {
        const images = await this.extractImageUrls(platformAvatar);
        if (images.length > 0) return images[0];
      }
    }

    return null;
  },

  /**
   * Generate CSS for the avatar
   * @param {string} username - The username
   * @param {string} avatarURL - The avatar URL
   * @returns {string} - Generated CSS
   */
  generateAvatarCSS(username, avatarURL) {
    return `
/* Avatar CSS for ${username} */
.roam-avatar[data-username="${username}"] {
  background-image: url("${avatarURL}") !important;
  background-size: cover !important;
  background-position: center !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  margin-right: 8px !important;
}
`;
  },

  /**
   * Apply avatar CSS using bulletproof cascade
   * @param {string} username - The username
   * @param {string} css - The CSS to apply
   */
  async applyAvatarCSS(username, css) {
    // Use the new cascadeToBlock utility for race condition-free block creation
    const blockUid = await this.cascadeToBlock(["roam/css", "User Avatars", username]);
    
    // Update the block with the CSS
    await window.roamAlphaAPI.data.block.update({
      block: { uid: blockUid, string: css }
    });
  },

  /**
   * Helper: Extract image URLs from text using universal image extraction
   * @param {string} text - Text to extract images from
   * @returns {Promise<string[]>} - Array of image URLs
   */
  async extractImageUrls(text) {
    // Use the new extractImageUrls utility
    return window.RoamExtensionSuite.getUtility("extractImageUrls")(text);
  },

  /**
   * Helper: Find exact data value using new utilities
   * @param {string} pageUid - Page UID
   * @param {string} key - Data key to find
   * @returns {Promise<string>} - Found value
   */
  async findDataValueExact(pageUid, key) {
    // Use the new findDataValueExact utility
    return window.RoamExtensionSuite.getUtility("findDataValueExact")(pageUid, key);
  },

  /**
   * Helper: Get current user using new utilities
   * @returns {Promise<Object>} - Current user data
   */
  async getCurrentUser() {
    // Use the new getCurrentUser utility
    return window.RoamExtensionSuite.getUtility("getCurrentUser")();
  },

  /**
   * Helper: Create nested block structure using new utilities
   * @param {string[]} pathArray - Array of block titles
   * @returns {Promise<string>} - Created block UID
   */
  async cascadeToBlock(pathArray) {
    // Use the new cascadeToBlock utility
    return window.RoamExtensionSuite.getUtility("cascadeToBlock")(pathArray);
  }
};

// DEBUG UTILITIES FOR TESTING

/**
 * Debug command: Test current extraction and see what data each strategy finds
 */
window.debugAvatarExtraction = async function (username) {
  console.log(`🔍 DEBUG: Avatar extraction for ${username}`);
  const avatarMaker = window.RoamExtensionSuite.extensions.avatarMaker;

  // Clear cache first
  avatarMaker.clearUserDataCache(username);

  // Test each strategy individually
  console.log("=".repeat(50));
  console.log("STRATEGY 1 - User Main Page:");
  try {
    const result1 = await avatarMaker.extractFromUserMainPage(username);
    console.log("Result:", result1);
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("=".repeat(50));
  console.log("STRATEGY 2 - User Preferences Page:");
  try {
    const result2 = await avatarMaker.extractFromUserPreferencesPage(username);
    console.log("Result:", result2);
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("=".repeat(50));
  console.log("STRATEGY 3 - Platform User Data:");
  try {
    const result3 = await avatarMaker.extractFromPlatformUserData(username);
    console.log("Result:", result3);
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("=".repeat(50));
  console.log("FULL EXTRACTION:");
  const finalResult = await avatarMaker.extractUserAvatarURL(username);
  console.log("Final Result:", finalResult);
};

/**
 * Debug command: Test hierarchy creation
 */
window.debugAvatarHierarchy = async function (username) {
  console.log(`🏗️ DEBUG: Hierarchy creation for ${username}`);
  const avatarMaker = window.RoamExtensionSuite.extensions.avatarMaker;

  const testCSS = `\`\`\`css
/* TEST CSS for ${username} */
.test { color: red; }
\`\`\``;

  await avatarMaker.bulletproofCascadeToCSS(username, testCSS);

  console.log("✅ Hierarchy test complete. Check roam/css page structure:");
  console.log(
    "Expected: roam/css → User Avatars → " + username + " → [CSS Block]"
  );
};

/**
 * Main debug command
 */
window.debugAvatar = async function (username) {
  console.log(`🎯 FULL DEBUG: Avatar system for ${username}`);

  await debugAvatarExtraction(username);
  await debugAvatarHierarchy(username);

  console.log(`🎉 Debug complete for ${username}`);
};

/**
 * Utility checker - run this first to diagnose utility availability
 */
window.checkUtilities = function () {
  console.log("🔍 UTILITY DIAGNOSTICS");
  console.log("=".repeat(50));

  // Check RoamExtensionSuite
  console.log("RoamExtensionSuite:", !!window.RoamExtensionSuite);
  if (window.RoamExtensionSuite) {
    console.log(
      "  getUtility function:",
      !!window.RoamExtensionSuite.getUtility
    );
    console.log("  extensions object:", !!window.RoamExtensionSuite.extensions);

    if (window.RoamExtensionSuite.getUtility) {
      const utilities = [
        "getPageUidByTitle",
        "createPage",
        "createChildBlock",
        "updateBlock",
        "getDirectChildren",
        "getCurrentUser",
      ];
      utilities.forEach((util) => {
        try {
          const fn = window.RoamExtensionSuite.getUtility(util);
          console.log(`  ${util}:`, !!fn, typeof fn);
        } catch (error) {
          console.log(`  ${util}: ERROR -`, error.message);
        }
      });
    }
  }

  // Check Roam Alpha API
  console.log("\nRoam Alpha API:", !!window.roamAlphaAPI);
  if (window.roamAlphaAPI) {
    console.log("  createBlock:", !!window.roamAlphaAPI.createBlock);
    console.log("  updateBlock:", !!window.roamAlphaAPI.updateBlock);
    console.log("  createPage:", !!window.roamAlphaAPI.createPage);
    console.log("  q (query):", !!window.roamAlphaAPI.q);
    console.log(
      "  util.generateUID:",
      !!(window.roamAlphaAPI.util && window.roamAlphaAPI.util.generateUID)
    );
  }

  console.log("=".repeat(50));
};

/**
 * Quick test command
 */
window.syncAvatar = async function (username) {
  return await window.RoamExtensionSuite.extensions.avatarMaker.syncAvatar(
    username
  );
};

console.log("🎯 Extension 6.5 Avatar Maker (FIXED) loaded!");
console.log("💡 Test commands:");
console.log("  await syncAvatar('Matt Brockwell')");
console.log("  await debugAvatar('Matt Brockwell')");
console.log("  await debugAvatarExtraction('Matt Brockwell')");
console.log("  await debugAvatarHierarchy('Matt Brockwell')");
