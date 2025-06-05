#!/usr/bin/env python3
"""
🎯 Simple Localhost Validator - Zero Token Waste
Self-contained validation for this project
"""

import json
import urllib.request
import urllib.error
import socket
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

class SimpleValidator:
    """Simple localhost validation with caching"""
    
    def __init__(self):
        self.cache_file = Path.home() / f".localhost_cache_{Path.cwd().name}.json"
        self.cache_duration = 300  # 5 minutes
    
    def validate(self):
        """Main validation function"""
        print("🔍 Validating localhost...")
        
        # Check cache first
        cached = self._check_cache()
        if cached:
            print(f"✅ Using cached result: {cached['message']}")
            return cached
        
        # Run validation
        result = self._run_validation()
        
        # Cache result
        self._save_cache(result)
        
        return result
    
    def _check_cache(self):
        """Check if cached result is valid"""
        if not self.cache_file.exists():
            return None
        
        try:
            with open(self.cache_file, 'r') as f:
                data = json.load(f)
            
            cached_time = datetime.fromisoformat(data['timestamp'])
            if datetime.now() - cached_time < timedelta(seconds=self.cache_duration):
                return data
        except:
            pass
        
        return None
    
    def _run_validation(self):
        """Run actual validation"""
        
        # Check if Premiere is running
        try:
            result = subprocess.run(['pgrep', '-f', 'Adobe Premiere Pro'], 
                                  capture_output=True, timeout=2)
            premiere_running = result.returncode == 0
        except:
            premiere_running = False
        
        if not premiere_running:
            return {
                'success': False,
                'message': '❌ Adobe Premiere Pro not running',
                'recommendation': 'Start Premiere Pro first',
                'timestamp': datetime.now().isoformat()
            }
        
        # Check common debug ports
        ports_to_check = [9230, 9231, 9232, 9240, 9241]
        active_ports = []
        
        for port in ports_to_check:
            if self._check_port(port):
                active_ports.append(port)
        
        if active_ports:
            message = f"✅ Found {len(active_ports)} active debug ports: {active_ports}"
            success = True
        else:
            message = "❌ No debug ports found. Check if plugins are loaded."
            success = False
        
        return {
            'success': success,
            'message': message,
            'active_ports': active_ports,
            'recommendation': 'Plugins are ready' if success else 'Load plugins in Premiere Pro',
            'timestamp': datetime.now().isoformat()
        }
    
    def _check_port(self, port):
        """Quick port check"""
        try:
            # Socket check
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result != 0:
                return False
            
            # HTTP check
            response = urllib.request.urlopen(f'http://localhost:{port}/json', timeout=2)
            targets = json.loads(response.read().decode())
            return len(targets) > 0
            
        except:
            return False
    
    def _save_cache(self, result):
        """Save result to cache"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(result, f, indent=2)
        except:
            pass
    
    def clear_cache(self):
        """Clear cache"""
        if self.cache_file.exists():
            self.cache_file.unlink()
        print("🧹 Cache cleared")

def main():
    validator = SimpleValidator()
    
    if len(__import__('sys').argv) > 1:
        command = __import__('sys').argv[1]
        
        if command == "--reset":
            validator.clear_cache()
            print("🔄 Cache cleared. Run again for fresh validation.")
            return
        elif command == "--init":
            print("🚀 Initializing project validation...")
            validator.clear_cache()
    
    result = validator.validate()
    print(f"\n{result['message']}")
    if 'recommendation' in result:
        print(f"💡 {result['recommendation']}")

if __name__ == "__main__":
    main()
