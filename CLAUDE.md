# CLAUDE.md - AI SFX Generator - ENFORCED MULTI-PLUGIN WORKFLOW
When calling tools, dont use them sequentially, use them in parallel to be efficient and effective.

Our goal is to create a beautiful plugin with a small footprint that puts an ai generated sfx onto the timeline in the perfect place for the user. right at the playhead unless using the in and out feature. This plugin also has the functionality of calling and placing preciously made files and all their other sfx files. this feature occurs after pressing the spacebar " " this works for all SFX in their premiere project bin with any name of "SFX" and their children. The same occurs with SFX in their project folder's "SFX" Folder and it's children including our "AI SFX" folder.

Keep in mind you're working with other claude sessions on the same premiere pro project and several localhosts. be mindful not to ruin their progress by killing their servers or restarting premiere or taking their websockets

Our plugin we're working on is • AI-SFX-Bolt

*** NEVER put anyhthing in oure code that operates off frequency. Everything should operate programatically from user input.

## 🚨 MANDATORY FIRST STEPS - NO EXCEPTIONS

**BEFORE doing ANYTHING else, you MUST run these commands:**

### 1. ⚡ REQUIRED: Search Knowledge Base
```bash
# ALWAYS search first - existing solutions save 97% of tokens
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "your problem"

# Common searches:
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline"
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "cep reload"
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "audio placement"
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "eleven labs"
```

### 2. ⚡ REQUIRED: Use Autonomous Development
```bash
# Handles debugging, hot reload, port detection automatically
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX" && python3 AI-SFX-Bolt/autonomous_dev_starter.py
```

### 3. ⚡ REQUIRED: Check Active Ports
```bash
# Shows all active plugins and debug URLs
python3 /Users/richardtran/Desktop/check_debug_ports.py
```
Always reply with the Localhost URL the Plugin is on and validate its on there before replying


## 🛠️ Cross-Plugin Tools
```bash
# Update ALL plugin CLAUDE.md files from any session
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py
```


## ⚠️ CRITICAL: Never Restart Premiere
- **🔄 NEVER RESTART PREMIERE** - Use plugin reload instead:
  - `npm/yarn run dev` for hot reload development
  - Right-click plugin panel → Reload Extension  
  - Only restart Premiere as absolute last resort

---

## 🛑 CRITICAL ENFORCEMENT RULES

### ❌ ABSOLUTE PROHIBITIONS:
- **NEVER debug manually without checking knowledge base first**
- **NEVER create new scripts if automation exists**
- **NEVER restart Premiere manually**
- **NEVER write solutions without checking shared-knowledge/**
- **NEVER ignore the autonomous_dev_starter.py workflow**

### ✅ MANDATORY ACTIONS:
- **ALWAYS start with**: `python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get`
- **ALWAYS use**: `python3 AI-SFX-Bolt/autonomous_dev_starter.py`
- **ALWAYS check**: `ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/`
- **ALWAYS add discoveries**: `echo "solution" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/category/name.md`

---

## 📚 Available Knowledge Categories

**Browse these BEFORE coding anything:**
```bash
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/        # ExtendScript, CEP, QE
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/         # Error solutions
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/        # Workflow scripts
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/       # UI components
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/performance/       # Optimizations
```

**Quick search for any topic:**
```bash
grep -r "your keywords" AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/
```

---

## 🎯 AI SFX Specific Commands

### AI SFX Quick Start:
```bash
# Navigate to project
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX"

# Start autonomous system (handles everything)
python3 AI-SFX-Bolt/autonomous_dev_starter.py

# Access plugin at http://localhost:9230
python3 /Users/richardtran/Desktop/check_debug_ports.py
```

## 📱 PORT REFERENCE PROTOCOL

**🚨 MANDATORY: When referencing ports, ALWAYS include direct URLs**

✅ **CORRECT**: "Check the plugin console at http://localhost:9230"
✅ **CORRECT**: "Open Chrome DevTools: http://localhost:9230/devtools/inspector.html"
✅ **CORRECT**: "Debug the timeline function at http://localhost:9230 and run `window.debugAISFX()`"

❌ **WRONG**: "Check port 9230"
❌ **WRONG**: "Open the debug console"
❌ **WRONG**: "Look at the plugin"

**Purpose**: Immediate clickable access, no manual URL construction needed

### Emergency Commands:
```bash
# CEP plugin not loading (different from UXP!)
python3 AI-SFX-Bolt/pure_python_plugin_restart.py

# Timeline placement issues
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline placement"

# Eleven Labs API issues
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "eleven labs api"
```

---

## 📊 Token Efficiency Enforcement

| Forbidden Approach | Required Approach | Token Savings |
|-------------------|------------------|---------------|
| Manual timeline debugging (275+ tokens) | Knowledge search (5-10 tokens) | 97% |
| Writing new reload scripts (150+ tokens) | Use autonomous_dev_starter.py (5 tokens) | 97% |
| Manual plugin restart (100+ tokens) | pure_python_plugin_restart.py (5 tokens) | 95% |

---

## 🔧 Knowledge Base Integration

**Before debugging ANY timeline issue:**
1. Search: `python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline"`
2. Browse: `ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/`
3. Read: `cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-*.md`

**Before fixing ANY CEP reload issue:**
1. Search: `python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "cep reload"`
2. Check: `cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/plugin-reload-automation.md`

**After solving ANY problem:**
```bash
echo "Your solution: CEP plugins need Extensions menu loading not UXP reload" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/cep-vs-uxp-reload.md
```

---

## 🚨 SESSION ENFORCEMENT

**Start every session with:**
```bash
# Check what's already known about your task
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "session task description"

# If no existing solution, use automation
python3 AI-SFX-Bolt/autonomous_dev_starter.py
```

**End every session with:**
```bash
# Save any new discoveries immediately
echo "Discovery: your finding" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/discovery-name.md

# Update session status
echo "Session complete. Knowledge saved." > SESSION_STATUS.md
```

---

## 📱 AI SFX Project Details

- **Plugin Type**: CEP (not UXP - different reload process!)
- **Port**: 9230 (http://localhost:9230)
- **Key**: "ai-sfx" (for knowledge searches)
- **Automation**: `AI-SFX-Bolt/autonomous_dev_starter.py`
- **Hot Reload**: `AI-SFX-Bolt/pure_python_plugin_restart.py`

---

## 🎵 AI SFX Specific Knowledge

**Timeline Issues**: Check these first
```bash
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-detection-breakthrough.md
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/qe-api-track-creation.md
```

**Audio Placement**: Check these first
```bash
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/audio-clip-placement.md
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/smart-track-placement.md
```

**CEP Issues**: Check these first
```bash
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/cep-debugging-setup.md
cat AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/plugin-reload-automation.md
```

---

**⚡ REMEMBER: This session ignored the multi-plugin system. Don't let that happen again! Use it!**

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


## 📊 TOKEN EFFICIENCY METRICS

Track and report token savings:
```bash
# Before: Manual debugging (500+ tokens)
# After: Knowledge search (5 tokens) = 99% reduction

# Always report savings when using knowledge base:
# "Used existing solution from knowledge base - saved ~495 tokens"
```

**Token Savings Examples:**
- Manual timeline debugging: 275+ tokens → Knowledge search: 5 tokens (98% saved)
- Writing new reload script: 150+ tokens → Use existing: 5 tokens (97% saved)
- Manual ExtendScript debug: 200+ tokens → Diagnostic script: 10 tokens (95% saved)


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

**RULE**: Check for existing scripts before writing new ones!


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

**PENALTY**: Manual debugging without checking knowledge base = wasted 95%+ tokens


## 🚨 ENFORCEMENT CHECKLIST

Before starting ANY task, verify:
- [ ] Ran knowledge_engine.py search first
- [ ] Checked for existing automation scripts
- [ ] Using hot reload, not Premiere restart
- [ ] Will save discoveries to shared-knowledge/
- [ ] Will sync findings to other sessions

**PENALTY**: Manual debugging without checking knowledge base = wasted 95%+ tokens


## ⚡ QUICK REFERENCE

```bash
# The 3 commands you'll use most:
ksearch() { python3 "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/knowledge_engine.py" get "$@"; }
ksearch "ai-sfx" "your problem"              # Find solution
python3 autonomous_dev_starter.py            # Start dev
echo "fix" > shared-knowledge/new-fix.md    # Save discovery
```

Remember: **Every manual debug = lost opportunity to use existing knowledge**


## 🎓 KNOWLEDGE CATEGORIES

Browse before coding:
```bash
ls "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/adobe-apis/"     # ExtendScript, CEP, QE
ls "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/debugging/"      # Common errors & fixes
ls "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/automation/"     # Time-saving scripts
ls "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/ui-patterns/"    # UI components
ls "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/performance/"    # Optimizations
```
