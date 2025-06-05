#!/bin/bash
# CEP Debug Setup Script for macOS

echo "Setting up CEP debug mode for AI SFX Generator plugin..."

# Enable CEP debug mode for different versions
echo "Enabling CEP PlayerDebugMode..."
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1

# Set CEP LogLevel to debug for detailed logs
echo "Setting CEP LogLevel to debug..."
defaults write com.adobe.CSXS.12 LogLevel 6
defaults write com.adobe.CSXS.11 LogLevel 6
defaults write com.adobe.CSXS.10 LogLevel 6
defaults write com.adobe.CSXS.9 LogLevel 6

# Get current directory
PLUGIN_DIR="$(pwd)"
SYSTEM_EXTENSIONS_DIR="/Library/Application Support/Adobe/CEP/extensions"
USER_EXTENSIONS_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"

echo "Plugin directory: $PLUGIN_DIR"
echo "System extensions directory: $SYSTEM_EXTENSIONS_DIR"
echo "User extensions directory: $USER_EXTENSIONS_DIR"

# Create symlink in user extensions directory if it doesn't exist
LINK_PATH="$USER_EXTENSIONS_DIR/AI-SFX-Generator"
if [ ! -L "$LINK_PATH" ] && [ ! -d "$LINK_PATH" ]; then
    echo "Creating symlink to user extensions directory..."
    mkdir -p "$USER_EXTENSIONS_DIR"
    ln -sf "$PLUGIN_DIR" "$LINK_PATH"
    echo "Symlink created: $LINK_PATH -> $PLUGIN_DIR"
else
    echo "Extension already exists in user extensions directory"
fi

# Check if extension exists in system directory
SYSTEM_LINK_PATH="$SYSTEM_EXTENSIONS_DIR/AI-SFX-Generator"
if [ -L "$SYSTEM_LINK_PATH" ] || [ -d "$SYSTEM_LINK_PATH" ]; then
    echo "Extension found in system directory: $SYSTEM_LINK_PATH"
fi

echo ""
echo "CEP Debug setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Premiere Pro"
echo "2. Go to Window > Extensions > AI SFX Generator"
echo "3. If not visible, check that unsigned extensions are allowed"
echo "4. Open debug.html for ExtendScript testing"
echo "5. Use Chrome DevTools at http://localhost:9223 for debugging"
echo ""
echo "Troubleshooting:"
echo "- Check ~/Library/Logs/CSXS/ for CEP logs"
echo "- Verify manifest.xml syntax is correct"
echo "- Test with debug.html for ExtendScript connection"