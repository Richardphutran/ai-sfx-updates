#!/usr/bin/env python3
"""
Unified Server Tool - Replaces all scattered server/reload/restart files
Single tool for server management
"""

import subprocess
import sys
import time
from pathlib import Path

def start_server():
    """Start development server"""
    print("🚀 Starting server...")
    subprocess.run(["npm", "run", "dev"])

def restart_server():
    """Restart server"""
    print("🔄 Restarting server...")
    subprocess.run(["pkill", "-f", "vite"])
    time.sleep(1)
    start_server()

def reload_plugin():
    """Reload CEP plugin"""
    print("🔄 Reloading plugin...")
    # Plugin reload logic here

def server_status():
    """Check server status"""
    print("📊 Checking server status...")
    # Status check logic here

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "start":
            start_server()
        elif action == "restart":
            restart_server()
        elif action == "reload":
            reload_plugin()
        elif action == "status":
            server_status()
        else:
            print("Usage: python3 unified_server.py [start|restart|reload|status]")
    else:
        print("Server management tool")
        print("Commands: start, restart, reload, status")
