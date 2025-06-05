#!/usr/bin/env python3
"""
🎯 Smart Port Registry - Intelligent Port Management
Tracks available ports across sessions and prevents conflicts
"""

import json
import time
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from efficient_localhost_validator import EfficientLocalhostValidator

@dataclass
class PortAllocation:
    """Represents a port allocation"""
    port: int
    project_name: str
    plugin_name: str
    status: str  # "active", "reserved", "available", "occupied"
    allocated_at: str
    last_seen: str
    process_id: Optional[int] = None
    debug_url: Optional[str] = None

class SmartPortRegistry:
    """Manages port allocations across multiple plugin sessions"""
    
    def __init__(self):
        self.registry_file = Path.home() / ".smart_port_registry.json"
        self.validator = EfficientLocalhostValidator()
        self.registry = self._load_registry()
        
        # Port ranges for different services
        self.port_ranges = {
            'debug': (9230, 9250),
            'dev_server': (3001, 3020), 
            'vite': (5173, 5180),
            'webpack': (8080, 8090),
            'cep_legacy': (7002, 7010)
        }
        
        # Reserved ports that should not be auto-allocated
        self.reserved_ports = {
            9230: "AI SFX Generator (Primary)",
            9231: "Text-Based Editing", 
            7002: "Legacy CEP Plugin"
        }
    
    def _load_registry(self) -> Dict[str, PortAllocation]:
        """Load port registry from file"""
        if self.registry_file.exists():
            try:
                with open(self.registry_file, 'r') as f:
                    data = json.load(f)
                    return {
                        port: PortAllocation(**allocation) 
                        for port, allocation in data.items()
                    }
            except Exception as e:
                print(f"⚠️ Error loading registry: {e}")
        return {}
    
    def _save_registry(self):
        """Save registry to file"""
        data = {port: asdict(allocation) for port, allocation in self.registry.items()}
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _is_port_actually_in_use(self, port: int) -> bool:
        """Check if port is actually in use by checking processes"""
        try:
            result = subprocess.run(['lsof', '-i', f':{port}'], 
                                  capture_output=True, text=True, timeout=3)
            return result.returncode == 0
        except:
            return False
    
    def _cleanup_stale_allocations(self):
        """Remove allocations for ports that are no longer in use"""
        stale_ports = []
        
        for port_str, allocation in self.registry.items():
            port = int(port_str)
            
            # Check if allocation is old (>24 hours) and port is not in use
            allocated_time = datetime.fromisoformat(allocation.allocated_at)
            if datetime.now() - allocated_time > timedelta(hours=24):
                if not self._is_port_actually_in_use(port):
                    stale_ports.append(port_str)
        
        for port_str in stale_ports:
            del self.registry[port_str]
            print(f"🧹 Cleaned up stale allocation for port {port_str}")
        
        if stale_ports:
            self._save_registry()
    
    def allocate_port(self, project_name: str, plugin_name: str, 
                     preferred_port: Optional[int] = None, 
                     port_type: str = 'debug') -> Optional[int]:
        """Allocate a port for a project"""
        
        self._cleanup_stale_allocations()
        
        # Try preferred port first
        if preferred_port and self._can_allocate_port(preferred_port):
            self._register_allocation(preferred_port, project_name, plugin_name)
            return preferred_port
        
        # Find available port in range
        start_port, end_port = self.port_ranges.get(port_type, (9230, 9250))
        
        for port in range(start_port, end_port + 1):
            if self._can_allocate_port(port):
                self._register_allocation(port, project_name, plugin_name)
                return port
        
        return None
    
    def _can_allocate_port(self, port: int) -> bool:
        """Check if port can be allocated"""
        
        # Check if port is reserved
        if port in self.reserved_ports:
            return False
        
        # Check if already allocated to another project
        port_str = str(port)
        if port_str in self.registry:
            allocation = self.registry[port_str]
            if allocation.status in ['active', 'reserved']:
                # Check if actually in use
                if self._is_port_actually_in_use(port):
                    return False
                else:
                    # Mark as available if not actually in use
                    self.registry[port_str].status = 'available'
        
        # Check if port is actually available
        return not self._is_port_actually_in_use(port)
    
    def _register_allocation(self, port: int, project_name: str, plugin_name: str):
        """Register a port allocation"""
        
        now = datetime.now().isoformat()
        allocation = PortAllocation(
            port=port,
            project_name=project_name,
            plugin_name=plugin_name,
            status='reserved',
            allocated_at=now,
            last_seen=now,
            debug_url=f"http://localhost:{port}"
        )
        
        self.registry[str(port)] = allocation
        self._save_registry()
        print(f"✅ Allocated port {port} to {project_name} ({plugin_name})")
    
    def mark_port_active(self, port: int) -> bool:
        """Mark a port as active after successful connection"""
        port_str = str(port)
        if port_str in self.registry:
            self.registry[port_str].status = 'active'
            self.registry[port_str].last_seen = datetime.now().isoformat()
            
            # Validate the port to confirm it's working
            result = self.validator.validate_port(port)
            if result.get('is_plugin'):
                self.registry[port_str].debug_url = f"http://localhost:{port}"
                print(f"🔌 Port {port} confirmed active and accessible")
                self._save_registry()
                return True
            
        return False
    
    def release_port(self, port: int, project_name: str = None) -> bool:
        """Release a port allocation"""
        port_str = str(port)
        
        if port_str in self.registry:
            allocation = self.registry[port_str]
            
            # Only allow release by same project or if forced
            if project_name and allocation.project_name != project_name:
                print(f"❌ Cannot release port {port}: owned by {allocation.project_name}")
                return False
            
            del self.registry[port_str]
            self._save_registry()
            print(f"🔓 Released port {port}")
            return True
        
        return False
    
    def get_project_ports(self, project_name: str) -> List[PortAllocation]:
        """Get all ports allocated to a project"""
        return [
            allocation for allocation in self.registry.values()
            if allocation.project_name == project_name
        ]
    
    def get_available_ports(self, port_type: str = 'debug') -> List[int]:
        """Get list of available ports in a range"""
        start_port, end_port = self.port_ranges.get(port_type, (9230, 9250))
        available = []
        
        for port in range(start_port, end_port + 1):
            if self._can_allocate_port(port):
                available.append(port)
        
        return available
    
    def status_report(self) -> str:
        """Generate a status report of all port allocations"""
        lines = ["🎯 Smart Port Registry Status", "=" * 40]
        
        if not self.registry:
            lines.append("📭 No active port allocations")
            return "\n".join(lines)
        
        # Group by project
        projects = {}
        for allocation in self.registry.values():
            project = allocation.project_name
            if project not in projects:
                projects[project] = []
            projects[project].append(allocation)
        
        for project_name, allocations in projects.items():
            lines.append(f"\n📁 {project_name}:")
            
            for allocation in sorted(allocations, key=lambda x: x.port):
                status_icon = {
                    'active': '🟢',
                    'reserved': '🟡', 
                    'available': '⚪',
                    'occupied': '🔴'
                }.get(allocation.status, '❓')
                
                lines.append(f"  {status_icon} Port {allocation.port} - {allocation.plugin_name}")
                lines.append(f"    Status: {allocation.status}")
                if allocation.debug_url:
                    lines.append(f"    URL: {allocation.debug_url}")
        
        # Show available ports
        available = self.get_available_ports()[:5]  # Show first 5
        if available:
            lines.append(f"\n🆓 Next available ports: {', '.join(map(str, available))}")
        
        return "\n".join(lines)
    
    def auto_allocate_for_project(self, project_name: str, 
                                plugin_configs: List[Dict]) -> Dict[str, int]:
        """Auto-allocate ports for multiple plugins in a project"""
        
        allocations = {}
        
        for config in plugin_configs:
            plugin_name = config['name']
            preferred_port = config.get('preferred_port')
            port_type = config.get('port_type', 'debug')
            
            port = self.allocate_port(project_name, plugin_name, 
                                    preferred_port, port_type)
            
            if port:
                allocations[plugin_name] = port
            else:
                print(f"❌ Failed to allocate port for {plugin_name}")
        
        return allocations


def main():
    """Example usage and testing"""
    registry = SmartPortRegistry()
    
    # Show current status
    print(registry.status_report())
    
    # Example: Allocate ports for Ai Podcast project
    plugin_configs = [
        {'name': 'Ai Podcast Main', 'preferred_port': 9240},
        {'name': 'Ai Podcast Dev Server', 'port_type': 'dev_server'},
        {'name': 'Ai Podcast Vite', 'port_type': 'vite'}
    ]
    
    allocations = registry.auto_allocate_for_project('Ai Podcast', plugin_configs)
    print(f"\n📋 Allocated ports: {allocations}")
    
    # Show updated status
    print("\n" + registry.status_report())


if __name__ == "__main__":
    main()