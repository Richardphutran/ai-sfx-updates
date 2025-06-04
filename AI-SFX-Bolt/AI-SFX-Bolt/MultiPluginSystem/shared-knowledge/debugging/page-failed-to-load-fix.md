# Page Failed to Load Solution

## Problem
When the AI SFX plugin shows 'Page failed to load' with ERR_CONNECTION_REFUSED, it means the plugin loaded in Premiere before the dev server was ready.

## Root Cause
- Plugin loads on Premiere startup
- Dev server not running yet
- Chrome caches the error page

## Solution
Always start dev server BEFORE opening plugin:

```bash
# Use the start_plugin.py script
python3 start_plugin.py
```

This script:
1. Starts dev server first
2. Waits for it to be ready
3. Opens plugin in Premiere
4. Verifies health

## Manual Fix
If plugin already showing error:
1. Make sure dev server is running (npm run dev)
2. Click on plugin panel in Premiere
3. Press Cmd+R to reload
   OR right-click > Reload

## Prevention
- Never open plugin before dev server
- Use start_plugin.py for reliable startup
- Check health with plugin_health_check.py
