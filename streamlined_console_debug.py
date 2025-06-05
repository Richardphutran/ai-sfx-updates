#!/usr/bin/env python3
"""
Streamlined AI SFX Console Debugger
Our established workflow: Python script + manual console execution
"""

import webbrowser
import subprocess
import time
import json
import os
from pathlib import Path

def check_ai_sfx_status():
    """Check if AI SFX plugin is running and accessible"""
    try:
        import urllib.request
        response = urllib.request.urlopen("http://localhost:9230", timeout=3)
        return True
    except:
        return False

def check_local_sfx_files():
    """Check for SFX files on local filesystem"""
    try:
        home = os.path.expanduser("~")
        sfx_desktop_path = os.path.join(home, "Desktop", "SFX AI")
        
        result = {
            "sfx_desktop_path": sfx_desktop_path,
            "exists": os.path.exists(sfx_desktop_path),
            "files": []
        }
        
        if result["exists"]:
            files = os.listdir(sfx_desktop_path)
            mp3_files = [f for f in files if f.endswith('.mp3')]
            result["files"] = mp3_files[:10]  # First 10 files
            result["total_files"] = len(mp3_files)
        
        return result
    except Exception as e:
        return {"error": str(e)}

def generate_targeted_diagnostic():
    """Generate a targeted diagnostic based on common AI SFX issues"""
    
    # Check local file system first
    local_files = check_local_sfx_files()
    
    print("🎬 AI SFX Targeted Diagnostic Generator")
    print("=" * 45)
    
    print("\n📂 LOCAL FILE SYSTEM CHECK:")
    if local_files.get("exists"):
        print(f"✅ SFX folder exists: {local_files['sfx_desktop_path']}")
        print(f"📄 MP3 files found: {local_files.get('total_files', 0)}")
        if local_files.get("files"):
            print("📋 Recent files:")
            for f in local_files["files"][:3]:
                print(f"   • {f}")
    else:
        print(f"❌ SFX folder not found: {local_files['sfx_desktop_path']}")
    
    # Generate diagnostic script based on findings
    has_local_files = local_files.get("exists") and local_files.get("total_files", 0) > 0
    
    diagnostic_script = f'''
// 🎯 AI SFX Targeted Diagnostic
console.log("🎯 AI SFX Targeted Diagnostic Started");
console.log("Local files found: {has_local_files}");

async function runTargetedDiagnostic() {{
    const results = {{}};
    
    // Priority Test 1: ExtendScript Connection
    try {{
        console.log("\\n=== PRIORITY TEST 1: ExtendScript Connection ===");
        const csi = new CSInterface();
        
        // Test basic ExtendScript
        const basicResult = await new Promise((resolve) => {{
            csi.evalScript('getAppInfo()', (result) => {{
                try {{ resolve(JSON.parse(result)); }} 
                catch (e) {{ resolve({{success: false, error: "Parse failed", raw: result}}); }}
            }});
        }});
        
        results.extendScript = basicResult;
        console.log("ExtendScript:", basicResult.appName ? "✅ CONNECTED" : "❌ FAILED");
        
        if (basicResult.appName) {{
            console.log("App:", basicResult.appName);
            console.log("Project:", basicResult.projectName || "No project");
            console.log("Sequence:", basicResult.hasActiveSequence ? "✅ Active" : "❌ None");
        }}
        
    }} catch (e) {{
        results.extendScript = {{error: e.toString()}};
        console.error("❌ ExtendScript test failed:", e);
    }}
    
    // Priority Test 2: Project Status
    try {{
        console.log("\\n=== PRIORITY TEST 2: Project Status ===");
        const csi = new CSInterface();
        
        const pathResult = await new Promise((resolve) => {{
            csi.evalScript('getProjectPath()', (result) => {{
                try {{ resolve(JSON.parse(result)); }} 
                catch (e) {{ resolve({{success: false, error: "Parse failed", raw: result}}); }}
            }});
        }});
        
        results.projectPath = pathResult;
        console.log("Project saved:", pathResult.success ? "✅ YES" : "❌ NO");
        
        if (pathResult.success) {{
            console.log("Project path:", pathResult.projectPath);
            console.log("Project dir:", pathResult.projectDir);
        }} else {{
            console.log("⚠️  Project not saved - this is likely the issue!");
            console.log("💡 Save your Premiere project to fix bin import");
        }}
        
    }} catch (e) {{
        results.projectPath = {{error: e.toString()}};
        console.error("❌ Project path test failed:", e);
    }}
    
    // Priority Test 3: Bin Import Test (if files exist locally)
    {"" if not has_local_files else '''
    try {
        console.log("\\n=== PRIORITY TEST 3: Bin Import Test ===");
        console.log("🔍 Testing bin import since local files were found");
        
        const csi = new CSInterface();
        
        // Test bin scanning
        const binResult = await new Promise((resolve) => {
            csi.evalScript('scanProjectBinsForSFX()', (result) => {
                try { resolve(JSON.parse(result)); } 
                catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
            });
        });
        
        results.binScanning = binResult;
        console.log("Bin scanning:", binResult.success ? "✅ SUCCESS" : "❌ FAILED");
        
        if (binResult.success) {
            console.log("SFX bins found:", binResult.totalFound || 0);
            if (binResult.files && binResult.files.length > 0) {
                console.log("SFX files in bins:", binResult.files.length);
                console.log("Sample files:", binResult.files.slice(0, 3));
            } else {
                console.log("⚠️  No SFX files found in project bins!");
                console.log("💡 Files exist locally but not imported to project");
            }
        }
        
        // Test debug bins structure
        const debugResult = await new Promise((resolve) => {
            csi.evalScript('debugProjectBins()', (result) => {
                try { resolve(JSON.parse(result)); } 
                catch (e) { resolve({success: false, error: "Parse failed", raw: result}); }
            });
        });
        
        if (debugResult.success) {
            const sfxBins = debugResult.debugInfo.filter(item => 
                item.type === 'BIN' && item.matchesSFX
            );
            console.log("SFX-related bins:", sfxBins.length);
            sfxBins.forEach(bin => {
                console.log(`  📁 ${bin.name} (${bin.itemCount} items)`);
            });
        }
        
    } catch (e) {
        results.binImport = {error: e.toString()};
        console.error("❌ Bin import test failed:", e);
    }
    '''}
    
    // Priority Test 4: File System Verification
    try {{
        console.log("\\n=== PRIORITY TEST 4: File System Verification ===");
        const fs = window.cep_node.require('fs');
        const userPath = window.cep_node.global.process.env.HOME;
        const sfxPath = userPath + '/Desktop/SFX AI';
        
        const fsResult = {{
            sfxPath,
            exists: fs.existsSync(sfxPath),
            files: fs.existsSync(sfxPath) ? fs.readdirSync(sfxPath).filter(f => f.endsWith('.mp3')) : []
        }};
        
        results.fileSystem = fsResult;
        console.log("SFX folder exists:", fsResult.exists ? "✅ YES" : "❌ NO");
        console.log("MP3 files on disk:", fsResult.files.length);
        
        if (fsResult.files.length > 0) {{
            console.log("Recent files:");
            fsResult.files.slice(0, 5).forEach(f => console.log(`  🎵 ${{f}}`));
        }}
        
    }} catch (e) {{
        results.fileSystem = {{error: e.toString()}};
        console.error("❌ File system test failed:", e);
    }}
    
    // DIAGNOSTIC SUMMARY
    console.log("\\n📊 DIAGNOSTIC SUMMARY");
    console.log("======================");
    
    const extendOK = results.extendScript?.appName ? true : false;
    const projectOK = results.projectPath?.success ? true : false;
    const binOK = results.binScanning?.success ? true : false;
    const fsOK = results.fileSystem?.files?.length > 0;
    
    console.log("ExtendScript Connection:", extendOK ? "✅" : "❌");
    console.log("Project Saved:", projectOK ? "✅" : "❌");
    console.log("Bin Import Working:", binOK ? "✅" : "❌");
    console.log("Files on Disk:", fsOK ? "✅" : "❌");
    
    // ISSUE IDENTIFICATION
    console.log("\\n🎯 ISSUE IDENTIFICATION:");
    
    if (!extendOK) {{
        console.log("❌ CRITICAL: ExtendScript connection failed");
        console.log("   → Restart Premiere Pro and reload plugin");
    }} else if (!projectOK) {{
        console.log("❌ MAIN ISSUE: Project not saved");
        console.log("   → Save your Premiere project (Ctrl/Cmd+S)");
        console.log("   → This prevents proper file organization");
    }} else if (fsOK && !binOK) {{
        console.log("❌ MAIN ISSUE: Files generated but bin import failed");
        console.log("   → Files exist: " + results.fileSystem.sfxPath);
        console.log("   → Bin organization is failing silently");
        console.log("   → Manual workaround: Drag files from Desktop into Project panel");
    }} else if (!fsOK) {{
        console.log("❌ MAIN ISSUE: File generation failed");
        console.log("   → Check API key and internet connection");
    }} else {{
        console.log("✅ All systems working normally");
    }}
    
    return results;
}}

// 🚀 Run targeted diagnostic
runTargetedDiagnostic();
'''
    
    return diagnostic_script

def main():
    """Main diagnostic workflow"""
    print("🚀 AI SFX Streamlined Console Debugger")
    print("Using our established Python + Manual Console workflow")
    print("=" * 55)
    
    # Check plugin status
    if not check_ai_sfx_status():
        print("❌ AI SFX plugin not accessible at localhost:9230")
        print("\n📋 Prerequisites:")
        print("   1. Start Premiere Pro")
        print("   2. Load AI SFX plugin")
        print("   3. Open plugin panel")
        return
    
    print("✅ AI SFX plugin is accessible")
    
    # Generate diagnostic
    diagnostic_script = generate_targeted_diagnostic()
    
    # Open console
    print("\n🌐 Opening plugin console...")
    webbrowser.open("http://localhost:9230")
    time.sleep(2)
    
    # Display script
    print("\n" + "="*60)
    print("📋 TARGETED DIAGNOSTIC SCRIPT")
    print("Copy this into the browser console (F12 > Console):")
    print("="*60)
    print(diagnostic_script)
    print("="*60)
    
    print("\n📝 INSTRUCTIONS:")
    print("1. Chrome should now be open at localhost:9230")
    print("2. Press F12 (or Cmd+Option+I) to open DevTools")
    print("3. Click Console tab")
    print("4. Copy the script above")
    print("5. Paste and press Enter")
    print("6. Share the results!")

if __name__ == "__main__":
    main()