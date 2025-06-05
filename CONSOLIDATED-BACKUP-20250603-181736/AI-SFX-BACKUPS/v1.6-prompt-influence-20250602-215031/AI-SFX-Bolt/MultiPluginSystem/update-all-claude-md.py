#!/usr/bin/env python3
"""
Cross-Plugin CLAUDE.md Updater - MultiPluginSystem Tool
Updates all plugin CLAUDE.md files with critical instructions
Part of the unified MultiPluginSystem for cross-plugin development
"""

import os
import sys
from pathlib import Path

# MultiPluginSystem base path
MULTIPLUGIN_SYSTEM_PATH = "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CONSOLIDATED-BACKUP-20250603-181736/AI-SFX-BACKUPS/v1.6-prompt-influence-20250602-215031/AI-SFX-Bolt/MultiPluginSystem"

# All known CLAUDE.md file locations
CLAUDE_MD_PATHS = [
    # Text Editor Plugins
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/Test-cwyyx8/CLAUDE.md",
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/Test-cwyyx8-BOLT/CLAUDE.md",
    
    # Main Plugin Projects
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai Video Namer/CLAUDE.md",
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CLAUDE.md",
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/CLAUDE.md", 
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai Podcast/CLAUDE.md",
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai Podcast/archive/CLAUDE.md",
    
    # Backup Locations
    "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CONSOLIDATED-BACKUP-20250603-181736/CEP-Plugin/CLAUDE.md",
]

def add_section_to_file(file_path, section_marker, new_content):
    """Add or update a section in a CLAUDE.md file"""
    try:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return False
            
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if section already exists
        if section_marker in content:
            print(f"✅ Section already exists in: {Path(file_path).parent.name}")
            return True
            
        # Add section before the last line or at the end
        lines = content.split('\n')
        
        # Find a good insertion point (before final lines or after existing sections)
        insert_index = len(lines)
        for i, line in enumerate(lines):
            if line.startswith('---') and i > 10:  # After main content
                insert_index = i
                break
                
        # Insert the new section
        lines.insert(insert_index, '')
        lines.insert(insert_index + 1, new_content)
        lines.insert(insert_index + 2, '')
        
        # Write back to file
        with open(file_path, 'w') as f:
            f.write('\n'.join(lines))
            
        print(f"✅ Updated: {Path(file_path).parent.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def update_premiere_reload_instructions():
    """Add 'Never Restart Premiere' instructions to all CLAUDE.md files"""
    
    reload_section = """## ⚠️ CRITICAL: Never Restart Premiere
- **🔄 NEVER RESTART PREMIERE** - Use plugin reload instead:
  - `npm/yarn run dev` for hot reload development
  - Right-click plugin panel → Reload Extension  
  - Only restart Premiere as absolute last resort"""
    
    print("🔄 Updating all plugin CLAUDE.md files with reload instructions...")
    
    updated_count = 0
    for file_path in CLAUDE_MD_PATHS:
        if add_section_to_file(file_path, "Never Restart Premiere", reload_section):
            updated_count += 1
    
    print(f"\n✅ Updated {updated_count} CLAUDE.md files")
    return updated_count

def update_cross_plugin_tools():
    """Add cross-plugin updater tool reference to all CLAUDE.md files"""
    
    tool_section = f"""## 🛠️ Cross-Plugin Tools (MultiPluginSystem)
```bash
# Update ALL plugin CLAUDE.md files from any session  
python3 {MULTIPLUGIN_SYSTEM_PATH}/update-all-claude-md.py all

# Individual operations:
python3 {MULTIPLUGIN_SYSTEM_PATH}/update-all-claude-md.py reload    # Add reload instructions
python3 {MULTIPLUGIN_SYSTEM_PATH}/update-all-claude-md.py tools     # Add tool references
```"""
    
    print("🛠️ Adding cross-plugin tool references...")
    
    updated_count = 0  
    for file_path in CLAUDE_MD_PATHS:
        if add_section_to_file(file_path, "Cross-Plugin Tools", tool_section):
            updated_count += 1
    
    print(f"✅ Added tool references to {updated_count} files")
    return updated_count

def main():
    """Main updater function"""
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == "reload":
            update_premiere_reload_instructions()
        elif action == "tools":
            update_cross_plugin_tools()
        elif action == "all":
            update_premiere_reload_instructions()
            update_cross_plugin_tools()
        else:
            print("Usage: python3 update-all-claude-md.py [reload|tools|all]")
    else:
        # Default: update everything
        print("🚀 Updating all CLAUDE.md files...")
        update_premiere_reload_instructions()
        update_cross_plugin_tools()
        print("\n🎉 All plugin CLAUDE.md files updated!")

if __name__ == "__main__":
    main()