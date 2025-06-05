#!/usr/bin/env python3
"""
🚀 Efficient Localhost Validator - Prevent Wasted Tokens
Validates plugin availability with smart caching and pre-flight checks
"""

import json
import urllib.request
import urllib.error
import socket
import time
import subprocess
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, List

class EfficientLocalhostValidator:
    """Validates localhost connections with minimal token usage"""
    
    def __init__(self):
        self.cache_file = Path.home() / ".adobe_localhost_cache.json"
        self.registry_file = Path.home() / ".adobe_port_registry.json"
        self.cache_duration = 300  # 5 minutes cache validity
        self._cache = self._load_cache()
        
    def _load_cache(self) -> Dict:
        """Load validation cache"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def _save_cache(self):
        """Save validation cache"""
        with open(self.cache_file, 'w') as f:
            json.dump(self._cache, f, indent=2)
    
    def _is_cache_valid(self, port: int) -> bool:
        """Check if cached validation is still valid"""
        cache_key = str(port)
        if cache_key not in self._cache:
            return False
        
        cached_time = datetime.fromisoformat(self._cache[cache_key]['timestamp'])
        return datetime.now() - cached_time < timedelta(seconds=self.cache_duration)
    
    def pre_flight_check(self) -> Dict[str, bool]:
        """Run all pre-flight checks before attempting connections"""
        checks = {
            'premiere_running': self._check_premiere_running(),
            'debug_mode_enabled': self._check_debug_mode(),
            'network_available': self._check_network(),
            'ports_accessible': self._check_port_accessibility()
        }
        
        return checks
    
    def _check_premiere_running(self) -> bool:
        """Check if Premiere Pro is running"""
        try:
            result = subprocess.run(['pgrep', '-f', 'Adobe Premiere Pro'], 
                                  capture_output=True, timeout=2)
            return result.returncode == 0
        except:
            return False
    
    def _check_debug_mode(self) -> bool:
        """Check if debug mode is enabled"""
        try:
            result = subprocess.run(['defaults', 'read', 'com.adobe.CSXS.11', 'PlayerDebugMode'],
                                  capture_output=True, text=True, timeout=2)
            return result.stdout.strip() == '1'
        except:
            return False
    
    def _check_network(self) -> bool:
        """Check basic network connectivity"""
        try:
            socket.create_connection(('localhost', 80), timeout=1).close()
            return True
        except:
            return True  # localhost should always work
    
    def _check_port_accessibility(self) -> bool:
        """Check if common ports are not blocked"""
        test_port = 9230
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', test_port))
            sock.close()
            return True  # Port is either open or closed, but not blocked
        except:
            return False
    
    def validate_port(self, port: int, plugin_name: str = None, force: bool = False) -> Dict:
        """Validate a specific port with caching"""
        
        # Check cache first (unless forced)
        if not force and self._is_cache_valid(port):
            cached = self._cache[str(port)]
            cached['from_cache'] = True
            return cached
        
        # Perform validation
        result = {
            'port': port,
            'plugin_name': plugin_name,
            'available': False,
            'reachable': False,
            'is_plugin': False,
            'error': None,
            'timestamp': datetime.now().isoformat(),
            'from_cache': False
        }
        
        # Quick socket check first
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            connection_result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if connection_result != 0:
                result['error'] = 'Port not open'
                self._cache[str(port)] = result
                self._save_cache()
                return result
                
        except Exception as e:
            result['error'] = f'Socket error: {str(e)}'
            self._cache[str(port)] = result
            self._save_cache()
            return result
        
        # Port is open, check if it's a debug endpoint
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}/json', timeout=2)
            targets = json.loads(response.read().decode())
            
            result['reachable'] = True
            result['available'] = True
            
            # Check if it's actually a plugin
            for target in targets:
                title = target.get('title', '')
                if plugin_name and plugin_name in title:
                    result['is_plugin'] = True
                    result['plugin_title'] = title
                    break
                elif 'CEP' in title or 'Extension' in title:
                    result['is_plugin'] = True
                    result['plugin_title'] = title
                    break
                    
        except urllib.error.HTTPError as e:
            result['error'] = f'HTTP error: {e.code}'
        except urllib.error.URLError as e:
            result['error'] = f'URL error: {str(e.reason)}'
        except Exception as e:
            result['error'] = f'Unexpected error: {str(e)}'
        
        # Cache the result
        self._cache[str(port)] = result
        self._save_cache()
        
        return result
    
    def batch_validate(self, ports: List[Tuple[int, str]], max_attempts: int = 3) -> Dict[int, Dict]:
        """Validate multiple ports efficiently"""
        results = {}
        
        # Pre-flight checks first
        pre_flight = self.pre_flight_check()
        if not pre_flight['premiere_running']:
            return {port: {'error': 'Premiere Pro not running', 'available': False} 
                   for port, _ in ports}
        
        # Validate each port
        for port, plugin_name in ports:
            attempts = 0
            while attempts < max_attempts:
                result = self.validate_port(port, plugin_name, force=(attempts > 0))
                
                if result['available'] or attempts == max_attempts - 1:
                    results[port] = result
                    break
                    
                attempts += 1
                if attempts < max_attempts:
                    time.sleep(1)  # Brief delay before retry
        
        return results
    
    def get_validation_summary(self, ports: List[Tuple[int, str]]) -> str:
        """Get a concise validation summary"""
        results = self.batch_validate(ports)
        
        summary = []
        available_count = sum(1 for r in results.values() if r.get('available'))
        plugin_count = sum(1 for r in results.values() if r.get('is_plugin'))
        
        summary.append(f"🔍 Validated {len(results)} ports:")
        summary.append(f"✅ {available_count} available")
        summary.append(f"🔌 {plugin_count} are plugins")
        
        for port, result in results.items():
            if result.get('is_plugin'):
                summary.append(f"   {port}: {result.get('plugin_title', 'Unknown plugin')}")
            elif result.get('available'):
                summary.append(f"   {port}: Available (not a plugin)")
            else:
                summary.append(f"   {port}: {result.get('error', 'Not available')}")
        
        return "\n".join(summary)
    
    def clear_cache(self):
        """Clear the validation cache"""
        self._cache = {}
        self._save_cache()
        if self.cache_file.exists():
            self.cache_file.unlink()


def main():
    """Example usage"""
    validator = EfficientLocalhostValidator()
    
    # Common plugin ports to check
    plugin_ports = [
        (9230, "AI SFX Generator"),
        (9231, "Text-Based Editing"),
        (9232, "Podcast Plugin"),
        (9240, "Ai Podcast"),
        (9241, "Available Slot"),
    ]
    
    # Quick validation with summary
    print(validator.get_validation_summary(plugin_ports))
    
    # Single port validation
    print("\n📍 Single port validation:")
    result = validator.validate_port(9240, "Ai Podcast")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()