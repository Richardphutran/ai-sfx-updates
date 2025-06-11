#!/usr/bin/env python3
"""
CEP Debug System - Unified debugging for all Premiere plugins
THIS SCRIPT HANDLES EVERYTHING. Do not create new tools.
Available actions: diagnose, fix, test, state, console, learn
"""

import os
import sys
import json
import subprocess
import time
import re
from pathlib import Path

class CEPDebugger:
    def __init__(self):
        # Detect which plugin we're debugging
        self.current_dir = os.getcwd()
        self.plugin_name = self._detect_plugin()
        self.project_root = Path(self.current_dir)
        
        # State management
        self.state_dir = self.project_root / '.cep_state'
        self.state_dir.mkdir(exist_ok=True)
        
        # Knowledge base paths
        self.multiplugin_root = Path("/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem")
        self.knowledge_dir = self.multiplugin_root / "shared-knowledge" / "cep-errors"
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)
        
        # Load project context from PRD if exists
        self.project_context = self._load_project_context()
        
        # Error patterns
        self.error_patterns = {
            "E001": {"pattern": r"evalTS timeout|evalTS.*took too long", "name": "evalTS_timeout"},
            "E002": {"pattern": r"Cannot read properties of undefined.*evalScript", "name": "undefined_evalScript"},
            "E003": {"pattern": r"Checking workspace\.\.\.", "name": "stuck_workspace"},
            "E004": {"pattern": r"sequence.*not.*detected|getCurrentSequenceInfo.*failed", "name": "sequence_not_detected"},
            "E005": {"pattern": r"SRT.*not found|No.*srt files", "name": "srt_not_found"},
            "E006": {"pattern": r"ExtendScript.*not.*loaded|jsx.*missing", "name": "extendscript_missing"},
            "E007": {"pattern": r"CSInterface.*undefined|window\.cep.*not.*exist", "name": "not_in_cep"},
            "E008": {"pattern": r"Panel.*not.*responding|timeout.*panel", "name": "panel_timeout"}
        }
        
        # Known fixes
        self.fixes = {
            "E001": ["rebuild_extendscript", "increase_timeout", "reload_panel"],
            "E002": ["ensure_cep_environment", "check_browser_vs_panel"],
            "E003": ["clear_state", "rebuild", "reload"],
            "E004": ["rebuild_extendscript", "check_ppro_connection", "reload"],
            "E005": ["check_workspace_path", "verify_srt_location"],
            "E006": ["npm_run_build", "check_jsx_compilation"],
            "E007": ["open_in_premiere", "not_browser"],
            "E008": ["restart_panel", "check_debug_port"]
        }
        
    def _detect_plugin(self):
        """Detect which plugin we're in based on directory"""
        if "Ai SFX" in self.current_dir:
            return "ai-sfx"
        elif "Ai Text Editor" in self.current_dir:
            return "ai-text-editor"
        elif "Ai Podcast" in self.current_dir:
            return "ai-podcast"
        elif "Ai Video Namer" in self.current_dir:
            return "ai-video-namer"
        else:
            return "unknown-plugin"
    
    def _load_project_context(self):
        """Load context from PRD.md"""
        prd_path = self.project_root / "PRD.md"
        context = {
            "name": self.plugin_name,
            "goal": "Build better tools for editors",
            "brand": "Effortless, minimal friction"
        }
        
        if prd_path.exists():
            try:
                content = prd_path.read_text()
                # Extract key info from PRD
                if "Purpose:" in content:
                    purpose_match = re.search(r'Purpose:\s*(.+)', content)
                    if purpose_match:
                        context["goal"] = purpose_match.group(1).strip()
            except:
                pass
                
        return context
    
    def _get_console_logs(self, last_n=100):
        """Get last N lines from CEP console via debug port"""
        try:
            import requests
            import xml.etree.ElementTree as ET
            
            # Try to read from cached console snapshot first
            snapshot_path = self.state_dir / "console_snapshot.txt"
            if snapshot_path.exists():
                return snapshot_path.read_text().splitlines()[-last_n:]
            
            # Use proper WebSocket connection (Gemini's approach)
            try:
                import asyncio
                import websockets
                
                debug_file = self.project_root / "dist/cep/.debug"
                if debug_file.exists():
                    tree = ET.parse(debug_file)
                    port = tree.find('.//Host[@Name="PPRO"]').get('Port')
                    
                    # Get WebSocket URL
                    tabs_url = f"http://localhost:{port}/json"
                    tabs_response = requests.get(tabs_url, timeout=2)
                    tabs = tabs_response.json()
                    
                    # Find our plugin tab
                    for tab in tabs:
                        if 'dialogue-editor-bolt' in tab.get('url', '') or 'Bolt CEP' in tab.get('title', ''):
                            ws_url = tab.get('webSocketDebuggerUrl')
                            if ws_url:
                                # Capture logs via WebSocket
                                logs = asyncio.run(self._capture_via_websocket(ws_url))
                                if logs:
                                    snapshot_path.write_text('\n'.join(logs))
                                    return logs[-last_n:]
            except Exception as ws_error:
                print(f"WebSocket method failed: {ws_error}")
                
            # Fallback: Check for manual snapshot
            return ["No console logs available - run 'python3 cep_debug.py capture' to grab logs"]
            
        except Exception as e:
            return [f"Error getting console logs: {str(e)}"]
    
    async def _capture_via_websocket(self, ws_url, duration=3):
        """Capture logs via WebSocket connection"""
        try:
            # Try to import websockets
            import websockets
        except ImportError:
            print("⚠️ Install websockets: pip install websockets")
            return []
            
        logs = []
        try:
            async with websockets.connect(ws_url) as websocket:
                # Enable Log domain
                await websocket.send(json.dumps({"id": 1, "method": "Log.enable"}))
                await websocket.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
                
                # Listen for messages
                start_time = time.time()
                while time.time() - start_time < duration:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=0.5)
                        data = json.loads(message)
                        
                        # Extract log messages
                        if data.get("method") == "Log.entryAdded":
                            entry = data["params"]["entry"]
                            logs.append(f"[{entry['level']}] {entry['text']}")
                        elif data.get("method") == "Runtime.consoleAPICalled":
                            args = data["params"]["args"]
                            text = " ".join([str(arg.get("value", "")) for arg in args])
                            logs.append(text)
                    except asyncio.TimeoutError:
                        continue
                        
        except Exception as e:
            print(f"WebSocket error: {e}")
            
        return logs
    
    def _match_error(self, logs):
        """Match console logs to error codes"""
        log_text = "\n".join(logs)
        
        for code, info in self.error_patterns.items():
            if re.search(info["pattern"], log_text, re.IGNORECASE):
                return code
                
        return "E000"  # Unknown error
    
    def capture_console(self, logs_text):
        """Manually capture console logs"""
        snapshot_path = self.state_dir / "console_snapshot.txt"
        snapshot_path.write_text(logs_text)
        print("✅ Console logs captured")
        
    def diagnose(self):
        """Diagnose current state"""
        # Get console logs
        logs = self._get_console_logs()
        
        # Match to error code
        error_code = self._match_error(logs)
        
        # Save state
        (self.state_dir / "current_error.txt").write_text(error_code)
        
        # Output for Claude (minimal tokens)
        print(f"{error_code}:{self.error_patterns.get(error_code, {}).get('name', 'unknown')}")
        
    def fix(self, error_code=None):
        """Apply fix for error code"""
        if not error_code:
            # Read from state
            state_file = self.state_dir / "current_error.txt"
            if state_file.exists():
                error_code = state_file.read_text().strip()
            else:
                print("❌ No error state. Run diagnose first.")
                return
        
        # Get fixes for this error
        fixes = self.fixes.get(error_code, [])
        if not fixes:
            print(f"❌ No known fix for {error_code}")
            return
            
        # Apply fixes
        for fix_action in fixes:
            success = self._apply_fix(fix_action)
            if success:
                print(f"✅ Applied: {fix_action}")
                # Save successful fix to knowledge base
                self._save_fix_to_knowledge(error_code, fix_action)
                return
                
        print(f"❌ All fixes failed for {error_code}")
        
    def _apply_fix(self, fix_action):
        """Apply a specific fix action"""
        fix_commands = {
            "rebuild_extendscript": "npm run build",
            "reload_panel": "python3 trigger_reload.py",
            "clear_state": f"rm -rf {self.state_dir}/*",
            "npm_run_build": "npm run build",
            "restart_panel": "python3 trigger_reload.py",
            "check_browser_vs_panel": "echo 'Open in Premiere Pro, not browser'",
            "open_in_premiere": "echo 'Window → Extensions → {self.plugin_name}'"
        }
        
        cmd = fix_commands.get(fix_action)
        if cmd:
            try:
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                return result.returncode == 0
            except:
                return False
        return False
        
    def test(self, action=None):
        """Test if fix worked"""
        # Quick check - is error still present?
        self.diagnose()
        new_error = (self.state_dir / "current_error.txt").read_text().strip()
        
        if new_error == "E000":
            print("✅ No errors detected")
        else:
            print(f"❌ Still have: {new_error}")
            
    def state(self):
        """Get current state in compressed format"""
        state_file = self.state_dir / "current_error.txt"
        if state_file.exists():
            error = state_file.read_text().strip()
            print(f"[{self.project_context['name']}] {error}")
        else:
            print(f"[{self.project_context['name']}] No state")
            
    def console(self):
        """Open CEP debug console"""
        # First ensure plugin is built (not redirecting)
        print("🔨 Ensuring plugin is built...")
        subprocess.run(["npm", "run", "build"], capture_output=True)
        
        # Find debug port from .debug file
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse('dist/cep/.debug')
            port = tree.find('.//Host[@Name="PPRO"]').get('Port')
            url = f"http://localhost:{port}"
            print(f"✅ Opening debug console: {url}")
            subprocess.run(["open", url])
        except:
            print("❌ Could not find debug port. Check dist/cep/.debug")
        
    def learn(self):
        """Save successful fix to knowledge base"""
        state_file = self.state_dir / "current_error.txt"
        action_file = self.state_dir / "last_action.txt"
        
        if state_file.exists() and action_file.exists():
            error = state_file.read_text().strip()
            action = action_file.read_text().strip()
            self._save_fix_to_knowledge(error, action)
            print(f"✅ Saved fix for {error}")
        else:
            print("❌ No recent fix to save")
            
    def _save_fix_to_knowledge(self, error_code, fix_action):
        """Save to MultiPluginSystem knowledge base"""
        knowledge_file = self.knowledge_dir / f"{error_code}.json"
        
        data = {}
        if knowledge_file.exists():
            data = json.loads(knowledge_file.read_text())
            
        if "fixes" not in data:
            data["fixes"] = {}
            
        if fix_action not in data["fixes"]:
            data["fixes"][fix_action] = {"count": 0, "plugins": []}
            
        data["fixes"][fix_action]["count"] += 1
        if self.plugin_name not in data["fixes"][fix_action]["plugins"]:
            data["fixes"][fix_action]["plugins"].append(self.plugin_name)
            
        knowledge_file.write_text(json.dumps(data, indent=2))
        
        # Also save to last_action for learn command
        (self.state_dir / "last_action.txt").write_text(fix_action)

def main():
    debugger = CEPDebugger()
    
    if len(sys.argv) < 2:
        print("Usage: python3 cep_debug.py [diagnose|fix|test|state|console|learn|capture]")
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "diagnose":
        debugger.diagnose()
    elif action == "fix":
        error_code = sys.argv[2] if len(sys.argv) > 2 else None
        debugger.fix(error_code)
    elif action == "test":
        debugger.test()
    elif action == "state":
        debugger.state()
    elif action == "console":
        debugger.console()
    elif action == "learn":
        debugger.learn()
    elif action == "capture":
        # Manual console capture
        print("📋 Paste your console logs, then press Ctrl+D (Mac/Linux) or Ctrl+Z (Windows) when done:")
        import sys
        logs_text = sys.stdin.read()
        debugger.capture_console(logs_text)
        debugger.diagnose()
    else:
        print(f"Unknown action: {action}")

if __name__ == "__main__":
    main()