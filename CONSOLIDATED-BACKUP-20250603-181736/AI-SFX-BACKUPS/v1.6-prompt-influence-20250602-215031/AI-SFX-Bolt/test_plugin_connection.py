#!/usr/bin/env python3
"""
Test Plugin Connection - Safe testing without restarting
"""

import urllib.request
import json
import time

def test_plugin_connection(port=9230):
    """Test if plugin is alive and get its info"""
    try:
        print(f"🔍 Testing connection to port {port}...")
        
        # Test basic connection
        response = urllib.request.urlopen(f"http://localhost:{port}", timeout=5)
        if response.status == 200:
            print("✅ Basic HTTP connection successful")
        
        # Get DevTools info
        targets_response = urllib.request.urlopen(f"http://localhost:{port}/json", timeout=5)
        targets = json.loads(targets_response.read().decode())
        
        print(f"📋 DevTools targets found: {len(targets)}")
        
        for i, target in enumerate(targets):
            print(f"  Target {i+1}:")
            print(f"    Title: {target.get('title', 'Unknown')}")
            print(f"    Type: {target.get('type', 'Unknown')}")
            print(f"    URL: {target.get('url', 'Unknown')}")
            print(f"    ID: {target.get('id', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def wait_for_plugin(port=9230, max_wait=30):
    """Wait for plugin to come online"""
    print(f"⏳ Waiting for plugin on port {port}...")
    
    for i in range(max_wait):
        try:
            response = urllib.request.urlopen(f"http://localhost:{port}", timeout=2)
            if response.status == 200:
                print(f"✅ Plugin came online after {i+1} seconds")
                return True
        except:
            pass
        
        print(f"⏳ Still waiting... {i+1}/{max_wait}")
        time.sleep(1)
    
    print(f"❌ Plugin didn't come online after {max_wait} seconds")
    return False

if __name__ == "__main__":
    print("🚀 AI SFX Plugin Connection Test")
    print("=" * 40)
    
    # Test current connection
    if test_plugin_connection(9230):
        print("\n🎉 AI SFX Generator plugin is working!")
    else:
        print("\n⚠️ Plugin not responding. Waiting for it to come online...")
        if wait_for_plugin(9230):
            print("\n🎉 Plugin is now online!")
            test_plugin_connection(9230)
        else:
            print("\n❌ Plugin never came online")
            print("💡 Check if Premiere Pro is running and plugin is loaded")