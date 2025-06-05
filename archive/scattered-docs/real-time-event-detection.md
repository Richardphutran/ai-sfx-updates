# Real-Time Event Detection Pattern

**Status:** ✅ BREAKTHROUGH
**Tokens:** ~90

## Problem
Expected events like onInPointChanged don't fire in Premiere Pro

## Solution
```javascript
// In ExtendScript - bind the WORKING event
app.bind('onProjectChanged', function() {
    var event = new CSXSEvent();
    event.type = "sequence.activity";
    event.data = "onProjectChanged detected";
    event.dispatch();
});

// In JavaScript - listen for updates
csInterface.addEventListener('sequence.activity', (event) => {
    if (event.data.includes('onProjectChanged')) {
        updateTimelineInfo(); // Real-time updates!
    }
});
```

## Discovery Method
1. Bind ALL possible events
2. Test with real actions (change in/out points)
3. See which events actually fire
4. Use what works, not what's documented

## When to Use
Real-time timeline change detection without polling