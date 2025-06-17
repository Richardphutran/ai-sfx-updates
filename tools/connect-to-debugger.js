// Simple debugger connection for AI SFX
console.log('🔗 Connecting AI SFX to debugger...');

const PLUGIN_ID = 'ai-sfx';
const BRIDGE_PORT = 8090;

// Add this to your main JavaScript file or as a script tag in index.html
function connectToDebugger() {
    const ws = new WebSocket(`ws://localhost:${BRIDGE_PORT}`);
    
    ws.onopen = () => {
        console.log('✅ AI SFX connected to multi-plugin debugger!');
        
        // Register with debugger
        ws.send(JSON.stringify({
            action: 'register',
            plugin: PLUGIN_ID,
            type: 'cep',
            payload: {
                version: '1.0.0',
                panelName: 'AI SFX Generator',
                extensionId: 'com.ai.sfx.generator.main'
            }
        }));
        
        // Override console methods to forward to debugger
        ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            const original = console[method];
            console[method] = function(...args) {
                original.apply(console, args);
                
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        action: 'console',
                        plugin: PLUGIN_ID,
                        payload: {
                            level: method,
                            message: args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                            ).join(' '),
                            source: 'cep',
                            timestamp: new Date().toISOString()
                        }
                    }));
                }
            };
        });
        
        // Test message
        console.log('🔊 AI SFX debugger integration active!');
    };
    
    ws.onerror = (err) => {
        console.error('Failed to connect to debugger:', err);
    };
    
    ws.onclose = () => {
        console.log('Debugger connection closed');
        // Reconnect after 5 seconds
        setTimeout(connectToDebugger, 5000);
    };
}

// Connect when loaded
if (typeof window !== 'undefined') {
    connectToDebugger();
}

// Export for use in other files
if (typeof module !== 'undefined') {
    module.exports = { connectToDebugger };
}