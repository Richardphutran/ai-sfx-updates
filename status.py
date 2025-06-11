#!/usr/bin/env python3
"""
Ultra-minimal status - one line for Claude
"""

import subprocess
import json
from pathlib import Path

def get_status():
    """Get plugin status in minimal tokens"""
    cwd = Path.cwd()
    
    # Get plugin info
    package_json = cwd / 'package.json'
    if package_json.exists():
        try:
            with open(package_json, 'r') as f:
                data = json.load(f)
                package_name = data.get('name', '').lower()
                
                # Determine plugin and port
                if 'podcast' in package_name:
                    plugin, port = 'ai-podcast', 3003
                elif any(x in package_name for x in ['text-editor', 'dialogue', 'bolt']):
                    plugin, port = 'ai-text-editor', 3039
                elif 'video-namer' in package_name:
                    plugin, port = 'ai-video-namer', 3040
                elif 'sfx' in package_name:
                    plugin, port = 'ai-sfx', 3030
                else:
                    plugin, port = package_name, 3000
        except:
            plugin, port = 'unknown', 3000
    else:
        plugin, port = 'unknown', 3000
    
    # Check server
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], 
                               capture_output=True, text=True, timeout=2)
        server_running = bool(result.stdout.strip())
    except:
        server_running = False
    
    # Check response
    server_responding = False
    if server_running:
        try:
            import urllib.request
            response = urllib.request.urlopen(f'http://localhost:{port}/main/', timeout=2)
            server_responding = response.status == 200
        except:
            pass
    
    # Return status
    if server_responding:
        return f"✅ {plugin}:{port} WORKING"
    elif server_running:
        return f"🔄 {plugin}:{port} STARTING"
    else:
        return f"❌ {plugin}:{port} DOWN - run: python3 ../fix_everything.py"

if __name__ == "__main__":
    print(get_status())