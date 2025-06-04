#!/usr/bin/env python3
"""
🤖 Autonomous Development Starter for Claude Code
Minimal but functional autonomous development workflow with smart port management

Usage:
    python3 autonomous_dev_starter.py test
    python3 autonomous_dev_starter.py console
    python3 autonomous_dev_starter.py generate "dog barking"
    python3 autonomous_dev_starter.py  # Auto-starts dev server with port management
"""

import subprocess
import time
import json
import urllib.request
import urllib.parse
import sys
import asyncio
import websockets
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import our health checker
try:
    from plugin_health_check import PluginHealthChecker
except ImportError:
    PluginHealthChecker = None

class SmartPortManager:
    """Handles intelligent port allocation and conflict resolution"""
    
    def __init__(self, project_name="AI SFX Generator", preferred_port=9230):
        self.project_name = project_name
        self.preferred_port = preferred_port
        self.registry_file = Path.home() / ".adobe_port_registry.json"
        self.port_range = (9230, 9250)  # Extended range for fallbacks
        
    def _is_port_in_use(self, port: int) -> bool:
        """Check if a port is actively in use"""
        try:
            # Try to connect to the port
            result = subprocess.run(
                ['lsof', '-i', f':{port}'], 
                capture_output=True, 
                text=True, 
                timeout=2
            )
            return result.returncode == 0
        except:
            # Fallback: try to open a connection
            try:
                urllib.request.urlopen(f'http://localhost:{port}', timeout=1)
                return True
            except:
                return False
    
    def _load_registry(self) -> Dict:
        """Load port registry"""
        if self.registry_file.exists():
            try:
                with open(self.registry_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def _save_registry(self, registry: Dict):
        """Save port registry"""
        try:
            with open(self.registry_file, 'w') as f:
                json.dump(registry, f, indent=2)
        except Exception as e:
            print(f"⚠️ Could not save registry: {e}")
    
    def find_available_port(self) -> int:
        """Find an available port, starting with preferred"""
        registry = self._load_registry()
        
        # First, try the preferred port
        if not self._is_port_in_use(self.preferred_port):
            print(f"✅ Preferred port {self.preferred_port} is available")
            return self.preferred_port
        
        # Check if our project already has an allocated port
        for port_str, info in registry.items():
            if info.get('project') == self.project_name:
                port = int(port_str)
                if not self._is_port_in_use(port):
                    print(f"✅ Previously allocated port {port} is available")
                    return port
        
        # Find a new available port in range
        for port in range(self.port_range[0], self.port_range[1] + 1):
            if not self._is_port_in_use(port):
                print(f"✅ Found available port {port}")
                # Update registry
                registry[str(port)] = {
                    'project': self.project_name,
                    'status': 'reserved',
                    'last_seen': time.strftime('%Y-%m-%d %H:%M:%S')
                }
                self._save_registry(registry)
                return port
        
        # If all else fails, force use preferred port
        print(f"⚠️ No free ports found, attempting to use preferred port {self.preferred_port}")
        return self.preferred_port
    
    def release_port(self, port: int):
        """Release a port from the registry"""
        registry = self._load_registry()
        port_str = str(port)
        if port_str in registry:
            del registry[port_str]
            self._save_registry(registry)
            print(f"🔓 Released port {port}")

class AutonomousDevStarter:
    def __init__(self, debug_port=None):
        self.port_manager = SmartPortManager()
        self.debug_port = debug_port or self.port_manager.find_available_port()
        self.console_ws = None
        self.message_id = 1000
        self.dev_process = None
        
    def ensure_dev_server_running(self) -> bool:
        """Ensure the development server is running"""
        # Check if dev server is already running
        try:
            response = urllib.request.urlopen(f'http://localhost:3001/main/', timeout=2)
            if response.status == 200:
                print("✅ Dev server already running")
                return True
        except:
            pass
        
        # Start dev server
        print("🚀 Starting development server...")
        try:
            # Kill any existing processes on our ports
            self._kill_port_processes([3001, 5001, self.debug_port])
            
            # Start the dev server
            self.dev_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=Path(__file__).parent,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for server to start
            for i in range(30):  # 30 second timeout
                try:
                    response = urllib.request.urlopen(f'http://localhost:3001/main/', timeout=1)
                    if response.status == 200:
                        print("✅ Dev server started successfully")
                        return True
                except:
                    time.sleep(1)
                    
                # Check if process died
                if self.dev_process.poll() is not None:
                    stdout, stderr = self.dev_process.communicate()
                    print(f"❌ Dev server failed to start:")
                    print(f"STDOUT: {stdout}")
                    print(f"STDERR: {stderr}")
                    return False
            
            print("❌ Dev server startup timeout")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start dev server: {e}")
            return False
    
    def _kill_port_processes(self, ports: List[int]):
        """Kill any processes using specified ports"""
        for port in ports:
            try:
                # Find process using the port
                result = subprocess.run(
                    ['lsof', '-t', '-i', f':{port}'],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        try:
                            subprocess.run(['kill', '-9', pid], check=True)
                            print(f"🔪 Killed process {pid} on port {port}")
                        except:
                            pass
            except:
                pass
    
    def wait_for_plugin_load(self, timeout=30) -> bool:
        """Wait for plugin to appear in Chrome DevTools"""
        print(f"⏳ Waiting for plugin to load...")
        
        # Use health checker if available
        if PluginHealthChecker:
            health_checker = PluginHealthChecker(debug_port=self.debug_port)
            
            # Give it a few seconds for initial load
            time.sleep(3)
            
            # Use the health checker to ensure plugin is healthy
            if health_checker.ensure_healthy():
                # Update our debug port in case it changed
                self.debug_port = health_checker.debug_port
                return True
            else:
                return False
        
        # Fallback to old method
        for i in range(timeout):
            try:
                response = urllib.request.urlopen(f'http://localhost:{self.debug_port}/json')
                targets = json.loads(response.read().decode())
                
                for target in targets:
                    if 'AI SFX Generator' in target.get('title', ''):
                        print(f"✅ Plugin loaded successfully on port {self.debug_port}")
                        print(f"🔗 Debug URL: http://localhost:{self.debug_port}")
                        return True
                        
            except Exception as e:
                if i == 0:
                    print(f"⏳ Waiting for debug port {self.debug_port} to become available...")
            
            time.sleep(1)
        
        print(f"❌ Plugin failed to load on port {self.debug_port}")
        return False
        
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
    
    def cleanup(self):
        """Clean up resources"""
        if self.dev_process and self.dev_process.poll() is None:
            print("🛑 Stopping dev server...")
            self.dev_process.terminate()
            try:
                self.dev_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.dev_process.kill()
        
        # Release port
        self.port_manager.release_port(self.debug_port)

# CLI Interface
async def main():
    dev_controller = AutonomousDevStarter()
    
    # Always ensure dev server is running first
    if not dev_controller.ensure_dev_server_running():
        print("❌ Failed to start development server")
        return
    
    # Wait for plugin to load
    if not dev_controller.wait_for_plugin_load():
        print("❌ Plugin failed to load")
        print("\n💡 Try these steps:")
        print("1. Open Adobe Premiere Pro")
        print("2. Go to Window > Extensions > AI SFX Generator (Bolt)")
        print("3. If not visible, restart Premiere and try again")
        return
    
    # If no command specified, just start and monitor
    if len(sys.argv) < 2:
        print(f"\n✅ Plugin is running at http://localhost:{dev_controller.debug_port}")
        print("\n📋 Available commands:")
        print("  python3 autonomous_dev_starter.py test      - Run tests")
        print("  python3 autonomous_dev_starter.py console   - Monitor console")
        print("  python3 autonomous_dev_starter.py generate \"prompt\" - Generate SFX")
        print("\nPress Ctrl+C to stop the dev server")
        
        try:
            # Keep running until interrupted
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...")
            dev_controller.cleanup()
        return
    
    command = sys.argv[1]
    
    try:
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
    
    finally:
        dev_controller.cleanup()

if __name__ == "__main__":
    asyncio.run(main())