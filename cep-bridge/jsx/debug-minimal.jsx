// Minimal Debug ExtendScript for Premiere Pro
// Compatible with ES3 syntax - no modern JavaScript features

// Global debugging namespace
var PodcastPilotDebug = {
    version: "1.0.0",
    loaded: true,
    lastActivity: new Date().toString()
};

// Console forwarding system for CEP bridge
var debugConsole = {
    log: function(message, context) {
        try {
            var timestamp = new Date().toISOString();
            var logData = {
                type: "log",
                message: String(message),
                context: String(context || "general"),
                timestamp: timestamp,
                source: "premiere-extendscript"
            };
            
            // Dispatch to CEP bridge
            var event = new CSXSEvent();
            event.type = "com.podcastpilot.console.log";
            event.data = JSON.stringify(logData);
            event.dispatch();
            
            return true;
        } catch (e) {
            return false;
        }
    },
    
    warn: function(message, context) {
        return debugConsole.log("[WARNING] " + message, context);
    },
    
    error: function(message, context) {
        return debugConsole.log("[ERROR] " + message, context);
    }
};

// Test connection function
function testConnection() {
    try {
        debugConsole.log("🧪 Test connection called from ExtendScript", "test");
        
        var result = {
            success: true,
            appName: app.name || "Premiere Pro",
            version: app.version || "Unknown",
            timestamp: new Date().toISOString(),
            mode: "debug-minimal",
            activeSequence: app.project.activeSequence ? app.project.activeSequence.name : "None"
        };
        
        debugConsole.log("✅ Test connection successful: " + JSON.stringify(result), "test");
        return JSON.stringify(result);
    } catch (e) {
        var errorResult = {
            success: false,
            error: String(e),
            mode: "debug-minimal"
        };
        debugConsole.error("❌ Test connection failed: " + String(e), "test");
        return JSON.stringify(errorResult);
    }
}

// Enhanced button click tracking
function trackButtonClick(buttonName, action) {
    try {
        debugConsole.log("🔘 Button clicked: " + buttonName + " (action: " + action + ")", "user-interaction");
        
        // Capture current Premiere state
        var state = {
            buttonName: buttonName,
            action: action,
            timestamp: new Date().toISOString(),
            projectName: app.project.name || "Untitled",
            activeSequence: app.project.activeSequence ? app.project.activeSequence.name : "None",
            trackCount: app.project.activeSequence ? app.project.activeSequence.videoTracks.numTracks : 0
        };
        
        debugConsole.log("📊 Current state: " + JSON.stringify(state), "user-interaction");
        return state;
    } catch (e) {
        debugConsole.error("Failed to track button click: " + String(e), "user-interaction");
        return null;
    }
}

// Simple timeline analysis
function analyzeTimeline() {
    try {
        debugConsole.log("🎬 Analyzing timeline...", "timeline");
        
        if (!app.project.activeSequence) {
            debugConsole.warn("No active sequence found", "timeline");
            return { error: "No active sequence" };
        }
        
        var seq = app.project.activeSequence;
        var analysis = {
            sequenceName: seq.name,
            videoTracks: seq.videoTracks.numTracks,
            audioTracks: seq.audioTracks.numTracks,
            duration: seq.end.seconds || 0,
            timestamp: new Date().toISOString()
        };
        
        debugConsole.log("📈 Timeline analysis: " + JSON.stringify(analysis), "timeline");
        return analysis;
    } catch (e) {
        debugConsole.error("Timeline analysis failed: " + String(e), "timeline");
        return { error: String(e) };
    }
}

// Multi-cam detection function
function detectMultiCamSetup() {
    try {
        debugConsole.log("📹 Detecting multi-cam setup...", "multicam");
        
        if (!app.project.activeSequence) {
            return { error: "No active sequence" };
        }
        
        var videoTrackCount = app.project.activeSequence.videoTracks.numTracks;
        var audioTrackCount = app.project.activeSequence.audioTracks.numTracks;
        
        var detection = {
            isMultiCam: videoTrackCount > 1,
            videoTracks: videoTrackCount,
            audioTracks: audioTrackCount,
            recommendation: videoTrackCount > 1 ? "Multi-cam detected" : "Single camera setup",
            timestamp: new Date().toISOString()
        };
        
        debugConsole.log("🎥 Multi-cam detection: " + JSON.stringify(detection), "multicam");
        return detection;
    } catch (e) {
        debugConsole.error("Multi-cam detection failed: " + String(e), "multicam");
        return { error: String(e) };
    }
}

// Make functions available globally
$.global.testConnection = testConnection;
$.global.trackButtonClick = trackButtonClick;
$.global.analyzeTimeline = analyzeTimeline;
$.global.detectMultiCamSetup = detectMultiCamSetup;
$.global.debugConsole = debugConsole;
$.global.PodcastPilotDebug = PodcastPilotDebug;

// Initialize
debugConsole.log("🚀 Podcast Pilot Debug ExtendScript loaded successfully", "init");
debugConsole.log("Available functions: testConnection, trackButtonClick, analyzeTimeline, detectMultiCamSetup", "init");