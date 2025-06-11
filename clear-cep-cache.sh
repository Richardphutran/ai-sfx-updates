#!/bin/bash
# Clear ALL CEP caches to force fresh load

echo "🧹 Clearing ALL CEP caches..."

# Kill any CEP processes
echo "🔫 Killing CEP processes..."
pkill -f "CEPHtmlEngine" 2>/dev/null || true
pkill -f "Adobe Premiere Pro" 2>/dev/null || true

# Clear all caches
echo "🗑️  Removing cache directories..."
rm -rf ~/Library/Caches/CSXS/
rm -rf ~/Library/Caches/Adobe/
rm -rf ~/Library/Logs/CSXS/
rm -rf "$HOME/Library/Application Support/Adobe/Common/Media Cache Files"

# Remove CEP preference files that might cache ports
echo "🗑️  Removing CEP preferences..."
rm -rf ~/Library/Preferences/com.adobe.CSXS.*.plist
rm -rf ~/Library/Preferences/Adobe/CEP/

echo "✅ All caches cleared!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./start-bulletproof.sh"
echo "2. Start Premiere Pro"
echo "3. Load extension: Window > Extensions > AI Dialogue Editor (bolt)"
echo "4. Debug console will be at: http://localhost:8870"
echo "5. Your extension will load from: http://localhost:3040"