#!/usr/bin/env python3
"""
Knowledge Sync Tool - Keep all plugins learning from each other
"""

import json
import os
from pathlib import Path
from datetime import datetime
from knowledge_engine import KnowledgeEngine

class KnowledgeSync:
    def __init__(self):
        self.ke = KnowledgeEngine()
        self.sync_log_path = self.ke.registry_dir / "sync-log.json"
        
    def auto_discover_plugins(self):
        """Find all registered plugins"""
        plugins_file = self.ke.registry_dir / "active-plugins.json"
        if plugins_file.exists():
            with open(plugins_file, 'r') as f:
                return json.load(f)
        return {}
        
    def check_plugin_changes(self, plugin_name: str, plugin_path: str) -> list:
        """Check if a plugin has new discoveries to share"""
        changes = []
        
        # Check for new files in plugin directory that might contain knowledge
        knowledge_indicators = [
            "DISCOVERIES.md",
            "BREAKTHROUGHS.md", 
            "NOTES.md",
            "DEBUG_LOG.md"
        ]
        
        plugin_dir = Path(plugin_path)
        for indicator in knowledge_indicators:
            file_path = plugin_dir / indicator
            if file_path.exists():
                # Check if we've already processed this file
                if not self._already_synced(plugin_name, str(file_path)):
                    changes.append({
                        "type": "discovery_file",
                        "path": str(file_path),
                        "plugin": plugin_name
                    })
                    
        return changes
        
    def _already_synced(self, plugin_name: str, file_path: str) -> bool:
        """Check if we've already processed this file"""
        if self.sync_log_path.exists():
            with open(self.sync_log_path, 'r') as f:
                sync_log = json.load(f)
                plugin_log = sync_log.get(plugin_name, {})
                synced_files = plugin_log.get("synced_files", [])
                return file_path in synced_files
        return False
        
    def sync_discovery(self, change: dict):
        """Sync a discovery to the knowledge base"""
        file_path = change["path"]
        plugin_name = change["plugin"]
        
        print(f"📥 Syncing discovery from {plugin_name}: {Path(file_path).name}")
        
        # Read the discovery file
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Extract title from first line
        lines = content.split('\n')
        title = lines[0].strip('#').strip() if lines else "Untitled Discovery"
        
        # Determine category based on content
        category = self._determine_category(content)
        topic = self.ke._sanitize_filename(title)
        
        # Add to knowledge base
        self.ke.add_knowledge(plugin_name, category, topic, content, confidence="high")
        
        # Log the sync
        self._log_sync(plugin_name, file_path)
        
    def _determine_category(self, content: str) -> str:
        """Intelligently determine category for content"""
        content_lower = content.lower()
        
        if "debug" in content_lower or "error" in content_lower:
            return "debugging"
        elif "ui" in content_lower or "design" in content_lower:
            return "ui-ux"
        elif "performance" in content_lower or "speed" in content_lower:
            return "performance"
        elif "api" in content_lower or "http" in content_lower:
            return "api-integration"
        elif "script" in content_lower or "automat" in content_lower:
            return "automation"
        else:
            return "core"
            
    def _log_sync(self, plugin_name: str, file_path: str):
        """Log that we've synced this file"""
        sync_log = {}
        if self.sync_log_path.exists():
            with open(self.sync_log_path, 'r') as f:
                sync_log = json.load(f)
                
        if plugin_name not in sync_log:
            sync_log[plugin_name] = {"synced_files": [], "last_sync": ""}
            
        sync_log[plugin_name]["synced_files"].append(file_path)
        sync_log[plugin_name]["last_sync"] = datetime.now().isoformat()
        
        with open(self.sync_log_path, 'w') as f:
            json.dump(sync_log, f, indent=2)
            
    def generate_knowledge_report(self):
        """Generate a report of all available knowledge"""
        stats = self.ke.get_knowledge_stats()
        
        report = f"""# 📚 Knowledge Base Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Overview
- Total Knowledge Modules: {stats['total_modules']}
- Active Plugins: {len(self.auto_discover_plugins())}

## Knowledge by Category
"""
        
        for category, count in stats['by_category'].items():
            report += f"### {category.title()} ({count} modules)\n"
            
            # List modules in this category
            category_path = self.ke.knowledge_dir / category
            if category_path.exists():
                for module in sorted(category_path.glob("*.md")):
                    report += f"- {module.stem}\n"
            report += "\n"
            
        report += "## Recent Contributions\n"
        for contrib in stats['recent_contributions'][:10]:
            report += f"- **{contrib['plugin']}**: {contrib['category']}/{contrib['topic']}\n"
            
        return report
        
    def sync_all_plugins(self):
        """Sync discoveries from all registered plugins"""
        plugins = self.auto_discover_plugins()
        
        if not plugins:
            print("❌ No plugins registered yet. Register plugins first.")
            return
            
        print(f"🔄 Syncing knowledge from {len(plugins)} plugins...")
        
        total_synced = 0
        for plugin_name, plugin_info in plugins.items():
            plugin_path = plugin_info.get("path", "")
            if plugin_path and os.path.exists(plugin_path):
                changes = self.check_plugin_changes(plugin_name, plugin_path)
                for change in changes:
                    self.sync_discovery(change)
                    total_synced += 1
                    
        print(f"✅ Synced {total_synced} new discoveries")
        
        # Generate and save report
        report = self.generate_knowledge_report()
        report_path = self.ke.base_path / "KNOWLEDGE_REPORT.md"
        with open(report_path, 'w') as f:
            f.write(report)
        print(f"📊 Knowledge report saved to {report_path}")


def register_plugin(name: str, path: str):
    """Register a plugin with the knowledge system"""
    ke = KnowledgeEngine()
    plugins_file = ke.registry_dir / "active-plugins.json"
    
    plugins = {}
    if plugins_file.exists():
        with open(plugins_file, 'r') as f:
            plugins = json.load(f)
            
    plugins[name] = {
        "path": path,
        "registered": datetime.now().isoformat()
    }
    
    with open(plugins_file, 'w') as f:
        json.dump(plugins, f, indent=2)
        
    print(f"✅ Registered plugin: {name} at {path}")


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("""
🔄 Knowledge Sync Tool

Usage:
  python3 sync_knowledge.py <command> [args]

Commands:
  register <name> <path>     Register a plugin for knowledge sharing
  sync                       Sync all plugin discoveries
  report                     Generate knowledge report
  
Examples:
  python3 sync_knowledge.py register "ai-sfx" "/path/to/ai-sfx"
  python3 sync_knowledge.py sync
  python3 sync_knowledge.py report
""")
        return
        
    command = sys.argv[1]
    
    if command == "register" and len(sys.argv) >= 4:
        name = sys.argv[2]
        path = sys.argv[3]
        register_plugin(name, path)
        
    elif command == "sync":
        ks = KnowledgeSync()
        ks.sync_all_plugins()
        
    elif command == "report":
        ks = KnowledgeSync()
        report = ks.generate_knowledge_report()
        print(report)
        

if __name__ == "__main__":
    main()