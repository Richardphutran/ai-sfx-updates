# Plugin Reload Automation

**Status:** ✅ MASSIVE TIME SAVER
**Platform:** macOS (adaptable)

## Python Script Method

```python
#!/usr/bin/env python3
import subprocess
import time

def reload_plugin(plugin_name="AI SFX Generator"):
    """Reload plugin using keyboard shortcut"""
    
    # Focus Premiere Pro
    applescript = f'''
    tell application "Adobe Premiere Pro 2025"
        activate
    end tell
    '''
    subprocess.run(['osascript', '-e', applescript])
    time.sleep(0.5)
    
    # Trigger reload shortcut (customize if needed)
    reload_script = '''
    tell application "System Events"
        keystroke "r" using {command down, option down, shift down}
    end tell
    '''
    subprocess.run(['osascript', '-e', reload_script])
    
    print(f"✅ Plugin reloaded: {plugin_name}")

if __name__ == "__main__":
    reload_plugin()
```

## AppleScript Method

```applescript
-- Quick reload
tell application "Adobe Premiere Pro 2025"
    activate
    delay 0.5
    tell application "System Events"
        -- Open Extensions menu
        keystroke "7" using {option down}
        delay 0.5
        -- Navigate to your plugin
        keystroke "AI SFX Generator"
        delay 0.5
        keystroke return
    end tell
end tell
```

## Keyboard Shortcut Setup

In Premiere Pro:
1. Edit → Keyboard Shortcuts
2. Search for "Reload Extensions"
3. Assign: Cmd+Option+Shift+R
4. Save preset

## Usage in Development

```bash
# Make code changes
# Run reload script
python3 reload_plugin.py

# Or one-liner
osascript -e 'tell app "System Events" to keystroke "r" using {command down, option down, shift down}'
```

## Benefits
- No manual clicking
- Instant reload
- Preserves panel state
- Works with symlinked development