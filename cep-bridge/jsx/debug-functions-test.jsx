// Debug Functions Test - Comprehensive ExtendScript testing for all plugins
// This script provides test functions for debugging multiple plugin functionality

// Test suite for ai-podcast plugin
var AIPodcastTests = {
    testConnection: function() {
        try {
            var result = {
                success: true,
                plugin: "ai-podcast",
                appName: app.name || "Unknown",
                version: app.version || "Unknown",
                projectName: app.project.name || "Untitled",
                activeSequence: app.project.activeSequence ? app.project.activeSequence.name : "None",
                timestamp: new Date().toISOString()
            };
            
            // Send to debug console
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("🔌 AI Podcast connection test successful: " + JSON.stringify(result), "ai-podcast-test");
            }
            
            return JSON.stringify(result);
        } catch (e) {
            var errorResult = {
                success: false,
                plugin: "ai-podcast", 
                error: String(e),
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.error("❌ AI Podcast connection test failed: " + String(e), "ai-podcast-test");
            }
            
            return JSON.stringify(errorResult);
        }
    },
    
    analyzeTimeline: function() {
        try {
            if (!app.project.activeSequence) {
                var noSeqResult = {
                    success: false,
                    plugin: "ai-podcast",
                    error: "No active sequence found",
                    suggestion: "Please create or open a sequence",
                    timestamp: new Date().toISOString()
                };
                
                if (typeof debugConsole !== 'undefined') {
                    debugConsole.warn("⚠️ Timeline analysis: No active sequence", "ai-podcast-timeline");
                }
                
                return JSON.stringify(noSeqResult);
            }
            
            var seq = app.project.activeSequence;
            var analysis = {
                success: true,
                plugin: "ai-podcast",
                sequenceName: seq.name,
                videoTracks: seq.videoTracks.numTracks,
                audioTracks: seq.audioTracks.numTracks,
                duration: seq.end ? seq.end.seconds : 0,
                frameRate: seq.framerate || "Unknown",
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("🎬 Timeline analysis completed: " + JSON.stringify(analysis), "ai-podcast-timeline");
            }
            
            return JSON.stringify(analysis);
        } catch (e) {
            var errorResult = {
                success: false,
                plugin: "ai-podcast",
                error: String(e),
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.error("❌ Timeline analysis failed: " + String(e), "ai-podcast-timeline");
            }
            
            return JSON.stringify(errorResult);
        }
    },
    
    detectMultiCamSetup: function() {
        try {
            if (!app.project.activeSequence) {
                var noSeqResult = {
                    success: false,
                    plugin: "ai-podcast",
                    error: "No active sequence for multi-cam detection",
                    timestamp: new Date().toISOString()
                };
                
                if (typeof debugConsole !== 'undefined') {
                    debugConsole.warn("⚠️ Multi-cam detection: No active sequence", "ai-podcast-multicam");
                }
                
                return JSON.stringify(noSeqResult);
            }
            
            var seq = app.project.activeSequence;
            var videoTrackCount = seq.videoTracks.numTracks;
            var audioTrackCount = seq.audioTracks.numTracks;
            
            // Analyze track contents for multi-cam indicators
            var trackAnalysis = [];
            for (var i = 0; i < Math.min(videoTrackCount, 4); i++) {
                try {
                    var track = seq.videoTracks[i];
                    var clipCount = track.clips ? track.clips.numItems : 0;
                    trackAnalysis.push({
                        trackIndex: i,
                        clipCount: clipCount,
                        enabled: track.isTargeted || true
                    });
                } catch (trackError) {
                    trackAnalysis.push({
                        trackIndex: i,
                        error: "Could not analyze track",
                        clipCount: 0
                    });
                }
            }
            
            var detection = {
                success: true,
                plugin: "ai-podcast",
                isMultiCam: videoTrackCount > 1,
                videoTracks: videoTrackCount,
                audioTracks: audioTrackCount,
                trackAnalysis: trackAnalysis,
                recommendation: videoTrackCount > 1 ? "Multi-camera setup detected" : "Single camera setup",
                confidence: videoTrackCount > 1 ? "High" : "Low",
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("📹 Multi-cam detection completed: " + JSON.stringify(detection), "ai-podcast-multicam");
            }
            
            return JSON.stringify(detection);
        } catch (e) {
            var errorResult = {
                success: false,
                plugin: "ai-podcast",
                error: String(e),
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.error("❌ Multi-cam detection failed: " + String(e), "ai-podcast-multicam");
            }
            
            return JSON.stringify(errorResult);
        }
    },
    
    trackButtonClick: function(buttonName, action) {
        try {
            var clickData = {
                success: true,
                plugin: "ai-podcast",
                buttonName: buttonName,
                action: action,
                timestamp: new Date().toISOString(),
                userAgent: "CEP-Bridge",
                sessionInfo: {
                    projectName: app.project.name || "Untitled",
                    activeSequence: app.project.activeSequence ? app.project.activeSequence.name : "None"
                }
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("🔘 Button clicked: " + buttonName + " (action: " + action + ")", "ai-podcast-interaction");
                debugConsole.log("📊 Click data: " + JSON.stringify(clickData), "ai-podcast-interaction");
            }
            
            return JSON.stringify(clickData);
        } catch (e) {
            var errorResult = {
                success: false,
                plugin: "ai-podcast",
                error: String(e),
                buttonName: buttonName,
                action: action,
                timestamp: new Date().toISOString()
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.error("❌ Button click tracking failed: " + String(e), "ai-podcast-interaction");
            }
            
            return JSON.stringify(errorResult);
        }
    }
};

// Test suite for ai-text-editor plugin  
var AITextEditorTests = {
    testConnection: function() {
        try {
            var result = {
                success: true,
                plugin: "ai-text-editor",
                appName: app.name || "Unknown",
                version: app.version || "Unknown",
                timestamp: new Date().toISOString(),
                capabilities: ["text-analysis", "caption-generation", "subtitle-sync"]
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("📝 AI Text Editor connection test successful", "ai-text-editor-test");
            }
            
            return JSON.stringify(result);
        } catch (e) {
            return JSON.stringify({ success: false, plugin: "ai-text-editor", error: String(e) });
        }
    }
};

// Test suite for ai-video-namer plugin
var AIVideoNamerTests = {
    testConnection: function() {
        try {
            var result = {
                success: true,
                plugin: "ai-video-namer",
                appName: app.name || "Unknown", 
                version: app.version || "Unknown",
                timestamp: new Date().toISOString(),
                capabilities: ["auto-naming", "file-organization", "metadata-analysis"]
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("🏷️ AI Video Namer connection test successful", "ai-video-namer-test");
            }
            
            return JSON.stringify(result);
        } catch (e) {
            return JSON.stringify({ success: false, plugin: "ai-video-namer", error: String(e) });
        }
    }
};

// Test suite for ai-sfx plugin
var AISFXTests = {
    testConnection: function() {
        try {
            var result = {
                success: true,
                plugin: "ai-sfx",
                appName: app.name || "Unknown",
                version: app.version || "Unknown", 
                timestamp: new Date().toISOString(),
                capabilities: ["sound-generation", "audio-enhancement", "effect-automation"]
            };
            
            if (typeof debugConsole !== 'undefined') {
                debugConsole.log("🔊 AI SFX connection test successful", "ai-sfx-test");
            }
            
            return JSON.stringify(result);
        } catch (e) {
            return JSON.stringify({ success: false, plugin: "ai-sfx", error: String(e) });
        }
    }
};

// Make all test functions available globally
$.global.AIPodcastTests = AIPodcastTests;
$.global.AITextEditorTests = AITextEditorTests; 
$.global.AIVideoNamerTests = AIVideoNamerTests;
$.global.AISFXTests = AISFXTests;

// Backward compatibility - make individual functions available
$.global.testConnection = AIPodcastTests.testConnection;
$.global.analyzeTimeline = AIPodcastTests.analyzeTimeline;
$.global.detectMultiCamSetup = AIPodcastTests.detectMultiCamSetup;
$.global.trackButtonClick = AIPodcastTests.trackButtonClick;

// Multi-plugin test dispatcher
$.global.testPluginFunction = function(pluginName, functionName) {
    try {
        switch(pluginName) {
            case "ai-podcast":
                if (AIPodcastTests[functionName]) {
                    return AIPodcastTests[functionName]();
                }
                break;
            case "ai-text-editor":
                if (AITextEditorTests[functionName]) {
                    return AITextEditorTests[functionName]();
                }
                break;
            case "ai-video-namer":
                if (AIVideoNamerTests[functionName]) {
                    return AIVideoNamerTests[functionName]();
                }
                break;
            case "ai-sfx":
                if (AISFXTests[functionName]) {
                    return AISFXTests[functionName]();
                }
                break;
        }
        
        return JSON.stringify({
            success: false,
            error: "Plugin or function not found",
            plugin: pluginName,
            function: functionName
        });
    } catch (e) {
        return JSON.stringify({
            success: false, 
            error: String(e),
            plugin: pluginName,
            function: functionName
        });
    }
};

// Initialize debug console if available
if (typeof debugConsole !== 'undefined') {
    debugConsole.log("🚀 Multi-plugin debug functions loaded successfully", "system");
    debugConsole.log("Available plugins: ai-podcast, ai-text-editor, ai-video-namer, ai-sfx", "system");
} else {
    // Fallback console if debugConsole not available
    console.log("🚀 Multi-plugin debug functions loaded (no debug console available)");
}