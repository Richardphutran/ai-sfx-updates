const WebSocket = require('ws');

console.log('🔊 Testing AI SFX connection to Electron debugger...');

const ws = new WebSocket('ws://localhost:8090');

ws.on('open', () => {
    console.log('✅ Connected to multi-plugin bridge');
    
    // Register as AI SFX plugin
    const registerMessage = {
        action: 'register',
        plugin: 'ai-sfx',
        type: 'cep',
        payload: {
            version: '1.0.0',
            sessionId: 'test-session-' + Date.now(),
            type: 'cep'
        }
    };
    
    console.log('📤 Sending registration:', registerMessage);
    ws.send(JSON.stringify(registerMessage));
    
    // Send a test console message after a short delay
    setTimeout(() => {
        const consoleMessage = {
            action: 'console',
            plugin: 'ai-sfx',
            payload: {
                level: 'info',
                message: '🔊 AI SFX Test Message - Hello from AI SFX plugin!',
                source: 'cep',
                timestamp: new Date().toISOString(),
                data: { test: true, timestamp: Date.now() }
            }
        };
        
        console.log('📤 Sending test console message');
        ws.send(JSON.stringify(consoleMessage));
        
        // Send another message to test different log levels
        setTimeout(() => {
            const warnMessage = {
                action: 'console',
                plugin: 'ai-sfx',
                payload: {
                    level: 'warn',
                    message: '⚠️ This is a test warning from AI SFX',
                    source: 'cep',
                    timestamp: new Date().toISOString()
                }
            };
            ws.send(JSON.stringify(warnMessage));
            
            const errorMessage = {
                action: 'console',
                plugin: 'ai-sfx',
                payload: {
                    level: 'error',
                    message: '❌ This is a test error from AI SFX (not a real error!)',
                    source: 'cep',
                    timestamp: new Date().toISOString()
                }
            };
            ws.send(JSON.stringify(errorMessage));
            
            console.log('✅ Test messages sent! Check the Electron debugger console');
            console.log('📍 You should see the AI SFX tab with purple 🔊 icon');
            
            setTimeout(() => {
                ws.close();
                process.exit(0);
            }, 1000);
        }, 500);
    }, 1000);
});

ws.on('error', (err) => {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 Make sure the Electron debugger is running');
    process.exit(1);
});

ws.on('message', (data) => {
    console.log('📨 Received:', data.toString());
});