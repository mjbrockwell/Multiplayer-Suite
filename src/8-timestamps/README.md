# 🌳 Timestamp Pills for Multiplayer - Extension 8

**Visual Timestamp Context for Multi-User Collaboration**

> _Transforms simple #ts0 tags into beautiful, contextual timestamp pills with intelligent time categorization_

---

## ✨ **What It Does**

Extension 8 transforms plain text timestamp tags into visual timestamp pills that provide instant temporal context. Perfect for multi-user graphs where understanding "when" something happened is crucial for collaboration and conversation flow.

### 🎯 **Core Value**

- **🏷️ Tag Transformation** - Converts #ts0 tags into beautiful visual pills
- **🎨 Smart Categorization** - Color-coded pills based on time periods (today, yesterday, week, older)
- **💬 Rich Tooltips** - Hover for full date/time information
- **👥 Multiplayer Optimized** - Robust block UID extraction for collaborative environments
- **⚙️ Configurable** - Customizable tag names, time formats, and display options

---

## 🚀 **Quick Start**

### **Installation**

1. **Prerequisites**: Works standalone or with Multi User Suite for enhanced features
2. **Load Extension** - Standard developer mode installation
3. **Start Using** - Simply type #ts0 in any block to see timestamp pills

### **Instant Usage**

- **Type** `#ts0` in any block → Automatically becomes a timestamp pill
- **Hover Pills** → See full date and time information
- **Visual Context** → Different colors indicate when content was created

---

## 📋 **Visual Timestamp System**

### **🎨 Color-Coded Time Periods**

| Time Period   | Color           | Example Display | Description            |
| ------------- | --------------- | --------------- | ---------------------- |
| **Today**     | 🔵 Light Blue   | "today"         | Content created today  |
| **Yesterday** | 🟣 Light Purple | "yesterday"     | Content from yesterday |
| **This Week** | 🟢 Light Green  | "Tue<br>Jun 13" | Within the last 7 days |
| **Older**     | 🟠 Light Orange | "Wed<br>Mar 15" | More than a week ago   |

### **📱 Responsive Design**

- **Recent items** → Simple text ("today", "yesterday")
- **Weekly items** → Stacked format (Day abbreviation / Month Day)
- **Hover tooltips** → Full context ("Monday, June 19th, 2025 at 2:30 PM")

---

## 🛠️ **How It Works**

### **🔍 Intelligent Detection**

1. **Finds #ts0 tags** → Scans document for timestamp tags
2. **Extracts block UID** → Uses multiplayer-aware DOM traversal
3. **Queries creation time** → Gets block timestamp from Roam API
4. **Calculates context** → Determines time period category
5. **Renders pill** → Applies appropriate styling and content

### **🎨 Visual Transformation**

```
Before: #ts0
After:  [today] (blue pill with hover tooltip)
```

### **💡 Smart Categorization Logic**

- **Today**: Same calendar day as current date
- **Yesterday**: Previous calendar day
- **This Week**: Within 7 days, shows day/date format
- **Older**: Beyond 7 days, shows day/date format

---

## ⚙️ **Configuration Options**

### **📊 Extension Settings**

Access via Roam Settings > Extensions > Timestamp Pills:

- **Tag Name** - Customize which tag to transform (default: "ts0")
- **24-Hour Format** - Use 24-hour time in tooltips
- **Show Seconds** - Include seconds in timestamp displays

### **🔧 Advanced Configuration**

```javascript
// Programmatic configuration
window.Extension8_TimestampPills.updateConfig({
  tagName: "timestamp", // Use #timestamp instead of #ts0
  use24Hour: false, // Use 12-hour format
  showSeconds: true, // Show seconds in tooltips
});
```

---

## 👥 **Multiplayer Features**

### **🔍 Robust Block Detection**

- **Multiple UID extraction methods** - Works across different Roam configurations
- **Multiplayer DOM patterns** - Handles collaborative editing scenarios
- **Fallback mechanisms** - Graceful degradation when APIs unavailable

### **🌍 Timezone Awareness**

- **Local time display** - Shows timestamps in user's local timezone
- **Consistent formatting** - Standardized time display across users
- **Tooltip precision** - Full date/time context for clarity

---

## 🎮 **Available Commands**

### **Console Functions**

```javascript
// Manual refresh of all timestamp pills
window.Extension8_TimestampPills.refresh();

// Enable debug logging
window.Extension8_TimestampPills.debug(true);

// View current configuration
window.Extension8_TimestampPills.getConfig();
```

---

## 🏗️ **Technical Architecture**

### **🔧 Core Components**

- **DOM Observer** - Watches for new #ts0 tags in dynamic content
- **Block UID Extraction** - Multiple fallback methods for robust detection
- **Time Calculation** - Smart categorization based on creation timestamps
- **CSS Injection** - Professional pill styling with gradients and hover effects

### **🔗 Multi User Suite Integration**

- **Platform Registration** - Integrates with Extension Suite when available
- **Utility Access** - Can leverage shared utilities for enhanced functionality
- **Standalone Mode** - Works independently when suite not present

### **📱 Performance Optimizations**

- **Mutation Observer** - Only processes new content, not entire document
- **Efficient Selectors** - Targeted DOM queries for minimal overhead
- **Debounced Processing** - Batched updates for smooth performance

---

## 🎯 **Use Cases**

### **💬 Conversation Threads**

```
Alice: Great point about the proposal #ts0
Bob: I agree, let's move forward #ts0
Charlie: Updated the document #ts0
```

→ Visual pills show conversation timeline at a glance

### **📝 Content Versioning**

```
Draft v1 complete #ts0
Feedback incorporated #ts0
Final version ready #ts0
```

→ Easy to see content evolution timeline

### **🎯 Meeting Notes**

```
Opening remarks #ts0
Budget discussion #ts0
Action items #ts0
```

→ Clear temporal structure for meeting flow

---

## 📊 **Version Info**

**Version**: 1.0.0 (as of June 20th, 2025)  
**Dependencies**: None required, Multi User Suite optional for enhanced features  
**Status**: Production ready with multiplayer optimization

---

## 🔍 **Troubleshooting**

### **Common Issues**

- **Pills not appearing**: Check that you're using the correct tag name (default: #ts0)
- **Wrong timestamps**: Verify block creation time is available via Roam API
- **Styling issues**: Check console for CSS injection errors

### **Debug Tools**

```javascript
// Enable detailed logging
window.Extension8_TimestampPills.debug(true);

// Manual processing trigger
window.Extension8_TimestampPills.refresh();
```

---

## 🎯 **Perfect For**

- Multi-user Roam graphs requiring temporal context
- Team collaboration with conversation threading
- Content versioning and revision tracking
- Meeting notes and structured discussions
- Any scenario where "when" matters as much as "what"

---

## 🙏 **Acknowledgments**

- **Multi User Suite Architecture** - For the platform integration capabilities
- **Roam Research Team** - For the Alpha API that enables timestamp access
- **David Vargas** - For excellent examples of code
- **Cato Minor** - For inspiring examples of CSS creativity

---

_Making time visible in collaborative knowledge work_ ⏰
