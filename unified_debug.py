#!/usr/bin/env python3
"""
Unified Debug Tool - Replaces all scattered debug_*.py files
Single tool for all debugging needs
"""

import subprocess
import sys
from pathlib import Path

def debug_console():
    """Debug console logs"""
    print("🔍 Debugging Console...")
    # Console debug logic here

def debug_timeline():
    """Debug timeline issues"""
    print("🔍 Debugging Timeline...")
    # Timeline debug logic here

def debug_extendscript():
    """Debug ExtendScript issues"""
    print("🔍 Debugging ExtendScript...")
    # ExtendScript debug logic here

def debug_all():
    """Run all debug checks"""
    debug_funcs = [
        ("Console", debug_console),
        ("Timeline", debug_timeline),
        ("ExtendScript", debug_extendscript)
    ]
    
    for name, func in debug_funcs:
        print(f"\n--- {name} Debug ---")
        func()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_type = sys.argv[1]
        if debug_type == "console":
            debug_console()
        elif debug_type == "timeline":
            debug_timeline()
        elif debug_type == "extendscript":
            debug_extendscript()
        else:
            print("Usage: python3 unified_debug.py [console|timeline|extendscript]")
    else:
        debug_all()
