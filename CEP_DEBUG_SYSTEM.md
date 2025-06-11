# CEP Debug System - Claude Limitations Aware

## 🎯 Core Design Principle
**Python scripts do ALL the work. Claude just calls them.**

---

## 🏗️ System Architecture

### 1. Single Entry Point (Prevents Tool Forgetting)
```bash
# ONLY command Claude needs to remember:
python3 cep_debug.py [action]

# Everything else is handled by the script
```

### 2. State File System (Bypasses Context Window)
```
.cep_state/
├── current_error.txt    # Single line: "E001"
├── last_action.txt      # Single line: "fix_applied"
├── console_snapshot.txt # Last 50 lines only
└── fix_history.json     # What worked before
```

### 3. Knowledge Bridge (Cross-Plugin Learning)
```
MultiPluginSystem/shared-knowledge/cep-errors/
├── E001-evalTS-timeout.md
├── E002-undefined-evalScript.md
└── MASTER_FIXES.json  # All plugins contribute here
```

---

## 📝 Integration with Existing CLAUDE.md

### Add to CLAUDE.md (Minimal - 5 lines only):
```markdown
## 🔧 CEP Debugging (After server is up)
```bash
python3 cep_debug.py diagnose  # Run this FIRST
python3 cep_debug.py fix       # Auto-fix based on diagnosis
python3 cep_debug.py test      # Test if fix worked
```
Error codes: See CEP_DEBUG_SYSTEM.md
```

### DO NOT add to CLAUDE.md:
- Error code lists (keep in separate file)
- Detailed instructions (Python script handles it)
- Console reading steps (automated)

---

## 🤖 Preventing Claude's Bad Habits

### 1. Tool Forgetting Prevention
```python
# cep_debug.py starts with:
"""
THIS SCRIPT HANDLES EVERYTHING. Do not create new tools.
Available actions: diagnose, fix, test, state, console
"""
```

### 2. Context Preservation
```python
# Script always outputs:
print(f"PROJECT: {PRD.plugin_name}")
print(f"PURPOSE: {PRD.main_goal}")
print(f"STATE: {current_error}")
```

### 3. Token Optimization
```python
# Instead of returning logs:
def get_console_state():
    # Reads 1000 lines, returns 1 code
    return "E001"  # Not 5000 tokens of logs
```

---

## 🔄 Workflow That Respects Limitations

### Claude's Perspective:
```bash
# 1. Something's wrong with sequence detection
python3 cep_debug.py diagnose
# Output: "E004:sequence_not_detected"

# 2. Apply fix
python3 cep_debug.py fix E004
# Output: "✅ Applied: rebuild_extendscript"

# 3. Verify
python3 cep_debug.py test
# Output: "✅ Sequence detection working"
```

### What Actually Happens (Hidden from Claude):
1. Script reads console via DevTools
2. Pattern matches against known errors
3. Applies fix from knowledge base
4. Reloads plugin
5. Verifies fix
6. Updates shared knowledge

---

## 📊 Maintaining Project Context

### PRD Integration
```python
# cep_debug.py reads from PRD.md:
PROJECT_CONTEXT = {
    "name": "AI Text Editor",
    "goal": "Edit video via transcript",
    "key_features": ["SRT import", "XML export"],
    "brand": "Effortless, minimal friction"
}

# Every output includes context:
print(f"[{PROJECT_CONTEXT['name']}] Error fixed")
```

### Cross-Plugin Consistency
```python
# All plugins use same error codes:
UNIVERSAL_ERRORS = {
    "E001-E099": "CEP/ExtendScript issues",
    "E100-E199": "Plugin-specific issues",
    "E200-E299": "Server/connection issues"
}
```

---

## 💾 Knowledge Management (Minimal Tokens)

### Writing Knowledge
```bash
# After successful fix:
python3 cep_debug.py learn
# Automatically saves to MultiPluginSystem/
```

### Reading Knowledge
```bash
# Built into fix command:
python3 cep_debug.py fix E001
# Script checks MultiPluginSystem/ first
```

### Knowledge Format
```json
{
  "E001": {
    "error": "evalTS timeout",
    "fixes": ["rebuild", "clear_cache"],
    "success_rate": 0.85,
    "last_used": "2024-01-07"
  }
}
```

---

## 🚨 Rules for Implementation

### DO:
1. ✅ Keep all logic in Python scripts
2. ✅ Return single-line outputs
3. ✅ Use state files instead of context
4. ✅ Read from PRD.md for context
5. ✅ Share fixes via MultiPluginSystem

### DON'T:
1. ❌ Add verbose docs to CLAUDE.md
2. ❌ Return console logs directly
3. ❌ Create new tools for each error
4. ❌ Forget project purpose
5. ❌ Break existing workflows

---

## 🎯 Success Metrics

- **CLAUDE.md addition**: < 10 lines
- **Tokens per debug**: < 200
- **Commands to remember**: 3 max
- **Cross-plugin sharing**: Automatic
- **Context preservation**: Built into every output

---

## 🔧 Implementation Path

1. **Extend existing smart_helper.py**
   - Add `debug` subcommand
   - Reuse server checking logic

2. **Create cep_debug.py**
   - Import from smart_helper
   - Add DevTools integration
   - Read PRD.md on init

3. **Connect to MultiPluginSystem**
   - Read: shared-knowledge/cep-errors/
   - Write: Successful fixes

4. **Minimal CLAUDE.md update**
   - 5 lines max
   - Reference this doc for details

This design respects ALL your limitations while providing powerful debugging.