// ===================================================================
// Extension 1.5: Enhanced Utility Library - Phase 1 Implementation
// ROADMAP: Moved utilities from Extension SIX + new capabilities
// New: Timezone, Modal, Navigation, Profile Analysis, Enhanced Image Processing
// ===================================================================

// ===================================================================
// 🌍 TIMEZONE INTELLIGENCE UTILITIES - Moved from Extension SIX
// ===================================================================

/**
 * 🌍 TIMEZONE MANAGEMENT - Complete system from Extension SIX
 */
class TimezoneManager {
  constructor() {
    // Common timezone abbreviations to IANA mapping
    this.timezoneMap = {
      EST: "America/New_York",
      EDT: "America/New_York",
      CST: "America/Chicago",
      CDT: "America/Chicago",
      MST: "America/Denver",
      MDT: "America/Denver",
      PST: "America/Los_Angeles",
      PDT: "America/Los_Angeles",
      GMT: "Europe/London",
      BST: "Europe/London",
      CET: "Europe/Paris",
      CEST: "Europe/Paris",
      JST: "Asia/Tokyo",
      AEST: "Australia/Sydney",
      AEDT: "Australia/Sydney",
      IST: "Asia/Kolkata",
      SGT: "Asia/Singapore",
    };
  }

  /**
   * Parse timezone string to IANA identifier
   */
  parseTimezone(timezoneString) {
    if (!timezoneString) return null;

    const cleaned = timezoneString.trim();

    // Check if it's already an IANA identifier
    if (cleaned.includes("/")) {
      return this.validateTimezone(cleaned) ? cleaned : null;
    }

    // Check abbreviation mapping
    const upperCased = cleaned.toUpperCase();
    if (this.timezoneMap[upperCased]) {
      return this.timezoneMap[upperCased];
    }

    // Handle UTC offsets like "GMT+1", "UTC-5"
    const offsetMatch = cleaned.match(/^(GMT|UTC)([+-]\d{1,2})$/i);
    if (offsetMatch) {
      const offset = parseInt(offsetMatch[2]);
      const offsetMap = {
        "-8": "America/Los_Angeles",
        "-7": "America/Denver",
        "-6": "America/Chicago",
        "-5": "America/New_York",
        0: "UTC",
        1: "Europe/Paris",
        8: "Asia/Singapore",
        9: "Asia/Tokyo",
      };
      return offsetMap[offset.toString()] || null;
    }

    return null;
  }

  /**
   * Validate if timezone is supported
   */
  validateTimezone(timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current time in user's timezone
   */
  getCurrentTimeForTimezone(timezoneString) {
    const timezone = this.parseTimezone(timezoneString);
    if (!timezone) {
      return {
        timeString: "—",
        isValid: false,
        error: "Invalid timezone",
      };
    }

    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return {
        timeString: formatter.format(now),
        timezone: timezoneString,
        ianaTimezone: timezone,
        isValid: true,
      };
    } catch (error) {
      return {
        timeString: "—",
        timezone: timezoneString,
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get common timezones for dropdown
   */
  getCommonTimezones() {
    return [
      { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
      { value: "America/Chicago", label: "Central Time (CST/CDT)" },
      { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Central European Time" },
      { value: "Asia/Tokyo", label: "Japan Standard Time" },
      { value: "Asia/Shanghai", label: "China Standard Time" },
      { value: "Asia/Kolkata", label: "India Standard Time" },
      { value: "Australia/Sydney", label: "Australian Eastern Time" },
    ];
  }
}

// Global timezone manager instance
const timezoneManagerInstance = new TimezoneManager();

// Timezone utilities for UTILITIES object
const timezoneManager = {
  parseTimezone: (timezoneString) =>
    timezoneManagerInstance.parseTimezone(timezoneString),
  validateTimezone: (timezone) =>
    timezoneManagerInstance.validateTimezone(timezone),
  getCurrentTimeForTimezone: (timezoneString) =>
    timezoneManagerInstance.getCurrentTimeForTimezone(timezoneString),
  getCommonTimezones: () => timezoneManagerInstance.getCommonTimezones(),
};

// ===================================================================
// 🪟 MODAL CREATION UTILITIES - Extracted from Extension SIX
// ===================================================================

const modalUtilities = {
  /**
   * Create professional modal with auto-cleanup and event handlers
   */
  createModal: (id, config = {}) => {
    const {
      closeOnEscape = true,
      closeOnBackdrop = true,
      zIndex = 10000,
    } = config;

    // Remove existing modal
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    // Create modal container
    const modal = document.createElement("div");
    modal.id = id;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: ${zIndex};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Close handlers
    if (closeOnBackdrop) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    if (closeOnEscape) {
      const escapeHandler = (e) => {
        if (e.key === "Escape") {
          modal.remove();
          document.removeEventListener("keydown", escapeHandler);
        }
      };
      document.addEventListener("keydown", escapeHandler);
    }

    // Register for cleanup
    if (window._extensionRegistry) {
      window._extensionRegistry.elements.push(modal);
    }

    return modal;
  },

  /**
   * Create modal content container
   */
  createModalContent: (config = {}) => {
    const {
      width = "90%",
      maxWidth = "1200px",
      maxHeight = "90%",
      background = "white",
      borderRadius = "8px",
    } = config;

    const content = document.createElement("div");
    content.style.cssText = `
      background: ${background};
      border-radius: ${borderRadius};
      width: ${width};
      max-width: ${maxWidth};
      max-height: ${maxHeight};
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
    `;

    return content;
  },

  /**
   * Create modal header with title and close button
   */
  createModalHeader: (title, subtitle = "") => {
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 24px 32px 20px;
      border-bottom: 1px solid #e1e5e9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const titleSection = document.createElement("div");
    titleSection.innerHTML = `
      <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a202c;">
        ${title}
      </h2>
      ${
        subtitle
          ? `<div style="margin-top: 4px; font-size: 14px; color: #666;">${subtitle}</div>`
          : ""
      }
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.style.cssText = `
      background: none;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
    `;

    closeButton.addEventListener("click", () => {
      const modal = closeButton.closest('[id$="-modal"]');
      if (modal) modal.remove();
    });

    header.appendChild(titleSection);
    header.appendChild(closeButton);

    return header;
  },

  /**
   * Close modal by ID with cleanup
   */
  closeModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  },
};

// ===================================================================
// 🧭 NAVIGATION UTILITIES - Extracted from Extension SIX
// ===================================================================

const navigationUtilities = {
  /**
   * Find best placement target using multiple selectors
   */
  findBestPlacementTarget: (selectors) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return { element, selector };
      }
    }
    return { element: document.body, selector: "body (fallback)" };
  },

  /**
   * Create positioned navigation button with auto-cleanup
   */
  createNavButton: (config) => {
    const {
      text,
      position = "top-left",
      onClick,
      className = "",
      gradient = "linear-gradient(135deg, #c7f3ff 0%, #22d3ee 100%)",
      borderColor = "#06b6d4",
      textColor = "#0e7490",
    } = config;

    const button = document.createElement("button");
    if (className) button.className = className;
    button.textContent = text;

    // Position styles
    const positions = {
      "top-left": "top: 10px; left: 10px;",
      "top-right": "top: 10px; right: 10px;",
      "bottom-left": "bottom: 10px; left: 10px;",
      "bottom-right": "bottom: 10px; right: 10px;",
    };

    button.style.cssText = `
      position: absolute;
      ${positions[position] || positions["top-left"]}
      z-index: 9999;
      background: ${gradient};
      color: ${textColor};
      border: 1px solid ${borderColor};
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(34, 211, 238, 0.2);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Add click handler
    if (onClick) {
      button.addEventListener("click", onClick);
    }

    // Add hover effects
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-1px)";
      button.style.filter = "brightness(1.1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.filter = "brightness(1)";
    });

    return button;
  },

  /**
   * Monitor page changes and re-run callback
   */
  monitorPageChanges: (callback, delay = 500) => {
    let lastUrl = window.location.href;

    const checkUrlChange = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(callback, delay);
      }
      setTimeout(checkUrlChange, 1000);
    };

    checkUrlChange();
  },

  /**
   * Remove all navigation buttons by class
   */
  removeNavButtons: (className) => {
    document.querySelectorAll(`.${className}`).forEach((btn) => btn.remove());
  },
};

// ===================================================================
// 📊 PROFILE ANALYSIS UTILITIES - Extracted from Extension SIX
// ===================================================================

const profileAnalysisUtilities = {
  /**
   * Calculate profile completeness percentage
   */
  calculateProfileCompleteness: (profileData, requiredFields) => {
    const realDataFields = requiredFields.filter((field) => {
      const value = profileData[field];
      return (
        value &&
        value !== "__missing field__" &&
        value !== "__not yet entered__"
      );
    });

    return Math.round((realDataFields.length / requiredFields.length) * 100);
  },

  /**
   * Categorize data value quality
   */
  categorizeDataValue: (value) => {
    if (value === "__missing field__") {
      return {
        type: "missing",
        displayClass: "missing-field",
        style:
          "color: #dc2626; font-style: italic; background: #fef2f2; padding: 2px 6px; border-radius: 3px;",
      };
    } else if (value === "__not yet entered__") {
      return {
        type: "placeholder",
        displayClass: "not-entered",
        style:
          "color: #d97706; font-style: italic; background: #fffbeb; padding: 2px 6px; border-radius: 3px;",
      };
    } else if (value) {
      return {
        type: "real",
        displayClass: "real-data",
        style: "color: #374151;",
      };
    } else {
      return {
        type: "empty",
        displayClass: "empty-data",
        style: "color: #9ca3af;",
      };
    }
  },

  /**
   * Generate profile quality report for multiple users
   */
  generateProfileQualityReport: (profiles) => {
    const report = {
      totalUsers: profiles.length,
      completenessStats: {
        high: 0, // 75%+
        medium: 0, // 50-74%
        low: 0, // <50%
      },
      fieldStats: {},
      averageCompleteness: 0,
    };

    let totalCompleteness = 0;

    profiles.forEach((profile) => {
      // Completeness categorization
      if (profile.completeness >= 75) {
        report.completenessStats.high++;
      } else if (profile.completeness >= 50) {
        report.completenessStats.medium++;
      } else {
        report.completenessStats.low++;
      }

      totalCompleteness += profile.completeness;

      // Field statistics
      const fields = ["avatar", "location", "role", "timezone", "aboutMe"];
      fields.forEach((field) => {
        if (!report.fieldStats[field]) {
          report.fieldStats[field] = { filled: 0, missing: 0 };
        }

        const value = profile[field];
        if (
          value &&
          value !== "__missing field__" &&
          value !== "__not yet entered__"
        ) {
          report.fieldStats[field].filled++;
        } else {
          report.fieldStats[field].missing++;
        }
      });
    });

    report.averageCompleteness = Math.round(
      totalCompleteness / profiles.length
    );

    return report;
  },

  /**
   * Create data display cell with appropriate styling
   */
  createDataCellDisplay: (value, options = {}) => {
    const category = profileAnalysisUtilities.categorizeDataValue(value);

    let displayValue = value;
    if (category.type === "missing") displayValue = "missing field";
    if (category.type === "placeholder") displayValue = "not yet entered";
    if (category.type === "empty") displayValue = "—";

    return `<span class="${category.displayClass}" style="${category.style}">${displayValue}</span>`;
  },
};

// ===================================================================
// 🖼️ ENHANCED IMAGE PROCESSING - Extended from existing
// ===================================================================

/**
 * Enhanced image extraction with validation
 */
const extractImageUrls = (blockUid, options = {}) => {
  const { validateUrls = false, includeEmbeds = true } = options;

  if (!blockUid) {
    console.warn("extractImageUrls requires blockUid");
    return [];
  }

  try {
    const block = window.roamAlphaAPI.pull("[:block/string :block/children]", [
      ":block/uid",
      blockUid,
    ]);

    if (!block || !block[":block/string"]) {
      return [];
    }

    const blockString = block[":block/string"];
    const imageUrls = [];

    // Extract markdown images: ![alt](url)
    const markdownMatches = blockString.match(/!\[.*?\]\((.*?)\)/g);
    if (markdownMatches) {
      markdownMatches.forEach((match) => {
        const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
        if (urlMatch && urlMatch[1]) {
          imageUrls.push(urlMatch[1]);
        }
      });
    }

    // Extract direct URLs (if includeEmbeds)
    if (includeEmbeds) {
      const urlPattern =
        /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi;
      const urlMatches = blockString.match(urlPattern);
      if (urlMatches) {
        imageUrls.push(...urlMatches);
      }
    }

    // Remove duplicates
    const uniqueUrls = [...new Set(imageUrls)];

    // Validate URLs if requested
    if (validateUrls) {
      return uniqueUrls.filter((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    }

    return uniqueUrls;
  } catch (error) {
    console.error(`extractImageUrls error for ${blockUid}:`, error);
    return [];
  }
};

/**
 * Process avatar images with fallback generation
 */
const processAvatarImages = async (blockUid, fallbackInitials) => {
  const imageUrls = extractImageUrls(blockUid, { validateUrls: true });

  if (imageUrls.length > 0) {
    // Try to use first image, with loading verification
    const imageUrl = imageUrls[0];

    try {
      // Test if image loads
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      return `<img src="${imageUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${fallbackInitials}">`;
    } catch {
      // Image failed to load, use fallback
    }
  }

  // Generate initials fallback
  const initials = fallbackInitials
    ? fallbackInitials.charAt(0).toUpperCase()
    : "?";
  return `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${initials}</div>`;
};

// ===================================================================
// 👥 ENHANCED GRAPH MEMBER MANAGEMENT
// ===================================================================

/**
 * Get graph members from managed list
 */
const getGraphMembersFromList = (listPageTitle = "Graph Members") => {
  try {
    const pageUid = getPageUidByTitle(listPageTitle);
    if (!pageUid) {
      console.warn(`No managed list found: ${listPageTitle}`);
      return [];
    }

    // Look for Directory:: block
    const directoryUid = findDataValueExact(pageUid, "Directory");
    if (!directoryUid) {
      console.warn(`No Directory:: block found in ${listPageTitle}`);
      return [];
    }

    return getBlockListItems(directoryUid);
  } catch (error) {
    console.error("Error getting graph members from list:", error);
    return [];
  }
};

/**
 * Add member to managed list
 */
const addGraphMember = async (username, listPageTitle = "Graph Members") => {
  try {
    const pageUid = await createPageIfNotExists(listPageTitle);
    if (!pageUid) return false;

    const directoryUid = await ensureBlockExists(pageUid, "Directory::");
    if (!directoryUid) return false;

    return await addToBlockList(directoryUid, username);
  } catch (error) {
    console.error("Error adding graph member:", error);
    return false;
  }
};

/**
 * Remove member from managed list
 */
const removeGraphMember = async (username, listPageTitle = "Graph Members") => {
  try {
    const pageUid = getPageUidByTitle(listPageTitle);
    if (!pageUid) return false;

    const directoryUid = findDataValueExact(pageUid, "Directory");
    if (!directoryUid) return false;

    return await removeFromBlockList(directoryUid, username);
  } catch (error) {
    console.error("Error removing graph member:", error);
    return false;
  }
};

// ===================================================================
// 🧪 EXISTING FUNCTIONS - Maintained from previous version
// ===================================================================

/**
 * ✅ CASCADE TO BLOCK - Create hierarchical structure
 */
const cascadeToBlock = async (
  pageTitle,
  contentArray,
  createMissing = true
) => {
  try {
    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      console.warn("cascadeToBlock: contentArray must be non-empty array");
      return null;
    }

    let pageUid;
    if (createMissing) {
      pageUid = await createPageIfNotExists(pageTitle);
    } else {
      pageUid = getPageUidByTitle(pageTitle);
    }

    if (!pageUid) {
      console.log(`❌ Page not found: ${pageTitle}`);
      return null;
    }

    let currentParentUid = pageUid;

    for (let i = 0; i < contentArray.length; i++) {
      const content = contentArray[i];
      const childrenBlocks = getDirectChildren(currentParentUid);
      let existingBlock = childrenBlocks.find(
        (block) => block.text === content
      );

      if (!existingBlock) {
        const newBlockUid = generateUID();
        console.log(`➕ Creating block: "${content}"`);

        await window.roamAlphaAPI.data.block.create({
          location: {
            "parent-uid": currentParentUid,
            order: childrenBlocks.length,
          },
          block: {
            uid: newBlockUid,
            string: content,
          },
        });

        currentParentUid = newBlockUid;
      } else {
        console.log(`✅ Found existing block: "${content}"`);
        currentParentUid = existingBlock.uid;
      }
    }

    console.log(`🎯 Final cascade UID: ${currentParentUid}`);
    return currentParentUid;
  } catch (error) {
    console.error(`❌ cascadeToBlock failed for "${pageTitle}":`, error);
    throw error;
  }
};

/**
 * Get page UID by title
 */
const getPageUidByTitle = (title) => {
  if (!title) return null;

  try {
    const result = window.roamAlphaAPI.q(
      `[:find ?uid :where [?p :node/title "${title}"] [?p :block/uid ?uid]]`
    );
    return result.length > 0 ? result[0][0] : null;
  } catch (error) {
    console.error(`getPageUidByTitle error for "${title}":`, error);
    return null;
  }
};

/**
 * Create page if it doesn't exist
 */
const createPageIfNotExists = async (title) => {
  if (!title) {
    console.warn("createPageIfNotExists: title is required");
    return null;
  }

  let pageUid = getPageUidByTitle(title);

  if (!pageUid) {
    try {
      pageUid = generateUID();
      console.log(`📄 Creating page: "${title}"`);

      await window.roamAlphaAPI.data.page.create({
        page: {
          title: title,
          uid: pageUid,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to create page "${title}":`, error);
      return null;
    }
  }

  return pageUid;
};

/**
 * Generate unique identifier
 */
const generateUID = () => {
  return window.roamAlphaAPI.util.generateUID();
};

/**
 * Get current page title from URL
 */
const getCurrentPageTitle = () => {
  try {
    // Extract from URL pattern: #/app/graphname/page/PageTitle
    const url = window.location.href;
    const match = url.match(/#\/app\/[^\/]+\/page\/(.+)$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    // Fallback: try to get from DOM
    const titleElement = document.querySelector(".rm-title-display");
    if (titleElement) {
      return titleElement.textContent || "";
    }

    return "";
  } catch (error) {
    console.error("getCurrentPageTitle failed:", error);
    return "";
  }
};

/**
 * Get current page UID
 */
const getCurrentPageUid = () => {
  try {
    const currentTitle = getCurrentPageTitle();
    if (currentTitle) {
      return getPageUidByTitle(currentTitle);
    }

    // Fallback to daily note if no specific page
    const today = new Date();
    const dateString = today
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    return getPageUidByTitle(dateString);
  } catch (error) {
    console.error("getCurrentPageUid failed:", error);
    return null;
  }
};

/**
 * Get page titles starting with prefix
 */
const getPageTitlesStartingWithPrefix = (prefix) => {
  if (!prefix) return [];

  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?title :where [?b :node/title ?title] 
       [(clojure.string/starts-with? ?title "${prefix}")]]
    `);

    return result.map(([title]) => title);
  } catch (error) {
    console.error("getPageTitlesStartingWithPrefix failed:", error);
    return [];
  }
};

/**
 * Get page UID by page title (alternative method)
 */
const getPageUidByPageTitle = (title) => {
  return getPageUidByTitle(title); // Use existing implementation
};

/**
 * Set nested data values in structured format
 */
const setNestedDataValuesStructured = async (
  pageUid,
  parentFieldName,
  dataObject,
  useAttribute = false
) => {
  try {
    const parentText = useAttribute ? `${parentFieldName}::` : parentFieldName;
    const parentUid = await ensureBlockExists(pageUid, parentText);

    if (!parentUid) return false;

    for (const [fieldName, value] of Object.entries(dataObject)) {
      const fieldText = useAttribute ? `${fieldName}::` : fieldName;
      const success = await setDataValueStructured(
        parentUid,
        fieldText,
        value,
        useAttribute
      );
      if (!success) {
        console.warn(`Failed to set ${fieldName} = ${value}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`setNestedDataValuesStructured error:`, error);
    return false;
  }
};

/**
 * Normalize header text for consistent matching
 */
const normalizeHeaderText = (text) => {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
};

/**
 * Normalize category name for consistent processing
 */
const normalizeCategoryName = (category) => {
  if (!category) return "";
  return category
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
};

/**
 * Get direct children of a block
 */
const getDirectChildren = (parentUid) => {
  if (!parentUid) return [];

  try {
    const result = window.roamAlphaAPI.q(
      `[:find (pull ?c [:block/uid :block/string :block/order])
        :where [?p :block/uid "${parentUid}"] [?p :block/children ?c]]`
    );

    return result
      .map(([block]) => ({
        uid: block[":block/uid"],
        text: block[":block/string"] || "",
        order: block[":block/order"] || 0,
      }))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error(`getDirectChildren error for ${parentUid}:`, error);
    return [];
  }
};

/**
 * Find data value using exact attribute match
 */
const findDataValueExact = (pageUid, fieldName) => {
  if (!pageUid || !fieldName) return null;

  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?child-uid ?child-string
       :where 
       [?page :block/uid "${pageUid}"]
       [?page :block/children ?parent]
       [?parent :block/string ?parent-string]
       [(clojure.string/starts-with? ?parent-string "${fieldName}::")]
       [?parent :block/children ?child]
       [?child :block/uid ?child-uid]
       [?child :block/string ?child-string]]
    `);

    if (result.length > 0) {
      return result[0][0]; // Return UID of first child
    }

    return null;
  } catch (error) {
    console.error(`findDataValueExact error for ${fieldName}:`, error);
    return null;
  }
};

/**
 * Find nested data values using exact attribute match
 */
const findNestedDataValuesExact = (pageUid, parentFieldName) => {
  if (!pageUid || !parentFieldName) return {};

  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?field-name ?value-string
       :where 
       [?page :block/uid "${pageUid}"]
       [?page :block/children ?parent]
       [?parent :block/string ?parent-string]
       [(clojure.string/starts-with? ?parent-string "${parentFieldName}::")]
       [?parent :block/children ?field]
       [?field :block/string ?field-string]
       [(clojure.string/includes? ?field-string "::")]
       [?field :block/children ?value]
       [?value :block/string ?value-string]
       [(re-find #"^(.+)::" ?field-string) [_ ?field-name]]]
    `);

    const data = {};
    result.forEach(([fieldName, valueString]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, "");
      const keyMap = {
        aboutme: "aboutMe",
        avatar: "avatar",
        location: "location",
        role: "role",
        timezone: "timezone",
      };
      data[keyMap[key] || key] = valueString;
    });

    return data;
  } catch (error) {
    console.error(
      `findNestedDataValuesExact error for ${parentFieldName}:`,
      error
    );
    return {};
  }
};

/**
 * Set structured data values
 */
const setDataValueStructured = async (
  pageUid,
  fieldName,
  value,
  useAttribute = false
) => {
  try {
    const fieldText = useAttribute ? `${fieldName}::` : fieldName;
    const fieldUid = await ensureBlockExists(pageUid, fieldText);

    if (!fieldUid) return false;

    const children = getDirectChildren(fieldUid);

    if (children.length > 0) {
      // Update first child
      await window.roamAlphaAPI.data.block.update({
        block: { uid: children[0].uid, string: value },
      });
    } else {
      // Create new child
      const valueUid = generateUID();
      await window.roamAlphaAPI.data.block.create({
        location: { "parent-uid": fieldUid, order: 0 },
        block: { uid: valueUid, string: value },
      });
    }

    return true;
  } catch (error) {
    console.error(`setDataValueStructured error:`, error);
    return false;
  }
};

/**
 * Ensure a block exists with given text
 */
const ensureBlockExists = async (parentUid, blockText) => {
  if (!parentUid || !blockText) {
    console.warn("ensureBlockExists requires parentUid and blockText");
    return null;
  }

  try {
    const children = getDirectChildren(parentUid);
    const existing = children.find((child) => child.text === blockText);

    if (existing) {
      console.log(`✅ Block exists: "${blockText}"`);
      return existing.uid;
    }

    console.log(`➕ Creating block: "${blockText}"`);
    const newUid = generateUID();

    await window.roamAlphaAPI.data.block.create({
      location: {
        "parent-uid": parentUid,
        order: children.length,
      },
      block: {
        uid: newUid,
        string: blockText,
      },
    });

    return newUid;
  } catch (error) {
    console.error(`❌ ensureBlockExists failed for "${blockText}":`, error);
    throw error;
  }
};

/**
 * Add item to block list
 */
const addToBlockList = async (parentUid, itemText) => {
  if (!parentUid || !itemText) {
    console.warn("addToBlockList requires parentUid and itemText");
    return false;
  }

  try {
    const children = getDirectChildren(parentUid);
    const existing = children.find((child) => child.text === itemText);

    if (existing) {
      console.log(`⚠️ Item already in list: "${itemText}"`);
      return true;
    }

    console.log(`➕ Adding to list: "${itemText}"`);
    const newUid = generateUID();

    await window.roamAlphaAPI.data.block.create({
      location: {
        "parent-uid": parentUid,
        order: children.length,
      },
      block: {
        uid: newUid,
        string: itemText,
      },
    });

    return true;
  } catch (error) {
    console.error(`❌ addToBlockList failed for "${itemText}":`, error);
    throw error;
  }
};

/**
 * Remove item from block list
 */
const removeFromBlockList = async (parentUid, itemText) => {
  if (!parentUid || !itemText) {
    console.warn("removeFromBlockList requires parentUid and itemText");
    return false;
  }

  try {
    const children = getDirectChildren(parentUid);
    const itemToRemove = children.find((child) => child.text === itemText);

    if (!itemToRemove) {
      console.log(`⚠️ Item not found in list: "${itemText}"`);
      return false;
    }

    console.log(`🗑️ Removing from list: "${itemText}"`);
    await window.roamAlphaAPI.data.block.delete({
      block: { uid: itemToRemove.uid },
    });

    return true;
  } catch (error) {
    console.error(`❌ removeFromBlockList failed for "${itemText}":`, error);
    throw error;
  }
};

/**
 * Get block list items
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

/**
 * Get current user using official API (new method)
 */
const getCurrentUserViaOfficialAPI = () => {
  try {
    if (window.roamAlphaAPI?.user?.uid) {
      const userUid = window.roamAlphaAPI.user.uid();
      const userData = window.roamAlphaAPI.pull("[*]", [":user/uid", userUid]);
      if (userData) {
        return {
          displayName: userData[":user/display-name"] || "Unknown User",
          email: userData[":user/email"] || "",
          uid: userUid,
          photoUrl: userData[":user/photo-url"] || "",
          method: "official-api",
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Official API user detection failed:", error);
    return null;
  }
};

/**
 * Get current user via DOM scanning (fallback method)
 */
const getCurrentUserViaDOM = () => {
  try {
    // Fallback to localStorage method
    const globalAppState = JSON.parse(
      localStorage.getItem("globalAppState") || '["","",[]]'
    );
    const userIndex = globalAppState.findIndex((s) => s === "~:user");
    if (userIndex > 0 && globalAppState[userIndex + 1]) {
      const userData = globalAppState[userIndex + 1];
      return {
        displayName: userData[1] || "Unknown User",
        email: userData[3] || "",
        uid: userData[0] || "unknown",
        photoUrl: userData[4] || "",
        method: "localStorage",
      };
    }

    return {
      displayName: "Unknown User",
      email: "",
      uid: "unknown",
      method: "fallback",
    };
  } catch (error) {
    console.error("DOM user detection failed:", error);
    return {
      displayName: "Error",
      email: "",
      uid: "error",
      method: "error",
    };
  }
};

/**
 * Clear user cache (for testing)
 */
const clearUserCache = () => {
  // Implementation for clearing any cached user data
  console.log("User cache cleared");
};

/**
 * Test the bulletproof cascading function
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
 * Quick cascade test for immediate verification
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

/**
 * Test the new hierarchical list management utilities
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
    console.error("❌ Hierarchical utilities test failed:", error);
  }

  console.groupEnd();
};

/**
 * Test complete graph members workflow
 */
const testGraphMembersWorkflow = async () => {
  console.group("👥 Testing Graph Members Workflow");

  try {
    const members = getGraphMembers();
    console.log(
      `📋 Found ${members.length} graph members:`,
      members.slice(0, 5)
    );

    // Test adding current user to a test list
    const currentUser = getCurrentUser();
    console.log(`👤 Current user: ${currentUser.displayName}`);

    console.log("✅ Graph members workflow test completed!");
  } catch (error) {
    console.error("❌ Graph members workflow test failed:", error);
  }

  console.groupEnd();
};

/**
 * Test image extraction utility
 */
const testImageExtraction = async () => {
  console.group("🖼️ Testing Image Extraction");

  try {
    const currentUser = getCurrentUser();
    const userPageUid = getPageUidByTitle(currentUser.displayName);

    if (userPageUid) {
      const images = extractImageUrls(userPageUid);
      console.log(`📸 Found ${images.length} images on user page:`, images);

      if (images.length > 0) {
        console.log("✅ Image extraction working correctly");
      } else {
        console.log("ℹ️ No images found on user page");
      }
    } else {
      console.log("ℹ️ User page not found for testing");
    }
  } catch (error) {
    console.error("❌ Image extraction test failed:", error);
  }

  console.groupEnd();
};

/**
 * Get current user using multiple methods
 */
const getCurrentUser = () => {
  try {
    // Try official API first (new method)
    if (window.roamAlphaAPI?.user?.uid) {
      const userUid = window.roamAlphaAPI.user.uid();
      const userData = window.roamAlphaAPI.pull("[*]", [":user/uid", userUid]);
      if (userData) {
        return {
          displayName: userData[":user/display-name"] || "Unknown User",
          email: userData[":user/email"] || "",
          uid: userUid,
          photoUrl: userData[":user/photo-url"] || "",
          method: "official-api",
        };
      }
    }

    // Fallback to localStorage method
    const globalAppState = JSON.parse(
      localStorage.getItem("globalAppState") || '["","",[]]'
    );
    const userIndex = globalAppState.findIndex((s) => s === "~:user");
    if (userIndex > 0 && globalAppState[userIndex + 1]) {
      const userData = globalAppState[userIndex + 1];
      return {
        displayName: userData[1] || "Unknown User",
        email: userData[3] || "",
        uid: userData[0] || "unknown",
        photoUrl: userData[4] || "",
        method: "localStorage",
      };
    }

    return {
      displayName: "Unknown User",
      email: "",
      uid: "unknown",
      method: "fallback",
    };
  } catch (error) {
    console.error("getCurrentUser failed:", error);
    return {
      displayName: "Error",
      email: "",
      uid: "error",
      method: "error",
    };
  }
};

/**
 * Get all graph members
 */
const getGraphMembers = () => {
  try {
    const result = window.roamAlphaAPI.q(`
      [:find ?title
       :where [?p :node/title ?title]
       [(clojure.string/includes? ?title " ")]]
    `);

    const members = result
      .map(([title]) => title)
      .filter(
        (title) =>
          !title.startsWith("roam/") &&
          !title.includes("::") &&
          title.length > 2
      )
      .sort();

    return members;
  } catch (error) {
    console.error("getGraphMembers error:", error);
    return [];
  }
};

// ===================================================================
// 🧪 TEST FUNCTIONS FOR NEW UTILITIES
// ===================================================================

/**
 * Test timezone utilities
 */
const testTimezoneUtilities = () => {
  console.group("🌍 Testing Timezone Utilities");

  const testTimezones = [
    "EST",
    "America/New_York",
    "PST",
    "GMT+1",
    "JST",
    "__not yet entered__",
    "invalid-timezone",
  ];

  testTimezones.forEach((tz) => {
    const parsed = timezoneManager.parseTimezone(tz);
    const timeInfo = timezoneManager.getCurrentTimeForTimezone(tz);
    console.log(`🕐 ${tz}:`);
    console.log(`   Parsed: ${parsed}`);
    console.log(
      `   Time: ${timeInfo.timeString} (${
        timeInfo.isValid ? "valid" : "invalid"
      })`
    );
  });

  console.log(
    "🌍 Common timezones:",
    timezoneManager.getCommonTimezones().length
  );
  console.groupEnd();
};

/**
 * Test modal utilities
 */
const testModalUtilities = () => {
  console.group("🪟 Testing Modal Utilities");

  const modal = modalUtilities.createModal("test-modal");
  const content = modalUtilities.createModalContent({ maxWidth: "800px" });
  const header = modalUtilities.createModalHeader(
    "Test Modal",
    "This is a test modal"
  );

  content.appendChild(header);

  const body = document.createElement("div");
  body.style.padding = "32px";
  body.innerHTML = `
    <p>This is a test modal created with modalUtilities.</p>
    <button onclick="modalUtilities.closeModal('test-modal')">Close Modal</button>
  `;
  content.appendChild(body);

  modal.appendChild(content);
  document.body.appendChild(modal);

  console.log("✅ Test modal created and displayed");
  console.groupEnd();
};

/**
 * Test navigation utilities
 */
const testNavigationUtilities = () => {
  console.group("🧭 Testing Navigation Utilities");

  const selectors = [".roam-article", ".roam-main", "body"];
  const target = navigationUtilities.findBestPlacementTarget(selectors);
  console.log("🎯 Best placement target:", target.selector);

  // Ensure target has relative positioning
  if (getComputedStyle(target.element).position === "static") {
    target.element.style.position = "relative";
  }

  const testButton = navigationUtilities.createNavButton({
    text: "🧪 Test Button",
    position: "top-right",
    onClick: () => {
      alert("Test button clicked!");
      testButton.remove();
    },
    className: "test-nav-button",
  });

  target.element.appendChild(testButton);

  console.log("✅ Test navigation button created");
  console.log("💡 Check top-right corner for test button");

  setTimeout(() => {
    navigationUtilities.removeNavButtons("test-nav-button");
    console.log("🧹 Test button cleaned up");
  }, 5000);

  console.groupEnd();
};

/**
 * Test profile analysis utilities
 */
const testProfileAnalysisUtilities = () => {
  console.group("📊 Testing Profile Analysis Utilities");

  const testProfile = {
    username: "Test User",
    avatar: "https://example.com/avatar.jpg",
    location: "__not yet entered__",
    role: "Developer",
    timezone: "__missing field__",
    aboutMe: "I'm a test user",
  };

  const requiredFields = ["avatar", "location", "role", "timezone", "aboutMe"];
  const completeness = profileAnalysisUtilities.calculateProfileCompleteness(
    testProfile,
    requiredFields
  );
  console.log(`📊 Profile completeness: ${completeness}%`);

  requiredFields.forEach((field) => {
    const category = profileAnalysisUtilities.categorizeDataValue(
      testProfile[field]
    );
    const display = profileAnalysisUtilities.createDataCellDisplay(
      testProfile[field]
    );
    console.log(`${field}: ${category.type} - ${display}`);
  });

  const testProfiles = [testProfile, { ...testProfile, completeness: 80 }];
  const report =
    profileAnalysisUtilities.generateProfileQualityReport(testProfiles);
  console.log("📈 Quality report:", report);

  console.groupEnd();
};

/**
 * Test enhanced image processing
 */
const testEnhancedImageProcessing = async () => {
  console.group("🖼️ Testing Enhanced Image Processing");

  // Test with current user
  const currentUser = getCurrentUser();
  console.log("👤 Current user:", currentUser.displayName);

  const userPageUid = getPageUidByTitle(currentUser.displayName);
  if (userPageUid) {
    const avatarBlockUid = findDataValueExact(userPageUid, "My Info:: Avatar");
    if (avatarBlockUid) {
      const images = extractImageUrls(avatarBlockUid, { validateUrls: true });
      console.log("🖼️ Found images:", images);

      const avatarDisplay = await processAvatarImages(
        avatarBlockUid,
        currentUser.displayName
      );
      console.log("👤 Avatar display HTML:", avatarDisplay);
    } else {
      console.log("ℹ️ No avatar block found for testing");
    }
  } else {
    console.log("ℹ️ User page not found for testing");
  }

  console.groupEnd();
};

/**
 * Test enhanced member management
 */
const testEnhancedMemberManagement = async () => {
  console.group("👥 Testing Enhanced Member Management");

  const currentUser = getCurrentUser();
  console.log("👤 Testing with current user:", currentUser.displayName);

  // Test adding to managed list
  const added = await addGraphMember(
    currentUser.displayName,
    "Test Graph Members"
  );
  console.log(`➕ Added to managed list: ${added}`);

  // Test getting from managed list
  const members = getGraphMembersFromList("Test Graph Members");
  console.log("📋 Members from managed list:", members);

  // Test removing from managed list
  const removed = await removeGraphMember(
    currentUser.displayName,
    "Test Graph Members"
  );
  console.log(`🗑️ Removed from managed list: ${removed}`);

  console.groupEnd();
};

// ===================================================================
// 🎛️ ENHANCED UTILITIES REGISTRY
// ===================================================================

const UTILITIES = {
  // 🌍 NEW: Timezone Management Utilities
  timezoneManager,

  // 🪟 NEW: Modal Creation Utilities
  modalUtilities,

  // 🧭 NEW: Navigation Utilities
  navigationUtilities,

  // 📊 NEW: Profile Analysis Utilities
  profileAnalysisUtilities,

  // 🖼️ ENHANCED: Image Processing Utilities
  extractImageUrls,
  processAvatarImages,

  // 👥 ENHANCED: Graph Member Management
  getGraphMembers,
  getGraphMembersFromList,
  addGraphMember,
  removeGraphMember,

  // 🆕 EXISTING: Hierarchical List Management
  ensureBlockExists,
  addToBlockList,
  removeFromBlockList,
  getBlockListItems,

  // 🚀 EXISTING: Bulletproof Cascading
  cascadeToBlock,

  // 🔧 EXISTING: Core Functions
  findDataValueExact,
  findNestedDataValuesExact,
  setDataValueStructured,

  // 🏗️ EXISTING: Helper Functions
  getDirectChildren,
  getPageUidByTitle,
  createPageIfNotExists,
  generateUID,
  normalizeHeaderText,
  normalizeCategoryName,

  // 🧭 EXISTING: Page Navigation Functions
  getCurrentPageTitle,
  getCurrentPageUid,
  getPageTitlesStartingWithPrefix,
  getPageUidByPageTitle,

  // 🔧 EXISTING: Enhanced Data Functions
  setNestedDataValuesStructured,

  // 🔍 EXISTING: User Detection
  getCurrentUser,
  getCurrentUserViaOfficialAPI,
  getCurrentUserViaDOM,
  clearUserCache,

  // 🧪 EXISTING: Test Functions for Original Utilities
  testCascadeToBlock,
  quickCascadeTest,
  testHierarchicalUtilities,
  testGraphMembersWorkflow,
  testImageExtraction,

  // 🧪 NEW: Test Functions for New Utilities
  testTimezoneUtilities,
  testModalUtilities,
  testNavigationUtilities,
  testProfileAnalysisUtilities,
  testEnhancedImageProcessing,
  testEnhancedMemberManagement,
};

// ===================================================================
// 🎯 EXTENSION REGISTRATION - Enhanced with Phase 1 Utilities
// ===================================================================

export default {
  onload: () => {
    console.log("🔧 Extension 1.5 loading with Phase 1 enhancements...");

    // Initialize extension registry if it doesn't exist
    if (!window._extensionRegistry) {
      window._extensionRegistry = {
        extensions: new Map(),
        utilities: {},
        commands: [],
        elements: [],
        observers: [],
      };
    }

    // Ensure utilities object exists
    if (!window._extensionRegistry.utilities) {
      window._extensionRegistry.utilities = {};
    }

    // 🧪 Command palette functions for testing
    const commands = [
      // NEW Phase 1 test commands
      {
        label: "Test: Timezone Management Utilities",
        callback: testTimezoneUtilities,
      },
      {
        label: "Test: Modal Creation Utilities",
        callback: testModalUtilities,
      },
      {
        label: "Test: Navigation Utilities",
        callback: testNavigationUtilities,
      },
      {
        label: "Test: Profile Analysis Utilities",
        callback: testProfileAnalysisUtilities,
      },
      {
        label: "Test: Enhanced Image Processing",
        callback: testEnhancedImageProcessing,
      },
      {
        label: "Test: Enhanced Member Management",
        callback: testEnhancedMemberManagement,
      },
      // EXISTING original test commands (for backward compatibility)
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
    if (window.RoamExtensionSuite) {
      // Register individual utilities
      if (window.RoamExtensionSuite.registerUtility) {
        Object.entries(UTILITIES).forEach(([name, utility]) => {
          window.RoamExtensionSuite.registerUtility(name, utility);
        });
      }

      // Register the extension itself with the platform
      if (window.RoamExtensionSuite.register) {
        window.RoamExtensionSuite.register(
          "utility-library",
          {
            utilities: UTILITIES,
            version: "1.5.1-phase1",
          },
          {
            name: "Enhanced Utility Library",
            description:
              "Phase 1 enhanced utility library with timezone, modal, navigation, and profile analysis utilities",
            version: "1.5.1-phase1",
            dependencies: [],
          }
        );
      }
    }

    // ✅ Extension successfully loaded
    console.log("✅ Extension 1.5 Phase 1 loaded successfully!");
    console.log(`🔧 Registered ${Object.keys(UTILITIES).length} utilities:`);
    console.log(
      "   🌍 NEW: Timezone Management (TimezoneManager from Extension SIX)"
    );
    console.log(
      "   🪟 NEW: Modal Creation Utilities (Professional modal system)"
    );
    console.log(
      "   🧭 NEW: Navigation Utilities (Button placement and monitoring)"
    );
    console.log(
      "   📊 NEW: Profile Analysis Utilities (Completeness and categorization)"
    );
    console.log(
      "   🖼️ ENHANCED: Image Processing (Validation and avatar processing)"
    );
    console.log(
      "   👥 ENHANCED: Graph Member Management (Managed member lists)"
    );
    console.log("   🚀 EXISTING: All previous utilities maintained");
    console.log(
      "💡 Try the new test commands to see Phase 1 utilities in action!"
    );

    return {
      extensionId: "utility-library",
      utilities: UTILITIES,
      version: "1.5.1-phase1",
    };
  },

  onunload: () => {
    console.log("🔧 Extension 1.5 Phase 1 unloading...");
    // Cleanup handled by the registry
  },
};
