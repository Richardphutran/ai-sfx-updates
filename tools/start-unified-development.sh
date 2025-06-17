#!/bin/bash

echo "🚀 Starting AI SFX with Unified Multi-Plugin System"
echo "=================================================="

# Function to check if process is running
is_running() {
    lsof -i:$1 > /dev/null 2>&1
}

# Step 1: Check if unified bridge is running, start dashboard if needed
if ! is_running 8090; then
    echo "📡 Starting unified bridge and developer dashboard..."
    
    # Launch the standalone developer dashboard
    cd "../Ai Podcast/developer-bridge"
    ./start-dashboard.sh &
    DASHBOARD_PID=$!
    cd - > /dev/null
    
    # Wait for bridge to start
    echo "⏳ Waiting for bridge server and dashboard..."
    sleep 8
    
    if is_running 8090; then
        echo "✅ Bridge server running on port 8090"
        echo "🎮 Developer dashboard opened - monitor all plugins there"
    else
        echo "❌ Failed to start bridge server"
        echo "💡 Try manually: cd ../Ai\ Podcast/developer-bridge && ./start-dashboard.sh"
        exit 1
    fi
else
    echo "✅ Bridge server already running on port 8090"
    echo "💡 Developer dashboard may already be open"
fi

# Step 2: Register this plugin with port manager
echo ""
echo "📍 Registering AI SFX plugin..."
node scripts/universal-port-manager.js register ai-sfx

# Get assigned ports
PORTS=$(node scripts/universal-port-manager.js get ai-sfx)
echo "📊 Assigned ports:"
echo "$PORTS"

# Extract port numbers
DEV_PORT=$(echo "$PORTS" | grep -o '"dev": [0-9]*' | grep -o '[0-9]*')
DEBUG_PORT=$(echo "$PORTS" | grep -o '"debug": [0-9]*' | grep -o '[0-9]*')

# Step 3: Update configuration files with assigned ports
echo ""
echo "🔧 Updating configuration files with assigned ports..."

# Check if we're in the main directory and need to go to AI-SFX-Bolt
if [ -d "AI-SFX-Bolt" ]; then
    cd AI-SFX-Bolt
    echo "  📁 Switched to AI-SFX-Bolt directory"
fi

# Update .debug file if it exists
if [ -f ".debug" ]; then
    sed -i '' "s/Port=\"[0-9]*\"/Port=\"$DEBUG_PORT\"/g" .debug
    echo "  ✅ Updated .debug file with port $DEBUG_PORT"
fi

# Update cep.config.ts with assigned ports
if [ -f "cep.config.ts" ]; then
    sed -i '' "s/port: [0-9]*/port: $DEV_PORT/g" cep.config.ts
    sed -i '' "s/servePort: [0-9]*/servePort: $DEV_PORT/g" cep.config.ts
    sed -i '' "s/startingDebugPort: [0-9]*/startingDebugPort: $DEBUG_PORT/g" cep.config.ts
    echo "  ✅ Updated cep.config.ts with dev port $DEV_PORT and debug port $DEBUG_PORT"
fi

# Step 4: Start the development server
echo ""
echo "🎬 Starting AI SFX development server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Developer Dashboard: Open from ai-podcast/developer-bridge"
echo "✅ Dev Server: http://localhost:${DEV_PORT}/main/"
echo "🔍 Debug Console: http://localhost:${DEBUG_PORT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "- Dashboard shows all 4 plugins"
echo "- Console logs are filtered by plugin"
echo "- ExtendScript testing available in dashboard"
echo ""

# Start the dev server
npm run dev