# CONSOLIDATED TOOLS REFERENCE
Generated on: 2025-06-05 12:06:30

## 🚨 CRITICAL: Primary Tools Only

### USE THESE TOOLS EXCLUSIVELY:

#### File Management
- **claude-file-manager.js**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/claude-file-manager.js`
  - Purpose: Manage files in Claude sessions
  - Use for: All file operations in Claude
  
- **file-organizer.js**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/file-organizer.js`
  - Purpose: Organize project files and directories
  - Use for: Restructuring project layout
  
- **file-archiver.js**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/file-archiver.js`
  - Purpose: Archive old or unused files
  - Use for: Cleaning up deprecated code
  
- **file-cleanup.js**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/file-cleanup.js`
  - Purpose: Clean up temporary files
  - Use for: Removing build artifacts and temp files

#### Knowledge Management
- **knowledge_manager.py**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/knowledge_manager.py`
  - Purpose: Manage project knowledge base
  - Use for: Updating and searching project documentation
  
- **smart_helper_v2.py**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/smart_helper_v2.py`
  - Purpose: Intelligent development assistance
  - Use for: ALL debugging, testing, and development tasks
  - REPLACES: All debug scripts, test scripts, and helper tools

#### Plugin Development
- **autonomous_plugin_tester.py**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/autonomous_plugin_tester.py`
  - Purpose: Automated plugin testing
  - Use for: Running plugin test suites

#### Deployment
- **deploy-to-all-claude-sessions.js**: `/Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/deploy-to-all-claude-sessions.js`
  - Purpose: Deploy updates to all Claude sessions
  - Use for: Synchronizing changes across projects

### ❌ DEPRECATED TOOLS (DO NOT USE):

The following tools have been archived and should NEVER be used:

#### File Management Duplicates
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/claude-file-manager.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/doc-organizer.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/file-archiver.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/file-cleanup.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/file-organizer.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/claude-file-manager.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/doc-organizer.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/file-archiver.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/file-cleanup.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/file-organizer.js~~ - ARCHIVED, DO NOT USE

#### Debug/Test Tools (Use smart_helper_v2.py instead)
- ~~Test-cwyyx8-BOLT/auto_debug_console.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/comprehensive-srt-debug.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/debug-sequence-srt-bolt.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/debug-srt-detection.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/debug-srt-flow-complete.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/debug_comprehensive.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/debug_console_auto.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/quick-srt-debug.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/test-srt-fix.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/test-srt-validation.js~~ - ARCHIVED, DO NOT USE

#### Other Deprecated Tools
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/claude-init.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/doc-organizer.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/knowledge-engine.js~~ - ARCHIVED, DO NOT USE
- ~~DEPRECATED_UXP_VERSION_Dont_USE_UNLESS_ASKED__Test-cwyyx8/unified-claude-system.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/check_plugin_status.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/claude-init.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/doc-organizer.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/keep-server-alive.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/knowledge-engine.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/plugin_dev_helper.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/reliable-server-manager.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/reliable-server-start.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/smart_helper_v2.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/srt-websocket-server.js~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/trigger_reload.py~~ - ARCHIVED, DO NOT USE
- ~~Test-cwyyx8-BOLT/unified-claude-system.js~~ - ARCHIVED, DO NOT USE

## Tool Migration Guide

### Instead of debug scripts, use:
```bash
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/smart_helper_v2.py --debug "your issue"
```

### Instead of test scripts, use:
```bash
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/smart_helper_v2.py --test "component"
```

### Instead of subdirectory tools, use root tools:
```bash
# Bad: Test-cwyyx8-BOLT/file-organizer.js
# Good: /Users/richardtran/Documents/Code/Personal Projects/Premiere Ai Text Editor/file-organizer.js
```

## Verification

To verify you're using the correct tool:
```bash
python3 verify_tool_usage.py <tool_path>
```

## Enforcement

1. ALWAYS check this document before using any tool
2. Use ONLY the primary tools listed above
3. Use the EXACT paths specified
4. This overrides ALL other tool references in the codebase
