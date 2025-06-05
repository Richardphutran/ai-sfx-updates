#!/usr/bin/env python3
"""
Automated Console Capture for AI SFX Plugin
Uses Chrome DevTools Protocol to automatically run diagnostics and capture results
"""

import json
import subprocess
import time
import os
import sys
from pathlib import Path

def get_chrome_executable():
    """Find Chrome executable on different platforms"""
    possible_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",  # macOS
        "/usr/bin/google-chrome",  # Linux
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",  # Windows
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"  # Windows 32-bit
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # Try to find in PATH
    try:
        result = subprocess.run(['which', 'google-chrome'], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    
    return None

def start_chrome_with_debugging():
    """Start Chrome with remote debugging enabled"""
    chrome_path = get_chrome_executable()
    if not chrome_path:
        print("❌ Chrome not found. Please install Google Chrome.")
        return None
    
    # Chrome debugging port
    debug_port = 9222
    
    # Start Chrome with debugging
    cmd = [
        chrome_path,
        f"--remote-debugging-port={debug_port}",
        "--no-first-run",
        "--no-default-browser-check",
        "http://localhost:9230"  # Our AI SFX plugin
    ]
    
    try:
        # Kill existing Chrome processes that might interfere
        try:
            subprocess.run(['pkill', '-f', 'remote-debugging-port=9222'], capture_output=True)
        except:
            pass
        
        print(f"🚀 Starting Chrome with debugging on port {debug_port}...")
        process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)  # Give Chrome time to start
        
        return debug_port
    except Exception as e:
        print(f"❌ Failed to start Chrome: {e}")
        return None

def execute_console_command(debug_port, command):
    """Execute JavaScript command in Chrome console via DevTools Protocol"""
    try:
        import urllib.request
        import urllib.parse
        
        # Get list of tabs
        tabs_response = urllib.request.urlopen(f"http://localhost:{debug_port}/json")
        tabs = json.loads(tabs_response.read().decode())
        
        # Find our AI SFX plugin tab
        target_tab = None
        for tab in tabs:
            if 'localhost:9230' in tab.get('url', ''):
                target_tab = tab
                break
        
        if not target_tab:
            print("❌ AI SFX plugin tab not found")
            return None
        
        # Execute command via Runtime.evaluate
        eval_url = f"http://localhost:{debug_port}/json/runtime/evaluate"
        
        payload = {
            "expression": command,
            "awaitPromise": True,
            "returnByValue": True
        }
        
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            eval_url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())
        
        return result
        
    except Exception as e:
        print(f"❌ Failed to execute console command: {e}")
        return None

def run_ai_sfx_diagnostics_automated():
    """Run automated AI SFX diagnostics"""
    print("🎬 AI SFX Automated Console Diagnostics")
    print("=" * 50)
    
    # Check if plugin is accessible
    try:
        import urllib.request
        urllib.request.urlopen("http://localhost:9230", timeout=5)
        print("✅ AI SFX plugin is accessible at localhost:9230")
    except Exception as e:
        print("❌ AI SFX plugin not accessible. Make sure:")
        print("   1. Premiere Pro is running")
        print("   2. AI SFX plugin is loaded and visible")
        return False
    
    # Start Chrome with debugging
    debug_port = start_chrome_with_debugging()
    if not debug_port:
        return False
    
    print("⏱️  Waiting for Chrome and plugin to initialize...")
    time.sleep(5)
    
    # Diagnostic command
    diagnostic_script = '''
    (async function() {
        const results = {};
        
        try {
            // Test 1: Basic Connection
            console.log("=== TEST 1: Basic Connection ===");
            const basicTest = window.debugAISFX ? await window.debugAISFX() : {error: "debugAISFX not available"};
            results.basicConnection = basicTest;
            console.log("Basic connection:", basicTest.success ? "✅ PASS" : "❌ FAIL");
            
            // Test 2: Project Path
            console.log("=== TEST 2: Project Path ===");
            const csi = new CSInterface();
            const pathResult = await new Promise((resolve) => {
                csi.evalScript('getProjectPath()', (result) => {
                    try { resolve(JSON.parse(result)); } 
                    catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
                });
            });
            results.projectPath = pathResult;
            console.log("Project path:", pathResult.success ? "✅ PASS" : "❌ FAIL");
            
            // Test 3: Bin Scanning
            console.log("=== TEST 3: Bin Scanning ===");
            const binResult = await new Promise((resolve) => {
                csi.evalScript('scanProjectBinsForSFX()', (result) => {
                    try { resolve(JSON.parse(result)); } 
                    catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
                });
            });
            results.binScanning = binResult;
            console.log("Bin scanning:", binResult.success ? "✅ PASS" : "❌ FAIL");
            
            // Test 4: File System
            console.log("=== TEST 4: File System ===");
            const fs = window.cep_node.require('fs');
            const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
            const sfxPath = userPath + '/Desktop/SFX AI';
            const fileSystemResult = {
                userPath,
                sfxPath,
                exists: fs.existsSync(sfxPath),
                files: fs.existsSync(sfxPath) ? fs.readdirSync(sfxPath).slice(0, 10) : []
            };
            results.fileSystem = fileSystemResult;
            console.log("File system access: ✅ PASS");
            console.log("SFX folder exists:", fileSystemResult.exists);
            console.log("Files found:", fileSystemResult.files.length);
            
            return results;
        } catch (error) {
            console.error("Diagnostic error:", error);
            return {error: error.toString()};
        }
    })()
    '''
    
    print("🧪 Running diagnostics...")
    result = execute_console_command(debug_port, diagnostic_script)
    
    if result and 'result' in result:
        print("✅ Diagnostics completed!")
        print("\n📊 RESULTS:")
        print(json.dumps(result['result'], indent=2))
        
        # Analyze results
        analyze_diagnostic_results(result['result'])
        
    else:
        print("❌ Failed to get diagnostic results")
        print("🔧 Fallback: Manual console approach")
        manual_console_fallback()
    
    return True

def analyze_diagnostic_results(results):
    """Analyze and provide recommendations based on diagnostic results"""
    print("\n🔍 DIAGNOSTIC ANALYSIS:")
    print("=" * 30)
    
    if isinstance(results, dict) and 'value' in results:
        data = results['value']
        
        # Check each test
        basic_ok = data.get('basicConnection', {}).get('success', False)
        path_ok = data.get('projectPath', {}).get('success', False)
        bin_ok = data.get('binScanning', {}).get('success', False)
        fs_ok = not data.get('fileSystem', {}).get('error', False)
        
        print(f"Basic Connection: {'✅' if basic_ok else '❌'}")
        print(f"Project Path: {'✅' if path_ok else '❌'}")
        print(f"Bin Scanning: {'✅' if bin_ok else '❌'}")
        print(f"File System: {'✅' if fs_ok else '❌'}")
        
        # Issue identification
        print("\n🎯 ISSUE IDENTIFICATION:")
        if not basic_ok:
            print("❌ ExtendScript connection failed - restart plugin")
        if not path_ok:
            print("❌ Project path not available - save your Premiere project")
        if not bin_ok:
            print("❌ Bin scanning failed - check project structure")
        if not fs_ok:
            print("❌ File system access failed - check permissions")
            
        # Check for specific AI SFX issues
        fs_data = data.get('fileSystem', {})
        bin_data = data.get('binScanning', {})
        
        if fs_data.get('files') and len(fs_data['files']) > 0:
            if not bin_data.get('files') or len(bin_data['files']) == 0:
                print("\n⚠️  FOUND THE ISSUE:")
                print("   Files exist on disk but not in project bins!")
                print(f"   Files saved to: {fs_data.get('sfxPath')}")
                print("   This indicates bin import/organization is failing")
                
                # Provide fix
                provide_bin_import_fix()

def provide_bin_import_fix():
    """Provide specific fix for bin import issues"""
    print("\n🔧 TARGETED FIX FOR BIN IMPORT ISSUE:")
    print("=" * 40)
    
    fix_script = '''
    // Fix bin import issues
    async function fixBinImport() {
        console.log("🔧 Attempting to fix bin import...");
        
        // Test basic import without bin organization
        const csi = new CSInterface();
        
        // Get a test file path
        const fs = window.cep_node.require('fs');
        const userPath = window.cep_node.global.process.env.HOME;
        const sfxPath = userPath + '/Desktop/SFX AI';
        
        if (fs.existsSync(sfxPath)) {
            const files = fs.readdirSync(sfxPath);
            const mp3Files = files.filter(f => f.endsWith('.mp3'));
            
            if (mp3Files.length > 0) {
                const testFile = sfxPath + '/' + mp3Files[0];
                console.log("Testing import of:", testFile);
                
                // Test simple import
                const importResult = await new Promise((resolve) => {
                    csi.evalScript(`importAndPlaceAudio("${testFile}", 0)`, (result) => {
                        resolve(JSON.parse(result));
                    });
                });
                
                console.log("Import test result:", importResult);
                return importResult;
            }
        }
        
        return {error: "No test files found"};
    }
    
    fixBinImport();
    '''
    
    print("📋 Run this in console to test bin import fix:")
    print(fix_script)

def manual_console_fallback():
    """Fallback to manual console instructions"""
    print("\n🔧 MANUAL CONSOLE FALLBACK:")
    print("=" * 35)
    print("1. Chrome should be open at http://localhost:9230")
    print("2. Press F12 to open DevTools")
    print("3. Go to Console tab")
    print("4. Run our previous diagnostic script")

def main():
    """Main function"""
    print("🚀 Starting Automated AI SFX Diagnostics...")
    
    success = run_ai_sfx_diagnostics_automated()
    
    if not success:
        print("\n🔄 Falling back to manual approach...")
        manual_console_fallback()

if __name__ == "__main__":
    main()