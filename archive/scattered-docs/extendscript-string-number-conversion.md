# ExtendScript String/Number Type Conversion

**Status:** ✅ CRITICAL FIX
**Tokens:** ~60

## Problem
ExtendScript returns numeric values as STRINGS when crossing the CEP bridge

## Solution
```javascript
// WRONG - type checking fails
var inPointSeconds = (typeof inPoint === 'number') ? inPoint : null;

// CORRECT - parse string to number
var inPointSeconds = parseFloat(inPoint);
var hasInPoint = (!isNaN(inPointSeconds) && inPointSeconds >= 0);
```

## Root Cause
- ExtendScript: `seq.getInPoint()` returns "7.59" (string)
- JavaScript expects: 7.59 (number)
- CEP bridge converts numbers to strings

## When to Use
ALWAYS when receiving numeric values from ExtendScript calls