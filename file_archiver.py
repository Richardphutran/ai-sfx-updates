#!/usr/bin/env python3
"""
File Archiver - Safe Archive System for Multi-Plugin Projects
Archives (never deletes) scattered tools and docs with full traceability
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
import hashlib

class SafeFileArchiver:
    def __init__(self):
        self.base_path = Path("/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins")
        self.archive_root = self.base_path / "MultiPluginSystem" / "archived-files"
        self.manifest_file = self.archive_root / "archive_manifest.json"
        
        # Create archive structure
        self.archive_structure = {
            "tools": self.archive_root / "tools",
            "docs": self.archive_root / "docs", 
            "config": self.archive_root / "config",
            "temp": self.archive_root / "temp",
            "duplicate": self.archive_root / "duplicates"
        }
        
        # Ensure all directories exist
        for path in self.archive_structure.values():
            path.mkdir(parents=True, exist_ok=True)
            
        # Load existing manifest or create new
        self.manifest = self._load_manifest()

    def _load_manifest(self):
        """Load or create archive manifest"""
        if self.manifest_file.exists():
            with open(self.manifest_file, 'r') as f:
                return json.load(f)
        else:
            return {
                "created": datetime.now().isoformat(),
                "archived_files": {},
                "stats": {"total_archived": 0, "total_size": 0}
            }

    def _save_manifest(self):
        """Save manifest to disk"""
        with open(self.manifest_file, 'w') as f:
            json.dump(self.manifest, f, indent=2)

    def _get_file_hash(self, file_path):
        """Get MD5 hash of file for duplicate detection"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _detect_file_type(self, file_path):
        """Classify file for appropriate archive location"""
        file_path = Path(file_path)
        
        if file_path.suffix == '.py':
            # Python tool classification
            if any(pattern in file_path.name for pattern in ['debug', 'test', 'fix', 'check']):
                return 'debug_tools'
            elif any(pattern in file_path.name for pattern in ['helper', 'smart', 'autonomous']):
                return 'active_tools'
            elif 'deprecated' in file_path.name or 'archived' in file_path.name:
                return 'deprecated_tools'
            else:
                return 'utility_tools'
                
        elif file_path.suffix == '.md':
            # Documentation classification  
            if file_path.name in ['CLAUDE.md', 'PRD.md', 'README.md']:
                return 'core_docs'
            elif any(pattern in file_path.name.upper() for pattern in ['DEBUG', 'FIX', 'TROUBLESHOOT']):
                return 'debug_docs'
            elif any(pattern in file_path.name.upper() for pattern in ['BACKUP', 'OLD', 'ARCHIVE']):
                return 'archive_docs'
            else:
                return 'feature_docs'
                
        elif file_path.suffix in ['.js', '.ts', '.jsx', '.tsx']:
            return 'frontend_code'
        elif file_path.suffix in ['.json', '.config', '.yml', '.yaml']:
            return 'config_files'
        else:
            return 'misc_files'

    def archive_file(self, file_path, reason="manual_archive", preserve_structure=True):
        """Safely archive a file with full traceability"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {"error": f"File not found: {file_path}"}
            
        # Get file info
        file_hash = self._get_file_hash(file_path)
        file_type = self._detect_file_type(file_path)
        file_size = file_path.stat().st_size
        
        # Check for duplicates
        existing_entry = self._find_duplicate(file_hash)
        if existing_entry:
            return {
                "status": "duplicate_found",
                "existing": existing_entry,
                "action": "skipped"
            }
        
        # Determine archive location
        if preserve_structure:
            # Maintain project structure in archive
            relative_path = file_path.relative_to(self.base_path)
            archive_path = self.archive_structure["tools"] / relative_path if file_path.suffix == '.py' else self.archive_structure["docs"] / relative_path
        else:
            # Organize by type
            archive_subdir = self.archive_structure["tools"] if file_path.suffix == '.py' else self.archive_structure["docs"]
            archive_path = archive_subdir / file_type / file_path.name
            
        # Ensure unique filename if conflict
        archive_path = self._ensure_unique_path(archive_path)
        
        # Create directory structure
        archive_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file (never move/delete original until verified)
        try:
            shutil.copy2(file_path, archive_path)
            
            # Verify copy
            archive_hash = self._get_file_hash(archive_path)
            if archive_hash != file_hash:
                archive_path.unlink()  # Remove bad copy
                return {"error": "Archive verification failed"}
                
            # Record in manifest
            archive_entry = {
                "original_path": str(file_path),
                "archive_path": str(archive_path),
                "project": self._extract_project_name(file_path),
                "file_type": file_type,
                "file_hash": file_hash,
                "file_size": file_size,
                "archived_date": datetime.now().isoformat(),
                "reason": reason,
                "verified": True
            }
            
            self.manifest["archived_files"][str(file_path)] = archive_entry
            self.manifest["stats"]["total_archived"] += 1
            self.manifest["stats"]["total_size"] += file_size
            self._save_manifest()
            
            return {
                "status": "archived_successfully",
                "archive_path": archive_path,
                "entry": archive_entry
            }
            
        except Exception as e:
            return {"error": f"Archive failed: {str(e)}"}

    def _find_duplicate(self, file_hash):
        """Find existing file with same hash"""
        for path, entry in self.manifest["archived_files"].items():
            if entry["file_hash"] == file_hash:
                return entry
        return None

    def _ensure_unique_path(self, path):
        """Ensure unique archive path by adding suffix if needed"""
        if not path.exists():
            return path
            
        counter = 1
        stem = path.stem
        suffix = path.suffix
        parent = path.parent
        
        while True:
            new_path = parent / f"{stem}_{counter}{suffix}"
            if not new_path.exists():
                return new_path
            counter += 1

    def _extract_project_name(self, file_path):
        """Extract project name from file path"""
        try:
            relative = file_path.relative_to(self.base_path)
            return relative.parts[0]
        except:
            return "unknown_project"

    def bulk_archive_by_pattern(self, pattern, reason="bulk_cleanup", projects=None):
        """Archive multiple files matching pattern across projects"""
        results = {"archived": [], "errors": [], "duplicates": []}
        
        if projects is None:
            projects = [d for d in self.base_path.iterdir() if d.is_dir() and d.name != "MultiPluginSystem"]
        else:
            projects = [self.base_path / p for p in projects]
            
        for project_dir in projects:
            if not project_dir.exists():
                continue
                
            matching_files = project_dir.glob(pattern)
            for file_path in matching_files:
                if file_path.is_file():
                    result = self.archive_file(file_path, reason)
                    
                    if result.get("status") == "archived_successfully":
                        results["archived"].append(str(file_path))
                    elif result.get("status") == "duplicate_found":
                        results["duplicates"].append(str(file_path))
                    else:
                        results["errors"].append(f"{file_path}: {result.get('error', 'unknown error')}")
                        
        return results

    def archive_deprecated_tools(self):
        """Archive commonly deprecated tool patterns"""
        patterns = [
            "*deprecated*.py",
            "*_archived.py", 
            "*_backup.py",
            "*_old.py",
            "smart_helper_v2.py.archived"
        ]
        
        all_results = {"archived": [], "errors": [], "duplicates": []}
        
        for pattern in patterns:
            results = self.bulk_archive_by_pattern(pattern, "deprecated_cleanup")
            all_results["archived"].extend(results["archived"])
            all_results["errors"].extend(results["errors"])
            all_results["duplicates"].extend(results["duplicates"])
            
        return all_results

    def archive_duplicate_md_files(self):
        """Archive duplicate MD files (backups, etc.)"""
        patterns = [
            "*.md.backup*",
            "*_backup*.md",
            "*_old*.md",
            "CLAUDE.md.backup*"
        ]
        
        all_results = {"archived": [], "errors": [], "duplicates": []}
        
        for pattern in patterns:
            results = self.bulk_archive_by_pattern(pattern, "duplicate_cleanup")
            all_results["archived"].extend(results["archived"])
            all_results["errors"].extend(results["errors"])
            all_results["duplicates"].extend(results["duplicates"])
            
        return all_results

    def restore_file(self, original_path):
        """Restore archived file to original location"""
        original_path = str(original_path)
        
        if original_path not in self.manifest["archived_files"]:
            return {"error": "File not found in archive"}
            
        entry = self.manifest["archived_files"][original_path]
        archive_path = Path(entry["archive_path"])
        restore_path = Path(original_path)
        
        if not archive_path.exists():
            return {"error": "Archive file missing"}
            
        if restore_path.exists():
            return {"error": "Target already exists"}
            
        try:
            # Ensure target directory exists
            restore_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy back from archive
            shutil.copy2(archive_path, restore_path)
            
            # Verify restoration
            restore_hash = self._get_file_hash(restore_path)
            if restore_hash != entry["file_hash"]:
                restore_path.unlink()
                return {"error": "Restore verification failed"}
                
            return {"status": "restored_successfully", "path": restore_path}
            
        except Exception as e:
            return {"error": f"Restore failed: {str(e)}"}

    def generate_archive_report(self):
        """Generate comprehensive archive report"""
        report = {
            "generated": datetime.now().isoformat(),
            "archive_stats": self.manifest["stats"].copy(),
            "by_project": {},
            "by_type": {},
            "recent_archives": []
        }
        
        # Group by project and type
        for path, entry in self.manifest["archived_files"].items():
            project = entry["project"]
            file_type = entry["file_type"]
            
            if project not in report["by_project"]:
                report["by_project"][project] = {"count": 0, "size": 0, "types": {}}
            if file_type not in report["by_type"]:
                report["by_type"][file_type] = {"count": 0, "size": 0}
                
            report["by_project"][project]["count"] += 1
            report["by_project"][project]["size"] += entry["file_size"]
            
            if file_type not in report["by_project"][project]["types"]:
                report["by_project"][project]["types"][file_type] = 0
            report["by_project"][project]["types"][file_type] += 1
            
            report["by_type"][file_type]["count"] += 1
            report["by_type"][file_type]["size"] += entry["file_size"]
            
            # Recent archives (last 10)
            if len(report["recent_archives"]) < 10:
                report["recent_archives"].append({
                    "path": path,
                    "project": project,
                    "type": file_type,
                    "date": entry["archived_date"],
                    "reason": entry["reason"]
                })
                
        # Sort recent by date
        report["recent_archives"].sort(key=lambda x: x["date"], reverse=True)
        report["recent_archives"] = report["recent_archives"][:10]
        
        return report

def main():
    archiver = SafeFileArchiver()
    
    if len(sys.argv) < 2:
        print("Usage: python3 file_archiver.py [action] [options]")
        print("Actions:")
        print("  archive <file>     - Archive specific file")
        print("  pattern <pattern>  - Archive files matching pattern")
        print("  deprecated         - Archive deprecated tools")
        print("  duplicates         - Archive duplicate MD files")  
        print("  restore <file>     - Restore archived file")
        print("  report             - Generate archive report")
        print("  list               - List all archived files")
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "archive" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        result = archiver.archive_file(file_path)
        print(json.dumps(result, indent=2))
        
    elif action == "pattern" and len(sys.argv) > 2:
        pattern = sys.argv[2]
        results = archiver.bulk_archive_by_pattern(pattern)
        print(f"Archived: {len(results['archived'])} files")
        print(f"Duplicates: {len(results['duplicates'])} files")
        print(f"Errors: {len(results['errors'])} files")
        if results['errors']:
            print("Errors:", results['errors'])
            
    elif action == "deprecated":
        results = archiver.archive_deprecated_tools()
        print(f"✅ Deprecated cleanup complete:")
        print(f"  Archived: {len(results['archived'])} files")
        print(f"  Duplicates skipped: {len(results['duplicates'])} files")
        
    elif action == "duplicates":
        results = archiver.archive_duplicate_md_files()
        print(f"✅ Duplicate cleanup complete:")
        print(f"  Archived: {len(results['archived'])} files")
        print(f"  Duplicates skipped: {len(results['duplicates'])} files")
        
    elif action == "restore" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        result = archiver.restore_file(file_path)
        print(json.dumps(result, indent=2))
        
    elif action == "report":
        report = archiver.generate_archive_report()
        print(json.dumps(report, indent=2))
        
    elif action == "list":
        for path, entry in archiver.manifest["archived_files"].items():
            print(f"{entry['project']:20} {entry['file_type']:15} {Path(path).name}")
            
    else:
        print(f"Unknown action: {action}")

if __name__ == "__main__":
    main()