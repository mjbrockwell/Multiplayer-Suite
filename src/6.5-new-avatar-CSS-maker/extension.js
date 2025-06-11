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
    console.group("👤 Getting User Data");
    try {
      // Try to get user data from their main page
      const pageUid = await window.roamAlphaAPI.q(`[:find ?uid :where [?uid :node/title "${username}"]]`);
      if (!pageUid?.[0]?.[0]) {
        console.log(`❌ No page found for ${username}`);
        return null;
      }

      console.log("📄 Found user page, searching for data...");
      
      // Use findNestedDataValuesExact to get data under My Info
      const myInfoData = await window.RoamExtensionSuite.getUtility("findNestedDataValuesExact")(pageUid[0][0], "My Info");
      console.log("📝 My Info data:", myInfoData);

      // The avatar should be in the nested data
      const avatar = myInfoData?.Avatar;
      console.log("🖼️ Avatar data:", avatar);

      return {
        username,
        avatar: avatar || null
      };
    } catch (error) {
      console.error("💥 Error getting user data:", error);
      return { username };
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Helper: Find child block by string content
   * @param {string} parentUid - Parent block UID
   * @param {string} searchString - String to search for
   * @returns {Promise<string>} - Found block UID
   */
  async findChildBlockByString(parentUid, searchString) {
    const children = await window.roamAlphaAPI.data.block.getChildren(parentUid);
    for (const child of children) {
      if (child.string && child.string.includes(searchString)) {
        return child.uid;
      }
    }
    return null;
  },

  /**
   * Extract avatar URL using universal image extraction
   * @param {Object} user - User data object
   * @returns {Promise<string>} - Avatar URL
   */
  async extractAvatarURL(user) {
    console.group("🔍 Extracting Avatar URL");
    try {
      // Strategy 1: Check user's main page for Avatar data
      console.log("Strategy 1: Checking user main page...");
      if (user.avatar) {
        console.log("Found avatar data:", user.avatar);
        const images = await this.extractImageUrls(user.avatar);
        console.log("Extracted images:", images);
        if (images.length > 0) {
          console.log("✅ Found image in main page:", images[0]);
          return images[0];
        }
      } else {
        console.log("❌ No avatar data in main page");
      }

      // Strategy 2: Check user preferences page
      console.log("\nStrategy 2: Checking preferences page...");
      const prefsPageUid = await window.roamAlphaAPI.q(
        `[:find ?uid :where [?uid :node/title "${user.username}/preferences"]]`
      );
      if (prefsPageUid?.[0]?.[0]) {
        const prefsAvatar = await window.RoamExtensionSuite.getUtility("findDataValueExact")(prefsPageUid[0][0], "Avatar");
        if (prefsAvatar) {
          console.log("Found avatar in preferences:", prefsAvatar);
          const images = await this.extractImageUrls(prefsAvatar);
          console.log("Extracted images:", images);
          if (images.length > 0) {
            console.log("✅ Found image in preferences:", images[0]);
            return images[0];
          }
        } else {
          console.log("❌ No avatar in preferences");
        }
      } else {
        console.log("❌ No preferences page found");
      }

      // Strategy 3: Check platform user data
      console.log("\nStrategy 3: Checking platform data...");
      const currentUser = await this.getCurrentUser();
      if (currentUser?.username === user.username || currentUser?.displayName === user.username) {
        const platformAvatar = currentUser.photoURL || currentUser.photoUrl;
        if (platformAvatar) {
          console.log("Found platform avatar:", platformAvatar);
          const images = await this.extractImageUrls(platformAvatar);
          console.log("Extracted images:", images);
          if (images.length > 0) {
            console.log("✅ Found image in platform data:", images[0]);
            return images[0];
          }
        } else {
          console.log("❌ No platform avatar found");
        }
      } else {
        console.log("❌ Not the current user");
      }

      console.log("❌ No avatar found in any strategy");
      return null;
    } catch (error) {
      console.error("💥 Error extracting avatar:", error);
      return null;
    } finally {
      console.groupEnd();
    }
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
    console.group("🔄 Applying Avatar CSS");
    try {
      // First ensure the roam/css page exists
      const cssPageUid = await window.roamAlphaAPI.q(
        `[:find ?uid :where [?uid :node/title "roam/css"]]`
      );
      if (!cssPageUid?.[0]?.[0]) {
        console.log("📄 Creating roam/css page...");
        await window.roamAlphaAPI.data.page.create({ title: "roam/css" });
      }

      // Create or find the User Avatars block with proper formatting
      const userAvatarsBlockUid = await this.cascadeToBlock(["roam/css", "**User Avatars:**"]);
      
      // Create or find the username block
      const usernameBlockUid = await this.cascadeToBlock(["roam/css", "**User Avatars:**", `${username}:`]);
      
      // Update the block with the CSS
      await window.roamAlphaAPI.data.block.update({
        block: { uid: usernameBlockUid, string: css }
      });

      console.log("✅ CSS applied successfully");
      console.log("📁 Block hierarchy:");
      console.log("  roam/css");
      console.log("    **User Avatars:**");
      console.log(`      ${username}:`);
      console.log("        [CSS Block]");
    } catch (error) {
      console.error("💥 Error applying CSS:", error);
      throw error;
    }
    console.groupEnd();
  },

  /**
   * Helper: Extract image URLs from text using universal image extraction
   * @param {string} text - Text to extract images from
   * @returns {Promise<string[]>} - Array of image URLs
   */
  async extractImageUrls(text) {
    console.log("🔍 Extracting images from:", text);
    
    // First try the utility
    const images = await window.RoamExtensionSuite.getUtility("extractImageUrls")(text);
    console.log("Utility found images:", images);
    
    // If no images found, try manual extraction for Roam uploads
    if (images.length === 0) {
      // Look for Roam's image upload format
      const roamUploadMatch = text.match(/!\[.*?\]\((https:\/\/firebasestorage\.googleapis\.com\/.*?)\)/);
      if (roamUploadMatch) {
        console.log("Found Roam upload image:", roamUploadMatch[1]);
        return [roamUploadMatch[1]];
      }
    }
    
    return images;
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
   * Test command: Test avatar sync for current user
   */
  async testCurrentUserAvatar() {
    console.group("🧪 Testing Avatar Sync for Current User");
    try {
      const currentUser = await this.getCurrentUser();
      console.log("👤 Current user data:", currentUser);
      
      if (!currentUser) {
        console.error("❌ No current user found");
        return;
      }

      // Handle both string and object returns
      const username = typeof currentUser === 'string' 
        ? currentUser 
        : currentUser.displayName || currentUser.username || currentUser.name;

      console.log(`👤 Testing for user: ${username}`);
      
      if (!username) {
        console.error("❌ Could not determine username from:", currentUser);
        return;
      }

      const result = await this.syncAvatar(username);
      
      if (result) {
        console.log("✅ Avatar sync successful!");
        console.log("💡 Check your avatar in the roam/css page");
      } else {
        console.error("❌ Avatar sync failed");
      }
    } catch (error) {
      console.error("💥 Test failed:", error);
    }
    console.groupEnd();
  },

  /**
   * Helper: Get current user using new utilities
   * @returns {Promise<Object|string>} - Current user data
   */
  async getCurrentUser() {
    console.group("👤 Getting Current User");
    try {
      // Try the utility first
      const user = await window.RoamExtensionSuite.getUtility("getCurrentUser")();
      console.log("Utility returned user:", user);

      if (user) {
        return user; // This could be a string or an object
      }

      // Fallback: Try to get from Roam API directly
      console.log("Trying Roam API directly...");
      if (window.roamAlphaAPI?.platform?.getCurrentUser) {
        const roamUser = await window.roamAlphaAPI.platform.getCurrentUser();
        console.log("Roam API returned user:", roamUser);
        return roamUser;
      }

      // Final fallback: Try to get from localStorage
      console.log("Trying localStorage fallback...");
      const storedUser = localStorage.getItem("roam-user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("localStorage returned user:", parsedUser);
          return parsedUser;
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      }

      console.error("❌ Could not determine current user");
      return null;
    } catch (error) {
      console.error("💥 Error getting current user:", error);
      return null;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Helper: Create nested block structure using new utilities
   * @param {string[]} pathArray - Array of block titles
   * @returns {Promise<string>} - Created block UID
   */
  async cascadeToBlock(pathArray) {
    // Use the new cascadeToBlock utility
    return window.RoamExtensionSuite.getUtility("cascadeToBlock")(pathArray);
  },

  /**
   * Test command: Test avatar extraction strategies
   */
  async testAvatarExtraction(username) {
    console.group("🧪 Testing Avatar Extraction Strategies");
    try {
      const user = await this.getUserData(username);
      if (!user) {
        console.error(`❌ No user data found for ${username}`);
        return;
      }

      console.log("🔍 Testing Strategy 1: User Main Page");
      if (user.avatar) {
        const images = await this.extractImageUrls(user.avatar);
        console.log(images.length > 0 ? "✅ Found images:" : "❌ No images found");
        images.forEach(url => console.log(`   ${url}`));
      } else {
        console.log("❌ No avatar data in main page");
      }

      console.log("\n🔍 Testing Strategy 2: User Preferences");
      const prefsPageUid = await window.roamAlphaAPI.q(
        `[:find ?uid :where [?uid :node/title "${username}/preferences"]]`
      );
      if (prefsPageUid?.[0]?.[0]) {
        const prefsAvatar = await this.findDataValueExact(prefsPageUid[0][0], "Avatar");
        if (prefsAvatar) {
          const images = await this.extractImageUrls(prefsAvatar);
          console.log(images.length > 0 ? "✅ Found images:" : "❌ No images found");
          images.forEach(url => console.log(`   ${url}`));
        } else {
          console.log("❌ No avatar in preferences");
        }
      } else {
        console.log("❌ No preferences page found");
      }

      console.log("\n🔍 Testing Strategy 3: Platform User Data");
      const currentUser = await this.getCurrentUser();
      if (currentUser?.username === username || currentUser?.displayName === username) {
        const platformAvatar = currentUser.photoURL || currentUser.photoUrl;
        if (platformAvatar) {
          const images = await this.extractImageUrls(platformAvatar);
          console.log(images.length > 0 ? "✅ Found images:" : "❌ No images found");
          images.forEach(url => console.log(`   ${url}`));
        } else {
          console.log("❌ No platform avatar found");
        }
      } else {
        console.log("❌ Not the current user");
      }
    } catch (error) {
      console.error("💥 Test failed:", error);
    }
    console.groupEnd();
  },

  /**
   * Test command: Test CSS generation and application
   */
  async testCSSGeneration(username) {
    console.group("🧪 Testing CSS Generation and Application");
    try {
      const testAvatarURL = "https://api.dicebear.com/7.x/initials/svg?seed=test";
      const css = this.generateAvatarCSS(username, testAvatarURL);
      
      console.log("📝 Generated CSS:");
      console.log(css);
      
      console.log("\n🔄 Applying test CSS...");
      await this.applyAvatarCSS(username, css);
      
      console.log("✅ Test CSS applied successfully");
      console.log("💡 Check the roam/css page for the test CSS block");
    } catch (error) {
      console.error("💥 Test failed:", error);
    }
    console.groupEnd();
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

// Register test commands
const commands = [
  {
    label: "Avatar: Test Current User",
    callback: () => window.RoamExtensionSuite.extensions.avatarMaker.testCurrentUserAvatar()
  },
  {
    label: "Avatar: Test Extraction",
    callback: () => {
      const username = prompt("Enter username to test:");
      if (username) {
        window.RoamExtensionSuite.extensions.avatarMaker.testAvatarExtraction(username);
      }
    }
  },
  {
    label: "Avatar: Test CSS Generation",
    callback: () => {
      const username = prompt("Enter username to test:");
      if (username) {
        window.RoamExtensionSuite.extensions.avatarMaker.testCSSGeneration(username);
      }
    }
  }
];

// Add commands to Roam
commands.forEach(cmd => {
  window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
  window._extensionRegistry.commands.push(cmd.label);
});

console.log("🎯 Extension 6.5 Avatar Maker (FIXED) loaded!");
console.log("💡 Test commands:");
console.log("  await syncAvatar('Matt Brockwell')");
console.log("  await debugAvatar('Matt Brockwell')");
console.log("  await debugAvatarExtraction('Matt Brockwell')");
console.log("  await debugAvatarHierarchy('Matt Brockwell')");
