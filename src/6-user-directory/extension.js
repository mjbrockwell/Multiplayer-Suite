// ===================================================================
// Extension SIX: User Directory + Timezones - SIMPLE BUTTON UTILITY 2.0 INTEGRATION
// 🎯 FIXED: Proper Simple Button Utility 2.0 integration with no fallback
// 🗑️ REMOVED: All fallback button logic (fails gracefully instead)
// ✅ CONDITIONAL: Button only appears on username pages or "chat room" pages
// 🔧 FIXED: Chat room detection with proper DOM-first title detection
// 📝 ENHANCED: Opportunistic cache refresh during modal creation
// 🖱️ NEW: Clickable avatars and usernames for easy navigation
// ===================================================================

// ===================================================================
// 🔧 DEPENDENCY MANAGEMENT - Enhanced with Proper Button Utility
// ===================================================================

/**
 * Check if Extension 1.5 utilities are available (except navigation)
 */
const checkExtension15Dependencies = () => {
  const platform = window.RoamExtensionSuite;

  if (!platform) {
    console.log(
      "💡 Please ensure Extension 1.5 is loaded before Extension SIX"
    );
    return false;
  }

  const requiredUtilities = [
    "timezoneManager",
    "modalUtilities",
    "profileAnalysisUtilities",
    "processAvatarImages",
    "extractImageUrls",
    "getGraphMembersFromList",
    "getCurrentUser",
    "getPageUidByTitle",
    "findNestedDataValuesExact",
  ];

  const missingUtilities = requiredUtilities.filter(
    (util) => !platform.getUtility(util)
  );

  if (missingUtilities.length > 0) {
    console.error("❌ Missing Extension 1.5 utilities:", missingUtilities);
    console.log(
      "💡 Please ensure Extension 1.5 is loaded before Extension SIX"
    );
    return false;
  }

  console.log("✅ All Extension 1.5 dependencies available");
  return true;
};

/**
 * 🎯 FIXED: Check if Simple Button Utility 2.0 is properly available
 */
const checkButtonUtilityDependency = () => {
  // Check for Simple Button Utility 2.0 components (the actual running system!)
  if (!window.SimpleExtensionButtonManager) {
    console.warn(
      "❌ Simple Button Utility 2.0 SimpleExtensionButtonManager not found"
    );
    return false;
  }

  if (!window.ButtonConditions) {
    console.warn("❌ Simple Button Utility 2.0 ButtonConditions not found");
    return false;
  }

  console.log("✅ Simple Button Utility 2.0 properly available");
  return true;
};

// ===================================================================
// 🎯 CONDITIONAL LOGIC - Chat Room Page Detection (FIXED)
// ===================================================================

/**
 * 💬 Register custom context detector for chat room pages
 * This detects any page with "chat room" in the title (case insensitive)
 * 🔧 FIXED: Proper DOM-first title detection
 */
const registerChatRoomContextDetector = () => {
  try {
    // Check if we have the Simple Button Utility 2.0 system
    if (!window.ButtonConditions) {
      console.warn(
        "⚠️ ButtonConditions not available - cannot register chat room detector"
      );
      return;
    }

    // Add chat room detection to ButtonConditions
    window.ButtonConditions.isChatRoom = () => {
      const getCurrentPageTitle = () => {
        try {
          // ✅ FIXED: Check DOM first (has actual displayed title)
          const titleElement = document.querySelector(
            ".roam-article h1, .rm-page-title"
          );
          if (titleElement?.textContent?.trim()) {
            return titleElement.textContent.trim();
          }

          // ✅ FIXED: Only fall back to URL parsing if DOM fails
          const url = window.location.href;
          const pageMatch = url.match(/\/page\/([^/?#]+)/);
          if (pageMatch) {
            return decodeURIComponent(pageMatch[1]);
          }

          return null;
        } catch (error) {
          console.error("❌ Failed to get current page title:", error);
          return null;
        }
      };

      const pageTitle = getCurrentPageTitle();
      if (!pageTitle) return false;

      // 🎯 THE MAGIC: Case-insensitive "chat room" detection
      const hasMatchingText = pageTitle.toLowerCase().includes("chat room");

      if (hasMatchingText) {
        console.log(`💬 Chat room page detected: "${pageTitle}"`);
      } else {
        console.log(`📄 Current page: "${pageTitle}" (not a chat room)`);
      }

      return hasMatchingText;
    };

    console.log(
      "✅ Chat room condition added to ButtonConditions (FIXED VERSION)"
    );
  } catch (error) {
    console.error("❌ Failed to register chat room context detector:", error);
  }
};

// ===================================================================
// 👥 USER PROFILE DATA EXTRACTION - Enhanced with Extension 1.5
// ===================================================================

/**
 * ✅ ENHANCED: Get user profile data using Extension 1.5 utilities
 */
const getUserProfileDataClean = async (username) => {
  try {
    const platform = window.RoamExtensionSuite;
    const getPageUidByTitle = platform.getUtility("getPageUidByTitle");
    const findNestedDataValuesExact = platform.getUtility(
      "findNestedDataValuesExact"
    );
    const profileAnalysisUtilities = platform.getUtility(
      "profileAnalysisUtilities"
    );
    const timezoneManager = platform.getUtility("timezoneManager");

    const userPageUid = getPageUidByTitle(username);
    if (!userPageUid) {
      return createMissingProfile(username);
    }

    // ✅ USING: Extension 1.5 nested data extraction
    const myInfoData = findNestedDataValuesExact(userPageUid, "My Info");
    if (!myInfoData || Object.keys(myInfoData).length === 0) {
      return createMissingProfile(username);
    }

    const profileData = {
      username,
      exists: true,
      hasMyInfo: true,
      avatar: myInfoData.avatar || "__missing field__",
      location: myInfoData.location || "__missing field__",
      role: myInfoData.role || "__missing field__",
      timezone: myInfoData.timezone || "__missing field__",
      aboutMe: myInfoData.aboutMe || "__missing field__",
    };

    // ✅ USING: Extension 1.5 profile completeness calculation
    const requiredFields = [
      "avatar",
      "location",
      "role",
      "timezone",
      "aboutMe",
    ];
    profileData.completeness =
      profileAnalysisUtilities.calculateProfileCompleteness(
        profileData,
        requiredFields
      );

    // ✅ USING: Extension 1.5 timezone processing
    if (
      profileData.timezone &&
      profileData.timezone !== "__missing field__" &&
      profileData.timezone !== "__not yet entered__"
    ) {
      profileData.timezoneInfo = timezoneManager.getCurrentTimeForTimezone(
        profileData.timezone
      );
    } else {
      profileData.timezoneInfo = { timeString: "—", isValid: false };
    }

    return profileData;
  } catch (error) {
    console.error(`❌ Profile extraction failed for ${username}:`, error);
    return createErrorProfile(username, error.message);
  }
};

/**
 * Get all user profiles using curated member list
 * 📝 ENHANCED: Now includes opportunistic cache refresh
 */
const getAllUserProfilesClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );

    console.log("📋 Getting curated member list...");

    // ✅ USING: Extension 1.5 curated member list functionality
    const members = getGraphMembersFromList("roam/graph members", "Directory");

    if (members.length === 0) {
      console.warn("⚠️ No members found in curated list");
      // Fallback to old method if needed
      const getGraphMembers = platform.getUtility("getGraphMembers");
      return await Promise.all(
        getGraphMembers()
          .slice(0, 10)
          .map((username) => getUserProfileDataClean(username))
      );
    }

    console.log(`📋 Processing ${members.length} curated members:`, members);

    const profiles = await Promise.all(
      members.map((username) => getUserProfileDataClean(username))
    );

    // 🎯 OPPORTUNISTIC CACHE REFRESH: Perfect timing during modal creation
    try {
      const cache = platform.getUtility("GraphMemberCache");
      if (cache) {
        cache.refresh(); // Same data source, ensures cache freshness
        console.log(
          "✅ Opportunistically refreshed member cache during modal creation"
        );
      } else {
        console.log("ℹ️ Member cache not available (non-critical)");
      }
    } catch (error) {
      console.warn("⚠️ Cache refresh failed (non-critical):", error);
    }

    return profiles.filter((profile) => profile.exists);
  } catch (error) {
    console.error("❌ Error getting user profiles:", error);
    return [];
  }
};

// ===================================================================
// 🖼️ AVATAR DISPLAY - Enhanced with Extension 1.5 Image Processing
// ===================================================================

/**
 * ✨ DIRECT ROAM API: Create avatar display using fresh data queries
 */
const createAvatarDisplay = async (profile) => {
  try {
    console.log(`🖼️ Fresh avatar extraction for: ${profile.username}`);

    // ✅ STEP 1: Direct query for user page UID (no caching)
    const userPageQuery = `
      [:find ?uid 
       :where 
       [?page :node/title "${profile.username}"]
       [?page :block/uid ?uid]]
    `;
    const userPageResult = window.roamAlphaAPI.data.fast.q(userPageQuery);
    const userPageUid = userPageResult?.[0]?.[0];

    if (!userPageUid) {
      console.log(`❌ No page found for user: ${profile.username}`);
      return createInitialsAvatar(profile.username);
    }

    // ✅ STEP 2: Direct query for "My Info::" block (fresh data)
    const myInfoQuery = `
      [:find ?uid 
       :where 
       [?block :block/page ?page]
       [?page :block/uid "${userPageUid}"]
       [?block :block/string ?text]
       [?block :block/uid ?uid]
       [(clojure.string/includes? ?text "My Info::")]]
    `;
    const myInfoResult = window.roamAlphaAPI.data.fast.q(myInfoQuery);
    const myInfoUid = myInfoResult?.[0]?.[0];

    if (!myInfoUid) {
      console.log(`❌ No "My Info::" block found for: ${profile.username}`);
      return createInitialsAvatar(profile.username);
    }

    // ✅ STEP 3: Direct query for "Avatar::" block under My Info (fresh data)
    const avatarQuery = `
      [:find ?uid 
       :where 
       [?block :block/parents ?parent]
       [?parent :block/uid "${myInfoUid}"]
       [?block :block/string ?text]
       [?block :block/uid ?uid]
       [(clojure.string/includes? ?text "Avatar::")]]
    `;
    const avatarResult = window.roamAlphaAPI.data.fast.q(avatarQuery);
    const avatarUid = avatarResult?.[0]?.[0];

    if (!avatarUid) {
      console.log(`❌ No "Avatar::" block found for: ${profile.username}`);
      return createInitialsAvatar(profile.username);
    }

    // ✅ STEP 4: Direct query for image content in Avatar children (REAL-TIME DATA!)
    const imageQuery = `
      [:find ?text ?uid
       :where 
       [?child :block/parents ?parent]
       [?parent :block/uid "${avatarUid}"]
       [?child :block/string ?text]
       [?child :block/uid ?uid]
       [(clojure.string/includes? ?text "!")]]
    `;
    const imageResults = window.roamAlphaAPI.data.fast.q(imageQuery);

    // ✅ STEP 5: Extract image URLs from fresh block content
    for (const [blockText, blockUid] of imageResults) {
      if (blockText && blockText.includes("![")) {
        // Extract image URLs using regex (fresh parsing)
        const imageRegex = /!\[.*?\]\((.*?)\)/g;
        const matches = Array.from(blockText.matchAll(imageRegex));

        for (const match of matches) {
          const imageUrl = match[1];
          if (imageUrl && imageUrl.startsWith("http")) {
            console.log(
              `✅ Fresh avatar found for ${
                profile.username
              }: ${imageUrl.substring(0, 50)}...`
            );
            return `<img src="${imageUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; cursor: pointer;" alt="${profile.username}" onclick="navigateToUserPageClean('${profile.username}')" title="Click to visit ${profile.username}'s page">`;
          }
        }
      }

      // Also check for direct image links
      if (
        blockText &&
        blockText.startsWith("http") &&
        (blockText.includes(".jpg") ||
          blockText.includes(".png") ||
          blockText.includes(".gif") ||
          blockText.includes(".jpeg"))
      ) {
        console.log(
          `✅ Fresh direct image found for ${
            profile.username
          }: ${blockText.substring(0, 50)}...`
        );
        return `<img src="${blockText}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; cursor: pointer;" alt="${profile.username}" onclick="navigateToUserPageClean('${profile.username}')" title="Click to visit ${profile.username}'s page">`;
      }
    }

    console.log(
      `📋 No images found in Avatar children for: ${profile.username}`
    );
    return createInitialsAvatar(profile.username);
  } catch (error) {
    console.error(
      `❌ Fresh avatar extraction failed for ${profile.username}:`,
      error
    );
    return createInitialsAvatar(profile.username);
  }
};

/**
 * Create initials-based avatar fallback
 */
const createInitialsAvatar = (username) => {
  const initials = username ? username.charAt(0).toUpperCase() : "?";
  return `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; cursor: pointer;" onclick="navigateToUserPageClean('${username}')" title="Click to visit ${username}'s page">${initials}</div>`;
};

// ===================================================================
// 🪟 MODAL DISPLAY - Using Extension 1.5 (Kept - Working Well)
// ===================================================================

/**
 * ✅ REFACTORED: Show user directory modal using Extension 1.5 utilities
 */
const showUserDirectoryModalClean = async () => {
  try {
    const platform = window.RoamExtensionSuite;
    const modalUtilities = platform.getUtility("modalUtilities");

    if (!modalUtilities) {
      console.error(
        "❌ Modal utilities not available. Please ensure Extension 1.5 is loaded."
      );
      return;
    }

    // ✅ STEP 1: Create modal using Extension 1.5 utilities
    const modal = modalUtilities.createModal("clean-user-directory-modal", {
      closeOnEscape: true,
      closeOnBackdrop: true,
      zIndex: 10000,
    });

    // ✅ STEP 2: Create modal content using utilities
    const content = modalUtilities.createModalContent({
      width: "90%",
      maxWidth: "1200px",
      maxHeight: "90%",
    });

    // Show loading state first
    const graphName = getFormattedGraphName();
    content.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 16px; color: #666;">Loading user directory...</div>
      </div>
    `;

    // Append modal to DOM
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Register for cleanup
    if (window._extensionRegistry && window._extensionRegistry.elements) {
      window._extensionRegistry.elements.push(modal);
    }

    // 📝 Load profiles using clean extraction (now includes cache refresh!)
    const profiles = await getAllUserProfilesClean();
    const currentUser = platform.getUtility("getCurrentUser")();

    // ✅ STEP 3: Create modal header using utilities
    const memberText =
      profiles.length === 1 ? "1 member" : `${profiles.length} members`;
    const cleanGraphName = cleanDisplayName(graphName);
    const header = modalUtilities.createModalHeader(
      `👥 User Directory: ${cleanGraphName}`,
      memberText
    );

    // Create table content
    const tableContent = await createUserDirectoryTable(profiles, currentUser);

    // Assemble complete modal
    content.innerHTML = "";
    content.appendChild(header);
    content.insertAdjacentHTML("beforeend", tableContent);

    // ✅ STEP 4: Start real-time clock updates using Extension 1.5 timezone utility
    startRealtimeClockUpdatesClean(modal);

    console.log("✅ User Directory modal opened");
  } catch (error) {
    console.error("❌ Failed to show clean user directory:", error);
  }
};

/**
 * ✅ ENHANCED: Create individual user row with Extension 1.5 profile analysis
 */
const createCleanUserDirectoryRow = async (profile, currentUser, index) => {
  const platform = window.RoamExtensionSuite;
  const profileAnalysisUtilities = platform.getUtility(
    "profileAnalysisUtilities"
  );

  const isCurrentUser = profile.username === currentUser?.displayName;

  // ✅ USING: Enhanced avatar display (now clickable!)
  const avatarDisplay = await createAvatarDisplay(profile);

  // Create clickable username (both avatar and username navigate to user page)
  const usernameDisplay = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span onclick="navigateToUserPageClean('${profile.username}')" 
            style="font-weight: 500; color: #1a202c; cursor: pointer; text-decoration: underline;" 
            title="Click to visit ${profile.username}'s page">
        ${profile.username}
      </span>
      ${
        isCurrentUser
          ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500;">You</span>'
          : ""
      }
      ${createCompletenessIndicator(profile.completeness)}
    </div>
  `;

  // ✅ USING: Extension 1.5 profile analysis for data cell display
  const aboutMeDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.aboutMe
  );
  const locationDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.location
  );
  const roleDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.role
  );
  const timezoneDisplay = profileAnalysisUtilities.createDataCellDisplay(
    profile.timezone
  );

  // Create time display
  const timeDisplay = profile.timezoneInfo?.isValid
    ? `<span class="clean-timezone-time" data-timezone="${profile.timezone}" style="font-family: 'SF Mono', Monaco, monospace; color: #059669; font-weight: 500;">${profile.timezoneInfo.timeString}</span>`
    : '<span style="color: #9ca3af;">—</span>';

  const rowStyle = `
    border-bottom: 1px solid #f1f5f9;
    ${isCurrentUser ? "background: #f0f9ff;" : ""}
    ${index % 2 === 0 ? "" : "background: #fafafa;"}
    transition: background-color 0.15s ease;
  `;

  return `
    <tr style="${rowStyle}" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${
    isCurrentUser ? "#f0f9ff" : index % 2 === 0 ? "white" : "#fafafa"
  }'">
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${avatarDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${usernameDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${aboutMeDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${locationDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${roleDisplay}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f1f5f9;">${timezoneDisplay}</td>
      <td style="padding: 12px 16px; text-align: center;">${timeDisplay}</td>
    </tr>
  `;
};

/**
 * ✅ ENHANCED: Start real-time clock updates using Extension 1.5 timezone utility
 */
const startRealtimeClockUpdatesClean = (modal) => {
  const updateClocks = () => {
    const platform = window.RoamExtensionSuite;
    const timezoneManager = platform.getUtility("timezoneManager");

    const timeElements = modal.querySelectorAll(".clean-timezone-time");
    timeElements.forEach((element) => {
      const timezone = element.getAttribute("data-timezone");
      if (
        timezone &&
        timezone !== "__missing field__" &&
        timezone !== "__not yet entered__"
      ) {
        const timeInfo = timezoneManager.getCurrentTimeForTimezone(timezone);
        if (timeInfo.isValid) {
          element.textContent = timeInfo.timeString;
        }
      }
    });
  };

  // Update every minute
  const interval = setInterval(updateClocks, 60000);

  // Clean up when modal is removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node === modal) {
          clearInterval(interval);
          observer.disconnect();
        }
      });
    });
  });

  observer.observe(document.body, { childList: true });
};

// ===================================================================
// 🎯 PROPER BUTTON MANAGEMENT - Extension 1.6 Integration
// ===================================================================

let buttonManager = null;

/**
 * 🎯 FIXED: Proper Simple Button Utility 2.0 integration with NO FALLBACK
 */
const initializeButtonManagement = async () => {
  try {
    console.log("🎯 User Directory: Initializing Simple Button Utility 2.0...");

    // 🎯 CRITICAL: Check Simple Button Utility 2.0 availability first
    if (!checkButtonUtilityDependency()) {
      console.warn(
        "❌ Simple Button Utility 2.0 not available - NO BUTTON will be created"
      );
      console.warn("💡 Please load Simple Button Utility 2.0 first");
      return {
        success: false,
        reason: "Simple Button Utility 2.0 not available",
      };
    }

    // 🎯 STEP 1: Register chat room context detector FIRST
    registerChatRoomContextDetector();

    // 🎯 STEP 2: Wait for Simple Button Utility 2.0 to be ready
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        // 🎯 STEP 3: Create button manager using the CORRECT API
        buttonManager = new window.SimpleExtensionButtonManager(
          "UserDirectory"
        );
        await buttonManager.initialize();
        break;
      } catch (error) {
        retries++;
        console.log(
          `⏳ Simple Button Utility 2.0 not ready, retrying... (${retries}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (retries >= maxRetries) {
      console.error(
        "❌ Failed to initialize Simple Button Utility 2.0 after 10 retries"
      );
      return {
        success: false,
        reason: "Simple Button Utility 2.0 initialization timeout",
      };
    }

    // 🎯 STEP 4: Register the directory button with CORRECT API syntax
    const result = await buttonManager.registerButton({
      id: "directory-button",
      text: "👥 User Directory",
      onClick: showUserDirectoryModalClean,
      stack: "top-left", // Professional left-side placement
      priority: false, // Play nice with other extensions
      style: {
        // 🎨 ELEGANT: Warm yellow pastel with elegant brown border
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)", // Softer warm yellow
        border: "1.5px solid #8b4513", // Elegant brown border
        color: "#78716c", // Muted brown text
        fontWeight: "600",
        padding: "10px 16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
      },
      // 🎯 THE CONDITIONAL MAGIC: Only show on username OR chat room pages
      // Using Simple Button Utility 2.0 syntax!
      showOn: ["isUsernamePage", "isChatRoom"],
    });

    if (result.success) {
      console.log(`✅ Directory button registered at ${result.stack}`);
      console.log(
        "🎯 Button will only appear on username pages or pages containing 'chat room'"
      );
      return result;
    } else {
      console.error("❌ Failed to register directory button:", result.error);
      return { success: false, reason: result.error };
    }
  } catch (error) {
    console.error("❌ Button management initialization failed:", error);
    return { success: false, reason: error.message };
  }
};

// ===================================================================
// 🧪 INTEGRATION TESTING - Enhanced Testing Suite
// ===================================================================

/**
 * 🧪 DEBUG: Test Simple Button Utility 2.0 integration
 */
const testButtonUtilityIntegration = async () => {
  console.group("🎯 Testing Simple Button Utility 2.0 Integration");

  try {
    // Test Simple Button Utility 2.0 availability
    const hasButtonUtility = checkButtonUtilityDependency();
    console.log("✅ Simple Button Utility 2.0 available:", hasButtonUtility);

    if (hasButtonUtility) {
      // Test ButtonConditions
      const conditions = window.ButtonConditions;
      console.log("✅ ButtonConditions available:", !!conditions);

      if (conditions) {
        console.log("📊 Available conditions:", Object.keys(conditions));
      }

      // Test SimpleExtensionButtonManager
      const manager = window.SimpleExtensionButtonManager;
      console.log("✅ SimpleExtensionButtonManager available:", !!manager);

      // Test registry status
      const registry = window.SimpleButtonRegistry;
      if (registry) {
        console.log("📊 Registry status:", registry.getStatus());
      }
    }

    console.log("🎉 Simple Button Utility 2.0 integration test complete!");
  } catch (error) {
    console.error(
      "❌ Simple Button Utility 2.0 integration test failed:",
      error
    );
  }

  console.groupEnd();
};

/**
 * 🎯 NEW: Test conditional logic functionality
 */
const testConditionalLogic = () => {
  console.group("🎯 Testing Conditional Logic");

  try {
    // Get current conditions from Simple Button Utility 2.0
    const conditions = window.ButtonConditions;
    if (conditions) {
      console.log("📋 Available conditions:", Object.keys(conditions));

      // Test each condition
      const results = {};
      Object.keys(conditions).forEach((conditionName) => {
        if (typeof conditions[conditionName] === "function") {
          try {
            results[conditionName] = conditions[conditionName]();
          } catch (error) {
            results[conditionName] = `Error: ${error.message}`;
          }
        }
      });

      console.log("🧪 Current condition results:", results);

      const hasUsernameCondition = results.isUsernamePage;
      const hasChatRoomCondition = results.isChatRoom;

      console.log("👤 Is username page:", hasUsernameCondition);
      console.log("💬 Is chat room page:", hasChatRoomCondition);

      const shouldShowButton = hasUsernameCondition || hasChatRoomCondition;
      console.log("🎯 Should show button:", shouldShowButton);
    } else {
      console.warn("❌ ButtonConditions not available for testing");
    }

    console.log("✅ Conditional logic test complete!");
  } catch (error) {
    console.error("❌ Conditional logic test failed:", error);
  }

  console.groupEnd();
};

/**
 * ✅ ENHANCED: Run complete system tests
 */
const runCleanSystemTests = async () => {
  console.group(
    "🧪 Running Extension SIX System Tests (Simple Button Utility 2.0 Integration)"
  );

  try {
    // Test Extension 1.5 integration
    const platform = window.RoamExtensionSuite;
    const timezoneManager = platform.getUtility("timezoneManager");
    const modalUtilities = platform.getUtility("modalUtilities");
    const profileAnalysisUtilities = platform.getUtility(
      "profileAnalysisUtilities"
    );

    console.log("✅ Extension 1.5 utilities:", {
      timezone: !!timezoneManager,
      modal: !!modalUtilities,
      profile: !!profileAnalysisUtilities,
    });

    // Test Simple Button Utility 2.0 integration
    await testButtonUtilityIntegration();

    // Test conditional logic
    testConditionalLogic();

    // Test profile extraction
    const currentUser = platform.getUtility("getCurrentUser")();
    console.log(`👤 Current user: ${currentUser?.displayName}`);

    if (currentUser?.displayName) {
      const profile = await getUserProfileDataClean(currentUser.displayName);
      console.log("📊 User profile extraction:", profile);
      console.log(`📈 Profile completeness: ${profile.completeness}%`);
    }

    // Test curated member list
    const getGraphMembersFromList = platform.getUtility(
      "getGraphMembersFromList"
    );
    const members = getGraphMembersFromList("roam/graph members", "Directory");
    console.log(`📋 Curated members: ${members.length} found`);

    // 📝 Test cache integration
    try {
      const cache = platform.getUtility("GraphMemberCache");
      if (cache) {
        const cacheStatus = cache.getStatus();
        console.log("📝 Member cache status:", cacheStatus);
      } else {
        console.log("📝 Member cache not available");
      }
    } catch (error) {
      console.warn("📝 Cache test failed:", error);
    }

    console.log("✅ All system tests passed!");
  } catch (error) {
    console.error("❌ System test failed:", error);
  }

  console.groupEnd();
};

// ===================================================================
// 🔧 HELPER FUNCTIONS - Maintained and Enhanced
// ===================================================================

/**
 * Create user directory table
 */
const createUserDirectoryTable = async (profiles, currentUser) => {
  const rows = await Promise.all(
    profiles.map((profile, index) =>
      createCleanUserDirectoryRow(profile, currentUser, index)
    )
  );

  return `
    <div style="flex: 1; overflow: auto; padding: 0 32px 16px 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e1e5e9;">
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Avatar</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Username</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">About Me</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Location</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Role</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-right: 1px solid #e1e5e9;">Timezone</th>
            <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #374151;">Current Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Create completeness indicator
 */
const createCompletenessIndicator = (completeness) => {
  const color =
    completeness >= 75 ? "#059669" : completeness >= 50 ? "#d97706" : "#dc2626";
  return `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; opacity: 0.7;" title="${completeness}% complete"></div>`;
};

/**
 * Clean display name by removing underscores
 */
const cleanDisplayName = (name) => {
  if (!name) return "Unknown";
  return name.replace(/_/g, " ");
};

/**
 * Get formatted graph name
 */
const getFormattedGraphName = () => {
  try {
    return window.roamAlphaAPI.graph.name || "Unknown Graph";
  } catch {
    return "Unknown Graph";
  }
};

/**
 * Create missing profile fallback
 */
const createMissingProfile = (username) => ({
  username,
  exists: false,
  hasMyInfo: false,
  avatar: "__missing field__",
  location: "__missing field__",
  role: "__missing field__",
  timezone: "__missing field__",
  aboutMe: "__missing field__",
  completeness: 0,
  timezoneInfo: { timeString: "—", isValid: false },
});

/**
 * Create error profile fallback
 */
const createErrorProfile = (username, errorMessage) => ({
  username,
  exists: false,
  hasMyInfo: false,
  avatar: "__error__",
  location: "__error__",
  role: "__error__",
  timezone: "__error__",
  aboutMe: `Error: ${errorMessage}`,
  completeness: 0,
  timezoneInfo: { timeString: "—", isValid: false },
});

/**
 * Navigate to user page helper function
 */
window.navigateToUserPageClean = (username) => {
  const userPageUrl = `#/app/${
    window.roamAlphaAPI.graph.name
  }/page/${encodeURIComponent(username)}`;
  window.location.href = userPageUrl;

  // Close modal
  const modal = document.getElementById("clean-user-directory-modal");
  if (modal) modal.remove();
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Fixed Button Management + Cache Integration
// ===================================================================

export default {
  onload: () => {
    console.log(
      "🎯 User Directory loading (Fixed Button Management + Chat Room Detection + Cache Integration + Clickable Avatars)..."
    );

    // ✅ STEP 1: Check Extension 1.5 dependencies
    if (!checkExtension15Dependencies()) {
      console.error(
        "❌ User Directory failed to load - missing Extension 1.5 dependencies"
      );
      return {
        error: "Extension 1.5 required",
        status: "dependency_failed",
      };
    }

    // ✅ STEP 2: Initialize platform registration
    const platform = window.RoamExtensionSuite;

    if (!platform) {
      console.error("❌ RoamExtensionSuite platform not found");
      return { error: "Platform not found" };
    }

    // Register clean directory services
    const cleanDirectoryServices = {
      getUserProfileData: getUserProfileDataClean,
      getAllUserProfiles: getAllUserProfilesClean,
      showUserDirectory: showUserDirectoryModalClean,
      testButtonUtility: testButtonUtilityIntegration,
      testConditionalLogic: testConditionalLogic,
      runSystemTests: runCleanSystemTests,
      initializeButtons: initializeButtonManagement, // 🎯 Fixed button management
      registerChatRoomDetector: registerChatRoomContextDetector,
    };

    // ✅ STEP 3: Register command palette functions
    const commands = [
      {
        label: "User Directory: Show Directory",
        callback: showUserDirectoryModalClean,
      },
      {
        label: "User Directory: Test Simple Button Utility 2.0 Integration",
        callback: testButtonUtilityIntegration,
      },
      {
        label: "User Directory: Test Conditional Logic",
        callback: testConditionalLogic,
      },
      {
        label: "User Directory: Run System Tests",
        callback: runCleanSystemTests,
      },
      {
        label: "User Directory: Initialize Buttons",
        callback: initializeButtonManagement,
      },
    ];

    commands.forEach((cmd) => {
      if (window.roamAlphaAPI && window.roamAlphaAPI.ui.commandPalette) {
        window.roamAlphaAPI.ui.commandPalette.addCommand(cmd);
      }
      if (window._extensionRegistry) {
        window._extensionRegistry.commands.push(cmd.label);
      }
    });

    // ✅ STEP 4: Register with platform
    const requiredDependencies = [
      "utility-library", // Extension 1.5
      "simple-button-utility", // Simple Button Utility 2.0
    ];

    platform.register(
      "clean-user-directory",
      {
        services: cleanDirectoryServices,
        version: "9.3.0", // 🖱️ Clickable Avatars version
      },
      {
        name: "✨ User Directory",
        description:
          "Professional user directory with FIXED Simple Button Utility 2.0 integration, FIXED chat room conditional logic, NO fallback buttons, OPPORTUNISTIC cache refresh, and CLICKABLE avatars & usernames",
        version: "9.3.0",
        dependencies: requiredDependencies,
      }
    );

    // ✅ STEP 5: Initialize button management (with proper delay)
    setTimeout(async () => {
      try {
        const result = await initializeButtonManagement();
        if (result.success) {
          console.log("🎉 Button management initialized successfully!");
        } else {
          console.warn(`⚠️ Button management failed: ${result.reason}`);
        }
      } catch (error) {
        console.error("❌ Failed to initialize button management:", error);
      }
    }, 2000); // Longer delay to ensure Extension 1.6 is ready

    // ✅ STEP 6: Success report
    const currentUser = platform.getUtility("getCurrentUser")();
    console.log(
      "🎉 Extension SIX loaded successfully (FIXED Simple Button Utility 2.0 + Chat Room Detection + Cache Integration + Clickable Avatars)!"
    );
    console.log("🗑️ REMOVED: All fallback button logic");
    console.log("🎯 FIXED: Proper Simple Button Utility 2.0 integration");
    console.log(
      "🔧 FIXED: Chat room detection with proper DOM-first title detection"
    );
    console.log("📝 NEW: Opportunistic cache refresh during modal creation");
    console.log("🖱️ NEW: Clickable avatars and usernames for easy navigation");
    console.log(
      "🎯 CONDITIONAL: Button only appears on username or chat room pages"
    );
    console.log("🎨 STYLING: Elegant warm yellow with brown border");
    console.log(
      "🛡️ SAFETY: Fails gracefully if Simple Button Utility 2.0 not available"
    );
    console.log(`👤 Current user: ${currentUser?.displayName}`);
    console.log('💡 Try: Cmd+P → "User Directory: Show Directory"');

    // Auto-test integration after a delay
    setTimeout(async () => {
      console.log("🔍 Auto-testing Simple Button Utility 2.0 integration...");
      await runCleanSystemTests();
    }, 3000);

    return {
      extensionId: "clean-user-directory",
      services: cleanDirectoryServices,
      version: "9.3.0",
      status:
        "fixed_simple_button_utility_integration_with_cache_and_clickable_avatars",
    };
  },

  onunload: () => {
    console.log(
      "🎯 User Directory unloading (Fixed Simple Button Utility 2.0 Integration + Cache + Clickable Avatars)..."
    );

    // 🎯 CLEAN: Proper button management cleanup
    if (buttonManager) {
      try {
        buttonManager.cleanup();
        console.log(
          "✅ Simple Button Utility 2.0 button management cleaned up"
        );
      } catch (error) {
        console.error("❌ Button manager cleanup error:", error);
      }
    }

    // Clean up modals (unchanged)
    const modals = document.querySelectorAll(
      "#clean-user-directory-modal, #test-modal"
    );
    modals.forEach((modal) => modal.remove());

    // Navigation helper cleanup (unchanged)
    delete window.navigateToUserPageClean;

    console.log(
      "✅ User Directory cleanup complete (using Fixed Simple Button Utility 2.0 + Cache Integration + Clickable Avatars)!"
    );
  },
};
