#!/bin/bash
# Find and open CEP debug console

echo "🔍 Finding CEP Debug Console..."
echo "=============================="
echo ""

# The debug port comes from startingDebugPort in cep.config.ts
CONFIG_DEBUG_PORT=$(grep -o 'startingDebugPort:[[:space:]]*[0-9]*' cep.config.ts | grep -o '[0-9]*' | head -1)
if [ -z "$CONFIG_DEBUG_PORT" ]; then
    CONFIG_DEBUG_PORT=8870  # Default if not found
fi

# Get dev port from config
DEV_PORT=$(grep -o 'port:[[:space:]]*[0-9]*' cep.config.ts | grep -o '[0-9]*' | head -1)

echo "📋 Configuration:"
echo "  • Dev Server Port: $DEV_PORT"
echo "  • Debug Port (from config): $CONFIG_DEBUG_PORT"
echo ""

# Find any actually running debug ports
RUNNING_PORTS=$(ps aux | grep -i cephtmlengine | grep -o '\-\-remote-debugging-port=[0-9]*' | grep -o '[0-9]*' | sort -u)

if [ -z "$RUNNING_PORTS" ]; then
    echo "❌ No CEP processes with debug ports found."
    echo ""
    echo "Expected debug console at: http://localhost:$CONFIG_DEBUG_PORT"
    echo ""
    echo "Make sure:"
    echo "  1. Adobe Premiere Pro is running"
    echo "  2. The extension is loaded"
    echo "  3. You've run ./start-bulletproof.sh"
else
    echo "🔍 Active Debug Consoles:"
    for PORT in $RUNNING_PORTS; do
        echo "  • http://localhost:$PORT"
        
        # Try to get more info about what's on this port
        RESPONSE=$(curl -s http://localhost:$PORT/json/list 2>/dev/null)
        if [ ! -z "$RESPONSE" ]; then
            echo "    Available targets:"
            echo "$RESPONSE" | grep -o '"url":"[^"]*"' | sed 's/"url":"//g' | sed 's/"//g' | sed 's/^/      - /'
        fi
        echo ""
    done
    
    echo "💡 Instructions:"
    echo "  1. Open Chrome and go to one of the debug console URLs above"
    echo "  2. Look for 'localhost:$DEV_PORT/main/index.html' in the targets"
    echo "  3. Click on it to open DevTools"
    echo "  4. Check the Console tab for logs and errors"
    echo ""
    
    # Offer to open in Chrome
    read -p "🌐 Open debug console in Chrome? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Prefer the config port if it's running, otherwise first found
        if echo "$RUNNING_PORTS" | grep -q "^$CONFIG_DEBUG_PORT$"; then
            open "http://localhost:$CONFIG_DEBUG_PORT"
            echo "✅ Opened http://localhost:$CONFIG_DEBUG_PORT in Chrome"
        else
            FIRST_PORT=$(echo "$RUNNING_PORTS" | head -1)
            open "http://localhost:$FIRST_PORT"
            echo "✅ Opened http://localhost:$FIRST_PORT in Chrome"
            echo "⚠️  Note: This is port $FIRST_PORT, not the expected $CONFIG_DEBUG_PORT"
        fi
    fi
fi