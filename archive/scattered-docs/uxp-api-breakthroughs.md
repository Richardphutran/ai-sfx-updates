# UXP API Breakthroughs & Working Patterns

## 🎯 Track Item Access - SOLVED!

**The Problem**: Getting track items from timeline was returning "Illegal Parameter type" errors.

**The Solution**:
```javascript
// ✅ CORRECT - This works!
const trackItems = await track.getTrackItems(1, false);
// Parameter 1: clipType (1 = clip items)
// Parameter 2: includeEmpty (false = clips only, no gaps)
```

**Why it works**: The UXP API documentation was incomplete. Through systematic testing, discovered that `getTrackItems()` requires exactly these parameters.

## 🎯 Correct Project/Sequence Access Pattern

**Never use these (they don't work):**
```javascript
// ❌ WRONG
ppro.app                    // undefined
ppro.eventRoot.project      // returns undefined  
new ppro.Project()          // creates disconnected instance
new ppro.Application()      // empty object
```

**Always use this pattern:**
```javascript
// ✅ CORRECT
const activeProject = await ppro.Project.getActiveProject();
if (activeProject) {
    const activeSequence = await activeProject.getActiveSequence();
    if (activeSequence) {
        const sequenceName = await activeSequence.name;
        console.log('Current sequence:', sequenceName);
    }
}
```

## 🎯 Timebase & Tick Conversion

**Discovery**: UXP returns massive tick-based values, not frame numbers!

```javascript
// Raw UXP timebase example: 10594584000 (ticks)
// Premiere uses 254016000000 ticks per second

function ticksToFrames(ticks, frameRate) {
    const PREMIERE_TICKS_PER_SECOND = 254016000000;
    const seconds = ticks / PREMIERE_TICKS_PER_SECOND;
    return Math.round(seconds * frameRate);
}

function framesToTicks(frames, frameRate) {
    const PREMIERE_TICKS_PER_SECOND = 254016000000;
    const seconds = frames / frameRate;
    return Math.floor(seconds * PREMIERE_TICKS_PER_SECOND);
}

// Handle NTSC frame rates
function getRealFrameRate(timebase, ntscFlag) {
    if (ntscFlag === 'TRUE') {
        if (timebase === 24) return 23.976;
        if (timebase === 30) return 29.97;
        if (timebase === 60) return 59.94;
    }
    return timebase;
}
```

## 🎯 Deep UXP Object Inspection

**Problem**: UXP documentation is incomplete. How to find hidden APIs?

**Solution**: Forensic object analysis
```javascript
async function inspectUXPObject(obj, objectName) {
    console.log(`=== DEEP ${objectName.toUpperCase()} INSPECTION ===`);
    
    // Basic info
    console.log(`Object:`, obj);
    console.log(`Constructor:`, obj.constructor.name);
    
    // All direct properties
    const allProps = Object.getOwnPropertyNames(obj);
    console.log(`Direct properties (${allProps.length}):`, allProps);
    
    // All prototype methods
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj));
    console.log(`Prototype methods (${protoMethods.length}):`, protoMethods);
    
    // Filter for specific functionality
    const exportMethods = [...allProps, ...protoMethods].filter(method => 
        method.toLowerCase().includes('export') || 
        method.toLowerCase().includes('save') ||
        method.toLowerCase().includes('write') ||
        method.toLowerCase().includes('xml')
    );
    console.log(`Export-related methods:`, exportMethods);
}

// Usage:
await inspectUXPObject(activeSequence, 'sequence');
await inspectUXPObject(ppro, 'ppro');
```

**This technique revealed**:
- `ppro.SequenceEditor` class (undocumented)
- `ppro.Exporter` class (undocumented)
- Hidden utility classes in ppro object

## 🎯 Everything is Async!

**Critical**: Most UXP API properties return Promises, not values!

```javascript
// ❌ WRONG
const name = sequence.name;           // Returns Promise object
console.log(sequence.name);           // Logs: [object Promise]

// ✅ CORRECT  
const name = await sequence.name;     // Returns actual string
const guid = await project.guid;      // Returns actual GUID
const path = await project.path;      // Returns actual path

// Even array access needs await
const tracks = await sequence.videoTracks;
const trackCount = tracks.length;    // This is sync
```

## 🎯 Error Recovery Patterns

**"Connection to object lost"**:
```javascript
// Objects can become stale - always get fresh references
try {
    // This might fail if sequence changed
    const name = await oldSequence.name;
} catch (error) {
    // Get fresh reference
    const project = await ppro.Project.getActiveProject();
    const sequence = await project.getActiveSequence();
    const name = await sequence.name;
}
```

**"Illegal parameter type"**:
```javascript
// When you get this error, try different parameter combinations
const attempts = [
    () => method(),                    // No params
    () => method(param1),              // One param
    () => method(param1, param2),      // Two params
    () => method(param1, param2, param3) // Three params
];

for (const attempt of attempts) {
    try {
        const result = await attempt();
        console.log('✅ Success with:', attempt.toString());
        break;
    } catch (e) {
        console.log('❌ Failed:', e.message);
    }
}
```

## 🎯 Available ppro Classes (Verified)

Through systematic testing, these classes are confirmed available:
```javascript
// Get all available classes
console.log('Available classes:', Object.keys(ppro));

// Key classes that work:
- ppro.Project          // Static methods: getActiveProject()
- ppro.Sequence         // Sequence manipulation
- ppro.ProjectItem      // Project panel items
- ppro.VideoTrack       // Timeline video tracks
- ppro.AudioTrack       // Timeline audio tracks
- ppro.SourceMonitor    // Source monitor control
- ppro.EventManager     // Event handling
- ppro.Markers          // Marker management
```

## 🎯 Console Debugging Pattern

Always use this pattern for debugging:
```javascript
console.log('🔍 Attempting:', 'get track items');
console.log('📊 Parameters:', { clipType: 1, includeEmpty: false });
console.log('✅ Success:', trackItems.length, 'items found');
console.log('❌ Failed:', error.message);

// For API discovery
console.log('🎯 Testing ppro object...');
console.log('  Keys:', Object.keys(ppro));
console.log('  Has app?', ppro.app !== undefined);
console.log('  Has Project?', ppro.Project !== undefined);
```

## 🎯 Key Takeaways

1. **Always use static methods** - `ppro.Project.getActiveProject()`, not `new ppro.Project()`
2. **Everything is async** - Use await on all properties and methods
3. **Parameter discovery** - UXP docs are incomplete, test systematically
4. **Object inspection** - Use the deep inspection technique to find hidden APIs
5. **Fresh references** - Objects can become stale, always get fresh ones
6. **Tick conversion** - Remember the 254016000000 ticks per second constant

These patterns work reliably in Premiere Pro 25.1.0 and should work in earlier versions that support UXP.