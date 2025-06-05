# Premiere Pro Restart with Project

**Status:** ✅ WORKING (Updated with SAVE dialog handling)
**Tokens:** ~95

## Problem
Need to restart Premiere Pro and automatically reopen the last project, handling save dialogs

## Solution
```python
#!/usr/bin/env python3
import subprocess
import time

def restart_premiere_with_project():
    # Quit Premiere if running (handles save dialog)
    quit_script = '''
    tell application "System Events"
        tell process "Adobe Premiere Pro 2025"
            set frontmost to true
            delay 0.5
        end tell
    end tell
    
    tell application "Adobe Premiere Pro 2025"
        quit
    end tell
    
    delay 1
    
    -- Handle save dialog if it appears
    tell application "System Events"
        if exists window "Adobe Premiere Pro 2025" of process "Adobe Premiere Pro 2025" then
            try
                -- Click "Don't Save" button if save dialog appears
                click button "Don't Save" of window 1 of process "Adobe Premiere Pro 2025"
            on error
                -- If that fails, try pressing Cmd+D (Don't Save shortcut)
                keystroke "d" using command down
            end try
        end if
    end tell
    '''
    subprocess.run(['osascript', '-e', quit_script])
    time.sleep(3)
    
    # Start Premiere
    subprocess.run(['osascript', '-e', 'tell application "Adobe Premiere Pro 2025" to activate'])
    time.sleep(8)
    
    # Open recent project
    open_recent = '''
    tell application "System Events"
        tell process "Adobe Premiere Pro 2025"
            try
                click menu item 1 of menu "Open Recent" of menu item "Open Recent" of menu "File" of menu bar 1
            on error
                keystroke "o" using {command down, option down}
                delay 1
                keystroke return
            end try
        end tell
    end tell
    '''
    subprocess.run(['osascript', '-e', open_recent])
    
    # Open plugin
    subprocess.run(['osascript', '-e', 
        'tell application "System Events" to tell process "Adobe Premiere Pro 2025" to click menu item "AI SFX Generator" of menu "Extensions" of menu "Window" of menu bar 1'])

if __name__ == "__main__":
    restart_premiere_with_project()
```

## When to Use
Restarting Premiere while keeping your project and plugin ready