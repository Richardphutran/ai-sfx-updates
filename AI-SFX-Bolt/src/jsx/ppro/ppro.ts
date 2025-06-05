import { dispatchTS } from "../utils/utils";

// ============= AI SFX GENERATOR PREMIERE PRO FUNCTIONS =============

// Initialize real-time timeline monitoring automatically
(function initializeTimelineMonitoring() {
    try {
        // Bind to project change event which fires for timeline changes
        app.bind('onProjectChanged', function() {
            // Get updated timeline info and dispatch
            const seq = app.project.activeSequence;
            if (seq) {
                const inPoint = seq.getInPoint();
                const outPoint = seq.getOutPoint();
                
                dispatchTS("timelineChanged", {
                    inPoint: parseFloat(inPoint) || null,
                    outPoint: parseFloat(outPoint) || null,
                    duration: (parseFloat(outPoint) - parseFloat(inPoint)) || null
                });
            }
        });
        
        // Log success for debugging
        $.writeln("[AI SFX] Timeline monitoring initialized successfully");
    } catch (error) {
        $.writeln("[AI SFX] Failed to initialize timeline monitoring: " + error.toString());
    }
})();

/**
 * Get lightweight sequence information for frequent updates
 * Optimized for performance with minimal calculations
 */
/**
 * Get the project folder path for relative file operations
 */
/**
 * Simple test function to verify ExtendScript is working
 */
export const testBasicExtendScript = () => {
    try {
        return {
            success: true,
            message: "ExtendScript is working!",
            appVersion: app ? app.version : "No app object",
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: "ExtendScript error: " + error.toString()
        };
    }
};

/**
 * Quick debug function to test timeline placement prerequisites
 */
export const debugTimelinePlacement = () => {
    try {
        const debug = {
            hasApp: typeof app !== 'undefined',
            hasProject: !!(app && app.project),
            hasActiveSequence: !!(app && app.project && app.project.activeSequence),
            audioTrackCount: 0,
            sequenceName: null,
            qeAvailable: false
        };
        
        if (debug.hasActiveSequence) {
            debug.sequenceName = app.project.activeSequence.name;
            debug.audioTrackCount = app.project.activeSequence.audioTracks.numTracks;
        }
        
        // Test QE API
        try {
            app.enableQE();
            debug.qeAvailable = typeof qe !== 'undefined' && typeof qe.project !== 'undefined';
        } catch (e) {
            debug.qeAvailable = false;
        }
        
        return {
            success: true,
            debug: debug
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
};

export const getProjectPath = () => {
    try {
        // Enhanced debug information
        var debugInfo = {
            hasApp: typeof app !== 'undefined',
            hasProject: false,
            projectPath: null,
            projectName: null,
            error: null,
            appDetails: null,
            projectDetails: null
        };
        
        // Test app object in detail
        if (typeof app !== 'undefined') {
            debugInfo.appDetails = {
                appName: app.appName || "Unknown",
                version: app.version || "Unknown",
                hasProject: typeof app.project !== 'undefined'
            };
        }
        
        if (!app) {
            debugInfo.error = "No app object";
            $.writeln("[AI SFX DEBUG] No app object available");
            return JSON.stringify({
                success: false,
                error: "No app object available",
                debug: debugInfo
            });
        }
        
        if (!app.project) {
            debugInfo.error = "No project";
            $.writeln("[AI SFX DEBUG] No project loaded in Premiere");
            return JSON.stringify({
                success: false,
                error: "No project loaded",
                debug: debugInfo
            });
        }
        
        debugInfo.hasProject = true;
        debugInfo.projectName = app.project.name || "Untitled";
        
        // Test project object in detail
        debugInfo.projectDetails = {
            name: app.project.name || "Untitled",
            hasPath: typeof app.project.path !== 'undefined',
            pathValue: app.project.path || "No path",
            pathType: typeof app.project.path
        };
        
        const projectPath = app.project.path;
        debugInfo.projectPath = projectPath;
        
        $.writeln("[AI SFX DEBUG] Project name: " + debugInfo.projectName);
        $.writeln("[AI SFX DEBUG] Project path: " + (projectPath || "NULL"));
        
        if (!projectPath || projectPath === "") {
            $.writeln("[AI SFX DEBUG] Project path is empty - project not saved");
            return JSON.stringify({
                success: false,
                error: "Project not saved yet - path is empty. Please save your project (Cmd+S) and try again.",
                debug: debugInfo,
                needsSave: true,
                userAction: "Save project with Cmd+S (Mac) or Ctrl+S (Windows)"
            });
        }
        
        // Extract directory from project file path
        // Handle both Mac and Windows paths
        const lastSlash = Math.max(projectPath.lastIndexOf('/'), projectPath.lastIndexOf('\\'));
        const projectDir = projectPath.substring(0, lastSlash);
        
        $.writeln("[AI SFX DEBUG] Project directory: " + projectDir);
        
        return JSON.stringify({
            success: true,
            projectPath: projectPath,
            projectDir: projectDir,
            debug: debugInfo
        });
    } catch (error) {
        $.writeln("[AI SFX DEBUG] Exception in getProjectPath: " + error.toString());
        return JSON.stringify({
            success: false,
            error: "Error getting project path: " + error.toString(),
            debug: debugInfo || { error: "Exception in getProjectPath" }
        });
    }
};

/**
 * Debug function to see what's actually in project bins
 */
export const debugProjectBins = () => {
    try {
        if (!app || !app.project) {
            return {
                success: false,
                error: "No project loaded"
            };
        }
        
        const debugInfo = [];
        const rootItem = app.project.rootItem;
        
        function debugBin(bin, path = "") {
            for (let i = 0; i < bin.children.numItems; i++) {
                const item = bin.children[i];
                const currentPath = path ? `${path}/${item.name}` : item.name;
                
                if (item.type === ProjectItemType.BIN) {
                    const binName = item.name.toLowerCase();
                    const matchesSFX = binName.includes('sfx') || 
                                     binName.includes('ai sfx') || 
                                     binName.includes('ai') ||
                                     binName === 'ai sfx' ||
                                     binName === 'ai' ||
                                     binName === 'sfx';
                    
                    debugInfo.push({
                        type: "BIN",
                        name: item.name,
                        path: currentPath,
                        itemCount: item.children.numItems,
                        matchesSFX: matchesSFX,
                        binNameLower: binName
                    });
                    
                    // Recursively debug sub-bins
                    debugBin(item, currentPath);
                } else if (item.type === ProjectItemType.CLIP) {
                    debugInfo.push({
                        type: "CLIP",
                        name: item.name,
                        path: currentPath,
                        hasMediaPath: typeof item.getMediaPath === 'function',
                        mediaPath: typeof item.getMediaPath === 'function' ? item.getMediaPath() : 'N/A'
                    });
                }
            }
        }
        
        debugBin(rootItem);
        
        return {
            success: true,
            debugInfo: debugInfo,
            totalItems: debugInfo.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: "Debug error: " + error.toString()
        };
    }
};

/**
 * Scan project bins for SFX files in bins named "sfx" or "ai sfx"
 */
export const scanProjectBinsForSFX = () => {
    try {
        if (!app || !app.project) {
            return JSON.stringify({
                success: false,
                error: "No project loaded",
                files: []
            });
        }
        
        const sfxFiles = [];
        const rootItem = app.project.rootItem;
        
        if (!rootItem) {
            return JSON.stringify({
                success: false,
                error: "No root item in project",
                files: []
            });
        }
        
        // DEBUG: List all bins in the project first
        $.writeln("🔍 DEBUG: Listing ALL bins in project:");
        function listAllBins(bin, binPath = "", depth = 0) {
            try {
                const indent = "  ".repeat(depth);
                for (let i = 0; i < bin.children.numItems; i++) {
                    const item = bin.children[i];
                    if (item.type === ProjectItemType.BIN) {
                        const currentPath = binPath ? `${binPath}/${item.name}` : item.name;
                        $.writeln(`${indent}📁 Bin: "${item.name}" (Path: ${currentPath})`);
                        listAllBins(item, currentPath, depth + 1);
                    }
                }
            } catch (e) {
                $.writeln(`${indent}❌ Error listing bin: ${e.toString()}`);
            }
        }
        listAllBins(rootItem);
        
        // Enhanced search: Look for ANY bin containing audio files
        // Priority given to bins with 'SFX', 'Sound', 'Audio' in the name, but scan ALL bins
        function searchBinForSFX(bin, binPath = "") {
            try {
                for (let i = 0; i < bin.children.numItems; i++) {
                    const item = bin.children[i];
                    
                    if (item.type === ProjectItemType.BIN) {
                        const binName = item.name.toLowerCase();
                        const currentPath = binPath ? `${binPath}/${item.name}` : item.name;
                        
                        // Check if bin name suggests it contains SFX/audio
                        const isSFXBin = binName.includes('sfx') || 
                                       binName.includes('sound') ||
                                       binName.includes('audio') ||
                                       binName.includes('ai sfx') || 
                                       binName.includes('ai_sfx') ||
                                       binName.includes('aisfx') ||
                                       binName.includes('effect');
                        
                        if (isSFXBin) {
                            $.writeln(`🎯 Found SFX bin: ${item.name} at path: ${currentPath}`);
                        } else {
                            $.writeln(`📁 Scanning regular bin: ${item.name} at path: ${currentPath}`);
                        }
                        
                        // Scan ALL bins for audio files (not just SFX-named bins)
                        scanBinContents(item, currentPath);
                        
                        // Always recursively search sub-bins
                        searchBinForSFX(item, currentPath);
                    }
                }
            } catch (e) {
                $.writeln(`❌ Error searching bin: ${e.toString()}`);
            }
        }
        
        // Function to scan a specific bin AND ALL its child bins for audio files
        function scanBinContents(bin, binPath) {
            try {
                for (let j = 0; j < bin.children.numItems; j++) {
                    const item = bin.children[j];
                    
                    // If it's a sub-bin, scan it too (recursive)
                    if (item.type === ProjectItemType.BIN) {
                        const subBinPath = binPath ? `${binPath}/${item.name}` : item.name;
                        scanBinContents(item, subBinPath); // Recursively scan all child bins
                    }
                    else if (item.type === ProjectItemType.CLIP && item.getMediaPath) {
                        const mediaPath = item.getMediaPath();
                        const lowerPath = mediaPath ? mediaPath.toLowerCase() : '';
                        
                        // Support multiple audio formats
                        const isAudioFile = lowerPath.endsWith('.mp3') || 
                                          lowerPath.endsWith('.wav') || 
                                          lowerPath.endsWith('.aac') || 
                                          lowerPath.endsWith('.m4a') || 
                                          lowerPath.endsWith('.flac') || 
                                          lowerPath.endsWith('.ogg') ||
                                          lowerPath.endsWith('.aiff') ||
                                          lowerPath.endsWith('.aif');
                        
                        if (mediaPath && isAudioFile) {
                            // Extract filename from path (works on Windows and Mac)
                            const fileName = mediaPath.split('/').pop() || mediaPath.split('\\').pop();
                            
                            // Remove file extension (supports multiple formats)
                            const baseName = fileName.replace(/\.(mp3|wav|aac|m4a|flac|ogg|aiff|aif)$/i, '');
                            
                            // Parse filename for prompt and number (supports all formats)
                            let number = 0;
                            let prompt = baseName;
                            
                            // Pattern 1: NEW SUFFIX FORMAT - "explosion sound 1" or "cat walking 12"
                            const newSuffixMatch = baseName.match(/^(.+?)\s+(\d+)$/);
                            if (newSuffixMatch) {
                                prompt = newSuffixMatch[1];
                                number = parseInt(newSuffixMatch[2]);
                            } else {
                                // Pattern 2: OLD PREFIX FORMAT - "001 explosion sound" (number prefix with spaces)
                                const oldPrefixMatch = baseName.match(/^(\d+)\s+(.+)$/);
                                if (oldPrefixMatch) {
                                    number = parseInt(oldPrefixMatch[1]);
                                    prompt = oldPrefixMatch[2];
                                } else {
                                    // Pattern 3: OLD UNDERSCORE FORMAT - "prompt_001_timestamp" or "prompt_1_timestamp" 
                                    const oldNumberMatch = baseName.match(/(.+?)_(\d+)_(.+)$/);
                                    if (oldNumberMatch) {
                                        prompt = oldNumberMatch[1].replace(/_/g, ' ');
                                        number = parseInt(oldNumberMatch[2]);
                                    } else {
                                        // Pattern 4: LEGACY FORMAT - "prompt_timestamp" (no number)
                                        const legacyMatch = baseName.match(/(.+?)_(.+)$/);
                                        if (legacyMatch) {
                                            prompt = legacyMatch[1].replace(/_/g, ' ');
                                        }
                                    }
                                }
                            }
                            
                            $.writeln(`🎵 Found audio file: ${fileName} in bin: ${binPath}`);
                            
                            sfxFiles.push({
                                filename: fileName,
                                basename: baseName,
                                number: number,
                                prompt: prompt.toLowerCase(),
                                timestamp: baseName.split('_').pop() || '',
                                path: mediaPath,
                                binPath: binPath,
                                source: 'project_bin'
                            });
                        }
                    }
                }
            } catch (e) {
                // Continue even if scanning one bin fails
            }
        }
        
        // Start recursive search from root
        searchBinForSFX(rootItem);
        
        // Sort by timestamp (most recent first)
        sfxFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        
        return JSON.stringify({
            success: true,
            files: sfxFiles,
            totalFound: sfxFiles.length
        });
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Error scanning project bins: " + error.toString(),
            files: []
        });
    }
};

export const getSequenceInfoLite = () => {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            return {
                success: false,
                error: "No active sequence"
            };
        }
        
        const sequence = app.project.activeSequence;
        
        // Only get essential timeline data for UI updates
        const inPoint = sequence.getInPoint();
        const outPoint = sequence.getOutPoint();
        const inPointSeconds = parseFloat(inPoint);
        const outPointSeconds = parseFloat(outPoint);
        const hasInPoint = (!isNaN(inPointSeconds) && inPointSeconds >= 0);
        const hasOutPoint = (!isNaN(outPointSeconds) && outPointSeconds >= 0);
        
        return {
            success: true,
            sequenceName: sequence.name,
            hasInPoint,
            hasOutPoint,
            inPoint: {
                seconds: hasInPoint ? inPointSeconds : null,
                formatted: hasInPoint ? formatTime(inPointSeconds) : "--:--:--"
            },
            outPoint: {
                seconds: hasOutPoint ? outPointSeconds : null,
                formatted: hasOutPoint ? formatTime(outPointSeconds) : "--:--:--"
            },
            duration: hasInPoint && hasOutPoint ? {
                seconds: outPointSeconds - inPointSeconds,
                formatted: formatTime(outPointSeconds - inPointSeconds)
            } : null
        };
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
};

/**
 * Get comprehensive sequence information including in/out points
 * Uses MVX-style direct access for reliable timeline data
 */
export const getSequenceInfo = (): any => {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            return {
                success: false,
                error: "No active sequence"
            };
        }
        
        const sequence = app.project.activeSequence;
        const result = {
            success: true,
            sequenceName: sequence.name,
            audioTrackCount: sequence.audioTracks.numTracks,
            videoTrackCount: sequence.videoTracks.numTracks,
            source: "Bolt CEP - MVX-style direct access"
        };
        
        // Get playhead position
        try {
            const playhead = sequence.getPlayerPosition();
            result.playheadPosition = playhead.seconds;
            result.playhead = {
                seconds: playhead.seconds,
                formatted: formatTime(playhead.seconds)
            };
        } catch (playheadError) {
            result.playheadError = playheadError.toString();
            result.playheadPosition = 0;
        }
        
        // Direct in/out point access (MVX pattern)
        try {
            const inPoint = sequence.getInPoint();
            const inPointSeconds = parseFloat(inPoint);
            const hasInPoint = (!isNaN(inPointSeconds) && inPointSeconds >= 0);
            
            result.inPoint = {
                seconds: hasInPoint ? inPointSeconds : null,
                formatted: hasInPoint ? formatTime(inPointSeconds) : "--:--:--",
                isActuallySet: hasInPoint,
                rawValue: inPoint
            };
            result.hasInPoint = hasInPoint;
            
        } catch (inError) {
            result.hasInPoint = false;
            result.inPointError = inError.toString();
            result.inPoint = {
                seconds: null,
                formatted: "--:--:--",
                isActuallySet: false,
                error: inError.toString()
            };
        }
        
        // Direct out point access
        try {
            const outPoint = sequence.getOutPoint();
            const outPointSeconds = parseFloat(outPoint);
            const hasOutPoint = (!isNaN(outPointSeconds) && outPointSeconds >= 0);
            
            result.outPoint = {
                seconds: hasOutPoint ? outPointSeconds : null,
                formatted: hasOutPoint ? formatTime(outPointSeconds) : "--:--:--",
                isActuallySet: hasOutPoint,
                rawValue: outPoint
            };
            result.hasOutPoint = hasOutPoint;
            
        } catch (outError) {
            result.hasOutPoint = false;
            result.outPointError = outError.toString();
            result.outPoint = {
                seconds: null,
                formatted: "--:--:--",
                isActuallySet: false,
                error: outError.toString()
            };
        }
        
        // Calculate duration
        if (result.hasInPoint && result.hasOutPoint && 
            result.inPoint.seconds !== null && result.outPoint.seconds !== null) {
            const duration = result.outPoint.seconds - result.inPoint.seconds;
            result.duration = {
                seconds: duration,
                formatted: formatTime(duration),
                isValid: duration > 0
            };
            result.hasDuration = duration > 0;
        } else {
            result.duration = {
                seconds: null,
                formatted: "--:--:--",
                isValid: false
            };
            result.hasDuration = false;
        }
        
        // Add sequence length for context
        try {
            if (sequence.end) {
                result.sequenceLength = {
                    seconds: sequence.end.seconds,
                    formatted: formatTime(sequence.end.seconds)
                };
            }
        } catch (lengthError) {
            result.sequenceLengthError = lengthError.toString();
        }
        
        return result;
        
    } catch (e) {
        return {
            success: false,
            error: "Critical error: " + e.toString(),
            source: "Bolt CEP - MVX-style direct access - failed"
        };
    }
};

/**
 * Import and place audio at specific time with smart track management
 * Uses proven QE API for track creation and collision detection
 */
export const importAndPlaceAudioAtTime = (filePath: string, timeSeconds: number, startingTrackIndex: number = 0) => {
    const result = {
        success: false,
        step: "initialization",
        error: "",
        debug: {}
    };
    
    try {
        // Validate inputs
        result.step = "validating_inputs";
        if (!filePath || typeof timeSeconds !== 'number') {
            result.error = "Invalid parameters: filePath and timeSeconds required";
            return result;
        }
        
        // Check app availability
        result.step = "checking_app";
        if (typeof app === 'undefined' || !app) {
            result.error = "app object not available";
            return result;
        }
        
        // Check project
        result.step = "checking_project"; 
        if (!app.project) {
            result.error = "No project loaded";
            return result;
        }
        
        // Check sequence
        result.step = "checking_sequence";
        if (!app.project.activeSequence) {
            result.error = "No active sequence";
            return result;
        }
        
        const sequence = app.project.activeSequence;
        result.debug.sequenceName = sequence.name;
        result.debug.placementTimeSeconds = timeSeconds;
        result.debug.placementTimeFormatted = formatTime(timeSeconds);
        
        // Import file
        result.step = "importing_file";
        result.debug.filePath = filePath;
        
        // Debug: Check current project state before import
        result.debug.preImportState = {
            rootItemChildrenCount: app.project.rootItem.children.numItems,
            activeItemName: app.project.viewIDs && app.project.viewIDs.length > 0 ? "Has viewIDs" : "No viewIDs"
        };
        
        // Find or create SFX bin
        let sfxBin = null;
        const rootItem = app.project.rootItem;
        
        // Look for existing SFX bin
        for (let i = 0; i < rootItem.children.numItems; i++) {
            const item = rootItem.children[i];
            if (item.type === ProjectItemType.BIN) {
                const binNameLower = item.name.toLowerCase();
                if (binNameLower === 'sfx' || binNameLower === 'ai sfx') {
                    sfxBin = item;
                    result.debug.foundExistingSFXBin = item.name;
                    break;
                }
            }
        }
        
        // Create SFX bin if it doesn't exist
        if (!sfxBin) {
            try {
                sfxBin = rootItem.createBin('AI SFX');
                result.debug.createdNewSFXBin = 'AI SFX';
            } catch (createError) {
                result.debug.binCreationError = createError.toString();
            }
        }
        
        // Log all bins before import to see where files might go
        const binsBeforeImport = [];
        function logAllBins(parentItem, path = '') {
            for (let i = 0; i < parentItem.children.numItems; i++) {
                const item = parentItem.children[i];
                if (item.type === ProjectItemType.BIN) {
                    const binPath = path ? path + '/' + item.name : item.name;
                    binsBeforeImport.push({
                        name: item.name,
                        path: binPath,
                        childCount: item.children.numItems
                    });
                    logAllBins(item, binPath);
                }
            }
        }
        logAllBins(app.project.rootItem);
        result.debug.binsBeforeImport = binsBeforeImport;
        
        // Import the file
        const importResult = app.project.importFiles([filePath]);
        if (!importResult) {
            result.error = "Failed to import file";
            return result;
        }
        
        // If we have an SFX bin and the file wasn't imported there, try to move it
        if (sfxBin) {
            result.debug.attemptingMoveToSFXBin = true;
        }
        
        // Add longer delay to allow import to complete properly
        // ExtendScript doesn't have setTimeout, but we can use a simple loop
        const startTime = new Date().getTime();
        while (new Date().getTime() - startTime < 1500) {
            // Wait 1.5 seconds for import to complete - Premiere needs more time
        }
        
        // Find imported item with enhanced search
        result.step = "finding_imported_item";
        const fileName = filePath.split('/').pop();
        const baseName = fileName.replace(/\.[^.]*$/, '');
        result.debug.fileName = fileName;
        result.debug.baseName = baseName;
        
        let importedItem = null;
        
        // Debug: Check bins after import to see where file went
        const binsAfterImport = [];
        let foundInBin = null;
        function checkBinsAfterImport(parentItem, path = '') {
            for (let i = 0; i < parentItem.children.numItems; i++) {
                const item = parentItem.children[i];
                if (item.type === ProjectItemType.BIN) {
                    const binPath = path ? path + '/' + item.name : item.name;
                    // Find matching bin from before import (no .find() in ExtendScript)
                    let beforeBin = null;
                    for (let k = 0; k < binsBeforeImport.length; k++) {
                        if (binsBeforeImport[k].path === binPath) {
                            beforeBin = binsBeforeImport[k];
                            break;
                        }
                    }
                    const afterChildCount = item.children.numItems;
                    const beforeChildCount = beforeBin ? beforeBin.childCount : 0;
                    
                    binsAfterImport.push({
                        name: item.name,
                        path: binPath,
                        childCount: afterChildCount,
                        childCountChange: afterChildCount - beforeChildCount
                    });
                    
                    // Check if this bin got a new item
                    if (afterChildCount > beforeChildCount) {
                        // Look for the new item
                        for (let j = 0; j < item.children.numItems; j++) {
                            const child = item.children[j];
                            if (child.type === ProjectItemType.CLIP && 
                                (child.name === fileName || child.name === baseName)) {
                                foundInBin = binPath;
                                importedItem = child;
                            }
                        }
                    }
                    
                    checkBinsAfterImport(item, binPath);
                }
            }
        }
        checkBinsAfterImport(rootItem);
        result.debug.binsAfterImport = binsAfterImport;
        result.debug.foundInBin = foundInBin;
        
        // Debug: Log all project items after import
        const projectItemsAfterImport = [];
        for (let i = 0; i < rootItem.children.numItems; i++) {
            const item = rootItem.children[i];
            projectItemsAfterImport.push({
                index: i,
                name: item.name,
                type: item.type === ProjectItemType.CLIP ? 'CLIP' : 
                      item.type === ProjectItemType.BIN ? 'BIN' : 'OTHER'
            });
        }
        result.debug.projectItemsAfterImport = projectItemsAfterImport;
        
        // Enhanced recursive search strategy
        const searchAttempts = [];
        
        // Recursive function to search through all project items and bins
        function searchProjectRecursively(parentItem, level = 0) {
            for (let i = 0; i < parentItem.children.numItems; i++) {
                const item = parentItem.children[i];
                
                // If it's a clip, check for matches
                if (item.type === ProjectItemType.CLIP) {
                    // Attempt 1: Exact filename match
                    if (item.name === fileName) {
                        importedItem = item;
                        searchAttempts.push(`Found by exact filename at level ${level}: ${fileName}`);
                        return true;
                    }
                    
                    // Attempt 2: Basename match
                    if (item.name === baseName) {
                        importedItem = item;
                        searchAttempts.push(`Found by basename at level ${level}: ${baseName}`);
                        return true;
                    }
                    
                    // Attempt 3: Case-insensitive match
                    if (item.name && item.name.toLowerCase() === fileName.toLowerCase()) {
                        importedItem = item;
                        searchAttempts.push(`Found by case-insensitive at level ${level}: ${item.name}`);
                        return true;
                    }
                    
                    // Attempt 4: Partial match
                    if (item.name && item.name.indexOf(baseName) !== -1) {
                        importedItem = item;
                        searchAttempts.push(`Found by partial match at level ${level}: ${item.name}`);
                        return true;
                    }
                }
                
                // If it's a bin, recursively search inside it
                if (item.type === ProjectItemType.BIN) {
                    searchAttempts.push(`Searching bin at level ${level}: ${item.name}`);
                    if (searchProjectRecursively(item, level + 1)) {
                        return true; // Found in sub-bin
                    }
                }
            }
            return false;
        }
        
        // Start recursive search from root
        searchProjectRecursively(rootItem);
        
        // Attempt 5: If still not found, use most recent item as fallback
        if (!importedItem && rootItem.children.numItems > 0) {
            const lastItem = rootItem.children[rootItem.children.numItems - 1];
            if (lastItem.type === ProjectItemType.CLIP) {
                importedItem = lastItem;
                searchAttempts.push("Using most recent item as fallback: " + lastItem.name);
            }
        }
        
        result.debug.searchAttempts = searchAttempts;
        result.debug.totalProjectItems = rootItem.children.numItems;
        
        if (!importedItem) {
            // List all project items for debugging
            const allItems = [];
            for (let i = 0; i < rootItem.children.numItems; i++) {
                const item = rootItem.children[i];
                allItems.push({
                    index: i,
                    name: item.name,
                    type: item.type === ProjectItemType.CLIP ? 'CLIP' : 
                          item.type === ProjectItemType.BIN ? 'BIN' : 'OTHER'
                });
            }
            result.debug.allProjectItems = allItems;
            result.error = "Could not find imported item in project after all search attempts";
            return result;
        }
        result.debug.importedItemName = importedItem.name;
        
        // Organize into "AI SFX" bin
        result.step = "organizing_into_bin";
        let aiSfxBin = null;
        
        // Check if "AI SFX" bin exists
        for (let j = 0; j < rootItem.children.numItems; j++) {
            const child = rootItem.children[j];
            if (child.type === ProjectItemType.BIN && child.name === "AI SFX") {
                aiSfxBin = child;
                break;
            }
        }
        
        // Create bin if needed
        if (!aiSfxBin) {
            try {
                aiSfxBin = rootItem.createBin("AI SFX");
                result.debug.createdBin = true;
            } catch (binError) {
                result.debug.binError = "Could not create bin: " + binError.toString();
                result.debug.createdBin = false;
            }
        } else {
            result.debug.createdBin = false;
        }
        
        // Move to bin
        if (aiSfxBin && importedItem) {
            try {
                // Debug: Check where item currently is before moving
                const currentParent = getParentBin(importedItem);
                result.debug.itemLocationBeforeMove = {
                    parentBin: currentParent ? currentParent.name : 'root',
                    itemName: importedItem.name,
                    foundInBin: foundInBin
                };
                
                importedItem.moveBin(aiSfxBin);
                result.debug.movedToBin = "AI SFX";
                
                // Verify move was successful
                const newParent = getParentBin(importedItem);
                result.debug.itemLocationAfterMove = {
                    parentBin: newParent ? newParent.name : 'root',
                    success: newParent && newParent.nodeId === aiSfxBin.nodeId
                };
            } catch (moveError) {
                result.debug.moveError = "Could not move to bin: " + moveError.toString();
                result.debug.movedToBin = "failed";
            }
        }
        
        // Helper function to find parent bin
        function getParentBin(item) {
            // Search all bins to find which one contains this item
            function searchBins(parentBin) {
                for (let i = 0; i < parentBin.children.numItems; i++) {
                    const child = parentBin.children[i];
                    if (child.nodeId === item.nodeId) {
                        return parentBin;
                    }
                    if (child.type === ProjectItemType.BIN) {
                        const found = searchBins(child);
                        if (found) return found;
                    }
                }
                return null;
            }
            
            // Start from root
            const foundParent = searchBins(rootItem);
            return foundParent === rootItem ? null : foundParent;
        }
        
        // Smart timeline placement with collision detection
        result.step = "smart_timeline_placement";
        const startingTrackIdx = parseInt(startingTrackIndex) || 0;
        let finalTrackIndex = -1;
        const placementAttempts = [];
        
        // Function to check collision at specific time (exact same logic as working CEP version)
        function hasAudioAtTime(track, timeValue) {
            try {
                if (!track.clips || track.clips.numItems === 0) {
                    return false; // No clips = no conflict
                }
                
                // Handle both time object and raw seconds value
                const timeInSeconds = typeof timeValue === 'object' ? timeValue.seconds : timeValue;
                
                for (let i = 0; i < track.clips.numItems; i++) {
                    const clip = track.clips[i];
                    const clipStart = clip.start.seconds;
                    const clipEnd = clip.end.seconds;
                    
                    // Check if placement time overlaps with existing clip (with small buffer)
                    if (timeInSeconds >= (clipStart - 0.1) && timeInSeconds <= (clipEnd + 0.1)) {
                        return true;
                    }
                }
                return false;
            } catch (e) {
                // If we can't check, assume there's a conflict to be safe
                return true;
            }
        }
        
        // Find available track
        let foundAvailableTrack = false;
        for (let trackIdx = startingTrackIdx; trackIdx < sequence.audioTracks.numTracks; trackIdx++) {
            const track = sequence.audioTracks[trackIdx];
            const hasConflict = hasAudioAtTime(track, timeSeconds);
            
            placementAttempts.push({
                trackIndex: trackIdx,
                hasConflict: hasConflict,
                timePosition: timeSeconds,
                trackClipCount: track.clips ? track.clips.numItems : 0,
                trackName: track.name || `Audio ${trackIdx + 1}`
            });
            
            if (!hasConflict) {
                finalTrackIndex = trackIdx;
                foundAvailableTrack = true;
                result.debug.foundAvailableTrack = trackIdx;
                break;
            }
        }
        
        // Create new track if needed (using proven working logic from original CEP)
        if (!foundAvailableTrack) {
            result.debug.beforeTrackCreation = sequence.audioTracks.numTracks;
            result.debug.attemptingNewTrack = true;
            
            let newTrack = null;
            const trackCreationAttempts = [];
            
            // First, enable QE API access
            try {
                app.enableQE();
                trackCreationAttempts.push("app.enableQE() - SUCCESS");
                result.debug.qeEnabled = true;
            } catch (qeError) {
                trackCreationAttempts.push("app.enableQE() - ERROR: " + qeError.toString());
                result.debug.qeEnabled = false;
            }
            
            // Attempt 1: Use QE API to add tracks (Boombox method)
            if (result.debug.qeEnabled) {
                try {
                    const qeSequence = qe.project.getActiveSequence();
                    if (qeSequence) {
                        // Use CORRECT QE API syntax with all 7 parameters (like Boombox!)
                        if (typeof qeSequence.addTracks === 'function') {
                            // Get current track count to add track at the END
                            const currentAudioTracks = sequence.audioTracks.numTracks;
                            
                            // qe.addTracks(numberOfVideoTracks, afterWhichVideoTrack, numberOfAudioTracks, audioTrackType, afterWhichAudioTrack, numberOfSubmixTracks, submixTrackType)
                            // Add 1 stereo audio track at the END: (0 video, 0 pos, 1 audio, 1=stereo, currentAudioTracks pos, 0 submix, 0 type)
                            qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
                            newTrack = true; // QE doesn't return track object
                            trackCreationAttempts.push("qe.addTracks(0,0,1,1," + currentAudioTracks + ",0,0) STEREO AT END - SUCCESS");
                        } else {
                            trackCreationAttempts.push("qe.addTracks() - NOT AVAILABLE");
                        }
                    } else {
                        trackCreationAttempts.push("qe.project.getActiveSequence() - FAILED");
                    }
                } catch (qeAddError) {
                    trackCreationAttempts.push("qe.addTracks() - ERROR: " + qeAddError.toString());
                }
            }
            
            // Attempt 2: Try alternative QE methods
            if (!newTrack && result.debug.qeEnabled) {
                try {
                    const qeSequence = qe.project.getActiveSequence();
                    if (qeSequence && typeof qeSequence.insertTracks === 'function') {
                        qeSequence.insertTracks(0, 1); // Insert 1 audio track
                        newTrack = true;
                        trackCreationAttempts.push("qe.insertTracks(0, 1) - SUCCESS");
                    } else {
                        trackCreationAttempts.push("qe.insertTracks() - NOT AVAILABLE");
                    }
                } catch (qeInsertError) {
                    trackCreationAttempts.push("qe.insertTracks() - ERROR: " + qeInsertError.toString());
                }
            }
            
            // Attempt 3: Try direct sequence manipulation
            if (!newTrack) {
                try {
                    // Some Adobe apps support this pattern
                    if (typeof sequence.insertAudioTrack === 'function') {
                        newTrack = sequence.insertAudioTrack();
                        trackCreationAttempts.push("sequence.insertAudioTrack() - SUCCESS");
                    } else {
                        trackCreationAttempts.push("sequence.insertAudioTrack() - NOT AVAILABLE");
                    }
                } catch (e3) {
                    trackCreationAttempts.push("sequence.insertAudioTrack() - ERROR: " + e3.toString());
                }
            }
            
            result.debug.trackCreationAttempts = trackCreationAttempts;
            
            if (!newTrack) {
                // If we can't create tracks, fall back to using existing tracks
                result.debug.trackCreationFailed = true;
                result.debug.apiLimitation = "Premiere Pro ExtendScript may not support dynamic track creation";
                result.debug.fallbackStrategy = "Will place on existing tracks, even if there are conflicts";
                
                // Use the last available track instead of creating a new one
                finalTrackIndex = sequence.audioTracks.numTracks - 1;
                foundAvailableTrack = true;
                result.debug.usingFallbackTrack = finalTrackIndex;
                result.debug.createdNewTrack = false;
            } else {
                // Successfully created a new track (hopefully with QE API!)
                result.debug.afterTrackCreation = sequence.audioTracks.numTracks;
                
                // Check if track count actually increased
                if (sequence.audioTracks.numTracks > result.debug.beforeTrackCreation) {
                    // Success! Track was actually created - use the NEW track at the end
                    finalTrackIndex = sequence.audioTracks.numTracks - 1; // This should be the NEW empty track
                    result.debug.createdNewTrack = true;
                    result.debug.newTrackIndex = finalTrackIndex;
                    result.debug.trackCreationSuccess = true;
                    result.debug.trackCreationConfirmed = "YES - from " + result.debug.beforeTrackCreation + " to " + result.debug.afterTrackCreation;
                    result.debug.usingNewlyCreatedTrack = "Track " + (finalTrackIndex + 1) + " (should be empty)";
                    foundAvailableTrack = true;
                } else {
                    // Track creation call succeeded but no new track appeared
                    result.debug.trackCreationConfirmed = "NO - track count stayed " + sequence.audioTracks.numTracks;
                    result.debug.trackCreationFailed = true;
                    
                    // Fall back to using existing tracks
                    finalTrackIndex = sequence.audioTracks.numTracks - 1;
                    foundAvailableTrack = true;
                    result.debug.usingFallbackTrack = finalTrackIndex;
                    result.debug.createdNewTrack = false;
                }
            }
        }
        
        result.debug.placementAttempts = placementAttempts;
        result.debug.finalTrackIndex = finalTrackIndex;
        result.debug.totalTracksNow = sequence.audioTracks.numTracks;
        
        // Place audio at specific time
        result.step = "placing_audio";
        const targetTrack = sequence.audioTracks[finalTrackIndex];
        
        try {
            targetTrack.insertClip(importedItem, timeSeconds);
            result.debug.placementMethod = "insertClip at specific time";
            result.debug.placementSuccess = true;
        } catch (insertError) {
            result.error = "Failed to insert clip at time " + timeSeconds + "s: " + insertError.toString();
            return result;
        }
        
        // Success!
        result.success = true;
        result.step = "completed";
        
        let message = "Audio placed at " + formatTime(timeSeconds) + " on track " + (finalTrackIndex + 1);
        if (result.debug.createdNewTrack) {
            message += " (new track created)";
        } else if (finalTrackIndex !== startingTrackIdx) {
            message += " (avoided conflicts)";
        }
        
        result.message = message;
        result.fileName = importedItem.name;
        result.trackIndex = finalTrackIndex;
        result.position = timeSeconds;
        result.positionFormatted = formatTime(timeSeconds);
        
        return result;
        
    } catch (error) {
        result.error = "Exception in step '" + result.step + "': " + error.toString();
        return result;
    }
};

/**
 * Standard audio import at playhead position (for non-in/out mode)
 */
export const importAndPlaceAudio = (filePath: string, trackIndex: number = 0) => {
    try {
        const sequence = app.project.activeSequence;
        if (!sequence) {
            return { success: false, error: "No active sequence" };
        }
        
        const currentTime = sequence.getPlayerPosition();
        return importAndPlaceAudioAtTime(filePath, currentTime.seconds, trackIndex);
        
    } catch (error) {
        return {
            success: false,
            error: "Failed to place at playhead: " + error.toString()
        };
    }
};

/**
 * Check if audio file is already in project and place it
 * Otherwise use standard import workflow
 */
export const placeAudioWithoutDuplicating = (filePath: string, trackIndex: number = 0) => {
    const result = {
        success: false,
        error: null,
        message: "",
        step: "init",
        fileName: "",
        alreadyInProject: false,
        debug: {}
    };
    
    try {
        const sequence = app.project.activeSequence;
        if (!sequence) {
            result.error = "No active sequence";
            return result;
        }
        
        // Extract filename from path
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
        result.fileName = fileName;
        
        // First, check if this file is already in the project
        result.step = "checking_existing_items";
        let existingItem = null;
        
        function findProjectItem(parentItem, targetPath) {
            for (let i = 0; i < parentItem.children.numItems; i++) {
                const child = parentItem.children[i];
                
                if (child.type === ProjectItemType.BIN) {
                    // Recursively search bins
                    const found = findProjectItem(child, targetPath);
                    if (found) return found;
                } else if (child.type === ProjectItemType.CLIP && child.getMediaPath) {
                    // Check if this item matches our file
                    const itemPath = child.getMediaPath();
                    if (itemPath && itemPath === targetPath) {
                        return child;
                    }
                }
            }
            return null;
        }
        
        existingItem = findProjectItem(app.project.rootItem, filePath);
        
        if (existingItem) {
            // File is already in project - just place it
            result.alreadyInProject = true;
            result.step = "placing_existing_item";
            
            const currentTime = sequence.getPlayerPosition();
            const timeSeconds = currentTime.seconds;
            
            // Find available track using same logic
            const targetTrackIdx = parseInt(trackIndex) || 0;
            let finalTrackIndex = -1;
            
            for (let trackIdx = targetTrackIdx; trackIdx < sequence.audioTracks.numTracks; trackIdx++) {
                const track = sequence.audioTracks[trackIdx];
                let hasConflict = false;
                
                if (track.clips && track.clips.numItems > 0) {
                    for (let i = 0; i < track.clips.numItems; i++) {
                        const clip = track.clips[i];
                        if (timeSeconds >= (clip.start.seconds - 0.1) && 
                            timeSeconds <= (clip.end.seconds + 0.1)) {
                            hasConflict = true;
                            break;
                        }
                    }
                }
                
                if (!hasConflict) {
                    finalTrackIndex = trackIdx;
                    break;
                }
            }
            
            // Create new track if needed (using proven logic from importAndPlaceAudioAtTime)
            if (finalTrackIndex === -1) {
                result.debug.needsNewTrack = true;
                result.debug.beforeTrackCreation = sequence.audioTracks.numTracks;
                
                let newTrack = false;
                const trackCreationAttempts = [];
                
                // Enable QE for track creation
                try {
                    app.enableQE();
                    trackCreationAttempts.push("app.enableQE() - SUCCESS");
                    result.debug.qeEnabled = true;
                } catch (qeError) {
                    trackCreationAttempts.push("app.enableQE() - ERROR: " + qeError.toString());
                    result.debug.qeEnabled = false;
                }
                
                // Attempt 1: Use QE API to add tracks (proven working method)
                if (result.debug.qeEnabled) {
                    try {
                        const qeSequence = qe.project.getActiveSequence();
                        if (qeSequence && typeof qeSequence.addTracks === 'function') {
                            const currentAudioTracks = sequence.audioTracks.numTracks;
                            qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
                            newTrack = true;
                            trackCreationAttempts.push("qe.addTracks(0,0,1,1," + currentAudioTracks + ",0,0) - SUCCESS");
                        } else {
                            trackCreationAttempts.push("qe.addTracks() - NOT AVAILABLE");
                        }
                    } catch (qeAddError) {
                        trackCreationAttempts.push("qe.addTracks() - ERROR: " + qeAddError.toString());
                    }
                }
                
                // Attempt 2: Try alternative QE methods
                if (!newTrack && result.debug.qeEnabled) {
                    try {
                        const qeSequence = qe.project.getActiveSequence();
                        if (qeSequence && typeof qeSequence.insertTracks === 'function') {
                            qeSequence.insertTracks(0, 1);
                            newTrack = true;
                            trackCreationAttempts.push("qe.insertTracks(0, 1) - SUCCESS");
                        } else {
                            trackCreationAttempts.push("qe.insertTracks() - NOT AVAILABLE");
                        }
                    } catch (qeInsertError) {
                        trackCreationAttempts.push("qe.insertTracks() - ERROR: " + qeInsertError.toString());
                    }
                }
                
                // Attempt 3: Try direct sequence manipulation
                if (!newTrack) {
                    try {
                        if (typeof sequence.insertAudioTrack === 'function') {
                            newTrack = sequence.insertAudioTrack();
                            trackCreationAttempts.push("sequence.insertAudioTrack() - SUCCESS");
                        } else {
                            trackCreationAttempts.push("sequence.insertAudioTrack() - NOT AVAILABLE");
                        }
                    } catch (e3) {
                        trackCreationAttempts.push("sequence.insertAudioTrack() - ERROR: " + e3.toString());
                    }
                }
                
                result.debug.trackCreationAttempts = trackCreationAttempts;
                result.debug.afterTrackCreation = sequence.audioTracks.numTracks;
                
                if (newTrack && sequence.audioTracks.numTracks > result.debug.beforeTrackCreation) {
                    // Success! Track was created
                    finalTrackIndex = sequence.audioTracks.numTracks - 1;
                    result.debug.createdNewTrack = true;
                    result.debug.newTrackIndex = finalTrackIndex;
                    result.debug.trackCreationSuccess = true;
                } else {
                    // Track creation failed - use fallback
                    result.debug.trackCreationFailed = true;
                    result.debug.fallbackStrategy = "Using last track even with conflicts";
                    finalTrackIndex = sequence.audioTracks.numTracks - 1;
                    result.debug.usingFallbackTrack = finalTrackIndex;
                    result.debug.createdNewTrack = false;
                }
            }
            
            // Place the existing item
            sequence.audioTracks[finalTrackIndex].insertClip(existingItem, timeSeconds);
            
            result.success = true;
            result.message = "Existing audio '" + fileName + "' placed at " + formatTime(timeSeconds);
            result.trackIndex = finalTrackIndex;
            result.position = timeSeconds;
            
        } else {
            // File not in project - use standard import and place
            result.step = "importing_and_placing";
            return importAndPlaceAudio(filePath, trackIndex);
        }
        
        return result;
        
    } catch (error) {
        result.error = "Failed to place audio: " + error.toString();
        return result;
    }
};

/**
 * Utility function to format time as HH:MM:SS
 */
function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00:00";
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const hoursStr = hours < 10 ? "0" + hours : hours.toString();
    const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
    const secsStr = secs < 10 ? "0" + secs : secs.toString();
    
    return hoursStr + ":" + minutesStr + ":" + secsStr;
}

/**
 * Place existing project item on timeline without re-importing
 * @param binPath - The path within project bins (e.g., "SFX/cat_walking.mp3")
 * @param timeSeconds - Optional time in seconds to place at (defaults to playhead)
 * @param startingTrackIndex - Track index to start searching from
 */
export const placeExistingProjectItem = (binPath: string, timeSeconds?: number, startingTrackIndex: number = 0) => {
    const result = {
        success: false,
        step: "initialization",
        error: "",
        debug: {}
    };
    
    try {
        // Validate inputs
        result.step = "validating_inputs";
        if (!binPath) {
            result.error = "Invalid parameters: binPath required";
            return result;
        }
        
        // Check app availability
        result.step = "checking_app";
        if (typeof app === 'undefined' || !app) {
            result.error = "app object not available";
            return result;
        }
        
        // Check project
        result.step = "checking_project"; 
        if (!app.project) {
            result.error = "No project loaded";
            return result;
        }
        
        // Check sequence
        result.step = "checking_sequence";
        if (!app.project.activeSequence) {
            result.error = "No active sequence";
            return result;
        }
        
        const sequence = app.project.activeSequence;
        result.debug.sequenceName = sequence.name;
        
        // Determine placement time
        const placementTime = timeSeconds !== undefined 
            ? timeSeconds 
            : sequence.getPlayerPosition().seconds;
        result.debug.placementTimeSeconds = placementTime;
        result.debug.placementTimeFormatted = formatTime(placementTime);
        
        // Find the project item by bin path
        result.step = "finding_project_item";
        result.debug.binPath = binPath;
        
        // Extract just the filename from the bin path
        const fileName = binPath.split('/').pop();
        result.debug.fileName = fileName;
        
        let projectItem = null;
        
        // Recursive function to search through all project items and bins
        function searchProjectRecursively(parentItem, currentPath = '') {
            for (let i = 0; i < parentItem.children.numItems; i++) {
                const item = parentItem.children[i];
                const itemPath = currentPath ? currentPath + '/' + item.name : item.name;
                
                // If it's a clip, check if it matches our target
                if (item.type === ProjectItemType.CLIP) {
                    // Check both full path match and just filename match
                    if (itemPath === binPath || item.name === fileName) {
                        projectItem = item;
                        result.debug.foundItemPath = itemPath;
                        result.debug.foundItemName = item.name;
                        return true;
                    }
                }
                // If it's a bin, search recursively
                else if (item.type === ProjectItemType.BIN) {
                    if (searchProjectRecursively(item, itemPath)) {
                        return true;
                    }
                }
            }
            return false;
        }
        
        // Start search from root
        const rootItem = app.project.rootItem;
        searchProjectRecursively(rootItem);
        
        if (!projectItem) {
            result.error = "Project item not found: " + binPath;
            result.debug.searchedFor = binPath;
            return result;
        }
        
        result.debug.foundItem = {
            name: projectItem.name,
            type: projectItem.type === ProjectItemType.CLIP ? 'CLIP' : 'OTHER'
        };
        
        // Now use the same smart track placement logic as importAndPlaceAudioAtTime
        result.step = "finding_available_track";
        
        // Track placement logic (same as importAndPlaceAudioAtTime)
        let foundAvailableTrack = false;
        let finalTrackIndex = startingTrackIndex;
        const placementAttempts = [];
        
        // Check existing tracks first
        for (let i = startingTrackIndex; i < sequence.audioTracks.numTracks; i++) {
            const track = sequence.audioTracks[i];
            let hasConflict = false;
            
            // Check for conflicts with existing clips (using same collision detection as importAndPlaceAudioAtTime)
            if (track.clips && track.clips.numItems > 0) {
                for (let j = 0; j < track.clips.numItems; j++) {
                    const clip = track.clips[j];
                    const clipStart = clip.start.seconds;
                    const clipEnd = clip.end.seconds;
                    
                    // Check if placement time overlaps with existing clip (with small buffer)
                    if (placementTime >= (clipStart - 0.1) && placementTime <= (clipEnd + 0.1)) {
                        hasConflict = true;
                        placementAttempts.push({
                            trackIndex: i,
                            conflict: true,
                            conflictingClip: {
                                name: clip.name,
                                start: clipStart,
                                end: clipEnd
                            }
                        });
                        break;
                    }
                }
            }
            
            if (!hasConflict) {
                foundAvailableTrack = true;
                finalTrackIndex = i;
                placementAttempts.push({
                    trackIndex: i,
                    conflict: false,
                    selected: true
                });
                break;
            }
        }
        
        // If no available track found, create new track using QE API
        if (!foundAvailableTrack) {
            result.debug.beforeTrackCreation = sequence.audioTracks.numTracks;
            result.debug.attemptingNewTrack = true;
            
            let newTrack = null;
            const trackCreationAttempts = [];
            
            // First, enable QE API access
            try {
                app.enableQE();
                trackCreationAttempts.push("app.enableQE() - SUCCESS");
                result.debug.qeEnabled = true;
            } catch (qeError) {
                trackCreationAttempts.push("app.enableQE() - ERROR: " + qeError.toString());
                result.debug.qeEnabled = false;
            }
            
            // Attempt 1: Use QE API to add tracks (proven working method)
            if (result.debug.qeEnabled) {
                try {
                    const qeSequence = qe.project.getActiveSequence();
                    if (qeSequence) {
                        // Use CORRECT QE API syntax with all 7 parameters
                        if (typeof qeSequence.addTracks === 'function') {
                            const currentAudioTracks = sequence.audioTracks.numTracks;
                            
                            // Add 1 stereo audio track at the END
                            qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
                            newTrack = true;
                            trackCreationAttempts.push("qe.addTracks(0,0,1,1," + currentAudioTracks + ",0,0) STEREO AT END - SUCCESS");
                        } else {
                            trackCreationAttempts.push("qe.addTracks() - NOT AVAILABLE");
                        }
                    } else {
                        trackCreationAttempts.push("qe.project.getActiveSequence() - FAILED");
                    }
                } catch (qeAddError) {
                    trackCreationAttempts.push("qe.addTracks() - ERROR: " + qeAddError.toString());
                }
            }
            
            // Attempt 2: Try alternative QE methods
            if (!newTrack && result.debug.qeEnabled) {
                try {
                    const qeSequence = qe.project.getActiveSequence();
                    if (qeSequence && typeof qeSequence.insertTracks === 'function') {
                        qeSequence.insertTracks(0, 1); // Insert 1 audio track
                        newTrack = true;
                        trackCreationAttempts.push("qe.insertTracks(0, 1) - SUCCESS");
                    } else {
                        trackCreationAttempts.push("qe.insertTracks() - NOT AVAILABLE");
                    }
                } catch (qeInsertError) {
                    trackCreationAttempts.push("qe.insertTracks() - ERROR: " + qeInsertError.toString());
                }
            }
            
            // Attempt 3: Try direct sequence manipulation
            if (!newTrack) {
                try {
                    if (typeof sequence.insertAudioTrack === 'function') {
                        newTrack = sequence.insertAudioTrack();
                        trackCreationAttempts.push("sequence.insertAudioTrack() - SUCCESS");
                    } else {
                        trackCreationAttempts.push("sequence.insertAudioTrack() - NOT AVAILABLE");
                    }
                } catch (e3) {
                    trackCreationAttempts.push("sequence.insertAudioTrack() - ERROR: " + e3.toString());
                }
            }
            
            result.debug.trackCreationAttempts = trackCreationAttempts;
            result.debug.afterTrackCreation = sequence.audioTracks.numTracks;
            
            if (!newTrack) {
                // If we can't create tracks, fall back to using existing tracks
                result.debug.trackCreationFailed = true;
                result.debug.apiLimitation = "Premiere Pro ExtendScript may not support dynamic track creation";
                result.debug.fallbackStrategy = "Will place on existing tracks, even if there are conflicts";
                
                // Use the last available track instead of creating a new one
                finalTrackIndex = sequence.audioTracks.numTracks - 1;
                foundAvailableTrack = true;
                result.debug.usingFallbackTrack = finalTrackIndex;
                result.debug.createdNewTrack = false;
            } else {
                // Successfully created a new track
                if (sequence.audioTracks.numTracks > result.debug.beforeTrackCreation) {
                    // Success! Track was actually created - use the NEW track at the end
                    finalTrackIndex = sequence.audioTracks.numTracks - 1;
                    result.debug.createdNewTrack = true;
                    result.debug.newTrackIndex = finalTrackIndex;
                    result.debug.trackCreationSuccess = true;
                    result.debug.trackCreationConfirmed = "YES - from " + result.debug.beforeTrackCreation + " to " + result.debug.afterTrackCreation;
                    result.debug.usingNewlyCreatedTrack = "Track " + (finalTrackIndex + 1) + " (should be empty)";
                    foundAvailableTrack = true;
                } else {
                    // Track creation call succeeded but no new track appeared
                    result.debug.trackCreationConfirmed = "NO - track count stayed " + sequence.audioTracks.numTracks;
                    result.debug.trackCreationFailed = true;
                    
                    // Fall back to using existing tracks
                    finalTrackIndex = sequence.audioTracks.numTracks - 1;
                    foundAvailableTrack = true;
                    result.debug.usingFallbackTrack = finalTrackIndex;
                    result.debug.createdNewTrack = false;
                }
            }
        }
        
        result.debug.placementAttempts = placementAttempts;
        result.debug.finalTrackIndex = finalTrackIndex;
        
        // Place the existing project item
        result.step = "placing_audio";
        const targetTrack = sequence.audioTracks[finalTrackIndex];
        
        try {
            targetTrack.insertClip(projectItem, placementTime);
            result.debug.placementMethod = "insertClip with existing project item";
            result.debug.placementSuccess = true;
        } catch (insertError) {
            result.error = "Failed to insert clip at time " + placementTime + "s: " + insertError.toString();
            return result;
        }
        
        // Success!
        result.success = true;
        result.step = "completed";
        
        let message = "Audio placed at " + formatTime(placementTime) + " on track " + (finalTrackIndex + 1);
        if (result.debug.createdNewTrack) {
            message += " (new track created)";
        } else if (finalTrackIndex !== startingTrackIndex) {
            message += " (avoided conflicts)";
        }
        
        result.message = message;
        result.fileName = projectItem.name;
        result.trackIndex = finalTrackIndex;
        result.position = placementTime;
        result.positionFormatted = formatTime(placementTime);
        
        return result;
        
    } catch (error) {
        result.error = "Exception in step '" + result.step + "': " + error.toString();
        return result;
    }
};

/**
 * Test function for Bolt CEP connectivity
 */
export const testConnection = () => {
    return {
        success: true,
        message: "AI SFX Generator ExtendScript connected via Bolt CEP!",
        timestamp: (new Date()).toISOString(),
        premiereVersion: app.version,
        projectName: app.project ? app.project.name : "No project"
    };
};

/**
 * Get basic app info for debugging
 */
export const getAppInfo = () => {
    return {
        appName: app.appName,
        version: app.version,
        projectName: app.project ? app.project.name : "No project",
        hasActiveSequence: !!(app.project && app.project.activeSequence),
        sequenceName: (app.project && app.project.activeSequence) ? app.project.activeSequence.name : null
    };
};