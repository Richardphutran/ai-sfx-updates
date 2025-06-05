#!/usr/bin/env python3
"""
Pure Python Plugin Restart (NO AppleScript)
Uses HTTP requests to CEP Debug API and process management
"""

import subprocess
import time
import urllib.request
import urllib.error
import json
import psutil
import signal
import os
from typing import Optional, List

class PluginRestarter:
    def __init__(self, debug_port: int = 9230, plugin_name: str = "AI SFX Generator"):
        self.debug_port = debug_port
        self.plugin_name = plugin_name
        self.debug_url = f"http://localhost:{debug_port}"
        
    def get_premiere_processes(self) -> List[psutil.Process]:
        """Find all Premiere Pro processes"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'exe']):
            try:
                if 'Adobe Premiere Pro' in proc.info['name'] or \
                   (proc.info['exe'] and 'Premiere Pro' in proc.info['exe']):
                    processes.append(proc)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return processes
    
    def check_plugin_status(self) -> bool:
        """Check if plugin debug port is responding"""
        try:
            response = urllib.request.urlopen(self.debug_url, timeout=2)
            return response.status == 200
        except:
            return False
    
    def reload_plugin_via_debug(self) -> bool:
        """Try to reload plugin using Chrome DevTools protocol"""
        try:
            # Get debug targets
            targets_url = f"{self.debug_url}/json"
            response = urllib.request.urlopen(targets_url, timeout=5)
            targets = json.loads(response.read().decode())
            
            if not targets:
                return False
            
            # Use first target (the plugin)
            target = targets[0]
            ws_url = target.get('webSocketDebuggerUrl')
            
            if not ws_url:
                return False
            
            # Send reload command via HTTP (simpler than WebSocket)
            reload_url = f"{self.debug_url}/json/runtime/evaluate"
            reload_data = json.dumps({
                "expression": "location.reload()",
                "returnByValue": True
            }).encode()
            
            req = urllib.request.Request(
                reload_url,
                data=reload_data,
                headers={'Content-Type': 'application/json'}
            )
            
            response = urllib.request.urlopen(req, timeout=5)
            return response.status == 200
            
        except Exception as e:
            print(f"Debug reload failed: {e}")
            return False
    
    def force_kill_premiere(self) -> bool:
        """Force kill Premiere Pro processes"""
        processes = self.get_premiere_processes()
        if not processes:
            print("No Premiere Pro processes found")
            return False
        
        killed = False
        for proc in processes:
            try:
                print(f"Killing Premiere process: {proc.pid}")
                proc.terminate()
                proc.wait(timeout=5)
                killed = True
            except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                try:
                    proc.kill()
                    killed = True
                except:
                    pass
            except psutil.AccessDenied:
                print(f"Access denied killing process {proc.pid}")
        
        return killed
    
    def start_premiere(self) -> bool:
        """Start Premiere Pro"""
        premiere_paths = [
            "/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app",
            "/Applications/Adobe Premiere Pro 2024/Adobe Premiere Pro 2024.app",
            "/Applications/Adobe Premiere Pro 2023/Adobe Premiere Pro 2023.app",
        ]
        
        for path in premiere_paths:
            if os.path.exists(path):
                try:
                    subprocess.Popen(['open', path])
                    print(f"Started Premiere from: {path}")
                    return True
                except Exception as e:
                    print(f"Failed to start Premiere from {path}: {e}")
        
        print("Could not find Premiere Pro installation")
        return False
    
    def wait_for_plugin(self, max_wait: int = 30) -> bool:
        """Wait for plugin to become available"""
        print(f"Waiting for plugin on port {self.debug_port}...")
        for i in range(max_wait):
            if self.check_plugin_status():
                print(f"Plugin available after {i+1} seconds")
                return True
            time.sleep(1)
        
        print(f"Plugin not available after {max_wait} seconds")
        return False
    
    def soft_restart(self) -> bool:
        """Try soft restart via debug protocol first"""
        print("Attempting soft plugin restart...")
        if self.reload_plugin_via_debug():
            print("✅ Soft restart successful")
            return True
        return False
    
    def hard_restart(self) -> bool:
        """Force restart entire Premiere Pro"""
        print("Attempting hard restart (killing Premiere)...")
        
        # Kill Premiere
        if not self.force_kill_premiere():
            print("Failed to kill Premiere")
            return False
        
        # Wait a moment
        time.sleep(3)
        
        # Start Premiere
        if not self.start_premiere():
            print("Failed to start Premiere")
            return False
        
        # Wait for plugin
        if self.wait_for_plugin():
            print("✅ Hard restart successful")
            return True
        else:
            print("❌ Hard restart failed - plugin not available")
            return False
    
    def restart_plugin(self, force_hard: bool = False) -> bool:
        """Main restart method - tries soft first, then hard"""
        if not force_hard:
            if self.soft_restart():
                return True
            
            print("Soft restart failed, trying hard restart...")
        
        return self.hard_restart()

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Restart Premiere Pro plugin without AppleScript')
    parser.add_argument('--port', type=int, default=9230, help='Plugin debug port')
    parser.add_argument('--name', default='AI SFX Generator', help='Plugin name')
    parser.add_argument('--force-hard', action='store_true', help='Skip soft restart, go straight to hard restart')
    parser.add_argument('--soft-only', action='store_true', help='Only try soft restart')
    
    args = parser.parse_args()
    
    restarter = PluginRestarter(args.port, args.name)
    
    if args.soft_only:
        success = restarter.soft_restart()
    else:
        success = restarter.restart_plugin(args.force_hard)
    
    if success:
        print(f"🎉 Plugin '{args.name}' restarted successfully!")
        exit(0)
    else:
        print(f"❌ Failed to restart plugin '{args.name}'")
        exit(1)

if __name__ == "__main__":
    main()