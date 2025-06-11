# CLAUDE.md - AI SFX Generator - DYNAMIC PORTS

## 🚨🚨🚨 STOP BURNING TOKENS - USE THESE COMMANDS 🚨🚨🚨

DONT MAKE EXCESSIVE TODO LISTS WHEN YOU DONT NEED TO (it wastes tokens on simple tasks)
Be Mindful of your Tokens. Aim your best to thinks with minimal tokens Under 100 tokens per task is great - try to never go over 20k tokens unless it's a huge job. NEVER go above 40k Tokens

### ⚡ NUCLEAR OPTION (1 command, 0 tokens):
```bash
python3 smart_helper.py start
```
Output: `✅ Auto-server running with self-healing`

### 🔧 SMART HELPER (all analysis automated):
```bash
python3 smart_helper.py
```

### 🚀 SERVER ISSUES (NEW - Auto-Recovery):
```bash
python3 smart_helper.py start    # Self-healing server
python3 smart_helper.py server   # Quick server fix
```

### 🎬 CEP WORKFLOW (NEW - Handles Premiere Restarts):
```bash
python3 smart_helper.py workflow
```

### 📊 QUICK STATUS:
```bash
python3 smart_helper.py status
python3 smart_helper.py workflow-status  # All plugins
```

## ❌ NEVER DO THIS (WASTES 50k+ TOKENS):
- ❌ Task() tool to find plugins
- ❌ Reading multiple files to debug
- ❌ Manual port checking
- ❌ Multiple Read() operations to find issues
- ❌ Creating debug scripts

## ✅ ALWAYS DO THIS (SAVES 95% TOKENS):
- ✅ `python3 smart_helper.py start` → Auto-recovery server
- ✅ `python3 smart_helper.py workflow` → CEP workflow with Premiere restart
- ✅ Trust the automation - it knows more than manual debugging

____
# 🤖 AUTONOMOUS DEBUGGING SOP

## 🚀 **NEW: One-Command Solution**
```bash
# BEST: Fully automated with self-healing
python3 smart_helper.py start

# This handles EVERYTHING:
# ✅ Auto-detects and fixes errors
# ✅ Self-restarts on crashes
# ✅ Resolves port conflicts automatically
# ✅ Monitors server health continuously
# ✅ No manual intervention needed
```

## 🎬 **CEP Development Workflow (When .debug changes)**
```bash
# Use this when changing ports or debug settings:
python3 smart_helper.py workflow

# Guides you through:
# ✅ Build → Check .debug changes
# ✅ Prompt for Premiere restart if needed
# ✅ Clear CEP cache
# ✅ Start dev server
# ✅ Show both dev & debug URLs
```

## 🔧 **Classic Debug Cycle (If needed)**
```bash
# STEP 1: Original bulletproof startup
./start-bulletproof.sh

# STEP 2: Quick fixes if server fails
python3 smart_helper.py

# STEP 3: Deep diagnosis
python3 doctor.py

# STEP 4: Auto-test
python3 cep_debug.py interact
```

## ⚡ **Quick Reference**
```bash
# Server crashed? Just run:
python3 smart_helper.py start

# Changed ports? Run:
python3 smart_helper.py workflow

# Check everything:
python3 smart_helper.py workflow-status
```

____
# AI SFX Generator | CEP Plugin

## Plugin Details
- **Name**: AI SFX Generator
- **Type**: CEP Plugin (BOLT)
- **Dev Port**: Dynamic (auto-assigned)
- **Debug Port**: Dynamic (auto-assigned)
- **Extension ID**: com.aisfx.cep.main
- **AI Provider**: Eleven Labs

## Core Features
- Generate sound effects with AI prompts
- Spacebar search for existing SFX
- Smart timeline placement at playhead
- Support for In/Out point placement
- Both generate & search in one tool

## Workflow
1. **Search First**: Hit spacebar, type sound name
2. **Generate if Needed**: If not found, type prompt
3. **Auto-Place**: SFX places at playhead/selection
4. **Organize**: Dedicated audio track for SFX

## Rules
- Search database before generating new
- Place at playhead by default
- Respect In/Out points if set
- Never overlap existing clips
- Auto-create SFX track if missing

## 🔄 Dynamic Port Management
```bash
# Check current ports and conflicts
node dynamic-port-manager.js

# See all plugin ports
node dynamic-port-manager.js status
```

Port ranges:
- Dev servers: 3000-3099
- Debug consoles: 8800-8899
- Each plugin gets unique ports automatically

## Known Issues & Fixes
- Port conflicts with other plugins
- Eleven Labs API timeout handling
- ExtendScript async execution
- Audio track detection/creation

## 🔗 ALWAYS PROVIDE LINKS WHEN DEBUGGING
**CRITICAL**: When getting the plugin up and running, ALWAYS provide both URLs:
```
✅ Dev Server: http://localhost:[PORT]/main/
🔍 Debug Console: http://localhost:[DEBUG_PORT]
```

## Debug
Console → Check port with `node dynamic-port-manager.js`
CEP HTML Test Tool → Reload panel
Smart helper: `python3 smart_helper.py`

**Remember**: Always reply with BOTH localhost links when debugging and troubleshooting

## PM2 Integration
```bash
# Check if running in PM2
pm2 list

# Start with PM2
pm2 start npm --name "ai-sfx" -- run dev

# Stop/restart
pm2 stop ai-sfx
pm2 restart ai-sfx

# View logs
pm2 logs ai-sfx
```