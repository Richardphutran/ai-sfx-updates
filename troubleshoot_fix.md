# AI SFX Plugin Troubleshooting Guide

## Issue: Generated SFX not appearing in project bins or timeline

### Quick Diagnosis Steps

1. **Open plugin in Premiere Pro**
2. **Open browser console** (F12 > Console tab)
3. **Copy and paste the debug script** from `debug_ai_sfx.js`
4. **Run:** `runAllTests()`

### Most Common Issues & Fixes

#### Issue 1: Files Generated but Not Imported to Project
**Symptoms:** Files exist on disk but don't appear in project bins

**Check:**
```javascript
// In browser console:
testFileSystemAccess()
testProjectBinsDebug()
```

**Common Causes:**
- Project not saved (ExtendScript can't get project path)
- Permission issues with file system
- Bin creation/organization failing silently

**Fix:** 
1. Save your Premiere Pro project first
2. Check if files exist in `~/Desktop/SFX AI/` folder
3. If files exist, manually drag them into project

#### Issue 2: ExtendScript Connection Issues
**Symptoms:** Plugin loads but nothing happens when generating

**Check:**
```javascript
// In browser console:
testBasicConnection()
```

**Fix:**
1. Restart Premiere Pro
2. Reload plugin (Window > Extensions > UXP Developer Tool > Reload)
3. Check if project is open

#### Issue 3: Timeline Placement Issues  
**Symptoms:** Files import but don't place on timeline

**Check:**
```javascript
// Test with existing file:
testAudioImportDebug("/path/to/existing/audio.mp3")
```

**Common Causes:**
- No active sequence
- Track placement conflicts
- QE API limitations

### Manual Workaround

If auto-import fails:
1. Files are saved to `~/Desktop/SFX AI/` (or project folder)
2. Manually drag files from filesystem into Project panel
3. Drag from Project panel to timeline

### Debug Information to Collect

When reporting issues, run these and share results:
```javascript
runAllTests()
debugAISFX()
```

### Emergency Reset

If plugin completely broken:
1. Close Premiere Pro
2. Delete `~/Desktop/SFX AI/` folder if needed
3. Restart Premiere Pro
4. Reload plugin

### Common File Locations

- **Desktop fallback:** `~/Desktop/SFX AI/`
- **Project folder:** `[ProjectFolder]/SFX/ai sfx/`
- **Generated files:** Named like `001 your prompt.mp3`