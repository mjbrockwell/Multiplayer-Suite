# 🌳 Smart Username Tagger

> **Intelligent, non-intrusive conversation tagging for Roam Research multiuser environments**

Automatically adds `#ts0 #[[username]]` tags to conversation messages when users finish typing, creating a clean timeline of who said what without interrupting the writing flow.

## 🎯 **What It Does**

The Smart Username Tagger enhances conversation blocks (marked with `#ch0`) by:

- **🕐 Smart Timing** - Tags messages only when users are "done" (focus loss + 2s delay, or immediate on Enter)
- **👤 Author Detection** - Automatically identifies who wrote each message
- **🎯 Conversation Focus** - Only processes direct children of `#ch0` blocks
- **🔄 Non-Intrusive** - Never interrupts active editing or typing
- **🛡️ Robust Operation** - Graceful fallbacks and error handling

### **Before & After Example**

```
# Before (Raw conversation)
#ch0 Daily Standup - June 20, 2025
    Hey team, how's the project going?
    Making good progress on the user auth system
    Awesome! Any blockers?
    Nothing major, just some API rate limiting to figure out

# After (Tagged conversation)
#ch0 Daily Standup - June 20, 2025
    #ts0 #[[Matt Brockwell]]  ▸  Hey team, how's the project going?
    #ts0 #[[Alice Chen]]  ▸  Making good progress on the user auth system
    #ts0 #[[Matt Brockwell]]  ▸  Awesome! Any blockers?
    #ts0 #[[Alice Chen]]  ▸  Nothing major, just some API rate limiting to figure out
```

## 🚀 **Quick Start**

### **Installation**

1. **Add to Roam**: Copy the extension code to your Roam Research `roam/js` directory
2. **Enable Extension**: Activate in Roam's extension settings
3. **Start Conversations**: Create blocks with `#ch0` tag and start typing

### **Basic Usage**

1. **Create Conversation Block**: Add `#ch0` tag to any block

   ```
   #ch0 Meeting Notes - June 20, 2025
   ```

2. **Add Messages**: Create child blocks and type your messages

   ```
   #ch0 Meeting Notes - June 20, 2025
       Your message here...
       Another person's message...
   ```

3. **Auto-Tagging**: Tags are added automatically when you:
   - **Press Enter** (immediate tagging)
   - **Click away** from the block (2-second delay)
   - **Navigate to another page** (processes pending blocks)

## ⚙️ **Configuration**

### **Extension Settings**

Access via **Roam Settings → Extensions → Smart Username Tagger**:

| Setting                            | Default     | Description                                       |
| ---------------------------------- | ----------- | ------------------------------------------------- |
| **Process existing conversations** | `true`      | Tag existing messages when extension loads        |
| **Idle delay**                     | `2 seconds` | Wait time after focus loss before tagging         |
| **Validate membership**            | `false`     | Check users against member directory              |
| **Use utilities**                  | `true`      | Enable enhanced functionality via utilities suite |

### **Per-User Preferences** 🆕

Create a `Smart Tagger Settings::` block on your user page for personalized behavior:

```
Your Name
    Smart Tagger Settings::
        enableTagging:: true
        idleDelay:: 3000
        validateMembership:: true
```

**Available User Settings:**

- `enableTagging` - Enable/disable tagging for this user
- `idleDelay` - Custom delay in milliseconds
- `validateMembership` - Validate against member directory
- `processExistingOnLoad` - Process existing conversations on startup

## 🔧 **Utilities Suite Integration**

The enhanced version integrates with the **Utilities Suite** for improved functionality:

### **Enhanced User Detection**

- **Primary**: Block author detection via Roam API
- **Fallback**: Current user detection via utilities
- **Validation**: Optional member directory checking

### **Robust Block Operations**

- **Primary**: Utilities `updateBlock()` with retry logic
- **Fallback**: Direct Roam API calls
- **Benefits**: Better error handling and reliability

### **Member Directory Integration**

```
roam/graph members
    Directory::
        Matt Brockwell
        Alice Chen
        Bob Wilson
```

When enabled, validates users against this directory for cleaner tagging.

## 🎛️ **How It Works**

### **Smart Timing Logic**

The extension uses sophisticated timing to avoid interrupting users:

```javascript
// Immediate tagging on Enter
if (event.key === "Enter") {
  processBlock(blockUid); // No delay
}

// Delayed tagging on focus loss
if (blockLostFocus) {
  setTimeout(() => processBlock(blockUid), 2000);
}
```

### **Conversation Detection**

Only processes blocks that are **direct children** of `#ch0` blocks:

```
#ch0 Conversation Topic
    ✅ This gets tagged (direct child)
        ❌ This doesn't (nested child)
    ✅ This gets tagged (direct child)
```

### **Edit Mode Protection**

Never tags blocks that are currently being edited:

- Active cursor in block
- Block has edit mode classes
- Contains focused input elements

## 🔍 **Troubleshooting**

### **Tags Not Appearing**

1. **Check Conversation Structure**:

   ```
   ✅ Correct: #ch0 → Direct child blocks
   ❌ Wrong: #ch0 → Parent → Child blocks (nested)
   ```

2. **Verify User Detection**:

   - Check browser console for "Smart Tagger:" messages
   - Ensure you're logged into Roam properly
   - Try enabling utilities integration

3. **Check Extension Status**:
   - Extension enabled in Roam settings
   - No JavaScript errors in console
   - User preferences allow tagging

### **Delayed Tagging**

**Normal Behavior**: 2-second delay after losing focus allows for:

- Quick edits and corrections
- Non-intrusive operation
- Smooth conversation flow

**Immediate Tagging**: Press Enter for instant tagging when done with a message.

### **User Not Detected**

**Possible Causes**:

- User not logged in properly
- Block creation metadata missing
- Utilities suite not available

**Solutions**:

1. Check console for error messages
2. Enable utilities integration for fallback user detection
3. Verify member directory setup (if validation enabled)

## 🧪 **Testing & Development**

### **Console Commands**

Access via browser console (F12):

```javascript
// Test user detection
const currentUser = window._extensionRegistry.utilities.getCurrentUser();
console.log("Current user:", currentUser);

// Test member list
const members = window._extensionRegistry.utilities.getGraphMembersFromList();
console.log("Graph members:", members);

// Check extension status
console.log("Smart Tagger running:", !!window.smartTagger);
```

### **Debug Mode**

Enable detailed logging by opening browser console - the extension logs all operations:

```
Smart Tagger: Block abc123 lost focus, adding to pending queue
Smart Tagger: Processing 1 pending blocks...
Smart Tagger: ✅ Added #ts0 #[[Matt Brockwell]] to block abc123
```

## 🔗 **Integration with Other Extensions**

### **Multiuser Suite Compatibility**

Works seamlessly with other multiuser extensions:

- **Member Directory** - Validates users against centralized list
- **User Preferences** - Respects per-user tagging settings
- **Timezone Manager** - Could integrate timestamp formatting (future)
- **Modal Utilities** - Could use for settings UI (future)

### **Extension API**

The extension exposes utilities for other extensions:

```javascript
// Check if block is in conversation
const isConversation = smartTagger.isInConversation(blockElement);

// Manually process a block
await smartTagger.processBlock(blockUid);

// Get processing status
const isPending = smartTagger.isPending(blockUid);
```

## 📊 **Performance Notes**

### **Optimizations**

- **Lazy Processing**: Only processes conversation blocks
- **Smart Caching**: Remembers already-processed blocks
- **Efficient Queries**: Minimal Roam API calls
- **Event Throttling**: Intelligent timing prevents spam

### **Resource Usage**

- **Memory**: Minimal (Set of processed block UIDs)
- **CPU**: Only active during conversation editing
- **Network**: No external requests
- **Storage**: User preferences only

## 🛠️ **Advanced Configuration**

### **Custom Tag Format**

To modify the tag format, edit the `addUsernameTag` function:

```javascript
// Current format: #ts0 #[[username]]  ▸  content
const newContent = `#ts0 #[[${username}]]  ▸  ${currentContent}`;

// Custom format examples:
const newContent = `[${username}] ${currentContent}`; // Simple brackets
const newContent = `#[[${username}]] - ${currentContent}`; // Page link with dash
const newContent = `@${username}: ${currentContent}`; // @mention style
```

### **Custom Conversation Tags**

Change conversation detection by modifying the selector:

```javascript
// Current: looks for #ch0 tags
current.querySelector('.rm-page-ref[data-tag="ch0"]');

// Custom: use different tags
current.querySelector('.rm-page-ref[data-tag="meeting"]'); // #meeting
current.querySelector('.rm-page-ref[data-tag="chat"]'); // #chat
```

## 📝 **Changelog**

### **v2.0.0 - Enhanced Edition**

- ✅ Utilities suite integration
- ✅ Per-user preferences support
- ✅ Member directory validation
- ✅ Robust error handling and fallbacks
- ✅ Enhanced user detection
- ✅ Better configuration options

### **v1.0.0 - Original Release**

- ✅ Basic conversation tagging
- ✅ Smart timing logic
- ✅ Edit mode protection
- ✅ Conversation context detection

## 🤝 **Contributing**

### **Bug Reports**

Please include:

1. Roam Research version
2. Extension console logs
3. Steps to reproduce
4. Expected vs actual behavior

### **Feature Requests**

Consider:

- Use case and justification
- Backward compatibility
- Performance implications
- Integration with existing features

## 📄 **License**

MIT License - See LICENSE file for details.

## 🙏 **Acknowledgments**

- **Roam Research** - For the amazing platform
- **Roam Community** - For inspiration and feedback
- **Multiuser Suite** - For utilities and integration patterns

---

**Made with ❤️ for the Roam Research multiuser community**
