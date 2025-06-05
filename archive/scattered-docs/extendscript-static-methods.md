# ExtendScript Static Method Pattern

**Status:** ✅ CRITICAL PATTERN
**Issue:** "executeScript is not a function" errors

## The Problem
```javascript
// ❌ WRONG - This causes errors
const timeline = new TimelineManager();
const result = await timeline.executeScript();
```

## The Solution
```javascript
// ✅ CORRECT - Use static methods
const result = await TimelineManager.executeScript('getSequenceInfo');
```

## Implementation Pattern
```javascript
class TimelineManager {
    static executeScript(functionName, params = {}) {
        return new Promise((resolve, reject) => {
            const script = `${functionName}(${JSON.stringify(params)})`;
            csInterface.evalScript(script, (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve(result); // Handle non-JSON responses
                }
            });
        });
    }
}
```

## Why This Matters
- ExtendScript runs in a different context
- Instance methods don't bridge the gap
- Static methods provide clean communication
- Always parse JSON responses safely