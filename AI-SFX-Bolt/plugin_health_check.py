#!/usr/bin/env python3
"""
🏥 Plugin Health Check & Auto-Recovery System
Ensures plugins are properly loaded and fixes common issues
"""

import json
import time
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Optional, Tuple

class PluginHealthChecker:
    """Comprehensive health checking and recovery for CEP plugins"""
    
    def __init__(self, plugin_name="AI SFX Generator", debug_port=9230, dev_port=3001):
        self.plugin_name = plugin_name
        self.debug_port = debug_port
        self.dev_port = dev_port
        self.max_retries = 3
        
    def check_dev_server(self) -> Tuple[bool, str]:
        """Check if development server is running and accessible"""
        try:
            response = urllib.request.urlopen(f'http://localhost:{self.dev_port}/main/', timeout=2)
            if response.status == 200:
                return True, "✅ Dev server is running"
        except urllib.error.URLError as e:
            return False, f"❌ Dev server not accessible: {e}"
        except Exception as e:
            return False, f"❌ Dev server error: {e}"
        
        return False, "❌ Dev server not responding"
    
    def check_plugin_loaded(self) -> Tuple[bool, str, Optional[Dict]]:
        """Check if plugin is loaded in Chrome DevTools"""
        # Try multiple common debug ports
        ports_to_check = [self.debug_port, 9230, 9231, 9232, 9233]
        
        for port in ports_to_check:
            try:
                response = urllib.request.urlopen(f'http://localhost:{port}/json', timeout=1)
                targets = json.loads(response.read().decode())
                
                for target in targets:
                    title = target.get('title', '')
                    url = target.get('url', '')
                    
                    # Check for our plugin
                    if self.plugin_name in title or 'Page failed to load' in title:
                        # Update our debug port if found on different port
                        if port != self.debug_port:
                            print(f"  📍 Found plugin on port {port} (not {self.debug_port})")
                            self.debug_port = port
                        
                        # Check if it's properly loaded
                        if 'localhost:3001' in url and 'data:text/html' not in url:
                            return True, f"✅ Plugin loaded correctly on port {port}", target
                        elif 'Page failed to load' in title or 'data:text/html' in url:
                            # Check the URL to see what failed
                            if 'ERR_CONNECTION_REFUSED' in str(url):
                                return False, f"❌ Plugin on port {port} but dev server connection refused", target
                            else:
                                return False, f"❌ Plugin loaded on port {port} but page failed", target
                        else:
                            return True, f"✅ Plugin loaded on port {port}", target
                
            except:
                continue
        
        return False, "❌ Plugin not found on any debug port", None
    
    def reload_plugin_panel(self) -> bool:
        """Force reload the plugin panel via Chrome DevTools"""
        try:
            # Get the plugin target
            loaded, msg, target = self.check_plugin_loaded()
            if not target:
                print("❌ Cannot reload - plugin not found")
                return False
            
            # Most reliable method: Close and reopen the panel in Premiere
            # This forces a fresh load from the dev server
            script = '''
            tell application "Adobe Premiere Pro 2025"
                activate
            end tell
            
            tell application "System Events"
                tell process "Adobe Premiere Pro 2025"
                    try
                        -- Right-click on the panel to get context menu
                        set panelWindow to window "AI SFX Generator (Bolt)"
                        tell panelWindow
                            -- Trigger context menu
                            perform action "AXShowMenu"
                            delay 0.5
                            -- Click "Reload" if available
                            click menu item "Reload" of menu 1
                        end tell
                        return "reload_success"
                    on error
                        -- Fallback: Close and reopen
                        keystroke "w" using command down
                        delay 1
                        click menu item "AI SFX Generator (Bolt)" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                        return "reopen_success"
                    end try
                end tell
            end tell
            '''
            
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print("✅ Plugin panel reloaded successfully")
                return True
            else:
                print(f"❌ Failed to reload: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to reload plugin: {e}")
            return False
    
    def restart_dev_server(self) -> bool:
        """Restart the development server"""
        try:
            # Kill existing dev server
            print("🔄 Restarting dev server...")
            subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
            time.sleep(2)
            
            # Start new dev server
            project_dir = Path(__file__).parent
            dev_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=project_dir,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for it to start
            for i in range(30):
                if self.check_dev_server()[0]:
                    print("✅ Dev server restarted successfully")
                    return True
                time.sleep(1)
            
            return False
            
        except Exception as e:
            print(f"❌ Failed to restart dev server: {e}")
            return False
    
    def trigger_premiere_reload(self) -> bool:
        """Trigger plugin reload in Premiere Pro"""
        try:
            # AppleScript to reload the extension
            script = '''
            tell application "Adobe Premiere Pro 2025"
                activate
            end tell
            
            tell application "System Events"
                tell process "Adobe Premiere Pro 2025"
                    -- Close the plugin panel if open
                    try
                        click menu item "AI SFX Generator (Bolt)" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                        delay 1
                    end try
                    
                    -- Open the plugin panel
                    click menu item "AI SFX Generator (Bolt)" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                end tell
            end tell
            '''
            
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print("✅ Plugin reloaded in Premiere")
                return True
            else:
                print(f"❌ Failed to reload in Premiere: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error reloading in Premiere: {e}")
            return False
    
    def perform_health_check(self) -> Dict:
        """Perform comprehensive health check"""
        print(f"\n🏥 Performing health check for {self.plugin_name}...")
        
        results = {
            'healthy': True,
            'checks': {},
            'actions_taken': []
        }
        
        # Check 1: Dev Server
        dev_ok, dev_msg = self.check_dev_server()
        results['checks']['dev_server'] = {'ok': dev_ok, 'message': dev_msg}
        print(f"  {dev_msg}")
        
        # Check 2: Plugin Loaded
        plugin_ok, plugin_msg, plugin_target = self.check_plugin_loaded()
        results['checks']['plugin_loaded'] = {'ok': plugin_ok, 'message': plugin_msg}
        print(f"  {plugin_msg}")
        
        # Determine if healthy
        results['healthy'] = dev_ok and plugin_ok
        
        return results
    
    def auto_recover(self) -> bool:
        """Attempt automatic recovery of unhealthy plugin"""
        print("\n🔧 Starting auto-recovery...")
        
        health = self.perform_health_check()
        
        if health['healthy']:
            print("✅ Plugin is healthy, no recovery needed")
            return True
        
        # Recovery Step 1: Ensure dev server is running
        if not health['checks']['dev_server']['ok']:
            print("\n🔄 Step 1: Restarting dev server...")
            if not self.restart_dev_server():
                print("❌ Failed to restart dev server")
                return False
            time.sleep(3)
        
        # Recovery Step 2: Reload plugin panel
        if not health['checks']['plugin_loaded']['ok'] or 'page failed' in health['checks']['plugin_loaded']['message'].lower():
            print("\n🔄 Step 2: Reloading plugin panel...")
            
            # First try Chrome DevTools reload
            if self.reload_plugin_panel():
                time.sleep(3)
                # Check if it worked
                plugin_ok, _, _ = self.check_plugin_loaded()
                if plugin_ok:
                    print("✅ Plugin recovered via panel reload")
                    return True
            
            # If that didn't work, try Premiere reload
            print("\n🔄 Step 3: Reloading via Premiere...")
            if self.trigger_premiere_reload():
                time.sleep(5)
                # Final check
                final_health = self.perform_health_check()
                if final_health['healthy']:
                    print("✅ Plugin recovered via Premiere reload")
                    return True
        
        print("❌ Auto-recovery failed")
        return False
    
    def ensure_healthy(self) -> bool:
        """Ensure plugin is healthy, attempting recovery if needed"""
        for attempt in range(self.max_retries):
            health = self.perform_health_check()
            
            if health['healthy']:
                print(f"\n✅ Plugin is healthy!")
                print(f"🔗 Debug at: http://localhost:{self.debug_port}")
                return True
            
            print(f"\n⚠️ Plugin unhealthy, attempt {attempt + 1}/{self.max_retries}")
            if self.auto_recover():
                return True
            
            if attempt < self.max_retries - 1:
                print(f"\n⏳ Waiting before retry...")
                time.sleep(5)
        
        print(f"\n❌ Failed to ensure healthy plugin after {self.max_retries} attempts")
        return False


def main():
    """CLI interface for health checking"""
    import sys
    
    checker = PluginHealthChecker()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'check':
            health = checker.perform_health_check()
            print(f"\n📊 Health Status: {'✅ HEALTHY' if health['healthy'] else '❌ UNHEALTHY'}")
            
        elif command == 'recover':
            if checker.auto_recover():
                print("\n✅ Recovery successful")
            else:
                print("\n❌ Recovery failed")
                
        elif command == 'ensure':
            if checker.ensure_healthy():
                print("\n✅ Plugin is ready!")
            else:
                print("\n❌ Could not ensure healthy plugin")
        
        else:
            print(f"Unknown command: {command}")
            print("Usage: python3 plugin_health_check.py [check|recover|ensure]")
    else:
        # Default: ensure healthy
        checker.ensure_healthy()


if __name__ == "__main__":
    main()