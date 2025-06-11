#!/usr/bin/env python3
"""
Smart Helper V4 - Multi-Plugin Token-Saving Edition
Ultra-efficient development assistant with cross-plugin port management,
caching, and hot reload support for Bolt CEP
"""

import json
import subprocess
import sys
import os
import re
from pathlib import Path
from datetime import datetime, timedelta
import time
import socket
import psutil

# Global port registry - FALLBACK ONLY - Always try to read from config files first
# These are now managed dynamically by dynamic-port-manager.js
PORT_REGISTRY = {
    'ai-text-editor': 3040,  # Debug console on 8870
    'ai-podcast': 3041,      # Debug console on 8871
    'ai-video-namer': 3042,  # Debug console on 8872
    'ai-sfx': 3043          # Debug console on 8873
}

# Bolt CEP detection patterns
BOLT_CEP_INDICATORS = [
    'vite-cep-plugin',
    'bolt-cep',
    'evalTS',
    'types-for-adobe'
]

# Port ranges for different services
PORT_RANGES = {
    'dev': (3000, 3099),
    'cep': (9000, 9099),
    'debug': (9200, 9299)
}

# Cache file location
CACHE_FILE = Path.home() / '.claude-plugin-cache.json'

class SmartHelperV4:
    def __init__(self):
        self.cwd = Path.cwd()
        self.cache = self._load_cache()
        self.plugin_info = self._detect_plugin()
        self.plugin = self.plugin_info['name']
        
        # Always use dynamic port detection from all sources
        self.canonical_port = self._read_port_from_all_sources()
        
        # Update the registry with the detected port
        if self.canonical_port != self.plugin_info['port']:
            print(f"📝 Dynamic port detection: {self.plugin_info['port']} → {self.canonical_port}")
            PORT_REGISTRY[self.plugin] = self.canonical_port
        
        self.start_time = time.time()
        
    def _load_cache(self):
        """Load cached data"""
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, 'r') as f:
                    return json.load(f)
            except:
                return self._empty_cache()
        return self._empty_cache()
    
    def _empty_cache(self):
        """Empty cache structure"""
        return {
            'port_assignments': {},
            'last_validated': {},
            'running_servers': {},
            'file_hashes': {},
            'last_scan': None
        }
    
    def _save_cache(self):
        """Save cache data"""
        self.cache['last_updated'] = datetime.now().isoformat()
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except:
            pass
    
    def _detect_plugin(self):
        """Detect plugin from directory and package.json"""
        cwd_str = str(self.cwd).lower()
        
        # Check each known plugin
        for plugin_name, port in PORT_REGISTRY.items():
            plugin_keywords = plugin_name.replace('-', ' ').split()
            if all(keyword in cwd_str for keyword in plugin_keywords):
                return {'name': plugin_name, 'port': port, 'is_bolt_cep': self._is_bolt_cep()}
        
        # Fallback to package.json
        package_json = self.cwd / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    name = data.get('name', '').lower()
                    
                    for plugin_name, port in PORT_REGISTRY.items():
                        if plugin_name.replace('-', '') in name.replace('-', ''):
                            return {'name': plugin_name, 'port': port, 'is_bolt_cep': self._is_bolt_cep()}
            except:
                pass
        
        return {'name': 'unknown', 'port': 3000, 'is_bolt_cep': False}
    
    def _is_bolt_cep(self):
        """Detect if this is a Bolt CEP project"""
        package_json = self.cwd / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    content = f.read()
                    return any(indicator in content for indicator in BOLT_CEP_INDICATORS)
            except:
                pass
        return False
    
    def _read_canonical_port_from_claude_md(self):
        """Read port from CLAUDE.md - the source of truth"""
        claude_md = self.cwd / 'CLAUDE.md'
        if not claude_md.exists():
            return None
            
        try:
            content = claude_md.read_text()
            # Multiple patterns to catch different formats
            patterns = [
                r'PORT\s*[:=]?\s*(\d{4})',
                r'port\s+(\d{4})',
                r'localhost:(\d{4})',
                r':(\d{4})\s+(?:WORKING|DOWN)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, content, re.IGNORECASE)
                if match:
                    return int(match.group(1))
        except:
            pass
        return None
    
    def _read_port_from_cep_config(self):
        """Read port from cep.config.ts for Bolt CEP projects"""
        cep_config = self.cwd / 'cep.config.ts'
        if not cep_config.exists():
            return None
            
        try:
            content = cep_config.read_text()
            # Look for port (NOT servePort - that's for something else)
            # port is the vite dev server port
            match = re.search(r'^\s*port:\s*(\d+)', content, re.MULTILINE)
            if match:
                return int(match.group(1))
        except:
            pass
        return None
    
    def _read_port_from_all_sources(self):
        """Read port from all possible config sources in priority order"""
        # 1. Check .debug file (highest priority for CEP)
        debug_file = self.cwd / '.debug'
        if debug_file.exists():
            try:
                content = debug_file.read_text()
                match = re.search(r'Port="(\d+)"', content)
                if match:
                    return int(match.group(1))
            except:
                pass
        
        # 2. Check cep.config.ts
        cep_port = self._read_port_from_cep_config()
        if cep_port:
            return cep_port
            
        # 3. Check vite.config.ts
        vite_config = self.cwd / 'vite.config.ts'
        if vite_config.exists():
            try:
                content = vite_config.read_text()
                match = re.search(r'port:\s*(\d+)', content)
                if match:
                    return int(match.group(1))
            except:
                pass
                
        # 4. Check package.json scripts
        package_json = self.cwd / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    scripts = data.get('scripts', {})
                    for script in scripts.values():
                        if isinstance(script, str):
                            match = re.search(r'--port[=\s]+(\d+)', script)
                            if match:
                                return int(match.group(1))
            except:
                pass
                
        # 5. Check CLAUDE.md
        claude_port = self._read_canonical_port_from_claude_md()
        if claude_port:
            return claude_port
            
        # 6. Fallback to registry
        return PORT_REGISTRY.get(self.plugin, 3000)
    
    def _is_port_in_use(self, port):
        """Check if port is in use"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    
    def _get_process_on_port(self, port):
        """Get process info for port"""
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port and conn.status == 'LISTEN':
                    try:
                        proc = psutil.Process(conn.pid)
                        return {
                            'pid': conn.pid,
                            'name': proc.name(),
                            'cmdline': ' '.join(proc.cmdline()[:3])
                        }
                    except:
                        pass
        except:
            # Fallback to lsof
            try:
                result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                      capture_output=True, text=True, timeout=2)
                if result.stdout.strip():
                    pid = int(result.stdout.strip().split('\n')[0])
                    return {'pid': pid, 'name': 'unknown', 'cmdline': 'unknown'}
            except:
                pass
        return None
    
    def _scan_all_ports(self):
        """Scan all ports to find what's in use"""
        used_ports = {}
        
        # Quick scan of registered ports first
        for plugin, port in PORT_REGISTRY.items():
            if self._is_port_in_use(port):
                process = self._get_process_on_port(port)
                if process:
                    used_ports[port] = {
                        'plugin': plugin,
                        'process': process
                    }
        
        # Cache the results
        self.cache['running_servers'] = used_ports
        self._save_cache()
        
        return used_ports
    
    def _find_free_port(self, start=3000):
        """Find next available port"""
        for port in range(start, start + 100):
            if not self._is_port_in_use(port):
                return port
        raise Exception(f"No free ports found starting from {start}")
    
    def _quick_validate_and_fix(self):
        """Ultra-fast validation with caching"""
        print(f"⚡ QUICK VALIDATION: {self.plugin}:{self.canonical_port}")
        
        # Check cache first
        last_validated = self.cache.get('last_validated', {}).get(self.plugin)
        if last_validated:
            last_time = datetime.fromisoformat(last_validated)
            if datetime.now() - last_time < timedelta(minutes=5):
                print("  ✅ Using cached validation (< 5 min old)")
                return True
        
        fixes_made = 0
        
        # 1. Quick port alignment check
        files_to_check = {
            'cep.config.ts': f'servePort: {self.canonical_port}',
            '.debug': f'Port="{self.canonical_port}"',
            'vite.config.ts': f'port: {self.canonical_port}',
        }
        
        for filename, expected_content in files_to_check.items():
            filepath = self.cwd / filename
            if filepath.exists():
                content = filepath.read_text()
                if expected_content not in content:
                    # Fix it
                    if 'servePort' in expected_content:
                        content = re.sub(r'servePort:\s*\d+', expected_content, content)
                    elif 'Port=' in expected_content:
                        content = re.sub(r'Port="\d+"', expected_content, content)
                    elif 'port:' in expected_content:
                        content = re.sub(r'port:\s*\d+', expected_content, content)
                    
                    filepath.write_text(content)
                    fixes_made += 1
        
        # 2. Fix extension ID if needed
        if self.plugin == 'ai-podcast':
            correct_id = 'com.podcastpilot.bolt'
        elif self.plugin == 'ai-text-editor':
            correct_id = 'com.ailab.dialogue-editor-bolt'
        elif self.plugin == 'ai-sfx':
            correct_id = 'com.ai.sfx.generator'
        elif self.plugin == 'ai-video-namer':
            correct_id = 'com.aivideonamer.cep'
        else:
            correct_id = f'com.{self.plugin.replace("-", ".")}'
        
        debug_file = self.cwd / '.debug'
        if debug_file.exists():
            content = debug_file.read_text()
            if correct_id not in content:
                # Update extension ID
                content = re.sub(r'Extension Id="[^"]+"', f'Extension Id="{correct_id}.main"', content)
                debug_file.write_text(content)
                fixes_made += 1
        
        # 3. Check dist/cep/main/index.html for redirects
        dist_html = self.cwd / 'dist' / 'cep' / 'main' / 'index.html'
        if dist_html.exists():
            content = dist_html.read_text()
            # Remove bad redirects
            if 'window.location.href' in content and f'localhost:{self.canonical_port}' not in content:
                content = re.sub(r'window\.location\.href\s*=\s*[\'"][^\'\"]+[\'"];?', '', content)
                dist_html.write_text(content)
                fixes_made += 1
        
        # Update cache
        self.cache['last_validated'][self.plugin] = datetime.now().isoformat()
        self._save_cache()
        
        if fixes_made > 0:
            print(f"  ✅ Fixed {fixes_made} issues")
        else:
            print(f"  ✅ All configurations correct")
        
        return True
    
    def _check_server_ultra_fast(self):
        """Ultra-fast server check"""
        if self._is_port_in_use(self.canonical_port):
            # Quick HTTP check
            try:
                import urllib.request
                response = urllib.request.urlopen(f'http://localhost:{self.canonical_port}/main/', timeout=1)
                if response.status == 200:
                    return 'running'
            except:
                pass
            return 'starting'
        return 'down'
    
    def _check_manifest_exists(self):
        """Check if manifest.xml exists"""
        manifest_path = self.cwd / 'dist' / 'cep' / 'CSXS' / 'manifest.xml'
        return manifest_path.exists()
    
    def _suggest_fix(self):
        """Suggest the correct fix based on what's missing"""
        if not self._check_manifest_exists():
            print(f"\n📋 REQUIRED STEPS:")
            print(f"   1. cd {self.cwd}")
            print(f"   2. ./start-bulletproof.sh")
            print(f"\n   This will build manifest.xml and start the server correctly")
        else:
            print(f"\n💡 To start server: ./start-bulletproof.sh")
    
    def quick_fix(self):
        """The main quick fix command - now a validator"""
        start = time.time()
        
        # 1. Check if manifest exists
        manifest_exists = self._check_manifest_exists()
        
        # 2. Check for port conflicts (for CEP projects)
        if self.plugin_info.get('is_bolt_cep'):
            port_ok = self.check_port_conflicts()
            if not port_ok:
                return
        
        # 3. Quick validation
        self._quick_validate_and_fix()
        
        # 4. Check server
        server_status = self._check_server_ultra_fast()
        
        # 4. Generate result
        elapsed = time.time() - start
        
        if not manifest_exists:
            print(f"\n❌ {self.plugin}:{self.canonical_port} - NOT BUILT")
            print(f"• manifest.xml missing - build required")
            self._suggest_fix()
        elif server_status == 'running':
            print(f"\n✅ {self.plugin}:{self.canonical_port} - WORKING")
            print(f"• Validated in {elapsed:.1f}s")
            print(f"• http://localhost:{self.canonical_port}/main/")
            if self.plugin_info.get('is_bolt_cep'):
                print(f"• Debug: Check Chrome DevTools for actual port")
        elif server_status == 'starting':
            print(f"\n🔄 {self.plugin}:{self.canonical_port} - STARTING")
            print(f"• Wait a moment...")
            print(f"• http://localhost:{self.canonical_port}/main/")
        else:
            print(f"\n❌ {self.plugin}:{self.canonical_port} - DOWN")
            self._suggest_fix()
    
    def check_all_plugins(self):
        """Check status of all plugins"""
        print("🔍 ALL PLUGINS STATUS")
        print("=" * 40)
        
        for plugin, port in PORT_REGISTRY.items():
            if self._is_port_in_use(port):
                process = self._get_process_on_port(port)
                if process:
                    print(f"✅ {plugin}:{port} RUNNING (pid: {process['pid']})")
                else:
                    print(f"⚠️  {plugin}:{port} PORT IN USE (unknown process)")
            else:
                print(f"❌ {plugin}:{port} DOWN")
        
        print("=" * 40)
    
    def setup_hot_reload(self):
        """Setup for Bolt CEP hot reloading"""
        if self.plugin_info.get('is_bolt_cep'):
            print("🔥 Bolt CEP detected - hot reload already configured")
            print("  ✅ Use 'yarn dev' or 'npm run dev' for HMR")
            return
            
        print("🔥 Setting up hot reload...")
        
        # Create optimal index.html for hot reload
        dist_dir = self.cwd / 'dist' / 'cep' / 'main'
        dist_dir.mkdir(parents=True, exist_ok=True)
        
        index_html = dist_dir / 'index.html'
        hot_reload_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.plugin.replace("-", " ").title()}</title>
</head>
<body>
    <div id="app"></div>
    <script src="../lib/CSInterface.js"></script>
    <script src="../lib/cep_engine_extensions.js"></script>
    <script type="module">
        // Vite hot reload client
        import 'http://localhost:{self.canonical_port}/@vite/client';
        // Your app entry
        import 'http://localhost:{self.canonical_port}/src/js/main/index-react.tsx';
    </script>
</body>
</html>'''
        
        index_html.write_text(hot_reload_content)
        print(f"  ✅ Hot reload configured for port {self.canonical_port}")
    
    def bolt_debug(self):
        """Bolt CEP helper - now aligned with Structure First approach"""
        if not self.plugin_info.get('is_bolt_cep'):
            print("❌ Not a Bolt CEP project")
            return False
            
        print("🔧 BOLT CEP VALIDATOR")
        print("\n📋 The correct way to start Bolt CEP:")
        print("   ./start-bulletproof.sh")
        print("\nThis script will:")
        print("   1. Build the extension (creates manifest.xml)")
        print("   2. Create the symlink")
        print("   3. Start the dev server")
        print("\n⚠️  NEVER run 'npm run dev' directly!")
        
        # Check current status
        manifest_exists = self._check_manifest_exists()
        if not manifest_exists:
            print("\n❌ manifest.xml not found - build required first")
        else:
            print("\n✅ manifest.xml exists")
            
        # Check server
        server_status = self._check_server_ultra_fast()
        if server_status == 'running':
            print(f"✅ Server running on port {self.canonical_port}")
            print(f"\n🌐 Access at: http://localhost:{self.canonical_port}/main/")
            print("🔍 Debug: Check Chrome DevTools for actual debug port")
        else:
            print(f"❌ Server not running")
            
        return True
    
    def check_port_conflicts(self):
        """Check for CEP debug port conflicts with dev server port"""
        print("🔍 CHECKING FOR PORT CONFLICTS")
        
        # Find CEP debug ports
        debug_ports = []
        try:
            result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                if 'cephtmlengine' in line.lower() and '--remote-debugging-port=' in line:
                    match = re.search(r'--remote-debugging-port=(\d+)', line)
                    if match:
                        port = int(match.group(1))
                        debug_ports.append(port)
                        print(f"  📍 Found CEP debug port: {port}")
        except:
            pass
            
        # Check if dev port conflicts
        if self.canonical_port in debug_ports:
            print(f"\n⚠️  CONFLICT: Dev port {self.canonical_port} is used by CEP debug!")
            print("\n💡 Solution:")
            print("  1. Run: node port-conflict-resolver.js")
            print("  2. Or change port in cep.config.ts")
            print("  3. Then: ./start-bulletproof.sh")
            return False
        else:
            print(f"\n✅ No conflict: Dev port {self.canonical_port} is clear")
            if debug_ports:
                print(f"  • CEP Debug ports: {', '.join(map(str, debug_ports))}")
                print(f"  • Dev Server port: {self.canonical_port}")
            return True

# Main execution
if __name__ == "__main__":
    
    # Handle new workflow commands first
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        # New auto-server commands
        if command in ['start', 'server', 'localhost', 'auto']:
            print("🎯 Starting auto-server with recovery...")
            import subprocess
            subprocess.run([sys.executable, "auto-server.py"])
            sys.exit(0)
        
        elif command == 'workflow':
            print("🎬 Starting CEP workflow manager...")
            import subprocess
            plugin = sys.argv[2] if len(sys.argv) > 2 else "ai-text-editor"
            subprocess.run([sys.executable, "cep-workflow-manager.py", "start", plugin])
            sys.exit(0)
        
        elif command == 'workflow-status':
            print("📊 Checking all plugin status...")
            import subprocess
            subprocess.run([sys.executable, "cep-workflow-manager.py", "status"])
            sys.exit(0)
        
        elif command == 'restart-premiere':
            print("🔄 Managing Premiere Pro restart...")
            import subprocess
            subprocess.run([sys.executable, "cep-workflow-manager.py", "restart-premiere"])
            sys.exit(0)
        
        elif command in ['console', 'debug', 'not-working', 'broken']:
            print(f"🔍 Analyzing issue: {command}")
            # Continue with regular helper flow
    
    # Regular SmartHelper commands
    helper = SmartHelperV4()
    
    if len(sys.argv) == 1 or sys.argv[1] in ['fix', 'quick']:
        # Default quick fix
        helper.quick_fix()
    elif sys.argv[1] == 'bolt-debug':
        helper.bolt_debug()
    elif sys.argv[1] == 'check-all':
        helper.check_all_plugins()
    elif sys.argv[1] == 'hot-reload':
        helper.setup_hot_reload()
    elif sys.argv[1] == 'status':
        status = helper._check_server_ultra_fast()
        if status == 'running':
            print(f"✅ {helper.plugin}:{helper.canonical_port} WORKING")
        else:
            print(f"❌ {helper.plugin}:{helper.canonical_port} DOWN")
    elif sys.argv[1] == 'clear-cache':
        CACHE_FILE.unlink(missing_ok=True)
        print("✅ Cache cleared")
    elif sys.argv[1] == 'port-conflict':
        helper.check_port_conflicts()
    elif sys.argv[1] in ['console', 'debug', 'not-working', 'broken']:
        # These were handled above but run quick_fix as fallback
        helper.quick_fix()
    else:
        # Show help for unknown commands
        print(f"💡 Unknown command: {sys.argv[1]}")
        print("\n📚 Available commands:")
        print("  start/server     - Start auto-server with recovery")
        print("  workflow         - Use CEP workflow manager")
        print("  workflow-status  - Check all plugin status")
        print("  restart-premiere - Manage Premiere restart")
        print("  bolt-debug       - Fix Bolt CEP debug console")
        print("  status           - Quick server status check")
        print("  console          - Check debug console")
        print("\nRunning quick fix instead...")
        helper.quick_fix()