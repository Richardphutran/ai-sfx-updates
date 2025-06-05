# Promise-Based ExtendScript Pattern

## Problem
ExtendScript calls are async but callback-based, making code messy.

## Solution
Wrap ExtendScript calls in Promises for clean async/await usage.

## Implementation
```javascript
class TimelineManager {
    static executeScript(functionName, params = {}) {
        return new Promise((resolve, reject) => {
            const script = `${functionName}(${JSON.stringify(params)})`;
            
            csInterface.evalScript(script, (result) => {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (e) {
                    // If not JSON, return raw result
                    if (result && result !== 'undefined') {
                        resolve(result);
                    } else {
                        reject(new Error('No result from ExtendScript'));
                    }
                }
            });
        });
    }
}

// Usage with async/await
async function updateTimeline() {
    try {
        const info = await TimelineManager.executeScript('getSequenceInfo');
        console.log('Timeline info:', info);
        
        if (info.success) {
            updateUI(info);
        }
    } catch (error) {
        console.error('Timeline error:', error);
    }
}
```

## Advanced Pattern - Batch Operations
```javascript
async function batchTimelineOperations() {
    // Execute multiple operations in parallel
    const [sequence, markers, tracks] = await Promise.all([
        TimelineManager.executeScript('getSequenceInfo'),
        TimelineManager.executeScript('getMarkers'),
        TimelineManager.executeScript('getAudioTracks')
    ]);
    
    return { sequence, markers, tracks };
}
```

## Benefits
- Clean async/await syntax
- Better error handling
- Parallel execution support
- Type-safe with TypeScript

## Token Savings
~100 tokens per complex operation