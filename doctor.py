#!/usr/bin/env python3
"""
Doctor - Deep system-level debugging for Adobe CEP extensions
Handles everything smart_helper.py doesn't cover
Copy this to any plugin project and run: python3 doctor.py
"""

import os
import sys
import json
import subprocess
import platform
import socket
import time
import re
from pathlib import Path
import urllib.request
import urllib.error

class CEPDoctor:
    def __init__(self):
        self.os_type = platform.system()
        self.issues_found = []
        self.fixes_applied = []
        self.plugin_dir = Path.cwd()
        self.plugin_name = self._detect_plugin()
        self.port = self._get_plugin_port()
        
    def _detect_plugin(self):
        """Detect plugin from directory name"""
        cwd_str = str(self.plugin_dir).lower()
        
        plugins = {
            'ai-text-editor': ['ai', 'text', 'editor'],
            'ai-podcast': ['ai', 'podcast'],
            'ai-sfx': ['ai', 'sfx'],
            'ai-video-namer': ['ai', 'video', 'namer']
        }
        
        for plugin_name, keywords in plugins.items():
            if all(keyword in cwd_str for keyword in keywords):
                return plugin_name
                
        # Fallback to package.json
        package_json = self.plugin_dir / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    name = data.get('name', '').lower()
                    for plugin_name in plugins:
                        if plugin_name.replace('-', '') in name.replace('-', ''):
                            return plugin_name
            except:
                pass
                
        return 'unknown'
        
    def _get_plugin_port(self):
        """Get port from CLAUDE.md or defaults"""
        ports = {
            'ai-text-editor': 3039,
            'ai-podcast': 3456,
            'ai-sfx': 3005,
            'ai-video-namer': 3006
        }
        
        # Try to read from CLAUDE.md
        claude_md = self.plugin_dir / 'CLAUDE.md'
        if claude_md.exists():
            try:
                content = claude_md.read_text()
                match = re.search(r'(?:PORT|port).*?(\d{4})', content)
                if match:
                    return int(match.group(1))
            except:
                pass
                
        return ports.get(self.plugin_name, 3000)
        
    def check_hosts_file(self):
        """Check if localhost is properly configured"""
        print("🔍 Checking hosts file...")
        
        if self.os_type == "Darwin":  # macOS
            hosts_path = "/private/etc/hosts"
        elif self.os_type == "Windows":
            hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
        else:
            hosts_path = "/etc/hosts"
            
        try:
            with open(hosts_path, 'r') as f:
                content = f.read()
                if '127.0.0.1' in content and 'localhost' in content:
                    # Check if they're on the same line and not commented
                    for line in content.splitlines():
                        if not line.strip().startswith('#'):
                            if '127.0.0.1' in line and 'localhost' in line:
                                print("  ✅ Hosts file OK")
                                return True
                                
            self.issues_found.append({
                'type': 'hosts_file',
                'message': 'localhost not properly configured in hosts file',
                'fix': 'add_localhost_to_hosts'
            })
            print("  ❌ localhost not properly configured")
            return False
        except Exception as e:
            print(f"  ⚠️  Could not read hosts file: {e}")
            return False
            
    def check_adobe_debug_mode(self):
        """Check if PlayerDebugMode is enabled"""
        print("🔍 Checking Adobe debug mode...")
        
        if self.os_type == "Darwin":  # macOS
            try:
                result = subprocess.run(
                    ['defaults', 'read', 'com.adobe.CSXS.9', 'PlayerDebugMode'],
                    capture_output=True, text=True
                )
                if result.returncode == 0 and result.stdout.strip() == "1":
                    print("  ✅ PlayerDebugMode enabled")
                    return True
                else:
                    self.issues_found.append({
                        'type': 'debug_mode',
                        'message': 'PlayerDebugMode not enabled',
                        'fix': 'enable_debug_mode'
                    })
                    print("  ❌ PlayerDebugMode not enabled")
                    return False
            except:
                print("  ⚠️  Could not check debug mode")
                return False
                
        elif self.os_type == "Windows":
            # Check Windows registry
            try:
                import winreg
                key_path = r"SOFTWARE\Adobe\CSXS.9"
                try:
                    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path)
                    value, _ = winreg.QueryValueEx(key, "PlayerDebugMode")
                    winreg.CloseKey(key)
                    if str(value) == "1":
                        print("  ✅ PlayerDebugMode enabled")
                        return True
                except:
                    pass
                    
                self.issues_found.append({
                    'type': 'debug_mode',
                    'message': 'PlayerDebugMode not enabled',
                    'fix': 'enable_debug_mode'
                })
                print("  ❌ PlayerDebugMode not enabled")
                return False
            except:
                print("  ⚠️  Could not check debug mode")
                return False
                
    def check_extension_directory(self):
        """Check if extension is in the correct directory"""
        print("🔍 Checking extension installation...")
        
        if self.os_type == "Darwin":
            extension_dirs = [
                Path.home() / "Library/Application Support/Adobe/CEP/extensions",
                Path("/Library/Application Support/Adobe/CEP/extensions")
            ]
        else:  # Windows
            extension_dirs = [
                Path.home() / "AppData/Roaming/Adobe/CEP/extensions",
                Path(r"C:\Program Files (x86)\Common Files\Adobe\CEP\extensions")
            ]
            
        found = False
        for ext_dir in extension_dirs:
            if ext_dir.exists():
                # Check for any symlink or folder with our plugin name
                for item in ext_dir.iterdir():
                    if self.plugin_name.replace('-', '') in str(item).lower():
                        found = True
                        print(f"  ✅ Extension found at: {item}")
                        
                        # Check if it's a valid symlink
                        if item.is_symlink() and not item.exists():
                            self.issues_found.append({
                                'type': 'broken_symlink',
                                'message': f'Broken symlink: {item}',
                                'fix': 'fix_symlink'
                            })
                            print("  ❌ But symlink is broken!")
                        break
                        
        if not found:
            self.issues_found.append({
                'type': 'extension_missing',
                'message': 'Extension not found in CEP directories',
                'fix': 'create_symlink'
            })
            print("  ❌ Extension not installed")
            
        return found
        
    def check_manifest_xml(self):
        """Check manifest.xml configuration"""
        print("🔍 Checking manifest.xml...")
        
        manifest_paths = [
            self.plugin_dir / "CSXS" / "manifest.xml",
            self.plugin_dir / "dist" / "cep" / "CSXS" / "manifest.xml"
        ]
        
        manifest_found = False
        for manifest_path in manifest_paths:
            if manifest_path.exists():
                manifest_found = True
                try:
                    content = manifest_path.read_text()
                    
                    # Check for required CEF parameters
                    checks = {
                        '--enable-nodejs': 'Node.js not enabled',
                        '--enable-mixed-context': 'Mixed context not enabled',
                        '--remote-debugging-port': 'Remote debugging port not set'
                    }
                    
                    issues = []
                    for param, error_msg in checks.items():
                        if param not in content:
                            issues.append(error_msg)
                            
                    if issues:
                        self.issues_found.append({
                            'type': 'manifest_config',
                            'message': ', '.join(issues),
                            'fix': 'update_manifest'
                        })
                        print(f"  ❌ Issues: {', '.join(issues)}")
                    else:
                        print("  ✅ Manifest configured correctly")
                        
                except Exception as e:
                    print(f"  ⚠️  Could not read manifest: {e}")
                break
                
        if not manifest_found:
            self.issues_found.append({
                'type': 'manifest_missing',
                'message': 'manifest.xml not found',
                'fix': 'build_project'
            })
            print("  ❌ manifest.xml not found")
            
    def check_network_connectivity(self):
        """Check localhost connectivity"""
        print("🔍 Checking network connectivity...")
        
        # Test localhost resolution
        try:
            socket.gethostbyname('localhost')
            print("  ✅ localhost resolves correctly")
        except:
            self.issues_found.append({
                'type': 'dns_resolution',
                'message': 'localhost does not resolve',
                'fix': 'fix_hosts_file'
            })
            print("  ❌ localhost resolution failed")
            
        # Test actual connection to dev server port
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', self.port))
            sock.close()
            
            if result == 0:
                # Port is open, test HTTP
                try:
                    response = urllib.request.urlopen(f'http://localhost:{self.port}/', timeout=2)
                    if response.status == 200:
                        print(f"  ✅ Server responding on port {self.port}")
                    else:
                        print(f"  ⚠️  Server on port {self.port} returned status {response.status}")
                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        print(f"  ✅ Server running on port {self.port} (404 is normal for root)")
                    else:
                        print(f"  ⚠️  Server error: {e}")
                except Exception as e:
                    print(f"  ⚠️  Could not connect to server: {e}")
            else:
                print(f"  ℹ️  No server running on port {self.port}")
        except:
            print("  ⚠️  Could not test port connectivity")
            
    def clear_cep_cache(self):
        """Clear Adobe CEP cache"""
        print("🧹 Clearing CEP cache...")
        
        if self.os_type == "Darwin":
            cache_paths = [
                Path.home() / "Library/Logs/CSXS",
                Path.home() / "Library/Caches/Adobe/CEP",
                Path.home() / "Library/Application Support/Adobe/Common/Media Cache Files"
            ]
        else:  # Windows
            cache_paths = [
                Path.home() / "AppData/Local/Temp/cep_cache",
                Path.home() / "AppData/Roaming/Adobe/Common/Media Cache Files"
            ]
            
        cleared = False
        for cache_path in cache_paths:
            if cache_path.exists():
                try:
                    # Just clear log files, not everything
                    if "Logs" in str(cache_path):
                        for log_file in cache_path.glob("*.log"):
                            try:
                                log_file.unlink()
                                cleared = True
                            except:
                                pass
                    print(f"  ✅ Cleared: {cache_path.name}")
                except Exception as e:
                    print(f"  ⚠️  Could not clear {cache_path.name}: {e}")
                    
        if cleared:
            self.fixes_applied.append("Cleared CEP cache")
            
    def apply_fixes(self):
        """Apply fixes for found issues"""
        print("\n🔧 Applying fixes...")
        
        for issue in self.issues_found:
            if issue['fix'] == 'enable_debug_mode':
                if self.os_type == "Darwin":
                    try:
                        subprocess.run(['defaults', 'write', 'com.adobe.CSXS.9', 'PlayerDebugMode', '1'])
                        subprocess.run(['defaults', 'write', 'com.adobe.CSXS.10', 'PlayerDebugMode', '1'])
                        subprocess.run(['defaults', 'write', 'com.adobe.CSXS.11', 'PlayerDebugMode', '1'])
                        print("  ✅ Enabled PlayerDebugMode")
                        self.fixes_applied.append("Enabled PlayerDebugMode")
                    except:
                        print("  ❌ Could not enable debug mode (may need sudo)")
                        
            elif issue['fix'] == 'create_symlink':
                # Run symlink command if available
                try:
                    if (self.plugin_dir / 'package.json').exists():
                        # Try yarn first, then npm
                        for cmd in ['yarn symlink', 'npm run symlink']:
                            try:
                                subprocess.run(cmd.split(), cwd=self.plugin_dir, check=True)
                                print(f"  ✅ Created symlink with {cmd}")
                                self.fixes_applied.append("Created extension symlink")
                                break
                            except:
                                continue
                except:
                    print("  ❌ Could not create symlink automatically")
                    
            elif issue['fix'] == 'build_project':
                print("  ℹ️  Run 'npm run build' or 'yarn build' to create manifest.xml")
                
    def run_diagnosis(self):
        """Run all checks"""
        print(f"\n🏥 CEP Doctor - Diagnosing {self.plugin_name}\n")
        
        self.check_hosts_file()
        self.check_adobe_debug_mode()
        self.check_extension_directory()
        self.check_manifest_xml()
        self.check_network_connectivity()
        
        if self.issues_found:
            print(f"\n❌ Found {len(self.issues_found)} issues")
            for issue in self.issues_found:
                print(f"  • {issue['message']}")
        else:
            print("\n✅ All systems healthy!")
            
    def quick_fix(self):
        """Run diagnosis and apply all fixes"""
        self.run_diagnosis()
        
        if self.issues_found:
            self.clear_cep_cache()
            self.apply_fixes()
            
            if self.fixes_applied:
                print(f"\n✅ Applied {len(self.fixes_applied)} fixes:")
                for fix in self.fixes_applied:
                    print(f"  • {fix}")
                print("\n💡 Restart Premiere Pro for changes to take effect")
            else:
                print("\n⚠️  Some issues require manual intervention")
        
        # Always end with a quick status
        print(f"\n📊 Final Status: {self.plugin_name}:{self.port}")
        if not self.issues_found or len(self.fixes_applied) == len(self.issues_found):
            print("✅ Ready to develop!")
        else:
            remaining = len(self.issues_found) - len(self.fixes_applied)
            print(f"⚠️  {remaining} issues remaining")
            
def main():
    doctor = CEPDoctor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "fix":
            doctor.quick_fix()
        elif command == "cache":
            doctor.clear_cep_cache()
            print("✅ Cache cleared!")
        elif command == "hosts":
            doctor.check_hosts_file()
        elif command == "network":
            doctor.check_network_connectivity()
        elif command == "quick":
            # Emergency fix everything
            doctor.clear_cep_cache()
            doctor.quick_fix()
            print("\n🚀 Emergency fixes applied!")
    else:
        doctor.run_diagnosis()
        
if __name__ == "__main__":
    main()