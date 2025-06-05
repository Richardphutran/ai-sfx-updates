# ExtendScript Type Conversion Fix

## Problem
ExtendScript returns numeric values as STRINGS when crossing the CEP bridge, causing type checking failures.

## Root Cause
```javascript
// ExtendScript returns
var inPoint = sequence.getInPoint(); // Returns: "7.5909166666666668" (string!)

// CEP code expects
var hasInPoint = (typeof inPoint === 'number'); // FALSE! It's a string!
```

## Solution
Always use parseFloat() for numeric values from ExtendScript.

## Working Implementation
```javascript
// WRONG - type checking
var inPointSeconds = (typeof inPoint === 'number') ? inPoint : null;
var hasInPoint = (inPointSeconds !== null && inPointSeconds !== undefined);

// CORRECT - parse string to number
var inPointSeconds = parseFloat(inPoint);
var hasInPoint = (!isNaN(inPointSeconds) && inPointSeconds >= 0);
```

## Complete Example
```javascript
function getSequenceInfo() {
    var seq = app.project.activeSequence;
    if (seq) {
        var inPoint = seq.getInPoint();
        var inPointSeconds = parseFloat(inPoint);  // KEY FIX
        var hasInPoint = (!isNaN(inPointSeconds) && inPointSeconds >= 0);
        
        return JSON.stringify({
            success: true,
            inPoint: hasInPoint ? inPointSeconds : null,
            hasInPoint: hasInPoint
        });
    }
    return JSON.stringify({ success: false });
}
```

## Token Savings
~150 tokens per type mismatch issue