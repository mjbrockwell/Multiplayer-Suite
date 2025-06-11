// Extension 6.5 Avatar Maker - Fixed Implementation
// Fixes: 1) Correct block hierarchy, 2) Fresh data extraction

window.RoamExtensionSuite = window.RoamExtensionSuite || {};

window.RoamExtensionSuite.extensions =
  window.RoamExtensionSuite.extensions || {};

window.RoamExtensionSuite.extensions.avatarMaker = {
  // Cache for preventing race conditions during cascade operations
  workingOn: new Set(),

  // Cache for user data - with invalidation capability
  userDataCache: new Map(),

  /**
   * Main entry point for syncing user avatar
   */
  async syncAvatar(username) {
    console.log(`🎯 Starting avatar sync for: ${username}`);

    try {
      // FIX #2: Clear any cached user data before extraction
      this.clearUserDataCache(username);

      // Extract fresh avatar URL
      const avatarURL = await this.extractUserAvatarURL(username);

      if (!avatarURL) {
        console.log(`❌ No avatar URL found for ${username}`);
        return false;
      }

      console.log(`✅ Found avatar URL for ${username}: ${avatarURL}`);

      // Generate CSS
      const css = this.generateAvatarCSS(username, avatarURL);

      // Apply to roam/css with correct hierarchy
      await this.bulletproofCascadeToCSS(username, css);

      console.log(`🎉 Avatar sync completed for ${username}`);
      return true;
    } catch (error) {
      console.error(`💥 Error syncing avatar for ${username}:`, error);
      return false;
    }
  },

  /**
   * FIXED: Extract user avatar URL with cache invalidation and fresh data priority
   */
  async extractUserAvatarURL(username) {
    console.log(`🔍 Extracting avatar URL for: ${username}`);

    // FIX #2: Comprehensive logging and fresh data prioritization
    let avatarURL = null;

    // Strategy 1: Check user's main page for Avatar data (PRIORITIZED - fresh graph data)
    console.log("🔍 STRATEGY 1 - Checking user main page...");
    try {
      avatarURL = await this.extractFromUserMainPage(username);
      if (avatarURL) {
        console.log(`✅ STRATEGY 1 SUCCESS - User main page: ${avatarURL}`);
        return avatarURL;
      }
      console.log("❌ STRATEGY 1 - No avatar in user main page");
    } catch (error) {
      console.log("❌ STRATEGY 1 ERROR:", error.message);
    }

    // Strategy 2: Check user preferences page (fresh graph data)
    console.log("🔍 STRATEGY 2 - Checking user preferences page...");
    try {
      avatarURL = await this.extractFromUserPreferencesPage(username);
      if (avatarURL) {
        console.log(
          `✅ STRATEGY 2 SUCCESS - User preferences page: ${avatarURL}`
        );
        return avatarURL;
      }
      console.log("❌ STRATEGY 2 - No avatar in user preferences page");
    } catch (error) {
      console.log("❌ STRATEGY 2 ERROR:", error.message);
    }

    // Strategy 3: Check current user platform data (DEPRIORITIZED - may be cached)
    console.log(
      "🔍 STRATEGY 3 - Checking platform user data (cache-busted)..."
    );
    try {
      // FIX #2: Force fresh platform data by clearing cache first
      this.clearPlatformUserCache();
      avatarURL = await this.extractFromPlatformUserData(username);
      if (avatarURL) {
        console.log(`✅ STRATEGY 3 SUCCESS - Platform user data: ${avatarURL}`);
        return avatarURL;
      }
      console.log("❌ STRATEGY 3 - No avatar in platform user data");
    } catch (error) {
      console.log("❌ STRATEGY 3 ERROR:", error.message);
    }

    console.log(`❌ All strategies failed for ${username}`);
    return null;
  },

  /**
   * Extract avatar from user's main page
   */
  async extractFromUserMainPage(username) {
    const getPageUidByTitle =
      window.RoamExtensionSuite.getUtility("getPageUidByTitle");
    const getDirectChildren =
      window.RoamExtensionSuite.getUtility("getDirectChildren");

    const pageUid = getPageUidByTitle(username);

    if (!pageUid) {
      throw new Error(`User page not found: ${username}`);
    }

    const children = getDirectChildren(pageUid);

    for (const child of children) {
      const blockString = child.string || "";

      // Look for Avatar:: pattern
      if (blockString.toLowerCase().includes("avatar::")) {
        const match = blockString.match(/avatar::\s*(https?:\/\/[^\s\)]+)/i);
        if (match) {
          return match[1].trim();
        }
      }

      // Look for direct image URLs
      const urlMatch = blockString.match(
        /(https?:\/\/[^\s\)]+\.(jpg|jpeg|png|gif|webp))/i
      );
      if (urlMatch) {
        return urlMatch[1].trim();
      }
    }

    return null;
  },

  /**
   * Extract avatar from user preferences page
   */
  async extractFromUserPreferencesPage(username) {
    const getPageUidByTitle =
      window.RoamExtensionSuite.getUtility("getPageUidByTitle");
    const getDirectChildren =
      window.RoamExtensionSuite.getUtility("getDirectChildren");

    const prefsPageTitle = `${username}/preferences`;
    const pageUid = getPageUidByTitle(prefsPageTitle);

    if (!pageUid) {
      return null;
    }

    const children = getDirectChildren(pageUid);

    for (const child of children) {
      const blockString = child.string || "";

      if (blockString.toLowerCase().includes("avatar")) {
        const urlMatch = blockString.match(/(https?:\/\/[^\s\)]+)/i);
        if (urlMatch) {
          return urlMatch[1].trim();
        }
      }
    }

    return null;
  },

  /**
   * Extract avatar from platform user data (with cache busting)
   */
  async extractFromPlatformUserData(username) {
    const utils = window.RoamExtensionSuite.getUtility;

    // Force fresh user data by bypassing any cached getCurrentUser
    const currentUser = await this.getFreshCurrentUser();

    if (!currentUser) {
      throw new Error("No current user data available");
    }

    console.log(`🔍 Platform user data:`, currentUser);
    console.log(
      `🔍 Comparing username: "${username}" with displayName: "${currentUser.displayName}"`
    );

    // Check if this is the current user
    if (
      currentUser.displayName === username ||
      currentUser.username === username
    ) {
      // Try both photoURL and photoUrl (different APIs use different cases)
      const avatarURL = currentUser.photoURL || currentUser.photoUrl;
      console.log(`🔍 Found avatar field:`, avatarURL);

      if (avatarURL) {
        return avatarURL;
      }
    }

    return null;
  },

  /**
   * FIXED: Bulletproof cascade with correct 3-level hierarchy
   */
  async bulletproofCascadeToCSS(username, css) {
    console.log(`🔄 Starting bulletproof cascade for ${username}`);

    // FIXED: Define ALL utilities at function scope (not inside if blocks)
    console.log("🔍 Loading utilities at function scope...");

    let getPageUidByTitle,
      createPage,
      createChildBlock,
      updateBlock,
      getDirectChildren;

    try {
      // Load all utilities ONCE at the beginning
      getPageUidByTitle =
        window.RoamExtensionSuite.getUtility("getPageUidByTitle");
      createPage = window.RoamExtensionSuite.getUtility("createPage");
      createChildBlock =
        window.RoamExtensionSuite.getUtility("createChildBlock");
      updateBlock = window.RoamExtensionSuite.getUtility("updateBlock");
      getDirectChildren =
        window.RoamExtensionSuite.getUtility("getDirectChildren");

      console.log("✅ All utilities loaded successfully:");
      console.log("  getPageUidByTitle:", typeof getPageUidByTitle);
      console.log("  createPage:", typeof createPage);
      console.log("  createChildBlock:", typeof createChildBlock);
      console.log("  updateBlock:", typeof updateBlock);
      console.log("  getDirectChildren:", typeof getDirectChildren);
    } catch (error) {
      console.error("❌ Extension utilities not available:", error);
      throw new Error(
        "❌ Extension 1.5 utilities are required. Make sure they are loaded before running Avatar Maker."
      );
    }

    // Verify critical functions are available
    if (!createChildBlock || !getPageUidByTitle) {
      throw new Error(
        "❌ Critical utilities missing. Ensure Extension 1.5 is loaded."
      );
    }

    let currentStep = "roam-css-page";

    try {
      // Step 1: Ensure [[roam/css]] page exists
      currentStep = "roam-css-page";
      if (this.workingOn.has(currentStep)) {
        console.log(`⏳ Waiting for ${currentStep} to complete...`);
        await this.waitForCompletion(currentStep);
      }

      this.workingOn.add(currentStep);

      let roamCssPageUid = getPageUidByTitle("roam/css");
      if (!roamCssPageUid) {
        console.log("📄 Creating [[roam/css]] page...");
        roamCssPageUid = await createPage("roam/css");
        await this.sleep(50); // Brief pause for Roam to process
      }

      this.workingOn.delete(currentStep);
      console.log("✅ Step 1: [[roam/css]] page ready");

      // Step 2: Ensure "User Avatars:" block exists under [[roam/css]]
      currentStep = "user-avatars-block";
      if (this.workingOn.has(currentStep)) {
        console.log(`⏳ Waiting for ${currentStep} to complete...`);
        await this.waitForCompletion(currentStep);
      }

      this.workingOn.add(currentStep);

      let userAvatarsBlockUid = this.findChildBlockByString(
        roamCssPageUid,
        "**User Avatars:**"
      );
      if (!userAvatarsBlockUid) {
        console.log('📝 Creating "User Avatars:" block...');
        userAvatarsBlockUid = await createChildBlock(
          roamCssPageUid,
          "**User Avatars:**"
        );
        await this.sleep(50);
      }

      this.workingOn.delete(currentStep);
      console.log('✅ Step 2: "User Avatars:" block ready');

      // STEP 3: FIXED - Ensure username block exists under "User Avatars:"
      currentStep = `username-block-${username}`;
      if (this.workingOn.has(currentStep)) {
        console.log(`⏳ Waiting for ${currentStep} to complete...`);
        await this.waitForCompletion(currentStep);
      }

      this.workingOn.add(currentStep);

      let usernameBlockUid = this.findChildBlockByString(
        userAvatarsBlockUid,
        `${username}:`
      );
      if (!usernameBlockUid) {
        console.log(`📝 Creating "${username}:" block...`);
        usernameBlockUid = await createChildBlock(
          userAvatarsBlockUid,
          `${username}:`
        );
        await this.sleep(50);
      }

      this.workingOn.delete(currentStep);
      console.log(`✅ Step 3: "${username}:" block ready`);

      // STEP 4: FIXED - Create/update CSS block under username block (not User Avatars)
      currentStep = `css-block-${username}`;
      if (this.workingOn.has(currentStep)) {
        console.log(`⏳ Waiting for ${currentStep} to complete...`);
        await this.waitForCompletion(currentStep);
      }

      this.workingOn.add(currentStep);

      // Look for existing CSS block under the username block
      let cssBlockUid = this.findChildBlockWithCSS(usernameBlockUid);

      if (cssBlockUid) {
        console.log("🔄 Updating existing CSS block...");
        await updateBlock(cssBlockUid, css);
      } else {
        console.log("✨ Creating new CSS block...");
        cssBlockUid = await createChildBlock(usernameBlockUid, css);
      }

      this.workingOn.delete(currentStep);
      console.log("✅ Step 4: CSS block created/updated");

      console.log(`🎉 Bulletproof cascade completed for ${username}`);
      console.log(
        `📁 Final hierarchy: roam/css → User Avatars → ${username} → [CSS Block]`
      );
    } catch (error) {
      // Clean up working state on error
      this.workingOn.delete(currentStep);
      console.error(`💥 Cascade error at step ${currentStep}:`, error);
      throw error;
    }
  },

  /**
   * Generate CSS for user avatar
   */
  generateAvatarCSS(username, avatarURL) {
    return `\`\`\`css
/* Avatar for ${username} */
.rm-page-ref[data-tag="${username}"]::before {
    content: "";
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url("${avatarURL}");
    background-size: cover;
    background-position: center;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    border: 1px solid #e0e0e0;
}

/* Hover effect */
.rm-page-ref[data-tag="${username}"]:hover::before {
    border-color: #007acc;
    transform: scale(1.1);
    transition: all 0.2s ease;
}
\`\`\``;
  },

  /**
   * Find child block by string content
   */
  findChildBlockByString(parentUid, searchString) {
    const getDirectChildren =
      window.RoamExtensionSuite.getUtility("getDirectChildren");
    const children = getDirectChildren(parentUid);

    for (const child of children) {
      if (child.string && child.string.includes(searchString)) {
        return child.uid;
      }
    }

    return null;
  },

  /**
   * Find child block containing CSS
   */
  findChildBlockWithCSS(parentUid) {
    const getDirectChildren =
      window.RoamExtensionSuite.getUtility("getDirectChildren");
    const children = getDirectChildren(parentUid);

    for (const child of children) {
      if (child.string && child.string.includes("```css")) {
        return child.uid;
      }
    }

    return null;
  },

  /**
   * CACHE MANAGEMENT - FIXES FOR ISSUE #2
   */

  /**
   * Clear user data cache for specific user
   */
  clearUserDataCache(username) {
    console.log(`🧹 Clearing user data cache for: ${username}`);
    this.userDataCache.delete(username);
    this.userDataCache.delete("current_user"); // Clear current user cache too
  },

  /**
   * Clear platform user cache (force fresh getCurrentUser)
   */
  clearPlatformUserCache() {
    console.log(`🧹 Clearing platform user cache`);

    // Clear any cached user data in the extension utilities
    try {
      const clearUserCache =
        window.RoamExtensionSuite.getUtility("clearUserCache");
      if (clearUserCache) {
        clearUserCache();
      }
    } catch (error) {
      console.log("Note: clearUserCache utility not available");
    }

    // Clear our internal cache
    this.userDataCache.clear();
  },

  /**
   * Get fresh current user data (bypass cache)
   */
  async getFreshCurrentUser() {
    console.log(`🔄 Fetching fresh current user data`);

    // Try to get fresh data by forcing a re-query

    // Method 1: Direct Roam API call if available
    if (
      window.roamAlphaAPI &&
      window.roamAlphaAPI.platform &&
      window.roamAlphaAPI.platform.getCurrentUser
    ) {
      try {
        const freshUser = await window.roamAlphaAPI.platform.getCurrentUser();
        console.log(`✅ Fresh user data from Roam API:`, freshUser);
        return freshUser;
      } catch (error) {
        console.log(`❌ Roam API getCurrentUser failed:`, error.message);
      }
    }

    // Method 2: Extension utility (with cache cleared)
    try {
      const getCurrentUser =
        window.RoamExtensionSuite.getUtility("getCurrentUser");
      if (getCurrentUser) {
        const cachedUser = getCurrentUser();
        console.log(`✅ User data from extension utility:`, cachedUser);
        return cachedUser;
      }
    } catch (error) {
      console.log(`❌ Extension getCurrentUser failed:`, error.message);
    }

    console.log(`❌ All fresh user data methods failed`);
    return null;
  },

  /**
   * Utility functions
   */

  async waitForCompletion(step) {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (this.workingOn.has(step) && attempts < maxAttempts) {
      await this.sleep(100);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn(`⚠️ Timeout waiting for step: ${step}`);
    }
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
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
