# 👥 User Directory + Timezones - Extension 6

**Professional Team Overview with Real-Time Intelligence**

> _Elegant user directory with live timezones, smart avatars, and independent navigation for the Multi User Suite_

---

## ✨ **What It Does**

Extension 6 creates a beautiful, professional user directory that displays your team members with real-time timezone information, profile completeness indicators, and smart avatar extraction. It provides an elegant modal interface accessible via a clean yellow navigation button.

### 🎯 **Core Value**

- **🌍 Live Timezones** - Real-time clock updates showing current time for each team member
- **🖼️ Smart Avatars** - Fresh image extraction with automatic fallback to elegant initials
- **📊 Profile Analysis** - Visual completeness indicators and structured data display
- **🎨 Professional Interface** - Clean modal with sortable table and hover effects
- **🔘 Independent Navigation** - Stable yellow button with zero extension conflicts
- **📋 Curated Members** - Uses "roam/graph members" page for team organization

---

## 🚀 **Quick Start**

### **Installation**

1. **Prerequisites**: Load Extensions 1, 1.5, 2, and 3 first for full functionality
2. **Load Extension** - Standard developer mode installation
3. **Look for Button** - Clean yellow "👥 User Directory" button appears automatically

### **Instant Access**

- **Click Button** → Opens professional user directory modal
- **Cmd+P** → "User Directory: Show Directory" → Command palette access
- **Auto-Updates** → Live timezone clocks update every minute

---

## 📋 **Directory Features**

### **🏢 Professional Display**

- **User Table** - Clean interface with avatar, name, location, role, timezone
- **Real-Time Clocks** - Live time updates for each user's timezone
- **Profile Completeness** - Visual indicators (green/yellow/red dots)
- **Clickable Names** - Direct navigation to user pages
- **Current User Highlight** - "You" badge and special styling

### **🖼️ Smart Avatar System**

- **Fresh Extraction** - Real-time image queries (no caching issues)
- **Multiple Formats** - Supports markdown images and direct links
- **Elegant Fallbacks** - Beautiful gradient initials when no image
- **Live Updates** - Avatars refresh when images change mid-session

### **🌍 Timezone Intelligence**

- **Live Clocks** - Updates every minute automatically
- **Smart Detection** - Handles various timezone format inputs
- **Visual Status** - Clear indicators for missing/invalid timezones
- **Professional Display** - Monospace font for clean time alignment

---

## 🎮 **Available Commands**

Access via **Cmd+P**:

- **"User Directory: Show Directory"** - Open main directory modal
- **"User Directory: Test Extension 1.5 Integration"** - Verify utilities
- **"User Directory: Run System Tests"** - Complete functionality test
- **"User Directory: Add Show Directory Button"** - Re-add navigation button

---

## 🏗️ **Technical Architecture**

### **🔘 Independent Navigation**

- **Zero Competition** - Button creation completely independent from other extensions
- **Stable Yellow Button** - Consistent positioning and styling
- **Smart Placement** - Automatically finds optimal page location
- **Cleanup Management** - Removes competing buttons for clean interface

### **🔧 Extension 1.5 Integration**

- **Timezone Utilities** - Professional time calculation and formatting
- **Modal Framework** - Clean modal creation with proper cleanup
- **Profile Analysis** - Data extraction and completeness calculation
- **Image Processing** - Enhanced avatar extraction and validation

### **📊 Fresh Data Queries**

```javascript
// Real-time avatar extraction bypassing all caches
const avatarQuery = `[:find ?text ?uid :where ...]`;
const imageResults = window.roamAlphaAPI.data.fast.q(avatarQuery);
```

---

## 👥 **Team Setup**

### **📋 Curated Member List**

Create a page: **"roam/graph members"**

- Add block: **"Directory"**
- Add team member names as child blocks
- Extension automatically uses this curated list

### **👤 Individual User Pages**

Each user should have:

```
My Info::
├── Avatar:: ![image](url) or direct image link
├── Location:: City, Country
├── Role:: Job Title
├── Timezone:: America/New_York
└── About Me:: Brief description
```

---

## 🔧 **For Extension Developers**

### **Access Directory Services**

```javascript
const getUserProfileData = platform.getUtility("getUserProfileData");
const showUserDirectory = platform.getUtility("showUserDirectory");

// Get user profile with timezone info
const profile = await getUserProfileData(username);
console.log(`${username} current time: ${profile.timezoneInfo.timeString}`);
```

### **Available Services**

- **Profile Data**: `getUserProfileData`, `getAllUserProfiles`
- **UI Components**: `showUserDirectory`, `addNavigationButtons`
- **Testing**: `testIntegration`, `runSystemTests`

---

## 📊 **Version Info**

**Version**: 6.9.0 (as of June 20th, 2025)  
**Dependencies**: Extension 1 (Foundation), Extension 1.5 (Utilities) - partial integration  
**Status**: Production ready with independent navigation architecture

---

## 🎯 **Perfect For**

- Multi-user Roam graphs with distributed teams
- Organizations needing timezone coordination
- Teams wanting professional member overview
- Graphs requiring structured user profile management

---

## 🙏 **Acknowledgments**

- **Multi User Suite Architecture** - For the robust foundation and modal utilities

---

_Professional team coordination made elegant_ ⚡
