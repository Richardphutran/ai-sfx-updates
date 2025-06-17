#!/usr/bin/env node
// Test debug logger for ai-sfx

console.log('🧪 Testing debug logger for ai-sfx...');

// Simulate various log types
console.log('Regular log message');
console.info('Info message with data:', { test: true, plugin: 'ai-sfx' });
console.warn('Warning message');
console.error('Error message', new Error('Test error'));

// Check if debug logger is available
if (typeof window !== 'undefined' && window.debugLogger) {
    console.log('✅ Debug logger is available');
    console.log('📊 Current logs:', window.debugLogger.getWindowLogs().length);
} else {
    console.log('❌ Debug logger not found - run this in the CEP panel');
}
