#!/bin/bash
# Bulletproof startup - Structure First, Server Second
# This script ensures the correct build sequence for CEP extensions

echo "🚀 BULLETPROOF CEP STARTUP SEQUENCE"
echo "==================================="

# Step 0: Dynamic port management
echo "🔍 Managing ports dynamically..."
node dynamic-port-manager.js
echo ""

# Read port from cep.config.ts for display (may have been updated)
PORT=$(grep -o 'port:[[:space:]]*[0-9]*' cep.config.ts | grep -o '[0-9]*' | head -1)
if [ -z "$PORT" ]; then
    echo "❌ ERROR: Could not read port from cep.config.ts"
    exit 1
fi

echo "📍 Using port: $PORT"
echo ""

# Step 1: Kill any existing processes on our port
echo "🔫 Clearing port $PORT..."
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true

# Step 2: Build the extension structure
echo "🏗️  Step 1: Building structure (generates manifest.xml)..."
# Use vite build directly to avoid TypeScript errors
if ! npx vite build --mode development; then
    echo "❌ ERROR: Build failed. Cannot proceed."
    exit 1
fi

# DO NOT modify the .debug file - it sets the debug console port, not dev server port!
echo "📝 Debug file uses port from startingDebugPort in cep.config.ts"

# Verify manifest.xml was created
if [ ! -f "dist/cep/CSXS/manifest.xml" ]; then
    echo "❌ ERROR: manifest.xml was not created. Build may have failed."
    exit 1
fi
echo "✅ manifest.xml created successfully"

# Step 3: Create/update the symlink
echo ""
echo "🔗 Step 2: Creating symlink to Adobe CEP extensions..."
if ! npm run symlink; then
    echo "⚠️  WARNING: Symlink command failed. You may need to create it manually."
fi

# Step 4: Start the dev server
echo ""
echo "🚀 Step 3: Starting dev server on port $PORT..."
echo "==========================================="
echo ""

# Start the dev server (this will run in foreground)
npm run dev

# If we get here, the server was stopped
echo ""
echo "ℹ️  Dev server stopped."