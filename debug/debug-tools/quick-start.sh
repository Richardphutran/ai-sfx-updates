#!/bin/bash
# Quick start script for ai-sfx

echo "🚀 Starting ai-sfx development environment..."

# Start dev server
npm run dev &
DEV_PID=$!

echo "✅ Dev server started (PID: $DEV_PID)"
echo "📋 Logs: tail -f /tmp/ai-sfx.log"
echo "🛑 To stop: kill $DEV_PID"

# Keep running
wait $DEV_PID
