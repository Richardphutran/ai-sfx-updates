#!/usr/bin/env python3
"""
CRITICAL: Ensure AI SFX Generator NEVER shows wrong plugin content
This script guarantees the correct plugin loads every time
"""

import os
import time
import subprocess
import sys

def kill_other_plugins():
    """Kill any other CEP dev servers that might interfere"""
    print("🔪 Killing any conflicting plugin servers...")
    
    # Kill any vite processes on other ports
    other_ports = [3000, 3001, 3002, 3003, 3004, 3005]  # Common CEP ports
    for port in other_ports:
        try:
            # Find process using the port
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'],
                capture_output=True,
                text=True
            )
            if result.stdout.strip():
                pid = result.stdout.strip()
                subprocess.run(['kill', '-9', pid])
                print(f"  ✅ Killed process on port {port}")
        except:
            pass

def ensure_ai_sfx_only():
    """Ensure ONLY AI SFX Generator is running"""
    print("\n🛡️ Ensuring AI SFX Generator exclusivity...")
    
    # Check if our port is in use
    result = subprocess.run(
        ['lsof', '-ti', ':3030'],
        capture_output=True,
        text=True
    )
    
    if result.stdout.strip():
        print("  ⚠️  Port 3030 in use, clearing it...")
        subprocess.run(['pkill', '-f', 'vite'])
        time.sleep(2)
    
    # Clear any CEP cache that might show wrong plugin
    cache_paths = [
        os.path.expanduser("~/Library/Application Support/Adobe/CEP/cache"),
        os.path.expanduser("~/Library/Application Support/Adobe/Common/Media Cache"),
        os.path.expanduser("~/Library/Caches/CSXS/cep_cache")
    ]
    
    for cache_path in cache_paths:
        if os.path.exists(cache_path):
            try:
                subprocess.run(['rm', '-rf', cache_path])
                print(f"  ✅ Cleared cache: {cache_path}")
            except:
                pass

def start_ai_sfx():
    """Start AI SFX Generator with guaranteed identity"""
    print("\n🚀 Starting AI SFX Generator...")
    
    # Set environment to ensure correct plugin
    os.environ['CEP_PLUGIN_ID'] = 'com.ai.sfx.generator'
    os.environ['CEP_PLUGIN_PORT'] = '3030'
    os.environ['CEP_PLUGIN_NAME'] = 'AI SFX Generator'
    
    # Start the dev server
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run(['npm', 'run', 'dev'])

if __name__ == "__main__":
    print("🔒 AI SFX GENERATOR IDENTITY PROTECTION")
    print("=" * 40)
    
    kill_other_plugins()
    ensure_ai_sfx_only()
    start_ai_sfx()