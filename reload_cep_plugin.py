#!/usr/bin/env python3
"""
Reload CEP Plugin - AI SFX Generator
CEP plugins require different reload process than UXP plugins
"""

import subprocess
import time
import os

def reload_cep_plugin():
    """Reload CEP plugin by restarting Premiere with proper loading"""
    print("🔄 CEP Plugin Reload Process")
    print("=" * 40)
    
    print("🔍 Step 1: Check plugin symlink...")
    symlink_path = "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/com.ai.sfx.generator"
    
    if os.path.islink(symlink_path):
        target = os.readlink(symlink_path)
        print(f"✅ Symlink exists: {symlink_path}")
        print(f"   → Points to: {target}")
    else:
        print("❌ Symlink not found - creating it...")
        source_path = "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/dist/cep"
        
        # Remove existing if it exists
        if os.path.exists(symlink_path):
            os.remove(symlink_path)
        
        # Create symlink
        os.symlink(source_path, symlink_path)
        print(f"✅ Created symlink: {symlink_path} → {source_path}")
    
    print("\n🔍 Step 2: Check debug file...")
    debug_file = "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/dist/cep/.debug"
    
    if os.path.exists(debug_file):
        with open(debug_file, 'r') as f:
            debug_content = f.read().strip()
        print(f"✅ Debug file exists: {debug_content}")
    else:
        print("❌ Debug file missing")
        return False
    
    print("\n🔍 Step 3: Check CEP manifest...")
    manifest_file = "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/dist/cep/CSXS/manifest.xml"
    
    if os.path.exists(manifest_file):
        print("✅ Manifest file exists")
    else:
        print("❌ Manifest file missing")
        return False
    
    print("\n🔄 Step 4: Restart Premiere to load plugin...")
    
    # Kill Premiere processes
    try:
        subprocess.run(['pkill', '-f', 'Adobe Premiere Pro'], check=False)
        print("🛑 Premiere Pro processes killed")
        time.sleep(3)
    except:
        print("⚠️ Could not kill Premiere (may not be running)")
    
    # Start Premiere with project
    project_path = "/Users/richardtran/Desktop/AI SFX Test/TEST AI SFX CEP.prproj"
    
    if os.path.exists(project_path):
        print(f"🚀 Starting Premiere with project: {project_path}")
        subprocess.Popen([
            'open', 
            '-a', 
            'Adobe Premiere Pro 2025',
            project_path
        ])
        
        print("⏱️ Waiting for Premiere to start (30 seconds)...")
        time.sleep(30)
        
        print("\n📋 NEXT STEPS TO MANUALLY ENABLE PLUGIN:")
        print("1. In Premiere Pro, go to: Window > Extensions")
        print("2. Look for 'AI SFX Generator (Bolt)'")
        print("3. Click it to open the plugin panel")
        print("4. If not visible, restart Premiere once more")
        
        # Check if plugin is accessible
        print("\n🧪 Checking plugin accessibility...")
        try:
            import urllib.request
            urllib.request.urlopen("http://localhost:9230", timeout=5)
            print("✅ Plugin accessible at http://localhost:9230")
            return True
        except:
            print("❌ Plugin not yet accessible at localhost:9230")
            print("💡 Manually open the plugin from Window > Extensions menu")
            return False
    else:
        print(f"❌ Project file not found: {project_path}")
        print("💡 Start Premiere manually and open a project")
        return False

def show_cep_troubleshooting():
    """Show CEP-specific troubleshooting steps"""
    print("\n🔧 CEP PLUGIN TROUBLESHOOTING:")
    print("=" * 35)
    
    print("❌ If plugin doesn't appear in Extensions menu:")
    print("   1. Check CEP debug mode is enabled:")
    print("      defaults write com.adobe.CSXS.11 PlayerDebugMode 1")
    print("   2. Restart Premiere Pro completely")
    print("   3. Check symlink points to correct dist/cep folder")
    
    print("\n❌ If plugin appears but doesn't load:")
    print("   1. Check Chrome DevTools for errors")
    print("   2. Verify manifest.xml is valid")
    print("   3. Check .debug file has correct port")
    
    print("\n❌ If plugin loads but timeline placement fails:")
    print("   1. Open browser console at http://localhost:9230")
    print("   2. Run our timeline placement verification script")
    print("   3. Check ExtendScript functions are working")
    
    print("\n✅ Plugin working? Test it:")
    print("   1. Generate SFX with prompt")
    print("   2. Check console for detailed logs")
    print("   3. Verify timeline placement works")

def main():
    """Main function"""
    print("🎬 CEP Plugin Reload Tool")
    print("Unlike UXP plugins, CEP plugins need manual loading")
    print("=" * 50)
    
    success = reload_cep_plugin()
    
    if success:
        print("\n🎉 Plugin reload successful!")
        print("🌐 Access plugin at: http://localhost:9230")
    else:
        print("\n⚠️ Plugin may need manual loading...")
        show_cep_troubleshooting()
    
    print("\n📝 Remember: CEP plugins are different from UXP!")
    print("• CEP = Older tech, needs manual Extensions menu loading")
    print("• UXP = Newer tech, has Developer Tool for reloading")

if __name__ == "__main__":
    main()