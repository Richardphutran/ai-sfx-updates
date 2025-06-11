#!/usr/bin/env python3
"""
Project Organizer - Multi-Plugin Tool & MD File Organization System
Consolidates scattered tools and documentation across all Premiere plugin projects
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
import re

class ProjectOrganizer:
    def __init__(self):
        self.base_path = Path("/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins")
        self.multiplugin_system = self.base_path / "MultiPluginSystem"
        self.current_project = Path(os.getcwd()).name
        
        # Create organization structure
        self.organized_structure = {
            "active_tools": self.multiplugin_system / "active-tools",
            "archived_tools": self.multiplugin_system / "archived-tools", 
            "shared_docs": self.multiplugin_system / "shared-docs",
            "project_docs": self.multiplugin_system / "project-specific-docs"
        }
        
        # Ensure directories exist
        for path in self.organized_structure.values():
            path.mkdir(parents=True, exist_ok=True)
            
        # Tool classification patterns (based on current usage)
        self.tool_patterns = {
            "active": [
                "smart_helper.py", "cep_debug.py", "autonomous_plugin_tester.py",
                "knowledge_manager.py", "plugin_dev_helper.py", "status.py", 
                "quick_start.py", "verify_tool_usage.py"
            ],
            "utility": [
                "force_plugin_reload.py", "restart_plugin.py", "get_console*.py",
                "check_*.py", "debug_*.py", "inspect_*.py", "fix.py"
            ],
            "deprecated": [
                "depricated_*.py", "*_archived.py", "*_backup.py", 
                "smart_helper_v2.py.archived"
            ]
        }
        
        # MD file classification
        self.md_patterns = {
            "core": ["CLAUDE.md", "PRD.md", "README.md"],
            "debugging": ["*DEBUG*.md", "*TROUBLESHOOT*.md", "*FIX*.md"],
            "feature": ["PRD_*.md", "FEATURE_*.md", "*_ANALYSIS.md"],
            "workflow": ["WORKFLOW*.md", "*GUIDE*.md", "*SOLUTION*.md"],
            "archive": ["*_BACKUP*.md", "*_OLD*.md", "*_ARCHIVE*.md"]
        }

    def scan_all_projects(self):
        """Scan all plugin projects for tools and MD files"""
        projects = {}
        
        for project_dir in self.base_path.glob("*/"):
            if project_dir.is_dir() and project_dir.name != "MultiPluginSystem":
                tools = list(project_dir.glob("*.py"))
                md_files = list(project_dir.glob("*.md"))
                
                projects[project_dir.name] = {
                    "path": project_dir,
                    "tools": tools,
                    "md_files": md_files,
                    "tool_count": len(tools),
                    "md_count": len(md_files)
                }
                
        return projects

    def classify_tool(self, tool_path):
        """Classify tool based on name patterns and CLAUDE.md references"""
        tool_name = tool_path.name
        
        # FIRST: Check if tool is referenced in CLAUDE.md (highest priority)
        if self._is_tool_referenced_in_claude_md(tool_path):
            return "keep_in_project"  # Keep tools used according to CLAUDE.md
            
        # Check active tools
        if tool_name in self.tool_patterns["active"]:
            return "active"
            
        # Check utility patterns
        for pattern in self.tool_patterns["utility"]:
            if self._matches_pattern(tool_name, pattern):
                return "utility"
                
        # Check deprecated patterns
        for pattern in self.tool_patterns["deprecated"]:
            if self._matches_pattern(tool_name, pattern):
                return "deprecated"
                
        return "utility"

    def classify_md_file(self, md_path):
        """Classify MD file based on name and content - KEEP PRD files in project"""
        md_name = md_path.name
        
        # FIRST: Keep PRD files in project (highest priority)
        if "prd" in md_name.lower() or "PRD" in md_name:
            return "keep_in_project"
            
        for category, patterns in self.md_patterns.items():
            for pattern in patterns:
                if self._matches_pattern(md_name, pattern):
                    return category
                    
        return "workflow"  # Default category

    def _matches_pattern(self, filename, pattern):
        """Check if filename matches wildcard pattern"""
        import fnmatch
        return fnmatch.fnmatch(filename, pattern)

    def _is_tool_referenced_in_claude_md(self, tool_path):
        """Check if tool is referenced in CLAUDE.md - these tools stay in project"""
        project_dir = tool_path.parent
        claude_md = project_dir / "CLAUDE.md"
        
        if claude_md.exists():
            try:
                content = claude_md.read_text()
                tool_name = tool_path.name
                
                # Check for various reference patterns
                patterns = [
                    tool_name,  # Direct filename
                    tool_name.replace('.py', ''),  # Without extension
                    f"python3 {tool_name}",  # Command usage
                    f"`{tool_name}`",  # Code blocks
                    f"{tool_name} ",  # With space
                ]
                
                for pattern in patterns:
                    if pattern in content:
                        return True
                        
            except Exception:
                pass
                
        return False

    def organize_tools(self, dry_run=True):
        """Organize tools across all projects"""
        projects = self.scan_all_projects()
        organization_plan = {}
        
        for project_name, project_info in projects.items():
            organization_plan[project_name] = {
                "keep_in_project": [],
                "active": [],
                "utility": [],
                "deprecated": [],
                "actions": []
            }
            
            for tool_path in project_info["tools"]:
                category = self.classify_tool(tool_path)
                organization_plan[project_name][category].append(tool_path.name)
                
                # Determine action
                if category == "keep_in_project":
                    # Keep tools referenced in CLAUDE.md in their project
                    action = f"KEEP: {tool_path} (referenced in CLAUDE.md)"
                elif category == "active":
                    # Create symlink in active-tools if not exist
                    target = self.organized_structure["active_tools"] / f"{project_name}_{tool_path.name}"
                    action = f"SYMLINK: {tool_path} -> {target}"
                elif category == "deprecated":
                    # Archive deprecated tools
                    target = self.organized_structure["archived_tools"] / project_name / tool_path.name
                    action = f"ARCHIVE: {tool_path} -> {target}"
                else:
                    # Keep utility tools in place but document
                    action = f"DOCUMENT: {tool_path} (utility)"
                    
                organization_plan[project_name]["actions"].append(action)
                
                # Execute if not dry run
                if not dry_run:
                    self._execute_tool_action(action, tool_path)
                    
        return organization_plan

    def organize_md_files(self, dry_run=True):
        """Organize MD files across all projects"""
        projects = self.scan_all_projects()
        md_organization = {}
        
        for project_name, project_info in projects.items():
            md_organization[project_name] = {
                "keep_in_project": [],
                "core": [],
                "debugging": [],
                "feature": [],
                "workflow": [],
                "archive": [],
                "actions": []
            }
            
            for md_path in project_info["md_files"]:
                category = self.classify_md_file(md_path)
                md_organization[project_name][category].append(md_path.name)
                
                # Determine action based on category
                if category == "keep_in_project":
                    # Keep PRD files and CLAUDE.md files in project
                    action = f"KEEP: {md_path} (PRD file - stays in project)"
                elif category == "core":
                    # Keep core files in place, create reference
                    action = f"REFERENCE: {md_path} (keep in project)"
                elif category == "archive":
                    # Move to archived
                    target = self.organized_structure["archived_tools"] / project_name / "docs" / md_path.name
                    action = f"ARCHIVE: {md_path} -> {target}"
                else:
                    # Create organized copy in shared docs
                    target = self.organized_structure["shared_docs"] / category / f"{project_name}_{md_path.name}"
                    action = f"COPY: {md_path} -> {target}"
                    
                md_organization[project_name]["actions"].append(action)
                
                # Execute if not dry run
                if not dry_run:
                    self._execute_md_action(action, md_path)
                    
        return md_organization

    def _execute_tool_action(self, action, tool_path):
        """Execute tool organization action"""
        if action.startswith("SYMLINK:"):
            source, target = action.split(" -> ")
            source_path = Path(source.split(": ")[1])
            target_path = Path(target)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            if not target_path.exists():
                target_path.symlink_to(source_path)
                
        elif action.startswith("ARCHIVE:"):
            source, target = action.split(" -> ")
            source_path = Path(source.split(": ")[1])
            target_path = Path(target)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            if not target_path.exists():
                shutil.copy2(source_path, target_path)

    def _execute_md_action(self, action, md_path):
        """Execute MD file organization action"""
        if action.startswith("COPY:"):
            source, target = action.split(" -> ")
            source_path = Path(source.split(": ")[1])
            target_path = Path(target)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            if not target_path.exists():
                shutil.copy2(source_path, target_path)

    def create_central_index(self):
        """Create central index of all organized tools and docs"""
        projects = self.scan_all_projects()
        
        index = {
            "generated": datetime.now().isoformat(),
            "total_projects": len(projects),
            "organized_structure": {str(k): str(v) for k, v in self.organized_structure.items()},
            "projects": {}
        }
        
        for project_name, project_info in projects.items():
            index["projects"][project_name] = {
                "tool_count": project_info["tool_count"],
                "md_count": project_info["md_count"],
                "tools": [t.name for t in project_info["tools"]],
                "md_files": [m.name for m in project_info["md_files"]]
            }
            
        # Save index
        index_file = self.multiplugin_system / "organization_index.json"
        with open(index_file, 'w') as f:
            json.dump(index, f, indent=2)
            
        return index

    def generate_usage_guide(self):
        """Generate usage guide for organized system"""
        guide_content = f"""# Multi-Plugin Organization System

## Quick Access Commands

### Active Tools (Symlinked)
```bash
# Use any active tool from anywhere:
python3 {self.organized_structure['active_tools']}/[PROJECT]_[TOOL].py

# Examples:
python3 {self.organized_structure['active_tools']}/Ai_Video_Namer_smart_helper.py
python3 {self.organized_structure['active_tools']}/Ai_SFX_cep_debug.py
```

### Shared Documentation
```bash
# View organized docs by category:
ls {self.organized_structure['shared_docs']}/debugging/
ls {self.organized_structure['shared_docs']}/workflow/
```

### Project-Specific Access
Each project maintains core files (CLAUDE.md, PRD.md) in original location.
Organized copies available in shared system for cross-reference.

## Structure
- `active-tools/`: Symlinks to most-used tools across all projects
- `archived-tools/`: Deprecated/backup tools and docs 
- `shared-docs/`: Categorized documentation by type
- `project-specific-docs/`: Project-unique documentation

## Integration with Existing Tools
- CEP_debug.py automatically detects organized structure
- smart_helper.py can access tools from any project
- Tool consolidation maintains backward compatibility

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        guide_file = self.multiplugin_system / "ORGANIZATION_GUIDE.md"
        guide_file.write_text(guide_content)
        return guide_file

def main():
    organizer = ProjectOrganizer()
    
    if len(sys.argv) < 2:
        print("Usage: python3 project_organizer.py [scan|organize|index|guide]")
        print("  scan     - Scan all projects and show current state")
        print("  organize - Organize tools and docs (dry run by default)")
        print("  execute  - Actually execute organization")
        print("  index    - Create central index")
        print("  guide    - Generate usage guide")
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "scan":
        projects = organizer.scan_all_projects()
        print(f"Found {len(projects)} projects:")
        for name, info in projects.items():
            print(f"  {name}: {info['tool_count']} tools, {info['md_count']} MD files")
            
    elif action == "organize":
        print("=== DRY RUN - Tool Organization Plan ===")
        tool_plan = organizer.organize_tools(dry_run=True)
        for project, plan in tool_plan.items():
            print(f"\n{project}:")
            for action in plan["actions"]:
                print(f"  {action}")
                
        print("\n=== DRY RUN - MD Organization Plan ===")
        md_plan = organizer.organize_md_files(dry_run=True)
        for project, plan in md_plan.items():
            print(f"\n{project}:")
            for action in plan["actions"]:
                print(f"  {action}")
                
    elif action == "execute":
        print("Executing organization...")
        organizer.organize_tools(dry_run=False)
        organizer.organize_md_files(dry_run=False)
        print("✅ Organization complete")
        
    elif action == "index":
        index = organizer.create_central_index()
        print(f"✅ Created index: {organizer.multiplugin_system}/organization_index.json")
        
    elif action == "guide":
        guide = organizer.generate_usage_guide()
        print(f"✅ Created guide: {guide}")
        
    else:
        print(f"Unknown action: {action}")

if __name__ == "__main__":
    main()