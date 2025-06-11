# Knowledge Management Guide

## Overview
The Knowledge Manager is a token-efficient system for capturing, organizing, and retrieving plugin development insights without creating redundant documentation.

## Quick Commands (1-3 tokens)

### Save Knowledge
```bash
python3 knowledge_manager.py save "ExtendScript requires $._PPP_ prefix for Premiere API calls"
```

### Find Information
```bash
python3 knowledge_manager.py find "ExtendScript"
python3 knowledge_manager.py find "error"
```

### Archive Old Files
```bash
python3 knowledge_manager.py archive              # Archive all old/backup files
python3 knowledge_manager.py archive "*_OLD*"     # Archive specific pattern
```

### Check Status
```bash
python3 knowledge_manager.py status
```

## How It Works

### 1. Automatic Context Detection
- Detects project type (UXP, CEP, Node)
- Tracks recently modified files
- Links discoveries to relevant code

### 2. Smart Deduplication
- Uses content hashing to prevent duplicates
- Automatically skips redundant entries
- Maintains clean knowledge base

### 3. Categorization
Categories are auto-detected:
- **error**: Bugs, exceptions, failures
- **solution**: Fixes, workarounds
- **setup**: Installation, configuration
- **api**: API usage, endpoints
- **ui**: Interface, panels, dialogs
- **debug**: Debugging, logging
- **performance**: Optimization tips
- **workflow**: Processes, procedures
- **general**: Everything else

### 4. Archival System
- Files moved to `.archive/YYYYMMDD_HHMMSS/`
- Original directory structure preserved
- Never deletes, only archives
- Automatic empty directory cleanup

## Integration with Existing Workflow

### With smart_helper_v2.py
The knowledge manager integrates seamlessly:
```bash
# Save discovery from smart helper
python3 smart_helper_v2.py learn "discovery"

# Find related info
python3 smart_helper_v2.py search "topic"
```

### With .plugin_knowledge_v2.json
- Main knowledge stored in `.plugin_knowledge_v2.json`
- Categorized data in `.knowledge_db/`
- Archive logs tracked automatically

## Best Practices

### 1. Save Immediately
When you discover something important:
```bash
python3 knowledge_manager.py save "CSInterface must be loaded before any API calls"
```

### 2. Use Descriptive Discoveries
Good:
```bash
python3 knowledge_manager.py save "Fix CEP panel not showing: add <Host Name='PPRO' Version='[0.0,99.9]'/> to manifest.xml"
```

Bad:
```bash
python3 knowledge_manager.py save "panel fix"
```

### 3. Regular Archival
Archive old files weekly:
```bash
python3 knowledge_manager.py archive
```

### 4. Search Before Solving
Always check existing knowledge:
```bash
python3 knowledge_manager.py find "panel not showing"
```

## File Structure

```
project/
├── .plugin_knowledge_v2.json    # Main knowledge base
├── .knowledge_db/               # Categorized knowledge
│   ├── error.json
│   ├── solution.json
│   └── ...
└── .archive/                    # Archived files
    └── 20250605_120000/        # Timestamp folders
        └── old_file.js
```

## Token Efficiency Tips

1. **Shortest Commands**:
   - Save: `km s "fact"`
   - Find: `km f "topic"`
   - Archive: `km a`
   - Status: `km st`

2. **Create Alias**:
   ```bash
   alias km="python3 knowledge_manager.py"
   ```

3. **Use Categories**:
   Instead of long descriptions, let auto-categorization work

## Deployment

The system auto-deploys to all plugin projects when you run:
```bash
python3 deploy-to-all-claude-sessions.js
```

## Archival Policy

- **Never Delete**: Files are archived, not deleted
- **Timestamp Folders**: Each archive session gets unique folder
- **Pattern Matching**: Archive by pattern or use defaults
- **Automatic Cleanup**: Empty directories removed after archival

## Common Patterns

### Debug Workflow
```bash
# Hit an error
python3 knowledge_manager.py save "TypeError in panel.js:45 - CSInterface undefined, must load library first"

# Later, search for similar
python3 knowledge_manager.py find "CSInterface undefined"
```

### Clean Project
```bash
# Archive old files
python3 knowledge_manager.py archive

# Check what was archived
python3 knowledge_manager.py status
```

### Knowledge Sharing
```bash
# Export knowledge for other projects
cp .plugin_knowledge_v2.json ../other-project/
cp -r .knowledge_db ../other-project/
```