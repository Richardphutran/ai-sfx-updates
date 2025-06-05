# QE API Track Creation

**Status:** ✅ WORKING (Undocumented API)
**Tokens:** ~90

## Problem
ExtendScript doesn't support creating new tracks, but QE (Quantum Engine) API does

## Solution
```javascript
// Enable QE API access
app.enableQE();
var qeSequence = qe.project.getActiveSequence();

// Add stereo audio track at the end
var currentAudioTracks = sequence.audioTracks.numTracks;
// Parameters: (videoTracks, afterVideo, audioTracks, audioType, afterAudio, submixTracks, submixType)
// audioType: 1 = stereo, 0 = mono
qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
```

## When to Use
When you need to create new tracks programmatically (not supported in standard ExtendScript)

## Important
- QE API is undocumented but used by professional plugins like Boombox
- Must call `app.enableQE()` first
- Track creation only takes effect after the call completes