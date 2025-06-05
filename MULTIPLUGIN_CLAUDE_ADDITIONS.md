# CLAUDE.md Additions for 100% Multi-Plugin System Usage

## 🚀 COMPLETE MULTI-PLUGIN SYSTEM INTEGRATION

Add these sections to ALL CLAUDE.md files across all Claude sessions:

---

## 🧠 MULTI-PLUGIN KNOWLEDGE SYSTEM

### 📚 Knowledge Search (ALWAYS USE FIRST)
```bash
# Search for existing solutions (saves 97% tokens)
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py get "plugin-key" "problem"

# Examples:
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline"
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "spacebar search"
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py get "ai-video-namer" "extendscript"
```

### 💾 Knowledge Capture (AFTER SOLVING PROBLEMS)
```bash
# Save new discoveries immediately
echo "Solution: [detailed solution]" > /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/debugging/[descriptive-name].md

# Capture breakthrough with metrics
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/learning_transfer.py capture "topic" "discovery" "code snippet" tokens_saved
```

### 🔄 Knowledge Sync (SHARE BETWEEN SESSIONS)
```bash
# Sync discoveries across all plugins
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/sync_knowledge.py

# Update all CLAUDE.md files
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py all
```

---

## 📊 TOKEN EFFICIENCY METRICS

Track and report token savings:
```bash
# Before: Manual debugging (500+ tokens)
# After: Knowledge search (5 tokens) = 99% reduction

# Always report savings when using knowledge base:
# "Used existing solution from knowledge base - saved ~495 tokens"
```

---

## 🔧 ESTABLISHED AUTOMATION SCRIPTS

### Priority 1: Diagnostic Scripts
```bash
# Streamlined console debugging (replaces manual console work)
python3 streamlined_console_debug.py

# Automated console capture
python3 automated_console_capture.py

# Port checking
python3 /Users/richardtran/Desktop/check_debug_ports.py
```

### Priority 2: Development Automation
```bash
# Autonomous development (handles reload, debugging)
python3 autonomous_dev_starter.py

# Hot reload without Premiere restart
python3 pure_python_plugin_restart.py

# CEP plugin reload
python3 reload_cep_plugin.py
```

---

## 🎯 MANDATORY WORKFLOW ORDER

1. **BEFORE ANY WORK**:
   ```bash
   # Step 1: Search knowledge base
   python3 /path/to/MultiPluginSystem/knowledge_engine.py get "plugin-key" "issue"
   
   # Step 2: Check if automation exists
   ls *debug*.py *reload*.py *automated*.py
   
   # Step 3: Use autonomous system if available
   python3 autonomous_dev_starter.py
   ```

2. **DURING WORK**:
   - Use hot reload (`npm run dev`) - NEVER restart Premiere
   - Add minimal console.log with emojis for quick scanning
   - Batch all edits in single operations

3. **AFTER SOLVING**:
   ```bash
   # Save solution immediately
   echo "Solution: ..." > /path/to/shared-knowledge/category/solution.md
   
   # Sync to other sessions
   python3 /path/to/sync_knowledge.py
   ```

---

## 📍 PLUGIN REGISTRY

Register your plugin for multi-plugin benefits:
```json
{
  "plugin-key": "ai-sfx",
  "name": "AI SFX Generator",
  "port": 9230,
  "type": "CEP",
  "claude_md": "/full/path/to/CLAUDE.md",
  "knowledge_categories": ["audio", "timeline", "eleven-labs"]
}
```

---

## 🚨 ENFORCEMENT CHECKLIST

Before starting ANY task, verify:
- [ ] Ran knowledge_engine.py search first
- [ ] Checked for existing automation scripts
- [ ] Using hot reload, not Premiere restart
- [ ] Will save discoveries to shared-knowledge/
- [ ] Will sync findings to other sessions

**PENALTY**: Manual debugging without checking knowledge base = wasted 95%+ tokens

---

## 🔗 CROSS-SESSION COMMANDS

Commands that work from ANY plugin directory:
```bash
# Global knowledge search
alias ksearch='python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py get'

# Quick sync all
alias ksync='python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/sync_knowledge.py'

# Update all CLAUDE.md
alias kupdate='python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py all'
```

---

## 📈 SUCCESS METRICS

Track multi-plugin system effectiveness:
- Solutions found in knowledge base: ____%
- Tokens saved per session: ____%  
- Cross-plugin discoveries shared: ____
- Automation scripts used: ____

Report these metrics at session end!

---

## 🎓 KNOWLEDGE CATEGORIES

Browse before coding:
```bash
ls /path/to/MultiPluginSystem/shared-knowledge/adobe-apis/     # ExtendScript, CEP, QE
ls /path/to/MultiPluginSystem/shared-knowledge/debugging/      # Common errors & fixes
ls /path/to/MultiPluginSystem/shared-knowledge/automation/     # Time-saving scripts
ls /path/to/MultiPluginSystem/shared-knowledge/ui-patterns/    # UI components
ls /path/to/MultiPluginSystem/shared-knowledge/performance/    # Optimizations
```

---

## ⚡ QUICK REFERENCE

```bash
# The 3 commands you'll use most:
ksearch "ai-sfx" "your problem"              # Find solution
python3 autonomous_dev_starter.py            # Start dev
echo "fix" > shared-knowledge/new-fix.md    # Save discovery
```

Remember: **Every manual debug = lost opportunity to use existing knowledge**