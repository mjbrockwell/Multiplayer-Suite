// ===================================================================
// Extension 1.5: Complete Core Utilities Library
// UPDATED: Added getCurrentPageTitle + Complete reorganization
// Features: Navigation, User detection, Data management, Hierarchical lists, Image processing
// Dependencies: None (this IS the foundation)
// ===================================================================

// ===================================================================
// 📍 NAVIGATION UTILITIES - Page and Block Navigation
// ===================================================================

/**
 * 📍 Get the title of the currently viewed page
 * Handles both page and block contexts with comprehensive fallbacks
 * @returns {string} - Current page title or empty string if not found
 */
const getCurrentPageTitle = () => {
  try {
    // Method 1: Get current UID from Roam's main window
    const currentUid =
      window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

    if (!currentUid) {
      console.warn("No current UID found from main window");
      return "";
    }

    // Method 2: Try as page UID first
    try {
      const pageResult = window.roamAlphaAPI.pull(`[:node/title]`, [
        ":block/uid",
        currentUid,
      ]);
      if (pageResult?.[":node/title"]) {
        return pageResult[":node/title"];
      }
    } catch (e) {
      // Not a page UID, continue to try as block UID
    }

    // Method 3: Try as block UID - get parent page
    try {
      const blockResult = window.roamAlphaAPI.q(
        `[:find (pull ?p [:node/title]) :where [?e :block/uid "${currentUid}"] [?e :block/page ?p]]`
      );
      if (blockResult?.[0]?.[0]?.title) {
        return blockResult[0][0].title;
      }
    } catch (e) {
      // Continue to fallback methods
    }

    // Method 4: Extract from URL as fallback
    const url = window.location.href;
    const pageMatch = url.match(/\/page\/([^/?#]+)/);
    if (pageMatch) {
      const decoded = decodeURIComponent(pageMatch[1]);
      return decoded;
    }

    // Method 5: Parse document title (last resort)
    const titleMatch = document.title.match(/^(.*?) - Roam/);
    if (titleMatch) {
      return titleMatch[1];
    }

    return "";
  } catch (error) {
    console.warn("Failed to get current page title:", error);
    return "";
  }
};

/**
 * 🎯 Get page UID by title (with fallback handling)
 */
const getPageUidByTitle = (title) => {
  if (!title) return null;

  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?uid :where [?e :node/title "${title}"] [?e :block/uid ?uid]]
    `);
    return result?.[0]?.[0] || null;
  } catch (error) {
    console.warn(`Failed to get page UID for "${title}":`, error);
    return null;
  }
};

/**
 * 🏗️ Get direct children of a block
 */
const getDirectChildren = (parentUid) => {
  if (!parentUid) return [];

  try {
    const children = window.roamAlphaAPI.data
      .q(
        `
      [:find ?childUid ?childString ?childOrder
       :where 
       [?parent :block/uid "${parentUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?childUid]
       [?child :block/string ?childString]
       [?child :block/order ?childOrder]]
    `
      )
      .sort((a, b) => a[2] - b[2]); // Sort by order

    return children.map(([uid, text, order]) => ({
      uid,
      text,
      order,
    }));
  } catch (error) {
    console.warn(`Failed to get children for ${parentUid}:`, error);
    return [];
  }
};

// ===================================================================
// 👤 USER DETECTION UTILITIES - Multi-method User Authentication
// ===================================================================

// User cache to avoid repeated API calls
let userCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * 🆕 Get current user via new official API (Josh Brown method)
 */
const getCurrentUserViaOfficialAPI = () => {
  try {
    const userUid = window.roamAlphaAPI.user.uid();
    if (!userUid) {
      return null;
    }

    const userData = window.roamAlphaAPI.pull("[*]", [":user/uid", userUid]);

    if (userData) {
      return {
        displayName:
          userData[":user/display-name"] || userData[":user/uid"] || "Unknown",
        email: userData[":user/email"] || "",
        uid: userUid,
        method: "official-api",
        fullData: userData,
      };
    }

    return null;
  } catch (error) {
    console.warn("Official API user detection failed:", error);
    return null;
  }
};

/**
 * 🗂️ Get current user via localStorage (David Vargas method)
 */
const getCurrentUserViaLocalStorage = () => {
  try {
    const globalAppState = JSON.parse(
      localStorage.getItem("globalAppState") || '["","",[]]'
    );

    const userIndex = globalAppState.findIndex((s) => s === "~:user");
    if (userIndex > 0) {
      const userData = globalAppState[userIndex + 1];

      if (userData && Array.isArray(userData)) {
        const uidIndex = userData.findIndex((s) => s === "~:uid");
        const emailIndex = userData.findIndex((s) => s === "~:email");
        const displayNameIndex = userData.findIndex(
          (s) => s === "~:display-name"
        );

        return {
          displayName:
            uidIndex > 0
              ? userData[displayNameIndex + 1] || userData[uidIndex + 1]
              : "localStorage User",
          email: emailIndex > 0 ? userData[emailIndex + 1] : "",
          uid: uidIndex > 0 ? userData[uidIndex + 1] : "localStorage-uid",
          method: "localStorage",
          rawData: userData,
        };
      }
    }

    return null;
  } catch (error) {
    console.warn("localStorage user detection failed:", error);
    return null;
  }
};

/**
 * 🔍 Get current user via DOM scanning (fallback method)
 */
const getCurrentUserViaDOM = () => {
  try {
    // Method 1: Check user menu in topbar
    const userButton = document.querySelector(
      '.bp3-button[data-testid="user-button"]'
    );
    if (userButton) {
      const displayName = userButton.textContent?.trim();
      if (displayName && displayName !== "?" && displayName.length > 0) {
        return {
          displayName: displayName,
          email: "",
          uid: `dom-${displayName.toLowerCase().replace(/\s+/g, "-")}`,
          method: "dom-user-button",
        };
      }
    }

    // Method 2: Check graph settings or other DOM indicators
    const graphName = window.location.hostname.split(".")[0];
    if (graphName && graphName !== "roamresearch") {
      return {
        displayName: `Graph User (${graphName})`,
        email: "",
        uid: `dom-graph-${graphName}`,
        method: "dom-graph-fallback",
      };
    }

    // Method 3: Ultimate fallback
    return {
      displayName: "Unknown User",
      email: "",
      uid: "unknown-fallback",
      method: "fallback",
    };
  } catch (error) {
    console.warn("DOM user detection failed:", error);
    return {
      displayName: "Error User",
      email: "",
      uid: "error",
      method: "error",
    };
  }
};

/**
 * 🔍 Get current user with caching and multiple detection methods
 */
const getCurrentUser = () => {
  const now = Date.now();

  // Return cached result if still valid
  if (userCache && now - lastCacheTime < CACHE_DURATION) {
    return userCache;
  }

  // Try methods in order of preference
  let result = getCurrentUserViaOfficialAPI(); // Best method

  if (!result) {
    result = getCurrentUserViaLocalStorage(); // Fallback method
  }

  if (!result || result.method === "error") {
    result = getCurrentUserViaDOM(); // Last resort
  }

  // Cache result if successful
  if (result && result.method !== "error") {
    userCache = result;
    lastCacheTime = now;
  }

  return result;
};

/**
 * 🔄 Clear user cache (for testing)
 */
const clearUserCache = () => {
  userCache = null;
  lastCacheTime = 0;
  console.log("🔄 User cache cleared");
};

// ===================================================================
// 🔧 CORE DATA MANAGEMENT - Find and Set Data Values
// ===================================================================

/**
 * 📋 Normalize header text for exact matching
 */
const normalizeHeaderText = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .trim() // Remove whitespace
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold** formatting
    .replace(/::+$/, ":") // Normalize :: to :
    .replace(/:+$/, "") // Remove trailing colons
    .toLowerCase(); // Case insensitive
};

/**
 * 🎯 Find exact header block (no substring matching)
 */
const findExactHeaderBlock = (blocks, headerPatterns) => {
  if (
    !blocks ||
    !Array.isArray(blocks) ||
    !headerPatterns ||
    !Array.isArray(headerPatterns)
  ) {
    return null;
  }

  return blocks.find((block) => {
    if (!block || !Array.isArray(block) || block.length < 2) {
      return false;
    }

    const normalizedText = normalizeHeaderText(block[1]);

    return headerPatterns.some((pattern) => {
      const normalizedPattern = normalizeHeaderText(pattern);
      return normalizedText === normalizedPattern; // EXACT MATCH ONLY
    });
  });
};

/**
 * 🔍 Find data value with exact header matching
 */
const findDataValueExact = (pageUid, headerText) => {
  if (!pageUid || !headerText) return null;

  try {
    const blocks = window.roamAlphaAPI.q(`
      [:find ?uid ?text
       :where 
       [?page :block/uid "${pageUid}"]
       [?page :block/children ?block]
       [?block :block/uid ?uid]
       [?block :block/string ?text]]
    `);

    // Find the exact header block
    const headerBlock = findExactHeaderBlock(blocks, [headerText]);
    if (!headerBlock) return null;

    const headerUid = headerBlock[0];

    // Get children of header block
    const children = getDirectChildren(headerUid);
    if (children.length === 0) return null;

    // Return first child's text (the value)
    return children[0].text;
  } catch (error) {
    console.warn(`Failed to find data value for "${headerText}":`, error);
    return null;
  }
};

/**
 * 🏗️ Set structured data value
 */
const setDataValueStructured = async (pageUid, headerText, value) => {
  if (!pageUid || !headerText) return false;

  try {
    // First, try to find existing header
    const existingValue = findDataValueExact(pageUid, headerText);

    if (existingValue !== null) {
      // Update existing value
      const blocks = window.roamAlphaAPI.q(`
        [:find ?uid ?text
         :where 
         [?page :block/uid "${pageUid}"]
         [?page :block/children ?block]
         [?block :block/uid ?uid]
         [?block :block/string ?text]]
      `);

      const headerBlock = findExactHeaderBlock(blocks, [headerText]);
      if (headerBlock) {
        const headerUid = headerBlock[0];
        const children = getDirectChildren(headerUid);

        if (children.length > 0) {
          // Update first child
          await window.roamAlphaAPI.updateBlock({
            block: { uid: children[0].uid, string: value.toString() },
          });
          return true;
        } else {
          // Create child under existing header
          await window.roamAlphaAPI.createBlock({
            location: { "parent-uid": headerUid, order: 0 },
            block: { string: value.toString() },
          });
          return true;
        }
      }
    } else {
      // Create new header with value
      const headerUid = window.roamAlphaAPI.util.generateUID();

      // Create header block
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": pageUid, order: "last" },
        block: { uid: headerUid, string: `**${headerText}:**` },
      });

      // Create value block under header
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": headerUid, order: 0 },
        block: { string: value.toString() },
      });

      return true;
    }
  } catch (error) {
    console.error(`Failed to set data value for "${headerText}":`, error);
    return false;
  }
};

// ===================================================================
// 🚀 BULLETPROOF CASCADING - Hierarchical Block Creation
// ===================================================================

/**
 * 🎯 The bulletproof cascading function
 */
const cascadeToBlock = async (pageTitle, path, createPageIfMissing = false) => {
  try {
    console.log(`🚀 Starting cascade to: ${pageTitle} -> ${path.join(" / ")}`);

    // Get or create page
    let pageUid = getPageUidByTitle(pageTitle);

    if (!pageUid && createPageIfMissing) {
      console.log(`📄 Creating page: ${pageTitle}`);
      pageUid = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createPage({
        page: { title: pageTitle, uid: pageUid },
      });
    }

    if (!pageUid) {
      throw new Error(`Page "${pageTitle}" not found and creation disabled`);
    }

    // Start cascading from page root
    let currentParentUid = pageUid;

    for (let i = 0; i < path.length; i++) {
      const targetText = path[i];
      console.log(`🔍 Looking for: "${targetText}" under ${currentParentUid}`);

      // Get children of current parent
      const children = getDirectChildren(currentParentUid);

      // Look for exact match
      const existingChild = children.find((child) => {
        const normalizedChild = normalizeHeaderText(child.text);
        const normalizedTarget = normalizeHeaderText(targetText);
        return normalizedChild === normalizedTarget;
      });

      if (existingChild) {
        console.log(`✅ Found existing: ${existingChild.uid}`);
        currentParentUid = existingChild.uid;
      } else {
        console.log(`➕ Creating new block: "${targetText}"`);
        const newUid = window.roamAlphaAPI.util.generateUID();

        await window.roamAlphaAPI.createBlock({
          location: { "parent-uid": currentParentUid, order: "last" },
          block: { uid: newUid, string: targetText },
        });

        currentParentUid = newUid;
      }
    }

    console.log(`🎯 Final cascade result: ${currentParentUid}`);
    return currentParentUid;
  } catch (error) {
    console.error("❌ Cascade failed:", error);
    throw error;
  }
};

// ===================================================================
// 🆕 HIERARCHICAL LIST MANAGEMENT - Advanced List Operations
// ===================================================================

/**
 * 🔒 Ensure a block exists in a hierarchical structure
 */
const ensureBlockExists = async (pageTitle, path, blockText) => {
  try {
    const parentUid = await cascadeToBlock(pageTitle, path, true);

    // Check if block already exists
    const children = getDirectChildren(parentUid);
    const existingBlock = children.find(
      (child) =>
        normalizeHeaderText(child.text) === normalizeHeaderText(blockText)
    );

    if (existingBlock) {
      return existingBlock.uid;
    }

    // Create new block
    const newUid = window.roamAlphaAPI.util.generateUID();
    await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": parentUid, order: "last" },
      block: { uid: newUid, string: blockText },
    });

    return newUid;
  } catch (error) {
    console.error("Failed to ensure block exists:", error);
    return null;
  }
};

/**
 * ➕ Add item to a hierarchical list
 */
const addToBlockList = async (pageTitle, path, listHeader, newItem) => {
  try {
    const listUid = await cascadeToBlock(
      pageTitle,
      [...path, listHeader],
      true
    );

    // Check if item already exists
    const items = getBlockListItems(pageTitle, path, listHeader);
    if (items.includes(newItem)) {
      console.log(`📝 Item "${newItem}" already exists in list`);
      return false;
    }

    // Add new item
    await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": listUid, order: "last" },
      block: { string: newItem },
    });

    console.log(`✅ Added "${newItem}" to list`);
    return true;
  } catch (error) {
    console.error("Failed to add to block list:", error);
    return false;
  }
};

/**
 * ➖ Remove item from a hierarchical list
 */
const removeFromBlockList = async (
  pageTitle,
  path,
  listHeader,
  itemToRemove
) => {
  try {
    const listUid = await cascadeToBlock(
      pageTitle,
      [...path, listHeader],
      false
    );
    if (!listUid) return false;

    const children = getDirectChildren(listUid);
    const itemToDelete = children.find(
      (child) =>
        normalizeHeaderText(child.text) === normalizeHeaderText(itemToRemove)
    );

    if (itemToDelete) {
      await window.roamAlphaAPI.deleteBlock({
        block: { uid: itemToDelete.uid },
      });
      console.log(`🗑️ Removed "${itemToRemove}" from list`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to remove from block list:", error);
    return false;
  }
};

/**
 * 📋 Get all items from a hierarchical list
 */
const getBlockListItems = (pageTitle, path, listHeader) => {
  try {
    const pageUid = getPageUidByTitle(pageTitle);
    if (!pageUid) return [];

    // Navigate to list location
    let currentUid = pageUid;
    for (const pathItem of [...path, listHeader]) {
      const children = getDirectChildren(currentUid);
      const found = children.find(
        (child) =>
          normalizeHeaderText(child.text) === normalizeHeaderText(pathItem)
      );

      if (!found) return [];
      currentUid = found.uid;
    }

    // Get list items
    const children = getDirectChildren(currentUid);
    return children.map((child) => child.text);
  } catch (error) {
    console.error("Failed to get block list items:", error);
    return [];
  }
};

// ===================================================================
// 🖼️ IMAGE EXTRACTION UTILITIES - Process Roam Content for Images
// ===================================================================

/**
 * 🖼️ Extract image URLs from Roam block text
 */
const extractImageUrls = (text) => {
  if (!text || typeof text !== "string") return [];

  const imageUrls = [];

  // Roam image pattern: ![alt](url)
  const roamImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = roamImagePattern.exec(text)) !== null) {
    imageUrls.push({
      url: match[2],
      alt: match[1] || "",
      type: "roam-markdown",
    });
  }

  // Firebase storage URLs (common in Roam)
  const firebasePattern =
    /https:\/\/firebasestorage\.googleapis\.com\/[^\s)]+/g;
  const firebaseMatches = text.match(firebasePattern);
  if (firebaseMatches) {
    firebaseMatches.forEach((url) => {
      if (!imageUrls.some((img) => img.url === url)) {
        imageUrls.push({
          url: url,
          alt: "",
          type: "firebase-direct",
        });
      }
    });
  }

  // General image URLs
  const urlPattern =
    /https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s)]*)?/gi;
  const urlMatches = text.match(urlPattern);
  if (urlMatches) {
    urlMatches.forEach((url) => {
      if (!imageUrls.some((img) => img.url === url)) {
        imageUrls.push({
          url: url,
          alt: "",
          type: "direct-url",
        });
      }
    });
  }

  return imageUrls;
};

// ===================================================================
// 🧪 TESTING FUNCTIONS - Verify All Functionality
// ===================================================================

/**
 * 🧪 Test current page title function
 */
const testGetCurrentPageTitle = () => {
  console.group("🧪 Testing getCurrentPageTitle");

  const title = getCurrentPageTitle();
  const currentUid = window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();

  console.log("Current UID:", currentUid);
  console.log("Current Page Title:", title);
  console.log("Current URL:", window.location.href);

  if (title) {
    console.log("✅ Successfully got current page title");
  } else {
    console.log("❌ Failed to get current page title");
  }

  console.groupEnd();
};

/**
 * 🧪 Test user detection functions
 */
const testUserDetection = () => {
  console.group("🧪 Testing User Detection");

  console.log("Official API:", getCurrentUserViaOfficialAPI());
  console.log("localStorage:", getCurrentUserViaLocalStorage());
  console.log("DOM:", getCurrentUserViaDOM());
  console.log("Combined:", getCurrentUser());

  console.groupEnd();
};

/**
 * 🧪 Test bulletproof cascading
 */
const testCascadeToBlock = async () => {
  console.group("🧪 Testing bulletproof cascadeToBlock");

  try {
    console.log("🎯 Test 1: Creating simple hierarchy...");
    const result1 = await cascadeToBlock(
      "Test Page 1",
      ["Projects", "Web Development", "Roam Extensions"],
      true
    );
    console.log(`✅ Result 1: ${result1}`);

    console.log("\n🎯 Test 2: Adding to existing hierarchy...");
    const result2 = await cascadeToBlock(
      "Test Page 1",
      ["Projects", "Web Development", "Documentation"],
      true
    );
    console.log(`✅ Result 2: ${result2}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 Test hierarchical list management
 */
const testHierarchicalUtilities = async () => {
  console.group("🧪 Testing Hierarchical List Management");

  try {
    const testPage = "Test List Management";
    const testPath = ["Settings", "User Preferences"];
    const testList = "Favorite Pages";

    // Test adding items
    await addToBlockList(testPage, testPath, testList, "Daily Notes");
    await addToBlockList(testPage, testPath, testList, "Chat Room");
    await addToBlockList(testPage, testPath, testList, "Project Dashboard");

    // Test getting items
    const items = getBlockListItems(testPage, testPath, testList);
    console.log("List items:", items);

    // Test removing item
    await removeFromBlockList(testPage, testPath, testList, "Chat Room");

    // Test final state
    const finalItems = getBlockListItems(testPage, testPath, testList);
    console.log("Final items:", finalItems);

    console.log("✅ Hierarchical list management test completed");
  } catch (error) {
    console.error("❌ Hierarchical test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 Test image extraction
 */
const testImageExtraction = () => {
  console.group("🧪 Testing Image Extraction");

  const testTexts = [
    "Check out this image: ![avatar](https://example.com/avatar.jpg)",
    "Firebase: https://firebasestorage.googleapis.com/v0/b/test/avatar.png",
    "Direct: https://cdn.example.com/image.gif",
  ];

  testTexts.forEach((text, index) => {
    console.log(`Test ${index + 1}:`, text);
    console.log("Extracted:", extractImageUrls(text));
  });

  console.groupEnd();
};

/**
 * 🚀 Run all tests
 */
const runAllTests = async () => {
  console.log("🚀 Running all Extension 1.5 tests...");

  testGetCurrentPageTitle();
  testUserDetection();
  testImageExtraction();
  await testCascadeToBlock();
  await testHierarchicalUtilities();

  console.log("✅ All tests completed!");
};

// ===================================================================
// 🎛️ UTILITIES REGISTRY - Complete Function Export
// ===================================================================

const UTILITIES = {
  // 📍 Navigation utilities
  getCurrentPageTitle,
  getPageUidByTitle,
  getDirectChildren,

  // 👤 User detection utilities
  getCurrentUser,
  getCurrentUserViaOfficialAPI,
  getCurrentUserViaLocalStorage,
  getCurrentUserViaDOM,
  clearUserCache,

  // 🔧 Core data management
  findDataValueExact,
  setDataValueStructured,
  normalizeHeaderText,
  findExactHeaderBlock,

  // 🚀 Bulletproof cascading
  cascadeToBlock,

  // 🆕 Hierarchical list management
  ensureBlockExists,
  addToBlockList,
  removeFromBlockList,
  getBlockListItems,

  // 🖼️ Image processing
  extractImageUrls,

  // 🧪 Testing functions
  testGetCurrentPageTitle,
  testUserDetection,
  testCascadeToBlock,
  testHierarchicalUtilities,
  testImageExtraction,
  runAllTests,
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Foundation Platform Integration
// ===================================================================

export default {
  onload: () => {
    console.log("🔧 Extension 1.5 loading with complete utilities library...");

    // Initialize extension registry if it doesn't exist
    if (!window._extensionRegistry) {
      window._extensionRegistry = {
        extensions: new Map(),
        utilities: {},
        commands: [],
        domListeners: [],
        elements: [],
      };
    }

    // Ensure utilities object exists
    if (!window._extensionRegistry.utilities) {
      window._extensionRegistry.utilities = {};
    }

    // 🧪 Command palette functions for testing
    const commands = [
      {
        label: "Test: Current Page Title Detection",
        callback: testGetCurrentPageTitle,
      },
      {
        label: "Test: User Detection Methods",
        callback: testUserDetection,
      },
      {
        label: "Test: Bulletproof Cascade to Block",
        callback: testCascadeToBlock,
      },
      {
        label: "Test: Hierarchical List Management",
        callback: testHierarchicalUtilities,
      },
      {
        label: "Test: Image Extraction Utility",
        callback: testImageExtraction,
      },
      {
        label: "Test: Run All Extension 1.5 Tests",
        callback: runAllTests,
      },
    ];

    // Register commands with Roam
    commands.forEach((cmd) => {
      if (window.roamAlphaAPI && window.roamAlphaAPI.ui.commandPalette) {
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: cmd.label,
          callback: cmd.callback,
        });
      }
      window._extensionRegistry.commands.push(cmd);
    });

    // 🔧 Register all utilities globally
    Object.entries(UTILITIES).forEach(([name, utility]) => {
      window._extensionRegistry.utilities[name] = utility;
    });

    // 🎯 Register with extension platform if available
    if (
      window.RoamExtensionSuite &&
      window.RoamExtensionSuite.registerUtility
    ) {
      Object.entries(UTILITIES).forEach(([name, utility]) => {
        window.RoamExtensionSuite.registerUtility(name, utility);
      });

      // Register the extension itself
      window.RoamExtensionSuite.register("utility-library", UTILITIES, {
        name: "Extension 1.5: Complete Core Utilities Library",
        description:
          "Navigation, user detection, data management, hierarchical lists, and image processing",
        version: "1.5.0",
        dependencies: [],
      });
    }

    // ✅ Extension successfully loaded
    console.log("✅ Extension 1.5 loaded successfully!");
    console.log(`🔧 Registered ${Object.keys(UTILITIES).length} utilities:`);
    console.log(
      "   📍 NAVIGATION: getCurrentPageTitle, getPageUidByTitle, getDirectChildren"
    );
    console.log(
      "   👤 USER DETECTION: getCurrentUser (with 3 detection methods)"
    );
    console.log(
      "   🔧 DATA MANAGEMENT: findDataValueExact, setDataValueStructured, cascadeToBlock"
    );
    console.log(
      "   🆕 LIST MANAGEMENT: ensureBlockExists, addToBlockList, removeFromBlockList, getBlockListItems"
    );
    console.log("   🖼️ IMAGE PROCESSING: extractImageUrls");
    console.log(
      "   🧪 TESTING: testGetCurrentPageTitle, testUserDetection, runAllTests"
    );
    console.log("💡 Try the test commands to see the utilities in action!");

    return {
      extensionId: "utility-library",
      utilities: UTILITIES,
    };
  },

  onunload: () => {
    console.log("🔧 Extension 1.5 unloading...");

    // Clear user cache
    clearUserCache();

    // Additional cleanup would be handled by the registry
    console.log("✅ Extension 1.5 cleanup complete!");
  },
};
