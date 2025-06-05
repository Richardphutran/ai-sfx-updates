#!/usr/bin/env python3
"""
Safe Plugin Restart - Only soft restart, no Premiere killing
"""

import urllib.request
import json
import sys
import time

def check_plugin_alive(port):
    """Check if plugin is responding"""
    try:
        response = urllib.request.urlopen(f"http://localhost:{port}", timeout=2)
        return response.status == 200
    except:
        return False

def soft_restart_plugin(port):
    """Try to reload plugin via Chrome DevTools - SAFE method"""
    try:
        print(f"🔄 Attempting soft restart on port {port}...")
        
        # Check if plugin is alive first
        if not check_plugin_alive(port):
            print(f"❌ Plugin on port {port} not responding")
            return False
        
        # Get DevTools targets
        targets_url = f"http://localhost:{port}/json"
        response = urllib.request.urlopen(targets_url, timeout=3)
        targets = json.loads(response.read().decode())
        
        if not targets:
            print("❌ No DevTools targets found")
            return False
        
        print(f"📋 Found {len(targets)} DevTools target(s)")
        
        # Method 1: Try console command execution
        try:
            console_url = f"http://localhost:{port}/json/console/input"
            console_data = json.dumps({"input": "location.reload();"}).encode()
            
            req = urllib.request.Request(
                console_url,
                data=console_data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(req, timeout=3)
            
            if response.status == 200:
                print("✅ Soft restart via console successful!")
                return True
        except Exception as e:
            print(f"⚠️ Console method failed: {e}")
        
        # Method 2: Try runtime evaluation
        try:
            eval_url = f"http://localhost:{port}/json/runtime/evaluate"
            eval_data = json.dumps({
                "expression": "window.location.reload();",
                "returnByValue": False,
                "generatePreview": False
            }).encode()
            
            req = urllib.request.Request(
                eval_url,
                data=eval_data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(req, timeout=3)
            
            if response.status == 200:
                print("✅ Soft restart via runtime evaluation successful!")
                return True
        except Exception as e:
            print(f"⚠️ Runtime evaluation method failed: {e}")
        
        print("❌ All soft restart methods failed")
        return False
        
    except Exception as e:
        print(f"❌ Soft restart failed: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 safe_plugin_restart.py <port>")
        print("Example: python3 safe_plugin_restart.py 9230")
        return
    
    port = int(sys.argv[1])
    
    print(f"🚀 Safe Plugin Restart - Port {port}")
    print("=" * 40)
    
    # First check if plugin is alive
    if not check_plugin_alive(port):
        print(f"❌ Plugin on port {port} is not responding")
        print("💡 Make sure Premiere Pro is running and plugin is loaded")
        return
    
    print(f"✅ Plugin on port {port} is responding")
    
    # Try soft restart
    if soft_restart_plugin(port):
        print("🎉 Plugin restarted successfully!")
        
        # Wait a moment and verify it's still alive
        time.sleep(2)
        if check_plugin_alive(port):
            print("✅ Plugin confirmed alive after restart")
        else:
            print("⚠️ Plugin may have crashed during restart")
    else:
        print("❌ Soft restart failed")
        print("💡 You may need to manually reload the plugin in Premiere")

if __name__ == "__main__":
    main()