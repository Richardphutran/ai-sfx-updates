#!/usr/bin/env python3
"""
Test Timeline Placement for AI SFX Plugin
Creates a test script to verify timeline placement is working
"""

import webbrowser
import time
import os

def generate_timeline_test_script():
    """Generate JavaScript test script for timeline placement"""
    
    # Check for existing SFX files to test with
    home = os.path.expanduser("~")
    sfx_path = os.path.join(home, "Desktop", "SFX AI")
    
    test_files = []
    if os.path.exists(sfx_path):
        files = os.listdir(sfx_path)
        test_files = [f for f in files if f.endswith('.mp3')][:3]
    
    script = f'''
// 🧪 AI SFX Timeline Placement Test
console.log("🧪 AI SFX Timeline Placement Test Started");

async function testTimelinePlacement() {{
    console.log("\\n=== TIMELINE PLACEMENT TEST ===");
    
    // Test 1: Basic ExtendScript Connection
    try {{
        console.log("\\n--- Test 1: ExtendScript Connection ---");
        const csi = new CSInterface();
        
        const appInfo = await new Promise((resolve) => {{
            csi.evalScript('getAppInfo()', (result) => {{
                try {{ resolve(JSON.parse(result)); }} 
                catch (e) {{ resolve({{error: "Parse failed", raw: result}}); }}
            }});
        }});
        
        console.log("App info:", appInfo);
        
        if (!appInfo.appName) {{
            console.error("❌ ExtendScript connection failed");
            return;
        }}
        
        console.log("✅ ExtendScript connected:", appInfo.appName);
        console.log("Project:", appInfo.projectName || "No project");
        console.log("Has sequence:", appInfo.hasActiveSequence ? "✅ Yes" : "❌ No");
        
        if (!appInfo.hasActiveSequence) {{
            console.error("❌ No active sequence - create a sequence first");
            return;
        }}
        
    }} catch (e) {{
        console.error("❌ ExtendScript test failed:", e);
        return;
    }}
    
    // Test 2: Test Available SFX Files
    console.log("\\n--- Test 2: Available Test Files ---");
    const fs = window.cep_node.require('fs');
    const userPath = window.cep_node.global.process.env.HOME;
    const sfxPath = userPath + '/Desktop/SFX AI';
    
    if (!fs.existsSync(sfxPath)) {{
        console.error("❌ No SFX folder found at:", sfxPath);
        console.log("💡 Generate some SFX first, then run this test");
        return;
    }}
    
    const files = fs.readdirSync(sfxPath).filter(f => f.endsWith('.mp3'));
    console.log("📁 SFX files found:", files.length);
    
    if (files.length === 0) {{
        console.error("❌ No MP3 files found in SFX folder");
        console.log("💡 Generate some SFX first, then run this test");
        return;
    }}
    
    // Show available files
    console.log("📋 Available test files:");
    files.slice(0, 5).forEach((file, i) => {{
        console.log(`  ${{i + 1}}. ${{file}}`);
    }});
    
    // Test 3: Test Timeline Placement Function
    console.log("\\n--- Test 3: Timeline Placement Functions ---");
    const csi = new CSInterface();
    
    // Test importAndPlaceAudio function availability
    const funcTest = await new Promise((resolve) => {{
        csi.evalScript('typeof importAndPlaceAudio', (result) => {{
            resolve(result);
        }});
    }});
    
    console.log("importAndPlaceAudio function:", funcTest);
    
    if (funcTest !== '"function"') {{
        console.error("❌ importAndPlaceAudio function not available");
        console.log("💡 Plugin may not be properly loaded");
        return;
    }}
    
    // Test 4: Actual Timeline Placement Test
    console.log("\\n--- Test 4: Actual Timeline Placement ---");
    const testFile = sfxPath + '/' + files[0];
    console.log("🎵 Testing with file:", testFile);
    
    try {{
        const placementResult = await new Promise((resolve) => {{
            csi.evalScript(`importAndPlaceAudio("${{testFile}}", 0)`, (result) => {{
                try {{ resolve(JSON.parse(result)); }} 
                catch (e) {{ resolve({{error: "Parse failed", raw: result}}); }}
            }});
        }});
        
        console.log("🎯 Placement result:", placementResult);
        
        if (placementResult.success) {{
            console.log("✅ SUCCESS! Audio placed on timeline");
            console.log("📍 Track:", placementResult.trackIndex + 1);
            console.log("⏰ Position:", placementResult.positionFormatted || "At playhead");
            console.log("📄 File:", placementResult.fileName);
            
            if (placementResult.message) {{
                console.log("📝 Message:", placementResult.message);
            }}
            
        }} else {{
            console.error("❌ PLACEMENT FAILED");
            console.error("Error:", placementResult.error);
            console.error("Step:", placementResult.step);
            
            if (placementResult.debug) {{
                console.log("🔍 Debug info:", placementResult.debug);
            }}
        }}
        
    }} catch (e) {{
        console.error("❌ Timeline placement test failed:", e);
    }}
    
    // Test 5: Manual Test Instructions
    console.log("\\n--- Test 5: Manual Verification ---");
    console.log("👀 Check your Premiere Pro timeline:");
    console.log("   1. Look for newly imported audio clip");
    console.log("   2. Check Project panel for 'AI SFX' bin");
    console.log("   3. Verify audio is at playhead position");
    
    console.log("\\n🧪 Timeline Placement Test Complete!");
}}

// 🚀 Run the test
testTimelinePlacement();

// 💡 Manual test functions
window.testSingleFile = function(fileName) {{
    console.log("🧪 Testing single file:", fileName);
    const csi = new CSInterface();
    const userPath = window.cep_node.global.process.env.HOME;
    const filePath = userPath + '/Desktop/SFX AI/' + fileName;
    
    csi.evalScript(`importAndPlaceAudio("${{filePath}}", 0)`, (result) => {{
        try {{
            const parsed = JSON.parse(result);
            console.log("Result:", parsed);
        }} catch (e) {{
            console.log("Raw result:", result);
        }}
    }});
}};

console.log("\\n💡 Manual test available:");
console.log("testSingleFile('your-file.mp3') - Test specific file");
'''
    
    return script

def main():
    """Main test function"""
    print("🧪 AI SFX Timeline Placement Tester")
    print("=" * 40)
    
    # Check for existing files
    home = os.path.expanduser("~")
    sfx_path = os.path.join(home, "Desktop", "SFX AI")
    
    if os.path.exists(sfx_path):
        files = os.listdir(sfx_path)
        mp3_files = [f for f in files if f.endswith('.mp3')]
        print(f"📁 Found {len(mp3_files)} SFX files to test with")
        if mp3_files:
            print("📋 Test files:")
            for f in mp3_files[:3]:
                print(f"   • {f}")
    else:
        print("❌ No SFX folder found - generate some SFX first")
    
    # Open console
    print("\n🌐 Opening AI SFX plugin console...")
    webbrowser.open("http://localhost:9230")
    time.sleep(2)
    
    # Generate and display test script
    test_script = generate_timeline_test_script()
    
    print("\n" + "="*60)
    print("🧪 TIMELINE PLACEMENT TEST SCRIPT")
    print("Copy this into the browser console (F12 > Console):")
    print("="*60)
    print(test_script)
    print("="*60)
    
    print("\n📝 INSTRUCTIONS:")
    print("1. Make sure Premiere Pro is open with a project")
    print("2. Create a sequence if you don't have one")
    print("3. Position playhead where you want audio")
    print("4. Open browser console (F12 > Console)")
    print("5. Paste and run the test script")
    print("6. Check if audio appears on timeline")

if __name__ == "__main__":
    main()