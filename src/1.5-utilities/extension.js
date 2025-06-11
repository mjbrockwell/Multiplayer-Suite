// ===================================================================
// Extension 1.5: Lean Universal Parser - Exact Matching Only
// SIMPLIFIED: Exact block matching without unnecessary complexity
// Just extracts data - no filtering, no placeholders, no complications
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
 * 📝 Normalize category names for consistent keys
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
// 🎯 PRIMARY DATA EXTRACTION FUNCTIONS - Clean & Simple
// ===================================================================

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
 * Returns whatever is actually there - no filtering
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

    for (let i = 0; i < values.length; i++) {
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyBlockUid, order: i },
        block: { string: values[i] },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error in setDataValueStructured for "${key}":`, error);
    return false;
  }
};

/**
 * 🛠️ Create nested data structure with proper hierarchy
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
    // Format parent key for exact matching
    const parentKeyText = useAttributeFormat
      ? `${parentKey}::`
      : `**${parentKey}:**`;

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
      parentBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: parentKeyText },
      });
    } else {
      parentBlockUid = parentBlock[0];

      // Clear existing children for clean update
      const existingChildren = getDirectChildren(parentBlockUid);
      for (const child of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: child.uid },
        });
      }
    }

    // Add each nested key-value pair as category children
    let order = 0;

    for (const [categoryKey, categoryValue] of Object.entries(nestedData)) {
      const childKeyText = useAttributeFormat
        ? `${categoryKey}::`
        : `**${categoryKey}:**`;

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
    }

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
// 🔄 BACKWARD COMPATIBILITY - Keep original functions (with warnings)
// ===================================================================

const findDataValue = (pageUid, key) => {
  console.warn(
    `⚠️ DEPRECATED: findDataValue() uses substring matching. Migrate to findDataValueExact() for reliability.`
  );
  return findDataValueExact(pageUid, key); // Delegate to exact version
};

const findNestedDataValues = (pageUid, parentKey) => {
  console.warn(
    `⚠️ DEPRECATED: findNestedDataValues() - use findNestedDataValuesExact().`
  );
  return findNestedDataValuesExact(pageUid, parentKey);
};

const setDataValue = async (
  pageUid,
  key,
  value,
  useAttributeFormat = false
) => {
  console.warn(`⚠️ DEPRECATED: setDataValue() - use setDataValueStructured().`);
  return setDataValueStructured(pageUid, key, value, useAttributeFormat);
};

// ===================================================================
// 👤 USER DETECTION UTILITIES - Unchanged (working well)
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
 * Smart user detection with caching
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

  return user;
};

const getCurrentUserUid = () => getCurrentUser().uid;
const getCurrentUserDisplayName = () => getCurrentUser().displayName;
const getCurrentUserPhotoUrl = () => getCurrentUser().photoUrl;
const getCurrentUserEmail = () => getCurrentUser().email;

const clearUserCache = () => {
  userCache = null;
  cacheTimestamp = 0;
};

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

const createPageIfNotExists = async (title) => {
  if (!title) return null;

  try {
    let pageUid = getPageUidByTitle(title);
    if (pageUid) return pageUid;

    pageUid = generateUID();
    await window.roamAlphaAPI.data.page.create({
      page: { title, uid: pageUid },
    });

    return pageUid;
  } catch (error) {
    console.error(`Failed to create page "${title}":`, error);
    return null;
  }
};

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

const generateUID = () => {
  return (
    window.roamAlphaAPI?.util?.generateUID?.() ||
    "util-" + Math.random().toString(36).substr(2, 9)
  );
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTodaysRoamDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = String(today.getFullYear());
  return `${month}-${day}-${year}`;
};

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
// 🎯 LEAN UTILITY REGISTRY
// ===================================================================

const UTILITIES = {
  // Primary extraction functions
  findDataValueExact: findDataValueExact,
  findNestedDataValuesExact: findNestedDataValuesExact,
  setDataValueStructured: setDataValueStructured,
  setNestedDataValuesStructured: setNestedDataValuesStructured,

  // Core helper functions
  normalizeHeaderText: normalizeHeaderText,
  findExactHeaderBlock: findExactHeaderBlock,
  getDirectChildren: getDirectChildren,
  normalizeCategoryName: normalizeCategoryName,

  // Backward compatibility (deprecated)
  findDataValue: findDataValue,
  findNestedDataValues: findNestedDataValues,
  setDataValue: setDataValue,

  // User detection
  getCurrentUser: getCurrentUser,
  getCurrentUserUid: getCurrentUserUid,
  getCurrentUserDisplayName: getCurrentUserDisplayName,
  getCurrentUserPhotoUrl: getCurrentUserPhotoUrl,
  getCurrentUserEmail: getCurrentUserEmail,
  getUserById: getUserById,
  isMultiUserGraph: isMultiUserGraph,
  clearUserCache: clearUserCache,

  // Page operations
  getPageUidByTitle: getPageUidByTitle,
  createPageIfNotExists: createPageIfNotExists,
  getCurrentPageTitle: getCurrentPageTitle,

  // Utilities
  generateUID: generateUID,
  wait: wait,
  getTodaysRoamDate: getTodaysRoamDate,
  parsePersonalShortcuts: parsePersonalShortcuts,
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("🔧 Lean Universal Parser starting...");

    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    const platform = window.RoamExtensionSuite;

    // Register all utilities
    Object.entries(UTILITIES).forEach(([name, utility]) => {
      platform.registerUtility(name, utility);
    });

    // Simple test commands
    const commands = [
      {
        label: "Utils: Test Exact Data Extraction",
        callback: async () => {
          const user = getCurrentUser();
          const pageTitle = `${user.displayName}/user preferences`;
          const pageUid = getPageUidByTitle(pageTitle);

          if (pageUid) {
            console.group("🧪 Testing Exact Data Extraction");
            console.log("Page UID:", pageUid);

            const testKeys = [
              "Loading Page Preference",
              "Journal Header Color",
              "Personal Shortcuts",
            ];

            testKeys.forEach((key) => {
              const value = findDataValueExact(pageUid, key);
              console.log(`${key}:`, value || "Not found");
            });

            console.groupEnd();
          } else {
            console.log("❌ User preferences page not found");
          }
        },
      },
      {
        label: "Utils: Test Nested Data Extraction",
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = getPageUidByTitle(user.displayName);

          if (userPageUid) {
            console.group("🧪 Testing Nested Data Extraction");

            const nestedData = findNestedDataValuesExact(
              userPageUid,
              "My Info"
            );
            if (nestedData && Object.keys(nestedData).length > 0) {
              console.log("My Info data:", nestedData);
            } else {
              console.log("No My Info structure found");
            }

            console.groupEnd();
          } else {
            console.log("❌ User page not found");
          }
        },
      },
      {
        label: "Utils: Create Sample Profile Structure",
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = await createPageIfNotExists(user.displayName);

          if (userPageUid) {
            console.log("🧪 Creating sample profile structure...");

            const profileData = {
              avatar:
                user.photoUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user.displayName
                )}`,
              location: "__not yet entered__",
              role: "__not yet entered__",
              timezone: "__not yet entered__",
              aboutMe: "__not yet entered__",
            };

            const success = await setNestedDataValuesStructured(
              userPageUid,
              "My Info",
              profileData,
              true
            );

            if (success) {
              console.log("✅ Sample profile structure created!");
              console.log(
                "💡 Check your user page - shows obvious placeholders"
              );
            }
          }
        },
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    platform.register(
      "utility-library",
      {
        utilities: UTILITIES,
        findDataValueExact,
        findNestedDataValuesExact,
        getCurrentUser,
        version: "1.5.3",
      },
      {
        name: "Lean Universal Parser",
        description: "Clean exact matching without unnecessary complexity",
        version: "1.5.3",
        dependencies: ["foundation-registry"],
      }
    );

    console.log("✅ Lean Universal Parser loaded!");
    console.log("🔧 CLEAN: Exact block matching only");
    console.log("🔧 CLEAN: No placeholder filtering - shows actual data");
    console.log("🔧 CLEAN: Simple and focused");
    console.log(`🎯 ${Object.keys(UTILITIES).length} utilities available`);

    const currentUser = getCurrentUser();
    console.log(
      `👤 Current user: ${currentUser.displayName} (${currentUser.method})`
    );
  },

  onunload: () => {
    console.log("🔧 Lean Universal Parser unloading...");
    clearUserCache();
    console.log("✅ Lean Universal Parser cleanup complete!");
  },
};
