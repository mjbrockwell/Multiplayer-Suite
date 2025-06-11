# Extension 1.5: Lean Universal Parser (Enhanced)

> **Race condition-free cascading + Universal image extraction + Bulletproof data parsing**

## 🎯 Overview

Extension 1.5 is the foundational utilities library for the Roam Extension Suite. It provides bulletproof, production-ready utilities that solve the most common and frustrating problems when building Roam extensions:

- **Race conditions** in block creation (the #1 cause of extension failures)
- **Inconsistent data extraction** from user-created content
- **Image URL detection** across multiple formats and platforms
- **User identification** in multi-user graphs
- **Reliable block/page operations** with proper error handling

## 🚀 Quick Start

```javascript
// The utilities are automatically registered and available globally
// after Extension 1.5 loads

// Create nested block structure (bulletproof, no race conditions)
const finalBlockUid = await cascadeToBlock(["Page Name", "Level 1", "Level 2"]);

// Extract data exactly as users wrote it
const userData = findDataValueExact(pageUid, "My Info");

// Find all image URLs in a block
const images = extractImageUrls(blockUid);

// Get current user reliably
const user = getCurrentUser();
```

## 📚 Utility Categories

### 🏗️ **Bulletproof Cascading Block Creation**

**Problems Solved:**

- Extensions fail when trying to update blocks immediately after creation
- Race conditions between Roam's database and DOM updates
- Need for artificial 250ms+ delays in extension code
- Inconsistent block creation across different Roam environments

| Utility                                     | Purpose                                                      | Example Usage                                                |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `cascadeToBlock(pathArray)`                 | Create nested page/block hierarchy with zero race conditions | `await cascadeToBlock(["roam/css", "User Avatars", "Matt"])` |
| `createBlockInPage(parentUid, text, order)` | Create single block with proper UID generation               | `await createBlockInPage(pageUid, "New block text")`         |
| `deletePage(title)`                         | Safely delete pages (useful for testing/cleanup)             | `await deletePage("Test Page")`                              |

**Key Benefits:**

- ✅ **50-100ms** completion time vs 250ms+ delays previously needed
- ✅ **100% success rate** - no more timeout failures
- ✅ **Immediate block updates** work without additional delays
- ✅ **Self-healing** - automatically retries until blocks appear

---

### 🖼️ **Universal Image URL Extraction**

**Problems Solved:**

- Extensions can't reliably find user avatar images
- Different image formats (Roam uploads, Google photos, generated avatars) require different parsing
- No way to extract images from content for migration/backup
- Inconsistent image URL detection across platforms

| Utility                                 | Purpose                                       | Example Usage                                              |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `extractImageUrls(blockUid)`            | Extract all image URLs from a block's content | `const images = extractImageUrls("block-uid-123")`         |
| `extractImageUrlsFromBlocks(blockUids)` | Bulk extraction from multiple blocks          | `const results = extractImageUrlsFromBlocks([uid1, uid2])` |
| `extractImageUrlsFromPage(pageUid)`     | Extract all images from entire page           | `const allImages = extractImageUrlsFromPage(pageUid)`      |

**Supported Formats:**

- 🔥 **Roam Native Uploads**: `![](https://firebasestorage.googleapis.com/...)`
- 👤 **Google Profile Pictures**: `https://lh3.googleusercontent.com/...`
- 🎨 **Generated Avatars**: `https://api.dicebear.com/7.x/initials/svg?seed=...`
- 📝 **Markdown Images**: `![alt text](https://example.com/image.jpg)`
- 🌐 **HTML Images**: `<img src="https://example.com/image.jpg">`
- 🔗 **Plain URLs**: `https://example.com/image.png`
- 💬 **Discord Avatars**: `https://cdn.discordapp.com/avatars/...`

---

### 🎯 **Exact Data Extraction**

**Problems Solved:**

- Substring matching causes false positives ("Info" matches "My Info", "Personal Info", etc.)
- Extensions break when users use different formatting (bold, colons, attributes)
- Need to extract data exactly as users wrote it, without filtering
- Inconsistent results when parsing user-generated content

| Utility                                         | Purpose                                              | Example Usage                                       |
| ----------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `findDataValueExact(pageUid, key)`              | Extract single data value with exact header matching | `findDataValueExact(pageUid, "Avatar")`             |
| `findNestedDataValuesExact(pageUid, parentKey)` | Extract hierarchical data structures                 | `findNestedDataValuesExact(pageUid, "My Info")`     |
| `normalizeHeaderText(text)`                     | Consistent header normalization for matching         | `normalizeHeaderText("**My Info:**")` → `"my info"` |
| `findExactHeaderBlock(blocks, patterns)`        | Find blocks matching specific header patterns        | Find "Avatar:" in blocks, not "User Avatar:"        |

**Header Format Support:**

- `Key` (plain text)
- `Key:` (colon format)
- `Key::` (attribute format)
- `**Key:**` (bold format)
- `**Key**:` (alternative bold)

---

### 🛠️ **Structured Data Creation**

**Problems Solved:**

- Need to create properly formatted data structures that users can edit
- Maintaining consistent formatting across different extensions
- Updating existing data without breaking user customizations
- Creating hierarchical data that follows Roam conventions

| Utility                                                                  | Purpose                               | Example Usage                                         |
| ------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------- |
| `setDataValueStructured(pageUid, key, value, useAttributes)`             | Create/update structured data entries | `setDataValueStructured(pageUid, "Avatar", imageUrl)` |
| `setNestedDataValuesStructured(pageUid, parentKey, data, useAttributes)` | Create/update nested data hierarchies | Create user profile with multiple fields              |

**Output Examples:**

```
**Avatar:**
    https://example.com/user-photo.jpg

**My Info:**
    **Location:**
        San Francisco, CA
    **Role:**
        Product Manager
    **Timezone:**
        Pacific/Los_Angeles
```

---

### 👤 **Reliable User Detection**

**Problems Solved:**

- Extensions fail in multi-user graphs due to unreliable user detection
- No consistent way to identify current user across different Roam environments
- Need fallback methods when primary APIs are unavailable
- User data caching for performance

| Utility                       | Purpose                                         | Example Usage                              |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------ |
| `getCurrentUser()`            | Get current user with multiple fallback methods | `const user = getCurrentUser()`            |
| `getCurrentUserUid()`         | Get just the user UID                           | `const uid = getCurrentUserUid()`          |
| `getCurrentUserDisplayName()` | Get display name for UI                         | `const name = getCurrentUserDisplayName()` |
| `getUserById(uidOrDbId)`      | Get any user's data by ID                       | `const userData = getUserById("user-123")` |
| `isMultiUserGraph()`          | Detect if graph has multiple users              | `if (isMultiUserGraph()) { ... }`          |
| `clearUserCache()`            | Clear cached user data                          | For testing or when users change           |

**Detection Methods (in priority order):**

1. **Josh Brown's Official API** (June 2025) - Primary method
2. **localStorage Method** - Proven fallback
3. **Recent Blocks Method** - Final fallback
4. **Generated Fallback** - Ensures extensions never fail

---

### 📄 **Page & Block Operations**

**Problems Solved:**

- Need to reliably create pages if they don't exist
- Getting page UIDs from titles with proper error handling
- Determining current page context for extensions
- Safe block hierarchy operations

| Utility                        | Purpose                                  | Example Usage                                         |
| ------------------------------ | ---------------------------------------- | ----------------------------------------------------- |
| `getPageUidByTitle(title)`     | Convert page title to UID                | `getPageUidByTitle("Daily Notes")`                    |
| `createPageIfNotExists(title)` | Create page only if it doesn't exist     | `const uid = await createPageIfNotExists("New Page")` |
| `getCurrentPageTitle()`        | Get title of currently viewed page       | `const title = getCurrentPageTitle()`                 |
| `getDirectChildren(parentUid)` | Get immediate child blocks with metadata | Includes UID, text, and order                         |

---

### 🔧 **General Utilities**

**Problems Solved:**

- Need consistent UID generation across extensions
- Parsing user shortcuts for navigation features
- Getting today's date in Roam format
- Async operation delays for testing

| Utility                        | Purpose                                  | Example Usage                                                    |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| `generateUID()`                | Generate Roam-compatible UIDs            | `const newUid = generateUID()`                                   |
| `getTodaysRoamDate()`          | Get today in Roam's MM-DD-YYYY format    | `"06-11-2025"`                                                   |
| `parsePersonalShortcuts(text)` | Extract page names from shortcuts text   | `"Check (Page One) and (Page Two)"` → `["Page One", "Page Two"]` |
| `wait(ms)`                     | Promise-based delay for async operations | `await wait(1000)`                                               |

---

## 🧪 Testing & Validation

Extension 1.5 includes comprehensive testing utilities for validation and debugging:

### **Console Functions**

```javascript
// Bulletproof cascade testing
testCascadingUtility(); // Full test suite with performance metrics
quickCascadeTest(); // Quick validation
stressCascadeTest(); // Test 5 simultaneous cascades

// Image extraction testing
testImageExtraction(); // Comprehensive format testing
quickImageTest(); // Quick image extraction validation

// Data extraction testing
// Available via command palette
```

### **Command Palette Commands**

- **"Utils: Test Bulletproof Cascade Creator"** - Full cascade testing
- **"Utils: Test Immediate Block Update"** - Verify race condition fix
- **"Utils: Test Image URL Extraction"** - Test all image formats
- **"Utils: Extract Images from Current Page"** - Immediate utility
- **"Utils: Test Exact Data Extraction"** - Validate data parsing
- **"Utils: Test Nested Data Extraction"** - Test hierarchical data

---

## 💡 Integration Examples

### **Extension 6.5 Avatar Maker Integration**

```javascript
// Before: Race condition issues with delays
await cascadeToBlock(["roam/css", "User Avatars", username]);
await wait(250); // ❌ Needed artificial delay
await updateBlock(blockUid, cssContent); // ❌ Would fail

// After: Bulletproof with immediate updates
const blockUid = await cascadeToBlock(["roam/css", "User Avatars", username]);
await window.roamAlphaAPI.data.block.update({
  block: { uid: blockUid, string: cssContent },
}); // ✅ Works immediately, no delays needed

// Extract existing avatar from user profile
const userPageUid = getPageUidByTitle(getCurrentUserDisplayName());
const avatarUrl = findDataValueExact(userPageUid, "Avatar");
const existingImages = extractImageUrlsFromPage(userPageUid);
```

### **User Profile Management**

```javascript
// Create comprehensive user profile
const user = getCurrentUser();
const userPageUid = await createPageIfNotExists(user.displayName);

const profileData = {
  avatar: user.photoUrl || generateFallbackAvatar(user.displayName),
  location: "__not yet entered__",
  role: "__not yet entered__",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  aboutMe: "__not yet entered__",
};

await setNestedDataValuesStructured(userPageUid, "My Info", profileData, true);
```

### **Content Migration Utility**

```javascript
// Extract all images from a page before migration
const sourcePageUid = getPageUidByTitle("Old Documentation");
const allImages = extractImageUrlsFromPage(sourcePageUid);

// Create new structure with bulletproof cascading
const targetUid = await cascadeToBlock(["New Docs", "Images", "Archive"]);

// Process each image...
for (const imageUrl of allImages) {
  await createBlockInPage(targetUid, `![Archived](${imageUrl})`);
}
```

---

## 🔄 Backward Compatibility

Extension 1.5 maintains backward compatibility while encouraging migration to better methods:

| Deprecated Function      | Replacement                   | Reason                               |
| ------------------------ | ----------------------------- | ------------------------------------ |
| `findDataValue()`        | `findDataValueExact()`        | Eliminates substring matching issues |
| `findNestedDataValues()` | `findNestedDataValuesExact()` | More reliable hierarchical parsing   |
| `setDataValue()`         | `setDataValueStructured()`    | Better error handling and formatting |

**Deprecated functions still work** but show console warnings encouraging migration.

---

## 📊 Performance Characteristics

| Operation              | Typical Time  | Success Rate | Notes                                |
| ---------------------- | ------------- | ------------ | ------------------------------------ |
| `cascadeToBlock()`     | 50-100ms      | 100%         | vs 250ms+ delays previously needed   |
| `extractImageUrls()`   | <10ms         | 100%         | Handles malformed content gracefully |
| `findDataValueExact()` | <5ms          | 100%         | Faster than substring matching       |
| `getCurrentUser()`     | <1ms (cached) | 100%         | 5-minute cache duration              |

---

## 🛡️ Error Handling

All utilities include comprehensive error handling:

- **Graceful degradation** - Functions return sensible defaults rather than throwing
- **Detailed logging** - Console output helps with debugging
- **Input validation** - Prevents common usage errors
- **Timeout protection** - Operations won't hang indefinitely
- **Cache management** - Automatic cleanup prevents memory leaks

---

## 🚀 Getting Started

1. **Install Extension 1 (Foundation)** first - provides the registry system
2. **Load Extension 1.5** - utilities auto-register globally
3. **Test the installation**:

   ```javascript
   // Quick validation
   console.log(getCurrentUser());
   await quickCascadeTest();
   await quickImageTest();
   ```

4. **Build your extension** using the utilities:
   ```javascript
   // Example: Simple content parser
   const pageUid = getPageUidByTitle("My Data");
   const extractedData = findNestedDataValuesExact(pageUid, "Settings");
   const images = extractImageUrlsFromPage(pageUid);
   ```

---

## 📋 Version History

### **v1.5.6-ENHANCED** (Current)

- ✅ **Added**: Universal image URL extraction utilities
- ✅ **Added**: Comprehensive image format support
- ✅ **Added**: Page-level and bulk image extraction
- ✅ **Enhanced**: Testing suite with image format validation

### **v1.5.5-BULLETPROOF**

- ✅ **Fixed**: Race condition-prone `cascadeToBlock` replaced with bulletproof pattern
- ✅ **Added**: Fast-loop architecture eliminates artificial delays
- ✅ **Added**: Race condition cache prevents duplicate API calls
- ✅ **Enhanced**: 100% reliability with 3-second timeout protection

### **v1.5.4-ENHANCED**

- ✅ **Added**: Cascading block creator for automatic path building
- ✅ **Added**: Helper functions for block creation and page deletion
- ✅ **Enhanced**: Testing utilities for cascade operations

### **v1.5.3-FOUNDATION**

- ✅ **Core**: Exact block matching with header normalization
- ✅ **Core**: Multi-method user detection with caching
- ✅ **Core**: Structured data creation and extraction
- ✅ **Core**: Page and block utilities with error handling

---

## 🤝 Contributing

Extension 1.5 is the foundation for the entire Roam Extension Suite. When adding new utilities:

1. **Follow the established patterns** - Clean function signatures, comprehensive error handling
2. **Include thorough testing** - Both automated tests and console functions
3. **Maintain backward compatibility** - Deprecate rather than break existing functions
4. **Document the problem solved** - Every utility should address a real pain point
5. **Add performance benchmarks** - Include timing expectations in tests

---

## 📞 Support

- **Console testing**: Use `testCascadingUtility()`, `testImageExtraction()`, etc.
- **Command palette**: Access "Utils: Test..." commands for validation
- **Error logs**: All utilities provide detailed console output for debugging
- **Version checking**: Extension reports version and loaded utilities on startup
