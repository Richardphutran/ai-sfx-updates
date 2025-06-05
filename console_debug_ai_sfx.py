#!/usr/bin/env python3
"""
AI SFX Plugin Console Debugger
Opens browser console and provides diagnostic commands
"""

import webbrowser
import subprocess
import sys
import time

def open_ai_sfx_console():
    """Open AI SFX plugin console in browser"""
    console_url = "http://localhost:9230"
    
    print("🎬 AI SFX Plugin Console Debugger")
    print("=" * 40)
    print(f"🌐 Opening console: {console_url}")
    
    # Open browser
    webbrowser.open(console_url)
    time.sleep(2)
    
    print("\n✅ Browser opened!")
    print("📝 Instructions:")
    print("1. Open Console tab (F12 or Cmd+Option+I)")
    print("2. Paste the diagnostic script below")
    print("3. Press Enter to run")
    
    return console_url

def print_diagnostic_script():
    """Print the diagnostic script for manual execution"""
    script = '''
// 🔍 AI SFX Plugin Auto-Diagnostics
console.log("🔍 AI SFX Auto-Diagnostics Started");

async function runAISFXDiagnostics() {
    const results = {};
    
    // Test 1: Basic Connection
    try {
        console.log("\\n=== TEST 1: Basic Connection ===");
        const basicTest = window.debugAISFX ? await window.debugAISFX() : {error: "debugAISFX not available"};
        results.basicConnection = basicTest;
        console.log("Basic connection:", basicTest.success ? "✅ PASS" : "❌ FAIL");
        if (!basicTest.success) console.error("Error:", basicTest.error);
    } catch (e) {
        results.basicConnection = {error: e.toString()};
        console.error("❌ Basic connection failed:", e);
    }
    
    // Test 2: Project Path
    try {
        console.log("\\n=== TEST 2: Project Path ===");
        const csi = new CSInterface();
        const pathResult = await new Promise((resolve) => {
            csi.evalScript('getProjectPath()', (result) => {
                try { resolve(JSON.parse(result)); } 
                catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
            });
        });
        results.projectPath = pathResult;
        console.log("Project path:", pathResult.success ? "✅ PASS" : "❌ FAIL");
        console.log("Path info:", pathResult);
    } catch (e) {
        results.projectPath = {error: e.toString()};
        console.error("❌ Project path test failed:", e);
    }
    
    // Test 3: Bin Scanning
    try {
        console.log("\\n=== TEST 3: Bin Scanning ===");
        const csi = new CSInterface();
        const binResult = await new Promise((resolve) => {
            csi.evalScript('scanProjectBinsForSFX()', (result) => {
                try { resolve(JSON.parse(result)); } 
                catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
            });
        });
        results.binScanning = binResult;
        console.log("Bin scanning:", binResult.success ? "✅ PASS" : "❌ FAIL");
        console.log("Bins found:", binResult.totalFound || 0);
        if (binResult.files) {
            console.log("SFX files in bins:", binResult.files.slice(0, 5));
        }
    } catch (e) {
        results.binScanning = {error: e.toString()};
        console.error("❌ Bin scanning failed:", e);
    }
    
    // Test 4: File System
    try {
        console.log("\\n=== TEST 4: File System ===");
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
        console.log("File system access:", "✅ PASS");
        console.log("SFX folder exists:", fileSystemResult.exists);
        console.log("Files found:", fileSystemResult.files.length);
        if (fileSystemResult.files.length > 0) {
            console.log("Recent files:", fileSystemResult.files.slice(0, 3));
        }
    } catch (e) {
        results.fileSystem = {error: e.toString()};
        console.error("❌ File system test failed:", e);
    }
    
    // Test 5: Test Import Function (if available)
    try {
        console.log("\\n=== TEST 5: Import Function Test ===");
        if (typeof window.testAudioImport === 'function') {
            console.log("✅ testAudioImport function available");
            console.log("💡 To test import: testAudioImport('/path/to/test.mp3')");
        } else {
            console.log("❌ testAudioImport function not available");
        }
    } catch (e) {
        console.error("❌ Import function test failed:", e);
    }
    
    // Summary
    console.log("\\n📊 DIAGNOSTIC SUMMARY");
    console.log("======================");
    console.log("Basic Connection:", results.basicConnection?.success ? "✅" : "❌");
    console.log("Project Path:", results.projectPath?.success ? "✅" : "❌");  
    console.log("Bin Scanning:", results.binScanning?.success ? "✅" : "❌");
    console.log("File System:", results.fileSystem?.error ? "❌" : "✅");
    
    console.log("\\n🔧 ISSUE DIAGNOSIS:");
    if (!results.basicConnection?.success) {
        console.log("❌ ExtendScript connection failed");
        console.log("   → Restart plugin or Premiere Pro");
    }
    if (!results.projectPath?.success) {
        console.log("❌ Project path not available");
        console.log("   → Save your Premiere project first");
    }
    if (!results.binScanning?.success) {
        console.log("❌ Bin scanning failed");
        console.log("   → Check project has active sequence");
    }
    if (results.fileSystem?.error) {
        console.log("❌ File system access failed");
        console.log("   → Check file permissions");
    }
    
    // Check if files exist but not imported
    if (results.fileSystem?.files?.length > 0 && (!results.binScanning?.files || results.binScanning.files.length === 0)) {
        console.log("⚠️  FOUND ISSUE: Files exist on disk but not in project bins!");
        console.log("   → Files saved to:", results.fileSystem.sfxPath);
        console.log("   → Manually drag files into Premiere project panel");
        console.log("   → This indicates a bin import/organization failure");
    }
    
    return results;
}

// 🚀 Run diagnostics immediately
runAISFXDiagnostics();
'''
    
    print("\n" + "="*60)
    print("📋 DIAGNOSTIC SCRIPT - COPY AND PASTE INTO CONSOLE:")
    print("="*60)
    print(script)
    print("="*60)

def check_plugin_running():
    """Check if plugin is actually running"""
    try:
        import urllib.request
        urllib.request.urlopen("http://localhost:9230", timeout=3)
        return True
    except:
        return False

def main():
    print("🎬 Starting AI SFX Console Diagnostics...")
    
    # Check if plugin is running
    if not check_plugin_running():
        print("❌ Plugin not accessible at localhost:9230")
        print("📋 Make sure:")
        print("   1. Premiere Pro is running")
        print("   2. AI SFX plugin is loaded")
        print("   3. Plugin panel is open")
        sys.exit(1)
    
    # Open console
    console_url = open_ai_sfx_console()
    
    # Print diagnostic script
    print_diagnostic_script()
    
    print("\n💡 WHAT TO DO NEXT:")
    print("1. Console should be open in your browser")
    print("2. Open DevTools (F12 or Cmd+Option+I)")
    print("3. Go to Console tab")
    print("4. Copy the entire script above")
    print("5. Paste and press Enter")
    print("6. Share the diagnostic results!")

if __name__ == "__main__":
    main()