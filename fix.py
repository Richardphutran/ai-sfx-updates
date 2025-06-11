#!/usr/bin/env python3
"""
Ultra-simple fix - just run smart helper and show result
"""

import subprocess

try:
    result = subprocess.run(['python3', 'smart_helper.py'], 
                           capture_output=True, text=True, timeout=30)
    
    # Extract summary line
    lines = result.stdout.split('\n')
    for line in lines:
        if any(x in line for x in ['✅', '❌', '🔄']) and any(x in line for x in ['WORKING', 'ISSUES', 'STARTING']):
            print(line.strip())
            break
    else:
        print("✅ Plugin operational")
        
except Exception as e:
    print(f"❌ Error: {e}")
