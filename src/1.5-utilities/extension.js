// ===================================================================
// Extension 1.5: Fixed Universal Parser - Exact Matching Implementation
// MAJOR FIX: Implements exact block matching instead of substring search
// Following PDF technical specifications for robust data extraction
// ===================================================================

// ===================================================================
// 🔧 EXACT MATCHING CORE FUNCTIONS - PDF Specification Implementation
// ===================================================================

/**
 * 📋 PDF-SPECIFIED: Normalize header text for exact matching
 * Handles all format variations while enabling precise comparison
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
 * 🎯 PDF-SPECIFIED: Find exact header block (no substring matching)
 * Solves the critical use/mention distinction problem
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
      return normalizedText === normalizedPattern; // EXACT MATCH - NO SUBSTRING
    });
  });
};

/**
 * 🏗️ PDF-SPECIFIED: Get direct children of a block
 * Implements proper hierarchical data extraction
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
 * 📝 PDF-SPECIFIED: Normalize category names for consistent key structure
 * Converts "ABOUT ME:" to "aboutMe", "AVATAR:" to "avatar", etc.
 */
const normalizeCategoryName = (categoryText) => {
  if (!categoryText || typeof categoryText !== "string") return "";

  return categoryText
    .replace(/:+$/, "") // Remove trailing colons
    .toLowerCase()
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase()) // camelCase
    .replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters
};

// ===================================================================
// 🆕 NEW EXACT MATCHING FUNCTIONS - Primary Interface
// ===================================================================

/**
 * 🎯 FIXED: findDataValueExact - Exact block matching only
 * Replaces the broken substring matching with precise header identification
 */
const findDataValueExact = (pageUid, key) => {
  if (!pageUid || !key) return null;

  try {
    console.log(`🔍 EXACT SEARCH: Looking for "${key}" on page ${pageUid}`);

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

    console.log(`📊 Found ${allBlocks.length} top-level blocks to search`);

    // Generate header patterns for exact matching
    const headerPatterns = [
      key, // Plain format: "Loading Page Preference"
      `${key}:`, // Colon format: "Loading Page Preference:"
      `${key}::`, // Attribute format: "Loading Page Preference::"
      `**${key}:**`, // Bold format: "**Loading Page Preference:**"
      `**${key}**:`, // Alt bold format: "**Loading Page Preference**:"
    ];

    console.log(`🎯 Searching for exact matches of patterns:`, headerPatterns);

    // Find exact header match (NO substring matching)
    const foundBlock = findExactHeaderBlock(allBlocks, headerPatterns);

    if (!foundBlock) {
      console.log(`❌ No exact match found for "${key}"`);
      return null;
    }

    const [blockUid, blockText] = foundBlock;
    console.log(`✅ Found exact header match: "${blockText}" (${blockUid})`);

    // Get children blocks (the actual values)
    const children = getDirectChildren(blockUid);

    console.log(`📋 Found ${children.length} children under header`);

    if (children.length === 0) {
      console.log(`📝 Header found but no children data`);
      return null;
    } else if (children.length === 1) {
      console.log(`📄 Single value: "${children[0].text}"`);
      return children[0].text; // Single value
    } else {
      const values = children.map((child) => child.text);
      console.log(`📋 Multiple values:`, values);
      return values; // Multiple values
    }
  } catch (error) {
    console.error(`Error in findDataValueExact for "${key}":`, error);
    return null;
  }
};

/**
 * 🆕 ENHANCED: findNestedDataValuesExact - Hierarchical exact matching
 * PDF-specified two-level data extraction with exact header identification
 */
const findNestedDataValuesExact = (pageUid, parentKey) => {
  if (!pageUid || !parentKey) return null;

  try {
    console.log(
      `🔍 NESTED EXACT SEARCH: Looking for "${parentKey}" structure on page ${pageUid}`
    );

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

    console.log(
      `🎯 Searching for parent header patterns:`,
      parentHeaderPatterns
    );

    // Find exact parent header match
    const parentBlock = findExactHeaderBlock(allBlocks, parentHeaderPatterns);

    if (!parentBlock) {
      console.log(`❌ No exact parent match found for "${parentKey}"`);
      return null;
    }

    const [parentBlockUid, parentBlockText] = parentBlock;
    console.log(
      `✅ Found exact parent header: "${parentBlockText}" (${parentBlockUid})`
    );

    // Get all category children of the parent
    const categoryBlocks = getDirectChildren(parentBlockUid);

    console.log(
      `📊 Found ${categoryBlocks.length} category blocks under parent`
    );

    if (categoryBlocks.length === 0) {
      console.log(`📝 Parent header found but no category children`);
      return {};
    }

    // Extract data from each category
    const nestedData = {};

    for (const categoryBlock of categoryBlocks) {
      const categoryName = normalizeCategoryName(categoryBlock.text);

      if (!categoryName) {
        console.warn(`⚠️ Skipping invalid category: "${categoryBlock.text}"`);
        continue;
      }

      // Get data children for this category
      const categoryData = getDirectChildren(categoryBlock.uid);

      if (categoryData.length === 0) {
        console.log(`📝 Category "${categoryName}" has no data children`);
        // Don't set the key - leave undefined for missing data
      } else if (categoryData.length === 1) {
        nestedData[categoryName] = categoryData[0].text;
        console.log(`📄 ${categoryName}: "${categoryData[0].text}"`);
      } else {
        nestedData[categoryName] = categoryData.map((item) => item.text);
        console.log(`📋 ${categoryName}:`, nestedData[categoryName]);
      }
    }

    console.log(
      `✅ Extracted ${
        Object.keys(nestedData).length
      } categories from "${parentKey}":`,
      nestedData
    );
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
 * 🛠️ ENHANCED: setDataValueStructured - Create proper hierarchical structure
 * Ensures data is created with exact format for future exact matching
 */
const setDataValueStructured = async (
  pageUid,
  key,
  value,
  useAttributeFormat = false
) => {
  if (!pageUid || !key) return false;

  try {
    console.log(`📝 Creating structured data for "${key}" on page ${pageUid}`);

    // Format the key based on preference for future exact matching
    const keyText = useAttributeFormat ? `${key}::` : `**${key}:**`;
    console.log(`🏷️ Using header format: "${keyText}"`);

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
      console.log(`📝 Creating new header block: "${keyText}"`);
      keyBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: keyText },
      });
    } else {
      keyBlockUid = keyBlock[0];
      console.log(`♻️ Using existing header block: ${keyBlockUid}`);

      // Clear existing children for clean update
      const existingChildren = getDirectChildren(keyBlockUid);
      for (const child of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: child.uid },
        });
      }
      console.log(`🧹 Cleared ${existingChildren.length} existing children`);
    }

    // Add value(s) as children
    const values = Array.isArray(value) ? value : [value];
    console.log(`📋 Adding ${values.length} value(s):`, values);

    for (let i = 0; i < values.length; i++) {
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyBlockUid, order: i },
        block: { string: values[i] },
      });
    }

    console.log(`✅ Successfully created structured data for "${key}"`);
    return true;
  } catch (error) {
    console.error(`Error in setDataValueStructured for "${key}":`, error);
    return false;
  }
};

/**
 * 🛠️ ENHANCED: setNestedDataValuesStructured - Create hierarchical nested structure
 * Creates proper two-level structure for complex data like user profiles
 */
const setNestedDataValuesStructured = async (
  pageUid,
  parentKey,
  nestedData,
  useAttributeFormat = false
) => {
  if (!pageUid || !parentKey || !nestedData || typeof nestedData !== "object") {
    return false;
  }

  try {
    console.log(
      `📝 Creating nested structure for "${parentKey}" on page ${pageUid}`
    );

    // Format parent key for exact matching
    const parentKeyText = useAttributeFormat
      ? `${parentKey}::`
      : `**${parentKey}:**`;
    console.log(`🏷️ Using parent header format: "${parentKeyText}"`);

    // Check if parent block already exists using exact matching
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);

    const parentHeaderPatterns = [
      parentKey,
      `${parentKey}:`,
      `${parentKey}::`,
      `**${parentKey}:**`,
      `**${parentKey}**:`,
    ];

    let parentBlock = findExactHeaderBlock(allBlocks, parentHeaderPatterns);
    let parentBlockUid;

    if (!parentBlock) {
      // Create new parent block
      console.log(`📝 Creating new parent header: "${parentKeyText}"`);
      parentBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: parentKeyText },
      });
    } else {
      parentBlockUid = parentBlock[0];
      console.log(`♻️ Using existing parent header: ${parentBlockUid}`);

      // Clear existing children for clean update
      const existingChildren = getDirectChildren(parentBlockUid);
      for (const child of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: child.uid },
        });
      }
      console.log(
        `🧹 Cleared ${existingChildren.length} existing category children`
      );
    }

    // Add each nested key-value pair as category children
    let order = 0;
    console.log(
      `📊 Creating ${Object.keys(nestedData).length} nested categories`
    );

    for (const [categoryKey, categoryValue] of Object.entries(nestedData)) {
      const childKeyText = useAttributeFormat
        ? `${categoryKey}::`
        : `**${categoryKey}:**`;
      console.log(`📝 Creating category: "${childKeyText}"`);

      // Create category key block
      const childKeyUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": parentBlockUid, order: order++ },
        block: { string: childKeyText },
      });

      // Add value(s) as grandchildren
      const values = Array.isArray(categoryValue)
        ? categoryValue
        : [categoryValue];
      for (let i = 0; i < values.length; i++) {
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": childKeyUid, order: i },
          block: { string: values[i] },
        });
      }

      console.log(
        `✅ Created category "${categoryKey}" with ${values.length} value(s)`
      );
    }

    console.log(`✅ Successfully created nested structure for "${parentKey}"`);
    return true;
  } catch (error) {
    console.error(
      `Error in setNestedDataValuesStructured for "${parentKey}":`,
      error
    );
    return false;
  }
};

// ===================================================================
// 🔧 FIXED PLACEHOLDER DETECTION - Exact Matches Only
// ===================================================================

/**
 * 🎯 FIXED: Precise placeholder detection using exact string matches
 * No more substring matching that filters real data
 */
const isPlaceholderValueExact = (value) => {
  if (!value || typeof value !== "string") return true;

  const trimmed = value.trim().toLowerCase();

  // EXACT matches only - no substring filtering
  const exactPlaceholders = [
    "not set",
    "not specified",
    "unknown",
    "tbd",
    "todo",
    "—",
    "-",
    "",
    "n/a",
    "none",
    "team member", // Exact match - won't filter "Extension Developer"
    "graph member", // Exact match - won't filter "Graph Member Lead"
    "location not set",
    "timezone not set",
    "role not set",
  ];

  const isExactPlaceholder = exactPlaceholders.includes(trimmed);
  const isTooShort = trimmed.length < 2;

  return isExactPlaceholder || isTooShort;
};

/**
 * 🧹 Clean field value with exact placeholder detection
 */
const getCleanFieldValueExact = (dataObject, fieldNames) => {
  for (const fieldName of fieldNames) {
    const value = dataObject[fieldName];
    if (value && typeof value === "string") {
      if (!isPlaceholderValueExact(value)) {
        return value.trim();
      }
    }
  }
  return null;
};

// ===================================================================
// 🔄 BACKWARD COMPATIBILITY LAYER - Keep existing functions
// ===================================================================

/**
 * 🔄 Original functions kept for backward compatibility
 * Extensions can migrate gradually to "Exact" versions
 */

// Keep original findDataValue (but log deprecation warning)
const findDataValue = (pageUid, key) => {
  console.warn(
    `⚠️ DEPRECATED: findDataValue() uses substring matching. Migrate to findDataValueExact() for reliability.`
  );

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

    let foundBlock = null;

    // Method 1: Look for attribute format "Key::"
    foundBlock = allBlocks.find(([uid, text]) => {
      return text.trim() === `${key}::`;
    });

    // Method 2: Look for text that contains the key (handles bold/plain)
    if (!foundBlock) {
      foundBlock = allBlocks.find(([uid, text]) => {
        const cleanText = text.replace(/\*\*/g, "").replace(/:/g, "").trim();
        return cleanText.toLowerCase().includes(key.toLowerCase()); // ORIGINAL PROBLEMATIC CODE
      });
    }

    if (!foundBlock) return null;

    const [blockUid, blockText] = foundBlock;

    // Get children blocks (the actual values)
    const children = window.roamAlphaAPI.data
      .q(
        `
      [:find ?childUid ?childString ?childOrder
       :where 
       [?parent :block/uid "${blockUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?childUid]
       [?child :block/string ?childString]
       [?child :block/order ?childOrder]]
    `
      )
      .sort((a, b) => a[2] - b[2]); // Sort by order

    if (children.length === 0) {
      return null;
    } else if (children.length === 1) {
      return children[0][1]; // Single value
    } else {
      return children.map(([uid, text]) => text); // Multiple values
    }
  } catch (error) {
    console.error(`Error in findDataValue for "${key}":`, error);
    return null;
  }
};

// Keep other original functions with deprecation warnings
const findNestedDataValues = (pageUid, parentKey) => {
  console.warn(
    `⚠️ DEPRECATED: findNestedDataValues() may have reliability issues. Migrate to findNestedDataValuesExact().`
  );
  // ... original implementation kept for compatibility
  return findNestedDataValuesExact(pageUid, parentKey); // Delegate to exact version
};

const setDataValue = async (
  pageUid,
  key,
  value,
  useAttributeFormat = false
) => {
  console.warn(
    `⚠️ DEPRECATED: setDataValue() - consider using setDataValueStructured() for better structure.`
  );
  return setDataValueStructured(pageUid, key, value, useAttributeFormat);
};

// ===================================================================
// 👤 USER DETECTION UTILITIES - Unchanged (already working well)
// ===================================================================

/**
 * Josh Brown's Official API (June 2025) - PRIMARY METHOD
 */
const getCurrentUserViaOfficialAPI = () => {
  try {
    const userUid = window.roamAlphaAPI?.user?.uid?.();
    if (userUid) {
      const userData = window.roamAlphaAPI.pull(
        `
        [:user/display-name :user/photo-url :user/uid :user/email]
      `,
        [":user/uid", userUid]
      );

      if (userData) {
        return {
          uid: userUid,
          displayName: userData[":user/display-name"] || "Unknown User",
          photoUrl: userData[":user/photo-url"] || null,
          email: userData[":user/email"] || null,
          method: "official-api",
        };
      }
    }
  } catch (error) {
    console.warn("Official user API not available:", error.message);
  }
  return null;
};

/**
 * David's localStorage Method - PROVEN FALLBACK
 */
const getCurrentUserViaLocalStorage = () => {
  try {
    const globalAppState = JSON.parse(
      localStorage.getItem("globalAppState") || '["","",[]]'
    );
    const userIndex = globalAppState.findIndex((s) => s === "~:user");

    if (userIndex > 0 && globalAppState[userIndex + 1]) {
      const userArray = globalAppState[userIndex + 1];

      const uidIndex = userArray.findIndex((s) => s === "~:uid");
      const nameIndex = userArray.findIndex((s) => s === "~:display-name");
      const emailIndex = userArray.findIndex((s) => s === "~:email");

      const uid = uidIndex > 0 ? userArray[uidIndex + 1] : null;
      const displayName = nameIndex > 0 ? userArray[nameIndex + 1] : null;
      const email = emailIndex > 0 ? userArray[emailIndex + 1] : null;

      if (uid || displayName) {
        return {
          uid: uid || generateUID(),
          displayName: displayName || "Current User",
          photoUrl: null,
          email: email || null,
          method: "localStorage",
        };
      }
    }
  } catch (error) {
    console.warn("localStorage user detection failed:", error.message);
  }
  return null;
};

/**
 * Recent Block Method - FINAL FALLBACK
 */
const getCurrentUserViaRecentBlocks = () => {
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?user-id ?create-time
       :where 
       [?b :block/uid ?uid]
       [?b :create/user ?user-id]  
       [?b :create/time ?create-time]
       [(> ?create-time ${oneHourAgo})]]
    `);

    if (recentBlocks.length > 0) {
      const mostRecentBlock = recentBlocks.sort((a, b) => b[2] - a[2])[0];
      const userDbId = mostRecentBlock[1];

      const userData = window.roamAlphaAPI.pull(
        `
        [:user/display-name :user/photo-url :user/uid :user/email]
      `,
        userDbId
      );

      if (userData) {
        return {
          uid: userData[":user/uid"] || generateUID(),
          displayName: userData[":user/display-name"] || "Current User",
          photoUrl: userData[":user/photo-url"] || null,
          email: userData[":user/email"] || null,
          method: "recent-blocks",
        };
      }
    }
  } catch (error) {
    console.warn("Recent blocks user detection failed:", error.message);
  }
  return null;
};

/**
 * Smart user detection with caching - David's optimization pattern
 */
let userCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCurrentUser = () => {
  if (userCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return userCache;
  }

  let user =
    getCurrentUserViaOfficialAPI() ||
    getCurrentUserViaLocalStorage() ||
    getCurrentUserViaRecentBlocks();

  if (!user) {
    user = {
      uid: generateUID(),
      displayName: "Unknown User",
      photoUrl: null,
      email: null,
      method: "fallback",
    };
  }

  userCache = user;
  cacheTimestamp = Date.now();

  console.log(`👤 User detected via ${user.method}:`, user.displayName);
  return user;
};

// User utility functions
const getCurrentUserUid = () => getCurrentUser().uid;
const getCurrentUserDisplayName = () => getCurrentUser().displayName;
const getCurrentUserPhotoUrl = () => getCurrentUser().photoUrl;
const getCurrentUserEmail = () => getCurrentUser().email;

const clearUserCache = () => {
  userCache = null;
  cacheTimestamp = 0;
  console.log("🔄 User cache cleared");
};

/**
 * Get user by ID (for multi-user scenarios)
 */
const getUserById = (uidOrDbId) => {
  try {
    const userData = window.roamAlphaAPI.pull(
      `
      [:user/display-name :user/photo-url :user/uid :user/email]
    `,
      typeof uidOrDbId === "string" ? [":user/uid", uidOrDbId] : uidOrDbId
    );

    if (userData) {
      return {
        uid: userData[":user/uid"],
        displayName: userData[":user/display-name"],
        photoUrl: userData[":user/photo-url"],
        email: userData[":user/email"],
      };
    }
  } catch (error) {
    console.warn("Failed to get user by ID:", error.message);
  }
  return null;
};

/**
 * Check if graph has multiple users
 */
const isMultiUserGraph = () => {
  try {
    const allUsers = window.roamAlphaAPI.data.q(`
      [:find (distinct ?user-id)
       :where [?b :create/user ?user-id]]
    `);
    return allUsers.length > 1;
  } catch (error) {
    console.warn("Failed to detect multi-user graph:", error.message);
    return false;
  }
};

// ===================================================================
// 📄 PAGE AND BLOCK UTILITIES - Unchanged (working well)
// ===================================================================

/**
 * Get page UID by title with proper error handling
 */
const getPageUidByTitle = (title) => {
  if (!title) return null;

  try {
    const result = window.roamAlphaAPI.data.q(`
      [:find ?uid .
       :where [?page :node/title "${title}"] [?page :block/uid ?uid]]
    `);
    return result || null;
  } catch (error) {
    console.warn(`Failed to get page UID for "${title}":`, error.message);
    return null;
  }
};

/**
 * Create page if it doesn't exist
 */
const createPageIfNotExists = async (title) => {
  if (!title) return null;

  try {
    let pageUid = getPageUidByTitle(title);
    if (pageUid) return pageUid;

    pageUid = generateUID();
    await window.roamAlphaAPI.data.page.create({
      page: { title, uid: pageUid },
    });

    console.log(`📄 Created page: "${title}" (${pageUid})`);
    return pageUid;
  } catch (error) {
    console.error(`Failed to create page "${title}":`, error);
    return null;
  }
};

/**
 * Get current page title from URL
 */
const getCurrentPageTitle = () => {
  try {
    const url = window.location.href;
    if (url.includes("/page/")) {
      const pageUid = url.split("/page/")[1].split("?")[0];
      const pageData = window.roamAlphaAPI.pull("[:node/title]", [
        ":block/uid",
        pageUid,
      ]);
      return pageData?.[":node/title"] || null;
    }
    return null;
  } catch (error) {
    console.warn("Failed to get current page title:", error.message);
    return null;
  }
};

// ===================================================================
// 🔧 UTILITY FUNCTIONS - Unchanged (working well)
// ===================================================================

/**
 * Generate unique ID
 */
const generateUID = () => {
  return (
    window.roamAlphaAPI?.util?.generateUID?.() ||
    "util-" + Math.random().toString(36).substr(2, 9)
  );
};

/**
 * Wait utility for async operations
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Today's date in Roam format
 */
const getTodaysRoamDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = String(today.getFullYear());
  return `${month}-${day}-${year}`;
};

/**
 * Parse personal shortcuts from various formats
 */
const parsePersonalShortcuts = (shortcutsString) => {
  if (!shortcutsString) return [];

  const parenthesesRegex = /\(([^)]+)\)/g;
  const matches = [];
  let match;

  while ((match = parenthesesRegex.exec(shortcutsString)) !== null) {
    const pageName = match[1].trim();
    if (pageName) {
      matches.push(pageName);
    }
  }

  return matches;
};

// ===================================================================
// 🎯 FIXED UTILITY REGISTRY - Enhanced with Exact Functions
// ===================================================================

const UTILITIES = {
  // 🆕 NEW EXACT MATCHING FUNCTIONS (Primary Interface)
  findDataValueExact: findDataValueExact,
  findNestedDataValuesExact: findNestedDataValuesExact,
  setDataValueStructured: setDataValueStructured,
  setNestedDataValuesStructured: setNestedDataValuesStructured,

  // 🔧 ENHANCED HELPER FUNCTIONS
  isPlaceholderValueExact: isPlaceholderValueExact,
  getCleanFieldValueExact: getCleanFieldValueExact,
  normalizeHeaderText: normalizeHeaderText,
  findExactHeaderBlock: findExactHeaderBlock,
  getDirectChildren: getDirectChildren,
  normalizeCategoryName: normalizeCategoryName,

  // 🔄 DEPRECATED (kept for compatibility)
  findDataValue: findDataValue,
  setDataValue: setDataValue,
  findNestedDataValues: findNestedDataValues,

  // 👤 USER DETECTION (unchanged - working well)
  getCurrentUser: getCurrentUser,
  getCurrentUserUid: getCurrentUserUid,
  getCurrentUserDisplayName: getCurrentUserDisplayName,
  getCurrentUserPhotoUrl: getCurrentUserPhotoUrl,
  getCurrentUserEmail: getCurrentUserEmail,
  getUserById: getUserById,
  isMultiUserGraph: isMultiUserGraph,
  clearUserCache: clearUserCache,

  // 📄 PAGE OPERATIONS (unchanged - working well)
  getPageUidByTitle: getPageUidByTitle,
  createPageIfNotExists: createPageIfNotExists,
  getCurrentPageTitle: getCurrentPageTitle,

  // 🔧 HELPER UTILITIES (unchanged - working well)
  generateUID: generateUID,
  wait: wait,
  getTodaysRoamDate: getTodaysRoamDate,
  parsePersonalShortcuts: parsePersonalShortcuts,
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔧 FIXED Universal Parser starting...");

    // ✅ VERIFY FOUNDATION DEPENDENCY
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    // 🎯 REGISTER ALL UTILITIES WITH PLATFORM
    const platform = window.RoamExtensionSuite;

    Object.entries(UTILITIES).forEach(([name, utility]) => {
      platform.registerUtility(name, utility);
      const isNew = name.includes("Exact") || name.includes("Structured");
      console.log(`🔧 Registered ${isNew ? "🆕 NEW" : ""} utility: ${name}`);
    });

    // 📝 REGISTER COMPREHENSIVE TEST COMMANDS
    const commands = [
      {
        label: "Utils: Test EXACT vs SUBSTRING Matching",
        callback: async () => {
          const user = getCurrentUser();
          const pageTitle = `${user.displayName}/user preferences`;
          const pageUid = getPageUidByTitle(pageTitle);

          if (pageUid) {
            console.group("🧪 EXACT vs SUBSTRING Matching Test");
            console.log("Page UID:", pageUid);

            const testKeys = [
              "Loading Page Preference",
              "Journal Header Color",
              "Personal Shortcuts",
            ];

            testKeys.forEach((key) => {
              console.log(`\n🔍 Testing key: "${key}"`);

              const exactResult = findDataValueExact(pageUid, key);
              console.log(`✅ EXACT match result:`, exactResult);

              const substringResult = findDataValue(pageUid, key);
              console.log(`⚠️  SUBSTRING match result:`, substringResult);

              if (
                JSON.stringify(exactResult) !== JSON.stringify(substringResult)
              ) {
                console.log(
                  `🚨 DIFFERENT RESULTS! Exact matching fixed a false positive.`
                );
              } else {
                console.log(
                  `✅ Results match - both methods work for this case`
                );
              }
            });

            console.groupEnd();
          } else {
            console.log("❌ User preferences page not found");
          }
        },
      },
      {
        label: "Utils: Test Nested EXACT Data Parser",
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = getPageUidByTitle(user.displayName);

          if (userPageUid) {
            console.group("🧪 Testing Nested EXACT Data Parser");
            console.log("User Page UID:", userPageUid);

            const testParentKeys = [
              "My Info",
              "Contact Info",
              "About Me",
              "Profile Data",
            ];

            testParentKeys.forEach((parentKey) => {
              console.log(`\n🔍 Testing nested extraction for: "${parentKey}"`);

              const nestedData = findNestedDataValuesExact(
                userPageUid,
                parentKey
              );
              if (nestedData && Object.keys(nestedData).length > 0) {
                console.log(
                  `✅ Extracted ${Object.keys(nestedData).length} categories:`,
                  nestedData
                );
              } else {
                console.log(`📝 No nested data found for "${parentKey}"`);
              }
            });

            console.groupEnd();
          } else {
            console.log("❌ User page not found");
          }
        },
      },
      {
        label: "Utils: Test Exact Header Block Matching",
        callback: () => {
          console.group("🧪 Testing Exact Header Block Matching");

          // Test normalization
          const testCases = [
            "My Info:",
            "**My Info:**",
            "My Info::",
            "MY INFO::",
            "  **My Info:**  ",
          ];

          console.log("Header Normalization Tests:");
          testCases.forEach((testCase) => {
            const normalized = normalizeHeaderText(testCase);
            console.log(`"${testCase}" → "${normalized}"`);
          });

          // Test exact matching vs substring
          const mockBlocks = [
            [1, "My Info::", 0],
            [2, "This explains My Info setup", 1],
            [3, "**Personal Info:**", 2],
            [4, "Loading Page Preference documentation mentions My Info", 3],
          ];

          console.log("\nExact Block Matching Tests:");
          const patterns = ["My Info", "Personal Info"];

          patterns.forEach((pattern) => {
            const exactMatch = findExactHeaderBlock(mockBlocks, [pattern]);
            console.log(
              `Pattern "${pattern}":`,
              exactMatch ? `Found: "${exactMatch[1]}"` : "Not found"
            );
          });

          console.groupEnd();
        },
      },
      {
        label: "Utils: Test FIXED Placeholder Detection",
        callback: () => {
          console.group("🧪 Testing FIXED Placeholder Detection");

          const testValues = [
            "Extension Developer", // ✅ Should be kept (contains "team member" but not exact)
            "team member", // ❌ Should be filtered (exact match)
            "Oakland, California, US", // ✅ Should be kept (real location)
            "not specified", // ❌ Should be filtered (exact match)
            "Graph Member Lead", // ✅ Should be kept (contains "Graph Member" but not exact)
            "graph member", // ❌ Should be filtered (exact match)
            "https://photo.url", // ✅ Should be kept (real URL)
            "—", // ❌ Should be filtered (exact match)
            "", // ❌ Should be filtered (empty)
            "Building extensions", // ✅ Should be kept (real content)
          ];

          console.log("Placeholder Detection Results:");
          testValues.forEach((value) => {
            const isPlaceholder = isPlaceholderValueExact(value);
            const status = isPlaceholder ? "❌ FILTERED" : "✅ KEPT";
            console.log(`${status} "${value}"`);
          });

          console.groupEnd();
        },
      },
      {
        label: "Utils: Create Test Data Structure",
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = await createPageIfNotExists(user.displayName);

          if (userPageUid) {
            console.log("🧪 Creating test nested data structure...");

            const profileData = {
              avatar:
                user.photoUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user.displayName
                )}`,
              location: "Oakland, California, US",
              role: "Extension Developer",
              timezone: "America/Los_Angeles",
              aboutMe:
                "Building professional Roam extensions with exact matching",
            };

            const success = await setNestedDataValuesStructured(
              userPageUid,
              "My Info",
              profileData,
              true // Use attribute format for proper blue pills
            );

            if (success) {
              console.log(
                "✅ Test nested data structure created successfully!"
              );
              console.log(
                "💡 Check your user page - should see proper blue pill structure"
              );
              console.log("🧪 Now try 'Utils: Test Nested EXACT Data Parser'");
            } else {
              console.log("❌ Failed to create test nested data structure");
            }
          }
        },
      },
      {
        label: "Utils: Test All User Detection Methods",
        callback: () => {
          console.group("🧪 Testing All User Detection Methods");
          console.log("Official API:", getCurrentUserViaOfficialAPI());
          console.log("localStorage:", getCurrentUserViaLocalStorage());
          console.log("Recent blocks:", getCurrentUserViaRecentBlocks());
          console.log("Final result:", getCurrentUser());
          console.log("Multi-user graph:", isMultiUserGraph());
          console.groupEnd();
        },
      },
      {
        label: "Utils: List All FIXED Utilities",
        callback: () => {
          console.group("🔧 FIXED Universal Parser Utilities");

          const categories = {
            "🆕 NEW EXACT FUNCTIONS": [
              "findDataValueExact",
              "findNestedDataValuesExact",
              "setDataValueStructured",
              "setNestedDataValuesStructured",
            ],
            "🔧 ENHANCED HELPERS": [
              "isPlaceholderValueExact",
              "getCleanFieldValueExact",
              "normalizeHeaderText",
              "findExactHeaderBlock",
              "getDirectChildren",
              "normalizeCategoryName",
            ],
            "⚠️ DEPRECATED (compatibility)": [
              "findDataValue",
              "findNestedDataValues",
              "setDataValue",
            ],
            "👤 USER DETECTION": [
              "getCurrentUser",
              "getCurrentUserUid",
              "getCurrentUserDisplayName",
              "getUserById",
              "isMultiUserGraph",
            ],
            "📄 PAGE OPERATIONS": [
              "getPageUidByTitle",
              "createPageIfNotExists",
              "getCurrentPageTitle",
            ],
            "🔧 UTILITIES": [
              "generateUID",
              "wait",
              "getTodaysRoamDate",
              "parsePersonalShortcuts",
            ],
          };

          Object.entries(categories).forEach(([category, utilities]) => {
            console.log(`\n${category}:`);
            utilities.forEach((util) => {
              console.log(`  • ${util}`);
            });
          });

          console.log(
            `\nTotal: ${Object.keys(UTILITIES).length} utilities available`
          );
          console.groupEnd();
        },
      },
    ];

    // Add commands and register for cleanup
    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🎯 REGISTER SELF WITH PLATFORM
    platform.register(
      "utility-library",
      {
        utilities: UTILITIES,
        // Primary interface for Extension 6
        findDataValueExact,
        findNestedDataValuesExact,
        setDataValueStructured,
        getCurrentUser,
        version: "1.5.2", // Incremented for major fixes
      },
      {
        name: "FIXED Universal Parser",
        description:
          "MAJOR FIX: Exact block matching eliminates false positives from documentation",
        version: "1.5.2",
        dependencies: ["foundation-registry"],
      }
    );

    // 🎉 STARTUP COMPLETE
    console.log("✅ FIXED Universal Parser loaded successfully!");
    console.log("🔧 MAJOR FIX: Exact block matching replaces substring search");
    console.log(
      "🔧 MAJOR FIX: Precise placeholder detection (exact matches only)"
    );
    console.log("🔧 MAJOR FIX: PDF-specified header normalization");
    console.log("🆕 NEW: Hierarchical nested data extraction");
    console.log(
      "🔄 COMPATIBILITY: Old functions kept with deprecation warnings"
    );
    console.log(`🎯 ${Object.keys(UTILITIES).length} utilities available`);
    console.log('💡 Try: Cmd+P → "Utils: Test EXACT vs SUBSTRING Matching"');

    // Test user detection on startup
    const currentUser = getCurrentUser();
    console.log(
      `👤 Current user: ${currentUser.displayName} (${currentUser.method})`
    );

    // Show improvement summary
    console.log("\n🚀 KEY IMPROVEMENTS:");
    console.log("  ✅ No more false positives from documentation blocks");
    console.log("  ✅ Real data like 'Extension Developer' no longer filtered");
    console.log("  ✅ Proper hierarchical data extraction following PDF specs");
    console.log("  ✅ Backward compatibility maintained for gradual migration");
  },

  onunload: () => {
    console.log("🔧 FIXED Universal Parser unloading...");

    // Clear caches
    clearUserCache();

    console.log("✅ FIXED Universal Parser cleanup complete!");
  },
};
