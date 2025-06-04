#!/usr/bin/env python3
"""
🚀 Ensure Plugin Ready - Complete solution for reliable plugin startup
Handles all edge cases including "Page failed to load" errors
"""

import subprocess
import time
import json
import urllib.request
from pathlib import Path
import sys

class PluginReadiness:
    def __init__(self):
        self.dev_port = 3001
        self.debug_ports = [9230, 9231, 9232, 9233]
        self.plugin_name = "AI SFX Generator"
        
    def ensure_dev_server(self) -> bool:
        """Ensure dev server is running BEFORE plugin loads"""
        print("🔍 Checking dev server...")
        
        try:
            response = urllib.request.urlopen(f'http://localhost:{self.dev_port}/main/', timeout=2)
            if response.status == 200:
                print("✅ Dev server already running")
                return True
        except:
            pass
            
        print("🚀 Starting dev server...")
        
        # Kill any zombie processes
        subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
        time.sleep(1)
        
        # Start dev server
        project_dir = Path(__file__).parent
        dev_process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=project_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for server
        for i in range(30):
            try:
                response = urllib.request.urlopen(f'http://localhost:{self.dev_port}/main/', timeout=1)
                if response.status == 200:
                    print("✅ Dev server ready")
                    return True
            except:
                time.sleep(1)
                
        print("❌ Dev server failed to start")
        return False
        
    def find_plugin_port(self) -> tuple:
        """Find which port the plugin is on"""
        for port in self.debug_ports:
            try:
                response = urllib.request.urlopen(f'http://localhost:{port}/json', timeout=1)
                targets = json.loads(response.read().decode())
                
                for target in targets:
                    if self.plugin_name in target.get('title', '') or 'Page failed to load' in target.get('title', ''):
                        return port, target
            except:
                continue
                
        return None, None
        
    def fix_failed_page(self, port: int, target: dict) -> bool:
        """Fix 'Page failed to load' by forcing navigation"""
        print(f"🔧 Fixing failed page on port {port}...")
        
        # Method 1: Direct navigation via DevTools HTTP API
        try:
            page_id = target['id']
            nav_url = f'http://localhost:{port}/json/runtime/evaluate'
            
            # JavaScript to navigate
            js_code = f'window.location.href = "http://localhost:{self.dev_port}/main/index.html"'
            
            data = json.dumps({
                'expression': js_code
            }).encode()
            
            # Try to navigate
            req = urllib.request.Request(
                nav_url,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            try:
                urllib.request.urlopen(req, timeout=2)
                print("✅ Navigation command sent")
                time.sleep(2)
                return True
            except:
                pass
        except:
            pass
            
        # Method 2: Force reload via Premiere
        print("🔄 Forcing reload through Premiere...")
        script = '''
        tell application "Adobe Premiere Pro 2025"
            activate
        end tell
        
        tell application "System Events"
            tell process "Adobe Premiere Pro 2025"
                try
                    -- Find the plugin window
                    set pluginWindow to window "AI SFX Generator (Bolt)"
                    
                    -- Right-click to get context menu
                    tell pluginWindow
                        perform action "AXRaise"
                        delay 0.5
                        -- Control-click for context menu
                        key down control
                        click at {100, 100}
                        key up control
                        delay 0.5
                        
                        -- Look for Reload option
                        try
                            click menu item "Reload" of menu 1
                        on error
                            -- Alt: Press Cmd+R to reload
                            keystroke "r" using command down
                        end try
                    end tell
                    
                    return "reload_attempted"
                on error errMsg
                    -- Window not found, open it
                    click menu item "AI SFX Generator (Bolt)" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                    return "window_opened"
                end try
            end tell
        end tell
        '''
        
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Reload command sent to Premiere")
            time.sleep(3)
            return True
            
        return False
        
    def verify_plugin_health(self) -> bool:
        """Verify plugin is properly loaded"""
        port, target = self.find_plugin_port()
        
        if not port:
            print("❌ Plugin not found on any port")
            return False
            
        if target and 'Page failed to load' not in target.get('title', ''):
            print(f"✅ Plugin healthy on port {port}")
            print(f"🔗 Debug URL: http://localhost:{port}")
            return True
            
        return False
        
    def ensure_ready(self) -> bool:
        """Main method to ensure plugin is ready"""
        print("\n🚀 Ensuring AI SFX Plugin is ready...\n")
        
        # Step 1: Ensure dev server is running FIRST
        if not self.ensure_dev_server():
            print("❌ Cannot proceed without dev server")
            return False
            
        # Step 2: Check plugin status
        port, target = self.find_plugin_port()
        
        if not port:
            print("⚠️ Plugin not loaded yet")
            print("📌 Please open the plugin in Premiere:")
            print("   Window > Extensions > AI SFX Generator (Bolt)")
            return False
            
        # Step 3: Fix if needed
        if target and ('Page failed to load' in target.get('title', '') or 
                      'ERR_CONNECTION_REFUSED' in str(target.get('url', ''))):
            print(f"⚠️ Plugin has error page on port {port}")
            
            for attempt in range(3):
                if self.fix_failed_page(port, target):
                    time.sleep(2)
                    if self.verify_plugin_health():
                        return True
                        
                print(f"Retry {attempt + 1}/3...")
                time.sleep(2)
                
            print("❌ Could not fix plugin state")
            print("\n💡 Manual fix:")
            print("1. Go to plugin panel in Premiere")
            print("2. Right-click > Reload")
            print("   OR press Cmd+R while plugin is focused")
            return False
            
        # Already healthy
        return self.verify_plugin_health()


def main():
    readiness = PluginReadiness()
    
    if readiness.ensure_ready():
        print("\n✅ Plugin is ready for development!")
        print("\n📋 Next steps:")
        print("   - Press spacebar in empty prompt field to search")
        print("   - Type prompt and press Enter to generate")
        print("   - Check console for debugging")
    else:
        print("\n❌ Plugin setup incomplete")
        sys.exit(1)


if __name__ == "__main__":
    main()