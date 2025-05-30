# UXP Premiere Pro Development Reference

## Overview

UXP (Unified Extensibility Platform) is Adobe's modern plugin framework that replaced CEP (Common Extensibility Platform). This guide provides comprehensive knowledge for developing Premiere Pro UXP plugins.

## UXP vs CEP Comparison

### What Changed
- **CEP (Legacy)**: Used ExtendScript (ES3) + HTML/CSS/JS panels
- **UXP (Modern)**: Uses modern JavaScript (ES6+) + React-like UI framework
- **API Access**: Different object models and async patterns
- **Security**: Much more restrictive file system and network access
- **Performance**: Better performance, native rendering

### Migration Challenges
- ExtendScript code doesn't work in UXP
- Different API patterns (sync vs async)
- Stricter security model
- Different file system access patterns

## Core UXP Architecture

### Plugin Structure
```
my-plugin/
├── manifest.json          # Plugin configuration
├── index.html             # Entry point
├── index.js              # Main logic
├── style.css             # Styling
└── images/               # Assets
```

### Essential Files

#### manifest.json
```json
{
  "id": "com.company.plugin-name",
  "name": "Plugin Name",
  "version": "1.0.0",
  "host": {
    "app": "PR",
    "minVersion": "24.0.0"
  },
  "type": "panel",
  "uiEntry": {
    "type": "panel",
    "menu": "Plugin Name"
  },
  "entrypoints": [
    {
      "type": "panel",
      "id": "panel1"
    }
  ],
  "manifestVersion": 4,
  "requiredPermissions": {
    "network": {
      "domains": [
        "https://api.example.com/*"
      ]
    },
    "fileSystem": "request"
  }
}
```

#### index.html
```html
<!DOCTYPE html>
<html>
<head>
    <title>Plugin Name</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <!-- UI Content -->
    </div>
    <script src="index.js"></script>
</body>
</html>
```

## Premiere Pro UXP API

### Core Objects and Patterns

#### Getting Active Project/Sequence
```javascript
const ppro = require('premierepro');

// CORRECT PATTERN - Always use static methods
async function getActiveContext() {
    try {
        const activeProject = await ppro.Project.getActiveProject();
        if (!activeProject) {
            console.log('No active project');
            return null;
        }
        
        const activeSequence = await activeProject.getActiveSequence();
        if (!activeSequence) {
            console.log('No active sequence');
            return null;
        }
        
        return {
            project: activeProject,
            sequence: activeSequence,
            projectName: await activeProject.name,
            sequenceName: await activeSequence.name,
            projectPath: await activeProject.path
        };
    } catch (error) {
        console.error('Error accessing Premiere API:', error);
        return null;
    }
}

// WRONG PATTERNS (don't work in UXP):
// ppro.app - undefined
// ppro.eventRoot.project - undefined
// new ppro.Application() - creates disconnected instance
```

#### Key API Classes
```javascript
// Project Operations
const project = await ppro.Project.getActiveProject();
const sequences = await project.getSequences();
const rootItem = await project.getRootItem();

// Sequence Operations  
const sequence = await project.getActiveSequence();
const videoTracks = await sequence.videoTracks;
const audioTracks = await sequence.audioTracks;

// Project Items
const projectItem = await project.importFiles(['path/to/file.mp4']);
const folder = await project.createFolder('My Folder');

// Timeline Operations
const trackItems = await videoTracks[0].getTrackItems();
```

### Critical Async Patterns

**IMPORTANT**: Most UXP API calls return Promises and MUST use await:

```javascript
// CORRECT - All properties are async
const name = await sequence.name;
const duration = await sequence.duration;
const guid = await project.guid;

// WRONG - Will return Promise objects
const name = sequence.name; // Promise<string>
const duration = sequence.duration; // Promise<number>
```

### Available ppro Classes
- `Project`, `Sequence`, `ProjectItem`
- `VideoTrack`, `AudioTrack`, `CaptionTrack`
- `VideoClipTrackItem`, `AudioClipTrackItem`
- `ClipProjectItem`, `FolderItem`
- `Markers`, `Metadata`
- `SourceMonitor`, `EventManager`
- `ProjectUtils`, `SequenceUtils`
- `Exporter`, `SequenceEditor` (potential export utilities)

## File System API

### Security Model
UXP has strict file system security. You cannot access arbitrary paths - only:
1. Plugin's own directory
2. User-selected folders (via picker)
3. Temp directories in some cases

### File Operations
```javascript
const fs = require('uxp').storage.localFileSystem;

// Get user-selected folder (only way to access external folders)
async function selectFolder() {
    try {
        const folder = await fs.getFolder();
        if (!folder) return null;
        
        // Save persistent token for future access
        const token = await fs.createPersistentToken(folder);
        localStorage.setItem('folderToken', token);
        
        return folder;
    } catch (error) {
        console.error('Folder selection failed:', error);
        return null;
    }
}

// Restore previously selected folder
async function restoreFolder() {
    try {
        const token = localStorage.getItem('folderToken');
        if (!token) return null;
        
        const folder = await fs.getEntryForPersistentToken(token);
        return folder;
    } catch (error) {
        console.log('Cannot restore folder:', error);
        localStorage.removeItem('folderToken');
        return null;
    }
}

// File operations on selected folder
async function workWithFiles(folder) {
    // Create subdirectory
    const subFolder = await folder.createFolder('MySubfolder');
    
    // Create file
    const file = await subFolder.createFile('data.json');
    await file.write(JSON.stringify({data: 'example'}));
    
    // Read file
    const content = await file.read();
    
    // List folder contents
    const entries = await folder.getEntries();
}
```

### Limitations
- **No starting directory**: `fs.getFolder()` always opens at system default
- **No clipboard API**: `navigator.clipboard` not available for 3rd party plugins
- **Persistent tokens required**: Must save folder references between sessions

## Network API

### Security Configuration
Network access is **disabled by default**. Must whitelist domains in manifest.json:

```json
{
  "requiredPermissions": {
    "network": {
      "domains": [
        "https://api.anthropic.com/*",
        "https://*.openai.com/*"
      ]
    }
  }
}
```

### Making API Calls
```javascript
// Standard fetch works after whitelisting
async function callAPI(apiKey, data) {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
```

### Common Network Errors
- "plugin is not permitted to access network APIs" - Domain not whitelisted
- CORS errors - API doesn't allow browser requests
- SSL/TLS errors - Use HTTPS only

## UI Development

### Spectrum CSS Framework
UXP uses Adobe's Spectrum CSS for consistent Adobe app styling:

```html
<!-- Include Spectrum CSS -->
<link rel="stylesheet" href="https://spectrum.adobe.com/css/spectrum.css">

<!-- Spectrum components -->
<button class="spectrum-Button spectrum-Button--cta">
    <span class="spectrum-Button-label">Primary Button</span>
</button>

<div class="spectrum-Textfield">
    <input type="text" class="spectrum-Textfield-input" placeholder="Enter text">
</div>

<div class="spectrum-ProgressBar spectrum-ProgressBar--indeterminate">
    <div class="spectrum-ProgressBar-track">
        <div class="spectrum-ProgressBar-fill"></div>
    </div>
</div>
```

### Custom CSS Variables
```css
:root {
    --spectrum-background-color: #2c2c2c;
    --spectrum-text-color: #ffffff;
    --spectrum-button-primary-background: #0066cc;
}

.custom-panel {
    background: var(--spectrum-background-color);
    color: var(--spectrum-text-color);
    padding: 16px;
}
```

### Responsive Design
```css
/* Panels can be resized by user */
.container {
    min-width: 200px;
    max-width: 100%;
    width: 100%;
}

@media (max-width: 300px) {
    .button-group {
        flex-direction: column;
    }
}
```

## Event Handling

### Plugin Lifecycle Events
```javascript
// Plugin loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('Plugin loaded');
    initializePlugin();
});

// Plugin closing
window.addEventListener('beforeunload', () => {
    console.log('Plugin closing');
    saveState();
});
```

### Premiere Pro Events
```javascript
// Listen for project events
ppro.EventManager.addEventListener('projectOpened', (event) => {
    console.log('Project opened:', event);
    refreshProjectInfo();
});

ppro.EventManager.addEventListener('sequenceActivated', (event) => {
    console.log('Sequence activated:', event);
    updateSequenceInfo();
});

// Object-specific events
const project = await ppro.Project.getActiveProject();
project.addEventListener('sequenceAdded', (event) => {
    console.log('New sequence added:', event);
});
```

## Common Patterns and Solutions

### Project-Aware State Management
```javascript
class ProjectManager {
    constructor() {
        this.currentProjectId = null;
        this.projectData = new Map();
    }
    
    async checkProject() {
        const project = await ppro.Project.getActiveProject();
        if (!project) return null;
        
        const projectId = await project.guid;
        if (this.currentProjectId !== projectId) {
            this.currentProjectId = projectId;
            this.onProjectChanged(projectId);
        }
        
        return project;
    }
    
    onProjectChanged(projectId) {
        console.log('Project changed to:', projectId);
        // Load project-specific data
        this.loadProjectData(projectId);
    }
    
    saveProjectData(projectId, data) {
        localStorage.setItem(`project_${projectId}`, JSON.stringify(data));
    }
    
    loadProjectData(projectId) {
        const data = localStorage.getItem(`project_${projectId}`);
        return data ? JSON.parse(data) : {};
    }
}
```

### Folder Management Per Project
```javascript
async function getProjectFolder(project) {
    const projectId = await project.guid;
    const tokenKey = `projectFolder_${projectId}`;
    
    // Try to restore existing folder
    try {
        const token = localStorage.getItem(tokenKey);
        if (token) {
            const folder = await fs.getEntryForPersistentToken(token);
            return folder;
        }
    } catch (e) {
        localStorage.removeItem(tokenKey);
    }
    
    // Ask user to select folder
    const folder = await fs.getFolder();
    if (folder) {
        const token = await fs.createPersistentToken(folder);
        localStorage.setItem(tokenKey, token);
    }
    
    return folder;
}
```

### Error Handling Best Practices
```javascript
async function robustAPICall() {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const project = await ppro.Project.getActiveProject();
            if (!project) throw new Error('No active project');
            
            // Your API logic here
            return await someOperation(project);
            
        } catch (error) {
            lastError = error;
            console.log(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Debugging Techniques

### Console Logging Strategy
```javascript
// Deep object inspection
function inspectObject(obj, name) {
    console.log(`\n🔍 INSPECTING: ${name}`);
    console.log('Type:', typeof obj);
    console.log('Constructor:', obj.constructor.name);
    console.log('Own properties:', Object.getOwnPropertyNames(obj));
    console.log('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(obj)));
    
    // Test if methods are callable
    const methods = Object.getOwnPropertyNames(obj).filter(prop => 
        typeof obj[prop] === 'function'
    );
    console.log('Callable methods:', methods);
}

// API discovery
async function discoverAPI() {
    console.log('Available ppro classes:', Object.getOwnPropertyNames(ppro));
    
    const project = await ppro.Project.getActiveProject();
    if (project) {
        inspectObject(project, 'Active Project');
        
        const sequence = await project.getActiveSequence();
        if (sequence) {
            inspectObject(sequence, 'Active Sequence');
        }
    }
}
```

### Development Workflow
1. **Use UXP Developer Tools**: Essential for loading/reloading plugins
2. **Console logging**: Primary debugging method
3. **Incremental testing**: Test small pieces at a time
4. **API exploration**: Use object inspection to discover methods
5. **Error patterns**: Watch for common async/await issues

### Plugin Loading
```bash
# UXP Developer Tools workflow:
1. Open UXP Developer Tools
2. Add plugin (select manifest.json)
3. Load plugin
4. Test in Premiere Pro
5. Unload/Load after manifest changes (reload not enough)
6. Check console for errors
```

## Performance Considerations

### Async Best Practices
```javascript
// GOOD - Parallel operations
const [project, sequences] = await Promise.all([
    ppro.Project.getActiveProject(),
    getSequences()
]);

// BAD - Sequential operations
const project = await ppro.Project.getActiveProject();
const sequences = await getSequences(); // Waits unnecessarily
```

### Memory Management
```javascript
// Clean up event listeners
class PluginManager {
    constructor() {
        this.eventHandlers = [];
    }
    
    addEventHandler(target, event, handler) {
        target.addEventListener(event, handler);
        this.eventHandlers.push({ target, event, handler });
    }
    
    cleanup() {
        this.eventHandlers.forEach(({ target, event, handler }) => {
            target.removeEventListener(event, handler);
        });
        this.eventHandlers = [];
    }
}
```

## Common Roadblocks and Solutions

### 1. "Connection to object lost"
**Problem**: Object references become invalid
**Solution**: Always get fresh references, don't cache objects

```javascript
// BAD - Cached reference
const project = await ppro.Project.getActiveProject();
// ... later ...
const name = await project.name; // May fail

// GOOD - Fresh reference
async function getProjectName() {
    const project = await ppro.Project.getActiveProject();
    return project ? await project.name : null;
}
```

### 2. Network requests failing
**Problem**: Domain not whitelisted or CORS issues
**Solution**: Check manifest.json permissions

### 3. File system access denied
**Problem**: Trying to access unauthorized paths
**Solution**: Use folder picker and persistent tokens

### 4. Async/await issues
**Problem**: Forgetting await on UXP API calls
**Solution**: Always await API calls, use TypeScript for better catching

### 5. Plugin not loading
**Problem**: Manifest configuration issues
**Solution**: Check manifest syntax, required permissions, host app version

## Advanced Patterns

### Plugin Communication
```javascript
// Cross-plugin communication via localStorage
class PluginMessenger {
    static sendMessage(targetPlugin, message) {
        const key = `msg_${targetPlugin}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(message));
        
        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: JSON.stringify(message)
        }));
    }
    
    static listenForMessages(pluginId, handler) {
        window.addEventListener('storage', (event) => {
            if (event.key.startsWith(`msg_${pluginId}_`)) {
                const message = JSON.parse(event.newValue);
                handler(message);
                localStorage.removeItem(event.key);
            }
        });
    }
}
```

### State Persistence
```javascript
class PersistentState {
    constructor(namespace) {
        this.namespace = namespace;
        this.state = this.load();
        
        // Auto-save on changes
        this.proxy = new Proxy(this.state, {
            set: (target, property, value) => {
                target[property] = value;
                this.save();
                return true;
            }
        });
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.namespace);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
    
    save() {
        localStorage.setItem(this.namespace, JSON.stringify(this.state));
    }
    
    get() {
        return this.proxy;
    }
}

// Usage
const settings = new PersistentState('myPlugin.settings');
const state = settings.get();
state.apiKey = 'new-key'; // Auto-saves
```

## Testing Strategies

### Unit Testing Approach
```javascript
// Mock UXP APIs for testing
class MockPremiere {
    static createMockProject(name = 'Test Project') {
        return {
            name: Promise.resolve(name),
            guid: Promise.resolve('mock-guid-123'),
            getActiveSequence: () => Promise.resolve(this.createMockSequence())
        };
    }
    
    static createMockSequence(name = 'Test Sequence') {
        return {
            name: Promise.resolve(name),
            videoTracks: Promise.resolve([]),
            audioTracks: Promise.resolve([])
        };
    }
}

// Test helper
async function testWithMockPremiere(testFn) {
    const originalPpro = global.ppro;
    global.ppro = {
        Project: {
            getActiveProject: () => Promise.resolve(MockPremiere.createMockProject())
        }
    };
    
    try {
        await testFn();
    } finally {
        global.ppro = originalPpro;
    }
}
```

### Integration Testing
```javascript
// Test actual Premiere Pro integration
async function testRealIntegration() {
    console.log('Testing real Premiere Pro integration...');
    
    const project = await ppro.Project.getActiveProject();
    console.assert(project !== null, 'Should have active project');
    
    const projectName = await project.name;
    console.assert(typeof projectName === 'string', 'Project name should be string');
    
    console.log('✅ Integration test passed');
}
```

## Production Deployment

### Manifest Configuration
```json
{
  "manifestVersion": 4,
  "id": "com.company.plugin",
  "name": "Production Plugin",
  "version": "1.0.0",
  "main": "index.html",
  "host": {
    "app": "PR",
    "minVersion": "24.0.0"
  },
  "type": "panel",
  "requiredPermissions": {
    "allowCodeGenerationFromStrings": false,
    "network": {
      "domains": ["https://api.production.com/*"]
    },
    "fileSystem": "request"
  }
}
```

### Error Reporting
```javascript
class ErrorReporter {
    static report(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context: context,
            userAgent: navigator.userAgent,
            pluginVersion: '1.0.0'
        };
        
        console.error('Plugin Error:', errorData);
        
        // Optional: Send to error tracking service
        // this.sendToErrorService(errorData);
    }
    
    static wrapAsync(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.report(error, { function: fn.name, args });
                throw error;
            }
        };
    }
}

// Usage
const safeAPICall = ErrorReporter.wrapAsync(callAPI);
```

This comprehensive reference should help you navigate UXP development challenges and build robust Premiere Pro plugins. Remember that UXP is fundamentally different from CEP, so always think "modern async JavaScript" rather than "legacy ExtendScript" patterns.