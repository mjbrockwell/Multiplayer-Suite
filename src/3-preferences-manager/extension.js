// ===================================================================
// Extension 3: Settings Manager - Tree-Based Configuration
// Based on David Vargas's enterprise-grade patterns from Roam University
// Using getSettingValueFromTree, setInputSetting, getSubTree patterns
// ===================================================================

// ===================================================================
// 🔧 DAVID'S PROVEN SETTINGS UTILITIES - Professional Business Logic
// ===================================================================

// David's flexible regex matching - handles variations gracefully
const toFlexRegex = (key) => {
  return new RegExp(
    `^\\s*${key.replace(/([()])/g, "\\$1")}\\s*(#\\.[\\w\\d-]*\\s*)?$`,
    "i"
  );
};

// Get basic tree structure (simplified version of David's getBasicTreeByParentUid)
const getBasicTreeByParentUid = (parentUid) => {
  if (!parentUid) return [];

  try {
    const childBlocks = window.roamAlphaAPI.data.q(`
      [:find ?uid ?string ?order
       :where 
       [?parent :block/uid "${parentUid}"]
       [?parent :block/children ?child]
       [?child :block/uid ?uid]
       [?child :block/string ?string]
       [?child :block/order ?order]]
    `);

    return childBlocks
      .sort((a, b) => a[2] - b[2]) // Sort by order
      .map(([uid, text, order]) => ({
        uid,
        text: text || "",
        order,
        children: getBasicTreeByParentUid(uid), // Recursive for hierarchy
      }));
  } catch (error) {
    console.warn("Failed to get tree structure:", error.message);
    return [];
  }
};

// David's getSettingValueFromTree - Core settings reading
const getSettingValueFromTree = ({
  parentUid = "",
  tree = null,
  key,
  defaultValue = "",
}) => {
  const actualTree = tree || getBasicTreeByParentUid(parentUid);
  const node = actualTree.find((s) => toFlexRegex(key).test(s.text.trim()));
  const value = node?.children?.[0]
    ? node.children[0].text.trim()
    : defaultValue;
  return value;
};

// David's getSubTree - Smart setting initialization (auto-creates missing settings!)
const getSubTree = async ({ key, parentUid, order = 0, tree = null }) => {
  const actualTree = tree || getBasicTreeByParentUid(parentUid);
  const node = actualTree.find((s) => toFlexRegex(key).test(s.text.trim()));

  if (node) return node; // Setting exists, return it

  const defaultNode = { text: "", children: [] };

  if (parentUid) {
    // 🔥 AUTO-CREATE missing settings structure! (David's pattern)
    const uid = window.roamAlphaAPI.util.generateUID();
    try {
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": parentUid, order },
        block: { text: key, uid },
      });

      console.log(`⚙️ Auto-created setting: ${key}`);
      return { uid, ...defaultNode };
    } catch (error) {
      console.warn(`Failed to auto-create setting ${key}:`, error.message);
    }
  }

  return { uid: "", ...defaultNode };
};

// David's setInputSetting - Intelligent setting updates
const setInputSetting = async ({ blockUid, value, key, index = 0 }) => {
  const tree = getBasicTreeByParentUid(blockUid);
  const keyNode = tree.find((t) => toFlexRegex(key).test(t.text));

  try {
    if (keyNode && keyNode.children.length) {
      // Update existing value
      await window.roamAlphaAPI.data.block.update({
        block: { uid: keyNode.children[0].uid, string: value },
      });
      return keyNode.children[0].uid;
    } else if (!keyNode) {
      // Create new key-value structure
      const keyUid = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": blockUid, order: index },
        block: { text: key, uid: keyUid },
      });

      const valueUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyUid, order: 0 },
        block: { string: value },
      });
      return valueUid;
    } else {
      // Add value to existing key
      const valueUid = await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": keyNode.uid, order: 0 },
        block: { string: value },
      });
      return valueUid;
    }
  } catch (error) {
    console.error(`Failed to set setting ${key}:`, error.message);
    throw error;
  }
};

// ===================================================================
// 🏠 USER PREFERENCES MANAGEMENT - Our Domain Logic
// ===================================================================

// Get user's preferences page UID (creates if missing)
const getUserPreferencesPageUid = async (username) => {
  const pageTitle = `${username}/user preferences`;

  try {
    // Try to find existing page
    let pageUid = window.roamAlphaAPI.data.q(`
      [:find ?uid .
       :where [?page :node/title "${pageTitle}"] [?page :block/uid ?uid]]
    `);

    if (!pageUid) {
      // Create preferences page with default structure
      pageUid = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.data.page.create({
        page: { title: pageTitle, uid: pageUid },
      });

      // Create default preference structure
      await createDefaultPreferences(pageUid);
      console.log(`📄 Created preferences page for ${username}`);
    }

    return pageUid;
  } catch (error) {
    console.error(
      `Failed to get preferences page for ${username}:`,
      error.message
    );
    throw error;
  }
};

// Create default preference structure
const createDefaultPreferences = async (pageUid) => {
  const defaultPrefs = [
    { key: "Loading Page Preference", value: "Daily Page" },
    { key: "Immutable Home Page", value: "yes" },
    { key: "Weekly Bundle", value: "no" },
    { key: "Journal Header Color", value: "blue" },
    { key: "Personal Shortcuts", value: "(Daily Notes)(Chat Room)" },
  ];

  for (let i = 0; i < defaultPrefs.length; i++) {
    const { key, value } = defaultPrefs[i];
    await setInputSetting({
      blockUid: pageUid,
      key,
      value,
      index: i,
    });
  }
};

// ===================================================================
// 🎯 PUBLIC API - Clean Interface for Other Extensions
// ===================================================================

// Get user preference with automatic fallbacks
const getUserPreference = async (username, key, defaultValue = "") => {
  try {
    const pageUid = await getUserPreferencesPageUid(username);
    return getSettingValueFromTree({
      parentUid: pageUid,
      key,
      defaultValue,
    });
  } catch (error) {
    console.warn(
      `Failed to get preference ${key} for ${username}:`,
      error.message
    );
    return defaultValue;
  }
};

// Set user preference with auto-creation
const setUserPreference = async (username, key, value) => {
  try {
    const pageUid = await getUserPreferencesPageUid(username);
    return await setInputSetting({
      blockUid: pageUid,
      key,
      value,
    });
  } catch (error) {
    console.error(
      `Failed to set preference ${key} for ${username}:`,
      error.message
    );
    throw error;
  }
};

// Get all user preferences as object
const getAllUserPreferences = async (username) => {
  try {
    const pageUid = await getUserPreferencesPageUid(username);
    const tree = getBasicTreeByParentUid(pageUid);

    const preferences = {};
    tree.forEach((node) => {
      if (node.children.length > 0) {
        const key = node.text.trim();
        const value = node.children[0].text.trim();
        preferences[key] = value;
      }
    });

    return preferences;
  } catch (error) {
    console.warn(
      `Failed to get all preferences for ${username}:`,
      error.message
    );
    return {};
  }
};

// Parse personal shortcuts from parentheses format: (Page One)(Page Two)
const parsePersonalShortcuts = (shortcutsString) => {
  if (!shortcutsString) return [];

  const regex = /\(([^)]+)\)/g;
  const shortcuts = [];
  let match;

  while ((match = regex.exec(shortcutsString)) !== null) {
    const pageName = match[1].trim();
    if (pageName) {
      shortcuts.push(pageName);
    }
  }

  return shortcuts;
};

// ===================================================================
// 🚀 ROAM EXTENSION EXPORT - Professional Integration
// ===================================================================

export default {
  onload: async ({ extensionAPI }) => {
    console.log("⚙️ Settings Manager starting...");

    // ✅ VERIFY DEPENDENCIES
    if (!window.RoamExtensionSuite) {
      console.error(
        "❌ Foundation Registry not found! Please load Extension 1 first."
      );
      return;
    }

    if (!window.RoamExtensionSuite.has("user-authentication")) {
      console.error(
        "❌ User Authentication not found! Please load Extension 2 first."
      );
      return;
    }

    // 🎯 REGISTER UTILITIES WITH PLATFORM
    const platform = window.RoamExtensionSuite;

    // Core settings API
    platform.registerUtility("getUserPreference", getUserPreference);
    platform.registerUtility("setUserPreference", setUserPreference);
    platform.registerUtility("getAllUserPreferences", getAllUserPreferences);
    platform.registerUtility("parsePersonalShortcuts", parsePersonalShortcuts);

    // David's low-level utilities for advanced use
    platform.registerUtility(
      "getSettingValueFromTree",
      getSettingValueFromTree
    );
    platform.registerUtility("setInputSetting", setInputSetting);
    platform.registerUtility("getSubTree", getSubTree);
    platform.registerUtility("toFlexRegex", toFlexRegex);

    // 📝 REGISTER COMMANDS FOR TESTING/DEBUG
    const commands = [
      {
        label: "Settings: Show Current User Preferences",
        callback: async () => {
          const getCurrentUser = platform.getUtility("getCurrentUser");
          const user = getCurrentUser();
          const prefs = await getAllUserPreferences(user.displayName);
          console.log(`⚙️ Preferences for ${user.displayName}:`, prefs);
        },
      },
      {
        label: "Settings: Test Personal Shortcuts Parser",
        callback: async () => {
          const getCurrentUser = platform.getUtility("getCurrentUser");
          const user = getCurrentUser();
          const shortcutsString = await getUserPreference(
            user.displayName,
            "Personal Shortcuts"
          );
          const parsed = parsePersonalShortcuts(shortcutsString);
          console.log("🔗 Personal Shortcuts:");
          console.log("Raw string:", shortcutsString);
          console.log("Parsed array:", parsed);
        },
      },
      {
        label: "Settings: Create Test Preference",
        callback: async () => {
          const getCurrentUser = platform.getUtility("getCurrentUser");
          const user = getCurrentUser();
          const testValue = `Test value ${Date.now()}`;
          await setUserPreference(user.displayName, "Test Setting", testValue);
          console.log(
            `✅ Created test setting for ${user.displayName}: ${testValue}`
          );
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
      "settings-manager",
      {
        getUserPreference,
        setUserPreference,
        getAllUserPreferences,
        parsePersonalShortcuts,
        getSettingValueFromTree,
        setInputSetting,
        getSubTree,
        version: "1.0.0",
      },
      {
        name: "Settings Manager",
        description:
          "Professional tree-based configuration with auto-creation and flexible matching",
        version: "1.0.0",
        dependencies: ["foundation-registry", "user-authentication"],
      }
    );

    // 🎉 STARTUP TEST
    try {
      const getCurrentUser = platform.getUtility("getCurrentUser");
      const user = getCurrentUser();
      const testPref = await getUserPreference(
        user.displayName,
        "Loading Page Preference",
        "Daily Page"
      );

      console.log("✅ Settings Manager loaded successfully!");
      console.log(
        `⚙️ Sample setting for ${user.displayName}: Loading Page = "${testPref}"`
      );
      console.log('💡 Try: Cmd+P → "Settings: Show Current User Preferences"');
    } catch (error) {
      console.warn("Settings Manager loaded with warnings:", error.message);
    }
  },

  onunload: () => {
    console.log("⚙️ Settings Manager unloading...");
    console.log("✅ Settings Manager cleanup complete!");
  },
};
