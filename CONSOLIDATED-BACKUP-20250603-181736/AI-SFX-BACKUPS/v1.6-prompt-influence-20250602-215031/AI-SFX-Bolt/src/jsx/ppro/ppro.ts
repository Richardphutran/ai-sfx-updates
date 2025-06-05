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
export const getSequenceInfo = () => {
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
        
        const importResult = app.project.importFiles([filePath]);
        if (!importResult) {
            result.error = "Failed to import file";
            return result;
        }
        
        // Find imported item
        result.step = "finding_imported_item";
        const fileName = filePath.split('/').pop();
        const baseName = fileName.replace(/\.[^.]*$/, '');
        result.debug.fileName = fileName;
        result.debug.baseName = baseName;
        
        let importedItem = null;
        const rootItem = app.project.rootItem;
        
        for (let i = 0; i < rootItem.children.numItems; i++) {
            const item = rootItem.children[i];
            if (item.name && item.name.indexOf(baseName) !== -1) {
                importedItem = item;
                break;
            }
        }
        
        if (!importedItem) {
            result.error = "Could not find imported item in project";
            result.debug.searchedFor = baseName;
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
                importedItem.moveBin(aiSfxBin);
                result.debug.movedToBin = "AI SFX";
            } catch (moveError) {
                result.debug.moveError = "Could not move to bin: " + moveError.toString();
                result.debug.movedToBin = "failed";
            }
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