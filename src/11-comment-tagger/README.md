# Comment Auto Tagger

**Seamlessly convert Roam Research comments into conversations for better multi-user collaboration.**

## Overview

The Comment Auto Tagger automatically detects when users create comments in Roam's comment system and adds `#ch0` tags to convert them into conversation starters. This creates a more natural flow from commenting to structured conversations, especially valuable in multi-user graphs.

## ✨ Features

- **🎯 Automatic Detection**: Identifies first-level comment blocks in Roam's comment system
- **🔄 Real-time Conversion**: Adds `#ch0` tags instantly when users press Enter
- **🎨 Smart Auto-indent**: Automatically indents subsequent blocks under conversations
- **🧹 Memory Management**: Intelligent cleanup to prevent memory leaks during long sessions
- **👥 Multi-user Ready**: User-aware logging and conflict-safe operation
- **⚙️ Configurable**: Customizable settings for different workflows
- **🔧 Utility Integration**: Leverages shared utilities for robust operation

## How It Works

### Before Comment Auto Tagger:

```
📄 Page Content
├── 🔗 ((block-reference))
    └── 💬 "This is my comment about the referenced block"
```

### After Comment Auto Tagger:

```
📄 Page Content
├── 🔗 ((block-reference))
    └── 💬 #ch0 "This is my comment about the referenced block"
        └── 💭 User replies and discussions appear here
```

## Installation

### Prerequisites

- Roam Research graph with extension support
- Multi-user Extension Suite utilities (recommended)

### Setup

1. Copy the extension code to your Roam extensions
2. Enable the extension in your graph settings
3. Configure settings (optional - works with defaults)

## ⚙️ Configuration

Access settings through **Settings → Extensions → Comment Auto Tagger**

| Setting                               | Default | Description                                                       |
| ------------------------------------- | ------- | ----------------------------------------------------------------- |
| **Process existing comments on load** | `true`  | Automatically tag existing untagged comments when extension loads |
| **Auto-indent after Enter**           | `true`  | Indent new blocks under conversations for better UX               |
| **Idle delay (seconds)**              | `2`     | Wait time for focus-loss events (Enter key processes immediately) |

## 🚀 Usage

### Automatic Operation

1. Navigate to any page with block references
2. Add a comment using Roam's comment system
3. Type your comment and press **Enter**
4. Comment is instantly converted to a conversation with `#ch0`
5. Continue typing - subsequent blocks auto-indent under the conversation

### Manual Trigger

The extension also processes comments when:

- You focus away from a comment block
- You navigate to a new page
- Extension loads (for existing comments)

## 🔍 Technical Details

### Comment Detection Logic

The extension identifies comment blocks by:

1. **System Check**: Verifies block is in `roam/comments` system
2. **Level Check**: Ensures it's a first-level comment (direct child of block reference)
3. **State Check**: Confirms block isn't currently being edited
4. **Content Check**: Validates block has actual content before tagging

### Smart Processing

- **Race Condition Protection**: 300ms delay ensures Roam finishes block creation
- **Memory Management**: Periodic cleanup prevents indefinite cache growth
- **Conflict Avoidance**: Checks for existing `#ch0` tags to prevent duplicates
- **Error Recovery**: Graceful handling of API failures and edge cases

## 👥 Multi-User Benefits

### Collaboration Enhancement

- **Consistent Workflow**: All users' comments automatically become conversations
- **Reduced Friction**: No manual tagging required for conversation starters
- **User Context**: Logging includes user identification for debugging
- **Conflict Safe**: Designed to work safely when multiple users edit simultaneously

### Integration with Multi-User Suite

- **Shared Utilities**: Leverages common utilities for user detection and ID generation
- **Registry Integration**: Proper cleanup and lifecycle management
- **Logging Standards**: Consistent debug output with user context

## 🐛 Troubleshooting

### Comments Not Being Tagged

1. **Check Comment System**: Ensure you're using Roam's official comment feature
2. **Verify Settings**: Confirm extension is enabled and configured
3. **Block Level**: Extension only tags first-level comments, not nested replies
4. **Content Check**: Empty blocks won't be tagged

### Auto-indent Not Working

1. **Setting Check**: Verify "Auto-indent after Enter" is enabled
2. **Focus Check**: Ensure cursor is in the newly created block
3. **Timing Issue**: Try typing more slowly to allow block creation to complete

### Performance Issues

1. **Cache Growth**: Extension automatically cleans up old processed blocks
2. **Event Load**: Consider adjusting idle delay if experiencing lag
3. **Conflict Resolution**: Check browser console for error messages

### Debug Information

Enable browser console to see detailed logging:

```
Comment Auto Tagger [Username]: Processing comment block abc123...
Comment Auto Tagger [Username]: ✅ Successfully converted comment abc123 to conversation
```

## 🔧 Development

### Dependencies

- Roam Research API
- Multi-user Extension Suite (recommended)
- Browser with ES6+ support

### Extension Registry Integration

```javascript
// Accesses shared utilities safely
const getCurrentUser = getUtility("getCurrentUser");
const generateUID = getUtility("generateUID");

// Registers for proper cleanup
window._extensionRegistry.elements.push({
  type: "timer",
  timer: cleanupTimer,
  cleanup: () => clearInterval(cleanupTimer),
});
```

### Testing

The extension includes comprehensive testing for:

- Comment block detection accuracy
- Tag addition and deduplication
- Auto-indent functionality
- Memory management
- Multi-user scenarios

## 🤝 Contributing

This extension is part of a larger multi-user extension suite. For:

- **Bug Reports**: Include browser console output and steps to reproduce
- **Feature Requests**: Consider how changes affect multi-user workflows
- **Code Contributions**: Follow existing patterns for utility integration

## 📝 License

Part of the Multi-User Roam Extension Suite.

## 🆘 Support

For support:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify extension compatibility with your Roam setup
4. Consider conflicts with other extensions

---

**Made with ❤️ for better Roam Research collaboration**
