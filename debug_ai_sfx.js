/**
 * Debug script for AI SFX Plugin Issues
 * Run this in the browser console when the plugin is loaded to test functionality
 */

console.log('🔍 AI SFX Debug Suite Started');

// Test 1: Basic ExtendScript Connection
async function testBasicConnection() {
    console.log('\n=== TEST 1: Basic ExtendScript Connection ===');
    try {
        const result = await window.debugAISFX();
        console.log('✅ Basic connection test:', result);
        return result;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return { error: error.toString() };
    }
}

// Test 2: Project Bin Scanning
async function testBinScanning() {
    console.log('\n=== TEST 2: Project Bin Scanning ===');
    try {
        const csi = new CSInterface();
        
        // Test bin scanning functionality
        const binResult = await new Promise((resolve) => {
            csi.evalScript('scanProjectBinsForSFX()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({ success: false, error: 'Failed to parse result', raw: result });
                }
            });
        });
        
        console.log('📦 Bin scan result:', binResult);
        
        // Test project path detection
        const pathResult = await new Promise((resolve) => {
            csi.evalScript('getProjectPath()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({ success: false, error: 'Failed to parse result', raw: result });
                }
            });
        });
        
        console.log('📁 Project path result:', pathResult);
        
        return { binResult, pathResult };
    } catch (error) {
        console.error('❌ Bin scanning test failed:', error);
        return { error: error.toString() };
    }
}

// Test 3: File System Access
async function testFileSystemAccess() {
    console.log('\n=== TEST 3: File System Access ===');
    try {
        const fs = window.cep_node.require('fs');
        const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
        
        // Test default SFX folder path
        const desktopSfxPath = `${userPath}/Desktop/SFX AI`;
        console.log('🗂️ Desktop SFX path:', desktopSfxPath);
        console.log('🗂️ Desktop SFX exists:', fs.existsSync(desktopSfxPath));
        
        if (fs.existsSync(desktopSfxPath)) {
            const files = fs.readdirSync(desktopSfxPath);
            console.log('📄 Files in Desktop SFX folder:', files);
        }
        
        return { success: true, desktopSfxPath, exists: fs.existsSync(desktopSfxPath) };
    } catch (error) {
        console.error('❌ File system test failed:', error);
        return { error: error.toString() };
    }
}

// Test 4: Debug Project Bins Structure
async function testProjectBinsDebug() {
    console.log('\n=== TEST 4: Project Bins Debug ===');
    try {
        const csi = new CSInterface();
        
        const debugResult = await new Promise((resolve) => {
            csi.evalScript('debugProjectBins()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({ success: false, error: 'Failed to parse result', raw: result });
                }
            });
        });
        
        console.log('🔍 Project bins debug:', debugResult);
        
        if (debugResult.success && debugResult.debugInfo) {
            const sfxBins = debugResult.debugInfo.filter(item => 
                item.type === 'BIN' && item.matchesSFX
            );
            console.log('🎯 SFX-related bins found:', sfxBins);
        }
        
        return debugResult;
    } catch (error) {
        console.error('❌ Project bins debug failed:', error);
        return { error: error.toString() };
    }
}

// Test 5: Test Audio Import (if user provides path)
window.testAudioImportDebug = async function(filePath) {
    console.log('\n=== TEST 5: Audio Import Debug ===');
    if (!filePath) {
        console.log('💡 Usage: testAudioImportDebug("/path/to/your/audio/file.mp3")');
        return;
    }
    
    try {
        const result = await window.testAudioImport(filePath);
        console.log('🎵 Import result:', result);
        
        if (!result.success) {
            console.error('❌ Import failed:', result.error);
            console.log('🔍 Debug info:', result.debug);
        } else {
            console.log('✅ Import successful!');
            console.log('📍 Track:', result.trackIndex);
            console.log('⏰ Position:', result.positionFormatted);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Audio import test failed:', error);
        return { error: error.toString() };
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Running All AI SFX Debug Tests...\n');
    
    const results = {
        connection: await testBasicConnection(),
        binScanning: await testBinScanning(),
        fileSystem: await testFileSystemAccess(),
        projectBins: await testProjectBinsDebug()
    };
    
    console.log('\n📊 === SUMMARY OF ALL TESTS ===');
    console.log('Connection:', results.connection.success ? '✅ PASS' : '❌ FAIL');
    console.log('Bin Scanning:', results.binScanning.binResult?.success ? '✅ PASS' : '❌ FAIL');
    console.log('File System:', results.fileSystem.success ? '✅ PASS' : '❌ FAIL');
    console.log('Project Bins:', results.projectBins.success ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n🛠️ Next Steps:');
    console.log('1. If connection failed: Check if plugin is loaded and ExtendScript is working');
    console.log('2. If bin scanning failed: Check project bin structure and permissions');
    console.log('3. If file system failed: Check file paths and permissions');
    console.log('4. To test audio import: testAudioImportDebug("/path/to/test.mp3")');
    
    return results;
}

// Make functions available globally
window.testBasicConnection = testBasicConnection;
window.testBinScanning = testBinScanning;
window.testFileSystemAccess = testFileSystemAccess;
window.testProjectBinsDebug = testProjectBinsDebug;
window.runAllTests = runAllTests;

console.log('\n🛠️ AI SFX Debug Functions Available:');
console.log('• runAllTests() - Run all debug tests');
console.log('• testBasicConnection() - Test ExtendScript connection');
console.log('• testBinScanning() - Test bin scanning functionality');
console.log('• testFileSystemAccess() - Test file system access');
console.log('• testProjectBinsDebug() - Debug project bins structure');
console.log('• testAudioImportDebug("/path/to/file.mp3") - Test audio import');
console.log('\n💡 Quick Start: runAllTests()');