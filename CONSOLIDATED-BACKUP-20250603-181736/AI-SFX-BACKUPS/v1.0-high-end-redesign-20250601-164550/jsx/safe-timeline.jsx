// Ultra-safe timeline functions with maximum error protection
function safeTest() {
    return "Timeline script loaded safely";
}

function importAndPlaceAudio(filePath, trackIndex) {
    // Ultra-safe wrapper to prevent crashes
    try {
        return safeImportAndPlace(filePath, trackIndex);
    } catch (e) {
        return JSON.stringify({
            success: false,
            error: "Critical error: " + e.toString(),
            step: "wrapper_catch"
        });
    }
}

function safeImportAndPlace(filePath, trackIndex) {
    var result = {
        success: false,
        step: "initialization",
        error: "",
        debug: {}
    };
    
    try {
        // Step 1: Check if app exists
        result.step = "checking_app";
        if (typeof app === 'undefined' || !app) {
            result.error = "app object not available";
            return JSON.stringify(result);
        }
        result.debug.appName = app.name;
        
        // Step 2: Check project
        result.step = "checking_project"; 
        if (!app.project) {
            result.error = "No project loaded";
            return JSON.stringify(result);
        }
        result.debug.projectName = app.project.name;
        
        // Step 3: Check sequence
        result.step = "checking_sequence";
        if (!app.project.activeSequence) {
            result.error = "No active sequence";
            return JSON.stringify(result);
        }
        var sequence = app.project.activeSequence;
        result.debug.sequenceName = sequence.name;
        
        // Step 4: Check audio tracks
        result.step = "checking_audio_tracks";
        if (!sequence.audioTracks || sequence.audioTracks.numTracks === 0) {
            result.error = "No audio tracks found in sequence";
            result.debug.audioTrackCount = 0;
            return JSON.stringify(result);
        }
        result.debug.audioTrackCount = sequence.audioTracks.numTracks;
        
        // Step 5: Get playhead position
        result.step = "getting_playhead";
        var currentTime = sequence.getPlayerPosition();
        result.debug.playheadSeconds = currentTime.seconds;
        
        // Step 6: Import file
        result.step = "importing_file";
        result.debug.filePath = filePath;
        
        var importResult = app.project.importFiles([filePath]);
        if (!importResult) {
            result.error = "Failed to import file";
            return JSON.stringify(result);
        }
        
        // Step 7: Find imported item and organize into bin
        result.step = "finding_imported_item";
        var fileName = filePath.split('/').pop();
        if (fileName.indexOf('\\') > -1) {
            fileName = fileName.split('\\').pop();
        }
        var baseName = fileName.replace(/\.[^.]*$/, '');
        result.debug.fileName = fileName;
        result.debug.baseName = baseName;
        
        var importedItem = null;
        var rootItem = app.project.rootItem;
        
        // Find the imported item
        for (var i = 0; i < rootItem.children.numItems; i++) {
            var item = rootItem.children[i];
            if (item.name && item.name.indexOf(baseName) !== -1) {
                importedItem = item;
                break;
            }
        }
        
        if (!importedItem) {
            result.error = "Could not find imported item in project";
            result.debug.searchedFor = baseName;
            return JSON.stringify(result);
        }
        result.debug.importedItemName = importedItem.name;
        
        // Step 7.5: Organize into "AI SFX" bin
        result.step = "organizing_into_bin";
        var aiSfxBin = null;
        
        // First check if "AI SFX" bin already exists
        for (var j = 0; j < rootItem.children.numItems; j++) {
            var child = rootItem.children[j];
            if (child.type === ProjectItemType.BIN && child.name === "AI SFX") {
                aiSfxBin = child;
                break;
            }
        }
        
        // If no "AI SFX" bin exists, create one
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
        
        // Move the imported item to the AI SFX bin
        if (aiSfxBin && importedItem) {
            try {
                importedItem.moveBin(aiSfxBin);
                result.debug.movedToBin = "AI SFX";
            } catch (moveError) {
                result.debug.moveError = "Could not move to bin: " + moveError.toString();
                result.debug.movedToBin = "failed";
            }
        }
        
        // Step 8: Smart timeline placement with collision detection
        result.step = "smart_timeline_placement";
        var startingTrackIndex = parseInt(trackIndex) || 0;
        var finalTrackIndex = -1;
        var placementAttempts = [];
        
        // Function to check if track has audio at current time
        function hasAudioAtTime(track, time) {
            try {
                if (!track.clips || track.clips.numItems === 0) {
                    return false; // No clips = no conflict
                }
                
                for (var i = 0; i < track.clips.numItems; i++) {
                    var clip = track.clips[i];
                    var clipStart = clip.start.seconds;
                    var clipEnd = clip.end.seconds;
                    
                    // Check if playhead time overlaps with existing clip (with small buffer)
                    if (time.seconds >= (clipStart - 0.1) && time.seconds <= (clipEnd + 0.1)) {
                        return true;
                    }
                }
                return false;
            } catch (e) {
                // If we can't check, assume there's a conflict to be safe
                return true;
            }
        }
        
        // Try to find available track starting from preferred track
        var foundAvailableTrack = false;
        for (var trackIdx = startingTrackIndex; trackIdx < sequence.audioTracks.numTracks; trackIdx++) {
            var track = sequence.audioTracks[trackIdx];
            var hasConflict = hasAudioAtTime(track, currentTime);
            
            placementAttempts.push({
                trackIndex: trackIdx,
                hasConflict: hasConflict
            });
            
            if (!hasConflict) {
                finalTrackIndex = trackIdx;
                foundAvailableTrack = true;
                result.debug.foundAvailableTrack = trackIdx;
                break;
            }
        }
        
        // If no available track found, FORCE creation of new audio track
        if (!foundAvailableTrack) {
            result.debug.beforeTrackCreation = sequence.audioTracks.numTracks;
            result.debug.attemptingNewTrack = true;
            
            try {
                // Use the QE (Quantum Engine) API like Boombox does!
                // This is the undocumented but powerful API for timeline manipulation
                var newTrack = null;
                var trackCreationAttempts = [];
                
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
                        var qeSequence = qe.project.getActiveSequence();
                        if (qeSequence) {
                            // Use CORRECT QE API syntax with all 7 parameters (like Boombox!)
                            if (typeof qeSequence.addTracks === 'function') {
                                // Get current track count to add track at the END
                                var currentAudioTracks = sequence.audioTracks.numTracks;
                                
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
                        var qeSequence = qe.project.getActiveSequence();
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
                    // This is likely the limitation of Premiere Pro's ExtendScript API
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
                        result.debug.createdNewTrack = false;
                        result.debug.trackCreationSuccess = false;
                        result.debug.trackCreationConfirmed = "NO - still " + sequence.audioTracks.numTracks + " tracks (API call succeeded but no track added)";
                        
                        // Fall back to using existing tracks
                        finalTrackIndex = sequence.audioTracks.numTracks - 1;
                        foundAvailableTrack = true;
                        result.debug.usingFallbackTrack = finalTrackIndex;
                        result.debug.fallbackReason = "QE API call succeeded but track count unchanged";
                    }
                }
                
            } catch (createError) {
                result.debug.createTrackError = createError.toString();
                result.debug.trackCreationSuccess = false;
                
                // Instead of failing, use fallback strategy
                result.debug.usingCatchFallback = true;
                result.debug.fallbackReason = "Exception during track creation: " + createError.toString();
                
                // Use the last available track as fallback
                finalTrackIndex = sequence.audioTracks.numTracks - 1;
                foundAvailableTrack = true;
                result.debug.usingFallbackTrack = finalTrackIndex;
                result.debug.createdNewTrack = false;
            }
        }
        
        // Detailed debug info
        result.debug.placementAttempts = placementAttempts;
        result.debug.finalTrackIndex = finalTrackIndex;
        result.debug.totalTracksNow = sequence.audioTracks.numTracks;
        
        // Ensure we have a valid track index
        if (finalTrackIndex < 0 || finalTrackIndex >= sequence.audioTracks.numTracks) {
            result.error = "Invalid track index: " + finalTrackIndex + " (total tracks: " + sequence.audioTracks.numTracks + ")";
            return JSON.stringify(result);
        }
        
        // Get the target track and place the audio
        var targetTrack = sequence.audioTracks[finalTrackIndex];
        result.debug.targetTrackExists = (targetTrack !== null);
        
        // Use insertClip as requested - it will insert at the playhead position
        try {
            targetTrack.insertClip(importedItem, currentTime);
            result.debug.placementMethod = "insertClip";
            result.debug.placementSuccess = true;
        } catch (insertError) {
            result.error = "Failed to insert clip on track " + finalTrackIndex + ": " + insertError.toString();
            return JSON.stringify(result);
        }
        
        // Success!
        result.success = true;
        result.step = "completed";
        
        // Create smart message based on what happened
        var message = "Audio placed on track " + (finalTrackIndex + 1);
        if (result.debug.createdNewTrack) {
            message += " (new track created)";
        } else if (result.debug.trackCreationFailed || result.debug.usingCatchFallback) {
            message += " (track creation not supported by Premiere API)";
        } else if (finalTrackIndex !== startingTrackIndex) {
            message += " (avoided conflict on track " + (startingTrackIndex + 1) + ")";
        }
        message += " at " + currentTime.seconds + "s";
        
        // Add warning if we had to use fallback strategy
        if (result.debug.trackCreationFailed || result.debug.usingCatchFallback) {
            message += " - WARNING: May overlap existing audio";
        }
        
        result.message = message;
        result.fileName = importedItem.name;
        result.trackIndex = finalTrackIndex;
        result.position = currentTime.seconds;
        
        return JSON.stringify(result);
        
    } catch (error) {
        result.error = "Exception in step '" + result.step + "': " + error.toString();
        return JSON.stringify(result);
    }
}

// Enhanced sequence info function with MVX-style direct in/out point detection
function getSequenceInfo() {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            return JSON.stringify({
                success: false,
                error: "No active sequence"
            });
        }
        
        var sequence = app.project.activeSequence;
        var result = {
            success: true,
            sequenceName: sequence.name,
            audioTrackCount: sequence.audioTracks.numTracks,
            videoTrackCount: sequence.videoTracks.numTracks,
            source: "MVX-style direct access"
        };
        
        // Get playhead position using MVX pattern
        try {
            var playhead = sequence.getPlayerPosition();
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
            // Get in point directly - MVX proven method
            var inPoint = sequence.getInPoint();
            var inPointSeconds = inPoint ? inPoint.seconds : null;
            var hasInPoint = (inPointSeconds !== null && inPointSeconds !== undefined);
            
            result.inPoint = {
                seconds: inPointSeconds,
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
        
        // Direct out point access (MVX pattern)
        try {
            // Get out point directly - MVX proven method
            var outPoint = sequence.getOutPoint();
            var outPointSeconds = outPoint ? outPoint.seconds : null;
            var hasOutPoint = (outPointSeconds !== null && outPointSeconds !== undefined);
            
            result.outPoint = {
                seconds: outPointSeconds,
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
        
        // Calculate duration using MVX logic
        if (result.hasInPoint && result.hasOutPoint && 
            result.inPoint.seconds !== null && result.outPoint.seconds !== null) {
            var duration = result.outPoint.seconds - result.inPoint.seconds;
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
        
        // Debug info for troubleshooting
        result.debug = {
            inPointExists: typeof sequence.getInPoint === 'function',
            outPointExists: typeof sequence.getOutPoint === 'function',
            sequenceEndExists: sequence.end !== undefined,
            timestamp: new Date().toString()
        };
        
        return JSON.stringify(result);
        
    } catch (e) {
        return JSON.stringify({
            success: false,
            error: "Critical error: " + e.toString(),
            source: "MVX-style direct access - failed"
        });
    }
}

// Utility function to format time as HH:MM:SS (copied from timeline-inout.jsx)
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00:00";
    }
    
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = Math.floor(seconds % 60);
    
    // Pad with zeros
    var hoursStr = hours < 10 ? "0" + hours : hours.toString();
    var minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
    var secsStr = secs < 10 ? "0" + secs : secs.toString();
    
    return hoursStr + ":" + minutesStr + ":" + secsStr;
}

// Set in/out points programmatically from current playhead position
function setSequenceInOutPoints() {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            return JSON.stringify({
                success: false,
                error: "No active sequence"
            });
        }
        
        var sequence = app.project.activeSequence;
        var result = {
            success: false,
            sequenceName: sequence.name,
            action: "set_sequence_in_out_points"
        };
        
        // Get current playhead position
        var currentTime = sequence.getPlayerPosition();
        result.currentPlayhead = {
            seconds: currentTime.seconds,
            formatted: formatTime(currentTime.seconds)
        };
        
        // Try to set in point at current playhead
        try {
            if (typeof sequence.setInPoint === 'function') {
                sequence.setInPoint(currentTime);
                result.inPointSet = {
                    success: true,
                    seconds: currentTime.seconds,
                    formatted: formatTime(currentTime.seconds),
                    method: "sequence.setInPoint()"
                };
            } else {
                result.inPointSet = {
                    success: false,
                    error: "sequence.setInPoint() method not available",
                    method: "not available"
                };
            }
        } catch (inError) {
            result.inPointSet = {
                success: false,
                error: inError.toString(),
                method: "sequence.setInPoint() threw error"
            };
        }
        
        // Set out point 10 seconds later
        try {
            if (typeof sequence.setOutPoint === 'function') {
                var sequenceEnd = sequence.end ? sequence.end.seconds : (currentTime.seconds + 10);
                var outPointTime = Math.min(currentTime.seconds + 10, sequenceEnd);
                
                // Create time object for out point
                var outTime;
                if (typeof sequence.createTime === 'function') {
                    outTime = sequence.createTime();
                    outTime.seconds = outPointTime;
                } else {
                    // Fallback: use the current time object structure
                    outTime = {
                        seconds: outPointTime,
                        ticks: Math.floor(outPointTime * sequence.timebase)
                    };
                }
                
                sequence.setOutPoint(outTime);
                result.outPointSet = {
                    success: true,
                    seconds: outPointTime,
                    formatted: formatTime(outPointTime),
                    method: "sequence.setOutPoint()"
                };
            } else {
                result.outPointSet = {
                    success: false,
                    error: "sequence.setOutPoint() method not available",
                    method: "not available"
                };
            }
        } catch (outError) {
            result.outPointSet = {
                success: false,
                error: outError.toString(),
                method: "sequence.setOutPoint() threw error"
            };
        }
        
        // Calculate duration
        if (result.inPointSet.success && result.outPointSet.success) {
            var duration = result.outPointSet.seconds - result.inPointSet.seconds;
            result.duration = {
                seconds: duration,
                formatted: formatTime(duration)
            };
            result.success = true;
            result.message = "Set in point at " + result.inPointSet.formatted + 
                           " and out point at " + result.outPointSet.formatted + 
                           " (duration: " + result.duration.formatted + ")";
        } else {
            result.message = "Failed to set in/out points";
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Exception setting in/out points: " + error.toString()
        });
    }
}

// Clear in/out points
function clearSequenceInOutPoints() {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            return JSON.stringify({
                success: false,
                error: "No active sequence"
            });
        }
        
        var sequence = app.project.activeSequence;
        var result = {
            success: false,
            sequenceName: sequence.name,
            action: "clear_sequence_in_out_points"
        };
        
        // Try to clear in point
        try {
            if (typeof sequence.clearInPoint === 'function') {
                sequence.clearInPoint();
                result.inPointCleared = true;
            } else {
                result.inPointCleared = false;
                result.inPointError = "sequence.clearInPoint() method not available";
            }
        } catch (inError) {
            result.inPointCleared = false;
            result.inPointError = inError.toString();
        }
        
        // Try to clear out point
        try {
            if (typeof sequence.clearOutPoint === 'function') {
                sequence.clearOutPoint();
                result.outPointCleared = true;
            } else {
                result.outPointCleared = false;
                result.outPointError = "sequence.clearOutPoint() method not available";
            }
        } catch (outError) {
            result.outPointCleared = false;
            result.outPointError = outError.toString();
        }
        
        if (result.inPointCleared && result.outPointCleared) {
            result.success = true;
            result.message = "In/out points cleared successfully";
        } else {
            result.message = "Failed to clear some in/out points";
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Exception clearing in/out points: " + error.toString()
        });
    }
}

// Test function to verify track creation positioning
function testTrackCreation() {
    var result = {
        success: false,
        step: "initialization",
        debug: {}
    };
    
    try {
        // Check current state
        result.step = "checking_current_state";
        if (!app || !app.project || !app.project.activeSequence) {
            result.error = "No active sequence";
            return JSON.stringify(result);
        }
        
        var sequence = app.project.activeSequence;
        var initialTrackCount = sequence.audioTracks.numTracks;
        result.debug.initialTrackCount = initialTrackCount;
        
        // Enable QE API
        result.step = "enabling_qe";
        app.enableQE();
        var qeSequence = qe.project.getActiveSequence();
        result.debug.qeEnabled = true;
        
        // Create track at the END using our correct positioning
        result.step = "creating_track_at_end";
        var currentAudioTracks = sequence.audioTracks.numTracks;
        result.debug.targetPosition = currentAudioTracks;
        
        // Add 1 stereo audio track at the END
        qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
        
        // Verify track was created at the end
        result.step = "verifying_track_creation";
        var finalTrackCount = sequence.audioTracks.numTracks;
        result.debug.finalTrackCount = finalTrackCount;
        result.debug.trackCreated = (finalTrackCount > initialTrackCount);
        
        if (finalTrackCount > initialTrackCount) {
            result.success = true;
            result.debug.newTrackIndex = finalTrackCount - 1; // Last track index
            result.debug.expectedPosition = initialTrackCount; // Should be at the end
            result.debug.positionCorrect = (result.debug.newTrackIndex === result.debug.expectedPosition);
            result.message = "Track created successfully at position " + (result.debug.newTrackIndex + 1) + " (should be track " + (result.debug.expectedPosition + 1) + ")";
        } else {
            result.error = "Track creation call succeeded but track count unchanged: " + initialTrackCount + " -> " + finalTrackCount;
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        result.error = "Exception in step '" + result.step + "': " + error.toString();
        return JSON.stringify(result);
    }
}