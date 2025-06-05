# UXP Performance Optimization Patterns

## 🎯 Batch Operations for Better Performance

**Always batch independent operations**:
```javascript
// ❌ SLOW - Sequential operations
const project = await ppro.Project.getActiveProject();
const sequence = await project.getActiveSequence();
const name = await sequence.name;
const guid = await sequence.guid;
const tracks = await sequence.videoTracks;

// ✅ FAST - Parallel operations
const project = await ppro.Project.getActiveProject();
const sequence = await project.getActiveSequence();

const [name, guid, tracks] = await Promise.all([
    sequence.name,
    sequence.guid,
    sequence.videoTracks
]);

// ✅ FASTEST - Batch all file operations
async function batchFileOperations(files) {
    const operations = files.map(file => ({
        read: file.read({ format: 'text' }),
        metadata: file.getMetadata(),
        path: file.nativePath
    }));
    
    const results = await Promise.all(
        operations.map(op => 
            Promise.all([op.read, op.metadata, op.path])
        )
    );
    
    return results.map(([content, metadata, path], index) => ({
        file: files[index],
        content,
        metadata,
        path
    }));
}
```

## 🎯 Efficient File Detection

**Optimize folder scanning**:
```javascript
// Cache file detection results
class OptimizedFileDetector {
    static cache = new Map();
    static cacheTimeout = 5000; // 5 seconds
    
    static async scanForFiles(folder) {
        const cacheKey = folder.nativePath;
        const cached = this.cache.get(cacheKey);
        
        // Return cached if fresh
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Using cached file list');
            return cached.files;
        }
        
        // Scan efficiently
        const entries = await folder.getEntries();
        const files = { srt: null, xml: null, all: [] };
        
        // Single pass through entries
        for (const entry of entries) {
            if (entry.isFile) {
                const name = entry.name.toLowerCase();
                
                // Skip IMPORT_THIS files
                if (name.startsWith('import_this')) continue;
                
                if (name.endsWith('.srt') && !files.srt) {
                    files.srt = entry;
                } else if (name.endsWith('.xml') && !files.xml) {
                    files.xml = entry;
                }
                
                files.all.push(entry);
                
                // Early exit if found both
                if (files.srt && files.xml) break;
            }
        }
        
        // Cache results
        this.cache.set(cacheKey, {
            files,
            timestamp: Date.now()
        });
        
        return files;
    }
    
    static clearCache() {
        this.cache.clear();
        console.log('🧹 Cleared file cache');
    }
}
```

## 🎯 Chunked Processing for Large Data

**Process large caption files efficiently**:
```javascript
async function processLargeCaptions(captionData, chunkSize = 100) {
    const chunks = [];
    const totalCaptions = captionData.length;
    
    // Split into chunks
    for (let i = 0; i < totalCaptions; i += chunkSize) {
        chunks.push(captionData.slice(i, i + chunkSize));
    }
    
    console.log(`📊 Processing ${totalCaptions} captions in ${chunks.length} chunks`);
    
    const results = [];
    
    // Process chunks with progress updates
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progress = Math.round((i / chunks.length) * 100);
        
        // Update UI
        updateProgress(progress, `Processing chunk ${i + 1}/${chunks.length}`);
        
        // Process chunk
        const chunkResult = await processChunk(chunk);
        results.push(...chunkResult);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
}

// Token-based chunking for AI processing
function chunkByTokens(text, maxTokensPerChunk = 40000) {
    const estimatedTokensPerChar = 0.25; // Rough estimate
    const maxCharsPerChunk = maxTokensPerChunk / estimatedTokensPerChar;
    
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;
    
    const lines = text.split('\n');
    
    for (const line of lines) {
        const lineTokens = Math.ceil(line.length * estimatedTokensPerChar);
        
        if (currentTokens + lineTokens > maxTokensPerChunk) {
            chunks.push(currentChunk);
            currentChunk = line;
            currentTokens = lineTokens;
        } else {
            currentChunk += '\n' + line;
            currentTokens += lineTokens;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}
```

## 🎯 Debouncing & Throttling

**Prevent excessive operations**:
```javascript
// Debounce for search/filter operations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle for progress updates
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Usage
const debouncedSearch = debounce(async (query) => {
    const results = await searchFiles(query);
    updateSearchResults(results);
}, 300);

const throttledProgress = throttle((percent) => {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}, 100); // Update max every 100ms
```

## 🎯 Virtual Scrolling for Long Lists

**Handle thousands of items efficiently**:
```javascript
class VirtualScroller {
    constructor(container, itemHeight = 30) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = [];
        this.visibleItems = new Map();
        
        this.container.addEventListener('scroll', 
            throttle(() => this.updateVisibleItems(), 50)
        );
    }
    
    setItems(items) {
        this.items = items;
        
        // Set container height
        const totalHeight = items.length * this.itemHeight;
        this.container.style.height = `${totalHeight}px`;
        
        this.updateVisibleItems();
    }
    
    updateVisibleItems() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
        
        // Buffer for smooth scrolling
        const bufferSize = 5;
        const visibleStart = Math.max(0, startIndex - bufferSize);
        const visibleEnd = Math.min(this.items.length, endIndex + bufferSize);
        
        // Remove items no longer visible
        for (const [index, element] of this.visibleItems) {
            if (index < visibleStart || index >= visibleEnd) {
                element.remove();
                this.visibleItems.delete(index);
            }
        }
        
        // Add newly visible items
        for (let i = visibleStart; i < visibleEnd; i++) {
            if (!this.visibleItems.has(i)) {
                const element = this.createItemElement(this.items[i], i);
                element.style.position = 'absolute';
                element.style.top = `${i * this.itemHeight}px`;
                this.container.appendChild(element);
                this.visibleItems.set(i, element);
            }
        }
    }
    
    createItemElement(item, index) {
        const div = document.createElement('div');
        div.className = 'virtual-item';
        div.textContent = `${index}: ${item.name}`;
        return div;
    }
}
```

## 🎯 Lazy Loading Resources

**Load resources only when needed**:
```javascript
class ResourceManager {
    static resources = new Map();
    static loaders = new Map();
    
    static async lazyLoad(resourceId, loader) {
        // Return cached if available
        if (this.resources.has(resourceId)) {
            return this.resources.get(resourceId);
        }
        
        // Return existing promise if already loading
        if (this.loaders.has(resourceId)) {
            return this.loaders.get(resourceId);
        }
        
        // Start loading
        const loadPromise = loader().then(resource => {
            this.resources.set(resourceId, resource);
            this.loaders.delete(resourceId);
            return resource;
        });
        
        this.loaders.set(resourceId, loadPromise);
        return loadPromise;
    }
    
    static preload(resourceIds, loaderMap) {
        const promises = resourceIds.map(id => 
            this.lazyLoad(id, loaderMap[id])
        );
        return Promise.all(promises);
    }
}

// Usage
const apiKey = await ResourceManager.lazyLoad('apiKey', async () => {
    return localStorage.getItem('claudeApiKey');
});

const largeData = await ResourceManager.lazyLoad('projectData', async () => {
    const file = await getProjectDataFile();
    return JSON.parse(await file.read({ format: 'text' }));
});
```

## 🎯 Memory-Efficient XML Processing

**Stream-like processing for large XML files**:
```javascript
async function* parseXMLInChunks(xmlContent, chunkSize = 1000) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    const clips = doc.querySelectorAll('clipitem');
    
    for (let i = 0; i < clips.length; i += chunkSize) {
        const chunk = Array.from(clips).slice(i, i + chunkSize);
        
        yield chunk.map(clip => ({
            id: clip.getAttribute('id'),
            name: clip.querySelector('name')?.textContent,
            start: parseInt(clip.querySelector('start')?.textContent || '0'),
            end: parseInt(clip.querySelector('end')?.textContent || '0')
        }));
        
        // Allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

// Usage
async function processLargeXML(xmlContent) {
    const results = [];
    
    for await (const chunk of parseXMLInChunks(xmlContent)) {
        // Process chunk
        const processed = chunk.filter(clip => clip.end - clip.start > 100);
        results.push(...processed);
        
        // Update progress
        updateProgress(results.length);
    }
    
    return results;
}
```

## 🎯 Smart Caching Strategy

**Multi-level caching system**:
```javascript
class SmartCache {
    constructor() {
        this.memoryCache = new Map();
        this.maxMemoryItems = 100;
        this.accessCounts = new Map();
    }
    
    async get(key, loader) {
        // Check memory cache
        if (this.memoryCache.has(key)) {
            this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
            return this.memoryCache.get(key);
        }
        
        // Check localStorage cache
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (Date.now() - data.timestamp < data.ttl) {
                    // Promote to memory cache if frequently accessed
                    if (this.accessCounts.get(key) > 3) {
                        this.setMemoryCache(key, data.value);
                    }
                    return data.value;
                }
            } catch (e) {
                // Invalid cache entry
                localStorage.removeItem(`cache_${key}`);
            }
        }
        
        // Load fresh data
        const value = await loader();
        
        // Store in caches
        this.setMemoryCache(key, value);
        this.setStorageCache(key, value, 3600000); // 1 hour TTL
        
        return value;
    }
    
    setMemoryCache(key, value) {
        // Evict least recently used if at capacity
        if (this.memoryCache.size >= this.maxMemoryItems) {
            const lru = this.findLRU();
            this.memoryCache.delete(lru);
            this.accessCounts.delete(lru);
        }
        
        this.memoryCache.set(key, value);
        this.accessCounts.set(key, 1);
    }
    
    setStorageCache(key, value, ttl) {
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify({
                value,
                timestamp: Date.now(),
                ttl
            }));
        } catch (e) {
            // Storage full - clear old cache entries
            this.clearOldStorageCache();
        }
    }
    
    clearOldStorageCache() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith('cache_'));
        
        // Remove oldest 25%
        const toRemove = Math.floor(cacheKeys.length * 0.25);
        cacheKeys.slice(0, toRemove).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}
```

## 🎯 Optimized Event Handling

**Efficient event listener management**:
```javascript
class EventManager {
    static listeners = new Map();
    
    static on(element, event, handler, options = {}) {
        const key = `${element.id}_${event}`;
        
        // Remove old listener if exists
        if (this.listeners.has(key)) {
            const { element: el, event: ev, handler: h } = this.listeners.get(key);
            el.removeEventListener(ev, h);
        }
        
        // Add optimized listener
        const optimizedHandler = options.throttle 
            ? throttle(handler, options.throttle)
            : options.debounce
            ? debounce(handler, options.debounce)
            : handler;
        
        element.addEventListener(event, optimizedHandler, options);
        
        this.listeners.set(key, {
            element,
            event,
            handler: optimizedHandler
        });
    }
    
    static removeAll() {
        for (const { element, event, handler } of this.listeners.values()) {
            element.removeEventListener(event, handler);
        }
        this.listeners.clear();
    }
}

// Usage
EventManager.on(searchInput, 'input', handleSearch, { debounce: 300 });
EventManager.on(window, 'resize', handleResize, { throttle: 100 });
EventManager.on(scrollContainer, 'scroll', handleScroll, { passive: true });
```

## 🎯 Key Performance Tips

1. **Batch operations** - Use Promise.all() for parallel execution
2. **Cache aggressively** - Memory > localStorage > network/disk
3. **Chunk large data** - Process in smaller pieces with UI updates
4. **Debounce/throttle** - Limit expensive operations
5. **Virtual scrolling** - Only render visible items
6. **Lazy loading** - Load resources on demand
7. **Clean up** - Remove listeners, clear large objects
8. **Monitor performance** - Use performance.now() and console timing

These patterns significantly improve UXP plugin performance and create smooth user experiences even with large datasets.