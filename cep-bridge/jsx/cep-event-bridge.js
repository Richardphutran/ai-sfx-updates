// CSInterface Event-Based Bridge (Fallback for WebSocket failures)
(function() {
    'use strict';
    
    let csInterface = null;
    let isInitialized = false;
    let logEntries = [];
    
    // Initialize CSInterface
    try {
        csInterface = new CSInterface();
        log('✅ CSInterface Event Bridge initialized');
        isInitialized = true;
    } catch (e) {
        console.error('❌ Failed to initialize CSInterface Event Bridge:', e);
        return;
    }
    
    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        
        logEntries.push({
            time: timestamp,
            message: message
        });
        
        // Send to ExtendScript for file-based communication
        sendToExtendScript('console', {
            type: 'cep-console',
            level: 'log',
            message: message,
            timestamp: new Date().toISOString(),
            source: 'cep-event-bridge'
        });
    }
    
    // Send data to ExtendScript which can write to files or send HTTP requests
    function sendToExtendScript(action, payload) {
        if (!isInitialized) return;
        
        const message = {
            action: action,
            payload: payload,
            id: 'event-' + Date.now(),
            timestamp: Date.now()
        };
        
        // Use CSInterface events to send data
        csInterface.evalScript(`
            try {
                // Write to debugging file
                var debugFile = new File(Folder.desktop + "/premiere-debug.jsonl");
                debugFile.open("a");
                debugFile.writeln(JSON.stringify(${JSON.stringify(message)}));
                debugFile.close();
                
                "Event logged to file successfully";
            } catch (e) {
                "Event logging failed: " + e.toString();
            }
        `, function(result) {
            if (result.indexOf('failed') !== -1) {
                console.warn('File logging failed:', result);
            }
        });
        
        // Also try HTTP fallback
        csInterface.evalScript(`
            try {
                // Create HTTP request to bridge server
                var request = new Socket();
                if (request.open("localhost:8090", "binary")) {
                    var httpData = "POST /cep-fallback HTTP/1.1\\r\\n";
                    httpData += "Host: localhost:8090\\r\\n";
                    httpData += "Content-Type: application/json\\r\\n";
                    httpData += "Content-Length: " + ${JSON.stringify(message)}.length + "\\r\\n\\r\\n";
                    httpData += ${JSON.stringify(JSON.stringify(message))};
                    
                    request.write(httpData);
                    request.close();
                    "HTTP fallback sent";
                } else {
                    "HTTP fallback failed - socket not opened";
                }
            } catch (e) {
                "HTTP fallback error: " + e.toString();
            }
        `, function(result) {
            console.log('HTTP fallback result:', result);
        });
    }
    
    // Register with bridge server using file-based communication
    function registerViaBridge() {
        log('🔗 Registering via CSInterface event bridge...');
        
        sendToExtendScript('register', {
            type: 'cep',
            plugin: 'ai-podcast',
            source: 'premiere-event-bridge',
            capabilities: ['console', 'file-based', 'http-fallback'],
            mode: 'event-bridge',
            timestamp: new Date().toISOString()
        });
        
        log('✅ Registration sent via event bridge');
    }
    
    // Enhanced button click forwarding
    window.testButtonClickEventBridge = function(buttonName) {
        log(`🔘 [EVENT BRIDGE] ${buttonName} button clicked`);
        
        // Send via event bridge
        sendToExtendScript('console', {
            type: 'button-click',
            button: buttonName,
            message: `Button ${buttonName} clicked via event bridge`,
            timestamp: new Date().toISOString(),
            source: 'cep-event-bridge'
        });
        
        // Also call ExtendScript function if available
        const scriptCall = `
            try {
                if (typeof testConnection === "function") {
                    var result = testConnection();
                    "Event bridge test result: " + result;
                } else {
                    "${buttonName} test completed via event bridge - function not found but event sent";
                }
            } catch (e) {
                "${buttonName} test failed via event bridge: " + e.toString();
            }
        `;
        
        csInterface.evalScript(scriptCall, function(result) {
            log(`📥 [EVENT BRIDGE] ${buttonName} result: ${result}`);
            
            // Forward result via event bridge
            sendToExtendScript('console', {
                type: 'script-result',
                button: buttonName,
                result: result,
                message: `ExtendScript result for ${buttonName}: ${result}`,
                timestamp: new Date().toISOString(),
                source: 'cep-event-bridge'
            });
        });
    };
    
    // Auto-register on load
    if (isInitialized) {
        setTimeout(registerViaBridge, 1000);
        
        // Set up periodic heartbeat via file
        setInterval(function() {
            sendToExtendScript('heartbeat', {
                type: 'heartbeat',
                message: 'CEP Event Bridge heartbeat',
                timestamp: new Date().toISOString(),
                logEntries: logEntries.length
            });
        }, 30000); // Every 30 seconds
    }
    
    // Expose for debugging
    window.eventBridge = {
        sendToExtendScript: sendToExtendScript,
        registerViaBridge: registerViaBridge,
        log: log,
        logEntries: logEntries,
        isInitialized: isInitialized
    };
    
    log('🌉 CSInterface Event Bridge ready');
})();