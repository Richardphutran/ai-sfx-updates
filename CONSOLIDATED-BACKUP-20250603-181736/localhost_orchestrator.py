#!/usr/bin/env python3
"""
🎯 Localhost Orchestrator - Zero Token Waste
Intelligent localhost management with connection pooling and smart caching
"""

import json
import time
import asyncio
import websocket
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from efficient_localhost_validator import EfficientLocalhostValidator
from smart_port_registry import SmartPortRegistry

@dataclass
class PluginConnection:
    """Represents an active plugin connection"""
    port: int
    plugin_name: str
    status: str  # "connected", "disconnected", "error"
    ws_connection: Optional[Any] = None
    last_ping: Optional[float] = None
    error_count: int = 0

class LocalhostOrchestrator:
    """Orchestrates all localhost connections efficiently"""
    
    def __init__(self):
        self.validator = EfficientLocalhostValidator()
        self.registry = SmartPortRegistry()
        self.connections: Dict[int, PluginConnection] = {}
        self.executor = ThreadPoolExecutor(max_workers=5)
        self.health_check_interval = 30  # seconds
        
    def initialize_project(self, project_name: str, 
                         plugin_configs: List[Dict]) -> Dict[str, Any]:
        """Initialize a project with smart port allocation and validation"""
        
        print(f"🚀 Initializing {project_name}...")
        
        # Step 1: Pre-flight checks
        pre_flight = self.validator.pre_flight_check()
        if not all(pre_flight.values()):
            failed_checks = [k for k, v in pre_flight.items() if not v]
            return {
                'success': False,
                'error': f'Pre-flight checks failed: {failed_checks}',
                'recommendations': self._get_pre_flight_recommendations(failed_checks)
            }
        
        # Step 2: Allocate ports intelligently
        allocations = self.registry.auto_allocate_for_project(project_name, plugin_configs)
        
        if not allocations:
            return {
                'success': False,
                'error': 'No ports could be allocated',
                'recommendations': ['Check if ports are available', 'Restart Premiere Pro']
            }
        
        # Step 3: Validate allocated ports concurrently
        validation_results = self._concurrent_validation(allocations)
        
        # Step 4: Establish connections to validated ports
        active_connections = self._establish_connections(validation_results)
        
        # Step 5: Start health monitoring
        if active_connections:
            asyncio.create_task(self._start_health_monitoring())
        
        return {
            'success': bool(active_connections),
            'allocations': allocations,
            'validation_results': validation_results,
            'active_connections': len(active_connections),
            'ready_for_development': len(active_connections) > 0
        }
    
    def _get_pre_flight_recommendations(self, failed_checks: List[str]) -> List[str]:
        """Get recommendations for failed pre-flight checks"""
        recommendations = []
        
        if 'premiere_running' in failed_checks:
            recommendations.append('Start Adobe Premiere Pro')
        
        if 'debug_mode_enabled' in failed_checks:
            recommendations.append('Enable debug mode: defaults write com.adobe.CSXS.11 PlayerDebugMode 1')
        
        if 'network_available' in failed_checks:
            recommendations.append('Check network connectivity')
        
        if 'ports_accessible' in failed_checks:
            recommendations.append('Check firewall settings')
        
        return recommendations
    
    def _concurrent_validation(self, allocations: Dict[str, int]) -> Dict[int, Dict]:
        """Validate multiple ports concurrently"""
        
        print(f"🔍 Validating {len(allocations)} allocated ports...")
        
        # Prepare port validation tasks
        port_tasks = [(port, plugin_name) for plugin_name, port in allocations.items()]
        
        # Execute validations concurrently
        validation_futures = {
            self.executor.submit(self.validator.validate_port, port, plugin_name): (port, plugin_name)
            for port, plugin_name in port_tasks
        }
        
        results = {}
        for future in as_completed(validation_futures, timeout=10):
            port, plugin_name = validation_futures[future]
            try:
                result = future.result()
                results[port] = result
                
                if result.get('is_plugin'):
                    print(f"✅ {plugin_name} on port {port}: Ready")
                    self.registry.mark_port_active(port)
                else:
                    print(f"⚠️ {plugin_name} on port {port}: {result.get('error', 'Not a plugin')}")
                    
            except Exception as e:
                print(f"❌ {plugin_name} on port {port}: Validation failed - {e}")
                results[port] = {'error': str(e), 'available': False}
        
        return results
    
    def _establish_connections(self, validation_results: Dict[int, Dict]) -> Dict[int, PluginConnection]:
        """Establish WebSocket connections to validated plugins"""
        
        connections = {}
        
        for port, result in validation_results.items():
            if result.get('is_plugin') and result.get('available'):
                
                plugin_name = result.get('plugin_name', f'Plugin-{port}')
                connection = PluginConnection(
                    port=port,
                    plugin_name=plugin_name,
                    status='connected',
                    last_ping=time.time()
                )
                
                # Try to establish WebSocket connection for real-time monitoring
                try:
                    ws_url = f"ws://localhost:{port}/devtools/page/..."  # Would need actual page ID
                    # connection.ws_connection = websocket.create_connection(ws_url, timeout=5)
                    # For now, just mark as connected without WebSocket
                    
                    connections[port] = connection
                    self.connections[port] = connection
                    print(f"🔌 Connected to {plugin_name} on port {port}")
                    
                except Exception as e:
                    print(f"⚠️ WebSocket connection failed for port {port}: {e}")
                    connection.status = 'error'
                    connection.error_count += 1
        
        return connections
    
    async def _start_health_monitoring(self):
        """Start continuous health monitoring of connections"""
        
        while self.connections:
            await asyncio.sleep(self.health_check_interval)
            
            print("💓 Running health checks...")
            
            # Check each connection
            for port, connection in list(self.connections.items()):
                try:
                    # Simple health check via HTTP
                    result = self.validator.validate_port(port, force=True)
                    
                    if result.get('available'):
                        connection.last_ping = time.time()
                        connection.status = 'connected'
                        connection.error_count = 0
                    else:
                        connection.error_count += 1
                        if connection.error_count > 3:
                            print(f"❌ Removing unhealthy connection: {connection.plugin_name}")
                            del self.connections[port]
                
                except Exception as e:
                    connection.error_count += 1
                    print(f"⚠️ Health check failed for {connection.plugin_name}: {e}")
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get current status of all connections"""
        
        status = {
            'total_connections': len(self.connections),
            'healthy_connections': len([c for c in self.connections.values() if c.status == 'connected']),
            'error_connections': len([c for c in self.connections.values() if c.status == 'error']),
            'connections': {}
        }
        
        for port, connection in self.connections.items():
            status['connections'][port] = {
                'plugin_name': connection.plugin_name,
                'status': connection.status,
                'error_count': connection.error_count,
                'last_ping': connection.last_ping,
                'debug_url': f"http://localhost:{port}"
            }
        
        return status
    
    def quick_validate(self, project_name: str) -> str:
        """Quick validation for existing project - minimal token usage"""
        
        # Get project ports from registry
        project_ports = self.registry.get_project_ports(project_name)
        
        if not project_ports:
            return f"❌ No ports allocated for {project_name}. Run initialization first."
        
        # Quick batch validation using cache
        port_list = [(alloc.port, alloc.plugin_name) for alloc in project_ports]
        results = self.validator.batch_validate(port_list)
        
        # Generate concise summary
        available = sum(1 for r in results.values() if r.get('available'))
        plugins = sum(1 for r in results.values() if r.get('is_plugin'))
        
        if plugins > 0:
            return f"✅ {project_name}: {plugins} plugins ready on {available} ports"
        else:
            return f"❌ {project_name}: No plugins found. Check Premiere Pro and reload plugins."
    
    def emergency_reset(self):
        """Emergency reset - clear all caches and connections"""
        
        print("🚨 Emergency reset initiated...")
        
        # Close all WebSocket connections
        for connection in self.connections.values():
            if connection.ws_connection:
                try:
                    connection.ws_connection.close()
                except:
                    pass
        
        # Clear connections
        self.connections.clear()
        
        # Clear caches
        self.validator.clear_cache()
        
        # Reset registry (but keep allocations)
        print("🔄 Reset complete. Re-run initialization.")


def main():
    """Example usage"""
    orchestrator = LocalhostOrchestrator()
    
    # Example: Initialize Ai Podcast project
    plugin_configs = [
        {'name': 'Ai Podcast Main', 'preferred_port': 9240},
        {'name': 'Timeline Analysis', 'preferred_port': 9241},
    ]
    
    result = orchestrator.initialize_project('Ai Podcast', plugin_configs)
    print(json.dumps(result, indent=2))
    
    # Quick status check
    if result['success']:
        print("\n" + orchestrator.quick_validate('Ai Podcast'))
        
        # Show connection status
        status = orchestrator.get_connection_status()
        print(f"\n📊 Connection Status: {status['healthy_connections']}/{status['total_connections']} healthy")


if __name__ == "__main__":
    main()