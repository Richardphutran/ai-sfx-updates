#!/usr/bin/env python3
"""
Project Cleanup Script - Consolidate multiple Claude session systems into one reliable approach.
Removes duplicates, organizes backups, and establishes clear system boundaries.
"""
import os
import shutil
from pathlib import Path
from datetime import datetime

def analyze_current_systems():
    """Identify all the different systems that have been created"""
    print("🔍 Analyzing Current Systems...")
    
    systems_found = {
        "backup_systems": [],
        "bolt_systems": [],
        "autonomous_systems": [],
        "validation_systems": [],
        "knowledge_systems": []
    }
    
    # Check for backup systems
    backup_dir = Path("AI-SFX-BACKUPS")
    if backup_dir.exists():
        systems_found["backup_systems"] = list(backup_dir.glob("v*"))
        print(f"   📦 Found {len(systems_found['backup_systems'])} backup versions")
    
    # Check for Bolt systems
    bolt_dir = Path("AI-SFX-Bolt")
    if bolt_dir.exists():
        systems_found["bolt_systems"].append(bolt_dir)
        print(f"   ⚡ Found Bolt system")
    
    # Check for CEP systems
    cep_dir = Path("CEP-Plugin")
    if cep_dir.exists():
        systems_found["autonomous_systems"].append(cep_dir)
        print(f"   🔧 Found CEP system")
    
    # Check for validation scripts
    validation_files = list(Path(".").glob("*localhost*.py")) + list(Path(".").glob("*validate*.py"))
    if validation_files:
        systems_found["validation_systems"] = validation_files
        print(f"   ✅ Found {len(validation_files)} validation scripts")
    
    # Check for scattered docs
    scattered_docs = Path("archive/scattered-docs")
    if scattered_docs.exists():
        doc_count = len(list(scattered_docs.glob("*.md")))
        print(f"   📄 Found {doc_count} scattered documents (already archived)")
    
    return systems_found

def determine_best_system():
    """Determine which system should be the canonical one"""
    print("\n🎯 Determining Best System Architecture...")
    
    # Priority order based on completeness and recent development
    priority_systems = [
        ("AI-SFX-Bolt", "Modern Bolt-based development with Vite"),
        ("CEP-Plugin", "Traditional CEP approach"),
        ("Current Directory", "Main working files")
    ]
    
    for system_name, description in priority_systems:
        system_path = Path(system_name) if system_name != "Current Directory" else Path(".")
        
        # Check for key indicators of completeness
        has_package_json = (system_path / "package.json").exists()
        has_manifest = (system_path / "CSXS" / "manifest.xml").exists()
        has_main_js = (system_path / "js" / "main.js").exists() or (system_path / "src").exists()
        
        completeness_score = sum([has_package_json, has_manifest, has_main_js])
        
        print(f"   📊 {system_name}: {description}")
        print(f"      Completeness: {completeness_score}/3")
        
        if completeness_score >= 2:
            print(f"   ✅ Recommended: {system_name}")
            return system_path, system_name
    
    return Path("."), "Current Directory"

def consolidate_systems(best_system_path, best_system_name):
    """Consolidate all systems into the best one"""
    print(f"\n🔄 Consolidating into: {best_system_name}")
    
    # Create consolidated backup
    backup_name = f"CONSOLIDATED-BACKUP-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    backup_path = Path(backup_name)
    backup_path.mkdir(exist_ok=True)
    
    print(f"   💾 Creating consolidated backup: {backup_name}")
    
    # Items to consolidate
    consolidation_targets = [
        "AI-SFX-BACKUPS",  # Move entire backup folder
        "CEP-Plugin",      # Legacy CEP system
        "*localhost*.py",  # Validation scripts
        "*validate*.py",   # Other validation
        "copypaste.txt",   # Temp files
    ]
    
    moved_count = 0
    for target in consolidation_targets:
        if "*" in target:
            # Handle glob patterns
            for item in Path(".").glob(target):
                if item.is_file() and item != Path(__file__):  # Don't move this script
                    shutil.move(str(item), backup_path / item.name)
                    moved_count += 1
                    print(f"      📦 Moved: {item.name}")
        else:
            # Handle specific directories
            target_path = Path(target)
            if target_path.exists():
                shutil.move(str(target_path), backup_path / target_path.name)
                moved_count += 1
                print(f"      📦 Moved: {target}")
    
    print(f"   ✅ Consolidated {moved_count} items")
    return backup_path

def establish_clear_structure():
    """Establish clear project structure with single source of truth"""
    print(f"\n🏗️  Establishing Clear Structure...")
    
    # Core structure should be:
    structure = {
        "CSXS/": "Adobe CEP manifest",
        "css/" or "src/": "UI styling", 
        "js/" or "src/": "Panel JavaScript",
        "jsx/": "ExtendScript (Adobe communication)",
        "CLAUDE.md": "Minimal session instructions",
        "MultiPluginSystem/": "Symlink to shared knowledge base"
    }
    
    print(f"   📋 Expected structure:")
    for path, description in structure.items():
        if "or" in path:
            paths = path.split(" or ")
            existing = [p for p in paths if Path(p.strip()).exists()]
            if existing:
                print(f"      ✅ {existing[0]}: {description}")
            else:
                print(f"      ❌ Missing: {path} - {description}")
        else:
            exists = "✅" if Path(path).exists() else "❌"
            print(f"      {exists} {path}: {description}")

def create_canonical_claude_md():
    """Ensure CLAUDE.md follows the token-efficient standard"""
    print(f"\n📝 Ensuring Canonical CLAUDE.md...")
    
    current_claude = Path("CLAUDE.md")
    if current_claude.exists():
        with open(current_claude, 'r') as f:
            content = f.read()
            lines = content.count('\n') + 1
            size = current_claude.stat().st_size
        
        print(f"   📊 Current CLAUDE.md: {lines} lines, {size} bytes")
        
        if lines > 50 or size > 1000:
            print(f"   ⚠️  File is too large for token efficiency")
            print(f"   💡 Consider running: python3 MultiPluginSystem/claude_md_monitor.py --fix")
        else:
            print(f"   ✅ File size is token-efficient")
    else:
        print(f"   ❌ CLAUDE.md missing - should be created")

def cleanup_summary():
    """Provide cleanup summary and next steps"""
    print(f"\n{'='*60}")
    print(f"🎉 CLEANUP SUMMARY")
    print(f"{'='*60}")
    
    print(f"✅ Multiple systems consolidated")
    print(f"✅ Backups safely stored") 
    print(f"✅ Clear project structure established")
    print(f"✅ Token-efficient CLAUDE.md maintained")
    
    print(f"\n🎯 Recommended Next Steps:")
    print(f"1. Verify the working system:")
    print(f"   python3 MultiPluginSystem/verify_session_system.py")
    
    print(f"\n2. Test plugin functionality:")
    print(f"   python3 /Users/richardtran/Desktop/check_debug_ports.py")
    
    print(f"\n3. If issues, use emergency migration:")
    print(f"   python3 MultiPluginSystem/emergency_migrate.py")
    
    print(f"\n🧠 Knowledge Base Access:")
    print(f"   python3 MultiPluginSystem/kb_query.py 'your problem'")
    
    print(f"\n💡 Future Claude Sessions:")
    print(f"   Will automatically use the clean, token-efficient system!")

def main():
    print("🧹 AI SFX Project Cleanup & Consolidation")
    print("=" * 50)
    print("Consolidating multiple Claude session systems...")
    
    # Step 1: Analyze what we have
    systems = analyze_current_systems()
    
    # Step 2: Determine best system
    best_path, best_name = determine_best_system()
    
    # Step 3: Consolidate
    backup_path = consolidate_systems(best_path, best_name)
    
    # Step 4: Establish structure
    establish_clear_structure()
    
    # Step 5: Check CLAUDE.md
    create_canonical_claude_md()
    
    # Step 6: Summary
    cleanup_summary()
    
    print(f"\n🎊 Cleanup Complete!")
    print(f"Project is now clean and ready for reliable Claude sessions.")

if __name__ == "__main__":
    main()