#!/usr/bin/env python3
"""
Knowledge Base Maintainer - Enforces size limits and organization rules
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

class KnowledgeMaintainer:
    def __init__(self, knowledge_path: str = None):
        self.base_path = Path(knowledge_path or "shared-knowledge")
        self.max_lines = 100
        self.max_tokens = 500
        self.tokens_per_line = 5
        
    def check_file_sizes(self) -> List[Dict]:
        """Check all files against size limits"""
        oversized = []
        
        for md_file in self.base_path.rglob("*.md"):
            if md_file.name in ["INDEX.md", "README.md", "RULES.md"]:
                continue
                
            with open(md_file, 'r') as f:
                lines = f.readlines()
                line_count = len(lines)
                token_estimate = line_count * self.tokens_per_line
                
            if line_count > self.max_lines:
                oversized.append({
                    'file': md_file,
                    'lines': line_count,
                    'tokens': token_estimate,
                    'excess_lines': line_count - self.max_lines
                })
                
        return oversized
    
    def suggest_splits(self, file_path: Path) -> List[Dict]:
        """Suggest how to split an oversized file"""
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Find logical split points (## headers)
        sections = []
        current_section = {'title': 'Header', 'content': [], 'line_count': 0}
        
        for line in content.split('\n'):
            if line.startswith('## '):
                if current_section['content']:
                    sections.append(current_section)
                current_section = {
                    'title': line.strip('# '),
                    'content': [],
                    'line_count': 0
                }
            else:
                current_section['content'].append(line)
                current_section['line_count'] += 1
                
        if current_section['content']:
            sections.append(current_section)
            
        # Create split suggestions
        suggestions = []
        base_name = file_path.stem
        
        for i, section in enumerate(sections):
            if section['line_count'] > 20:  # Worth its own file
                suggested_name = f"{base_name}-{section['title'].lower().replace(' ', '-')}.md"
                suggestions.append({
                    'name': suggested_name,
                    'content': '\n'.join(section['content']),
                    'lines': section['line_count'],
                    'tokens': section['line_count'] * self.tokens_per_line
                })
                
        return suggestions
    
    def split_file(self, file_path: Path, confirm: bool = True):
        """Split an oversized file into smaller ones"""
        suggestions = self.suggest_splits(file_path)
        
        if not suggestions:
            print(f"⚠️  Could not find good split points for {file_path}")
            return
            
        print(f"\n📄 Splitting {file_path.name} ({len(suggestions)} parts):")
        for s in suggestions:
            print(f"  → {s['name']} (~{s['lines']} lines, ~{s['tokens']} tokens)")
            
        if confirm:
            response = input("\nProceed with split? (y/n): ")
            if response.lower() != 'y':
                return
                
        # Create new files
        category_dir = file_path.parent
        index_content = f"# {file_path.stem.replace('-', ' ').title()} Index\n\n"
        
        for suggestion in suggestions:
            new_file = category_dir / suggestion['name']
            
            # Add header
            header = f"""# {suggestion['name'].replace('.md', '').replace('-', ' ').title()}

**Status:** ✅ WORKING
**Tokens:** ~{suggestion['tokens']}
**Parent:** [{file_path.stem}](./INDEX.md)

"""
            
            with open(new_file, 'w') as f:
                f.write(header + suggestion['content'])
                
            index_content += f"- [{suggestion['name'].replace('.md', '')}](./{suggestion['name']}) ~{suggestion['tokens']} tokens\n"
            
        # Create index file
        index_file = category_dir / f"{file_path.stem}-INDEX.md"
        with open(index_file, 'w') as f:
            f.write(index_content)
            
        # Archive original
        archive_dir = self.base_path / "archive"
        archive_dir.mkdir(exist_ok=True)
        archive_path = archive_dir / f"{file_path.stem}-{datetime.now().strftime('%Y%m%d')}.md"
        shutil.move(str(file_path), str(archive_path))
        
        print(f"✅ Split complete! Original archived to {archive_path}")
        
    def check_category_sizes(self) -> Dict[str, Dict]:
        """Check if categories are getting too large"""
        category_stats = {}
        
        for category_dir in self.base_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('.'):
                files = list(category_dir.glob("*.md"))
                total_lines = 0
                
                for f in files:
                    with open(f, 'r') as file:
                        total_lines += len(file.readlines())
                        
                category_stats[category_dir.name] = {
                    'file_count': len(files),
                    'total_lines': total_lines,
                    'total_tokens': total_lines * self.tokens_per_line,
                    'avg_lines_per_file': total_lines // len(files) if files else 0
                }
                
        return category_stats
    
    def generate_report(self):
        """Generate a maintenance report"""
        print("\n📊 Knowledge Base Maintenance Report")
        print("=" * 50)
        
        # Check oversized files
        oversized = self.check_file_sizes()
        if oversized:
            print(f"\n⚠️  {len(oversized)} Oversized Files:")
            for item in oversized:
                print(f"  - {item['file'].relative_to(self.base_path)}")
                print(f"    {item['lines']} lines (~{item['tokens']} tokens)")
                print(f"    Excess: {item['excess_lines']} lines")
        else:
            print("\n✅ All files within size limits")
            
        # Check category sizes
        categories = self.check_category_sizes()
        print("\n📁 Category Statistics:")
        for cat, stats in categories.items():
            status = "⚠️ " if stats['file_count'] > 15 else "✅"
            print(f"\n  {status} {cat}/")
            print(f"     Files: {stats['file_count']}")
            print(f"     Total: ~{stats['total_tokens']} tokens")
            print(f"     Average: ~{stats['avg_lines_per_file']} lines/file")
            
    def auto_organize(self):
        """Automatically organize and split files"""
        oversized = self.check_file_sizes()
        
        for item in oversized:
            print(f"\n🔧 Processing {item['file'].name}...")
            self.split_file(item['file'], confirm=True)
            
    def create_category_index(self, category: str):
        """Create an index file for a category"""
        category_path = self.base_path / category
        if not category_path.exists():
            print(f"❌ Category {category} does not exist")
            return
            
        index_content = f"# {category.title()} Knowledge Index\n\n"
        total_tokens = 0
        
        files = sorted(category_path.glob("*.md"))
        for f in files:
            if f.name == "INDEX.md":
                continue
                
            with open(f, 'r') as file:
                lines = len(file.readlines())
                tokens = lines * self.tokens_per_line
                total_tokens += tokens
                
            # Extract first heading
            with open(f, 'r') as file:
                first_line = file.readline().strip('# \n')
                
            index_content += f"- [{first_line}](./{f.name}) ~{tokens} tokens\n"
            
        index_content += f"\n**Total Category:** ~{total_tokens} tokens\n"
        
        index_file = category_path / "INDEX.md"
        with open(index_file, 'w') as f:
            f.write(index_content)
            
        print(f"✅ Created index for {category}/")


def main():
    import sys
    
    maintainer = KnowledgeMaintainer()
    
    if len(sys.argv) < 2:
        print("""
🧹 Knowledge Base Maintainer

Usage:
  python3 knowledge_maintainer.py <command>

Commands:
  check      Check for oversized files and categories
  split      Interactively split oversized files  
  organize   Auto-organize the knowledge base
  index      Create index files for categories
  
Examples:
  python3 knowledge_maintainer.py check
  python3 knowledge_maintainer.py split
  python3 knowledge_maintainer.py index debugging
""")
        return
        
    command = sys.argv[1]
    
    if command == "check":
        maintainer.generate_report()
        
    elif command == "split":
        oversized = maintainer.check_file_sizes()
        if oversized:
            for item in oversized:
                maintainer.split_file(item['file'])
        else:
            print("✅ No oversized files to split")
            
    elif command == "organize":
        maintainer.auto_organize()
        
    elif command == "index":
        if len(sys.argv) > 2:
            maintainer.create_category_index(sys.argv[2])
        else:
            # Create indexes for all categories
            for cat_dir in maintainer.base_path.iterdir():
                if cat_dir.is_dir():
                    maintainer.create_category_index(cat_dir.name)
                    

if __name__ == "__main__":
    main()