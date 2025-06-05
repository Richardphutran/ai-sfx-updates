# CEP Debugging Setup

**Status:** ✅ ESSENTIAL
**Platform:** macOS (adapt for Windows)

## Enable CEP Debugging

```bash
# Allow unsigned extensions
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

# Enhanced debugging
defaults write com.adobe.CSXS.11 LogLevel 6
defaults write com.adobe.CSXS.11 CSXSAllowUnsignedExtensions 1
```

## Chrome DevTools Access

### 1. The .debug File (CRITICAL)
Must exist in plugin root with correct port:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.yourcompany.pluginid" Port="7002"/>
</ExtensionList>
```

### 2. Access DevTools
- Open Chrome: `http://localhost:7002`
- If not working: Check .debug file exists
- Restart Premiere Pro after changes

## Symlink Development Setup

```bash
# Remove copied plugin
sudo rm -rf "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"

# Create symlink to dev folder
sudo ln -s "/path/to/your/plugin" "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"
```

## Common Issues

### "No debug port file found"
- .debug is a hidden file
- May not copy with symlink
- Manually copy: `sudo cp .debug "/Library/Application Support/Adobe/CEP/extensions/YourPlugin/"`

### DevTools won't connect
1. Check .debug file Extension Id matches manifest.xml
2. Verify port not in use: `lsof -i :7002`
3. Restart Premiere Pro completely
4. Try different port (7003, 7004, etc.)