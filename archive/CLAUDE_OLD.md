# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adobe Premiere Pro CEP plugin for AI-powered sound effects generation using Eleven Labs API. The plugin allows users to describe sound effects in natural language and automatically adds them to their Premiere Pro timeline.

## Current Status: CEP Plugin (Migrated from UXP)

We're using CEP (Common Extensibility Platform) for full timeline manipulation capabilities:
- ✅ ExtendScript (.jsx) for Premiere API access  
- ✅ Node.js integration enabled (`--enable-nodejs`)
- ✅ Direct timeline clip placement
- ✅ In/Out point detection working
- ✅ Chrome DevTools debugging on port 7002

## Key Architecture Decisions

### Why CEP over UXP
- **CEP**: Full timeline access, Node.js support, ExtendScript API
- **UXP**: Modern but limited - no timeline manipulation, import-only

### Critical Files
```
CEP-Plugin/
├── CSXS/manifest.xml      # CEP configuration  
├── index.html             # Main UI
├── js/
│   ├── CSInterface.js     # Adobe CEP API
│   └── main.js           # Core logic
├── jsx/
│   └── safe-timeline.jsx  # ExtendScript for Premiere
└── .debug                 # Chrome DevTools config (port 7002)
```

## Development Setup

### Quick Start with Symlinks (Recommended)
```bash
# Remove any existing plugin copy
sudo rm -rf "/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator"

# Create symlink to development folder
sudo ln -s "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CEP-Plugin" "/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator"
```

### Enable CEP Debugging
```bash
# Allow unsigned extensions
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

# Enhanced debugging options
defaults write com.adobe.CSXS.11 LogLevel 6
defaults write com.adobe.CSXS.11 CSXSAllowUnsignedExtensions 1
```

### Chrome DevTools Access
1. Open Chrome: `http://localhost:7002`
2. If not working, check `.debug` file exists in plugin directory
3. Restart Premiere Pro after any manifest changes

## Critical Code Patterns

### ExtendScript Communication (Working Pattern)
```javascript
// In main.js - Use static methods only!
const result = await TimelineManager.executeScript('getSequenceInfo');
// NOT: const tm = new TimelineManager(); tm.executeScript();

// Promise-based async pattern
static executeScript(functionName, params = {}) {
    return new Promise((resolve, reject) => {
        const script = `${functionName}(${JSON.stringify(params)})`;
        csInterface.evalScript(script, (result) => {
            try {
                resolve(JSON.parse(result));
            } catch (e) {
                resolve(result); // Handle non-JSON responses
            }
        });
    });
}
```

### In/Out Point Detection (MVX Pattern - Working)
```javascript
// In safe-timeline.jsx
function getSequenceInfo() {
    var seq = app.project.activeSequence;
    if (seq) {
        return JSON.stringify({
            success: true,
            inPoint: seq.getInPoint().seconds,
            outPoint: seq.getOutPoint().seconds,
            playerPosition: seq.getPlayerPosition().seconds
        });
    }
    return JSON.stringify({ success: false, error: "No active sequence" });
}
```

### Timeline Clip Placement
```javascript
// ExtendScript in safe-timeline.jsx
function placeAudioOnTimeline(filePath, trackIndex, timeSeconds) {
    var project = app.project;
    var sequence = project.activeSequence;
    var track = sequence.audioTracks[trackIndex];
    
    var importedItem = project.importFiles([filePath])[0];
    track.insertClip(importedItem, timeSeconds);
    
    return "Clip placed successfully";
}
```

## Event Detection Methodology

### Working Event Pattern
```javascript
// onProjectChanged fires for in/out point changes!
app.bind('onProjectChanged', function() {
    var event = new CSXSEvent();
    event.type = "timeline.changed";
    event.dispatch();
});

// In main.js
csInterface.addEventListener('timeline.changed', updateTimelineInfo);
```

## Professional UI Patterns

### Design System
```css
:root {
    --bg-primary: #2a2a2a;
    --bg-secondary: #1a1a1a;
    --text-primary: #b5b5b5;
    --accent-blue: #00a4ff;
    --border-subtle: #3f3a3a;
}
```

## Automated Development Workflow

### Python Script Automation
```bash
# Auto-reload plugin during development
python3 /Users/richardtran/Desktop/complete-plugin-workflow.py reload

# Test functionality
python3 /Users/richardtran/Desktop/complete-plugin-workflow.py test

# Monitor file changes and auto-reload
python3 /Users/richardtran/Desktop/complete-plugin-workflow.py monitor
```

### AppleScript for Premiere Control
```applescript
-- Reload plugin
tell application "Adobe Premiere Pro 2025"
    activate
    tell application "System Events"
        keystroke "r" using {command down, option down, shift down}
    end tell
end tell
```

## API Integration

### Eleven Labs Configuration
- Endpoint: `https://api.elevenlabs.io/v1/text-to-sound-effects`
- Headers: `'xi-api-key': apiKey`
- Response: Returns audio URL for generated sound effect

### File Management
```javascript
// Download and save generated audio
async function downloadAudio(url, outputPath) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const fs = require('fs');
    fs.writeFileSync(outputPath, Buffer.from(buffer));
}
```

## Common Issues & Solutions

### ExtendScript Not Loading
- Check console for "ExtendScript loaded successfully"
- Verify jsx file path in manifest
- Ensure static method calls (not instance methods)

### In/Out Points Show "undefined"
- Set actual in/out points in timeline (I and O keys)
- Check `getSequenceInfo()` returns proper JSON
- Verify timeline update events are firing

### Plugin Not Showing
- Check manifest.xml syntax
- Run setup_cep_debug.sh
- Restart Premiere Pro
- Check Window → Extensions menu

### Debug Port Not Working
- Ensure .debug file exists with correct extension ID
- Port 7002 must match .debug configuration
- Restart Premiere after changes

## Next Development Steps

### Immediate Priorities
1. Professional UI with glass effects
2. Audio preview before placing
3. Keyboard shortcuts (Cmd+Enter to generate)
4. Settings persistence
5. Progress indicators during generation

### Future Enhancements
1. Batch generation from markers
2. Voice selection options
3. Cache management
4. Usage analytics
5. Update notifications

## Performance Optimization
- Use Promise.all() for parallel operations
- Don't cache Premiere object references
- Clean up event listeners on unload
- Implement request throttling
- Optimize file downloads