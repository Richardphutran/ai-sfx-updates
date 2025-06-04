#!/usr/bin/env python3
"""
🚀 Start Plugin - Simple, reliable plugin starter
Ensures dev server is running BEFORE opening plugin in Premiere
"""

import subprocess
import time
import urllib.request
import sys
import json
from pathlib import Path

def ensure_dev_server():
    """Start dev server if not running"""
    try:
        response = urllib.request.urlopen('http://localhost:3001/main/', timeout=2)
        if response.status == 200:
            print("✅ Dev server already running")
            return True
    except:
        pass
    
    print("🚀 Starting development server...")
    
    # Clean up any existing processes
    subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
    time.sleep(1)
    
    # Start dev server
    project_dir = Path(__file__).parent
    dev_process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=project_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for server to be ready
    print("⏳ Waiting for dev server...")
    for i in range(30):
        try:
            response = urllib.request.urlopen('http://localhost:3001/main/', timeout=1)
            if response.status == 200:
                print("✅ Dev server ready!")
                return dev_process
        except:
            time.sleep(1)
            
        # Check if process died
        if dev_process.poll() is not None:
            stdout, stderr = dev_process.communicate()
            print("❌ Dev server failed to start:")
            print(stderr)
            return None
    
    print("❌ Dev server timeout")
    return None

def open_plugin_in_premiere():
    """Open the plugin panel in Premiere"""
    print("\n🎬 Opening plugin in Premiere Pro...")
    
    script = '''
    tell application "Adobe Premiere Pro 2025"
        activate
    end tell
    
    delay 1
    
    tell application "System Events"
        tell process "Adobe Premiere Pro 2025"
            -- Open the plugin
            click menu item "AI SFX Generator (Bolt)" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
        end tell
    end tell
    '''
    
    try:
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Plugin opened in Premiere")
            return True
        else:
            print(f"❌ Failed to open plugin: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_plugin_health():
    """Check if plugin loaded correctly"""
    time.sleep(3)  # Give plugin time to load
    
    print("\n🏥 Checking plugin health...")
    
    # Check common debug ports
    for port in [9230, 9231, 9232, 9233]:
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}/json', timeout=1)
            targets = json.loads(response.read().decode())
            
            for target in targets:
                if 'AI SFX Generator' in target.get('title', ''):
                    if 'Page failed' not in target.get('title', '') and 'data:text/html' not in target.get('url', ''):
                        print(f"✅ Plugin loaded successfully on port {port}")
                        print(f"🔗 Debug console: http://localhost:{port}")
                        return True
                    else:
                        print(f"⚠️ Plugin on port {port} needs reload")
                        print("\n💡 To fix:")
                        print("1. Click on the plugin panel in Premiere")
                        print("2. Press Cmd+R to reload")
                        print("   OR right-click > Reload")
                        return False
        except:
            continue
    
    print("❌ Plugin not detected")
    return False

def main():
    print("🎯 AI SFX Plugin Starter\n")
    
    # Step 1: Ensure dev server is running
    dev_process = ensure_dev_server()
    if not dev_process and dev_process is not None:
        print("\n❌ Cannot start without dev server")
        return 1
    
    # Step 2: Open plugin in Premiere
    if not open_plugin_in_premiere():
        print("\n❌ Failed to open plugin")
        return 1
    
    # Step 3: Verify it loaded correctly
    if check_plugin_health():
        print("\n✅ Plugin is ready!")
        print("\n📋 Quick tips:")
        print("• Press spacebar in empty prompt to search existing sounds")
        print("• Type a prompt and press Enter to generate new SFX")
        print("• Check console at http://localhost:9230 for debugging")
        
        if dev_process:
            print("\n🔄 Dev server running - Press Ctrl+C to stop")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Stopping dev server...")
                dev_process.terminate()
    else:
        print("\n⚠️ Plugin needs manual reload")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())