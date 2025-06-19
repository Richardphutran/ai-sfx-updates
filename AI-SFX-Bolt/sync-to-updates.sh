#!/bin/bash

# Clean sync script to push only production files to updates repository
echo "🧹 Syncing CLEAN production files to updates repository..."

# Create a temporary clean directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temp directory: $TEMP_DIR"

# Copy only production files (FLAT structure - no AI-SFX-Bolt parent folder)
echo "📋 Copying production files..."

# Core plugin files (flat in root)
cp -r "src" "$TEMP_DIR/"
cp "package.json" "$TEMP_DIR/"
cp "vite.config.ts" "$TEMP_DIR/"
cp "tsconfig.json" "$TEMP_DIR/"
cp "cep.config.ts" "$TEMP_DIR/"

# GitHub Actions workflow
mkdir -p "$TEMP_DIR/.github/workflows"
cp ".github/workflows/release.yml" "$TEMP_DIR/.github/workflows/"

# Essential root files
cat > "$TEMP_DIR/README.md" << 'EOF'
# AI SFX Generator

Professional AI-powered sound effects generator for Adobe Premiere Pro.

## Installation
1. Download the latest .zxp file from [Releases](../../releases)
2. Close Premiere Pro
3. Double-click the .zxp file to install via Adobe Extension Manager
4. Restart Premiere Pro

## Requirements
- Adobe Premiere Pro 2020-2025
- Valid license key

## Support
For support and licensing, contact: [your-email@domain.com]
EOF

# Production .gitignore
cat > "$TEMP_DIR/.gitignore" << 'EOF'
# Build outputs
dist/
node_modules/

# Environment files
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/

# Development files (keep this repo clean)
*.log
.tmp/
EOF

# Change to temp directory and initialize git
cd "$TEMP_DIR"
git init
git add .
git commit -m "Clean production release for AI SFX Generator v1.1.0

✅ Only production files included
❌ No development files
🔒 Ready for secure distribution"

# Force push to updates repository (this will overwrite everything)
git remote add updates https://github.com/Richardphutran/ai-sfx-updates.git
git branch -M main
git push -f updates main

echo "✅ Clean sync complete!"
echo "🔗 Check: https://github.com/Richardphutran/ai-sfx-updates"

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"
echo "🗑️ Temp directory cleaned up"