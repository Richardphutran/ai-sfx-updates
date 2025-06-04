# CLAUDE.md - AI SFX - ENFORCED MULTI-PLUGIN WORKFLOW

## 🎨 UI DESIGN PRINCIPLES - NEVER VIOLATE

### ❌ ABSOLUTELY FORBIDDEN:
- **NEVER add extra buttons to the UI**
- **NEVER modify the beautiful, minimal interface**
- **NEVER add UI elements without explicit user request**
- **NEVER clutter the clean design with unnecessary controls**

### ✅ UI PHILOSOPHY:
- **Minimal is beautiful** - The current design is perfect
- **Every pixel matters** - Don't add anything that disrupts the flow
- **Backend fixes only** - Fix issues in ExtendScript/logic, not by adding UI
- **Preserve the aesthetic** - The clean interface is intentional and must be protected

## 🔒 IDENTITY PROTECTION - NEVER SHOW WRONG PLUGIN

### 🚨 THIS PLUGIN MUST NEVER SHOW OTHER PLUGIN CONTENT!
**Use this command to guarantee AI SFX loads correctly:**
```bash
python3 ensure_correct_plugin.py
```

This script:
- ✅ Kills any conflicting plugin servers
- ✅ Clears CEP cache that might show wrong content  
- ✅ Guarantees AI SFX Generator loads on port 3030
- ✅ Prevents cross-plugin contamination

### ⚠️ CRITICAL PORT CONFIGURATION
**AI SFX uses port 3030** (NOT 3001) to avoid conflicts:
- Dev Server: http://localhost:3030/main/
- Debug Port: 9230
- NEVER use port 3001 - it's used by other plugins!

### 🛡️ BUILT-IN PROTECTIONS:
1. **Plugin ID Verification** - Checks extension ID on load
2. **Port Enforcement** - Redirects if wrong port detected
3. **Visual Identity** - Subtle "SFX" watermark in top-right
4. **Data Attributes** - HTML marked with plugin identity

## 🚨 CRITICAL: FIX FOR "PAGE FAILED TO LOAD" ERROR

**ALL Claude sessions MUST use this to prevent ERR_CONNECTION_REFUSED:**

### 🌟 UNIVERSAL PLUGIN STARTER (USE THIS!)
```bash
# This prevents the "Page failed to load" error that ALL sessions get
python3 universal_plugin_start.py
```

This script:
- ✅ Starts dev server FIRST (prevents connection errors)
- ✅ Auto-detects all project settings
- ✅ Opens plugin in Premiere automatically
- ✅ Monitors health and shows debug URL
- ✅ Works with ANY CEP plugin without modification

### 🔧 If Plugin Already Shows Error:
1. Ensure dev server is running: `npm run dev`
2. Click on plugin panel in Premiere
3. Press **Cmd+R** (Mac) or **F5** (Windows) to reload

### 🛡️ Auto-Recovery Built In:
The plugin now includes auto-reconnect code that:
- Detects connection errors automatically
- Shows "Waiting for Dev Server..." message
- Reloads automatically when server is ready
- No manual intervention needed!

---

## 🚨 MANDATORY FIRST STEPS - NO EXCEPTIONS

**BEFORE doing ANYTHING else, you MUST run these commands:**

### 1. ⚡ REQUIRED: Use Universal Starter
```bash
# ALWAYS use this to start development - prevents ALL connection issues
python3 universal_plugin_start.py
```

### 2. ⚡ REQUIRED: Search Knowledge Base
```bash
# ALWAYS search first - existing solutions save 97% of tokens
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "your problem"

# Common searches:
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline"
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "connection refused"
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "reload"
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "extendscript"
```

### 3. ⚡ REQUIRED: Check Active Ports
```bash
# Shows all active plugins and debug URLs
python3 /Users/richardtran/Desktop/check_debug_ports.py
```


## 🛠️ Cross-Plugin Tools (MultiPluginSystem)
```bash
# Update ALL plugin CLAUDE.md files from any session  
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py all

# Individual operations:
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py reload    # Add reload instructions
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py tools     # Add tool references
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
- **ALWAYS start with**: `python3 MultiPluginSystem/knowledge_engine.py get`
- **ALWAYS use**: `python3 autonomous_dev_starter.py`
- **ALWAYS check**: `ls MultiPluginSystem/shared-knowledge/`
- **ALWAYS add discoveries**: `echo "solution" > MultiPluginSystem/shared-knowledge/category/name.md`

---

## 📊 Token Efficiency Enforcement

| Forbidden Approach | Required Approach | Token Savings |
|-------------------|------------------|---------------|
| Manual debugging (275+ tokens) | Knowledge search (5-10 tokens) | 97% |
| Writing new scripts (150+ tokens) | Use existing automation (5 tokens) | 97% |
| Manual plugin restart (100+ tokens) | `autonomous_dev_starter.py` (5 tokens) | 95% |

---

## 📱 Project Details

- **Dev Port**: 3030 (http://localhost:3030)
- **Serve Port**: 5030 (production serve)
- **Debug Port**: 9230 (auto-detected via check_debug_ports.py)
- **Type**: CEP Plugin
- **Key**: ai-sfx (for knowledge searches)
- **Automation**: `autonomous_dev_starter.py`

---

**⚡ REMEMBER: The multi-plugin system exists to eliminate manual work. Use it!**

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
