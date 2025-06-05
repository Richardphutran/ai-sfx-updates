#!/usr/bin/env python3
"""
🤖 Autonomous Development Starter for Claude Code
Minimal but functional autonomous development workflow

Usage:
    python3 autonomous_dev_starter.py test
    python3 autonomous_dev_starter.py console
    python3 autonomous_dev_starter.py generate "dog barking"
"""

import subprocess
import time
import json
import urllib.request
import urllib.parse
import sys
import asyncio
import websockets
from typing import Dict, List, Any, Optional

class AutonomousDevStarter:
    def __init__(self, debug_port=9230):
        self.debug_port = debug_port
        self.console_ws = None
        self.message_id = 1000
        
    async def connect_to_console(self) -> bool:
        """Connect to Chrome DevTools console via WebSocket"""
        try:
            # Get WebSocket URL from Chrome DevTools
            response = urllib.request.urlopen(f'http://localhost:{self.debug_port}/json')
            targets = json.loads(response.read().decode())
            
            # Find the plugin target
            plugin_target = None
            for target in targets:
                if 'AI SFX Generator' in target.get('title', ''):
                    plugin_target = target
                    break
            
            if not plugin_target:
                print("❌ Plugin not found in Chrome DevTools targets")
                return False
            
            ws_url = plugin_target['webSocketDebuggerUrl']
            print(f"🔗 Connecting to: {ws_url}")
            
            self.console_ws = await websockets.connect(ws_url)
            
            # Enable Runtime domain for console access
            await self.send_devtools_command('Runtime.enable')
            print("✅ Connected to plugin console")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to console: {e}")
            return False
    
    async def send_devtools_command(self, method: str, params: Dict = None) -> Dict:
        """Send command to Chrome DevTools"""
        if not self.console_ws:
            raise Exception("Not connected to console")
        
        message = {
            'id': self.message_id,
            'method': method,
            'params': params or {}
        }
        self.message_id += 1
        
        await self.console_ws.send(json.dumps(message))
        response = await self.console_ws.recv()
        return json.loads(response)
    
    async def execute_js_and_capture(self, js_code: str, timeout: float = 5.0) -> Dict:
        """Execute JavaScript and capture result"""
        try:
            # Execute the code
            result = await self.send_devtools_command('Runtime.evaluate', {
                'expression': js_code,
                'returnByValue': True,
                'awaitPromise': True
            })
            
            return {
                'success': True,
                'result': result.get('result', {}).get('value'),
                'error': None
            }
            
        except Exception as e:
            return {
                'success': False,
                'result': None,
                'error': str(e)
            }
    
    def trigger_plugin_action(self, action: str, params: Dict = None) -> bool:
        """Trigger plugin actions via AppleScript"""
        params = params or {}
        
        scripts = {
            'generate_sfx': f'''
                tell application "Adobe Premiere Pro 2025"
                    activate
                    delay 1
                end tell
                
                tell application "System Events"
                    tell process "Adobe Premiere Pro 2025"
                        try
                            -- Find the AI SFX Generator (Bolt) window
                            set pluginWindow to window "AI SFX Generator (Bolt)"
                            
                            -- Click in the text input and type prompt
                            click text field 1 of pluginWindow
                            delay 0.5
                            set value of text field 1 of pluginWindow to "{params.get('prompt', 'test sound')}"
                            
                            -- Press Enter to generate
                            key code 36
                            
                            return "✅ SFX generation triggered"
                        on error errorMessage
                            return "❌ Error: " & errorMessage
                        end try
                    end tell
                end tell
            ''',
            
            'set_in_out_points': '''
                tell application "Adobe Premiere Pro 2025"
                    activate
                    delay 1
                    
                    -- Set in point
                    key code 73 using option down
                    delay 2
                    
                    -- Move playhead forward
                    key code 124 -- Right arrow
                    delay 1
                    
                    -- Set out point  
                    key code 79 using option down
                    
                    return "✅ In/Out points set"
                end tell
            '''
        }
        
        if action not in scripts:
            print(f"❌ Unknown action: {action}")
            return False
        
        try:
            result = subprocess.run([
                'osascript', '-e', scripts[action]
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print(f"✅ Action '{action}': {result.stdout.strip()}")
                return True
            else:
                print(f"❌ Action '{action}' failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ AppleScript error: {e}")
            return False
    
    async def monitor_console_for_results(self, duration: float = 10.0) -> List[Dict]:
        """Monitor console for test results"""
        if not self.console_ws:
            return []
        
        print(f"👁️ Monitoring console for {duration} seconds...")
        
        # Subscribe to console messages
        await self.send_devtools_command('Runtime.consoleAPICalled')
        
        results = []
        start_time = time.time()
        
        try:
            while time.time() - start_time < duration:
                try:
                    message = await asyncio.wait_for(self.console_ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    # Check if it's a console message
                    if data.get('method') == 'Runtime.consoleAPICalled':
                        params = data.get('params', {})
                        args = params.get('args', [])
                        
                        # Extract the message text
                        message_parts = []
                        for arg in args:
                            if 'value' in arg:
                                message_parts.append(str(arg['value']))
                        
                        message_text = ' '.join(message_parts)
                        
                        results.append({
                            'timestamp': time.time(),
                            'level': params.get('type', 'log'),
                            'text': message_text
                        })
                        
                        print(f"📝 Console: {message_text}")
                        
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"⚠️ Error reading console: {e}")
                    break
        
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped by user")
        
        return results
    
    async def test_plugin_functionality(self) -> Dict:
        """Test core plugin functionality"""
        print("🧪 Testing plugin functionality...")
        
        results = {
            'connection_test': False,
            'timeline_detection': False,
            'sfx_generation': False,
            'console_logs': []
        }
        
        # Test 1: Basic connection
        js_result = await self.execute_js_and_capture('typeof csInterface')
        if js_result['success'] and js_result['result'] == 'object':
            results['connection_test'] = True
            print("✅ Plugin connection working")
        else:
            print("❌ Plugin connection failed")
            return results
        
        # Test 2: Timeline detection
        timeline_js = '''
            new Promise((resolve) => {
                csInterface.evalScript('typeof app !== "undefined" && app.project && app.project.activeSequence ? "active" : "none"', (result) => {
                    resolve(result);
                });
            })
        '''
        
        timeline_result = await self.execute_js_and_capture(timeline_js)
        if timeline_result['success'] and timeline_result['result'] == 'active':
            results['timeline_detection'] = True
            print("✅ Timeline detection working")
        else:
            print("❌ Timeline detection failed")
        
        # Test 3: Set up test scenario and generate SFX
        if self.trigger_plugin_action('set_in_out_points'):
            time.sleep(2)  # Wait for in/out points to be set
            
            if self.trigger_plugin_action('generate_sfx', {'prompt': 'test sound for automation'}):
                # Monitor console for results
                console_logs = await self.monitor_console_for_results(15.0)
                results['console_logs'] = console_logs
                
                # Check if generation was successful
                success_indicators = [
                    'Audio placed at',
                    'success: true',
                    'Timeline placement result',
                    'SFX added to timeline'
                ]
                
                for log in console_logs:
                    for indicator in success_indicators:
                        if indicator.lower() in log['text'].lower():
                            results['sfx_generation'] = True
                            print("✅ SFX generation successful")
                            break
                    if results['sfx_generation']:
                        break
                
                if not results['sfx_generation']:
                    print("❌ SFX generation failed or not detected")
        
        return results
    
    async def autonomous_test_cycle(self, change_description: str = "general testing") -> Dict:
        """Run a complete autonomous test cycle"""
        print(f"🤖 Starting autonomous test cycle: {change_description}")
        
        # Connect to console
        if not await self.connect_to_console():
            return {'success': False, 'error': 'Failed to connect to console'}
        
        try:
            # Run functionality tests
            test_results = await self.test_plugin_functionality()
            
            # Analyze results
            success_count = sum(1 for key, value in test_results.items() 
                              if key != 'console_logs' and value)
            total_tests = len([k for k in test_results.keys() if k != 'console_logs'])
            
            success_rate = success_count / total_tests if total_tests > 0 else 0
            
            # Generate report
            report = {
                'success': success_rate >= 0.8,  # 80% success threshold
                'success_rate': f"{success_rate * 100:.1f}%",
                'tests_passed': success_count,
                'total_tests': total_tests,
                'detailed_results': test_results,
                'recommendation': self.get_recommendation(test_results),
                'token_cost': 25  # Estimated token cost for this cycle
            }
            
            return report
            
        finally:
            if self.console_ws:
                await self.console_ws.close()
    
    def get_recommendation(self, test_results: Dict) -> str:
        """Generate recommendation based on test results"""
        if test_results['sfx_generation']:
            return "✅ All core functionality working. Ready for production."
        elif test_results['timeline_detection']:
            return "⚠️ Timeline working but SFX generation issues. Check API key and network."
        elif test_results['connection_test']:
            return "⚠️ Plugin connected but timeline issues. Check Premiere Pro project."
        else:
            return "❌ Basic connection failed. Plugin may not be loaded or dev server down."

# CLI Interface
async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 autonomous_dev_starter.py [test|console|generate] [args...]")
        return
    
    dev_controller = AutonomousDevStarter()
    command = sys.argv[1]
    
    if command == 'test':
        print("🤖 Running autonomous test cycle...")
        result = await dev_controller.autonomous_test_cycle()
        print("\n📊 Test Results:")
        print(json.dumps(result, indent=2))
        
    elif command == 'console':
        print("👁️ Monitoring console output...")
        if await dev_controller.connect_to_console():
            await dev_controller.monitor_console_for_results(30.0)
        
    elif command == 'generate':
        prompt = sys.argv[2] if len(sys.argv) > 2 else "test sound"
        print(f"🎵 Generating SFX: {prompt}")
        
        if await dev_controller.connect_to_console():
            dev_controller.trigger_plugin_action('generate_sfx', {'prompt': prompt})
            await dev_controller.monitor_console_for_results(15.0)
    
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    asyncio.run(main())