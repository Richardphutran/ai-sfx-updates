# AI SFX Generator - CEP Plugin Development Notes

## How We Got CEP Debugging Working

### Problem
- CEP plugin loaded but Chrome DevTools debugging wasn't accessible
- CEP logs showed "No debug port file found" despite .debug file existing
- Only UXP debugging was visible on port 9222, not CEP

### Solution
1. **Created proper .debug file** in plugin root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.ailab.sfx-generator.cep">
        <HostList>
            <Host Name="PPRO" Port="9223"/>
        </HostList>
    </Extension>
</ExtensionList>
```

2. **Added debug parameters to manifest.xml**:
```xml
<CEFCommandLine>
    <Parameter>--remote-debugging-port=9223</Parameter>
    <Parameter>--enable-logging</Parameter>
</CEFCommandLine>
```

3. **Critical Discovery**: CEP only reads .debug file at Premiere Pro startup
   - Must FULLY QUIT and restart Premiere Pro for debug changes to take effect
   - Simply reloading the plugin doesn't work

4. **Added missing CSInterface.js**:
   - Downloaded from Adobe's official repository
   - Required for JavaScript to ExtendScript communication

### Result
- Debug server now accessible at http://localhost:9223
- Full Chrome DevTools functionality for debugging

## Current Issue: ExtendScript Connection

### Error
"Failed to parse sequence info: EvalScript error" appears even with active sequence open

### What Should Be Checked
1. **Verify sequence is truly active**:
   - Timeline panel should be visible
   - Sequence should have tracks
   - Playhead should be visible

2. **Test ExtendScript directly in console**:
```javascript
// Test 1: Basic ExtendScript test
csInterface.evalScript('1+1', function(result) { 
    console.log('Basic test:', result); 
});

// Test 2: Simple string return
csInterface.evalScript('"hello"', function(result) { 
    console.log('String test:', result); 
});

// Test 3: App object test
csInterface.evalScript('app.version', function(result) { 
    console.log('App version:', result); 
});

// Test 4: Project name
csInterface.evalScript('app.project.name', function(result) { 
    console.log('Project name:', result); 
});

// Test 5: Active sequence
csInterface.evalScript('app.project.activeSequence ? app.project.activeSequence.name : "No sequence"', function(result) { 
    console.log('Active sequence:', result); 
});
```

### Troubleshooting ExtendScript Connection
If all tests return "EvalScript error":
1. **ExtendScript might not be loaded** - Check if jsx file is in correct location
2. **Permissions issue** - CEP might not have permission to execute ExtendScript
3. **Premiere Pro restart needed** - Sometimes ExtendScript requires full restart

3. **Check ExtendScript permissions**:
   - CEP might need additional permissions to access timeline
   - Manifest.xml already has required CEP version (12.0)

## Project Structure Requirements
- **Project must be open** in Premiere Pro
- **Sequence must be active** (timeline visible)
- **Audio tracks must exist** in the sequence

## Development Workflow
1. Edit files in: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CEP-Plugin/`
2. Changes reflect immediately via symlink to `/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator`
3. For ExtendScript changes: May need to reload plugin
4. For debug configuration changes: Must restart Premiere Pro

## Key Files
- **index.html** - Plugin UI
- **js/main.js** - Main plugin logic
- **js/CSInterface.js** - Adobe's CEP communication library (required!)
- **jsx/premiere.jsx** - ExtendScript for timeline manipulation
- **CSXS/manifest.xml** - CEP configuration
- **.debug** - Debug port configuration

## Debug Commands
- Check if debug port is active: `lsof -i :9223`
- View CEP logs: `~/Library/Logs/CSXS/`
- Chrome DevTools: http://localhost:9223