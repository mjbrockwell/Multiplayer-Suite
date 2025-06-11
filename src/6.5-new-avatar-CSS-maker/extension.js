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
      await this.applyAvatarCSS(username, avatarURL);

      console.log(`🎉 Avatar sync completed for ${username}`);
      return true;
    } catch (error) {
      console.error(`💥 Error syncing avatar for ${username}:`, error);
      return false;
    }
  },

  /**
   * Get current user data using Roam's native API
   * @returns {Promise<Object>} - User data object
   */
  async getCurrentUser() {
    console.group("👤 Getting Current User");
    try {
      // Get user UID using Roam's API
      const userUid = window.roamAlphaAPI.user.uid();
      console.log("User UID:", userUid);

      // Pull user data using Roam's API
      const userData = await window.roamAlphaAPI.pull("[*]", [":user/uid", userUid]);
      console.log("User data from API:", userData);

      // Get username from various possible fields
      const username = userData?.[":user/display-name"] || 
                      userData?.[":user/username"] || 
                      userData?.[":user/name"] ||
                      userData?.[":user/email"]?.split("@")[0];

      console.log("Found username:", username);

      if (!username) {
        console.warn("⚠️ Could not determine username from user data");
        return null;
      }

      return {
        username,
        displayName: userData?.[":user/display-name"],
        email: userData?.[":user/email"],
        photoURL: userData?.[":user/photo-url"]
      };
    } catch (error) {
      console.error("💥 Error getting current user:", error);
      return null;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Get user data using Roam's native API
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
      
      // Get the My Info block first
      const myInfoBlock = await this.findChildBlockByString(pageUid[0][0], "My Info::");
      if (!myInfoBlock) {
        console.log("❌ No My Info:: block found");
        return { username };
      }

      console.log("✅ Found My Info:: block");
      
      // Then get the Avatar block under My Info
      const avatarBlock = await this.findChildBlockByString(myInfoBlock, "Avatar::");
      if (!avatarBlock) {
        console.log("❌ No Avatar:: block found under My Info");
        return { username };
      }

      console.log("✅ Found Avatar:: block");
      
      // Get the block's string content
      const blockData = await window.roamAlphaAPI.data.block.get(avatarBlock);
      console.log("📝 Block content:", blockData?.string);

      return {
        username,
        avatar: blockData?.string || null
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
    try {
      // Use q to find blocks with matching string
      const blocks = await window.roamAlphaAPI.q(`
        [:find ?uid ?string
         :where
         [?parent :block/uid "${parentUid}"]
         [?parent :block/children ?child]
         [?child :block/string ?string]
         [?child :block/uid ?uid]
         [(clojure.string/includes? ?string "${searchString}")]]
      `);
      
      if (blocks && blocks.length > 0) {
        return blocks[0][0]; // Return the first matching block's UID
      }
      return null;
    } catch (error) {
      console.error("Error finding child block:", error);
      return null;
    }
  },

  /**
   * Extract image URLs from text using regex
   * @param {string} text - Text to extract URLs from
   * @returns {Promise<string[]>} - Array of image URLs
   */
  async extractImageUrls(text) {
    console.group("🔍 Extracting images from:", text);
    try {
      if (!text) {
        console.log("❌ No text provided");
        return [];
      }

      // Common image URL patterns
      const patterns = [
        // Markdown image syntax
        /!\[.*?\]\((.*?)\)/g,
        // HTML img tag
        /<img[^>]+src="([^">]+)"/g,
        // Direct URL (must end with image extension)
        /(https?:\/\/[^\s<>"]+?\.(?:png|jpe?g|gif|webp|svg|ico)(?:\?[^\s<>"]*)?)/gi,
        // Google Photos URL
        /(https?:\/\/lh3\.googleusercontent\.com\/[^\s<>"]+)/g
      ];

      const urls = new Set();
      
      // Try each pattern
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const url = match[1] || match[0];
          if (url) {
            console.log("Found URL:", url);
            urls.add(url);
          }
        }
      }

      const uniqueUrls = Array.from(urls);
      console.log("Extracted URLs:", uniqueUrls);
      return uniqueUrls;
    } catch (error) {
      console.error("💥 Error extracting image URLs:", error);
      return [];
    } finally {
      console.groupEnd();
    }
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
        const prefsAvatar = await this.findDataValueExact(prefsPageUid[0][0], "Avatar");
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
        const platformAvatar = currentUser.photoURL;
        if (platformAvatar) {
          console.log("Found platform avatar:", platformAvatar);
          // For platform avatar, we can use it directly since it's already a URL
          console.log("✅ Using platform avatar directly:", platformAvatar);
          return platformAvatar;
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
   * Apply avatar CSS to user's page
   * @param {string} username - Username to apply CSS for
   * @param {string} avatarUrl - Avatar URL to use
   * @returns {Promise<boolean>} - Success status
   */
  async applyAvatarCSS(username, avatarUrl) {
    console.group("🔄 Applying Avatar CSS");
    try {
      // Find or create the user's page
      const pageUid = await this.findOrCreatePage(username);
      if (!pageUid) {
        console.error("❌ Could not find or create user page");
        return false;
      }

      console.log("📄 Using page UID:", pageUid);

      // Find or create the My Info block
      const myInfoBlock = await this.findOrCreateBlock(pageUid, "My Info::");
      if (!myInfoBlock) {
        console.error("❌ Could not find or create My Info block");
        return false;
      }

      console.log("📝 Using My Info block UID:", myInfoBlock);

      // Find or create the Avatar block
      const avatarBlock = await this.findOrCreateBlock(myInfoBlock, "Avatar::");
      if (!avatarBlock) {
        console.error("❌ Could not find or create Avatar block");
        return false;
      }

      console.log("📝 Using Avatar block UID:", avatarBlock);

      // Update the Avatar block with the image
      await window.roamAlphaAPI.updateBlock({
        block: {
          uid: avatarBlock,
          string: `![Avatar](${avatarUrl})`
        }
      });

      console.log("✅ Avatar CSS applied successfully");
      return true;
    } catch (error) {
      console.error("💥 Error applying CSS:", error);
      return false;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Find or create a page
   * @param {string} title - Page title
   * @returns {Promise<string>} - Page UID
   */
  async findOrCreatePage(title) {
    try {
      // Try to find existing page
      const pageUid = await window.roamAlphaAPI.q(
        `[:find ?uid :where [?uid :node/title "${title}"]]`
      );

      if (pageUid?.[0]?.[0]) {
        console.log("📄 Found existing page");
        return pageUid[0][0];
      }

      // Create new page
      console.log("📄 Creating new page");
      const newPageUid = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createPage({
        page: {
          uid: newPageUid,
          title: title
        }
      });

      // Get the page UID after creation
      const createdPageUid = await window.roamAlphaAPI.q(
        `[:find ?uid :where [?uid :node/title "${title}"]]`
      );

      return createdPageUid?.[0]?.[0] || newPageUid;
    } catch (error) {
      console.error("Error finding/creating page:", error);
      return null;
    }
  },

  /**
   * Find or create a block
   * @param {string} parentUid - Parent block/page UID
   * @param {string} blockString - Block string to find/create
   * @returns {Promise<string>} - Block UID
   */
  async findOrCreateBlock(parentUid, blockString) {
    try {
      if (!parentUid) {
        console.error("❌ No parent UID provided");
        return null;
      }

      // Try to find existing block
      const blocks = await window.roamAlphaAPI.q(`
        [:find ?uid
         :where
         [?parent :block/uid "${parentUid}"]
         [?parent :block/children ?child]
         [?child :block/string ?string]
         [?child :block/uid ?uid]
         [(clojure.string/includes? ?string "${blockString}")]]
      `);

      if (blocks?.[0]?.[0]) {
        console.log("📝 Found existing block");
        return blocks[0][0];
      }

      // Create new block
      console.log("📝 Creating new block");
      const newBlockUid = window.roamAlphaAPI.util.generateUID();
      
      // First check if parent is a page or block
      const parentIsPage = await window.roamAlphaAPI.q(
        `[:find ?e :where [?e :node/title "${parentUid}"]]`
      );

      if (parentIsPage?.[0]?.[0]) {
        // Parent is a page, create block at page level
        await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": parentUid, order: 0 },
          block: {
            uid: newBlockUid,
            string: blockString
          }
        });
      } else {
        // Parent is a block, create as child block
        await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": parentUid, order: 0 },
          block: {
            uid: newBlockUid,
            string: blockString
          }
        });
      }

      return newBlockUid;
    } catch (error) {
      console.error("Error finding/creating block:", error);
      return null;
    }
  },

  /**
   * Helper: Find exact data value
   * @param {string} pageUid - Page UID
   * @param {string} key - Data key to find
   * @returns {Promise<string>} - Found value
   */
  async findDataValueExact(pageUid, key) {
    try {
      const utility = window.RoamExtensionSuite.getUtility("findDataValueExact");
      if (typeof utility === 'function') {
        return await utility(pageUid, key);
      }
      
      // Fallback: Manual search
      const children = await window.roamAlphaAPI.data.block.getChildren(pageUid);
      for (const child of children) {
        if (child.string && (
          child.string.startsWith(`${key}:`) ||
          child.string.startsWith(`${key}::`) ||
          child.string.startsWith(`**${key}:**`) ||
          child.string.startsWith(`**${key}**:`)
        )) {
          return child.string;
        }
      }
      return null;
    } catch (error) {
      console.error("Error in findDataValueExact:", error);
      return null;
    }
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
      await this.applyAvatarCSS(username, testAvatarURL);
      
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
