#!/usr/bin/env python3
"""
Knowledge Manager - Intelligent knowledge and archival system for plugin development
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import re

class KnowledgeManager:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.knowledge_file = self.root_dir / '.plugin_knowledge_v2.json'
        self.archive_dir = self.root_dir / '.archive'
        self.knowledge_db = self.root_dir / '.knowledge_db'
        self.load_knowledge()
        
    def load_knowledge(self):
        """Load existing knowledge base"""
        self.knowledge = {}
        if self.knowledge_file.exists():
            try:
                with open(self.knowledge_file, 'r') as f:
                    self.knowledge = json.load(f)
            except:
                self.knowledge = {}
                
        # Initialize knowledge DB directory
        self.knowledge_db.mkdir(exist_ok=True)
        
    def save_knowledge(self):
        """Save knowledge base"""
        with open(self.knowledge_file, 'w') as f:
            json.dump(self.knowledge, f, indent=2)
            
    def get_content_hash(self, content):
        """Generate hash of content for deduplication"""
        return hashlib.md5(content.encode()).hexdigest()[:8]
        
    def save(self, discovery):
        """Save new knowledge discovery"""
        timestamp = datetime.now().isoformat()
        
        # Auto-detect context from current files
        context = self._detect_context()
        
        # Create knowledge entry
        entry = {
            'discovery': discovery,
            'timestamp': timestamp,
            'context': context,
            'files': self._get_relevant_files(),
            'hash': self.get_content_hash(discovery)
        }
        
        # Check for duplicates
        if self._is_duplicate(entry):
            print("✓ Knowledge already exists (skipping duplicate)")
            return
            
        # Add to knowledge base
        if 'discoveries' not in self.knowledge:
            self.knowledge['discoveries'] = []
            
        self.knowledge['discoveries'].append(entry)
        
        # Save to categorized file
        category = self._categorize_discovery(discovery)
        category_file = self.knowledge_db / f"{category}.json"
        
        category_data = []
        if category_file.exists():
            with open(category_file, 'r') as f:
                category_data = json.load(f)
                
        category_data.append(entry)
        
        with open(category_file, 'w') as f:
            json.dump(category_data, f, indent=2)
            
        self.save_knowledge()
        print(f"✓ Saved: {discovery[:50]}...")
        print(f"  Category: {category}")
        print(f"  Hash: {entry['hash']}")
        
    def find(self, topic):
        """Find relevant information"""
        results = []
        topic_lower = topic.lower()
        
        # Search in main knowledge base
        if 'discoveries' in self.knowledge:
            for entry in self.knowledge['discoveries']:
                if topic_lower in entry['discovery'].lower():
                    results.append(entry)
                    
        # Search in categorized files
        for category_file in self.knowledge_db.glob('*.json'):
            with open(category_file, 'r') as f:
                category_data = json.load(f)
                for entry in category_data:
                    if topic_lower in entry['discovery'].lower() and entry not in results:
                        results.append(entry)
                        
        if results:
            print(f"\n=== Found {len(results)} results for '{topic}' ===")
            for i, result in enumerate(results[:5]):  # Show top 5
                print(f"\n[{i+1}] {result['timestamp'][:10]}")
                print(f"    {result['discovery'][:100]}...")
                if result.get('files'):
                    print(f"    Files: {', '.join(result['files'][:3])}")
        else:
            print(f"No results found for '{topic}'")
            
        return results
        
    def archive(self, pattern=None):
        """Archive old or unused files"""
        self.archive_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Default patterns for archival
        archive_patterns = [
            '*_old*', '*_backup*', '*.bak', '*.tmp',
            '*DEPRECATED*', '*OBSOLETE*', '*_OLD_*'
        ]
        
        if pattern:
            archive_patterns = [pattern]
            
        archived_count = 0
        
        for pattern in archive_patterns:
            for file_path in self.root_dir.rglob(pattern):
                if '.archive' in str(file_path) or '.git' in str(file_path):
                    continue
                    
                # Create archive path
                relative_path = file_path.relative_to(self.root_dir)
                archive_path = self.archive_dir / timestamp / relative_path
                archive_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Move file to archive
                shutil.move(str(file_path), str(archive_path))
                archived_count += 1
                
                # Log archival
                self._log_archival(str(relative_path), timestamp)
                
        print(f"✓ Archived {archived_count} files to .archive/{timestamp}/")
        
        # Clean empty directories
        self._clean_empty_dirs()
        
    def status(self):
        """Show knowledge base statistics"""
        stats = {
            'total_discoveries': len(self.knowledge.get('discoveries', [])),
            'categories': len(list(self.knowledge_db.glob('*.json'))),
            'archived_sessions': len(list(self.archive_dir.glob('*'))) if self.archive_dir.exists() else 0,
            'last_update': None
        }
        
        # Find last update
        if 'discoveries' in self.knowledge and self.knowledge['discoveries']:
            stats['last_update'] = self.knowledge['discoveries'][-1]['timestamp'][:10]
            
        # Count by category
        category_counts = {}
        for category_file in self.knowledge_db.glob('*.json'):
            category = category_file.stem
            with open(category_file, 'r') as f:
                data = json.load(f)
                category_counts[category] = len(data)
                
        print("\n=== Knowledge Base Status ===")
        print(f"Total Discoveries: {stats['total_discoveries']}")
        print(f"Categories: {stats['categories']}")
        print(f"Archived Sessions: {stats['archived_sessions']}")
        print(f"Last Update: {stats['last_update'] or 'Never'}")
        
        if category_counts:
            print("\n=== Categories ===")
            for category, count in sorted(category_counts.items()):
                print(f"  {category}: {count} entries")
                
    def _detect_context(self):
        """Auto-detect current context"""
        context = {
            'project': self.root_dir.name,
            'type': 'unknown'
        }
        
        # Detect project type
        if (self.root_dir / 'manifest.json').exists():
            context['type'] = 'uxp_plugin'
        elif (self.root_dir / 'CSXS' / 'manifest.xml').exists():
            context['type'] = 'cep_plugin'
        elif (self.root_dir / 'package.json').exists():
            context['type'] = 'node_project'
            
        return context
        
    def _get_relevant_files(self):
        """Get list of recently modified relevant files"""
        relevant_extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.html', '.css']
        files = []
        
        for ext in relevant_extensions:
            for file_path in self.root_dir.rglob(f'*{ext}'):
                if any(skip in str(file_path) for skip in ['.git', 'node_modules', '.archive']):
                    continue
                    
                # Check if recently modified (last 24 hours)
                if file_path.stat().st_mtime > (datetime.now().timestamp() - 86400):
                    files.append(str(file_path.relative_to(self.root_dir)))
                    
        return files[:10]  # Return top 10 most recent
        
    def _categorize_discovery(self, discovery):
        """Categorize discovery based on content"""
        discovery_lower = discovery.lower()
        
        categories = {
            'error': ['error', 'exception', 'fail', 'bug'],
            'solution': ['fix', 'solve', 'work', 'solution'],
            'setup': ['install', 'setup', 'config', 'init'],
            'api': ['api', 'endpoint', 'request', 'response'],
            'ui': ['ui', 'interface', 'panel', 'button', 'dialog'],
            'debug': ['debug', 'log', 'console', 'trace'],
            'performance': ['performance', 'speed', 'optimize', 'fast'],
            'workflow': ['workflow', 'process', 'step', 'procedure']
        }
        
        for category, keywords in categories.items():
            if any(keyword in discovery_lower for keyword in keywords):
                return category
                
        return 'general'
        
    def _is_duplicate(self, entry):
        """Check if entry is duplicate"""
        entry_hash = entry['hash']
        
        if 'discoveries' in self.knowledge:
            for existing in self.knowledge['discoveries']:
                if existing.get('hash') == entry_hash:
                    return True
                    
        return False
        
    def _log_archival(self, file_path, timestamp):
        """Log file archival"""
        if 'archives' not in self.knowledge:
            self.knowledge['archives'] = []
            
        self.knowledge['archives'].append({
            'file': file_path,
            'timestamp': timestamp,
            'archived_at': datetime.now().isoformat()
        })
        
        self.save_knowledge()
        
    def _clean_empty_dirs(self):
        """Remove empty directories"""
        for dirpath, dirnames, filenames in os.walk(self.root_dir, topdown=False):
            if not dirnames and not filenames and '.git' not in dirpath:
                try:
                    os.rmdir(dirpath)
                except:
                    pass

def main():
    parser = argparse.ArgumentParser(description='Knowledge Manager')
    parser.add_argument('command', choices=['save', 'find', 'archive', 'status'],
                       help='Command to execute')
    parser.add_argument('args', nargs='*', help='Command arguments')
    
    args = parser.parse_args()
    km = KnowledgeManager()
    
    if args.command == 'save':
        if args.args:
            discovery = ' '.join(args.args)
            km.save(discovery)
        else:
            print("Usage: knowledge_manager.py save \"your discovery\"")
            
    elif args.command == 'find':
        if args.args:
            topic = ' '.join(args.args)
            km.find(topic)
        else:
            print("Usage: knowledge_manager.py find \"topic\"")
            
    elif args.command == 'archive':
        pattern = args.args[0] if args.args else None
        km.archive(pattern)
        
    elif args.command == 'status':
        km.status()

if __name__ == '__main__':
    main()