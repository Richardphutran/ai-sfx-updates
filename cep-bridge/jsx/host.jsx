// Host ExtendScript - Runs inside Premiere Pro
// Safe version to prevent stack overflow

try {
    // Store original writeln function
    var originalWriteln = $.writeln;
    var isLoggingActive = false; // Prevent recursive calls
    
    // Safe console forwarding function
    function safeConsoleForward(msg) {
        if (isLoggingActive) return; // Prevent recursion
        
        try {
            isLoggingActive = true;
            var event = new CSXSEvent();
            event.type = "com.podcastpilot.console.log";
            event.data = JSON.stringify({
                type: 'log',
                message: String(msg),
                timestamp: (new Date()).toString()
            });
            event.dispatch();
        } catch (e) {
            // Silent fail to prevent infinite loops
        } finally {
            isLoggingActive = false;
        }
    }
    
    // Override $.writeln to capture console output safely
    $.writeln = function(msg) {
        // Call original function first
        originalWriteln.call($, msg);
        
        // Forward to bridge (non-blocking)
        safeConsoleForward(msg);
    };
    
    // Basic test function
    function testConnection() {
        try {
            var result = {
                success: true,
                appName: app.name || "Unknown",
                version: app.version || "Unknown",
                projectName: (app.project && app.project.name) ? app.project.name : "No project open",
                timestamp: (new Date()).toString()
            };
            return JSON.stringify(result);
        } catch (e) {
            return JSON.stringify({
                success: false,
                error: String(e),
                timestamp: (new Date()).toString()
            });
        }
    }
    
    // Make functions available globally
    $.global.testConnection = testConnection;
    $.global.podcastPilotLoaded = true;
    
    // Use original writeln to avoid recursion on initial load
    originalWriteln.call($, "✅ Podcast Pilot Bridge ExtendScript loaded successfully");
    
    // Return success indicator
    "ExtendScript loaded successfully";
    
} catch (e) {
    // Return error if anything fails
    "ExtendScript error: " + String(e);
}