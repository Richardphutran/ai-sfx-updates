# Timeline Placement with Collision Detection

## Problem
Placing audio clips on timeline needs to avoid overlapping existing clips.

## Solution
Smart track selection with collision detection and automatic track creation.

## Implementation
```javascript
// Function to check if track has audio at specific time
function hasAudioAtTime(track, timeSeconds) {
    try {
        if (!track.clips || track.clips.numItems === 0) {
            return false; // No clips = no conflict
        }
        
        for (var i = 0; i < track.clips.numItems; i++) {
            var clip = track.clips[i];
            var clipStart = clip.start.seconds;
            var clipEnd = clip.end.seconds;
            
            // Check overlap with small buffer
            if (timeSeconds >= (clipStart - 0.1) && timeSeconds <= (clipEnd + 0.1)) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return true; // If can't check, assume conflict
    }
}

// Smart track placement
var foundAvailableTrack = false;
for (var trackIdx = 0; trackIdx < sequence.audioTracks.numTracks; trackIdx++) {
    var track = sequence.audioTracks[trackIdx];
    if (!hasAudioAtTime(track, targetTime)) {
        finalTrackIndex = trackIdx;
        foundAvailableTrack = true;
        break;
    }
}

// Create new track if needed using QE API
if (!foundAvailableTrack) {
    app.enableQE();
    var qeSequence = qe.project.getActiveSequence();
    if (qeSequence && typeof qeSequence.addTracks === 'function') {
        var currentAudioTracks = sequence.audioTracks.numTracks;
        // Add 1 stereo audio track at the END
        qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
        finalTrackIndex = sequence.audioTracks.numTracks - 1;
    }
}

// Place clip
targetTrack.insertClip(importedItem, targetTime);
```

## Key Features
- Avoids overlapping clips
- Creates new tracks when needed
- Falls back gracefully on errors

## Token Savings
~200 tokens by reusing proven pattern