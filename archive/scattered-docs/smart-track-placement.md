# Smart Track Placement with Collision Detection

**Status:** ✅ WORKING
**Tokens:** ~95

## Problem
Need to avoid placing audio clips on tracks that already have content at playhead

## Solution
```javascript
function hasAudioAtTime(track, time) {
    if (!track.clips || track.clips.numItems === 0) {
        return false;
    }
    
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        var clipStart = clip.start.seconds;
        var clipEnd = clip.end.seconds;
        
        // Check overlap with buffer
        if (time.seconds >= (clipStart - 0.1) && time.seconds <= (clipEnd + 0.1)) {
            return true;
        }
    }
    return false;
}

// Find available track
var foundTrack = false;
for (var idx = 0; idx < sequence.audioTracks.numTracks; idx++) {
    if (!hasAudioAtTime(sequence.audioTracks[idx], currentTime)) {
        // Place on this track
        foundTrack = true;
        break;
    }
}
```

## When to Use
Smart placement to avoid overlapping clips on timeline