# Timeline Detection Breakthrough

**Status:** ✅ WORKING
**Verified In:** AI SFX Plugin
**Date:** June 1, 2025

## The Problem
Expected `onInPointChanged` and `onOutPointChanged` events don't fire in Premiere Pro.

## The Solution
Use `onProjectChanged` event - it fires reliably for ALL timeline changes including in/out points.

```javascript
// In ExtendScript (jsx file)
app.bind('onProjectChanged', function() {
    var event = new CSXSEvent();
    event.type = "timeline.changed";
    event.dispatch();
});

// In main.js
csInterface.addEventListener('timeline.changed', updateTimelineInfo);
```

## Direct Access Pattern (MVX Method)
```javascript
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

## Key Insights
1. Don't trust Adobe documentation - test all events
2. `onProjectChanged` is more reliable than specific events
3. Direct methods like `seq.getInPoint().seconds` work perfectly
4. Always return JSON from ExtendScript for parsing