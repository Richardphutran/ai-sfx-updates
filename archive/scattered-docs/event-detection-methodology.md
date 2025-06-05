# Event Detection Methodology for Adobe Plugins

## Problem
Adobe documentation lists many events (onInPointChanged, onOutPointChanged) that don't actually fire in practice.

## Breakthrough Solution
Cast a wide net and test ALL possible events to find what actually works.

## Working Implementation
```javascript
// Test ALL possible events
var allEvents = [
  'onSequenceActivated', 'onSequenceDeactivated', 'onTimelineChanged',
  'onPlayheadChanged', 'onInPointChanged', 'onOutPointChanged',
  'onSelectionChanged', 'onMarkerChanged', 'onTrackChanged',
  'afterSequenceChanged', 'beforeSequenceChanged', 'onProjectChanged',
  'onSequenceModified', 'onTimebaseChanged', 'onEndPointChanged'
];

// Bind ALL events with diagnostic callbacks
allEvents.forEach(eventName => {
  app.bind(eventName, function() {
    var event = new CSXSEvent();
    event.type = "diagnostic.activity";
    event.data = eventName + " fired";
    event.dispatch();
  });
});

// Listen in CEP
csInterface.addEventListener('diagnostic.activity', (event) => {
  console.log('EVENT FIRED:', event.data);
});
```

## Key Discovery
`onProjectChanged` fires reliably for in/out point changes, even though dedicated events don't work.

## Token Savings
~200 tokens per debugging cycle by using proven methodology