#!/usr/bin/env python3
"""
Quick Start - Intelligently start the right dev server immediately
No guessing, no trial-and-error, just start the server that works
"""

import json
import subprocess
import sys
import re
import time
from pathlib import Path

def get_optimal_start_info():
    """Get the optimal start command and port for current plugin"""
    cwd = Path.cwd()
    package_json = cwd / 'package.json'
    
    # Default values
    plugin_name = "unknown"
    port = 3000
    start_command = "npm run dev"
    
    # Get plugin name and port from package.json
    if package_json.exists():
        try:
            with open(package_json, 'r') as f:
                data = json.load(f)
                scripts = data.get('scripts', {})
                package_name = data.get('name', '').lower()
                
                # Determine plugin type and default port
                if 'podcast' in package_name:
                    plugin_name = 'ai-podcast'
                    port = 3003
                elif any(x in package_name for x in ['text-editor', 'dialogue', 'bolt']):
                    plugin_name = 'ai-text-editor'
                    port = 3039
                elif 'video-namer' in package_name or 'namer' in package_name:
                    plugin_name = 'ai-video-namer'
                    port = 3040
                elif 'sfx' in package_name:
                    plugin_name = 'ai-sfx'
                    port = 3030
                else:
                    plugin_name = package_name
                
                # Find the best start script
                script_priorities = ['dev', 'start', 'serve', 'dev:serve', 'start:dev']
                
                for script_name in script_priorities:
                    if script_name in scripts:
                        script_content = scripts[script_name]
                        
                        # Extract port from script if specified
                        port_match = re.search(r'--port[\s=](\d+)', script_content)
                        if port_match:
                            port = int(port_match.group(1))
                        
                        # Use this script
                        if script_name == 'start':
                            start_command = "npm start"
                        else:
                            start_command = f"npm run {script_name}"
                        break
        except:
            pass
    
    # Check config files for port overrides
    config_files = ['cep.config.ts', 'cep.config.js', 'vite.config.ts', 'vite.config.js']
    for config_file in config_files:
        config_path = cwd / config_file
        if config_path.exists():
            try:
                content = config_path.read_text()
                port_patterns = [r'port:\s*(\d+)', r'servePort:\s*(\d+)']
                for pattern in port_patterns:
                    match = re.search(pattern, content)
                    if match:
                        port = int(match.group(1))
                        break
            except:
                pass
    
    return {
        'plugin': plugin_name,
        'port': port,
        'command': start_command,
        'url': f'http://localhost:{port}/main/'
    }

def start_server():
    """Start the server with zero trial-and-error"""
    info = get_optimal_start_info()
    
    print(f"🚀 QUICK START: {info['plugin']}")
    print(f"📝 Command: {info['command']}")
    print(f"🔌 Port: {info['port']}")
    
    # Kill any existing processes on the port
    try:
        subprocess.run(f"lsof -ti :{info['port']} | xargs kill -9", 
                      shell=True, capture_output=True, timeout=5)
        print(f"🔫 Cleared port {info['port']}")
    except:
        pass
    
    # Start the server
    try:
        print(f"⏳ Starting server...")
        process = subprocess.Popen(info['command'], 
                                 shell=True,
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        # Wait and verify
        time.sleep(4)
        
        # Check if server is responding
        try:
            import urllib.request
            response = urllib.request.urlopen(info['url'], timeout=3)
            if response.status == 200:
                print(f"✅ Server running: {info['url']}")
                print(f"🎯 Plugin ready in Premiere Pro")
                return True
        except:
            pass
        
        print(f"🔄 Server starting... Check: {info['url']}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'info':
        # Just show info, don't start
        info = get_optimal_start_info()
        print(f"{info['plugin']} | {info['command']} | Port {info['port']}")
    else:
        # Start the server
        start_server()