#!/bin/bash

# Professional Bridge Startup Script for AI SFX Plugin
# Ensures bridge server is running before starting development

set -e

echo "🚀 Starting AI SFX Bridge System"
echo "================================"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔄 Cleaning up port $port..."
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check if bridge server is already running
if check_port 8090; then
    echo "⚠️ Port 8090 is already in use"
    read -p "Kill existing process and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 8090
    else
        echo "❌ Exiting - bridge server already running"
        exit 1
    fi
fi

# Ensure we have node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start bridge server in background
echo "🌉 Starting bridge server on port 8090..."
node bridge-server.js &
BRIDGE_PID=$!

# Wait for bridge server to start
echo "⏳ Waiting for bridge server to initialize..."
sleep 2

# Check if bridge server started successfully
if check_port 8090; then
    echo "✅ Bridge server running successfully"
    echo "📊 Bridge Status:"
    echo "   - WebSocket: ws://localhost:8090"
    echo "   - PID: $BRIDGE_PID"
    echo ""
    echo "🎯 Ready for plugin connections!"
    echo ""
    echo "To start development server: npm run dev"
    echo "To stop bridge server: kill $BRIDGE_PID"
else
    echo "❌ Bridge server failed to start"
    kill $BRIDGE_PID 2>/dev/null || true
    exit 1
fi

# Keep script running to maintain bridge server
wait $BRIDGE_PID