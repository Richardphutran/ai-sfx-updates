#!/bin/bash

echo "🧹 Clearing CEP Cache for AI SFX Plugin..."

# Kill CEPHtmlEngine to force cache clear
echo "⚡ Stopping CEPHtmlEngine..."
pkill -f CEPHtmlEngine

# Clear various CEP cache locations
echo "🗑️  Clearing cache directories..."

# Main CEP cache
rm -rf ~/Library/Application\ Support/Adobe/CEP/cache*
rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/com.ai.sfx.generator
rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/com.boltcep.cep

# CSXS caches
rm -rf ~/Library/Caches/CSXS/cep*
rm -rf ~/Library/Caches/Adobe/CEP/*

# Log files
rm -rf ~/Library/Logs/CSXS/*.log

# Premiere Pro specific caches
rm -rf ~/Library/Application\ Support/Adobe/Common/Media\ Cache*
rm -rf ~/Library/Caches/Adobe/Premiere\ Pro/*

echo "✅ CEP Cache cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Restart Premiere Pro"
echo "2. Re-open the AI SFX panel"
echo "3. The plugin will reload fresh from http://localhost:3030"