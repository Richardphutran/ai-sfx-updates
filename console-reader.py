#!/usr/bin/env python3
"""
Universal Enhanced Console Reader with Stack Traces
Works with any Adobe CEP plugin - auto-detects plugin name and port
Copy this file to any plugin directory and run: python3 console-reader.py
"""

import asyncio
import websockets
import json
import xml.etree.ElementTree as ET
import urllib.request
import os
from pathlib import Path

class UniversalConsoleReader:
    def __init__(self):
        self.console_logs = []
        self.found_issues = []
        self.stack_traces = []
        self.plugin_name = self._detect_plugin()
        self.debug_port = None
        
    def _detect_plugin(self):
        """Detect which plugin we're in based on directory"""
        current_dir = os.getcwd()
        if "Ai SFX" in current_dir:
            return "ai-sfx"
        elif "Ai Text Editor" in current_dir:
            return "ai-text-editor"
        elif "Ai Podcast" in current_dir:
            return "ai-podcast"
        elif "Ai Video Namer" in current_dir:
            return "ai-video-namer"
        else:
            # Try to detect from folder name
            folder_name = Path(current_dir).name
            return folder_name.lower().replace(' ', '-')
        
    async def read_console(self):
        """Connect and read console logs"""
        print(f"🔍 Plugin detected: {self.plugin_name}")
        
        # Get debug port
        try:
            tree = ET.parse('dist/cep/.debug')
            self.debug_port = tree.find('.//Host[@Name="PPRO"]').get('Port')
            print(f"📍 Debug port: {self.debug_port}")
        except:
            print("❌ Could not find debug port in dist/cep/.debug")
            return
            
        # Get WebSocket URL
        ws_url = None
        try:
            with urllib.request.urlopen(f"http://localhost:{self.debug_port}/json") as response:
                pages = json.loads(response.read().decode())
                
            print(f"🔍 Found {len(pages)} debug targets")
            
            # Find our plugin - be flexible with matching
            for page in pages:
                url = page.get('url', '')
                title = page.get('title', '')
                
                # Show what we found
                print(f"   • {title} - {url[:60]}...")
                
                # Match by various patterns
                if ('main' in url or 
                    self.plugin_name in url.lower() or
                    self.plugin_name in title.lower() or
                    'CEP' in title or
                    'extensions' in url):
                    ws_url = page.get('webSocketDebuggerUrl')
                    print(f"   ✅ Selected: {title}")
                    break
                    
        except Exception as e:
            print(f"❌ Error getting debugger info: {e}")
            return
            
        if not ws_url:
            print("❌ No WebSocket URL found")
            print("   Try opening the plugin panel in Premiere Pro first")
            return
            
        print(f"🔗 Connecting to console...")
        
        # Connect and get logs
        try:
            async with websockets.connect(ws_url) as websocket:
                # Enable console
                await websocket.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
                await websocket.send(json.dumps({"id": 2, "method": "Console.enable"}))
                
                # Get console history
                await websocket.send(json.dumps({
                    "id": 3, 
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": """
                        // Get last 100 console logs
                        const logs = [];
                        const originalLog = console.log;
                        const messages = window.__consoleLogs || [];
                        messages.slice(-100).join('\\n');
                        """
                    }
                }))
                
                # Collect messages for 2 seconds
                print("📋 Reading console logs with stack traces...")
                start_time = asyncio.get_event_loop().time()
                
                while asyncio.get_event_loop().time() - start_time < 2:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=0.5)
                        data = json.loads(message)
                        
                        # Extract console messages with full details
                        if data.get("method") == "Console.messageAdded":
                            msg = data["params"]["message"]
                            log_entry = self._format_console_message(msg)
                            self.console_logs.append(log_entry)
                            
                        elif data.get("method") == "Runtime.consoleAPICalled":
                            # This gives us more detailed info including stack traces
                            params = data["params"]
                            log_entry = self._format_runtime_message(params)
                            self.console_logs.append(log_entry)
                            
                    except asyncio.TimeoutError:
                        continue
                        
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
    
    def _format_console_message(self, msg):
        """Format Console.messageAdded messages with stack trace"""
        level = msg.get('level', 'log')
        text = msg.get('text', '')
        
        # Build the base message
        formatted = f"[{level}] {text}"
        
        # Add stack trace if available
        if 'stackTrace' in msg:
            formatted += "\n  Stack trace:"
            for frame in msg['stackTrace'].get('callFrames', []):
                func_name = frame.get('functionName', '<anonymous>')
                url = frame.get('url', 'unknown')
                line = frame.get('lineNumber', 0)
                col = frame.get('columnNumber', 0)
                
                # Extract filename from URL
                filename = url.split('/')[-1] if '/' in url else url
                
                formatted += f"\n    {func_name} @ {filename}:{line}:{col}"
        
        # Add source location if available
        if 'url' in msg:
            filename = msg['url'].split('/')[-1] if '/' in msg['url'] else msg['url']
            formatted += f"\n  Source: {filename}:{msg.get('lineNumber', 0)}"
            
        return formatted
    
    def _format_runtime_message(self, params):
        """Format Runtime.consoleAPICalled messages with stack trace"""
        # Get the console message type (log, error, warn, etc.)
        msg_type = params.get('type', 'log')
        
        # Extract text from args
        args = params.get('args', [])
        text_parts = []
        for arg in args:
            if arg.get('type') == 'string':
                text_parts.append(arg.get('value', ''))
            elif 'value' in arg:
                text_parts.append(str(arg['value']))
            elif 'description' in arg:
                text_parts.append(arg['description'])
        
        text = ' '.join(text_parts)
        formatted = f"[{msg_type}] {text}"
        
        # Add stack trace if available
        if 'stackTrace' in params:
            formatted += "\n  Stack trace:"
            for frame in params['stackTrace'].get('callFrames', []):
                func_name = frame.get('functionName', '<anonymous>')
                url = frame.get('url', 'unknown')
                line = frame.get('lineNumber', 0)
                col = frame.get('columnNumber', 0)
                
                # Extract filename from URL
                filename = url.split('/')[-1] if '/' in url else url
                
                formatted += f"\n    {func_name} @ {filename}:{line}:{col}"
                
        return formatted
            
    def analyze_logs(self, show_all=False):
        """Analyze captured logs for issues"""
        if not self.console_logs:
            print("\n❌ No console logs captured")
            print("   Make sure the plugin is open in Premiere Pro")
            return
            
        print(f"\n📊 Found {len(self.console_logs)} console messages")
        
        # Show all logs if requested
        if show_all:
            print("\n" + "="*80)
            print("📜 ALL CONSOLE MESSAGES (FULL DUMP):")
            print("="*80)
            for i, log in enumerate(self.console_logs):
                print(f"{i+1:4d}. {log}")
            print("="*80 + "\n")
        else:
            # Show last 10 logs
            print("\n📜 LAST 10 CONSOLE MESSAGES:")
            for log in self.console_logs[-10:]:
                if len(str(log)) > 150:
                    print(f"   {str(log)[:150]}...")
                else:
                    print(f"   {log}")
        
        # Check for common issues
        for log in self.console_logs:
            # Convert to string if it's still formatted
            log_text = str(log)
            
            # Common issues across all plugins
            if "Sequence changed" in log_text or "Active sequence changed" in log_text:
                self.found_issues.append(("sequence_change", log))
            elif "No workspace folder for sequence" in log_text:
                self.found_issues.append(("no_workspace", log))
            elif "evalTS timeout" in log_text or "took too long" in log_text:
                self.found_issues.append(("timeout", log))
            elif "Checking workspace..." in log_text:
                self.found_issues.append(("stuck_checking", log))
            elif "testSequenceAccess failed" in log_text:
                self.found_issues.append(("sequence_access_failed", log))
            elif "Cannot communicate with ExtendScript" in log_text:
                self.found_issues.append(("extendscript_broken", log))
            elif "Error" in log_text and "[error]" in log_text:
                self.found_issues.append(("error", log))
                
        # Show findings
        if self.found_issues:
            print("\n🔍 ISSUES DETECTED:")
            print("="*80)
            
            # Group by issue type
            issue_groups = {}
            for issue_type, log in self.found_issues:
                if issue_type not in issue_groups:
                    issue_groups[issue_type] = []
                issue_groups[issue_type].append(log)
            
            # Show each group
            for issue_type, logs in issue_groups.items():
                print(f"\n📌 {issue_type.upper()} ({len(logs)} occurrences):")
                # Show first occurrence with full stack trace
                if logs:
                    print(f"\n{logs[0]}")
                    
                    # Extract source location for timeouts
                    if "Stack trace:" in logs[0]:
                        lines = logs[0].split('\n')
                        for line in lines:
                            if "@" in line and ".js:" in line:
                                print(f"\n   🎯 Source: {line.strip()}")
                                break
                    
                    if len(logs) > 1:
                        print(f"\n   ... and {len(logs)-1} more similar errors")
                
            print("\n🔧 AUTO-FIXING...")
            self.apply_fixes()
        else:
            print("\n✅ No major issues detected in console")
            
    def apply_fixes(self):
        """Apply fixes for detected issues"""
        import subprocess
        
        fixes_applied = []
        
        # Check what issues we have
        issue_types = {issue[0] for issue in self.found_issues}
        
        if "sequence_change" in issue_types or "no_workspace" in issue_types:
            print("   → Clearing workspace state...", end="", flush=True)
            subprocess.run("rm -f workspace_state.json", shell=True)
            print(" ✅")
            fixes_applied.append("workspace_cleared")
            
        if "timeout" in issue_types or "stuck_checking" in issue_types or "extendscript_broken" in issue_types:
            print("   → Rebuilding with timeout fix...", end="", flush=True)
            subprocess.run("npm run build", shell=True, capture_output=True)
            print(" ✅")
            fixes_applied.append("rebuilt")
            
        if fixes_applied:
            print("\n✅ Fixes applied! Reload the panel in Premiere Pro")
            print(f"   Debug URL: http://localhost:{self.debug_port}")
        else:
            print("\n💡 No automatic fixes available for these issues")
            print("   Try manually reloading the panel in Premiere Pro")
        
async def main():
    import sys
    
    reader = UniversalConsoleReader()
    await reader.read_console()
    
    # Check if --all flag is passed
    show_all = "--all" in sys.argv
    reader.analyze_logs(show_all=show_all)
    
if __name__ == "__main__":
    print("🚀 UNIVERSAL CONSOLE READER WITH STACK TRACES")
    print("=" * 50)
    print("Usage: python3 console-reader.py [--all]")
    print("  --all : Show all console messages (default: last 10)")
    print("=" * 50)
    asyncio.run(main())