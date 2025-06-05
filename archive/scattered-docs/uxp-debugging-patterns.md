# UXP Debugging Patterns & Solutions

## 🎯 Essential Console Logging Pattern

**Always use descriptive emoji-based logging**:
```javascript
// Standard logging pattern
console.log('🔍 Attempting:', 'operation description');
console.log('📊 Parameters:', { param1, param2 });
console.log('✅ Success:', result);
console.log('❌ Failed:', error.message);
console.log('⚠️ Warning:', 'potential issue');
console.log('💡 Info:', 'helpful context');

// API discovery pattern
console.log('🎯 Testing ppro object...');
console.log('  Keys:', Object.keys(ppro));
console.log('  Has app?', ppro.app !== undefined);
console.log('  Has Project?', ppro.Project !== undefined);

// Progress logging
console.log('🚀 Starting process...');
console.log('  📝 Step 1: Loading files');
console.log('  🔄 Step 2: Processing data');
console.log('  ✨ Step 3: Generating output');
```

## 🎯 UXP Developer Tools Setup

**Critical setup steps**:
1. Load plugin via UXP Developer Tools
2. Click "Debug" button to open Chrome DevTools
3. Use port 9230 for main plugin, 9231+ for additional plugins
4. Console tab is your best friend
5. Network tab shows API calls (if manifest allows)

**Common issues**:
- DevTools disconnects: Reload plugin, not just refresh
- Console not showing: Check correct port/window
- Breakpoints not working: Use console.log instead

## 🎯 Debugging "Connection to object lost"

**This error means your object reference is stale**:
```javascript
// ❌ WRONG - Storing references
let savedSequence = await project.getActiveSequence();
// ... time passes, user switches sequences ...
let name = await savedSequence.name; // ERROR: Connection lost

// ✅ CORRECT - Always get fresh references
async function getCurrentSequenceName() {
    const project = await ppro.Project.getActiveProject();
    const sequence = await project.getActiveSequence();
    return await sequence.name;
}

// Pattern for safe operations
async function safeSequenceOperation(operation) {
    try {
        const project = await ppro.Project.getActiveProject();
        const sequence = await project.getActiveSequence();
        return await operation(sequence);
    } catch (error) {
        if (error.message.includes('Connection to object lost')) {
            console.log('⚠️ Sequence reference stale, retrying...');
            // Retry with fresh reference
            const project = await ppro.Project.getActiveProject();
            const sequence = await project.getActiveSequence();
            return await operation(sequence);
        }
        throw error;
    }
}
```

## 🎯 Debugging Async Issues

**Everything in UXP is async - common mistakes**:
```javascript
// ❌ WRONG - Forgetting await
const name = sequence.name;
console.log(name); // [object Promise]

// ❌ WRONG - Not handling Promise rejection
const sequence = await project.getActiveSequence(); // Can be null!
const name = await sequence.name; // ERROR if no sequence

// ✅ CORRECT - Defensive async programming
const sequence = await project.getActiveSequence();
if (!sequence) {
    console.log('⚠️ No active sequence');
    return;
}
const name = await sequence.name;

// ✅ CORRECT - Promise.all for multiple properties
const [name, guid, path] = await Promise.all([
    sequence.name,
    sequence.guid,
    sequence.path
]);
```

## 🎯 Network Request Debugging

**Common network issues in UXP**:
```javascript
// Check if network is allowed
try {
    const response = await fetch('https://api.example.com');
    console.log('✅ Network access allowed');
} catch (error) {
    if (error.message.includes('not permitted')) {
        console.error('❌ Network not allowed in manifest.json');
        console.log('Add to requiredPermissions.network.domains');
    }
}

// Debug API calls
async function debugApiCall(url, options) {
    console.log('🌐 API Request:', {
        url,
        method: options.method || 'GET',
        headers: options.headers
    });
    
    try {
        const start = Date.now();
        const response = await fetch(url, options);
        const duration = Date.now() - start;
        
        console.log('📡 API Response:', {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API Error:', error);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Network Error:', error);
        throw error;
    }
}
```

## 🎯 Button State Debugging

**Track button states and event handlers**:
```javascript
// Debug button initialization
function initializeButtons() {
    const buttons = document.querySelectorAll('sp-button');
    console.log(`🔘 Found ${buttons.length} buttons`);
    
    buttons.forEach((button, index) => {
        console.log(`  Button ${index}: ${button.textContent.trim()}`);
        console.log(`    ID: ${button.id || 'none'}`);
        console.log(`    Disabled: ${button.disabled}`);
        console.log(`    Has click handler: ${button.onclick !== null}`);
    });
}

// Debug event handler attachment
function attachHandler(buttonId, handler) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error(`❌ Button not found: ${buttonId}`);
        return;
    }
    
    // Remove old handler
    if (button._debugHandler) {
        button.removeEventListener('click', button._debugHandler);
        console.log(`🔄 Replaced handler for: ${buttonId}`);
    }
    
    // Wrap handler for debugging
    const debugHandler = async (e) => {
        console.log(`🖱️ Click: ${buttonId}`);
        const start = Date.now();
        try {
            await handler(e);
            console.log(`✅ ${buttonId} completed in ${Date.now() - start}ms`);
        } catch (error) {
            console.error(`❌ ${buttonId} error:`, error);
        }
    };
    
    button.addEventListener('click', debugHandler);
    button._debugHandler = debugHandler;
}
```

## 🎯 File System Debugging

**Common file system issues**:
```javascript
// Debug folder picker
async function debugFolderPicker() {
    console.log('📁 Opening folder picker...');
    
    try {
        const folder = await fs.getFolder();
        if (!folder) {
            console.log('⚠️ User cancelled folder selection');
            return null;
        }
        
        console.log('✅ Folder selected:', {
            name: folder.name,
            path: folder.nativePath,
            isFolder: folder.isFolder
        });
        
        // Test permissions
        try {
            const entries = await folder.getEntries();
            console.log(`  📂 Contains ${entries.length} items`);
        } catch (e) {
            console.error('  ❌ No read permission');
        }
        
        return folder;
    } catch (error) {
        console.error('❌ Folder picker error:', error);
        return null;
    }
}

// Debug file operations
async function debugFileOperation(operation, file) {
    console.log(`📄 File operation: ${operation}`);
    console.log(`  Name: ${file.name}`);
    console.log(`  Path: ${file.nativePath}`);
    
    try {
        const result = await file[operation]();
        console.log(`  ✅ Success`);
        return result;
    } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        
        // Common errors
        if (error.message.includes('permission')) {
            console.log('  💡 Need to request file system permission');
        } else if (error.message.includes('not found')) {
            console.log('  💡 File may have been moved/deleted');
        }
        
        throw error;
    }
}
```

## 🎯 Memory Leak Detection

**Monitor for memory issues**:
```javascript
// Simple memory monitoring
let memoryCheckInterval;

function startMemoryMonitoring() {
    console.log('🧠 Starting memory monitoring...');
    
    memoryCheckInterval = setInterval(() => {
        if (performance.memory) {
            const mb = 1024 * 1024;
            const used = Math.round(performance.memory.usedJSHeapSize / mb);
            const total = Math.round(performance.memory.totalJSHeapSize / mb);
            const limit = Math.round(performance.memory.jsHeapSizeLimit / mb);
            
            console.log(`💾 Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
            
            // Warning if using too much
            if (used / limit > 0.8) {
                console.warn('⚠️ High memory usage detected!');
            }
        }
    }, 30000); // Every 30 seconds
}

function stopMemoryMonitoring() {
    if (memoryCheckInterval) {
        clearInterval(memoryCheckInterval);
        console.log('🧠 Stopped memory monitoring');
    }
}

// Clean up large objects
function cleanupLargeData() {
    console.log('🧹 Cleaning up large data...');
    
    // Clear large arrays/objects
    largeDataArray = null;
    
    // Force garbage collection (if available)
    if (global.gc) {
        global.gc();
        console.log('✅ Forced garbage collection');
    }
}
```

## 🎯 Performance Profiling

**Measure operation timing**:
```javascript
class PerformanceDebugger {
    static timers = new Map();
    
    static start(label) {
        this.timers.set(label, performance.now());
        console.log(`⏱️ Started: ${label}`);
    }
    
    static end(label) {
        const start = this.timers.get(label);
        if (!start) {
            console.warn(`⚠️ No timer found for: ${label}`);
            return;
        }
        
        const duration = performance.now() - start;
        this.timers.delete(label);
        
        console.log(`⏱️ Completed: ${label} (${duration.toFixed(2)}ms)`);
        
        // Warning for slow operations
        if (duration > 1000) {
            console.warn(`⚠️ Slow operation detected: ${label}`);
        }
        
        return duration;
    }
    
    static async measure(label, operation) {
        this.start(label);
        try {
            const result = await operation();
            this.end(label);
            return result;
        } catch (error) {
            this.end(label);
            throw error;
        }
    }
}

// Usage
await PerformanceDebugger.measure('API Call', async () => {
    return await fetch('/api/data');
});
```

## 🎯 Debug Panel Pattern

**Add debug controls to your plugin**:
```javascript
// Create debug panel (hidden in production)
function createDebugPanel() {
    const debugHTML = `
        <div id="debugPanel" class="debug-panel">
            <div class="debug-header">🛠️ Debug Tools</div>
            <sp-button size="s" id="inspectPproBtn">Inspect ppro</sp-button>
            <sp-button size="s" id="testSequenceBtn">Test Sequence</sp-button>
            <sp-button size="s" id="memoryBtn">Check Memory</sp-button>
            <sp-button size="s" id="clearStorageBtn">Clear Storage</sp-button>
            <sp-button size="s" id="reloadBtn">Reload Plugin</sp-button>
            <div id="debugOutput" class="debug-output"></div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', debugHTML);
    
    // Attach handlers
    document.getElementById('inspectPproBtn').onclick = () => {
        debugOutput.textContent = JSON.stringify(Object.keys(ppro), null, 2);
    };
    
    // Show/hide with keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const panel = document.getElementById('debugPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });
}
```

## 🎯 Key Takeaways

1. **Console.log everything** - UXP debugging relies heavily on logging
2. **Fresh references** - Always get new ppro object references
3. **Defensive async** - Check for null, handle Promise rejections
4. **Network manifest** - Must explicitly allow domains
5. **Performance monitoring** - Track slow operations
6. **Debug panels** - Add hidden debug UI for development
7. **Memory awareness** - Monitor and clean up large data
8. **Descriptive logging** - Use emojis and structure for clarity

These patterns will save hours of debugging time and help identify issues quickly in UXP plugins.