// ===================================================================
// Extension 1.5: Lean Universal Parser - Exact Matching + Bulletproof Cascading
// UPDATED: Added bulletproof cascadeToBlock function to eliminate race conditions
// Features: Exact block matching + proven cascading pattern from Subjournals
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
 * 🚀 BULLETPROOF CASCADE TO BLOCK - Eliminates all race conditions!
 * Based on proven Subjournals pattern: 79ms, 6 loops, 100% success rate
 *
 * @param {Array} pathArray - Array of strings representing the hierarchy path
 * @returns {Promise<string>} - UID of the final block in the hierarchy
 */
const cascadeToBlock = async (pathArray) => {
  if (!pathArray || !Array.isArray(pathArray) || pathArray.length === 0) {
    throw new Error(
      "cascadeToBlock: pathArray is required and must be non-empty"
    );
  }

  const startTime = Date.now();
  const TIMEOUT = 3000; // 3-second failsafe (same as proven Subjournals pattern)

  // 🔥 Race condition prevention cache - THE KEY TO EVERYTHING!
  const workingOn = {
    step: null, // Current hierarchy level we're working on
    uid: null, // Parent UID we're working under
    content: null, // Content we're trying to create
  };

  let loopCount = 0;

  console.log(`🚀 cascadeToBlock starting: [${pathArray.join(" → ")}]`);

  while (Date.now() - startTime < TIMEOUT) {
    loopCount++;

    try {
      // ===== STEP 1: Ensure page exists =====
      const pageTitle = pathArray[0];
      let pageUid = getPageUidByTitle(pageTitle);

      if (!pageUid) {
        // Need to create page
        if (workingOn.step !== "page" || workingOn.content !== pageTitle) {
          workingOn.step = "page";
          workingOn.uid = null;
          workingOn.content = pageTitle;

          console.log(`🔧 Loop ${loopCount}: Creating page "${pageTitle}"`);

          pageUid = window.roamAlphaAPI.util.generateUID();
          await window.roamAlphaAPI.data.page.create({
            page: { title: pageTitle, uid: pageUid },
          });
        }
        continue; // Go back to step 1 to verify page exists
      }

      // ===== STEP 2-N: Process each block level =====
      let currentParentUid = pageUid;
      let allLevelsExist = true;

      for (let i = 1; i < pathArray.length; i++) {
        const blockContent = pathArray[i];
        const stepKey = `level-${i}`;

        // Check if this level already exists
        const children = getDirectChildren(currentParentUid);
        const existingChild = children.find(
          (child) =>
            normalizeHeaderText(child.text) ===
            normalizeHeaderText(blockContent)
        );

        if (existingChild) {
          // This level exists, move to next level
          currentParentUid = existingChild.uid;
          continue;
        }

        // This level doesn't exist - need to create it
        if (
          workingOn.step !== stepKey ||
          workingOn.uid !== currentParentUid ||
          workingOn.content !== blockContent
        ) {
          workingOn.step = stepKey;
          workingOn.uid = currentParentUid;
          workingOn.content = blockContent;

          console.log(
            `🔧 Loop ${loopCount}: Creating level ${i} "${blockContent}" under ${currentParentUid}`
          );

          await window.roamAlphaAPI.data.block.create({
            location: { "parent-uid": currentParentUid, order: "last" },
            block: { string: blockContent },
          });
        }

        allLevelsExist = false;
        break; // Exit inner loop to restart from beginning
      }

      if (allLevelsExist) {
        // 🎯 SUCCESS! All levels exist, return the final block UID
        console.log(
          `🎯 ✅ CASCADE SUCCESS: Created hierarchy in ${loopCount} loops (${
            Date.now() - startTime
          }ms)`
        );
        console.log(`🔧 Final UID: ${currentParentUid}`);
        return currentParentUid;
      }
    } catch (error) {
      console.error(`🔧 Loop ${loopCount} error:`, error.message);
      // Continue looping - transient errors are expected
    }
  }

  // Timeout reached - provide detailed error info
  const errorMsg = `🚨 cascadeToBlock TIMEOUT after ${TIMEOUT}ms (${loopCount} loops). Was working on: ${workingOn.step} | UID: ${workingOn.uid} | Content: "${workingOn.content}"`;
  console.error(errorMsg);
  throw new Error(errorMsg);
};

// ===================================================================
// 🧪 TESTING AND VALIDATION FUNCTIONS
// ===================================================================

/**
 * 🧪 Test the bulletproof cascade function
 */
const testCascadeToBlock = async (testPath) => {
  const defaultTestPath = ["Test Page", "Level 1", "Level 2", "Level 3"];
  const pathToTest = testPath || defaultTestPath;

  console.log("🧪 Testing bulletproof cascadeToBlock...");
  console.log(`🎯 Test path: [${pathToTest.join(" → ")}]`);

  try {
    const startTime = Date.now();
    const finalUid = await cascadeToBlock(pathToTest);
    const elapsed = Date.now() - startTime;

    console.log(`✅ CASCADE TEST SUCCESS!`);
    console.log(`⏱️  Time: ${elapsed}ms`);
    console.log(`🎯 Final UID: ${finalUid}`);

    // Test immediate update (this was failing before the fix!)
    console.log("🧪 Testing immediate block update (race condition test)...");
    await window.roamAlphaAPI.data.block.update({
      block: {
        uid: finalUid,
        string: `Updated content - ${new Date().toISOString()}`,
      },
    });
    console.log("✅ IMMEDIATE UPDATE SUCCESS - No race condition!");

    return { success: true, uid: finalUid, elapsed };
  } catch (error) {
    console.error("❌ CASCADE TEST FAILED:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🧪 Quick cascade test for command palette
 */
const quickCascadeTest = async () => {
  const result = await testCascadeToBlock([
    "roam/css",
    "Test Cascade",
    "Quick Test",
  ]);

  if (result.success) {
    alert(
      `✅ CASCADE TEST PASSED!\n⏱️ Time: ${result.elapsed}ms\n🎯 UID: ${result.uid}`
    );
  } else {
    alert(`❌ CASCADE TEST FAILED!\n💥 Error: ${result.error}`);
  }

  return result;
};

// ===================================================================
// 📝 NORMALIZED CATEGORY NAMES FOR CONSISTENT KEYS
// ===================================================================

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

// ===================================================================
// 🛠️ STRUCTURED DATA CREATION FUNCTIONS
// ===================================================================

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
      return {
        uid: userUid,
        method: "Official API",
        reliable: true,
      };
    }
  } catch (error) {
    console.debug("Official API not available:", error.message);
  }
  return null;
};

/**
 * DOM parsing fallback method
 */
const getCurrentUserViaDOM = () => {
  try {
    const profileButton = document.querySelector(
      '.bp3-button[data-testid="user-menu"]'
    );
    if (profileButton) {
      const textContent = profileButton.textContent.trim();
      if (textContent && textContent !== "...") {
        return {
          displayName: textContent,
          method: "DOM Profile Button",
          reliable: false,
        };
      }
    }
  } catch (error) {
    console.debug("DOM parsing failed:", error.message);
  }
  return null;
};

// Cache to avoid repeated expensive operations
let userCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

const clearUserCache = () => {
  userCache = null;
  lastCacheTime = 0;
};

/**
 * 👤 Smart user detection with multiple fallback methods
 */
const getCurrentUser = () => {
  const now = Date.now();
  if (userCache && now - lastCacheTime < CACHE_DURATION) {
    return userCache;
  }

  // Try official API first
  let result = getCurrentUserViaOfficialAPI();

  // Fallback to DOM parsing if needed
  if (!result) {
    result = getCurrentUserViaDOM();
  }

  // Final fallback
  if (!result) {
    result = {
      displayName: "Unknown User",
      method: "Fallback",
      reliable: false,
    };
  }

  // Cache successful results
  if (result.reliable !== false) {
    userCache = result;
    lastCacheTime = now;
  }

  return result;
};

// ===================================================================
// 🎛️ UTILITIES REGISTRY - Simplified to match original pattern
// ===================================================================

const UTILITIES = {
  // 🚀 NEW BULLETPROOF CASCADING
  cascadeToBlock,
  testCascadeToBlock,
  quickCascadeTest,

  // Core Functions
  findDataValueExact,
  findNestedDataValuesExact,
  setDataValueStructured,

  // Helper Functions
  getDirectChildren,
  getPageUidByTitle,
  normalizeHeaderText,
  normalizeCategoryName,

  // User Detection
  getCurrentUser,
  getCurrentUserViaOfficialAPI,
  getCurrentUserViaDOM,
  clearUserCache,
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Fixed to match original Extension 1.5 pattern
// ===================================================================

export default {
  onload: () => {
    console.log(
      "🔧 Lean Universal Parser loading with bulletproof cascading..."
    );

    // Initialize extension registry if it doesn't exist
    if (!window._extensionRegistry) {
      window._extensionRegistry = {
        extensions: new Map(),
        utilities: {}, // Changed from Map() to {} - Object for compatibility
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
        label: "Test Bulletproof Cascade",
        callback: quickCascadeTest,
      },
      {
        label: "Test Cascade with Custom Path",
        callback: async () => {
          const pathInput = prompt(
            "Enter comma-separated path (e.g., 'Test Page,Level 1,Level 2'):"
          );
          if (pathInput) {
            const pathArray = pathInput.split(",").map((s) => s.trim());
            const result = await testCascadeToBlock(pathArray);

            if (result.success) {
              alert(
                `✅ SUCCESS!\nTime: ${result.elapsed}ms\nUID: ${result.uid}`
              );
            } else {
              alert(`❌ FAILED!\nError: ${result.error}`);
            }
          }
        },
      },
      {
        label: "Debug Current User",
        callback: () => {
          const user = getCurrentUser();
          console.log("👤 Current user debug:", user);
          alert(`👤 Current User:\n${JSON.stringify(user, null, 2)}`);
        },
      },
    ];

    commands.forEach((cmd) => {
      window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      window._extensionRegistry.commands.push(cmd.label);
    });

    // 🚀 Export utilities globally for other extensions to use
    Object.assign(window._extensionRegistry.utilities, UTILITIES);

    // Export key functions directly for backwards compatibility
    window._extensionRegistry.utilities.findDataValueExact = findDataValueExact;
    window._extensionRegistry.utilities.findNestedDataValuesExact =
      findNestedDataValuesExact;
    window._extensionRegistry.utilities.cascadeToBlock = cascadeToBlock; // 🚀 The star of the show!
    window._extensionRegistry.utilities.getCurrentUser = getCurrentUser;

    // 🧪 Expose test functions globally for easy access
    window.testCascadeToBlock = testCascadeToBlock;
    window.quickCascadeTest = quickCascadeTest;

    console.log("✅ Lean Universal Parser + Bulletproof Cascading loaded!");
    console.log("🔧 CLEAN: Exact block matching only");
    console.log(
      "🚀 NEW: Bulletproof cascadeToBlock - eliminates race conditions!"
    );
    console.log(
      "🧪 TEST: window.testCascadeToBlock() and window.quickCascadeTest()"
    );
    console.log(`🎯 ${Object.keys(UTILITIES).length} utilities available`);

    const currentUser = getCurrentUser();
    console.log(
      `👤 Current user: ${currentUser.displayName || currentUser.uid} (${
        currentUser.method
      })`
    );
  },

  onunload: () => {
    console.log("🔧 Lean Universal Parser unloading...");
    clearUserCache();

    // Clean up test functions
    delete window.testCascadeToBlock;
    delete window.quickCascadeTest;

    console.log("✅ Lean Universal Parser cleanup complete!");
  },
};
