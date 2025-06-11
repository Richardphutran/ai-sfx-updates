#!/usr/bin/env python3
"""
Autonomous Plugin Tester - Complete UI Interaction & Testing System
Provides reliable plugin testing and interaction for Claude sessions
"""

import asyncio
import json
import os
import subprocess
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
import sys

try:
    import websockets
    import aiohttp
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "aiohttp", "--break-system-packages", "--quiet"])
    import websockets
    import aiohttp

class PluginTester:
    def __init__(self, plugin_config=None):
        # Default configs for each plugin
        self.configs = {
            'ai-text-editor': {
                'dev_port': 3039,
                'debug_port': 9230,
                'plugin_id': 'ai-text-editor',
                'test_selectors': {
                    'main_button': 'button[data-testid="analyze-timeline"]',
                    'file_input': 'input[type="file"]',
                    'chat_input': 'textarea[placeholder*="chat"]'
                }
            },
            'ai-video-namer': {
                'dev_port': 3000,
                'debug_port': 9876,
                'plugin_id': 'ai-video-namer',
                'test_selectors': {
                    'main_button': 'button[data-testid="analyze-clips"]',
                    'drop_zone': '[data-testid="drop-zone"]',
                    'ollama_status': '[data-testid="ollama-status"]'
                }
            },
            'ai-sfx': {
                'dev_port': 3030,
                'debug_port': 9230,
                'plugin_id': 'ai-sfx',
                'test_selectors': {
                    'main_button': 'button[data-testid="generate-sfx"]',
                    'search_input': 'input[placeholder*="search"]',
                    'timeline_status': '[data-testid="timeline-status"]'
                }
            },
            'ai-podcast': {
                'dev_port': 3003,
                'debug_port': 9231,
                'plugin_id': 'ai-podcast',
                'test_selectors': {
                    'main_button': 'button[data-testid="analyze-timeline"]',
                    'speaker_selector': '[data-testid="speaker-selector"]',
                    'export_button': 'button[data-testid="export-podcast"]'
                }
            }
        }
        
        self.config = plugin_config or self.auto_detect_plugin()
        
    def auto_detect_plugin(self):
        """Auto-detect which plugin we're working with based on current directory"""
        cwd = os.getcwd()
        
        if 'Text Editor' in cwd or 'Test-cwyyx8-BOLT' in cwd:
            return self.configs['ai-text-editor']
        elif 'Video Namer' in cwd:
            return self.configs['ai-video-namer']
        elif 'SFX' in cwd or 'AI-SFX' in cwd:
            return self.configs['ai-sfx']
        elif 'Podcast' in cwd:
            return self.configs['ai-podcast']
        else:
            # Default to AI Text Editor
            return self.configs['ai-text-editor']
    
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        icon = "🔍" if level == "INFO" else "✅" if level == "SUCCESS" else "❌" if level == "ERROR" else "⚠️"
        print(f"[{timestamp}] {icon} {message}")
    
    async def get_debug_websocket_url(self):
        """Get WebSocket URL for Chrome DevTools"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{self.config['debug_port']}/json") as response:
                    if response.status == 200:
                        tabs = await response.json()
                        for tab in tabs:
                            if self.config['plugin_id'] in tab.get('url', '') or 'main' in tab.get('url', ''):
                                return tab.get('webSocketDebuggerUrl')
            return None
        except Exception as e:
            self.log(f"Failed to get WebSocket URL: {e}", "ERROR")
            return None
    
    async def execute_js(self, javascript_code, timeout=10):
        """Execute JavaScript in plugin via Chrome DevTools Protocol"""
        ws_url = await self.get_debug_websocket_url()
        if not ws_url:
            self.log("No WebSocket connection available", "ERROR")
            return None
        
        try:
            async with websockets.connect(ws_url) as websocket:
                # Enable Runtime domain
                await websocket.send(json.dumps({
                    "id": 1,
                    "method": "Runtime.enable"
                }))
                await websocket.recv()
                
                # Execute JavaScript
                await websocket.send(json.dumps({
                    "id": 2,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": javascript_code,
                        "returnByValue": True,
                        "awaitPromise": True
                    }
                }))
                
                result = await asyncio.wait_for(websocket.recv(), timeout=timeout)
                response = json.loads(result)
                
                if 'result' in response and 'result' in response['result']:
                    return response['result']['result'].get('value')
                elif 'exceptionDetails' in response.get('result', {}):
                    error = response['result']['exceptionDetails']['exception']['description']
                    self.log(f"JavaScript error: {error}", "ERROR")
                    return None
                
                return response
                
        except Exception as e:
            self.log(f"JavaScript execution failed: {e}", "ERROR")
            return None
    
    async def click_element(self, selector, wait_time=2):
        """Click an element by CSS selector"""
        js_code = f"""
        (async () => {{
            const element = document.querySelector('{selector}');
            if (element) {{
                element.click();
                return {{ success: true, message: 'Element clicked successfully' }};
            }} else {{
                return {{ success: false, message: 'Element not found: {selector}' }};
            }}
        }})()
        """
        
        result = await self.execute_js(js_code)
        await asyncio.sleep(wait_time)
        return result
    
    async def type_text(self, selector, text, clear_first=True):
        """Type text into an input element"""
        clear_code = "element.value = '';" if clear_first else ""
        
        js_code = f"""
        (async () => {{
            const element = document.querySelector('{selector}');
            if (element) {{
                element.focus();
                {clear_code}
                element.value = '{text}';
                element.dispatchEvent(new Event('input', {{ bubbles: true }}));
                element.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return {{ success: true, message: 'Text entered successfully' }};
            }} else {{
                return {{ success: false, message: 'Input element not found: {selector}' }};
            }}
        }})()
        """
        
        return await self.execute_js(js_code)
    
    async def wait_for_element(self, selector, timeout=10, check_interval=0.5):
        """Wait for an element to appear"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            js_code = f"document.querySelector('{selector}') !== null"
            result = await self.execute_js(js_code)
            
            if result:
                return True
            
            await asyncio.sleep(check_interval)
        
        return False
    
    async def get_element_text(self, selector):
        """Get text content of an element"""
        js_code = f"""
        (async () => {{
            const element = document.querySelector('{selector}');
            return element ? element.textContent.trim() : null;
        }})()
        """
        
        return await self.execute_js(js_code)
    
    async def check_plugin_health(self):
        """Comprehensive plugin health check"""
        self.log("Starting plugin health check...")
        
        health_report = {
            'dev_server': False,
            'debug_port': False,
            'plugin_loaded': False,
            'ui_elements': False,
            'extendscript': False
        }
        
        # Check dev server
        try:
            urllib.request.urlopen(f"http://localhost:{self.config['dev_port']}/main/", timeout=3)
            health_report['dev_server'] = True
            self.log("Dev server: ✅ Running", "SUCCESS")
        except:
            self.log("Dev server: ❌ Not accessible", "ERROR")
        
        # Check debug port
        ws_url = await self.get_debug_websocket_url()
        if ws_url:
            health_report['debug_port'] = True
            health_report['plugin_loaded'] = True
            self.log("Debug port: ✅ Accessible", "SUCCESS")
            self.log("Plugin: ✅ Loaded in Premiere", "SUCCESS")
            
            # Check UI elements
            js_code = f"""
            (async () => {{
                const elements = {list(self.config['test_selectors'].values())};
                let found = 0;
                let total = elements.length;
                
                elements.forEach(selector => {{
                    if (document.querySelector(selector)) found++;
                }});
                
                return {{ found, total, percentage: Math.round((found/total) * 100) }};
            }})()
            """
            
            ui_result = await self.execute_js(js_code)
            if ui_result and ui_result.get('found', 0) > 0:
                health_report['ui_elements'] = True
                self.log(f"UI Elements: ✅ {ui_result['found']}/{ui_result['total']} found ({ui_result['percentage']}%)", "SUCCESS")
            else:
                self.log("UI Elements: ❌ Core elements missing", "ERROR")
            
            # Check ExtendScript communication
            extendscript_test = """
            (async () => {{
                try {{
                    // Test if CSInterface is available (CEP environment)
                    if (typeof CSInterface !== 'undefined') {{
                        return {{ extendscript: true, cep: true }};
                    }} else if (typeof evalTS !== 'undefined') {{
                        // Test Bolt CEP evalTS function
                        return {{ extendscript: true, bolt: true }};
                    }} else {{
                        return {{ extendscript: false, error: 'No ExtendScript interface found' }};
                    }}
                }} catch (e) {{
                    return {{ extendscript: false, error: e.message }};
                }}
            }})()
            """
            
            es_result = await self.execute_js(extendscript_test)
            if es_result and es_result.get('extendscript'):
                health_report['extendscript'] = True
                bridge_type = "Bolt CEP" if es_result.get('bolt') else "Standard CEP"
                self.log(f"ExtendScript: ✅ Available ({bridge_type})", "SUCCESS")
            else:
                error = es_result.get('error', 'Unknown') if es_result else 'No response'
                self.log(f"ExtendScript: ❌ Not available ({error})", "ERROR")
        else:
            self.log("Debug port: ❌ Not accessible", "ERROR")
            self.log("Plugin: ❌ Not loaded in Premiere", "ERROR")
        
        return health_report
    
    async def test_main_functionality(self):
        """Test main plugin functionality"""
        self.log(f"Testing {self.config['plugin_id']} main functionality...")
        
        # Wait for main button to be available
        main_selector = self.config['test_selectors']['main_button']
        if await self.wait_for_element(main_selector, timeout=5):
            self.log("Main button found", "SUCCESS")
            
            # Click main button
            click_result = await self.click_element(main_selector)
            if click_result and click_result.get('success'):
                self.log("Main button clicked successfully", "SUCCESS")
                
                # Wait for any response/feedback
                await asyncio.sleep(2)
                
                # Check for error messages
                error_check = """
                (async () => {{
                    const errors = document.querySelectorAll('.error, .error-message, [class*="error"]');
                    return Array.from(errors).map(el => el.textContent.trim()).filter(text => text.length > 0);
                }})()
                """
                
                errors = await self.execute_js(error_check)
                if errors and len(errors) > 0:
                    self.log(f"Errors found: {errors}", "ERROR")
                    return False
                else:
                    self.log("No errors detected after interaction", "SUCCESS")
                    return True
            else:
                self.log("Failed to click main button", "ERROR")
                return False
        else:
            self.log("Main button not found", "ERROR")
            return False
    
    def reload_plugin(self):
        """Reload plugin using AppleScript"""
        script = '''
        tell application "System Events"
            tell process "Adobe Premiere Pro 2025"
                try
                    set frontmost to true
                    delay 1
                    key code 15 using {command down}  -- Cmd+R to reload
                    delay 2
                    return "SUCCESS"
                on error errMsg
                    return "ERROR: " & errMsg
                end try
            end tell
        end tell
        '''
        
        try:
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=15)
            success = "SUCCESS" in result.stdout
            self.log(f"Plugin reload: {'✅' if success else '❌'} {result.stdout.strip()}")
            return success
        except:
            self.log("Plugin reload failed", "ERROR")
            return False
    
    async def full_test_cycle(self):
        """Complete autonomous test cycle"""
        self.log(f"Starting full test cycle for {self.config['plugin_id']}")
        
        # 1. Health check
        health = await self.check_plugin_health()
        
        # 2. If plugin not loaded, try reload
        if not health['plugin_loaded']:
            self.log("Plugin not loaded, attempting reload...")
            if self.reload_plugin():
                await asyncio.sleep(3)
                health = await self.check_plugin_health()
        
        # 3. Test main functionality
        if health['plugin_loaded'] and health['ui_elements']:
            functionality_test = await self.test_main_functionality()
            
            return {
                'health': health,
                'functionality': functionality_test,
                'autonomous_success': all(health.values()) and functionality_test
            }
        else:
            return {
                'health': health,
                'functionality': False,
                'autonomous_success': False
            }

# CLI Interface
async def main():
    if len(sys.argv) > 1:
        command = sys.argv[1]
        plugin_type = sys.argv[2] if len(sys.argv) > 2 else None
        
        tester = PluginTester()
        if plugin_type and plugin_type in tester.configs:
            tester.config = tester.configs[plugin_type]
        
        if command == "health":
            health = await tester.check_plugin_health()
            print(json.dumps(health, indent=2))
        elif command == "test":
            result = await tester.full_test_cycle()
            print(json.dumps(result, indent=2))
        elif command == "click":
            selector = sys.argv[3] if len(sys.argv) > 3 else tester.config['test_selectors']['main_button']
            result = await tester.click_element(selector)
            print(json.dumps(result, indent=2))
        elif command == "reload":
            tester.reload_plugin()
        else:
            print("Usage: python autonomous_plugin_tester.py [health|test|click|reload] [plugin_type] [selector]")
    else:
        # Interactive mode
        tester = PluginTester()
        result = await tester.full_test_cycle()
        
        if result['autonomous_success']:
            print("🎉 Plugin is fully autonomous and functional!")
        else:
            print("⚠️ Plugin needs attention:")
            for check, status in result['health'].items():
                print(f"  {check}: {'✅' if status else '❌'}")

if __name__ == "__main__":
    asyncio.run(main())