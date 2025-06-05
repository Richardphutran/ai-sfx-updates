#!/usr/bin/env python3
"""
Multi-Plugin Knowledge Management Engine
Efficiently share learnings across plugin development sessions
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set
import shutil

class KnowledgeEngine:
    def __init__(self, base_path: str = None):
        """Initialize the knowledge management system"""
        if base_path:
            self.base_path = Path(base_path)
        else:
            # Default to MultiPluginSystem directory
            self.base_path = Path(__file__).parent
        
        self.knowledge_dir = self.base_path / "knowledge-base"
        self.registry_dir = self.base_path / "plugin-registry"
        
        # Create directory structure if it doesn't exist
        self._initialize_structure()
        
    def _initialize_structure(self):
        """Create the knowledge base directory structure"""
        categories = [
            "core",
            "ui-ux", 
            "debugging",
            "automation",
            "api-integration",
            "performance"
        ]
        
        # Create main directories
        self.knowledge_dir.mkdir(exist_ok=True)
        self.registry_dir.mkdir(exist_ok=True)
        
        # Create category directories
        for category in categories:
            (self.knowledge_dir / category).mkdir(exist_ok=True)
            
        # Initialize registry files if they don't exist
        if not (self.registry_dir / "active-plugins.json").exists():
            with open(self.registry_dir / "active-plugins.json", 'w') as f:
                json.dump({}, f, indent=2)
                
        if not (self.registry_dir / "learning-history.json").exists():
            with open(self.registry_dir / "learning-history.json", 'w') as f:
                json.dump({}, f, indent=2)
                
    def extract_knowledge_from_claude_md(self, claude_md_path: str, plugin_name: str):
        """Extract knowledge from an existing CLAUDE.md file and categorize it"""
        with open(claude_md_path, 'r') as f:
            content = f.read()
            
        # Extract different sections
        sections = self._parse_markdown_sections(content)
        
        # Categorize and save knowledge
        for section_title, section_content in sections.items():
            category, topic = self._categorize_section(section_title, section_content)
            if category:
                self.add_knowledge(
                    plugin_name=plugin_name,
                    category=category,
                    topic=topic,
                    content=section_content,
                    confidence="high" if "working" in section_title.lower() else "medium"
                )
                
    def _parse_markdown_sections(self, content: str) -> Dict[str, str]:
        """Parse markdown content into sections"""
        sections = {}
        current_section = None
        current_content = []
        
        for line in content.split('\n'):
            if line.startswith('##'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content)
                current_section = line.strip('# ').strip()
                current_content = []
            elif current_section:
                current_content.append(line)
                
        if current_section:
            sections[current_section] = '\n'.join(current_content)
            
        return sections
        
    def _categorize_section(self, title: str, content: str) -> tuple:
        """Categorize a section based on its title and content"""
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Categorization rules
        if any(keyword in title_lower for keyword in ['debug', 'error', 'issue', 'problem']):
            return 'debugging', self._sanitize_filename(title)
        elif any(keyword in title_lower for keyword in ['ui', 'ux', 'design', 'style', 'css']):
            return 'ui-ux', self._sanitize_filename(title)
        elif any(keyword in title_lower for keyword in ['api', 'extendscript', 'cep', 'adobe']):
            return 'core', self._sanitize_filename(title)
        elif any(keyword in title_lower for keyword in ['python', 'script', 'automat', 'workflow']):
            return 'automation', self._sanitize_filename(title)
        elif any(keyword in title_lower for keyword in ['performance', 'optim', 'speed', 'cache']):
            return 'performance', self._sanitize_filename(title)
        elif 'api' in content_lower or 'fetch' in content_lower:
            return 'api-integration', self._sanitize_filename(title)
            
        return None, None
        
    def _sanitize_filename(self, name: str) -> str:
        """Convert a string to a valid filename"""
        # Remove special characters and replace spaces
        name = re.sub(r'[^\w\s-]', '', name)
        name = re.sub(r'[-\s]+', '-', name)
        return name.lower()[:50]  # Limit length
        
    def add_knowledge(self, plugin_name: str, category: str, topic: str, 
                     content: str, confidence: str = "medium"):
        """Add new knowledge to the system"""
        # Create knowledge module
        module_path = self.knowledge_dir / category / f"{topic}.md"
        
        # Format the knowledge entry
        entry = f"""# Module: {category}/{topic}
**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
**Confidence:** {confidence}
**Contributed By:** {plugin_name}

## Content
{content}

---
"""
        
        # Append or create file
        if module_path.exists():
            with open(module_path, 'a') as f:
                f.write(f"\n\n{entry}")
        else:
            with open(module_path, 'w') as f:
                f.write(entry)
                
        # Update learning history
        self._update_learning_history(plugin_name, category, topic)
        
        print(f"✅ Added knowledge: {category}/{topic} from {plugin_name}")
        
    def _update_learning_history(self, plugin_name: str, category: str, topic: str):
        """Track what each plugin has contributed"""
        history_file = self.registry_dir / "learning-history.json"
        
        with open(history_file, 'r') as f:
            history = json.load(f)
            
        if plugin_name not in history:
            history[plugin_name] = {"contributions": [], "last_updated": ""}
            
        history[plugin_name]["contributions"].append({
            "category": category,
            "topic": topic,
            "timestamp": datetime.now().isoformat()
        })
        history[plugin_name]["last_updated"] = datetime.now().isoformat()
        
        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)
            
    def get_knowledge_for_task(self, plugin_name: str, task_description: str) -> str:
        """Get relevant knowledge for a specific task"""
        # Extract keywords from task
        keywords = self._extract_keywords(task_description)
        
        # Find relevant modules
        relevant_modules = []
        for category_dir in self.knowledge_dir.iterdir():
            if category_dir.is_dir():
                for module_file in category_dir.glob("*.md"):
                    if self._is_relevant(module_file, keywords):
                        relevant_modules.append(module_file)
                        
        # Compile knowledge
        knowledge_content = f"# Relevant Knowledge for: {task_description}\n\n"
        
        for module in relevant_modules[:5]:  # Limit to top 5 most relevant
            with open(module, 'r') as f:
                knowledge_content += f"\n## From {module.relative_to(self.knowledge_dir)}\n"
                knowledge_content += f.read()
                knowledge_content += "\n\n---\n\n"
                
        return knowledge_content
        
    def _extract_keywords(self, text: str) -> Set[str]:
        """Extract keywords from task description"""
        # Simple keyword extraction
        words = re.findall(r'\b\w+\b', text.lower())
        # Filter common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        return set(w for w in words if w not in stop_words and len(w) > 3)
        
    def _is_relevant(self, module_path: Path, keywords: Set[str]) -> bool:
        """Check if a module is relevant based on keywords"""
        # Check filename
        filename_words = set(module_path.stem.split('-'))
        if keywords & filename_words:
            return True
            
        # Check content (first 500 chars for efficiency)
        try:
            with open(module_path, 'r') as f:
                content = f.read(500).lower()
                return any(keyword in content for keyword in keywords)
        except:
            return False
            
    def generate_minimal_claude_md(self, plugin_name: str, project_root: str, 
                                  task: Optional[str] = None) -> str:
        """Generate a minimal CLAUDE.md with only essential knowledge"""
        content = f"""# CLAUDE.md - {plugin_name}

This file provides minimal, task-specific guidance for Claude Code.

## Project Overview
Plugin: {plugin_name}
Knowledge Base: {self.knowledge_dir.relative_to(project_root) if project_root else self.knowledge_dir}

## Essential Knowledge Access
```python
# To get knowledge for your current task:
from MultiPluginSystem.knowledge_engine import KnowledgeEngine
ke = KnowledgeEngine()
knowledge = ke.get_knowledge_for_task('{plugin_name}', 'your task description')
```

"""
        
        if task:
            content += f"## Current Task Knowledge\n"
            content += self.get_knowledge_for_task(plugin_name, task)
        else:
            # Include only most essential knowledge
            content += "## Core References\n"
            essential_modules = [
                "core/cep-architecture",
                "debugging/common-issues",
                "core/extendscript"
            ]
            
            for module_name in essential_modules:
                module_path = self.knowledge_dir / f"{module_name}.md"
                if module_path.exists():
                    content += f"\n### {module_name}\n"
                    with open(module_path, 'r') as f:
                        # Include first 20 lines only
                        lines = f.readlines()[:20]
                        content += ''.join(lines)
                        if len(lines) == 20:
                            content += "\n... [truncated for brevity]\n"
                            
        content += """
## Knowledge Categories Available
- core/ - Adobe APIs, ExtendScript, CEP architecture
- ui-ux/ - Design patterns, components, styling  
- debugging/ - Common issues, breakthroughs
- automation/ - Scripts, testing, workflows
- api-integration/ - External APIs, auth, files
- performance/ - Optimization, caching, memory

## Contributing Knowledge
When you discover something new:
```python
ke.add_knowledge('{plugin_name}', 'category', 'topic-name', 'Your discovery content')
```
""".replace('{plugin_name}', plugin_name)
        
        return content
        
    def migrate_from_large_claude_md(self, large_claude_path: str, plugin_name: str,
                                    output_claude_path: str):
        """Migrate from a large CLAUDE.md to the modular system"""
        print(f"🔄 Migrating knowledge from {large_claude_path}...")
        
        # Extract and categorize knowledge
        self.extract_knowledge_from_claude_md(large_claude_path, plugin_name)
        
        # Generate new minimal CLAUDE.md
        project_root = str(Path(large_claude_path).parent)
        minimal_content = self.generate_minimal_claude_md(plugin_name, project_root)
        
        # Write new CLAUDE.md
        with open(output_claude_path, 'w') as f:
            f.write(minimal_content)
            
        print(f"✅ Migration complete! New minimal CLAUDE.md created at {output_claude_path}")
        print(f"📚 Knowledge modules created in {self.knowledge_dir}")
        
    def get_knowledge_stats(self) -> Dict:
        """Get statistics about the knowledge base"""
        stats = {
            "total_modules": 0,
            "by_category": {},
            "recent_contributions": []
        }
        
        # Count modules by category
        for category_dir in self.knowledge_dir.iterdir():
            if category_dir.is_dir():
                count = len(list(category_dir.glob("*.md")))
                stats["by_category"][category_dir.name] = count
                stats["total_modules"] += count
                
        # Get recent contributions
        history_file = self.registry_dir / "learning-history.json"
        if history_file.exists():
            with open(history_file, 'r') as f:
                history = json.load(f)
                
            all_contributions = []
            for plugin, data in history.items():
                for contrib in data.get("contributions", []):
                    contrib["plugin"] = plugin
                    all_contributions.append(contrib)
                    
            # Sort by timestamp and get recent 10
            all_contributions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            stats["recent_contributions"] = all_contributions[:10]
            
        return stats


def main():
    """CLI interface for the knowledge engine"""
    import sys
    
    if len(sys.argv) < 2:
        print("""
🧠 Multi-Plugin Knowledge Engine

Usage:
  python3 knowledge_engine.py <command> [args]

Commands:
  migrate <claude_md_path> <plugin_name>     Migrate from large CLAUDE.md
  add <plugin> <category> <topic>            Add knowledge (reads from stdin)
  get <plugin> <task_description>            Get relevant knowledge
  stats                                      Show knowledge base statistics
  init <plugin_name>                         Initialize for new plugin

Examples:
  python3 knowledge_engine.py migrate ../CLAUDE.md ai-sfx-plugin
  python3 knowledge_engine.py get ai-sfx-plugin "implement timeline detection"
  echo "Discovery content" | python3 knowledge_engine.py add ai-sfx debugging timeline-fix
""")
        return
        
    ke = KnowledgeEngine()
    command = sys.argv[1]
    
    if command == "migrate" and len(sys.argv) >= 4:
        claude_path = sys.argv[2]
        plugin_name = sys.argv[3]
        output_path = sys.argv[4] if len(sys.argv) > 4 else "CLAUDE.md"
        ke.migrate_from_large_claude_md(claude_path, plugin_name, output_path)
        
    elif command == "add" and len(sys.argv) >= 5:
        plugin = sys.argv[2]
        category = sys.argv[3]
        topic = sys.argv[4]
        content = sys.stdin.read()
        ke.add_knowledge(plugin, category, topic, content)
        
    elif command == "get" and len(sys.argv) >= 4:
        plugin = sys.argv[2]
        task = ' '.join(sys.argv[3:])
        print(ke.get_knowledge_for_task(plugin, task))
        
    elif command == "stats":
        stats = ke.get_knowledge_stats()
        print(f"\n📊 Knowledge Base Statistics")
        print(f"Total Modules: {stats['total_modules']}")
        print(f"\nBy Category:")
        for cat, count in stats['by_category'].items():
            print(f"  {cat}: {count} modules")
        print(f"\nRecent Contributions:")
        for contrib in stats['recent_contributions'][:5]:
            print(f"  - {contrib['plugin']}: {contrib['category']}/{contrib['topic']}")
            
    elif command == "init" and len(sys.argv) >= 3:
        plugin_name = sys.argv[2]
        minimal_claude = ke.generate_minimal_claude_md(plugin_name, os.getcwd())
        print(minimal_claude)
        

if __name__ == "__main__":
    main()