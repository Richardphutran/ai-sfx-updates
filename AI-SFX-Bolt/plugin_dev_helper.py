#!/usr/bin/env python3
"""
Plugin Development Helper - Simplified Interface for Claude Sessions
Provides 5-10 token commands for autonomous plugin development
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path

# Import the full autonomous tester
sys.path.append(str(Path(__file__).parent.parent))
from autonomous_plugin_tester import PluginTester

class DevHelper:
    def __init__(self):
        self.tester = PluginTester()
        
    def start_dev(self):
        """Start development server (5 tokens: python3 plugin_dev_helper.py start)"""
        print("🚀 Starting development server...")
        
        # Check which package manager and start command to use
        if os.path.exists('package.json'):
            with open('package.json', 'r') as f:
                import json
                package_data = json.load(f)
                scripts = package_data.get('scripts', {})
                
                if 'dev' in scripts:
                    cmd = ['npm', 'run', 'dev']
                elif 'start' in scripts:
                    cmd = ['npm', 'run', 'start']
                else:
                    cmd = ['npm', 'run', 'dev']  # Default
        else:
            cmd = ['npm', 'run', 'dev']  # Default
        
        # Start in background
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("✅ Dev server started")
            return True
        except Exception as e:
            print(f"❌ Failed to start dev server: {e}")
            return False
    
    async def quick_test(self):
        """Quick functionality test (5 tokens: python3 plugin_dev_helper.py test)"""
        print("🧪 Running quick test...")
        
        health = await self.tester.check_plugin_health()
        
        # Simple pass/fail based on core functionality
        critical_checks = ['dev_server', 'debug_port', 'plugin_loaded']
        passed = sum(health[check] for check in critical_checks)
        
        if passed >= 2:  # At least 2 of 3 critical checks pass
            print("✅ Plugin working")
            return True
        else:
            print("❌ Plugin needs attention")
            # Show what needs fixing
            if not health['dev_server']:
                print("  Fix: Start dev server")
            if not health['debug_port']:
                print("  Fix: Check debug port")
            if not health['plugin_loaded']:
                print("  Fix: Reload plugin in Premiere")
            return False
    
    def quick_reload(self):
        """Quick plugin reload (5 tokens: python3 plugin_dev_helper.py reload)"""
        print("🔄 Reloading plugin...")
        success = self.tester.reload_plugin()
        if success:
            print("✅ Plugin reloaded")
        else:
            print("❌ Reload failed")
        return success
    
    async def auto_fix(self):
        """Autonomous fix attempt (10 tokens: python3 plugin_dev_helper.py fix)"""
        print("🔧 Auto-fixing plugin issues...")
        
        # Check what's wrong
        health = await self.tester.check_plugin_health()
        
        fixed = []
        
        # Fix dev server if needed
        if not health['dev_server']:
            print("  🔧 Starting dev server...")
            if self.start_dev():
                fixed.append("dev_server")
                await asyncio.sleep(3)  # Wait for server to start
        
        # Fix plugin loading if needed
        if not health['plugin_loaded']:
            print("  🔧 Reloading plugin...")
            if self.quick_reload():
                fixed.append("plugin_reload")
                await asyncio.sleep(2)  # Wait for reload
        
        # Re-test after fixes
        if fixed:
            print(f"✅ Fixed: {', '.join(fixed)}")
            health = await self.tester.check_plugin_health()
            critical_checks = ['dev_server', 'debug_port', 'plugin_loaded']
            passed = sum(health[check] for check in critical_checks)
            
            if passed >= 2:
                print("✅ Plugin now working")
                return True
            else:
                print("⚠️ Some issues remain")
                return False
        else:
            print("⚠️ No fixes applied - check manually")
            return False
    
    async def click_button(self, selector=None):
        """Click main plugin button (10 tokens: python3 plugin_dev_helper.py click)"""
        if not selector:
            selector = self.tester.config['test_selectors']['main_button']
        
        print(f"👆 Clicking button: {selector}")
        result = await self.tester.click_element(selector)
        
        if result and result.get('success'):
            print("✅ Button clicked")
            return True
        else:
            print("❌ Click failed")
            return False

# CLI Interface for 5-10 token commands
async def main():
    helper = DevHelper()
    
    if len(sys.argv) < 2:
        print("Usage: python3 plugin_dev_helper.py [start|test|reload|fix|click]")
        return
    
    command = sys.argv[1]
    
    if command == "start":
        helper.start_dev()
    elif command == "test":
        await helper.quick_test()
    elif command == "reload":
        helper.quick_reload()
    elif command == "fix":
        await helper.auto_fix()
    elif command == "click":
        selector = sys.argv[2] if len(sys.argv) > 2 else None
        await helper.click_button(selector)
    else:
        print("Commands: start, test, reload, fix, click")

if __name__ == "__main__":
    asyncio.run(main())