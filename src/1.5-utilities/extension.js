// ===================================================================
// Extension 1.5: Utility Library - Professional Cross-Cutting Utilities
// ENHANCED: Now includes nested data value parsing for complex structures
// Following David Vargas's proven utility library patterns
// ===================================================================

// ===================================================================
// 📊 UNIVERSAL DATA PARSING - Enhanced Protocol Implementation
// ===================================================================

/**
 * Universal parser for all in-graph data following our new protocol
 * Handles multiple user input formats while enforcing parent-child structure
 *
 * @param {string} pageUid - UID of the page containing the data
 * @param {string} key - Key to search for (e.g., "Loading Page Preference")
 * @returns {string|string[]|null} - Single value, array of values, or null if not found
 */
const findDataValue = (pageUid, key) => {
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
        return cleanText.toLowerCase().includes(key.toLowerCase());
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

/**
 * 🆕 ENHANCED: Find nested data values under a parent key (e.g., all profile data under "About Me::")
 * Perfect for complex user profiles with multiple nested attributes
 *
 * @param {string} pageUid - UID of the page containing the data
 * @param {string} parentKey - Parent key to search for (e.g., "About Me", "Contact Info")
 * @returns {Object|null} - Object with key-value pairs from children, or null if parent not found
 */
const findNestedDataValues = (pageUid, parentKey) => {
  if (!pageUid || !parentKey) return null;

  try {
    // First, find the parent block using existing logic
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `);

    let parentBlock = null;

    // Method 1: Look for attribute format "ParentKey::"
    parentBlock = allBlocks.find(([uid, text]) => {
      return text.trim() === `${parentKey}::`;
    });

    // Method 2: Look for text that contains the parent key (handles bold/plain)
    if (!parentBlock) {
      parentBlock = allBlocks.find(([uid, text]) => {
        const cleanText = text.replace(/\*\*/g, "").replace(/:/g, "").trim();
        return cleanText.toLowerCase().includes(parentKey.toLowerCase());
      });
    }

    if (!parentBlock) {
      console.log(`Parent key "${parentKey}" not found on page`);
      return null;
    }

    const [parentBlockUid, parentBlockText] = parentBlock;

    // Get all children blocks of the parent
    const childrenBlocks = window.roamAlphaAPI.data
      .q(
        `
      [:find ?childUid ?childString ?childOrder
       :where 
       [?parent :block/uid "${parentBlockUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?childUid]
       [?child :block/string ?childString]
       [?child :block/order ?childOrder]]
    `
      )
      .sort((a, b) => a[2] - b[2]); // Sort by order

    if (childrenBlocks.length === 0) {
      console.log(`No children found under "${parentKey}"`);
      return {};
    }

    // Parse each child as a key-value pair
    const nestedData = {};

    for (const [childUid, childString] of childrenBlocks) {
      // Look for attribute format "Key::" in child text
      const attributeMatch = childString.match(/^(.+?)::(.*)$/);
      if (attributeMatch) {
        const key = attributeMatch[1].trim();
        let value = attributeMatch[2].trim();

        // If no value after ::, look for child blocks
        if (!value) {
          const grandchildren = window.roamAlphaAPI.data
            .q(
              `
            [:find ?grandchildString ?grandchildOrder
             :where 
             [?parent :block/uid "${childUid}"]
             [?parent :block/children ?grandchild]
             [?grandchild :block/string ?grandchildString]
             [?grandchild :block/order ?grandchildOrder]]
          `
            )
            .sort((a, b) => a[1] - b[1]);

          if (grandchildren.length === 1) {
            value = grandchildren[0][0];
          } else if (grandchildren.length > 1) {
            value = grandchildren.map(([text]) => text);
          }
        }

        if (value) {
          nestedData[key] = value;
        }
      } else {
        // Look for other formats like "**Key:**" or "Key:"
        const boldMatch = childString.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
        const plainMatch = childString.match(/^(.+?):\s*(.*)$/);

        let key, value;

        if (boldMatch) {
          key = boldMatch[1].trim();
          value = boldMatch[2].trim();
        } else if (plainMatch) {
          key = plainMatch[1].trim();
          value = plainMatch[2].trim();
        }

        // If we found a key but no value, look for child blocks
        if (key && !value) {
          const grandchildren = window.roamAlphaAPI.data
            .q(
              `
            [:find ?grandchildString ?grandchildOrder
             :where 
             [?parent :block/uid "${childUid}"]
             [?parent :block/children ?grandchild]
             [?grandchild :block/string ?grandchildString]
             [?grandchild :block/order ?grandchildOrder]]
          `
            )
            .sort((a, b) => a[1] - b[1]);

          if (grandchildren.length === 1) {
            value = grandchildren[0][0];
          } else if (grandchildren.length > 1) {
            value = grandchildren.map(([text]) => text);
          }
        }

        if (key && value) {
          nestedData[key] = value;
        }
      }
    }

    console.log(
      `📊 Found ${
        Object.keys(nestedData).length
      } nested values under "${parentKey}":`,
      nestedData
    );
    return nestedData;
  } catch (error) {
    console.error(`Error in findNestedDataValues for "${parentKey}":`, error);
    return null;
  }
};

/**
 * Create or update data value using parent-child structure
 * Enforces our universal protocol structure
 */
const setDataValue = async (
  pageUid,
  key,
  value,
  useAttributeFormat = false
) => {
  if (!pageUid || !key) return false;

  try {
    // Format the key based on preference
    const keyText = useAttributeFormat ? `${key}::` : `**${key}:**`;

    // Check if key block already exists
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);

    let keyBlock = allBlocks.find(([uid, text]) => {
      if (useAttributeFormat) {
        return text.trim() === keyText;
      } else {
        const cleanText = text.replace(/\*\*/g, "").replace(/:/g, "").trim();
        return cleanText.toLowerCase().includes(key.toLowerCase());
      }
    });

    let keyBlockUid;

    if (!keyBlock) {
      // Create new key block
      keyBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: keyText },
      });
    } else {
      keyBlockUid = keyBlock[0];

      // Clear existing children
      const existingChildren = window.roamAlphaAPI.data.q(`
        [:find ?childUid
         :where 
         [?parent :block/uid "${keyBlockUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?childUid]]
      `);

      for (const [childUid] of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: childUid },
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
    console.error(`Error in setDataValue for "${key}":`, error);
    return false;
  }
};

/**
 * 🆕 ENHANCED: Set nested data values under a parent key
 * Perfect for complex user profiles with multiple attributes
 *
 * @param {string} pageUid - UID of the page containing the data
 * @param {string} parentKey - Parent key to create/update (e.g., "Contact Info")
 * @param {Object} nestedData - Object with key-value pairs to set as children
 * @param {boolean} useAttributeFormat - Whether to use attribute format (Key::)
 * @returns {boolean} - Success status
 */
const setNestedDataValues = async (
  pageUid,
  parentKey,
  nestedData,
  useAttributeFormat = false
) => {
  if (!pageUid || !parentKey || !nestedData || typeof nestedData !== "object") {
    return false;
  }

  try {
    // First ensure the parent block exists
    const parentKeyText = useAttributeFormat
      ? `${parentKey}::`
      : `**${parentKey}:**`;

    // Check if parent block already exists
    const allBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string
       :where 
       [?parent :block/uid "${pageUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]]
    `);

    let parentBlock = allBlocks.find(([uid, text]) => {
      if (useAttributeFormat) {
        return text.trim() === parentKeyText;
      } else {
        const cleanText = text.replace(/\*\*/g, "").replace(/:/g, "").trim();
        return cleanText.toLowerCase().includes(parentKey.toLowerCase());
      }
    });

    let parentBlockUid;

    if (!parentBlock) {
      // Create new parent block
      parentBlockUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": pageUid, order: "last" },
        block: { string: parentKeyText },
      });
    } else {
      parentBlockUid = parentBlock[0];

      // Clear existing children
      const existingChildren = window.roamAlphaAPI.data.q(`
        [:find ?childUid
         :where 
         [?parent :block/uid "${parentBlockUid}"]
         [?parent :block/children ?child]
         [?child :block/uid ?childUid]]
      `);

      for (const [childUid] of existingChildren) {
        await window.roamAlphaAPI.data.block.delete({
          block: { uid: childUid },
        });
      }
    }

    // Add each nested key-value pair as children
    let order = 0;
    for (const [key, value] of Object.entries(nestedData)) {
      const childKeyText = useAttributeFormat ? `${key}::` : `**${key}:**`;

      // Create child key block
      const childKeyUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": parentBlockUid, order: order++ },
        block: { string: childKeyText },
      });

      // Add value(s) as grandchildren
      const values = Array.isArray(value) ? value : [value];
      for (let i = 0; i < values.length; i++) {
        await window.roamAlphaAPI.data.block.create({
          location: { "parent-uid": childKeyUid, order: i },
          block: { string: values[i] },
        });
      }
    }

    console.log(
      `✅ Set ${
        Object.keys(nestedData).length
      } nested values under "${parentKey}"`
    );
    return true;
  } catch (error) {
    console.error(`Error in setNestedDataValues for "${parentKey}":`, error);
    return false;
  }
};

// ===================================================================
// 👤 USER DETECTION UTILITIES - Professional Multi-Method Approach
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

      // Extract key user data from localStorage structure
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
          photoUrl: null, // localStorage doesn't store photo URLs
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
    // Get recent blocks created in last hour
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
      // Get most recent block's creator
      const mostRecentBlock = recentBlocks.sort((a, b) => b[2] - a[2])[0];
      const userDbId = mostRecentBlock[1];

      // Get user details
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
  // Smart caching - only refresh every 5 minutes
  if (userCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return userCache;
  }

  // Try detection methods in order of reliability
  let user =
    getCurrentUserViaOfficialAPI() ||
    getCurrentUserViaLocalStorage() ||
    getCurrentUserViaRecentBlocks();

  // Fallback to basic user if all methods fail
  if (!user) {
    user = {
      uid: generateUID(),
      displayName: "Unknown User",
      photoUrl: null,
      email: null,
      method: "fallback",
    };
  }

  // Cache successful result
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
// 📄 PAGE AND BLOCK UTILITIES - Core Roam Operations
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
    // Check if page exists
    let pageUid = getPageUidByTitle(title);
    if (pageUid) return pageUid;

    // Create new page
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
// 🔧 UTILITY FUNCTIONS - Helper Operations
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

  // Handle parentheses format: (Page One)(Page Two)
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
// 🎯 ENHANCED UTILITY REGISTRY - Central Registration System
// ===================================================================

const UTILITIES = {
  // Enhanced data parsing
  findDataValue: findDataValue,
  setDataValue: setDataValue,
  findNestedDataValues: findNestedDataValues, // 🆕 NEW NESTED PARSER
  setNestedDataValues: setNestedDataValues, // 🆕 NEW NESTED SETTER

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

  // Helper utilities
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
    console.log("🔧 Enhanced Utility Library starting...");

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
      console.log(`🔧 Registered utility: ${name}`);
    });

    // 📝 REGISTER ENHANCED DEBUG COMMANDS
    const commands = [
      {
        label: "Utils: Test Universal Data Parser",
        callback: async () => {
          const user = getCurrentUser();
          const pageTitle = `${user.displayName}/user preferences`;
          const pageUid = getPageUidByTitle(pageTitle);

          if (pageUid) {
            console.group("🧪 Testing Universal Data Parser");
            console.log("Page UID:", pageUid);

            const testKeys = [
              "Loading Page Preference",
              "Journal Header Color",
              "Personal Shortcuts",
              "Immutable Home Page",
            ];

            testKeys.forEach((key) => {
              const value = findDataValue(pageUid, key);
              console.log(`${key}:`, value);
            });

            console.groupEnd();
          } else {
            console.log("❌ User preferences page not found");
          }
        },
      },
      {
        label: "Utils: Test Nested Data Parser", // 🆕 NEW COMMAND
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = getPageUidByTitle(user.displayName);

          if (userPageUid) {
            console.group("🧪 Testing Nested Data Parser");
            console.log("User Page UID:", userPageUid);

            // Test nested data structures
            const testParentKeys = [
              "Contact Info",
              "About Me",
              "Profile Data",
              "Social Links",
            ];

            testParentKeys.forEach((parentKey) => {
              const nestedData = findNestedDataValues(userPageUid, parentKey);
              if (nestedData && Object.keys(nestedData).length > 0) {
                console.log(`📊 ${parentKey}:`, nestedData);
              } else {
                console.log(`📊 ${parentKey}: No nested data found`);
              }
            });

            console.groupEnd();
          } else {
            console.log("❌ User page not found");
          }
        },
      },
      {
        label: "Utils: Create Sample Nested Data", // 🆕 NEW COMMAND
        callback: async () => {
          const user = getCurrentUser();
          const userPageUid = await createPageIfNotExists(user.displayName);

          if (userPageUid) {
            console.log("🧪 Creating sample nested data structure...");

            // Create sample nested contact info
            const contactInfo = {
              Email: user.email || "user@example.com",
              Phone: "+1 (555) 123-4567",
              LinkedIn: "linkedin.com/in/username",
              Twitter: "@username",
            };

            const success = await setNestedDataValues(
              userPageUid,
              "Contact Info",
              contactInfo,
              true
            );

            if (success) {
              console.log("✅ Sample nested data created successfully!");
              console.log(
                "💡 Check your user page and try 'Utils: Test Nested Data Parser'"
              );
            } else {
              console.log("❌ Failed to create sample nested data");
            }
          }
        },
      },
      {
        label: "Utils: Test User Detection",
        callback: () => {
          console.group("🧪 Testing User Detection Methods");
          console.log("Official API:", getCurrentUserViaOfficialAPI());
          console.log("localStorage:", getCurrentUserViaLocalStorage());
          console.log("Recent blocks:", getCurrentUserViaRecentBlocks());
          console.log("Final result:", getCurrentUser());
          console.log("Multi-user graph:", isMultiUserGraph());
          console.groupEnd();
        },
      },
      {
        label: "Utils: List All Utilities",
        callback: () => {
          console.group("🔧 Available Utilities");
          Object.keys(UTILITIES).forEach((name) => {
            const isNew = [
              "findNestedDataValues",
              "setNestedDataValues",
            ].includes(name);
            console.log(`${isNew ? "🆕" : "•"} ${name}`);
          });
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
        findDataValue,
        findNestedDataValues, // 🆕 NEW
        getCurrentUser,
        version: "1.5.1", // Incremented for new features
      },
      {
        name: "Enhanced Utility Library",
        description:
          "Professional cross-cutting utilities with nested data parsing capabilities",
        version: "1.5.1",
        dependencies: ["foundation-registry"],
      }
    );

    // 🎉 STARTUP COMPLETE
    console.log(
      `✅ Enhanced Utility Library loaded with ${
        Object.keys(UTILITIES).length
      } utilities!`
    );
    console.log("🆕 NEW: Nested data parsing capabilities added");
    console.log('💡 Try: Cmd+P → "Utils: Test Nested Data Parser"');

    // Test user detection on startup
    const currentUser = getCurrentUser();
    console.log(
      `👤 Current user: ${currentUser.displayName} (${currentUser.method})`
    );
  },

  onunload: () => {
    console.log("🔧 Enhanced Utility Library unloading...");

    // Clear caches
    clearUserCache();

    console.log("✅ Enhanced Utility Library cleanup complete!");
  },
};
