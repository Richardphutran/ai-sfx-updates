#!/usr/bin/env python3
"""
Quick Claude Tools for AI-SFX-Bolt
Project-specific shortcuts to central automation
"""

import sys
import subprocess
from pathlib import Path

# Central automation path
CENTRAL_AUTOMATION = Path("/Users/richardtran/Documents/Code/MultiPluginSystem-Central/automation-tools")

def main():
    if len(sys.argv) < 2:
        print("🛠️  AI-SFX-Bolt - Claude Tools")
        print()
        print("Quick Commands:")
        print("  ./claude-tools.py search <topic>          # Search knowledge base")  
        print("  ./claude-tools.py context                 # Show session context")
        print("  ./claude-tools.py start                   # Start session with context")
        print("  ./claude-tools.py optimize                # Show optimization tips")
        return
    
    command = sys.argv[1]
    
    if command == "search":
        if len(sys.argv) >= 3:
            query = " ".join(sys.argv[2:])
            subprocess.run([sys.executable, CENTRAL_AUTOMATION / "smart-knowledge-lookup.py", query])
    
    elif command == "context":
        subprocess.run([sys.executable, CENTRAL_AUTOMATION / "context-management-system.py", "summary"])
    
    elif command == "start":
        print("🎯 Starting Claude session with optimized context...")
        subprocess.run([sys.executable, CENTRAL_AUTOMATION / "context-management-system.py", "summary"])
        print("\n💡 Remember: ALWAYS use parallel tool execution!")
        print("✅ Use automation/smart-knowledge-lookup.py for knowledge access")
    
    elif command == "optimize":
        subprocess.run([sys.executable, CENTRAL_AUTOMATION / "claude-automation.py", "optimize"])
    
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main()
