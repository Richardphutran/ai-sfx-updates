# Audio Clip Placement on Timeline

**Status:** ✅ WORKING
**Tokens:** ~80

## Problem
Need to import audio files and place them on timeline at specific positions

## Solution
```javascript
// In ExtendScript (jsx)
function importAndPlaceAudio(filePath, trackIndex) {
    var sequence = app.project.activeSequence;
    var currentTime = sequence.getPlayerPosition();
    
    // Import file
    var importResult = app.project.importFiles([filePath]);
    
    // Find imported item
    var rootItem = app.project.rootItem;
    var importedItem = null;
    for (var i = 0; i < rootItem.children.numItems; i++) {
        var item = rootItem.children[i];
        if (item.name && item.name.indexOf(baseName) !== -1) {
            importedItem = item;
            break;
        }
    }
    
    // Place on timeline
    var targetTrack = sequence.audioTracks[trackIndex];
    targetTrack.insertClip(importedItem, currentTime);
}
```

## When to Use
Placing generated audio files on timeline at playhead position