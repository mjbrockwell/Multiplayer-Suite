// Roam Mention Notifications Extension - POLISHED VERSION WITH FAST CACHE
// Beautiful styling + Working navigation + Lightning fast performance

const mentionNotifications = (() => {
  // Core State
  let extensionAPI = null;
  let isInitialized = false;
  let notificationBadge = null;
  let notificationPanel = null;
  let currentUnseenCount = 0;
  let autoRefreshInterval = null;
  let styleElement = null;

  // PERFORMANCE CACHE - Makes notification panel open INSTANTLY!
  let cachedMentions = [];
  let lastCacheTime = 0;
  const CACHE_DURATION = 10000; // 10 seconds

  // Simple Logging
  const log = (message, type = "info") => {
    console.log(`[Mention Notifications] ${type.toUpperCase()}: ${message}`);
  };

  // Pattern Management
  const getMentionPatterns = (username) => ({
    unseen: `[[@${username}]]`,
    seen: `[[*${username}]]`,
  });

  const hasUnseenMention = (blockContent, username) => {
    const patterns = getMentionPatterns(username);
    return blockContent.includes(patterns.unseen);
  };

  const hasSeenMention = (blockContent, username) => {
    const patterns = getMentionPatterns(username);
    return blockContent.includes(patterns.seen);
  };

  // POLISHED CSS INJECTION - BEAUTIFUL & SMOOTH
  const injectCSS = () => {
    if (styleElement) styleElement.remove();

    styleElement = document.createElement("style");
    styleElement.id = "mention-notifications-styles";
    const currentUser = getCurrentUser();

    styleElement.textContent = `
      /* POLISHED MENTION STYLING - WITH SMOOTH INTERACTIONS */
      
      /* Style for #@Username tag (yellow with sun emoji) */
      span.rm-page-ref[data-tag="@${currentUser}"] {
        font-size: 0pt;
        background-color: #FFF9C4;
        border-radius: 20px;
        border: 2px solid #FFD600;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
        display: inline-flex;
        align-items: center;
        padding: 3px 12px 4px 12px;
        transition: all 0.2s ease-out;
        cursor: pointer;
      }

      span.rm-page-ref[data-tag="@${currentUser}"]:hover {
        background-color: #FFF176;
        border-color: #FFC107;
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.25);
      }

      span.rm-page-ref[data-tag="@${currentUser}"]::before {
        content: "🔆 " attr(data-tag);
        font-size: 14pt;
        color: #333 !important;
        font-weight: 500;
        letter-spacing: -1px;
      }

      /* Style for #*Username tag (green with checkmark emoji) */
      span.rm-page-ref[data-tag="*${currentUser}"] {
        font-size: 0pt;
        background-color: #E8F5E9;
        border-radius: 20px;
        border: 2px solid #81C784;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
        display: inline-flex;
        align-items: center;
        padding: 3px 12px 4px 12px;
        transition: all 0.2s ease-out;
        cursor: pointer;
      }

      span.rm-page-ref[data-tag="*${currentUser}"]:hover {
        background-color: #C8E6C9;
        border-color: #66BB6A;
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.25);
      }

      span.rm-page-ref[data-tag="*${currentUser}"]::before {
        content: "✅ " attr(data-tag);
        font-size: 14pt;
        color: #333 !important;
        font-weight: 500;
        letter-spacing: -1px;
      }

      /* Style for links that start with @ symbol (unseen mentions) */
      span[data-link-title="@${currentUser}"] {
         background: #FBF6C5 !important;
         border: solid 1px black;
         border-radius: 8px;
         padding: 3px 4px 7px 4px;
         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
         transition: all 0.2s ease-out;
         cursor: pointer;
      }

      span[data-link-title="@${currentUser}"]:hover {
         background: #F9F1A5 !important;
         box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
      }

      span[data-link-title="@${currentUser}"]::before {
         content: "🔆 ";
         position: relative;
         top: 2px;
      }

      /* Style for links that start with * symbol (seen mentions) */
      span[data-link-title="*${currentUser}"] {
         background: #D3FFEB !important;
         border: solid 1px black;
         border-radius: 8px;
         padding: 3px 4px 7px 4px;
         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
         transition: all 0.2s ease-out;
         cursor: pointer;
      }

      span[data-link-title="*${currentUser}"]:hover {
         background: #C1F7D8 !important;
         box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
      }

      span[data-link-title="*${currentUser}"]::before {
         content: "✅ ";
         position: relative;
         top: 2px;
      }

      /* NOTIFICATION PANEL STYLING */
      #mention-notification-panel {
        position: fixed;
        top: 60px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        overflow: hidden;
        font-family: system-ui;
      }

      #mention-notification-panel .panel-header {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 16px 20px;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #mention-notification-panel .panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      #mention-notification-panel .panel-actions {
        display: flex;
        gap: 8px;
      }

      #mention-notification-panel .panel-actions button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      #mention-notification-panel .panel-actions #refresh-btn {
        background: #007bff;
        color: white;
      }

      #mention-notification-panel .panel-actions #refresh-btn:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }

      #mention-notification-panel .panel-actions #mark-all-btn {
        background: #28a745;
        color: white;
      }

      #mention-notification-panel .panel-actions #mark-all-btn:hover {
        background: #1e7e34;
        transform: translateY(-1px);
      }

      #mention-notification-panel .panel-actions #close-btn {
        background: #6c757d;
        color: white;
      }

      #mention-notification-panel .panel-actions #close-btn:hover {
        background: #545b62;
        transform: translateY(-1px);
      }

      #mention-notification-panel #notification-content {
        max-height: 400px;
        overflow-y: auto;
      }

      #mention-notification-panel .mention-item:hover {
        background: #f8f9fa;
        transition: background 0.2s ease;
      }

      #mention-notification-panel .mention-item .mark-read-btn:hover {
        background: #1e7e34 !important;
        transform: translateY(-1px);
        transition: all 0.2s ease;
      }
    `;

    document.head.appendChild(styleElement);
    log("Polished CSS injected successfully");
  };

  // User Management
  const getCurrentUser = () => {
    try {
      if (extensionAPI && extensionAPI.settings) {
        const settingsUser = extensionAPI.settings.get("mentionUser");
        if (settingsUser && settingsUser.trim()) {
          return settingsUser.trim();
        }
      }
      return "Matt Brockwell";
    } catch (error) {
      log(`Error getting current user: ${error.message}`, "error");
      return "Matt Brockwell";
    }
  };

  const getExtensionSetting = (key, defaultValue = null) => {
    try {
      return extensionAPI?.settings?.get(key) ?? defaultValue;
    } catch (error) {
      log(`Failed to get setting '${key}': ${error.message}`, "warn");
      return defaultValue;
    }
  };

  // FAST cached mention detection
  const getUnseenMentions = async (useCache = true) => {
    try {
      const now = Date.now();
      if (
        useCache &&
        cachedMentions.length > 0 &&
        now - lastCacheTime < CACHE_DURATION
      ) {
        log(`Using cached mentions (${cachedMentions.length} items)`);
        return cachedMentions;
      }

      log(`Refreshing mention cache...`);
      const currentUser = getCurrentUser();

      const allBlocks = window.roamAlphaAPI.data.q(`
        [:find ?uid ?string
         :where 
         [?e :block/uid ?uid]
         [?e :block/string ?string]]
      `);

      const unseenMentionBlocks = allBlocks.filter(([uid, string]) => {
        if (!string || !hasUnseenMention(string, currentUser)) {
          return false;
        }

        if (string.trim().startsWith("{") && string.includes('"uid":')) {
          return false;
        }

        try {
          const parentQuery = window.roamAlphaAPI.data.q(`
            [:find ?parentString
             :where 
             [?child :block/uid "${uid}"]
             [?parent :block/children ?child]
             [?parent :block/string ?parentString]]
          `);

          if (parentQuery.length > 0) {
            const parentString = parentQuery[0][0];
            if (parentString && parentString.includes("mentions::")) {
              return false;
            }
          }
        } catch (e) {
          // Ignore
        }

        return true;
      });

      const unseenMentions = [];

      for (const [uid, string] of unseenMentionBlocks) {
        let pageTitle = "Unknown Page";

        try {
          let pageQuery = window.roamAlphaAPI.data.q(`
            [:find ?title
             :where 
             [?b :block/uid "${uid}"]
             [?p :block/children ?b]
             [?p :node/title ?title]]
          `);

          if (pageQuery.length > 0) {
            pageTitle = pageQuery[0][0];
          } else {
            pageQuery = window.roamAlphaAPI.data.q(`
              [:find ?title
               :where 
               [?b :block/uid "${uid}"]
               [?p :block/children+ ?b]
               [?p :node/title ?title]]
            `);

            if (pageQuery.length > 0) {
              pageTitle = pageQuery[0][0];
            }
          }
        } catch (e) {
          // Use default
        }

        unseenMentions.push({
          uid: uid,
          content: string,
          pageTitle: pageTitle,
          detectedAt: Date.now(),
          status: "unseen",
          source: "block-content",
        });
      }

      cachedMentions = unseenMentions;
      lastCacheTime = now;

      log(`Cache updated with ${unseenMentions.length} mentions`);
      return unseenMentions;
    } catch (error) {
      log(`Error getting unseen mentions: ${error.message}`, "error");
      return [];
    }
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const markMentionAsSeen = async (mentionUid) => {
    try {
      const blockData = window.roamAlphaAPI.pull("[:block/string]", [
        ":block/uid",
        mentionUid,
      ]);

      if (!blockData || !blockData[":block/string"]) {
        return { success: false, message: `Block not found: ${mentionUid}` };
      }

      const blockContent = blockData[":block/string"];
      const currentUser = getCurrentUser();
      const patterns = getMentionPatterns(currentUser);

      if (!blockContent.includes(patterns.unseen)) {
        return { success: false, message: "No unseen mentions found" };
      }

      const newText = blockContent.replace(
        new RegExp(escapeRegExp(patterns.unseen), "g"),
        patterns.seen
      );

      if (window.roamAlphaAPI.data?.block?.update) {
        await window.roamAlphaAPI.data.block.update({
          block: { uid: mentionUid, string: newText },
        });
      } else if (window.roamAlphaAPI.updateBlock) {
        await window.roamAlphaAPI.updateBlock({
          block: { uid: mentionUid, string: newText },
        });
      } else {
        return {
          success: false,
          message: "API methods for updating blocks not found",
        };
      }

      lastCacheTime = 0; // Invalidate cache
      return { success: true, message: "Successfully marked mention as seen" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const markAllMentionsAsSeen = async () => {
    try {
      const unseenMentions = await getUnseenMentions();

      if (unseenMentions.length === 0) {
        return { success: true, processed: 0 };
      }

      let successCount = 0;
      let failCount = 0;

      for (const mention of unseenMentions) {
        try {
          const result = await markMentionAsSeen(mention.uid);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          failCount++;
          log(
            `Error processing mention ${mention.uid}: ${error.message}`,
            "error"
          );
        }
      }

      lastCacheTime = 0; // Invalidate cache
      return { success: true, processed: successCount, failed: failCount };
    } catch (error) {
      log(`Error marking all mentions as seen: ${error.message}`, "error");
      return { success: false, message: error.message };
    }
  };

  // WORKING BADGE PLACEMENT (from previous working version)
  const createNotificationBadge = () => {
    try {
      if (notificationBadge) {
        notificationBadge.remove();
      }

      const topbar =
        document.querySelector(".rm-topbar") ||
        document.querySelector(".roam-topbar") ||
        document.querySelector('[class*="topbar"]') ||
        document.querySelector(".bp3-navbar");

      notificationBadge = document.createElement("div");
      notificationBadge.id = "mention-notification-badge";

      if (topbar) {
        notificationBadge.style.cssText = `
          width: 32px;
          height: 32px;
          background: #ff6b35;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          margin: 0 8px;
          position: relative;
        `;
        topbar.appendChild(notificationBadge);
        log(`Badge integrated into topbar`);
      } else {
        notificationBadge.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          background: #ff6b35;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          z-index: 999999;
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        `;
        document.body.appendChild(notificationBadge);
        log(`Badge using fixed position fallback`);
      }

      notificationBadge.addEventListener("mouseenter", () => {
        notificationBadge.style.transform = "scale(1.1)";
      });

      notificationBadge.addEventListener("mouseleave", () => {
        notificationBadge.style.transform = "scale(1)";
      });

      notificationBadge.addEventListener("click", () => {
        toggleNotificationPanel();
      });

      updateBadgeCount(0);
    } catch (error) {
      log(`Error creating notification badge: ${error.message}`, "error");
    }
  };

  const updateBadgeCount = (count) => {
    if (!notificationBadge) return;

    currentUnseenCount = count;
    notificationBadge.style.display = "flex";

    if (count === 0) {
      notificationBadge.style.background = "#28a745";
      notificationBadge.textContent = "0";
    } else {
      notificationBadge.style.background = "#ff6b35";
      notificationBadge.textContent = count > 99 ? "99+" : count.toString();
    }
  };

  const performFullRefresh = async () => {
    try {
      const unseenMentions = await getUnseenMentions(false); // Force refresh
      updateBadgeCount(unseenMentions.length);

      if (notificationPanel?.style.display !== "none") {
        await loadNotificationContent(false);
      }

      log(`Refresh completed: ${unseenMentions.length} unseen mentions`);
    } catch (error) {
      log(`Refresh failed: ${error.message}`, "error");
    }
  };

  const startAutoRefresh = () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);

    autoRefreshInterval = setInterval(async () => {
      await performFullRefresh();
    }, 30000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  };

  // Panel Management
  const toggleNotificationPanel = async () => {
    try {
      if (!notificationPanel) {
        await createNotificationPanel();
      }

      const isVisible = notificationPanel.style.display !== "none";

      if (isVisible) {
        hideNotificationPanel();
      } else {
        showNotificationPanel();
      }
    } catch (error) {
      log(`Error toggling notification panel: ${error.message}`, "error");
    }
  };

  const showNotificationPanel = async () => {
    if (!notificationPanel) return;

    notificationPanel.style.display = "block";
    loadNotificationContent(); // Don't await - loads instantly with cache
  };

  const hideNotificationPanel = () => {
    if (!notificationPanel) return;
    notificationPanel.style.display = "none";
  };

  const createNotificationPanel = async () => {
    try {
      if (notificationPanel) {
        notificationPanel.remove();
      }

      notificationPanel = document.createElement("div");
      notificationPanel.id = "mention-notification-panel";

      notificationPanel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 999999;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      `;

      const header = document.createElement("div");
      header.style.cssText = `
        background: #4a90e2;
        color: white;
        padding: 16px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const headerTitle = document.createElement("span");
      headerTitle.textContent = "Mentions";

      const headerButtons = document.createElement("div");
      headerButtons.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
      `;

      const refreshButton = document.createElement("button");
      refreshButton.textContent = "Refresh";
      refreshButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      `;

      refreshButton.addEventListener("click", async () => {
        log("Manual refresh requested");
        await performFullRefresh();
        await loadNotificationContent(true);
      });

      const markAllReadButton = document.createElement("button");
      markAllReadButton.textContent = "Mark All Read";
      markAllReadButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      `;

      markAllReadButton.addEventListener("click", async () => {
        await markAllMentionsAsSeen();
        await performFullRefresh();
        hideNotificationPanel();
      });

      const closeButton = document.createElement("button");
      closeButton.textContent = "×";
      closeButton.style.cssText = `
        background: none;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        line-height: 1;
        margin-left: 4px;
      `;

      closeButton.addEventListener("click", () => {
        hideNotificationPanel();
      });

      headerButtons.appendChild(refreshButton);
      headerButtons.appendChild(markAllReadButton);
      headerButtons.appendChild(closeButton);

      header.appendChild(headerTitle);
      header.appendChild(headerButtons);

      const content = document.createElement("div");
      content.id = "notification-content";
      content.style.cssText = `
        max-height: 400px;
        overflow-y: auto;
        padding: 0;
      `;

      notificationPanel.appendChild(header);
      notificationPanel.appendChild(content);
      document.body.appendChild(notificationPanel);

      await loadNotificationContent();
    } catch (error) {
      log(`Error creating notification panel: ${error.message}`, "error");
    }
  };

  const loadNotificationContent = async (forceRefresh = false) => {
    const content = notificationPanel?.querySelector("#notification-content");
    if (!content) return;

    const unseenMentions = await getUnseenMentions(!forceRefresh);

    if (unseenMentions.length === 0) {
      content.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
          <div>No new mentions!</div>
        </div>
      `;
      return;
    }

    const mentionItems = unseenMentions.map((mention) => {
      const now = Date.now();
      const mentionTime = mention.detectedAt || Date.now();
      const hoursAgo = Math.floor((now - mentionTime) / (1000 * 60 * 60));

      let timeAgoText = "";
      if (hoursAgo < 24) {
        timeAgoText =
          hoursAgo === 0
            ? "just now"
            : hoursAgo === 1
            ? "1 hour ago"
            : `${hoursAgo} hours ago`;
      } else {
        const daysAgo = Math.floor(hoursAgo / 24);
        timeAgoText = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
      }

      return `
        <div class="mention-item" data-uid="${
          mention.uid
        }" style="padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #333;">${
              mention.pageTitle
            }</div>
            <button class="mark-read-btn" data-uid="${
              mention.uid
            }" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Mark Read</button>
          </div>
          <div style="color: #666; font-size: 13px; margin-bottom: 8px;">
            ${mention.content.substring(0, 150)}${
        mention.content.length > 150 ? "..." : ""
      }
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #999; font-size: 11px;">
              ${new Date(mention.detectedAt).toLocaleString()}
            </div>
            <div style="color: #999; font-size: 11px; font-style: italic;">
              ${timeAgoText}
            </div>
          </div>
        </div>
      `;
    });

    content.innerHTML = mentionItems.join("");

    // Add click handlers with working navigation
    content.addEventListener("click", async (e) => {
      const mentionItem = e.target.closest(".mention-item");
      const markReadBtn = e.target.closest(".mark-read-btn");

      if (markReadBtn) {
        e.stopPropagation();
        const uid = markReadBtn.dataset.uid;
        if (await markMentionAsSeen(uid)) {
          await performFullRefresh();
          await loadNotificationContent(false);
        }
      } else if (mentionItem) {
        const uid = mentionItem.dataset.uid;

        try {
          await window.roamAlphaAPI.ui.mainWindow.openBlock({
            block: { uid: uid },
          });

          setTimeout(() => {
            window.roamAlphaAPI.ui.setBlockFocusAndSelection({
              location: {
                "block-uid": uid,
                "window-id": "main-window",
              },
            });
          }, 300);
        } catch (error) {
          log(`Error navigating to block: ${error.message}`, "error");
        }

        hideNotificationPanel();
      }
    });
  };

  // Extension Lifecycle
  const onload = async ({ extensionAPI: api }) => {
    extensionAPI = api;

    extensionAPI.settings.panel.create({
      tabTitle: "Mention Notifications",
      settings: [
        {
          id: "mentionUser",
          name: "Mention Username",
          description: "Username to watch for mentions (without @ symbol)",
          action: { type: "input", placeholder: "Matt Brockwell" },
        },
        {
          id: "autoRefresh",
          name: "Auto-refresh",
          description: "Check for mentions every 30 seconds",
          action: { type: "switch" },
        },
      ],
    });

    const currentUser = getCurrentUser();
    log(`Monitoring mentions for: ${currentUser}`);

    createNotificationBadge();
    injectCSS();

    await performFullRefresh();

    const autoRefreshEnabled = getExtensionSetting("autoRefresh", true);
    if (autoRefreshEnabled) {
      startAutoRefresh();
      log("Auto-refresh enabled (30 second intervals)");
    } else {
      log("Auto-refresh disabled by user setting");
    }

    isInitialized = true;

    log("Extension loaded successfully with POLISHED CSS and FAST CACHE!");
  };

  const onunload = () => {
    log("Extension unloading...");

    stopAutoRefresh();

    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }

    if (notificationBadge) {
      notificationBadge.remove();
      notificationBadge = null;
    }

    if (notificationPanel) {
      notificationPanel.remove();
      notificationPanel = null;
    }

    isInitialized = false;
    log("Extension unloaded successfully");
  };

  return { onload, onunload };
})();

export default mentionNotifications;
