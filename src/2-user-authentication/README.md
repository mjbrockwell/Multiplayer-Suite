# 👥 User Authentication + Preferences - Extension 2

**Clean User Detection & Professional Preference Management**

> _Reliable user authentication and bulletproof preference storage for the Multi User Suite_

---

## ✨ **What It Does**

Extension 2 provides the essential user infrastructure that powers personalized experiences across the Multi User Suite. It handles user detection, authentication status, and manages individual user preferences with automatic page creation.

### 🎯 **Core Value**

- **🔐 Smart User Detection** - Reliable current user identification with fallback methods
- **⚙️ Professional Preferences** - Individual user preference pages with structured storage
- **🛡️ Bulletproof Creation** - Auto-creates preference pages using Extension 1.5 cascading
- **🧪 Built-in Testing** - Comprehensive test suite for validation and debugging
- **🔧 Simple API** - Clean interface for other extensions to use

---

## 🚀 **Quick Start**

### **Installation**

1. **Prerequisites**: Load Extension 1 (Foundation) and Extension 1.5 (Utilities) first
2. **Load Extension** - Standard developer mode installation
3. **Verify** - Check console for "✅ Extension 2.0: User Authentication + Preferences loaded!"

### **Instant Testing**

- **Cmd+P** → "Auth: Run All Tests" → Complete validation suite
- **Cmd+P** → "Auth: Initialize Current User Preferences" → Set up your defaults
- Check your `[Username]/user preferences` page for structured settings

---

## 📋 **Key Features**

### **🔐 User Authentication**

```javascript
const user = getAuthenticatedUser(); // Current user object
const isAuth = isUserAuthenticated(); // True if properly detected
const username = getCurrentUsername(); // Just the display name
```

### **⚙️ User Preferences**

```javascript
// Get preference with fallback
const setting = await getUserPreference(
  username,
  "Loading Page Preference",
  "Daily Page"
);

// Set preference
await setUserPreference(username, "Journal Header Color", "blue");

// Get all preferences
const allPrefs = await getAllUserPreferences(username);
```

### **🛠️ Default Preferences**

Automatically creates these settings for new users:

- **Loading Page Preference**: "Daily Page"
- **Immutable Home Page**: "yes"
- **Weekly Bundle**: "no"
- **Journal Header Color**: "blue"
- **Personal Shortcuts**: ["Daily Notes", "Chat Room"]

---

## 🎮 **Commands Available**

Access via **Cmd+P**:

- **"Auth: Run All Tests"** - Complete system validation
- **"Auth: Test Authentication"** - User detection status
- **"Auth: Initialize Current User Preferences"** - Set up defaults
- **"Auth: Export My Preferences"** - Backup current settings

---

## 🔧 **For Extension Developers**

### **Simple Integration**

```javascript
// Get utilities from platform
const getUserPreference = platform.getUtility("getUserPreference");
const getAuthenticatedUser = platform.getUtility("getAuthenticatedUser");

// Use in your extension
const user = getAuthenticatedUser();
if (user) {
  const colorPref = await getUserPreference(
    user.displayName,
    "Journal Header Color",
    "blue"
  );
  // Apply user's color preference
}
```

### **Available Utilities**

- Authentication: `getAuthenticatedUser`, `isUserAuthenticated`, `getCurrentUsername`
- Preferences: `getUserPreference`, `setUserPreference`, `getAllUserPreferences`
- Bulk Operations: `bulkSetUserPreferences`, `exportUserPreferences`
- Testing: `testAuthentication`, `testUserPreferences`, `runAllTests`

---

## 🏗️ **Architecture**

**Built on Extension 1.5** - Uses proven cascading utilities for reliable preference storage
**Multi User Ready** - Each user gets individual `[Username]/user preferences` pages  
**Auto-Creation** - Preference pages created automatically when needed
**Structured Storage** - Clean key-value preference organization

---

## 📊 **Version Info**

**Version**: 2.0.0 (as of June 20th, 2025)  
**Dependencies**: Extension 1 (Foundation Registry), Extension 1.5 (Enhanced Utilities)  
**Status**: Production ready with comprehensive testing suite

---

## 🎯 **Perfect For**

- Extensions needing user-specific settings (Extension 3: Configuration Manager)
- Features requiring user authentication (Extension 7: Journal Entry Creator)
- Multi-user graph scenarios with individual preferences
- Any extension wanting reliable user detection

---

## 🙏 **Acknowledgments**

- **Multi User Suite Architecture** - For the robust foundation utilities
- **David Vargas** - For excellent examples of user preference management patterns

---

_The user foundation that makes personalization possible_ ⚡
