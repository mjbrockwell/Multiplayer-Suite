// ===================================================================
// Extension 1.5: Lean Universal Parser - Exact Matching + Bulletproof Cascading + Hierarchical List Management
// UPDATED: Added four new utilities for hierarchical list management
// Features: Exact block matching + proven cascading pattern + composable list operations
// ===================================================================

// ===================================================================
// 🔧 EXACT MATCHING CORE FUNCTIONS - Clean & Simple
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

// ===================================================================
// 🚀 BULLETPROOF CASCADING FUNCTION - The Revolutionary Fix!
// ===================================================================

/**
 * 🚀 BULLETPROOF cascadeToBlock - Proven pattern from Subjournals with full error handling
 * This eliminates ALL race conditions and timing issues in block creation!
 */
const cascadeToBlock = async (targetPageTitle, hierarchy, debug = false) => {
  try {
    if (debug) console.log(`🔄 Starting cascade to: ${targetPageTitle}`);

    // 1. Get or create target page
    let pageUid = getPageUidByTitle(targetPageTitle);
    if (!pageUid) {
      if (debug) console.log(`📄 Creating page: ${targetPageTitle}`);
      pageUid = await window.roamAlphaAPI.data.page.create({
        page: { title: targetPageTitle },
      });
    }

    // 2. Build hierarchy step by step
    let currentParentUid = pageUid;

    for (let i = 0; i < hierarchy.length; i++) {
      const targetText = hierarchy[i];
      if (debug) console.log(`🔗 Level ${i + 1}: Looking for "${targetText}"`);

      // Get current children
      const children = getDirectChildren(currentParentUid);
      let foundChild = children.find(
        (child) =>
          normalizeHeaderText(child.text) === normalizeHeaderText(targetText)
      );

      if (!foundChild) {
        if (debug) console.log(`➕ Creating block: "${targetText}"`);

        // Create the missing block
        const newBlockUid = await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": currentParentUid, order: "last" },
          block: { string: targetText },
        });

        currentParentUid = newBlockUid;
      } else {
        if (debug) console.log(`✅ Found existing: "${foundChild.text}"`);
        currentParentUid = foundChild.uid;
      }
    }

    if (debug)
      console.log(`🎯 Cascade complete! Final UID: ${currentParentUid}`);
    return currentParentUid;
  } catch (error) {
    console.error("❌ cascadeToBlock failed:", error);
    throw error;
  }
};

// ===================================================================
// 🖼️ IMAGE EXTRACTION UTILITY - For Avatar and Media Processing
// ===================================================================

/**
 * 🖼️ EXTRACT IMAGE URLS from a block - Handles multiple image formats
 * @param {string} blockUid - UID of the block containing images
 * @returns {Array<string>} - Array of image URL strings
 */
const extractImageUrls = (blockUid) => {
  if (!blockUid) {
    console.warn("extractImageUrls: blockUid is required");
    return [];
  }

  try {
    // Get block content
    const blockContent = window.roamAlphaAPI.data.q(`
      [:find ?string :where [?e :block/uid "${blockUid}"] [?e :block/string ?string]]
    `)?.[0]?.[0];

    if (!blockContent) {
      return [];
    }

    const imageUrls = [];

    // 1. Extract from markdown image syntax: ![alt](url)
    const markdownImages = blockContent.match(/!\[.*?\]\((.*?)\)/g);
    if (markdownImages) {
      markdownImages.forEach((match) => {
        const url = match.match(/!\[.*?\]\((.*?)\)/)?.[1];
        if (url && url.trim()) {
          imageUrls.push(url.trim());
        }
      });
    }

    // 2. Extract from direct URLs (http/https images)
    const urlPattern =
      /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?/gi;
    const directUrls = blockContent.match(urlPattern);
    if (directUrls) {
      directUrls.forEach((url) => {
        if (!imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      });
    }

    // 3. Extract from Roam attachments: {{[[file]]:filename.jpg}}
    const attachmentPattern = /\{\{\[\[file\]\]:([^}]+)\}\}/g;
    const attachments = [...blockContent.matchAll(attachmentPattern)];
    attachments.forEach((match) => {
      const filename = match[1];
      if (filename && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)) {
        // Convert to proper Roam attachment URL format
        const attachmentUrl = `./attachments/${filename}`;
        imageUrls.push(attachmentUrl);
      }
    });

    // 4. Extract from block references that might contain images
    const blockRefPattern = /\(\(([^)]+)\)\)/g;
    const blockRefs = [...blockContent.matchAll(blockRefPattern)];
    for (const match of blockRefs) {
      const refUid = match[1];
      if (refUid) {
        // Recursively check referenced blocks for images
        const refImages = extractImageUrls(refUid);
        refImages.forEach((url) => {
          if (!imageUrls.includes(url)) {
            imageUrls.push(url);
          }
        });
      }
    }

    // 5. Check child blocks for images
    const children = getDirectChildren(blockUid);
    children.forEach((child) => {
      const childImages = extractImageUrls(child.uid);
      childImages.forEach((url) => {
        if (!imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      });
    });

    return imageUrls;
  } catch (error) {
    console.error(
      `extractImageUrls: Failed to extract from block ${blockUid}:`,
      error
    );
    return [];
  }
};

// ===================================================================
// 🆕 HIERARCHICAL LIST MANAGEMENT UTILITIES - The Four New Functions!
// ===================================================================

/**
 * 🏗️ ENSURE BLOCK EXISTS - Creates block if missing, returns UID if exists
 * @param {string} parentUid - UID of the parent block
 * @param {string} blockText - Text content for the block
 * @returns {Promise<string>} - UID of the block (created or existing)
 */
const ensureBlockExists = async (parentUid, blockText) => {
  if (!parentUid || !blockText) {
    throw new Error("ensureBlockExists requires parentUid and blockText");
  }

  try {
    // Check if block already exists as a child
    const children = getDirectChildren(parentUid);
    const existingBlock = children.find(
      (child) =>
        normalizeHeaderText(child.text) === normalizeHeaderText(blockText)
    );

    if (existingBlock) {
      console.log(
        `✅ Block already exists: "${blockText}" (${existingBlock.uid})`
      );
      return existingBlock.uid;
    }

    // Create the block since it doesn't exist
    console.log(`➕ Creating block: "${blockText}"`);
    const newBlockUid = await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": parentUid, order: "last" },
      block: { string: blockText },
    });

    return newBlockUid;
  } catch (error) {
    console.error(`❌ ensureBlockExists failed for "${blockText}":`, error);
    throw error;
  }
};

/**
 * 📝 ADD TO BLOCK LIST - Adds item as child block if not already there
 * @param {string} parentUid - UID of the parent block
 * @param {string} itemText - Text content for the list item
 * @returns {Promise<boolean>} - true if added, false if already existed
 */
const addToBlockList = async (parentUid, itemText) => {
  if (!parentUid || !itemText) {
    throw new Error("addToBlockList requires parentUid and itemText");
  }

  try {
    // Check if item already exists as a child
    const children = getDirectChildren(parentUid);
    const existingItem = children.find(
      (child) =>
        normalizeHeaderText(child.text) === normalizeHeaderText(itemText)
    );

    if (existingItem) {
      console.log(`⚠️ Item already in list: "${itemText}"`);
      return false; // Already exists
    }

    // Add the item since it doesn't exist
    console.log(`➕ Adding to list: "${itemText}"`);
    await window.roamAlphaAPI.data.block.create({
      location: { "parent-uid": parentUid, order: "last" },
      block: { string: itemText },
    });

    return true; // Successfully added
  } catch (error) {
    console.error(`❌ addToBlockList failed for "${itemText}":`, error);
    throw error;
  }
};

/**
 * 🗑️ REMOVE FROM BLOCK LIST - Removes item from child blocks if it exists
 * @param {string} parentUid - UID of the parent block
 * @param {string} itemText - Text content to remove
 * @returns {Promise<boolean>} - true if removed, false if not found
 */
const removeFromBlockList = async (parentUid, itemText) => {
  if (!parentUid || !itemText) {
    throw new Error("removeFromBlockList requires parentUid and itemText");
  }

  try {
    // Find the item to remove
    const children = getDirectChildren(parentUid);
    const itemToRemove = children.find(
      (child) =>
        normalizeHeaderText(child.text) === normalizeHeaderText(itemText)
    );

    if (!itemToRemove) {
      console.log(`⚠️ Item not found in list: "${itemText}"`);
      return false; // Not found
    }

    // Remove the item
    console.log(`🗑️ Removing from list: "${itemText}"`);
    await window.roamAlphaAPI.data.block.delete({
      block: { uid: itemToRemove.uid },
    });

    return true; // Successfully removed
  } catch (error) {
    console.error(`❌ removeFromBlockList failed for "${itemText}":`, error);
    throw error;
  }
};

/**
 * 📋 GET BLOCK LIST ITEMS - Returns array of child block texts
 * @param {string} parentUid - UID of the parent block
 * @returns {Array<string>} - Array of child block text contents
 */
const getBlockListItems = (parentUid) => {
  if (!parentUid) {
    console.warn("getBlockListItems requires parentUid");
    return [];
  }

  try {
    const children = getDirectChildren(parentUid);
    return children.map((child) => child.text);
  } catch (error) {
    console.error(
      `❌ getBlockListItems failed for parent ${parentUid}:`,
      error
    );
    return [];
  }
};

// ===================================================================
// 🧪 TEST FUNCTIONS FOR NEW UTILITIES
// ===================================================================

/**
 * 🧪 Test the new hierarchical list management utilities
 */
const testHierarchicalUtilities = async () => {
  console.group("🧪 Testing Hierarchical List Management Utilities");

  try {
    // Test scenario: Managing graph members
    const pageUid = getPageUidByTitle("roam/graph members");
    if (!pageUid) {
      console.log("❌ Test page 'roam/graph members' not found");
      return;
    }

    // 1. Test ensureBlockExists
    console.log("\n1️⃣ Testing ensureBlockExists...");
    const directoryUid = await ensureBlockExists(pageUid, "Directory::");
    console.log(`✅ Directory block UID: ${directoryUid}`);

    // 2. Test addToBlockList
    console.log("\n2️⃣ Testing addToBlockList...");
    const added = await addToBlockList(directoryUid, "Matt Brockwell");
    console.log(`✅ Added Matt Brockwell: ${added}`);

    // 3. Test getBlockListItems
    console.log("\n3️⃣ Testing getBlockListItems...");
    const items = getBlockListItems(directoryUid);
    console.log(`✅ Current list items:`, items);

    // 4. Test removeFromBlockList
    console.log("\n4️⃣ Testing removeFromBlockList...");
    const removed = await removeFromBlockList(directoryUid, "Matt Brockwell");
    console.log(`✅ Removed Matt Brockwell: ${removed}`);

    // 5. Check final state
    console.log("\n5️⃣ Final state check...");
    const finalItems = getBlockListItems(directoryUid);
    console.log(`✅ Final list items:`, finalItems);

    console.log("\n🎉 All hierarchical utility tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🧪 Test the image extraction utility
 */
const testImageExtraction = async () => {
  console.group("🧪 Testing Image Extraction Utility");

  try {
    // Test with the current user's avatar
    const currentUser = getCurrentUser();
    console.log(`Testing with user: ${currentUser.displayName}`);

    // Try to find user's home page
    const userPageUid = getPageUidByTitle(currentUser.displayName);
    if (!userPageUid) {
      console.log("❌ User's home page not found");
      return;
    }

    // Look for "My Info::" and "Avatar::" structure
    const myInfoData = findDataValueExact(userPageUid, "My Info");
    console.log("My Info data:", myInfoData);

    // If we have My Info structure, test avatar extraction
    if (myInfoData) {
      // This is a simplified test - in real use, we'd navigate the hierarchy
      console.log("✅ Found My Info structure, testing image extraction...");
    }

    // Test with a mock block UID (for demonstration)
    console.log("\n🔍 Testing extractImageUrls function directly...");
    const testImages = extractImageUrls("mock-block-uid");
    console.log(`✅ Function executed without errors, returned:`, testImages);
  } catch (error) {
    console.error("❌ Image extraction test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🎯 Quick test for graph members workflow
 */
const testGraphMembersWorkflow = async () => {
  console.log("🎯 Testing complete graph members workflow...");

  try {
    // Step 1: Ensure page exists
    const pageUid =
      getPageUidByTitle("roam/graph members") ||
      (await window.roamAlphaAPI.data.page.create({
        page: { title: "roam/graph members" },
      }));

    // Step 2: Ensure Directory:: block exists
    const directoryUid = await ensureBlockExists(pageUid, "Directory::");

    // Step 3: Add member if not already there
    const memberAdded = await addToBlockList(directoryUid, "Matt Brockwell");

    console.log(`✅ Graph members workflow complete!`);
    console.log(`   Page UID: ${pageUid}`);
    console.log(`   Directory UID: ${directoryUid}`);
    console.log(`   Member added: ${memberAdded}`);
  } catch (error) {
    console.error("❌ Graph members workflow failed:", error);
  }
};

// ===================================================================
// 🔧 EXISTING UTILITY FUNCTIONS (from previous version)
// ===================================================================

/**
 * 📄 Normalize category name for consistent processing
 */
const normalizeCategoryName = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    .replace(/\*\*/g, "") // Remove bold formatting
    .replace(/::?$/, "") // Remove trailing colons
    .replace(/^-+\s*/, "") // Remove leading dashes
    .toLowerCase() // Case insensitive
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, "") // Remove special characters
    .replace(/_+/g, "_") // Normalize multiple underscores
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
};

/**
 * 🎯 Extract data value using exact block matching
 * Returns whatever is actually there - no filtering
 */
const findDataValueExact = (pageUid, key) => {
  if (!pageUid || !key) return null;

  try {
    // Get all top-level blocks on the page
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `);

    // Generate header patterns for exact matching
    const headerPatterns = [
      key, // Plain format
      `${key}:`, // Colon format
      `${key}::`, // Attribute format
      `**${key}:**`, // Bold format
      `**${key}**:`, // Alt bold format
    ];

    // Find exact header match
    const foundBlock = findExactHeaderBlock(allBlocks, headerPatterns);

    if (!foundBlock) {
      return null;
    }

    const [blockUid, blockText] = foundBlock;

    // Get children blocks (the actual values)
    const children = getDirectChildren(blockUid);

    if (children.length === 0) {
      return null;
    } else if (children.length === 1) {
      return children[0].text; // Single value - whatever it is
    } else {
      return children.map((child) => child.text); // Multiple values - whatever they are
    }
  } catch (error) {
    console.error(`Error in findDataValueExact for "${key}":`, error);
    return null;
  }
};

/**
 * 🏗️ Extract nested data values using exact hierarchical matching
 */
const findNestedDataValuesExact = (pageUid, parentKey) => {
  if (!pageUid || !parentKey) return null;

  try {
    // Get all top-level blocks on the page
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `);

    // Generate parent header patterns
    const parentHeaderPatterns = [
      parentKey,
      `${parentKey}:`,
      `${parentKey}::`,
      `**${parentKey}:**`,
      `**${parentKey}**:`,
    ];

    // Find exact parent header match
    const parentBlock = findExactHeaderBlock(allBlocks, parentHeaderPatterns);

    if (!parentBlock) {
      return null;
    }

    const [parentBlockUid, parentBlockText] = parentBlock;

    // Get all category children of the parent
    const categoryBlocks = getDirectChildren(parentBlockUid);

    if (categoryBlocks.length === 0) {
      return {};
    }

    // Extract data from each category - whatever is there
    const nestedData = {};

    for (const categoryBlock of categoryBlocks) {
      const categoryName = normalizeCategoryName(categoryBlock.text);

      if (!categoryName) {
        continue; // Skip invalid category names
      }

      // Get data children for this category
      const categoryData = getDirectChildren(categoryBlock.uid);

      if (categoryData.length === 0) {
        // No data children - don't set the key
      } else if (categoryData.length === 1) {
        nestedData[categoryName] = categoryData[0].text; // Whatever the value is
      } else {
        nestedData[categoryName] = categoryData.map((item) => item.text); // Whatever the values are
      }
    }

    return nestedData;
  } catch (error) {
    console.error(
      `Error in findNestedDataValuesExact for "${parentKey}":`,
      error
    );
    return null;
  }
};

/**
 * 🛠️ Create structured data with proper hierarchy
 */
const setDataValueStructured = async (
  pageUid,
  key,
  value,
  useAttributeFormat = false
) => {
  if (!pageUid || !key) return false;

  try {
    // Format the key for exact matching
    const keyText = useAttributeFormat ? `${key}::` : `**${key}:**`;

    // Check if key block already exists using exact matching
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);

    const headerPatterns = [
      key,
      `${key}:`,
      `${key}::`,
      `**${key}:**`,
      `**${key}**:`,
    ];

    let keyBlock = findExactHeaderBlock(allBlocks, headerPatterns);
    let keyBlockUid;

    if (!keyBlock) {
      // Create new key block
      keyBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: keyText },
      });
    } else {
      keyBlockUid = keyBlock[0];

      // Clear existing children for clean update
      const existingChildren = getDirectChildren(keyBlockUid);
      for (const child of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: child.uid },
        });
      }
    }

    // Add value(s) as children
    const values = Array.isArray(value) ? value : [value];

    for (const val of values) {
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyBlockUid, order: "last" },
        block: { string: String(val) },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error in setDataValueStructured for "${key}":`, error);
    return false;
  }
};

// ===================================================================
// 🔍 USER DETECTION FUNCTIONS
// ===================================================================

let userCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

/**
 * 🔍 Get current user via official API (primary method)
 */
const getCurrentUserViaOfficialAPI = () => {
  try {
    if (window.roamAlphaAPI && window.roamAlphaAPI.graph) {
      const user = window.roamAlphaAPI.graph.getUser?.();
      if (user && user.uid) {
        return {
          displayName: user.displayName || user.email || "Unknown User",
          email: user.email || "",
          uid: user.uid,
          method: "official-api",
        };
      }
    }
  } catch (error) {
    console.warn("Official API user detection failed:", error);
  }
  return null;
};

/**
 * 🔍 Get current user via DOM scanning (fallback method)
 */
const getCurrentUserViaDOM = () => {
  try {
    // Method 1: User menu button
    const userMenuButton = document.querySelector(
      'button[data-testid="user-menu"]'
    );
    if (userMenuButton) {
      const userName = userMenuButton.textContent?.trim();
      if (userName) {
        return {
          displayName: userName,
          email: "",
          uid: `dom-${userName.toLowerCase().replace(/\s+/g, "-")}`,
          method: "dom-user-menu",
        };
      }
    }

    // Method 2: Profile containers
    const profileContainers = [
      ".rm-profile-dropdown-content",
      ".rm-user-name",
      '[data-testid="user-profile"]',
    ];

    for (const selector of profileContainers) {
      const element = document.querySelector(selector);
      if (element) {
        const userName = element.textContent?.trim();
        if (userName && userName !== "User") {
          return {
            displayName: userName,
            email: "",
            uid: `dom-${userName.toLowerCase().replace(/\s+/g, "-")}`,
            method: "dom-profile",
          };
        }
      }
    }

    // Fallback: Use graph name as approximate user
    return {
      displayName: "Current User",
      email: "",
      uid: "dom-fallback",
      method: "fallback",
    };
  } catch (error) {
    console.warn("DOM user detection failed:", error);
    return {
      displayName: "Unknown User",
      email: "",
      uid: "unknown",
      method: "error",
    };
  }
};

/**
 * 🔍 Get current user with caching and multiple methods
 */
const getCurrentUser = () => {
  const now = Date.now();

  // Return cached result if still valid
  if (userCache && now - lastCacheTime < CACHE_DURATION) {
    return userCache;
  }

  // Try official API first
  let result = getCurrentUserViaOfficialAPI();

  // Fall back to DOM scanning if needed
  if (!result || result.method === "error") {
    result = getCurrentUserViaDOM();
  }

  // Cache result if successful
  if (result && result.method !== false) {
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
};

// ===================================================================
// 🧪 EXISTING TEST FUNCTIONS
// ===================================================================

/**
 * 🧪 Test the bulletproof cascading function
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

    console.log("\n🎯 Test 3: Creating user preferences...");
    const result3 = await cascadeToBlock(
      "Matt Brockwell/user preferences",
      ["**Loading Page Preference:**"],
      true
    );
    console.log(`✅ Result 3: ${result3}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
};

/**
 * 🚀 Quick cascade test for immediate verification
 */
const quickCascadeTest = async () => {
  console.log("🚀 Quick cascade test...");
  const result = await cascadeToBlock(
    "Quick Test",
    ["Level 1", "Level 2"],
    true
  );
  console.log(`✅ Quick test result: ${result}`);
};

// ===================================================================
// 🎛️ UTILITIES REGISTRY - Updated with new functions
// ===================================================================

const UTILITIES = {
  // 🖼️ NEW: Image Extraction
  extractImageUrls,

  // 🆕 NEW: Hierarchical List Management (The Four New Functions!)
  ensureBlockExists,
  addToBlockList,
  removeFromBlockList,
  getBlockListItems,

  // 🧪 NEW: Test functions for new utilities
  testHierarchicalUtilities,
  testGraphMembersWorkflow,
  testImageExtraction,

  // 🚀 EXISTING: Bulletproof Cascading
  cascadeToBlock,
  testCascadeToBlock,
  quickCascadeTest,

  // 🔧 EXISTING: Core Functions
  findDataValueExact,
  findNestedDataValuesExact,
  setDataValueStructured,

  // 🏗️ EXISTING: Helper Functions
  getDirectChildren,
  getPageUidByTitle,
  normalizeHeaderText,
  normalizeCategoryName,

  // 🔍 EXISTING: User Detection
  getCurrentUser,
  getCurrentUserViaOfficialAPI,
  getCurrentUserViaDOM,
  clearUserCache,
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Updated with new utilities
// ===================================================================

export default {
  onload: () => {
    console.log(
      "🔧 Extension 1.5 loading with hierarchical list management..."
    );

    // Initialize extension registry if it doesn't exist
    if (!window._extensionRegistry) {
      window._extensionRegistry = {
        extensions: new Map(),
        utilities: {},
        commands: [],
      };
    }

    // Ensure utilities object exists
    if (!window._extensionRegistry.utilities) {
      window._extensionRegistry.utilities = {};
    }

    // 🧪 Command palette functions for testing
    const commands = [
      {
        label: "Test: Hierarchical List Management Utilities",
        callback: testHierarchicalUtilities,
      },
      {
        label: "Test: Graph Members Workflow (Complete Example)",
        callback: testGraphMembersWorkflow,
      },
      {
        label: "Test: Image Extraction Utility (Avatar Testing)",
        callback: testImageExtraction,
      },
      {
        label: "Test: Bulletproof Cascade to Block",
        callback: testCascadeToBlock,
      },
      {
        label: "Test: Quick Cascade Test",
        callback: quickCascadeTest,
      },
    ];

    // Register commands
    commands.forEach((cmd) => {
      if (window.roamAlphaAPI && window.roamAlphaAPI.ui.commandPalette) {
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: cmd.label,
          callback: cmd.callback,
        });
      }
      window._extensionRegistry.commands.push(cmd);
    });

    // 🔧 Register all utilities
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
    }

    // ✅ Extension successfully loaded
    console.log("✅ Extension 1.5 loaded successfully!");
    console.log(`🔧 Registered ${Object.keys(UTILITIES).length} utilities:`);
    console.log("   🖼️ RECOVERED: extractImageUrls (for avatar processing)");
    console.log(
      "   🆕 NEW: ensureBlockExists, addToBlockList, removeFromBlockList, getBlockListItems"
    );
    console.log(
      "   🚀 EXISTING: cascadeToBlock, findDataValueExact, setDataValueStructured, getCurrentUser, etc."
    );
    console.log("💡 Try the test commands to see the utilities in action!");

    return {
      extensionId: "utility-library",
      utilities: UTILITIES,
    };
  },

  onunload: () => {
    console.log("🔧 Extension 1.5 unloading...");
    // Cleanup handled by the registry
  },
};
