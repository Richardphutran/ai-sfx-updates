// Enhanced CEP Bridge with Hot Reload and Persistent Console
(function() {
    'use strict';
    
    // Load shared debug logger first
    try {
        var debugScript = document.createElement('script');
        debugScript.src = 'jsx/debug-logger.js';
        debugScript.onload = function() {
            if (window.initDebugLogger) {
                window.debugLogger = window.initDebugLogger('ai-sfx');
                console.log('[BRIDGE] Debug logger loaded successfully');
            }
        };
        debugScript.onerror = function() {
            console.error('[BRIDGE] Failed to load debug logger');
        };
        document.head.appendChild(debugScript);
    } catch (e) {
        console.error('[BRIDGE] Error loading debug logger:', e.message);
    }
    
    const WEBSOCKET_URLS = [
        'ws://localhost:8090',
        'ws://127.0.0.1:8090'
    ];
    let currentUrlIndex = 0;
    const STORAGE_KEY = 'aiSfxBridgeConsole';
    const MAX_LOG_ENTRIES = 500;
    
    let ws = null;
    let reconnectInterval = null;
    let csInterface = null;
    let logEntries = [];
    let reconnectAttempts = 0;
    let isExtendScriptLoaded = false;
    let connectionQuality = { latency: 0, successRate: 100, lastPing: 0 };
    
    // Enhanced diagnostic system
    let diagnostics = {
        connectionAttempts: 0,
        successfulConnections: 0,
        extendScriptAttempts: 0,
        extendScriptSuccesses: 0,
        lastError: null,
        startTime: Date.now(),
        premiereVersion: null,
        cepVersion: null,
        systemInfo: {}
    };
    
    // Comprehensive system diagnostics
    function runDiagnostics() {
        log('🔍 Running comprehensive system diagnostics...');
        
        try {
            // CEP version info
            diagnostics.cepVersion = csInterface.getCurrentApiVersion();
            log('CEP API Version: ' + diagnostics.cepVersion);
            
            // Host application info
            var hostEnv = csInterface.getHostEnvironment();
            if (hostEnv) {
                diagnostics.premiereVersion = hostEnv.appVersion;
                log('Premiere Version: ' + hostEnv.appVersion);
                log('Locale: ' + hostEnv.appLocale);
            }
            
            // Extension path validation
            var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
            log('Extension Path: ' + extensionPath);
            
            // Check file existence
            csInterface.evalScript('new File("' + extensionPath + '/jsx/host.jsx").exists', function(exists) {
                log('host.jsx exists: ' + exists);
                if (exists !== 'true') {
                    log('❌ CRITICAL: host.jsx file not found!');
                }
            });
            
            // Memory and environment check
            csInterface.evalScript(`
                try {
                    JSON.stringify({
                        memory: $.memUsage || "unknown",
                        build: $.build || "unknown",
                        locale: $.locale || "unknown",
                        stack: Error().stack ? "available" : "unavailable"
                    });
                } catch(e) {
                    "Environment check failed: " + e.toString();
                }
            `, function(envInfo) {
                log('Environment info: ' + envInfo);
            });
            
        } catch (e) {
            log('Diagnostics error: ' + e.message);
        }
    }
    
    // Initialize CSInterface with diagnostics
    try {
        csInterface = new CSInterface();
        log('✅ CSInterface initialized successfully');
        runDiagnostics();
    } catch (e) {
        console.error('❌ CRITICAL: Failed to initialize CSInterface:', e);
        log('❌ CRITICAL: CSInterface initialization failed - ' + e.message);
        return;
    }
    
    // Smart error detection and recovery
    function detectAndRecoverFromError(error, context) {
        diagnostics.lastError = {
            error: error,
            context: context,
            timestamp: Date.now()
        };
        
        log('🚨 Error detected in ' + context + ': ' + error);
        
        // Analyze error patterns and apply fixes
        if (error.indexOf('Stack overrun') !== -1) {
            log('🔧 Stack overrun detected - switching to ultra-minimal ExtendScript');
            return loadUltraMinimalExtendScript();
        }
        
        if (error.indexOf('InternalError') !== -1) {
            log('🔧 Internal error detected - attempting system reset');
            return performSystemReset();
        }
        
        if (error.indexOf('File not found') !== -1) {
            log('🔧 File not found - creating alternative ExtendScript');
            return createAlternativeExtendScript();
        }
        
        if (error.indexOf('WebSocket') !== -1) {
            log('🔧 WebSocket error - checking connection health');
            return performConnectionHealthCheck();
        }
        
        return false; // No specific recovery action
    }
    
    // Ultra-minimal ExtendScript that should never fail
    function loadUltraMinimalExtendScript() {
        log('Loading ultra-minimal ExtendScript (emergency mode)...');
        
        csInterface.evalScript(`
            // Absolute minimal test - just return success
            "MINIMAL_SUCCESS"
        `, function(result) {
            if (result === 'MINIMAL_SUCCESS') {
                log('✅ Ultra-minimal ExtendScript working');
                
                // Now try to add basic function
                csInterface.evalScript(`
                    function testConnection() { return "{\\"success\\":true,\\"mode\\":\\"minimal\\"}"; }
                    $.global.testConnection = testConnection;
                    "FUNCTION_ADDED"
                `, function(result2) {
                    if (result2 === 'FUNCTION_ADDED') {
                        log('✅ Basic function added successfully');
                        finalizeBridgeSetup();
                    } else {
                        log('⚠️ Function addition failed, registering in emergency mode');
                        registerInEmergencyMode();
                    }
                });
            } else {
                log('❌ Even ultra-minimal ExtendScript failed: ' + result);
                registerInEmergencyMode();
            }
        });
    }
    
    // System reset for critical errors
    function performSystemReset() {
        log('🔄 Performing system reset...');
        
        // Reset all state
        isExtendScriptLoaded = false;
        reconnectAttempts = 0;
        
        // Close and recreate WebSocket
        if (ws) {
            ws.close();
            ws = null;
        }
        
        // Wait a bit then try to reconnect
        setTimeout(function() {
            log('🔄 System reset complete, attempting reconnection...');
            connect();
        }, 2000);
    }
    
    // Emergency registration mode (no ExtendScript)
    function registerInEmergencyMode() {
        log('🚨 Registering in EMERGENCY MODE (no ExtendScript capabilities)');
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            const registrationMessage = {
                id: 'register-emergency-' + Date.now(),
                action: 'register',
                plugin: 'ai-sfx',
                payload: {
                    type: 'cep',
                    plugin: 'ai-sfx',
                    source: 'premiere-bridge',
                    capabilities: ['console-only'], // Very limited
                    mode: 'emergency',
                    diagnostics: diagnostics
                }
            };
            ws.send(JSON.stringify(registrationMessage));
            log('⚠️ Emergency registration sent - limited functionality');
        }
    }
    
    // Connection health check
    function performConnectionHealthCheck() {
        log('🔍 Performing connection health check...');
        
        // Test basic WebSocket communication
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify({
                    id: 'health-check-' + Date.now(),
                    action: 'ping',
                    payload: Date.now()
                }));
                log('✅ WebSocket health check sent');
            } catch (e) {
                log('❌ WebSocket health check failed: ' + e.message);
                detectAndRecoverFromError(e.message, 'connection-health-check');
            }
        }
        
        // Test CSInterface communication
        try {
            csInterface.evalScript('1+1', function(result) {
                if (result === '2') {
                    log('✅ CSInterface health check passed');
                } else {
                    log('⚠️ CSInterface health check unexpected result: ' + result);
                }
            });
        } catch (e) {
            log('❌ CSInterface health check failed: ' + e.message);
            detectAndRecoverFromError(e.message, 'csinterface-health-check');
        }
    }
    
    // Enhanced ExtendScript loading with recovery
    function loadExtendScriptWithRecovery() {
        diagnostics.extendScriptAttempts++;
        
        const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        log('🔍 Extension path: ' + extensionPath);
        
        // Strategy 1: Try original host.jsx
        const hostPath = extensionPath + '/jsx/host.jsx';
        log('📁 Attempting to load: ' + hostPath);
        
        csInterface.evalScript(`
            try {
                $.evalFile("${hostPath}");
                "ExtendScript loaded successfully";
            } catch (e) {
                "ExtendScript error: " + e.toString();
            }
        `, function(result) {
            log('📋 Primary load result: ' + result);
            
            if (result.indexOf('error') !== -1 || result.indexOf('overrun') !== -1) {
                // Try recovery
                if (detectAndRecoverFromError(result, 'extendscript-primary-load')) {
                    return; // Recovery function will handle it
                }
                
                // If no specific recovery, try fallback strategies
                tryFallbackStrategies();
            } else {
                log('✅ Primary ExtendScript load successful');
                diagnostics.extendScriptSuccesses++;
                finalizeBridgeSetup();
            }
        });
    }
    
    // Fallback strategies for ExtendScript loading
    function tryFallbackStrategies() {
        log('🔄 Trying fallback ExtendScript strategies...');
        
        // Strategy 2: Minimal inline ExtendScript
        log('📝 Strategy 2: Minimal inline ExtendScript');
        csInterface.evalScript(`
            try {
                // Minimal test function without file loading
                function testConnection() {
                    try {
                        return JSON.stringify({
                            success: true,
                            appName: app.name || "Premiere Pro",
                            version: app.version || "Unknown",
                            timestamp: new Date().toISOString(),
                            mode: "minimal-inline"
                        });
                    } catch (e) {
                        return JSON.stringify({
                            success: false,
                            error: String(e),
                            mode: "minimal-inline"
                        });
                    }
                }
                
                // Make available globally
                $.global.testConnection = testConnection;
                $.global.aiSfxLoaded = true;
                
                "Minimal inline ExtendScript loaded successfully";
            } catch (e) {
                "Minimal inline error: " + e.toString();
            }
        `, function(result2) {
            log('📋 Minimal inline result: ' + result2);
            
            if (result2.indexOf('error') === -1) {
                log('✅ Minimal inline ExtendScript successful');
                diagnostics.extendScriptSuccesses++;
                finalizeBridgeSetup();
            } else {
                // Strategy 3: Ultra-minimal (handled by error recovery)
                detectAndRecoverFromError(result2, 'extendscript-minimal-inline');
            }
        });
    }
    
    // Load persisted console logs
    function loadPersistedLogs() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                logEntries = JSON.parse(stored);
                renderLogs();
            }
        } catch (e) {
            console.error('Failed to load persisted logs:', e);
        }
    }
    
    // Save logs to localStorage
    function persistLogs() {
        try {
            // Keep only recent entries
            if (logEntries.length > MAX_LOG_ENTRIES) {
                logEntries = logEntries.slice(-MAX_LOG_ENTRIES);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries));
        } catch (e) {
            console.error('Failed to persist logs:', e);
        }
    }
    
    // Render all logs
    function renderLogs() {
        const logEl = document.getElementById('log');
        if (!logEl) return;
        
        logEl.innerHTML = logEntries.map(entry => 
            `<div class="log-entry">
                <span class="log-time">${entry.time}</span>
                <span class="${entry.isPremiere ? 'log-premiere' : ''}">${entry.message}</span>
            </div>`
        ).join('');
        
        logEl.scrollTop = logEl.scrollHeight;
    }
    
    // Enhanced UI helpers with diagnostics
    function updateStatus(connected) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.className = connected ? 'connected' : 'disconnected';
            
            let statusText = connected ? 'Connected to Electron' : 'Disconnected';
            
            // Add diagnostics info
            if (connected) {
                const uptime = Math.round((Date.now() - diagnostics.startTime) / 1000);
                const successRate = diagnostics.connectionAttempts > 0 ? 
                    Math.round((diagnostics.successfulConnections / diagnostics.connectionAttempts) * 100) : 0;
                
                statusText += ` (${uptime}s uptime, ${successRate}% success)`;
                
                if (isExtendScriptLoaded) {
                    statusText += ' [ExtendScript ✓]';
                } else {
                    statusText += ' [ExtendScript ⚠]';
                }
            }
            
            statusEl.textContent = statusText;
        }
        
        // Update diagnostics display
        updateDiagnosticsDisplay();
    }
    
    // Simplified diagnostics display
    function updateDiagnosticsDisplay() {
        // Only show diagnostics if there are issues or in debug mode
        let diagEl = document.getElementById('diagnostics');
        
        // Show minimal info only when needed
        if (diagnostics.lastError || window.location.hash === '#debug') {
            if (!diagEl) {
                diagEl = document.createElement('div');
                diagEl.id = 'diagnostics';
                diagEl.style.cssText = 'margin: 10px 0; padding: 8px; background: #1a1a1a; border-radius: 4px; font-size: 10px; color: #666;';
                document.body.insertBefore(diagEl, document.getElementById('log'));
            }
            
            let info = '';
            if (diagnostics.lastError) {
                const errorAge = Math.round((Date.now() - diagnostics.lastError.timestamp) / 1000);
                info = `⚠️ Last issue: ${diagnostics.lastError.context} (${errorAge}s ago)`;
            }
            
            if (window.location.hash === '#debug') {
                info += ` | Uptime: ${Math.round((Date.now() - diagnostics.startTime) / 1000)}s`;
                if (connectionQuality.latency > 0) {
                    info += ` | ${connectionQuality.latency}ms`;
                }
            }
            
            diagEl.innerHTML = info;
        } else if (diagEl) {
            // Remove diagnostics if no issues
            diagEl.remove();
        }
    }
    
    function log(message, isPremiere = false) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Only log important messages to reduce noise
        if (message.includes('Connected') || 
            message.includes('Disconnected') ||
            message.includes('WebSocket') ||
            message.includes('error') ||
            message.includes('failed') ||
            message.includes('✅') ||
            message.includes('❌') ||
            message.includes('[CEP BRIDGE]') ||
            message.includes('Bridge fully ready')) {
            
            // Add to entries
            logEntries.push({
                time: timestamp,
                message: message,
                isPremiere: isPremiere
            });
            
            // Persist and render
            persistLogs();
            renderLogs();
            
            console.log(message);
        }
    }
    
    // Smart reconnection with exponential backoff
    function startSmartReconnection() {
        reconnectAttempts++;
        
        // Calculate delay: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
        
        log(`Reconnection attempt ${reconnectAttempts} in ${delay/1000}s`);
        
        reconnectInterval = setTimeout(() => {
            reconnectInterval = null;
            connect();
        }, delay);
    }
    
    // WebSocket connection management with URL fallback
    function connect() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            return;
        }
        
        const currentUrl = WEBSOCKET_URLS[currentUrlIndex];
        log('🔌 Attempting WebSocket connection to: ' + currentUrl + ' (attempt ' + (currentUrlIndex + 1) + '/' + WEBSOCKET_URLS.length + ')');
        
        try {
            ws = new WebSocket(currentUrl);
            
            ws.onopen = function() {
                diagnostics.connectionAttempts++;
                diagnostics.successfulConnections++;
                
                log('✅ Connected to Electron app (attempt ' + diagnostics.connectionAttempts + ')');
                log('🔗 WebSocket readyState: ' + ws.readyState + ' (1=OPEN)');
                updateStatus(true);
                
                // Clear reconnect interval and reset attempts on successful connection
                if (reconnectInterval) {
                    clearTimeout(reconnectInterval);
                    reconnectInterval = null;
                }
                reconnectAttempts = 0;
                
                // Connection health check before proceeding
                performConnectionHealthCheck();
                
                // Load ExtendScript with enhanced error handling
                log('Connection established, loading ExtendScript with error detection...');
                loadExtendScriptWithRecovery();
            };
            
            ws.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (e) {
                    log('Error parsing message: ' + e.message);
                }
            };
            
            ws.onclose = function() {
                log('Disconnected from Electron app');
                updateStatus(false);
                ws = null;
                isExtendScriptLoaded = false; // Reset ExtendScript state
                
                // Start smart reconnection with exponential backoff
                if (!reconnectInterval) {
                    startSmartReconnection();
                }
            };
            
            ws.onerror = function(error) {
                const currentUrl = WEBSOCKET_URLS[currentUrlIndex];
                diagnostics.lastError = {
                    error: 'WebSocket error: ' + (error.message || error.toString()),
                    context: 'websocket-connection',
                    timestamp: Date.now(),
                    url: currentUrl
                };
                log('❌ WebSocket error: ' + (error.message || error.toString()));
                log('🔍 Error type: ' + error.type);
                log('🔍 Failed URL: ' + currentUrl);
                log('🔍 WebSocket readyState: ' + (ws ? ws.readyState : 'null'));
                
                // Try next URL if available
                tryNextUrl();
            };
            
        } catch (e) {
            const currentUrl = WEBSOCKET_URLS[currentUrlIndex];
            diagnostics.lastError = {
                error: 'Connection attempt failed: ' + e.message,
                context: 'websocket-creation',
                timestamp: Date.now(),
                url: currentUrl
            };
            log('❌ Failed to create WebSocket connection: ' + e.message);
            log('🔍 Exception type: ' + e.name);
            log('🔍 Failed URL: ' + currentUrl);
            
            // Try next URL if available
            tryNextUrl();
        }
    }
    
    // Try next WebSocket URL
    function tryNextUrl() {
        currentUrlIndex++;
        if (currentUrlIndex < WEBSOCKET_URLS.length) {
            log('🔄 Trying next URL...');
            setTimeout(connect, 1000); // Wait 1 second before trying next URL
        } else {
            log('❌ All WebSocket URLs failed');
            currentUrlIndex = 0; // Reset for next reconnection attempt
            
            // Start smart reconnection with exponential backoff
            if (!reconnectInterval) {
                startSmartReconnection();
            }
        }
    }
    
    // Handle messages from Electron
    function handleMessage(message) {
        switch (message.action) {
            case 'evalScript':
                log('Executing script: ' + message.payload.substring(0, 50) + '...');
                
                // Execute in Premiere
                csInterface.evalScript(message.payload, function(result) {
                    // Send response back to Electron
                    const response = {
                        id: message.id,
                        plugin: message.plugin || 'ai-sfx', // Ensure plugin field is included
                        action: 'response',
                        payload: result === undefined ? 'undefined' : result
                    };
                    
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(response));
                        log('✅ Script result sent back: ' + (result ? result.substring(0, 100) + '...' : 'undefined'));
                    }
                });
                break;
                
            case 'ping':
                // Respond to ping immediately with pong
                connectionQuality.lastPing = Date.now();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        id: message.id,
                        action: 'pong',
                        payload: message.payload
                    }));
                }
                break;
                
            case 'pong':
                // Calculate latency from our ping
                if (message.payload) {
                    const latency = Date.now() - Number(message.payload);
                    connectionQuality.latency = latency;
                    log(`Connection latency: ${latency}ms`);
                }
                break;
                
            default:
                log('Unknown message action: ' + message.action);
        }
    }
    
    // Simplified console forwarding function
    function forwardToElectron(level, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    id: `console-${level}-${Date.now()}`,
                    plugin: 'ai-sfx',
                    action: 'console',
                    payload: {
                        type: 'cep-console',
                        level: level,
                        message: message,
                        timestamp: new Date().toISOString(),
                        source: 'cep-bridge'
                    }
                }));
            }
        } catch (e) {
            // Silently fail to avoid console loops
        }
    }
    
    // Enhanced console capture with safeguards
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.log = function(...args) {
        const message = args.join(' ');
        originalConsoleLog.apply(console, args);
        
        // Forward ALL console messages to electron debugger
        forwardToElectron('log', message);
    };
    
    console.warn = function(...args) {
        const message = args.join(' ');
        originalConsoleWarn.apply(console, args);
        forwardToElectron('warn', message);
    };
    
    console.error = function(...args) {
        const message = args.join(' ');
        originalConsoleError.apply(console, args);
        forwardToElectron('error', message);
    };
    
    // Listen for console events from ExtendScript
    csInterface.addEventListener("com.aiSfx.console.log", function(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Forward to Electron
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    id: 'console-' + Date.now(),
                    plugin: 'ai-sfx',
                    action: 'console',
                    payload: {
                        ...data,
                        source: 'extendscript-event'
                    }
                }));
            }
            
            // Also log locally
            log('[Premiere Console] ' + data.message);
        } catch (e) {
            log('Error handling console event: ' + e.message);
        }
    });
    
    // Listen for state sync events
    csInterface.addEventListener("com.aiSfx.state.sync", function(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Forward state changes to Electron
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    id: 'state-' + Date.now(),
                    action: 'stateSync',
                    payload: data
                }));
            }
            
            log('[State Sync] ' + data.key + ' updated');
        } catch (e) {
            log('Error handling state sync event: ' + e.message);
        }
    });
    
    // SIMPLIFIED ExtendScript loading - NO FILE LOADING
    function loadExtendScript() {
        log('🔧 Loading SIMPLIFIED ExtendScript (no files)...');
        
        // Skip file loading entirely - use inline minimal functions
        csInterface.evalScript(`
            try {
                // ULTRA-MINIMAL functions to prevent stack overrun
                function testConnection() {
                    try {
                        return JSON.stringify({
                            success: true,
                            appName: app.name || "Premiere Pro",
                            version: app.version || "Unknown",
                            timestamp: new Date().toISOString(),
                            mode: "simplified"
                        });
                    } catch (e) {
                        return JSON.stringify({
                            success: false,
                            error: String(e),
                            mode: "simplified"
                        });
                    }
                }
                
                function testMultiCamDetection() {
                    try {
                        var project = app.project;
                        var timeline = project.activeSequence;
                        var videoTracks = timeline ? timeline.videoTracks.numTracks : 0;
                        
                        return JSON.stringify({
                            success: true,
                            tracks: videoTracks,
                            message: "Multicam detection completed",
                            mode: "simplified"
                        });
                    } catch (e) {
                        return JSON.stringify({
                            success: false,
                            error: String(e),
                            mode: "simplified"
                        });
                    }
                }
                
                // Make functions available globally
                $.global.testConnection = testConnection;
                $.global.testMultiCamDetection = testMultiCamDetection;
                $.global.aiSfxLoaded = true;
                
                "Simplified ExtendScript loaded successfully - no file loading";
            } catch (e) {
                "Simplified load error: " + e.toString();
            }
        `, function(result) {
            log('🔧 Simplified load result: ' + result);
            if (result.indexOf('error') === -1) {
                log('✅ Simplified ExtendScript mode active');
                finalizeBridgeSetup();
            } else {
                log('❌ Even simplified ExtendScript failed: ' + result);
                registerWithoutExtendScript();
            }
        });
    }
    
    // Final bridge setup after ExtendScript loads successfully
    function finalizeBridgeSetup() {
        // Test the connection first
        csInterface.evalScript('testConnection()', function(testResult) {
            log('🧪 Connection test result: ' + testResult);
            
            // Verify test result is valid
            let testPassed = false;
            try {
                const parsed = JSON.parse(testResult);
                testPassed = parsed.success === true;
            } catch (e) {
                log('⚠️ Test result parsing failed, but continuing: ' + e.message);
                testPassed = testResult.indexOf('success') !== -1; // Fallback check
            }
            
            if (testPassed) {
                isExtendScriptLoaded = true;
                log('✅ ExtendScript test passed - marking as loaded');
            } else {
                log('⚠️ ExtendScript test failed but proceeding anyway');
            }
            
            // Update status to reflect ExtendScript state
            updateStatus(true);
            
            // Only register with bridge server AFTER ExtendScript is verified working
            if (ws && ws.readyState === WebSocket.OPEN) {
                const registrationMessage = {
                    id: 'register-' + Date.now(),
                    action: 'register',
                    plugin: 'ai-sfx',
                    payload: {
                        type: 'cep',
                        plugin: 'ai-sfx',
                        source: 'premiere-bridge',
                        capabilities: testPassed ? ['evalScript', 'console', 'stateSync'] : ['console'],
                        testResult: testResult,
                        extendScriptLoaded: isExtendScriptLoaded,
                        mode: 'simplified',
                        version: '2.0'
                    }
                };
                
                log('📤 Sending registration to bridge server...');
                log('🔍 Registration message: ' + JSON.stringify(registrationMessage, null, 2));
                log('🔍 WebSocket state: ' + ws.readyState);
                
                try {
                    ws.send(JSON.stringify(registrationMessage));
                    log('✅ Registration message sent successfully');
                } catch (sendError) {
                    log('❌ Failed to send registration: ' + sendError.message);
                }
                
                log('✅ Bridge fully ready - sent registration with capabilities');
                
                // Send ready confirmation
                ws.send(JSON.stringify({
                    id: 'bridge-ready-' + Date.now(),
                    action: 'console',
                    payload: {
                        type: 'bridge-ready',
                        message: 'CEP Bridge fully connected and ready',
                        testResult: testResult,
                        mode: testPassed ? 'full' : 'limited'
                    }
                }));
            }
        });
    }
    
    // Fallback registration without ExtendScript
    function registerWithoutExtendScript() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const registrationMessage = {
                id: 'register-' + Date.now(),
                action: 'register',
                plugin: 'ai-sfx',
                payload: {
                    type: 'cep',
                    plugin: 'ai-sfx',
                    source: 'premiere-bridge',
                    capabilities: ['console'], // Limited capabilities without ExtendScript
                    mode: 'fallback'
                }
            };
            ws.send(JSON.stringify(registrationMessage));
            log('⚠️ Bridge registered in fallback mode (no ExtendScript)');
            
            // Send status update
            ws.send(JSON.stringify({
                id: 'bridge-status-' + Date.now(),
                action: 'console',
                payload: {
                    type: 'bridge-status',
                    message: 'CEP Bridge connected but ExtendScript failed to load',
                    mode: 'fallback'
                }
            }));
        }
    }
    
    // Enhanced startup diagnostics
    function runStartupDiagnostics() {
        log('🚀 STARTING CEP BRIDGE DIAGNOSTICS');
        log('═'.repeat(50));
        
        // Test basic JavaScript environment
        log('✅ JavaScript environment: ' + (typeof window !== 'undefined' ? 'Browser' : 'Node'));
        log('✅ WebSocket support: ' + (typeof WebSocket !== 'undefined' ? 'Available' : 'Missing'));
        log('✅ CSInterface support: ' + (typeof CSInterface !== 'undefined' ? 'Available' : 'Missing'));
        log('✅ JSON support: ' + (typeof JSON !== 'undefined' ? 'Available' : 'Missing'));
        
        // Test network connectivity
        log('🔍 Testing localhost connectivity...');
        
        // Try to connect with different URL variations
        const urlVariations = [
            'ws://localhost:8090',
            'ws://127.0.0.1:8090'
        ];
        
        log('🔍 Will try these WebSocket URLs:');
        urlVariations.forEach((url, i) => {
            log(`   ${i+1}. ${url}`);
        });
        
        log('═'.repeat(50));
    }
    
    // Run diagnostics first
    runStartupDiagnostics();
    
    // Start connection with enhanced error handling
    connect();
    
    // FORCE CONNECTION: Retry every 5 seconds if not connected
    setInterval(function() {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            log('🔄 WebSocket not connected, forcing reconnection...');
            currentUrlIndex = 0; // Reset URL index
            connect();
        }
    }, 5000);
    
    // UI Control Functions
    window.clearLog = function() {
        logEntries = [];
        persistLogs();
        renderLogs();
        log('Console cleared');
    };
    
    window.reloadBridge = function() {
        log('🔄 Advanced bridge reload initiated...');
        
        // Export current diagnostics
        log('📊 Current diagnostics: ' + JSON.stringify(diagnostics, null, 2));
        
        // Reset connection state
        reconnectAttempts = 0;
        isExtendScriptLoaded = false;
        
        // Reset diagnostics for new session
        const previousAttempts = diagnostics.connectionAttempts;
        diagnostics = {
            connectionAttempts: 0,
            successfulConnections: 0,
            extendScriptAttempts: 0,
            extendScriptSuccesses: 0,
            lastError: null,
            startTime: Date.now(),
            premiereVersion: diagnostics.premiereVersion, // Keep version info
            cepVersion: diagnostics.cepVersion,
            systemInfo: diagnostics.systemInfo,
            previousSession: previousAttempts // Track previous session
        };
        
        if (ws) {
            ws.close();
        }
        if (reconnectInterval) {
            clearTimeout(reconnectInterval);
            reconnectInterval = null;
        }
        
        // Run fresh diagnostics
        setTimeout(function() {
            log('🔍 Running fresh diagnostics after reload...');
            runDiagnostics();
        }, 100);
        
        // Immediate reconnection for manual reload
        setTimeout(connect, 500);
    };
    
    window.hotReloadPlugin = function() {
        log('🔥 Hot reloading plugin...');
        // Send reload command to Electron
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                id: 'hot-reload-' + Date.now(),
                action: 'console',
                payload: {
                    type: 'hot-reload',
                    message: 'Plugin hot reload requested from CEP bridge'
                }
            }));
        }
        
        // Force reload this panel
        setTimeout(function() {
            location.reload();
        }, 500);
    };

    // Enhanced debugging interface
    window.exportDiagnostics = function() {
        const diagnosticsReport = {
            timestamp: new Date().toISOString(),
            diagnostics: diagnostics,
            connectionQuality: connectionQuality,
            isExtendScriptLoaded: isExtendScriptLoaded,
            reconnectAttempts: reconnectAttempts,
            logEntries: logEntries.slice(-50), // Last 50 log entries
            websocketState: ws ? ws.readyState : 'null',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        log('📋 Diagnostics exported to console');
        console.log('=== AI SFX BRIDGE DIAGNOSTICS ===');
        console.log(JSON.stringify(diagnosticsReport, null, 2));
        console.log('=== END DIAGNOSTICS ===');
        
        return diagnosticsReport;
    };
    
    window.testExtendScript = function() {
        log('🧪 Manual ExtendScript test initiated...');
        if (!csInterface) {
            log('❌ CSInterface not available');
            return;
        }
        
        csInterface.evalScript('typeof testConnection === "function" ? testConnection() : "testConnection not found"', function(result) {
            log('🧪 Manual test result: ' + result);
        });
    };
    
    window.forceMinimalMode = function() {
        log('🚨 Forcing minimal mode...');
        loadUltraMinimalExtendScript();
    };
    
    // Expose for debugging
    window.bridgeDebug = {
        ws: ws,
        connect: connect,
        logEntries: logEntries,
        diagnostics: diagnostics,
        connectionQuality: connectionQuality,
        evalScript: function(script) {
            csInterface.evalScript(script, function(result) {
                console.log('Result:', result);
                log('Debug script result: ' + result);
            });
        },
        runDiagnostics: runDiagnostics,
        exportDiagnostics: window.exportDiagnostics,
        performHealthCheck: performConnectionHealthCheck
    };
})();