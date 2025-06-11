# Adobe Premiere Pro CEP Development - Complete Guide

## File Structure
- **CSXS/**: Configuration files (manifest.xml)
- **jsx/**: ExtendScript files for Premiere integration
- **css/**: Panel styling
- **lib/**: JavaScript libraries (CSInterface.js, Vulcan.js)

## Modern Development Setup

### Prerequisites
- Node.js 18+
- Adobe CC Apps 2024 or later
- Package manager: npm, yarn, or pnpm

### Recommended Stack (Bolt CEP)
Source: [hyperbrew/bolt-cep](https://github.com/hyperbrew/bolt-cep)
- **Lightning-fast HMR** (Hot Module Replacement)
- **Framework Support**: React, Vue, Svelte
- **Modern ES6** in JavaScript and ExtendScript
- **Type-safe ExtendScript** with Types-for-Adobe
- **End-to-End Type Safety**
- **Vite + TypeScript + Sass**

### Quick Start
```bash
yarn create bolt-cep
```

## Essential Libraries & APIs
Source: [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources)

### Required Libraries
- **CSInterface.js**: Communication between client and host
- **Vulcan.js**: Additional CEP functionality
- **Do NOT include**: CEPEngine_extensions.js (already integrated)

### Development Pattern
1. **Client-side code**: HTML/JS interface
2. **ExtendScript**: Host application interactions
3. **Communication**: `evalScript()` and `evalTS()` for type-safe calls

## Debug Mode Setup
Source: [Adobe-CEP/Getting-Started-guides](https://github.com/Adobe-CEP/Getting-Started-guides)

### MacOS
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```

### Windows
Registry key required for debug mode

### Installation Paths
- **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions`
- **Mac**: `/Library/Application Support/Adobe/CEP/extensions`

## Premiere Pro Specific APIs
Source: [docsforadobe/premiere-scripting-guide](https://github.com/docsforadobe/premiere-scripting-guide)

**Website**: https://ppro-scripting.docsforadobe.dev/

### Critical Functions We Need to Master
1. **Sequence Events**: Detect when user changes sequence
2. **Timeline Information**: Get current timeline state
3. **Project File Info**: Access project metadata
4. **Bin Operations**: Read/write project bins
5. **Playhead Position**: Get/set current time
6. **Track Management**: Add/remove audio tracks
7. **Clip Placement**: Insert audio at specific positions

## Deployment Options
Source: [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources)

1. **Creative Cloud Desktop** distribution
2. **Adobe Exchange Store** submission
3. **Direct .zxp** file distribution
4. **ZXPSignCMD** for packaging/signing

## Current CEP Status
- **CEP 12**: Latest version (supports CC 2024+)
- **Legacy versions**: CEP 9, 10, 11 for older CC versions
- **Future**: Adobe transitioning to UXP, but CEP still functional

## Implementation Plan for AI SFX Plugin

### Phase 1: Core ExtendScript Functions
1. **Timeline Detection**
   ```javascript
   // Detect sequence changes
   app.project.activeSequence.addEventListener()
   ```

2. **Playhead Position**
   ```javascript
   // Get current time
   app.project.activeSequence.getPlayerPosition()
   ```

3. **Audio Placement**
   ```javascript
   // Insert audio at playhead
   app.project.activeSequence.audioTracks[0].insertClip()
   ```

### Phase 2: Project Integration
1. **Bin Scanning**: Search for "SFX" folders
2. **File Organization**: Create AI SFX folder structure
3. **Asset Management**: Track generated vs existing SFX

### Phase 3: Events & Real-time
1. **Sequence Change Detection**
2. **Spacebar Search Implementation**
3. **Smart Track Placement**

## Learning Resources
- [CEP Resources](https://github.com/Adobe-CEP/CEP-Resources)
- [Getting Started](https://github.com/Adobe-CEP/Getting-Started-guides)
- [Bolt CEP Framework](https://github.com/hyperbrew/bolt-cep)
- [Premiere Scripting Guide](https://ppro-scripting.docsforadobe.dev/)
- [Adobe PProPanel Sample](https://github.com/Adobe-CEP/Samples/tree/master/PProPanel)

## Premiere Pro ExtendScript API - Complete Reference
Source: [Premiere Pro Scripting Guide](https://ppro-scripting.docsforadobe.dev/)

### ⚠️ Important Status Update
- Adobe transitioning from ExtendScript to UXP (Unified Extensibility Platform)
- ExtendScript supported through end of 2025, no further API updates
- Use Microsoft Visual Studio Code with Adobe's ExtendScript extension (not ESTK)

### Core Application Object
```javascript
app // Global object providing access to entire Premiere Pro application
app.project // Current project
app.project.activeSequence // Currently active sequence
```

### Timeline & Playhead Control

#### Get Current Playhead Position
```javascript
var currentTime = app.project.activeSequence.getPlayerPosition();
// Returns Time object with .seconds property
var timeInSeconds = currentTime.seconds;
```

#### Set Playhead Position
```javascript
app.project.activeSequence.setPlayerPosition(timeInSeconds);
```

#### In/Out Points
```javascript
// Get
var inPoint = app.project.activeSequence.getInPointAsTime();
var outPoint = app.project.activeSequence.getOutPointAsTime();

// Set
app.project.activeSequence.setInPoint(seconds);
app.project.activeSequence.setOutPoint(seconds);
```

#### Work Area
```javascript
app.project.activeSequence.setWorkAreaEnabled(true/false);
var isEnabled = app.project.activeSequence.isWorkAreaEnabled();
```

### Audio Track Operations

#### Access Audio Tracks
```javascript
var audioTracks = app.project.activeSequence.audioTracks;
var firstAudioTrack = audioTracks[0];
```

#### Insert Audio Clip (Pushes existing clips)
```javascript
// Insert at specific time
firstAudioTrack.insertClip(projectItem, timeInSeconds);

// Insert at playhead
var playheadTime = app.project.activeSequence.getPlayerPosition().seconds;
firstAudioTrack.insertClip(projectItem, playheadTime);
```

#### Overwrite Audio Clip (Replaces existing)
```javascript
// Safer method - doesn't disrupt timeline
firstAudioTrack.overwriteClip(projectItem, timeInSeconds);
```

#### Track Properties
```javascript
var track = audioTracks[0];
track.clips // Array of clips on track
track.name // Track name
track.muted // Mute state
```

### Project Bin Management

#### Project Item Types
```javascript
// Types: BIN, CLIP, FILE, ROOT
projectItem.type
projectItem.name // Read/Write
projectItem.children // ProjectItemCollection (for bins)
projectItem.treePath // Path within project
```

#### Create Bins
```javascript
// Create empty bin
var newBin = parentBin.createBin("SFX");

// Create smart bin with search query
var smartBin = parentBin.createSmartBin("Audio Files", "type:audio");
```

#### Bin Operations
```javascript
// Delete bin
bin.deleteBin();

// Rename bin
bin.renameBin("New Name");

// Move bin
bin.moveBin(newParentBin);
```

#### Search Project Items
```javascript
// Search for bins by name
function findBinByName(name, parent = app.project.rootItem) {
    for (var i = 0; i < parent.children.numItems; i++) {
        var item = parent.children[i];
        if (item.type === ProjectItemType.BIN && item.name === name) {
            return item;
        }
        if (item.type === ProjectItemType.BIN) {
            var result = findBinByName(name, item);
            if (result) return result;
        }
    }
    return null;
}
```

### Sequence Operations

#### Get Current Selection
```javascript
var selectedClips = app.project.activeSequence.getSelection();
```

#### Create Subsequence
```javascript
var newSequence = app.project.activeSequence.createSubsequence(ignoreTrackTargeting);
```

#### Sequence Properties (Premiere 2019+)
```javascript
var seq = app.project.activeSequence;
seq.videoFrameRate
seq.videoFrameWidth
seq.videoFrameHeight
seq.audioChannelCount
seq.audioSampleRate
```

### Marker Management
```javascript
var markers = app.project.activeSequence.markers;
var firstMarker = markers.getFirstMarker();

// Marker properties
marker.comments // String (read/write)
marker.end // Time object (read/write)
marker.guid // String (read-only)
marker.setTypeAsWebLink();
```

### Import Operations
```javascript
// Import file
var importedItem = app.project.importFiles(arrayOfFilePaths);

// Import to specific bin
var targetBin = findBinByName("SFX");
// Set active bin before import
app.project.activeItem = targetBin;
```

### File System Operations
```javascript
// Check if file exists
var file = new File(filePath);
if (file.exists) {
    // File operations
}

// Create directory
var folder = new Folder(folderPath);
if (!folder.exists) {
    folder.create();
}
```

### Event Handling Patterns
```javascript
// Sequence change detection (polling method)
var lastActiveSequence = null;
function checkSequenceChange() {
    var current = app.project.activeSequence;
    if (current !== lastActiveSequence) {
        // Sequence changed
        onSequenceChanged(current);
        lastActiveSequence = current;
    }
}

// Call periodically or trigger from UI
```

### Error Handling
```javascript
try {
    var result = app.project.activeSequence.getPlayerPosition();
} catch (e) {
    alert("Error: " + e.toString());
}
```

### Performance Best Practices
```javascript
// Batch operations
app.enableQE(); // Enable faster operations

// Suspend rendering during bulk operations
app.project.activeSequence.videoTracks[0].setMute(true);
// ... perform operations ...
app.project.activeSequence.videoTracks[0].setMute(false);
```

## QE (Quality Engineering) API - Advanced ExtendScript Functions

### When to Use QE API

The QE API should be used when:
1. **Standard ExtendScript API lacks functionality** - QE provides many methods not available in regular API
2. **You need track creation/deletion** - One of the most common uses (as shown in track creation examples)
3. **Advanced sequence operations** - Rendering, preview management, export operations
4. **Low-level media operations** - Proxy creation, metadata access, conforming status

**IMPORTANT**: QE API requires calling `app.enableQE()` first!

```javascript
// Enable QE API access
app.enableQE();

// Now you can access QE objects
var qeProject = qe.project;
var qeSequence = qe.project.getActiveSequence();
```

### QE Project Items

```javascript
// QE PROJECT ITEMS
// Access via: qe.project.getItemAt(index) or through standard project item

// Properties
QEProjectItem.clip;                    // Clip reference
QEProjectItem.filePath;               // Full file path
QEProjectItem.name;                   // Item name

// Methods
QEProjectItem.automateToSequence(object, number, number, number, number);  // Automate to sequence
QEProjectItem.containsSpeechTrack();                                      // Has speech track
QEProjectItem.createProxy(string, string);                                // Create proxy media
QEProjectItem.getMetadataSize();                                         // Get metadata size
QEProjectItem.isAudioConforming();                                       // Audio conforming status
QEProjectItem.isAudioPeakGenerating();                                   // Peak generation status
QEProjectItem.isIndexing();                                              // Indexing status
QEProjectItem.isOffline();                                               // Offline status
QEProjectItem.isPending();                                               // Pending status
QEProjectItem.linkMedia(string, bool);                                   // Link/relink media
QEProjectItem.openInSource();                                            // Open in source monitor
QEProjectItem.rename(assetName);                                         // Rename item
QEProjectItem.setOffline();                                              // Set as offline
```

### QE Sequences

```javascript
// QE SEQUENCES
// Access via: qe.project.getActiveSequence() or qe.project.getSequenceAt(index)

// Properties
QESequence.CTI;                       // Current Time Indicator position
QESequence.audioDisplayFormat;        // Audio display format
QESequence.audioFrameRate;           // Audio frame rate
QESequence.editingMode;              // Editing mode
QESequence.fieldType;                // Field type
QESequence.guid;                     // Unique identifier
QESequence.inPoint;                  // In point time
QESequence.multicam;                 // Multicam sequence flag
QESequence.name;                     // Sequence name
QESequence.numAudioTracks;           // Number of audio tracks
QESequence.numVideoTracks;           // Number of video tracks
QESequence.outPoint;                 // Out point time
QESequence.par;                      // Pixel aspect ratio
QESequence.player;                   // Player object
QESequence.presetList;               // Available presets
QESequence.previewPresetCodec;       // Preview codec
QESequence.previewPresetPath;        // Preview preset path
QESequence.useMaxBitDepth;          // Max bit depth flag
QESequence.useMaxRenderQuality;     // Max render quality flag
QESequence.videoDisplayFormat;       // Video display format
QESequence.videoFrameRate;          // Video frame rate
QESequence.workInPoint;             // Work area in point
QESequence.workOutPoint;            // Work area out point

// Methods
QESequence.addTracks(number, number, number, ...);     // Add tracks (proven for audio track creation)
QESequence.close();                                    // Close sequence
QESequence.createExportJob(string, string);           // Create export job
QESequence.deletePreviewFiles(string, string);        // Delete preview files
QESequence.exportDirect(string, string, bool);        // Direct export
QESequence.exportFrameBMP(string, string, string);    // Export frame as BMP
QESequence.exportFrameDPX(string, string, string);    // Export frame as DPX
QESequence.exportFrameGIF(string, string, string);    // Export frame as GIF
QESequence.exportFrameJPEG(string, string, string);   // Export frame as JPEG
QESequence.exportFramePNG(string, string, string);    // Export frame as PNG
QESequence.exportFrameTIFF(string, string, string);   // Export frame as TIFF
QESequence.exportFrameTarga(string, string, string);  // Export frame as Targa
QESequence.exportToAME(string, string, bool);         // Export to Adobe Media Encoder
QESequence.extract(string, string);                   // Extract section
QESequence.flushCache();                              // Flush cache
QESequence.getAudioTrackAt(number);                  // Get audio track by index
QESequence.getEmptyBarTimes();                       // Get empty bar times
QESequence.getExportComplete();                      // Check export completion
QESequence.getExportFileExtension(string);          // Get export file extension
QESequence.getGreenBarTimes();                       // Get green (rendered) bar times
QESequence.getRedBarTimes();                         // Get red (needs render) bar times
QESequence.getVideoTrackAt(number);                  // Get video track by index
QESequence.getYellowBarTimes();                      // Get yellow bar times
QESequence.isIncompleteBackgroundVideoEffects();    // Check incomplete effects
QESequence.isOpen();                                 // Check if sequence is open
QESequence.left(string, string);                     // Left operation
QESequence.lockTracks(string, bool);                 // Lock/unlock tracks
QESequence.makeCurrent();                            // Make this sequence active
QESequence.muteTracks(string, bool);                 // Mute/unmute tracks
QESequence.razor(string, bool, bool);                // Razor tool operation
QESequence.removeAudioTrack(number);                 // Remove audio track
QESequence.removeEmptyAudioTracks();                 // Remove empty audio tracks
QESequence.removeEmptyVideoTracks();                 // Remove empty video tracks
QESequence.removeTracks(number, number, number, ...); // Remove multiple tracks
QESequence.removeVideoTrack(number);                 // Remove video track
QESequence.renderAll();                              // Render entire sequence
QESequence.renderAudio();                            // Render audio only
QESequence.renderPreview();                          // Render preview
QESequence.setAudioDisplayFormat(number);            // Set audio display format
QESequence.setAudioFrameRate(number);                // Set audio frame rate
QESequence.setCTI(string);                           // Set Current Time Indicator
QESequence.setInOutPoints(string, string, bool);     // Set in/out points
QESequence.setInPoint(string, bool, bool);           // Set in point
QESequence.setOutPoint(string, bool, bool);          // Set out point
QESequence.setPreviewFrameSize(number, number);      // Set preview frame size
QESequence.setPreviewPresetPath(string);             // Set preview preset
QESequence.setUseMaxBitDepth(bool);                 // Set max bit depth
QESequence.setUseMaxRenderQuality(bool);             // Set max render quality
QESequence.setVideoDisplayFormat(number);            // Set video display format
QESequence.setVideoFrameSize(number, number);        // Set video frame size
QESequence.setWorkInOutPoints(string, string, bool); // Set work area in/out
QESequence.setWorkInPoint(string, bool);             // Set work area in point
QESequence.setWorkOutPoint(string, bool);            // Set work area out point
QESequence.syncLockTracks(string, bool);             // Sync lock tracks

// Example: Adding audio tracks with QE
app.enableQE();
var qeSequence = qe.project.getActiveSequence();
// Add 1 stereo audio track at the end
// Parameters: (videoTracks, videoPos, audioTracks, audioType, audioPos, submixTracks, submixType)
qeSequence.addTracks(0, 0, 1, 1, sequence.audioTracks.numTracks, 0, 0);
```

### QE Tracks

```javascript
// QE TRACKS  
// Access via: qeSequence.getAudioTrackAt(index) or qeSequence.getVideoTrackAt(index)

// Properties
QETrack.id;              // Track ID
QETrack.index;           // Track index
QETrack.name;            // Track name
QETrack.numComponents;   // Number of components (effects)
QETrack.numItems;        // Number of items (clips)
QETrack.numTransitions;  // Number of transitions
QETrack.type;            // Track type

// Methods
QETrack.addAudioEffect(object, number, bool);  // Add audio effect
QETrack.getComponentAt(number);                // Get component by index
QETrack.getItemAt(number);                     // Get item by index
QETrack.getTransitionAt(number);               // Get transition by index
QETrack.insert(object, string, bool, bool, bool, bool);  // Insert clip
QETrack.isLocked();                            // Check if locked
QETrack.isMuted();                             // Check if muted
QETrack.isSyncLocked();                        // Check if sync locked
QETrack.overwrite(object, string, bool, bool, bool);     // Overwrite clip
QETrack.razor(string, bool, bool);             // Razor at time
QETrack.setLock(bool);                         // Set lock state
QETrack.setMute(bool);                         // Set mute state
QETrack.setName(string);                       // Set track name
QETrack.setSyncLock(bool);                     // Set sync lock
```

### Common QE Usage Examples

```javascript
// 1. Create new audio track when all tracks are full
app.enableQE();
const qeSequence = qe.project.getActiveSequence();
const currentAudioTracks = app.project.activeSequence.audioTracks.numTracks;
qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);

// 2. Check if media is still conforming
app.enableQE();
const projectItem = app.project.rootItem.children[0];
const qeItem = qe.project.getItemAt(0); // Get corresponding QE item
if (qeItem.isAudioConforming()) {
    alert("Audio is still conforming, please wait...");
}

// 3. Render preview for better playback
app.enableQE();
const qeSeq = qe.project.getActiveSequence();
qeSeq.renderPreview(); // Render preview files

// 4. Clean up empty tracks
app.enableQE();
const qeSeq = qe.project.getActiveSequence();
qeSeq.removeEmptyAudioTracks();
qeSeq.removeEmptyVideoTracks();

// 5. Set sequence to use maximum quality
app.enableQE();
const qeSeq = qe.project.getActiveSequence();
qeSeq.setUseMaxBitDepth(true);
qeSeq.setUseMaxRenderQuality(true);
```

### Common Workflows for AI SFX Plugin

#### 1. Detect SFX Folders in Project
```javascript
function findSFXFolders(parent = app.project.rootItem, results = []) {
    for (var i = 0; i < parent.children.numItems; i++) {
        var item = parent.children[i];
        if (item.type === ProjectItemType.BIN && 
            item.name.toLowerCase().indexOf("sfx") !== -1) {
            results.push(item);
        }
        if (item.type === ProjectItemType.BIN) {
            findSFXFolders(item, results);
        }
    }
    return results;
}
```

#### 2. Place Audio at Playhead
```javascript
function placeAudioAtPlayhead(audioFile) {
    var playheadTime = app.project.activeSequence.getPlayerPosition().seconds;
    var audioTrack = app.project.activeSequence.audioTracks[0];
    
    // Import audio file first
    var importedItem = app.project.importFiles([audioFile]);
    
    // Place at playhead
    audioTrack.overwriteClip(importedItem[0], playheadTime);
}
```

#### 3. Smart Track Placement
```javascript
function findEmptyAudioTrack() {
    var audioTracks = app.project.activeSequence.audioTracks;
    var playheadTime = app.project.activeSequence.getPlayerPosition().seconds;
    
    for (var i = 0; i < audioTracks.numTracks; i++) {
        var track = audioTracks[i];
        var hasClipAtTime = false;
        
        for (var j = 0; j < track.clips.numItems; j++) {
            var clip = track.clips[j];
            if (playheadTime >= clip.start.seconds && 
                playheadTime <= clip.end.seconds) {
                hasClipAtTime = true;
                break;
            }
        }
        
        if (!hasClipAtTime) return track;
    }
    
    return null; // No empty track found
}
```

### Troubleshooting Common Issues

#### Issue: Can't access activeSequence
```javascript
if (!app.project.activeSequence) {
    alert("No active sequence. Please open a sequence.");
    return;
}
```

#### Issue: Import fails
```javascript
var file = new File(filePath);
if (!file.exists) {
    alert("File not found: " + filePath);
    return;
}
```

#### Issue: Timeline position errors
```javascript
var time = app.project.activeSequence.getPlayerPosition();
if (time.seconds < 0) {
    time.seconds = 0; // Clamp to valid range
}
```

## Complete ExtendScript API Reference - Every Object & Method

### Application Object (`app`)
```javascript
// Global application access
app.quit()                           // Quit Premiere Pro
app.openDocument(filePath)           // Open project file
app.newProject(projectPath)          // Create new project
app.getAppPrefPath()                 // Get preferences path
app.getAppSystemPrefPath()           // Get system preferences path

// Application properties
app.version                          // Premiere Pro version
app.build                           // Build number
app.anywhere                        // Adobe Anywhere integration
app.encoder                         // Adobe Media Encoder access
app.production                      // Production panel access
```

### Project Object (`app.project`)
```javascript
// Project properties
app.project.name                     // Project name (read/write)
app.project.path                     // Project file path (read-only)
app.project.sequences                // All sequences collection
app.project.rootItem                 // Root project item (bin)
app.project.activeSequence          // Currently active sequence
app.project.documentID              // Unique project identifier

// Project methods
app.project.save()                   // Save project
app.project.saveAs(path)            // Save project as
app.project.close(closeOptions)     // Close project
app.project.importFiles(arrayPaths, suppressUI, targetBin, importAsNumberedStills)
app.project.createNewSequence(name, placeholderID)
app.project.deleteSequence(sequence)
app.project.consolidateDuplicates()
app.project.exportAAF(exportPath, includeAllSequences, embedAudio, audioFileFormat, trimSources, handleFrameRate, startAllSequencesAtZero, filePathMode)
app.project.exportOMF(exportPath, OMFTitle, sampleRate, bitsPerSample, audioEncapsulated, audioFileFormat, trimSources, handleFrameRate, includeAllSequences)
app.project.exportTimeline(outputPresetPath)
app.project.exportFinalCutProXML(exportPath, suppressUI)
app.project.openSequence(sequenceID)
app.project.pauseGrowing(pause)
app.project.placeAsset(assetArrayFilePaths)
```

### Sequence Object
```javascript
// Sequence properties
sequence.name                        // Sequence name (read/write)
sequence.sequenceID                  // Unique sequence ID
sequence.frameSizeHorizontal         // Frame width
sequence.frameSizeVertical           // Frame height
sequence.videoTracks                 // Video tracks collection
sequence.audioTracks                 // Audio tracks collection
sequence.markers                     // Sequence markers
sequence.end                         // Sequence end time
sequence.zeroPoint                   // Zero point time

// Timeline control methods
sequence.getPlayerPosition()         // Get playhead position (Time object)
sequence.setPlayerPosition(time)     // Set playhead position
sequence.getInPointAsTime()         // Get in point as Time object
sequence.getOutPointAsTime()        // Get out point as Time object
sequence.setInPoint(seconds)        // Set in point in seconds
sequence.setOutPoint(seconds)       // Set out point in seconds
sequence.setWorkAreaEnabled(enabled) // Enable/disable work area
sequence.isWorkAreaEnabled()        // Check work area status

// Selection and editing
sequence.getSelection()             // Get selected clips array
sequence.createSubsequence(ignoreTrackTargeting) // Create nested sequence
sequence.linkSelection()            // Link selected clips
sequence.unlinkSelection()          // Unlink selected clips
sequence.lift()                     // Lift selected clips
sequence.extract()                  // Extract selected clips
sequence.razor(time)                // Cut clips at time

// Rendering and export
sequence.renderVideoFrameAtTime(filePath, frameWidth, frameHeight, time, renderTimeAsFilename)
sequence.exportAsMediaDirect(outputPresetPath, outputPath, quality)
sequence.exportAsProject(exportPath)

// Sequence settings (Premiere 2019+)
sequence.videoFrameRate             // Frame rate
sequence.videoFieldType             // Field type
sequence.videoPixelAspectRatio      // Pixel aspect ratio
sequence.videoDisplayFormat         // Display format
sequence.audioChannelType           // Audio channel type
sequence.audioChannelCount          // Number of audio channels
sequence.audioSampleRate            // Audio sample rate
sequence.videoCodec                 // Video codec
sequence.audioCodec                 // Audio codec

// Auto-reframe (2020+)
sequence.autoReframeSequence(newAspectRatio, motionPreset, useMotionTracking, useClipNames)
```

### Track Objects
```javascript
// Video Track properties and methods
videoTrack.name                     // Track name (read/write)
videoTrack.id                       // Track ID
videoTrack.clips                    // Clips on track (collection)
videoTrack.transitions              // Transitions on track
videoTrack.muted                    // Mute state (read/write)
videoTrack.enabled                  // Track enabled state

// Track clip operations
videoTrack.insertClip(projectItem, time)     // Insert clip (pushes others)
videoTrack.overwriteClip(projectItem, time)  // Overwrite clip at position
videoTrack.razor(time)                       // Cut clips at time

// Audio Track (same as video track plus:)
audioTrack.setMute(muted)           // Set mute state
audioTrack.isMuted()                // Check mute state
audioTrack.setSolo(solo)            // Set solo state
audioTrack.isSolo()                 // Check solo state
```

### ProjectItem Object
```javascript
// ProjectItem properties
projectItem.name                    // Item name (read/write)
projectItem.type                    // Type: BIN, CLIP, FILE, ROOT
projectItem.treePath                // Path in project panel
projectItem.children                // Child items (for bins)
projectItem.getProxyPath()          // Proxy file path
projectItem.hasProxy()              // Has proxy attached
projectItem.canProxy()              // Can attach proxy
projectItem.getMediaPath()          // Media file path
projectItem.getMetadata()           // Metadata object

// Bin operations (when type is BIN)
projectItem.createBin(name)         // Create child bin
projectItem.createSmartBin(name, query) // Create smart bin
projectItem.deleteBin()             // Delete this bin
projectItem.renameBin(newName)      // Rename bin
projectItem.moveBin(newParent)      // Move to new parent

// File operations
projectItem.refreshMedia()          // Refresh media
projectItem.changeMediaPath(newPath, overrideChecks) // Relink media
projectItem.clearInOut()            // Clear in/out points
projectItem.setInPoint(time, mediaType) // Set in point
projectItem.setOutPoint(time, mediaType) // Set out point
projectItem.getInPoint(mediaType)   // Get in point
projectItem.getOutPoint(mediaType)  // Get out point

// Proxy operations
projectItem.attachProxy(proxyPath, isHiRes)
projectItem.canChangeMediaPath()
projectItem.select()                // Select in project panel

// Metadata operations
projectItem.setMetadata(metadata, propertyID, value)
projectItem.getProjectColumnsMetadata()
```

### TrackItem Object (Clips on Timeline)
```javascript
// TrackItem properties
trackItem.name                      // Clip name (read/write)
trackItem.start                     // Start time (Time object)
trackItem.end                       // End time (Time object)
trackItem.duration                  // Duration (Time object)
trackItem.inPoint                   // In point (Time object)
trackItem.outPoint                  // Out point (Time object)
trackItem.mediaType                 // "Video" or "Audio"
trackItem.projectItem               // Source project item
trackItem.speed                     // Playback speed
trackItem.isAdjustmentLayer()       // Is adjustment layer
trackItem.isSelected()              // Is selected

// TrackItem methods (15.4+)
trackItem.move(newTime)             // Move clip to new time
trackItem.disabled                  // Disable/enable clip (read/write)

// Effects and properties
trackItem.components                // Effects collection
trackItem.getSpeed()                // Get speed
trackItem.setSpeed(speed)           // Set speed
trackItem.reverse(reverseAudio)     // Reverse clip
```

### Marker Object
```javascript
// Marker properties
marker.name                         // Marker name (read/write)
marker.comments                     // Comments (read/write)
marker.start                        // Start time (Time object)
marker.end                          // End time (Time object)
marker.guid                         // Unique identifier
marker.type                         // Marker type

// Marker methods
marker.remove()                     // Remove marker
marker.setTypeAsComment()           // Set as comment marker
marker.setTypeAsChapter()           // Set as chapter marker
marker.setTypeAsSegmentation()      // Set as segmentation marker
marker.setTypeAsWebLink()           // Set as web link marker

// Color methods (13.x+)
marker.getColorByIndex()            // Get color by index
marker.setColorByIndex(colorIndex)  // Set color by index
```

### Time Object
```javascript
// Time properties
time.seconds                        // Time in seconds (read/write)
time.ticks                          // Time in ticks (read/write)

// Time methods
time.getFormatted(frameRate, displayFormat) // Get formatted string
```

### Production Object
```javascript
// Production properties
app.production.name                 // Production name
app.production.path                 // Production path

// Production methods
app.production.openProduction(productionPath)
app.production.closeProduction()
app.production.newProduction(productionPath, productionName)
app.production.getProjectPanelMetadata()
app.production.moveToTrash(projectOrFolderPath, suppressUI, saveProject)
```

### Collections (numItems property for all)
```javascript
// Common collection methods
collection.numItems                 // Number of items
collection[index]                   // Access by index

// Sequences collection
app.project.sequences.numSequences  // Number of sequences

// Tracks collections  
sequence.videoTracks.numTracks      // Number of video tracks
sequence.audioTracks.numTracks      // Number of audio tracks

// Items collections
projectItem.children.numItems       // Number of child items
track.clips.numItems                // Number of clips on track
```

### Advanced Workflows

#### Complete Project Scanning
```javascript
function scanEntireProject(item = app.project.rootItem, depth = 0) {
    var indent = "";
    for (var i = 0; i < depth; i++) indent += "  ";
    
    console.log(indent + item.name + " (" + item.type + ")");
    
    if (item.type === ProjectItemType.BIN) {
        for (var j = 0; j < item.children.numItems; j++) {
            scanEntireProject(item.children[j], depth + 1);
        }
    }
}
```

#### Timeline Analysis
```javascript
function analyzeTimeline() {
    var seq = app.project.activeSequence;
    
    // Analyze all tracks
    for (var v = 0; v < seq.videoTracks.numTracks; v++) {
        var vTrack = seq.videoTracks[v];
        console.log("Video Track " + v + ": " + vTrack.clips.numItems + " clips");
        
        for (var c = 0; c < vTrack.clips.numItems; c++) {
            var clip = vTrack.clips[c];
            console.log("  Clip: " + clip.name + " (" + clip.start.seconds + "s to " + clip.end.seconds + "s)");
        }
    }
    
    for (var a = 0; a < seq.audioTracks.numTracks; a++) {
        var aTrack = seq.audioTracks[a];
        console.log("Audio Track " + a + ": " + aTrack.clips.numItems + " clips");
    }
}
```

#### Advanced Selection Management
```javascript
function getSelectionInfo() {
    var selection = app.project.activeSequence.getSelection();
    var info = {
        totalClips: selection.length,
        videoClips: 0,
        audioClips: 0,
        tracks: [],
        timeRange: { start: null, end: null }
    };
    
    for (var i = 0; i < selection.length; i++) {
        var clip = selection[i];
        
        if (clip.mediaType === "Video") info.videoClips++;
        if (clip.mediaType === "Audio") info.audioClips++;
        
        if (info.tracks.indexOf(clip.parentTrackIndex) === -1) {
            info.tracks.push(clip.parentTrackIndex);
        }
        
        if (info.timeRange.start === null || clip.start.seconds < info.timeRange.start) {
            info.timeRange.start = clip.start.seconds;
        }
        if (info.timeRange.end === null || clip.end.seconds > info.timeRange.end) {
            info.timeRange.end = clip.end.seconds;
        }
    }
    
    return info;
}
```

#### Complete Sequence Creation
```javascript
function createSequenceWithSettings(name, frameRate, width, height) {
    var newSeq = app.project.createNewSequence(name, "");
    
    // Get current settings
    var seqSettings = newSeq.getSettings();
    
    // Modify settings
    seqSettings.videoFrameRate = frameRate;
    seqSettings.videoFrameWidth = width;
    seqSettings.videoFrameHeight = height;
    
    // Apply settings
    newSeq.setSettings(seqSettings);
    
    return newSeq;
}
```

## Critical: Shared ExtendScript Environment & Best Practices

### ⚠️ SHARED VS ISOLATED ENVIRONMENTS

Adobe apps use different ExtendScript environment models:

**Shared Environments (DANGER ZONE):**
- **After Effects**
- **Premiere Pro** 
- **Media Encoder**

**Isolated Environments (Safe):**
- Photoshop
- Illustrator
- Animate
- Audition

### 🚨 What This Means for Premiere Pro Development

Since Premiere Pro uses a **SHARED ENVIRONMENT**, your code runs in the same global space as ALL other scripts and extensions. This means:

1. **Your global variables can break other tools**
2. **Other tools' globals can break yours**
3. **Modified prototypes affect EVERYONE**
4. **Namespace collisions cause mysterious bugs**

### ❌ NEVER DO THIS (Global Namespace Pollution)

```javascript
// BAD: Unscoped variable pollutes global namespace
var renderFlag = true;

(function() {
  // BAD: Uninitialized variable becomes global
  startFlag = true;
})();

// BAD: Global function
function processVideo() {
  // Anyone can overwrite this
}
```

### ✅ ALWAYS DO THIS (Proper Scoping)

#### 1. For Regular Scripts - Use IIFE
```javascript
(function() {
  // GOOD: All variables are scoped
  var renderFlag = true;
  var startFlag = true;
  
  function processVideo() {
    // This function is private
  }
})();
```

#### 2. For CEP Extensions - Use Unique Namespace
```javascript
// ExtendScript side - attach to $ object with unique ID
$['com.aisfx.generator'] = {
  renderFlag: true,
  startFlag: true,
  
  processVideo: function() {
    // Safely scoped function
  },
  
  generateSFX: function(prompt, duration) {
    // Another safe function
  }
};

// JavaScript side - call scoped functions
const csi = new CSInterface();
csi.evalScript(`$['com.aisfx.generator'].generateSFX("explosion", 2);`);
```

#### 3. Bolt CEP Makes This Even Easier
```javascript
// Bolt automatically scopes for you
export const generateSFX = (prompt: string, duration: number) => {
  // This is automatically scoped to your extension
};

// Call from JS - Bolt handles the scoping
await evalTS('generateSFX', 'explosion', 2);
```

### ❌ NEVER MODIFY PROTOTYPES

```javascript
// NEVER DO THIS in Premiere/AE/Media Encoder
Array.prototype.forEach = function(callback) {
  // This affects ALL extensions!
};

// NEVER DO THIS
String.prototype.trim = function() {
  // You just broke someone else's tool
};

// NEVER DO THIS
Date.prototype.format = function() {
  // Global prototype pollution
};
```

### ✅ USE HELPER FUNCTIONS INSTEAD

```javascript
// GOOD: Helper function instead of prototype
function forEach(array, callback) {
  for (var i = 0; i < array.length; i++) {
    callback(array[i], i, array);
  }
}

// GOOD: String helper
function trim(str) {
  return str.replace(/^\s+|\s+$/g, '');
}

// GOOD: Use the helper
forEach(myArray, function(item) {
  console.log(trim(item));
});
```

### 📋 Best Practices Checklist

1. **Always scope your code**
   - Use IIFE for scripts
   - Use unique namespace for CEP extensions
   - Never create uninitialized variables

2. **Never modify prototypes**
   - Use helper functions instead
   - Import polyfill libraries that don't modify globals
   - Test with other popular extensions installed

3. **Use unique identifiers**
   - Prefix with your company/extension ID
   - Example: `com.yourcompany.extensionname`
   - Avoid generic names like "utils" or "helpers"

4. **Test for conflicts**
   - Install popular extensions alongside yours
   - Check for global variable conflicts
   - Verify your tool doesn't break others

5. **Use modern tools**
   - Bolt CEP handles scoping automatically
   - TypeScript helps prevent global pollution
   - Linters can catch unscoped variables

### 🛡️ Defensive Programming

```javascript
// Check if your namespace already exists (defensive)
if (typeof $['com.aisfx.generator'] === 'undefined') {
  $['com.aisfx.generator'] = {};
}

// Store reference to avoid repeated lookups
var myNamespace = $['com.aisfx.generator'];

// Now use your namespace
myNamespace.doSomething = function() {
  // Your code here
};
```

### 🎯 Summary

For Premiere Pro development:
1. **ALWAYS** scope your code - no exceptions
2. **NEVER** modify prototypes - use helpers
3. **USE** unique namespaces - avoid collisions
4. **TEST** with other extensions - ensure compatibility
5. **CONSIDER** Bolt CEP - handles scoping automatically

Remember: In Premiere Pro's shared environment, being a good citizen means protecting your code AND respecting others' code!

## Next Steps
1. ✅ **COMPLETE**: Study Premiere Pro ExtendScript API documentation  
2. ✅ **COMPLETE**: Catalog every object, method, and property
3. ✅ **COMPLETE**: Understand shared environment implications
4. Implement timeline position detection using `getPlayerPosition()`
5. Build sequence change event handlers with polling method
6. Create bin scanning functionality with `findSFXFolders()`
7. Test audio placement at playhead with `overwriteClip()`

# A Comprehensive Guide to Adobe CEP Plugin Development with Bolt

## I. Introduction to Adobe CEP and Bolt Development

### A. Understanding Adobe CEP (Common Extensibility Platform)
The Adobe Common Extensibility Platform (CEP), previously known as CSXS, serves as the technology enabling developers to augment the capabilities of Adobe Creative Cloud (CC) applications. This is achieved through the use of standard web technologies, namely HTML, CSS, and JavaScript (specifically ECMAScript 5 onwards, introduced with CEP 4.0). This approach marked a significant departure from the older, now deprecated, Flash/ActionScript model for building extensions.

Extensions built with CEP are integrated into host applications via the PlugPlug Library architecture. This library is a crucial component that facilitates interprocess communication, bridging the CEP environment (which utilizes the V8 JavaScript engine), the host application's ExtendScript Document Object Model (DOM), and any natively compiled C++ plugins that might be part of the extension.

At its core, CEP functions as an embedded instance of the Chromium Embedded Framework (CEF) within Adobe applications. This provides a browser-like environment for the extension's user interface while also offering a unique and direct connection to the host application's scripting functionalities. The transition from Flash/ActionScript to a model based on HTML5 and JavaScript reflects Adobe's strategic alignment with modern web standards for application extensibility.

### B. Introducing Bolt for CEP: Modernizing Extension Development
Bolt CEP emerges as a contemporary solution designed to accelerate and simplify the development of Adobe CEP extensions. It is characterized as a "lightning-fast boilerplate" that leverages modern web development tools and frameworks, including options such as React, Vue, or Svelte, and is built upon a foundation of Vite, TypeScript, and Sass.

The advantages of using Bolt CEP are numerous:
- **Vite Integration**: Next-generation frontend tooling with exceptionally fast Hot Module Replacement (HMR)
- **TypeScript Support**: End-to-end type safety for both panel and ExtendScript code
- **Framework Flexibility**: Choice of React, Vue, or Svelte
- **Simplified Workflow**: Easy configuration via `cep.config.ts`
- **Type-safe ExtendScript**: `evalTS()` function for safe host communication
- **Automated Packaging**: Streamlined ZXP generation and signing
- **GitHub Actions**: Pre-configured for automated releases

## II. Setting Up Your Development Environment

### A. Prerequisites for CEP and Bolt Development
To embark on CEP and Bolt development, several software components and tools must be in place:

1. **Adobe Creative Cloud Applications**: Target Adobe CC applications (2022 or later recommended)
2. **Node.js**: Version 18 or more recent
3. **Package Manager**: NPM, Yarn (classic), or PNPM
4. **Text Editor/IDE**: VS Code recommended
5. **ExtendScript Toolkit** (Optional): For quick ExtendScript testing
6. **ZXP Installer**: For easy PlayerDebugMode toggling
7. **Chrome Browser**: For remote debugging

### B. Scaffolding a Bolt CEP Project
Bolt CEP dramatically simplifies project creation through its CLI tool:

```bash
# Using Yarn
yarn create bolt-cep

# Using NPM
npx create-bolt-cep

# Using PNPM
pnpm create-bolt-cep
```

The CLI will prompt for:
- Preferred frontend framework (React, Vue, or Svelte)
- Project configuration options
- Automatic dependency installation

### C. Enabling PlayerDebugMode
PlayerDebugMode must be enabled for development:

**Method 1: ZXP Installer Tool**
- Use aescripts ZXP Installer
- Navigate to Settings > Debug > Enable Debugging

**Method 2: Manual (OS-Specific)**
- **macOS**: Edit `.plist` file in `~/Library/Preferences/`
- **Windows**: Add registry keys under `HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.XX`

### D. Key Configuration Files

#### manifest.xml
Located in `CSXS/` folder, defines:
- Extension bundle ID and version
- Compatible host applications
- UI components and entry points
- CEP runtime requirements
- Node.js enablement flags

#### cep.config.ts (Bolt-specific)
Bolt's type-safe configuration for:
- Extension metadata
- Panel dimensions and properties
- Debug port settings
- Build parameters
- Icon specifications

## III. Core Adobe CEP Concepts

### A. The Extension Manifest Structure
The `manifest.xml` is the cornerstone of any CEP extension:

```xml
<ExtensionManifest ExtensionBundleId="com.example.extension" 
                   ExtensionBundleVersion="1.0.0" 
                   Version="12.0">
    <ExtensionList>
        <Extension Id="com.example.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./main/index.html</MainPath>
                </Resources>
                <CEFCommandLine>
                    <Parameter>--enable-nodejs</Parameter>
                </CEFCommandLine>
            </DispatchInfo>
            <HostList>
                <Host Name="PPRO" Version="[23.0,99.9]"/>
            </HostList>
            <UI>
                <Type>Panel</Type>
                <Menu>My Extension</Menu>
                <Geometry>
                    <Size>
                        <Width>300</Width>
                        <Height>400</Height>
                    </Size>
                </Geometry>
            </UI>
        </Extension>
    </ExtensionList>
</ExtensionManifest>
```

### B. The CSInterface.js API
CSInterface.js provides the bridge between your extension and the host application:

**Key Methods:**
- `evalScript(script, callback)`: Execute ExtendScript in host
- `addEventListener(type, listener)`: Listen for CEP events
- `getHostEnvironment()`: Get host app info and theme
- `getSystemPath(pathType)`: Access system directories
- `openURLInDefaultBrowser(url)`: Open external links

### C. CEP Architecture: JavaScript Contexts

CEP extensions operate in multiple JavaScript contexts:

1. **Browser Context (CEF)**: Standard web APIs, DOM manipulation
2. **Native Context (CEP)**: CSInterface.js API access
3. **Node.js Context**: File system, networking, NPM modules
4. **Host App Context (ExtendScript)**: Direct app manipulation

### D. Communicating with ExtendScript

**Standard Approach:**
```javascript
const csInterface = new CSInterface();
csInterface.evalScript('app.project.activeSequence.name', (result) => {
    console.log('Sequence name:', result);
});
```

**Bolt's Type-Safe Approach:**
```typescript
import { evalTS } from './lib/utils/bolt';

const sequenceName = await evalTS('getActiveSequenceName');
```

## IV. Developing with Bolt CEP

### A. Leveraging Bolt's Modern Features

**Hot Module Replacement (HMR)**
- Instant updates without panel reload
- Works for JS, CSS, and even ExtendScript
- Powered by Vite's dev server

**ES6+ and TypeScript**
- Modern JavaScript features in both panel and ExtendScript
- Full TypeScript support with type inference
- Community type definitions via Types-for-Adobe

**Optimized Builds**
- Tree-shaking and minification via Rollup
- Smaller ZXP files for faster distribution
- Automatic code splitting

### B. Bolt-Specific ExtendScript Integration

**evalTS()**
- Type-safe ExtendScript calls
- Automatic JSON marshalling
- Namespace collision prevention

```typescript
// Define in ExtendScript (ppro.ts)
export const getClipInfo = (clipId: string) => {
    const clip = findClipById(clipId);
    return {
        name: clip.name,
        duration: clip.duration.seconds,
        inPoint: clip.inPoint.seconds
    };
};

// Use in panel (main.tsx)
const clipInfo = await evalTS('getClipInfo', 'clip123');
```

**listenTS() and dispatchTS()**
- Type-safe event communication
- ExtendScript to panel messaging
- Shared type definitions in `universals.d.ts`

```typescript
// In universals.d.ts
export interface SequenceChangeEvent {
    oldSequence: string;
    newSequence: string;
    timestamp: number;
}

// In ExtendScript
dispatchTS('sequenceChanged', {
    oldSequence: 'Sequence 1',
    newSequence: 'Sequence 2',
    timestamp: Date.now()
});

// In panel
listenTS('sequenceChanged', (event: SequenceChangeEvent) => {
    console.log(`Switched from ${event.oldSequence} to ${event.newSequence}`);
});
```

### C. Managing UI and State

**React Example:**
```tsx
const [clips, setClips] = useState<Clip[]>([]);
const [isLoading, setIsLoading] = useState(false);

const loadClips = async () => {
    setIsLoading(true);
    const projectClips = await evalTS('getAllClips');
    setClips(projectClips);
    setIsLoading(false);
};
```

**Multi-Panel Support:**
- Configure multiple panels in `cep.config.ts`
- Share code between panels
- Each panel has its own entry point

### D. File System and Data Persistence

**Node.js File Access:**
```javascript
const fs = require('fs');
const path = require('path');

// Read configuration
const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
);

// Write user preferences
fs.writeFileSync(
    path.join(userData, 'preferences.json'),
    JSON.stringify(preferences)
);
```

**Storage Options:**
- LocalStorage/SessionStorage for small data
- File system for larger datasets
- Cookies for session management

## V. Debugging and Testing

### A. Essential Debugging Setup

**.debug File Structure:**
```xml
<ExtensionList>
    <Extension Id="com.aisfx.cep.main">
        <HostList>
            <Host Name="PPRO" Port="3005"/>
        </HostList>
    </Extension>
</ExtensionList>
```

### B. Remote Debugging with Chrome DevTools
1. Launch Adobe host application
2. Open extension from Window > Extensions
3. Navigate to `http://localhost:3005` in Chrome
4. Use full DevTools features:
   - Element inspection
   - JavaScript debugging
   - Network monitoring
   - Performance profiling

### C. Debugging ExtendScript with VS Code

**🎯 Modern ExtendScript Debugging Workflow**

Now that Adobe has deprecated ESTK (ExtendScript Toolkit), VS Code with the ExtendScript Debugger extension is the official debugging solution.

**Initial Setup:**
1. Install [ExtendScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) extension in VS Code
2. Create `.vscode/launch.json` in your project:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "extendscript-debug",
      "request": "launch",
      "name": "Premiere Pro: Debug ExtendScript",
      "hostAppSpecifier": "premierepro",
      "script": "${workspaceFolder}/src/jsx/ppro/ppro.ts"
    },
    {
      "type": "extendscript-debug", 
      "request": "attach",
      "name": "Premiere Pro: Attach to Running",
      "hostAppSpecifier": "premierepro"
    }
  ]
}
```

**Workflow Benefits:**

1. **Breakpoints in ExtendScript**
   - Set breakpoints directly in your `.jsx` or `.ts` ExtendScript files
   - Step through code line by line
   - Inspect variables and object properties in real-time

2. **Console Output**
   - `$.writeln()` outputs appear in VS Code Debug Console
   - No more hunting for log files or ExtendScript Toolkit console

3. **Live Editing**
   - Edit ExtendScript while debugging
   - Restart debugging session to test changes immediately
   - No need to reload extension

4. **Dual-Layer Debugging**
   ```javascript
   // JavaScript Layer (Chrome DevTools)
   console.log('🔍 JS Layer:', data);
   
   // ExtendScript Layer (VS Code Debug Console)
   $.writeln('🔍 ExtendScript Layer: ' + JSON.stringify(data));
   ```

**Enhanced Development Workflow:**

1. **Start Both Debuggers**
   - Chrome DevTools: `http://localhost:PORT` for JS/React debugging
   - VS Code: F5 to start ExtendScript debugging

2. **Set Strategic Breakpoints**
   ```javascript
   // In ppro.ts
   export const importAndPlaceAudio = (filePath: string) => {
     $.writeln('🎯 Starting import: ' + filePath);
     
     // Set breakpoint here to inspect app state
     debugger; // Alternative to VS Code breakpoint
     
     const sequence = app.project.activeSequence;
     // Step through and inspect sequence properties
   };
   ```

3. **Watch Expressions**
   - Add watches for frequently checked values:
     - `app.project.activeSequence.name`
     - `app.project.rootItem.children.numItems`
     - `qe.project.getActiveSequence()`

4. **Conditional Breakpoints**
   - Right-click breakpoint → "Edit Breakpoint"
   - Add conditions like `audioTracks.numTracks > 5`

**Best Practices:**

1. **Error Boundaries**
   ```javascript
   try {
     // Your ExtendScript code
   } catch (e) {
     $.writeln('❌ Error: ' + e.toString());
     $.writeln('Stack: ' + e.stack); // VS Code shows full stack
     throw e; // Re-throw to trigger debugger
   }
   ```

2. **Debug Helpers**
   ```javascript
   // Add debug utility to your namespace
   $['com.aisfx.generator'].debug = {
     logState: function() {
       $.writeln('=== Current State ===');
       $.writeln('Sequence: ' + app.project.activeSequence?.name);
       $.writeln('Tracks: ' + app.project.activeSequence?.audioTracks.numTracks);
       // Add more state info
     },
     
     inspectTrack: function(index) {
       var track = app.project.activeSequence.audioTracks[index];
       $.writeln('Track ' + index + ': ' + track.clips.numItems + ' clips');
     }
   };
   ```

3. **Performance Profiling**
   ```javascript
   var startTime = new Date().getTime();
   
   // Your operation
   scanProjectBins();
   
   var elapsed = new Date().getTime() - startTime;
   $.writeln('⏱️ Operation took: ' + elapsed + 'ms');
   ```

### D. Log Files and Troubleshooting

**CEP Log Locations:**
- Windows: `C:\Users\<USERNAME>\AppData\Local\Temp\`
- macOS: `~/Library/Logs/CSXS/`

**Common Issues:**
- `window.__adobe_cep__ is undefined`: CEP not initialized
- Extension not appearing: Check manifest and PlayerDebugMode
- Debug connection failed: Verify .debug file and ports

## VI. Packaging and Distribution

### A. Building for Production
```bash
# Create optimized build
yarn build

# Build creates symlink to Adobe extensions folder
# Test production build before packaging
```

### B. Creating and Signing ZXP Packages

**Bolt Commands:**
```bash
# Package and sign as ZXP
yarn zxp

# Bundle with additional assets
yarn zip
```

**Certificate Requirements:**
- Self-signed for testing/internal use
- CA-issued for Adobe Exchange
- Always use timestamping

### C. Distribution Strategies

**Direct Distribution:**
- Host ZXP on your website
- Users install via ZXP installer
- Full control over distribution

**Adobe Exchange:**
- Submit via Adobe Developer Console
- Adobe review process
- Built-in discovery and installation
- Payment processing for paid plugins

## VII. Advanced Topics

### A. Inter-Extension Communication
```javascript
// Extension A dispatches event
const event = new CSEvent();
event.type = 'com.example.customEvent';
event.data = { message: 'Hello from Extension A' };
new CSInterface().dispatchEvent(event);

// Extension B listens
new CSInterface().addEventListener('com.example.customEvent', (evt) => {
    console.log('Received:', evt.data.message);
});
```

### B. Localization
```javascript
// Initialize resource bundle
csInterface.initResourceBundle();

// Load localized strings
const localizedStrings = {
    'en': { welcome: 'Welcome' },
    'es': { welcome: 'Bienvenido' },
    'fr': { welcome: 'Bienvenue' }
};
```

### C. Performance Optimization
- Minimize `evalScript` calls
- Batch ExtendScript operations
- Use event-driven updates vs polling
- Implement virtual scrolling for large lists
- Lazy load non-critical assets

## VIII. Modern Extension Development Workflow

### 🚀 Complete Development Setup with ExtendScript Debugger

With the ExtendScript Debugger installed in VS Code, your workflow becomes significantly more powerful:

#### 1. **Dual-Layer Development Environment**

```bash
# Terminal 1: Run development server
npm run dev  # or yarn dev

# Browser: Open Chrome DevTools
http://localhost:3005  # For JavaScript/React layer

# VS Code: Launch ExtendScript debugging
F5  # Start debugging ExtendScript layer
```

#### 2. **File Watching & Hot Reload**

- **JavaScript Layer**: Vite HMR updates instantly
- **ExtendScript Layer**: Changes require debugger restart (Shift+F5, then F5)
- **CSS/SCSS**: Hot reloads without losing state

#### 3. **Error Tracking Across Layers**

```javascript
// In your React component (main.tsx)
try {
  const result = await evalTS('placeAudioAtPlayhead', audioPath);
  if (!result.success) {
    console.error('JS Layer Error:', result.error);
    // This shows in Chrome DevTools
  }
} catch (e) {
  console.error('ExtendScript call failed:', e);
}

// In your ExtendScript (ppro.ts)
export const placeAudioAtPlayhead = (audioPath: string) => {
  try {
    // Your code here
  } catch (e) {
    $.writeln('ExtendScript Error: ' + e.toString());
    // This shows in VS Code Debug Console
    return { success: false, error: e.toString() };
  }
};
```

#### 4. **Testing Workflow**

1. **Unit Testing ExtendScript Functions**
   - Create test configurations in launch.json
   - Run specific functions with test data
   - Use conditional breakpoints for edge cases

2. **Integration Testing**
   - Test full user flows from UI to timeline
   - Monitor both debug consoles simultaneously
   - Use performance profiling in both layers

#### 5. **Production Build Verification**

```bash
# Build for production
npm run build

# Test production build with debugging
# 1. Build creates symlink in Adobe extensions folder
# 2. Reload extension in Premiere
# 3. Attach debugger to running instance
```

### 📋 Development Checklist

- [ ] VS Code with ExtendScript Debugger installed
- [ ] Chrome/Chromium for DevTools debugging
- [ ] `.vscode/launch.json` configured for your host app
- [ ] Dual console monitoring setup
- [ ] Git hooks for linting ExtendScript (ES3 compatible)

### 🛠️ Troubleshooting Enhanced Workflow

| Issue | Solution |
|-------|----------|
| ExtendScript debugger won't connect | Ensure Premiere is running and project is open |
| Breakpoints not hitting | Check script path in launch.json matches actual file |
| Variables show as undefined | ExtendScript may need explicit type casting |
| Console output missing | Check both VS Code Debug Console AND Chrome DevTools |

### 🎯 Pro Tips

1. **Create Debug Snippets**
   ```javascript
   // Add to your ExtendScript
   function debugSnapshot() {
     var state = {
       sequence: app.project.activeSequence?.name,
       tracks: app.project.activeSequence?.audioTracks.numTracks,
       playhead: app.project.activeSequence?.getPlayerPosition().seconds
     };
     $.writeln('DEBUG SNAPSHOT: ' + JSON.stringify(state, null, 2));
   }
   ```

2. **Use Debug Configurations for Different Scenarios**
   ```json
   {
     "name": "Debug Track Creation",
     "type": "extendscript-debug",
     "request": "launch",
     "hostAppSpecifier": "premierepro",
     "script": "${workspaceFolder}/test/test-track-creation.jsx"
   }
   ```

3. **Leverage Watch Expressions**
   - Monitor QE API availability: `typeof qe !== 'undefined'`
   - Track sequence changes: `app.project.activeSequence.name`
   - Check namespace: `$['com.aisfx.generator']`

## IX. Key Resources

### Official Adobe Resources
- [Adobe CEP GitHub](https://github.com/Adobe-CEP/CEP-Resources)
- [CEP Cookbook Documentation](https://github.com/Adobe-CEP/CEP-Resources/tree/master/Documentation)
- [Adobe Developer Console](https://developer.adobe.com/developer-console/)
- [Adobe Exchange](https://exchange.adobe.com/)
- [ExtendScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug)

### Development Tools
- [Visual Studio Code](https://code.visualstudio.com/)
- [CEF Client](https://github.com/Adobe-CEP/CEP-Resources/tree/master/) (for Chrome DevTools compatibility)
- [ZXP Installer by aescripts](https://aescripts.com/learn/zxp-installer/)

### API Documentation
- [Docs for Adobe](https://docsforadobe.dev/) - Community-driven API docs
- [After Effects Command IDs](https://hyperbrew.co/blog/after-effects-command-ids/) - For accessing hidden functions

### Bolt CEP Resources
- [Bolt CEP GitHub](https://github.com/hyperbrew/bolt-cep)
- [Bolt Discord Community](https://discord.com/invite/bolt)
- [create-bolt-cep CLI](https://github.com/hyperbrew/create-bolt-cep)
- [vite-cep-plugin](https://github.com/hyperbrew/vite-cep-plugin)

### Community Resources
- Adobe Community Forums
- Davide Barranca's tutorials
- YouTube tutorials on CEP development
- [CEP Sample Panels](https://github.com/Adobe-CEP/Samples) - Official Adobe samples