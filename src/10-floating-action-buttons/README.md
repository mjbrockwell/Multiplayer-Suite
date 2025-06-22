# Floating Message Actions for Roam Research

A lightweight Roam Research extension that adds Slack-style floating action buttons to conversation messages. Hover over any message block to reveal emoji reaction and delete options.

## ✨ Features

- **Slack-style Interaction**: Hover over any message block to reveal floating action buttons
- **Emoji Reactions**: Quick access to Roam's emoji reaction system via heart button
- **Message Deletion**: Soft delete your own messages with confirmation
- **Smart User Detection**: Delete button only appears on your own messages
- **Non-intrusive Design**: Buttons only appear on hover and don't modify existing content
- **Smooth Animations**: Professional fade-in/fade-out effects with hover delays

## 🎯 How It Works

The extension automatically detects conversation message blocks by looking for `#[[username]]` tags (typically added by username tagger extensions). When you hover over these blocks, floating action buttons appear in the top-right corner.

### Action Buttons

- **❤️ Emoji Button**: Click to open Roam's emoji reaction menu
- **× Delete Button**: Soft delete your own messages (replaces content with deletion marker)

## 📦 Installation

1. Download the `extension.js` file
2. In Roam Research, go to Settings → Extensions
3. Click "Add Extension" and upload the file
4. Enable the extension

## ⚙️ Configuration

The extension includes configurable settings accessible through Roam's extension settings panel:

- **Show emoji button for all messages**: Display emoji reaction button on all messages
- **Hover delay (ms)**: Adjust delay before buttons appear (default: 100ms, prevents flickering)

## 🔗 Dependencies

This extension is designed to work with blocks that contain `#[[username]]` tags. It pairs perfectly with:

- **Smart Username Tagger Extension**: Automatically adds username tags to conversation messages
- **Conversation UI Extensions**: Other conversation enhancement tools

_Note: The extension will work with any blocks containing `#[[username]]` patterns, regardless of how they were created._

## 🚀 Usage

1. **Setup Conversations**: Ensure your conversation blocks contain `#[[username]]` tags
2. **Hover to Interact**: Move your mouse over any message block
3. **Add Reactions**: Click the heart button to add emoji reactions
4. **Delete Messages**: Click the × button to soft delete your own messages

### Message Deletion

- Only appears on your own messages (detected via Roam's user system)
- Shows confirmation dialog before deletion
- Replaces message content with `"__content deleted by author__"`
- Cannot be undone (soft delete preserves block structure)

## 🎨 Visual Design

- **Floating Panel**: Clean white background with subtle shadow
- **Smart Positioning**: Positioned to avoid Roam's existing comment button
- **Responsive Animations**: Smooth transitions and hover effects
- **Accessibility**: Clear button states and hover feedback

## 🛠️ Technical Details

### Performance Features

- **Lightweight**: Only processes blocks with username tags
- **Event-driven**: No continuous DOM monitoring
- **On-demand UI**: Buttons created only when needed
- **Clean Cleanup**: Properly removes all elements and listeners on unload

### Browser Compatibility

- Works in all modern browsers that support Roam Research
- Uses standard DOM APIs for maximum compatibility

## 🐛 Troubleshooting

### Buttons Don't Appear

- Ensure blocks contain `#[[username]]` tag patterns
- Check that extension is enabled in Roam settings
- Try refreshing the page

### Delete Button Missing

- Delete button only appears on your own messages
- Extension needs to detect current user (may take a moment on first load)

### Emoji Menu Not Opening

- Ensure Roam's emoji reaction feature is available
- Try right-clicking the block bullet point manually to test

### Performance Issues

- Increase hover delay in settings to reduce button flickering
- Check browser console for error messages

## 🔧 Development

### Code Structure

```
extension.js
├── User Detection (getCurrentUser, getBlockAuthor)
├── Block Analysis (getBlockUidFromDOM, username tag detection)
├── UI Creation (createFloatingButtons, animations)
├── Event Handling (hover listeners, click handlers)
├── Roam Integration (emoji menu, soft delete)
└── Lifecycle Management (setup, cleanup)
```

### Extending the Extension

The extension is designed to be modular. Key functions can be reused:

- `getCurrentUser()`: Detect current Roam user
- `getBlockAuthor()`: Get block creation user
- `triggerEmojiMenu()`: Open Roam's emoji menu
- `softDeleteBlock()`: Perform soft deletion

## 📝 Changelog

### v1.0.0

- Initial release
- Slack-style floating action buttons
- Emoji reaction integration
- Soft delete functionality
- Configurable hover delays

## 🤝 Contributing

Contributions welcome! Please:

1. Test thoroughly in Roam Research
2. Follow existing code style and structure
3. Update README for any new features
4. Consider backward compatibility

## 📄 License

MIT License - feel free to modify and distribute.

## 🙏 Credits

- Built for the Roam Research community
- Inspired by Slack's message interaction design
- Integrates with existing Roam conversation tools

---

**Need help?** Open an issue or reach out to the Roam Research community for support.
