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
    
    def get_recent_project_from_premiere(self) -> Optional[str]:
        """Get the most recent project from Premiere's File menu using AppleScript"""
        try:
            script = '''
            tell application "Adobe Premiere Pro 2025"
                activate
                delay 1
            end tell
            
            tell application "System Events"
                tell process "Adobe Premiere Pro 2025"
                    try
                        set recentMenu to menu "Open Recent" of menu item "Open Recent" of menu "File" of menu bar 1
                        set recentItems to menu items of recentMenu
                        
                        if (count of recentItems) > 0 then
                            set firstRecentItem to item 1 of recentItems
                            set recentFileName to title of firstRecentItem
                            return recentFileName
                        else
                            return "No recent files"
                        end if
                    on error errorMessage
                        return "Error: " & errorMessage
                    end try
                end tell
            end tell
            '''
            
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0:
                recent_file = result.stdout.strip()
                if recent_file and recent_file != "No recent files" and not recent_file.startswith("Error:"):
                    print(f"Recent file from Premiere menu: {recent_file}")
                    
                    # Check if it's already a full path
                    if os.path.exists(recent_file) and recent_file.endswith('.prproj'):
                        return recent_file
                    
                    # Otherwise, try to find the full path by searching for this filename
                    return self.find_project_by_name(recent_file)
                else:
                    print(f"No recent files available in Premiere: {recent_file}")
                    return None
            else:
                print(f"AppleScript failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"Error getting recent project from Premiere: {e}")
            return None
    
    def find_project_by_name(self, filename: str) -> Optional[str]:
        """Find a project file by its filename"""
        search_dirs = [
            os.path.expanduser("~/Documents"),
            os.path.expanduser("~/Desktop"),
            os.path.expanduser("~/Movies"),
        ]
        
        for search_dir in search_dirs:
            if not os.path.exists(search_dir):
                continue
                
            try:
                for root, dirs, files in os.walk(search_dir):
                    dirs[:] = [d for d in dirs if not d.startswith('.') and 'auto-save' not in d.lower()]
                    
                    for file in files:
                        if file == filename or file == f"{filename}.prproj":
                            file_path = os.path.join(root, file)
                            print(f"Found project at: {file_path}")
                            return file_path
            except Exception as e:
                continue
        
        print(f"Could not find project file: {filename}")
        return None

    def find_most_recent_project(self) -> Optional[str]:
        """Find the most recent Premiere Pro project file"""
        # First try to get recent project from Premiere's menu
        if self.get_premiere_processes():  # Only if Premiere is running
            recent_from_premiere = self.get_recent_project_from_premiere()
            if recent_from_premiere:
                return recent_from_premiere
        
        print("Falling back to filesystem search...")
        
        # Fallback to filesystem search
        search_dirs = [
            os.path.expanduser("~/Documents"),
            os.path.expanduser("~/Desktop"),
            os.path.expanduser("~/Movies"),
        ]
        
        project_files = []
        
        for search_dir in search_dirs:
            if not os.path.exists(search_dir):
                continue
                
            try:
                # Find .prproj files recursively
                for root, dirs, files in os.walk(search_dir):
                    # Skip hidden directories and auto-save folders
                    dirs[:] = [d for d in dirs if not d.startswith('.') and 'auto-save' not in d.lower()]
                    
                    for file in files:
                        if file.endswith('.prproj') and not file.startswith('.'):
                            file_path = os.path.join(root, file)
                            try:
                                # Get modification time
                                mtime = os.path.getmtime(file_path)
                                project_files.append((file_path, mtime))
                            except OSError:
                                continue
            except Exception as e:
                print(f"Warning: Could not search {search_dir}: {e}")
                continue
        
        if not project_files:
            print("No Premiere project files found")
            return None
        
        # Sort by modification time (most recent first)
        project_files.sort(key=lambda x: x[1], reverse=True)
        most_recent = project_files[0][0]
        
        print(f"Found most recent project: {most_recent}")
        return most_recent
    
    def start_premiere(self, project_file: Optional[str] = None) -> bool:
        """Start Premiere Pro, optionally with a project file"""
        premiere_paths = [
            "/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app",
            "/Applications/Adobe Premiere Pro 2024/Adobe Premiere Pro 2024.app",
            "/Applications/Adobe Premiere Pro 2023/Adobe Premiere Pro 2023.app",
        ]
        
        # Find most recent project if none specified
        if project_file is None:
            project_file = self.find_most_recent_project()
        
        for path in premiere_paths:
            if os.path.exists(path):
                try:
                    if project_file and os.path.exists(project_file):
                        # Open Premiere with the project file
                        subprocess.Popen(['open', '-a', path, project_file])
                        print(f"Started Premiere with project: {os.path.basename(project_file)}")
                    else:
                        # Open Premiere without project
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
    
    def hard_restart(self, open_recent_project: bool = True) -> bool:
        """Force restart entire Premiere Pro"""
        print("Attempting hard restart (killing Premiere)...")
        
        # Find recent project before killing Premiere
        project_file = None
        if open_recent_project:
            project_file = self.find_most_recent_project()
        
        # Kill Premiere
        if not self.force_kill_premiere():
            print("Failed to kill Premiere")
            return False
        
        # Wait a moment
        time.sleep(3)
        
        # Start Premiere with project
        if not self.start_premiere(project_file):
            print("Failed to start Premiere")
            return False
        
        # Wait for plugin
        if self.wait_for_plugin():
            print("✅ Hard restart successful")
            return True
        else:
            print("❌ Hard restart failed - plugin not available")
            return False
    
    def restart_plugin(self, force_hard: bool = False, open_recent_project: bool = True) -> bool:
        """Main restart method - tries soft first, then hard"""
        if not force_hard:
            if self.soft_restart():
                return True
            
            print("Soft restart failed, trying hard restart...")
        
        return self.hard_restart(open_recent_project)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Restart Premiere Pro plugin without AppleScript')
    parser.add_argument('--port', type=int, default=9230, help='Plugin debug port')
    parser.add_argument('--name', default='AI SFX Generator', help='Plugin name')
    parser.add_argument('--force-hard', action='store_true', help='Skip soft restart, go straight to hard restart')
    parser.add_argument('--soft-only', action='store_true', help='Only try soft restart')
    parser.add_argument('--no-project', action='store_true', help='Do not open recent project when restarting Premiere')
    parser.add_argument('--project', type=str, help='Specific project file to open')
    
    args = parser.parse_args()
    
    restarter = PluginRestarter(args.port, args.name)
    
    if args.soft_only:
        success = restarter.soft_restart()
    else:
        # Determine whether to open recent project
        open_recent = not args.no_project
        
        # If specific project specified, use that
        if args.project:
            if os.path.exists(args.project):
                # Override the find_most_recent_project method temporarily
                original_method = restarter.find_most_recent_project
                restarter.find_most_recent_project = lambda: args.project
                success = restarter.restart_plugin(args.force_hard, True)
                restarter.find_most_recent_project = original_method
            else:
                print(f"❌ Project file not found: {args.project}")
                exit(1)
        else:
            success = restarter.restart_plugin(args.force_hard, open_recent)
    
    if success:
        print(f"🎉 Plugin '{args.name}' restarted successfully!")
        exit(0)
    else:
        print(f"❌ Failed to restart plugin '{args.name}'")
        exit(1)

if __name__ == "__main__":
    main()