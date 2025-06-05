#!/usr/bin/env python3
"""
🎯 Validate Localhost - Simple CLI for Plugin Validation
Usage: python3 validate_localhost.py [command]
"""

import sys
import json
from localhost_orchestrator import LocalhostOrchestrator

def main():
    orchestrator = LocalhostOrchestrator()
    
    if len(sys.argv) < 2:
        command = "status"
    else:
        command = sys.argv[1]
    
    if command == "init":
        # Initialize Ai Podcast project
        plugin_configs = [
            {'name': 'Ai Podcast Main', 'preferred_port': 9240},
            {'name': 'Timeline Analysis', 'preferred_port': 9241},
        ]
        
        result = orchestrator.initialize_project('Ai Podcast', plugin_configs)
        
        if result['success']:
            print("✅ Project initialized successfully!")
            print(f"   Active connections: {result['active_connections']}")
            print("   Ready for development: " + ("Yes" if result['ready_for_development'] else "No"))
        else:
            print("❌ Initialization failed:")
            print(f"   Error: {result['error']}")
            if 'recommendations' in result:
                print("   Recommendations:")
                for rec in result['recommendations']:
                    print(f"   • {rec}")
    
    elif command == "check" or command == "status":
        # Quick validation
        result = orchestrator.quick_validate('Ai Podcast')
        print(result)
        
        # Show connection status if any
        status = orchestrator.get_connection_status()
        if status['total_connections'] > 0:
            print(f"\n📊 Connections: {status['healthy_connections']}/{status['total_connections']} healthy")
    
    elif command == "reset":
        # Emergency reset
        orchestrator.emergency_reset()
    
    elif command == "ports":
        # Show port registry status
        print(orchestrator.registry.status_report())
    
    else:
        print("Usage: python3 validate_localhost.py [init|check|reset|ports]")
        print("")
        print("Commands:")
        print("  init   - Initialize project with smart port allocation")
        print("  check  - Quick validation of existing project")
        print("  reset  - Emergency reset of all connections")
        print("  ports  - Show port registry status")

if __name__ == "__main__":
    main()