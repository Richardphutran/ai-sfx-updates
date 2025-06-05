# Pure Python Plugin Restart (NO AppleScript)

**Status:** ✅ WORKING - AppleScript-free solution
**Platform:** macOS/Windows compatible
**Tokens:** ~50

## Problem
Need to restart Premiere Pro plugins without AppleScript dependency

## Solution

### Multi-Plugin System Integration
```bash
# Soft restart (tries DevTools reload first)
python3 multi_plugin_autonomous.py restart ai-sfx-generator

# Hard restart (kills Premiere entirely)
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard

# Restart all registered plugins
python3 multi_plugin_autonomous.py restart all

# Hard restart all plugins
python3 multi_plugin_autonomous.py restart all --hard
```

### Standalone Script
```bash
# Use the pure Python script directly
python3 pure_python_plugin_restart.py --port 9230 --name "AI SFX Generator"

# Force hard restart
python3 pure_python_plugin_restart.py --port 9230 --force-hard

# Soft restart only
python3 pure_python_plugin_restart.py --port 9230 --soft-only
```

## How It Works

### Soft Restart (Preferred)
1. **Chrome DevTools Protocol** - Sends `location.reload()` via HTTP
2. **Fast** - ~2 seconds, preserves Premiere state
3. **Safe** - No Premiere restart needed

### Hard Restart (Fallback)
1. **Process Management** - Uses `psutil` to find/kill Premiere
2. **Clean Start** - Launches fresh Premiere instance
3. **Reliable** - Works when soft restart fails

## Dependencies
```bash
pip install psutil  # For process management
# urllib.request, json - Built into Python
```

## Integration with Development
```python
# Add to your development script
from multi_plugin_autonomous import PluginRestarter

restarter = PluginRestarter(9230, "AI SFX Generator")

# Quick reload
if restarter.soft_restart():
    print("✅ Plugin reloaded")
else:
    print("⚠️ Falling back to hard restart")
    restarter.hard_restart()
```

## Benefits
- **No AppleScript** - Works on any Python environment
- **Smart fallback** - Tries gentle first, then forceful
- **Multi-plugin aware** - Handles multiple plugins simultaneously
- **Cross-platform** - Uses standard Python libraries
- **Fast** - Soft restart in ~2 seconds vs 30+ seconds full restart

## When to Use
- Plugin becomes unresponsive
- Console shows JavaScript errors
- UI stops updating
- After major code changes
- Before testing new features