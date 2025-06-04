#!/usr/bin/env python3
"""
🌟 Universal Plugin Starter - Works across all Claude sessions
Prevents ERR_CONNECTION_REFUSED by ensuring correct startup order

This script can be copied to ANY plugin project and will work without modification.
"""

import subprocess
import time
import os
import sys
import json
import urllib.request
from pathlib import Path

class UniversalPluginStarter:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.package_json = self.project_root / "package.json"
        self.dev_process = None
        
    def detect_project_info(self):
        """Auto-detect project name and ports from package.json and configs"""
        info = {
            'name': 'Plugin',
            'dev_port': 3001,
            'debug_port': 9230
        }
        
        # Try to read from package.json
        if self.package_json.exists():
            try:
                with open(self.package_json, 'r') as f:
                    pkg = json.load(f)
                    info['name'] = pkg.get('name', 'Plugin')
            except:
                pass
        
        # Try to read from cep.config.ts
        cep_config = self.project_root / "cep.config.ts"
        if cep_config.exists():
            try:
                content = cep_config.read_text()
                # Extract port numbers
                if 'port:' in content:
                    port_match = content.split('port:')[1].split(',')[0].strip()
                    info['dev_port'] = int(port_match.replace(',', ''))
                if 'startingDebugPort:' in content:
                    debug_match = content.split('startingDebugPort:')[1].split(',')[0].strip()
                    info['debug_port'] = int(debug_match.replace(',', ''))
            except:
                pass
        
        return info
    
    def check_port(self, port):
        """Check if a port is in use"""
        try:
            urllib.request.urlopen(f'http://localhost:{port}', timeout=1)
            return True
        except:
            return False
    
    def kill_process_on_port(self, port):
        """Kill any process using a port"""
        try:
            # Find process using the port
            result = subprocess.run(
                ['lsof', '-t', '-i', f':{port}'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    try:
                        subprocess.run(['kill', '-9', pid], check=True)
                        print(f"🔪 Killed process {pid} on port {port}")
                    except:
                        pass
        except:
            pass
    
    def start_dev_server(self, info):
        """Start the development server"""
        print(f"\n🚀 Starting {info['name']} development server...")
        
        # Clean up any existing processes
        self.kill_process_on_port(info['dev_port'])
        time.sleep(1)
        
        # Determine the command to use
        if (self.project_root / "yarn.lock").exists():
            cmd = ['yarn', 'dev']
        else:
            cmd = ['npm', 'run', 'dev']
        
        # Start dev server
        self.dev_process = subprocess.Popen(
            cmd,
            cwd=self.project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to be ready
        print(f"⏳ Waiting for dev server on port {info['dev_port']}...")
        for i in range(30):
            if self.check_port(info['dev_port']):
                print("✅ Dev server is ready!")
                return True
            time.sleep(1)
            
            # Check if process died
            if self.dev_process.poll() is not None:
                stdout, stderr = self.dev_process.communicate()
                print("❌ Dev server failed to start:")
                print(stderr)
                return False
        
        print("❌ Dev server timeout")
        return False
    
    def open_in_premiere(self, info):
        """Open the plugin in Premiere Pro"""
        print(f"\n🎬 Opening {info['name']} in Premiere Pro...")
        
        # Try to detect plugin display name from manifest
        manifest_path = self.project_root / "dist" / "cep" / "CSXS" / "manifest.xml"
        if not manifest_path.exists():
            manifest_path = self.project_root / "CSXS" / "manifest.xml"
        
        display_name = info['name']
        if manifest_path.exists():
            try:
                content = manifest_path.read_text()
                # Extract display name from manifest
                import re
                match = re.search(r'<DisplayName>(.*?)</DisplayName>', content)
                if match:
                    display_name = match.group(1)
            except:
                pass
        
        # AppleScript to open plugin
        script = f'''
        tell application "Adobe Premiere Pro 2025"
            activate
        end tell
        
        delay 2
        
        tell application "System Events"
            tell process "Adobe Premiere Pro 2025"
                try
                    click menu item "{display_name}" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                on error
                    -- Try without year
                    tell application "Adobe Premiere Pro" to activate
                    delay 1
                    tell process "Adobe Premiere Pro"
                        click menu item "{display_name}" of menu "Extensions" of menu item "Extensions" of menu "Window" of menu bar 1
                    end tell
                end try
            end tell
        end tell
        '''
        
        try:
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ Opened {display_name} in Premiere")
                return True
            else:
                print(f"⚠️ Could not auto-open plugin: {result.stderr}")
                print(f"\n📌 Please open manually:")
                print(f"   Window > Extensions > {display_name}")
                return False
        except Exception as e:
            print(f"⚠️ Error: {e}")
            return False
    
    def monitor_health(self, info):
        """Monitor plugin health and show status"""
        print(f"\n🏥 Monitoring plugin health...")
        time.sleep(3)
        
        # Check debug port
        for port in range(info['debug_port'], info['debug_port'] + 5):
            if self.check_port(port):
                print(f"\n✅ Plugin is running!")
                print(f"🔗 Debug console: http://localhost:{port}")
                print(f"\n📋 Quick tips:")
                print(f"• Press spacebar in empty prompt to search sounds")
                print(f"• Type a prompt and press Enter to generate")
                print(f"• Check console for debugging")
                return True
        
        print(f"\n⚠️ Plugin may need manual reload")
        print(f"1. Click on the plugin panel")
        print(f"2. Press Cmd+R (Mac) or F5 (Windows)")
        return False
    
    def run(self):
        """Main execution flow"""
        print("🌟 Universal Plugin Starter\n")
        
        # Detect project info
        info = self.detect_project_info()
        print(f"📦 Project: {info['name']}")
        print(f"🔧 Dev Port: {info['dev_port']}")
        print(f"🐛 Debug Port: {info['debug_port']}")
        
        # Start dev server
        if not self.start_dev_server(info):
            return 1
        
        # Open in Premiere
        self.open_in_premiere(info)
        
        # Monitor health
        self.monitor_health(info)
        
        # Keep running
        print(f"\n🔄 Dev server running - Press Ctrl+C to stop")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...")
            if self.dev_process:
                self.dev_process.terminate()
                try:
                    self.dev_process.wait(timeout=5)
                except:
                    self.dev_process.kill()
        
        return 0

def main():
    starter = UniversalPluginStarter()
    sys.exit(starter.run())

if __name__ == "__main__":
    main()