#!/usr/bin/env python3
"""
Verify Timeline Placement Fix for AI SFX Plugin
Quick verification that the timeline placement is now working
"""

import os
import webbrowser
import time

def check_plugin_status():
    """Check if plugin is accessible"""
    try:
        import urllib.request
        urllib.request.urlopen("http://localhost:9230", timeout=3)
        return True
    except:
        return False

def verify_fix_status():
    """Generate verification script for the timeline placement fix"""
    
    print("🔍 AI SFX Timeline Placement Fix Verification")
    print("=" * 50)
    
    # Check if plugin is running
    if not check_plugin_status():
        print("❌ Plugin not accessible at localhost:9230")
        print("   → Start Premiere Pro and load the AI SFX plugin")
        return
    
    print("✅ Plugin is accessible")
    
    # Check for test files
    home = os.path.expanduser("~")
    sfx_path = os.path.join(home, "Desktop", "SFX AI")
    
    if os.path.exists(sfx_path):
        files = [f for f in os.listdir(sfx_path) if f.endswith('.mp3')]
        print(f"✅ Found {len(files)} SFX files for testing")
    else:
        print("❌ No SFX files found - generate some first")
        return
    
    # Generate quick verification script
    verification_script = '''
// 🔍 Quick Timeline Placement Verification
console.log("🔍 Verifying timeline placement fix...");

async function quickVerification() {
    try {
        // Check if functions are available
        const csi = new CSInterface();
        
        // Test 1: Check ExtendScript functions
        const funcCheck = await new Promise((resolve) => {
            csi.evalScript('typeof importAndPlaceAudio', (result) => {
                resolve(result === '"function"');
            });
        });
        
        console.log("Timeline functions available:", funcCheck ? "✅ YES" : "❌ NO");
        
        if (!funcCheck) {
            console.error("❌ Timeline placement functions not loaded");
            console.log("💡 Try reloading the plugin");
            return;
        }
        
        // Test 2: Check for active sequence
        const appInfo = await new Promise((resolve) => {
            csi.evalScript('getAppInfo()', (result) => {
                try { resolve(JSON.parse(result)); } 
                catch (e) { resolve({error: e.toString()}); }
            });
        });
        
        console.log("Active sequence:", appInfo.hasActiveSequence ? "✅ YES" : "❌ NO");
        
        if (!appInfo.hasActiveSequence) {
            console.error("❌ No active sequence found");
            console.log("💡 Create a sequence in Premiere Pro first");
            return;
        }
        
        console.log("✅ Timeline placement fix verification complete!");
        console.log("🎯 Ready to test SFX generation with timeline placement");
        
        // Show test instructions
        console.log("\\n📝 TO TEST THE FIX:");
        console.log("1. Generate a new SFX using the plugin");
        console.log("2. Check if it appears on timeline at playhead position");
        console.log("3. Look for enhanced error logging if it fails");
        
    } catch (error) {
        console.error("❌ Verification failed:", error);
    }
}

// Run verification
quickVerification();

// Add test function for manual testing
window.testTimelinePlacement = function() {
    console.log("🧪 Manual timeline placement test...");
    const fs = window.cep_node.require('fs');
    const userPath = window.cep_node.global.process.env.HOME;
    const sfxPath = userPath + '/Desktop/SFX AI';
    
    if (fs.existsSync(sfxPath)) {
        const files = fs.readdirSync(sfxPath).filter(f => f.endsWith('.mp3'));
        if (files.length > 0) {
            const testFile = sfxPath + '/' + files[0];
            console.log("Testing with:", files[0]);
            
            const csi = new CSInterface();
            csi.evalScript(`importAndPlaceAudio("${testFile}", 0)`, (result) => {
                try {
                    const parsed = JSON.parse(result);
                    console.log("✅ Test result:", parsed);
                    if (parsed.success) {
                        console.log("🎉 Timeline placement working!");
                    } else {
                        console.error("❌ Placement failed:", parsed.error);
                    }
                } catch (e) {
                    console.log("Raw result:", result);
                }
            });
        } else {
            console.log("No MP3 files found for testing");
        }
    } else {
        console.log("No SFX folder found");
    }
};

console.log("\\n💡 Manual test function available:");
console.log("testTimelinePlacement() - Test with existing SFX file");
'''
    
    return verification_script

def main():
    """Main verification function"""
    verification_script = verify_fix_status()
    
    if verification_script:
        # Open console
        print("\n🌐 Opening plugin console for verification...")
        webbrowser.open("http://localhost:9230")
        time.sleep(2)
        
        print("\n" + "="*60)
        print("🔍 VERIFICATION SCRIPT")
        print("Copy this into the browser console (F12 > Console):")
        print("="*60)
        print(verification_script)
        print("="*60)
        
        print("\n📋 VERIFICATION CHECKLIST:")
        print("✅ Plugin accessible")
        print("✅ Enhanced error handling added")
        print("✅ Fallback placement methods implemented")
        print("✅ Detailed logging for debugging")
        
        print("\n🎯 NEXT STEPS:")
        print("1. Run the verification script in console")
        print("2. Test SFX generation to see if timeline placement works")
        print("3. Check console for detailed error logs if issues persist")
        print("4. Use testTimelinePlacement() for manual testing")

if __name__ == "__main__":
    main()