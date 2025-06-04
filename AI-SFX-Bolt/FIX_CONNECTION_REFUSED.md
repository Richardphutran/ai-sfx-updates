# 🚨 CRITICAL FIX: ERR_CONNECTION_REFUSED Solution

## The Problem
All Claude sessions encounter "Page failed to load - ERR_CONNECTION_REFUSED" because:
1. Premiere loads plugins on startup
2. Dev server isn't running yet
3. Chrome caches the error page

## The Universal Solution

### Option 1: Universal Starter Script (Recommended)
Copy `universal_plugin_start.py` to ANY plugin project and run:
```bash
python3 universal_plugin_start.py
```

This script:
- Auto-detects project settings
- Starts dev server FIRST
- Opens plugin in Premiere
- Monitors health
- Works with ANY CEP plugin

### Option 2: Auto-Reconnect Code
Add this to your plugin's main entry file:

```typescript
// In index-react.tsx or equivalent
import { initAutoReconnect } from "../lib/auto-reconnect";

// Add before any other initialization
initAutoReconnect();
```

The auto-reconnect code (in `src/js/lib/auto-reconnect.ts`):
- Detects connection errors
- Automatically retries every second
- Reloads when dev server is ready
- Shows user-friendly waiting UI

### Option 3: Manual Process
If automatic methods fail:
1. ALWAYS start dev server first: `npm run dev`
2. Wait for "ready" message
3. THEN open plugin in Premiere
4. If already showing error: Cmd+R to reload

## For Other Claude Sessions

### Quick Copy Commands
```bash
# Copy universal starter to any project
cp universal_plugin_start.py /path/to/other/plugin/

# Copy auto-reconnect code
cp src/js/lib/auto-reconnect.ts /path/to/other/plugin/src/js/lib/
```

### Integration Steps
1. Add `initAutoReconnect()` to main entry file
2. Use `universal_plugin_start.py` for development
3. Never manually open plugin before dev server

## Prevention Rules
1. **NEVER** open plugin before dev server is running
2. **ALWAYS** use startup scripts
3. **ALWAYS** check if dev server is ready first

## Troubleshooting
If still getting errors:
- Check if dev server port (3001) is free
- Ensure no other plugins using same ports
- Kill zombie node processes: `pkill -f node`
- Restart Premiere as last resort

## Knowledge Base Entry
This solution is saved at:
`MultiPluginSystem/shared-knowledge/debugging/err-connection-refused-universal-fix.md`