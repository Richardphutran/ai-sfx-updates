# CLAUDE.md - ai-sfx-plugin

This file provides minimal, task-specific guidance for Claude Code.

## 🤖 Autonomous Development Workflow (97% Token Reduction)

### One Command to Rule Them All
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX" && python3 AI-SFX-Bolt/autonomous_dev_starter.py
```

This single command:
- Starts Premiere Pro with your project
- Enables hot reloading (no restarts!)
- Finds debug ports automatically
- Monitors console output
- Detects and fixes errors using AI
- Applies solutions from knowledge base

### Essential Python Scripts

#### 1. Hot Reload Without Thinking
```bash
# Start hot reload (watches for file changes)
python3 AI-SFX-Bolt/pure_python_plugin_restart.py

# Changes auto-reload when you save - NO manual commands needed!
```

#### 2. Debug Port Discovery
```bash
# Find which port your plugin is on
python3 /Users/richardtran/Desktop/check_debug_ports.py

# Output:
# AI SFX Plugin: http://localhost:9230 ✅
# Text-Based Editing: http://localhost:9231 ✅
```

#### 3. Knowledge System (Self-Learning AI)
```bash
# Search for solutions when stuck
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline error"

# Add new discoveries
echo "Your solution" | python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py add "ai-sfx" "debugging" "timeline-fix"
```

### 📸 Auto Screenshot: `python3 ~/Desktop/universal-plugin-screenshot.py` (zero interaction, works with any localhost)
### 🐛 Auto Debug: `python3 /Users/richardtran/Desktop/check_debug_ports.py` (finds active ports + shows available ports for other sessions)
### 🎮 Remote Control: `python3 ~/Desktop/plugin-remote-control.py --type "your text" --click ".button"` (interact with UI programmatically. Note: browser prompts need special handling)

### 🔄 Plugin Restart & Reload Commands

#### Hard Restart (When Plugin Not Loading)
```bash
# Kill Premiere and restart with project
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX" && python3 AI-SFX-Bolt/pure_python_plugin_restart.py
```

#### Check Plugin Status After Restart
```bash
# Wait for plugin to load then check port
sleep 10 && python3 /Users/richardtran/Desktop/check_debug_ports.py
```

#### Take Screenshot of Plugin UI
```bash
# Specify port 9230 for AI SFX plugin
python3 ~/Desktop/universal-plugin-screenshot.py 9230
```

### 🔧 Symlink Management (When Switching Between Versions)

#### Check Current Symlinks
```bash
# System-wide extensions
ls -la "/Library/Application Support/Adobe/CEP/extensions/" | grep -i sfx

# User extensions (no sudo needed)
ls -la "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/" | grep -i sfx
```

#### Update User Symlink (No Sudo Required)
```bash
# Remove old symlink and create new one pointing to CEP-Plugin
rm "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/com.ai.sfx.generator"
ln -s "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CEP-Plugin" "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/com.ai.sfx.generator"
```

### 📝 Testing Scripts Created

#### Complete Timeline Test
```bash
# Tests audio placement step by step
# Location: /Users/richardtran/Desktop/complete-timeline-test.js
# Usage: Paste into Chrome DevTools console at http://localhost:9230
```

#### UI Generation Test
```bash
# Tests the generation indicator UI
# Location: /Users/richardtran/Desktop/test-generation-ui.js
# Usage: Paste into Chrome DevTools console
```

#### Simple Placement Test
```bash
# Basic audio placement test
# Location: /Users/richardtran/Desktop/test-placement-simple.js
# Usage: Paste into Chrome DevTools console
```

### 🎯 Common Troubleshooting Workflow

When plugin isn't working properly:

1. **Restart Plugin**
   ```bash
   cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX" && python3 AI-SFX-Bolt/pure_python_plugin_restart.py
   ```

2. **Check Debug Port**
   ```bash
   python3 /Users/richardtran/Desktop/check_debug_ports.py
   ```

3. **Open Chrome DevTools**
   - Navigate to http://localhost:9230
   - Open DevTools console

4. **Run Test Scripts**
   - Paste test scripts from Desktop into console
   - Check for errors and debug output

5. **Check Symlinks if Wrong Version Loads**
   ```bash
   # See what's linked
   ls -la "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/" | grep sfx
   
   # Update if needed
   rm "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/com.ai.sfx.generator"
   ln -s "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/CEP-Plugin" "/Users/richardtran/Library/Application Support/Adobe/CEP/extensions/com.ai.sfx.generator"
   ```

### 🔥 Development Workflow (Low Token Usage)

1. **Start Development (Once per session)**
   ```bash
   python3 AI-SFX-Bolt/autonomous_dev_starter.py
   ```

2. **Make Changes**
   - Edit files normally
   - Save to trigger hot reload
   - Console errors auto-detected

3. **Quick Commands**
   ```bash
   # Check timeline values
   python3 /Users/richardtran/Desktop/quick-debug.py timeline
   
   # Reload plugin
   python3 /Users/richardtran/Desktop/quick-debug.py reload
   
   # Test plugin health
   python3 /Users/richardtran/Desktop/quick-debug.py test
   ```

### 🚨 Critical Rules

**NEVER:**
- ❌ Restart Premiere for code changes
- ❌ Manually refresh plugins
- ❌ Debug without checking knowledge base first

**ALWAYS:**
- ✅ Use Python automation scripts
- ✅ Let hot reload handle changes
- ✅ Check knowledge base for known solutions

### 📊 Token Efficiency Metrics

| Task | Manual Tokens | Automated Tokens | Savings |
|------|---------------|------------------|---------|
| Debug timeline | 275+ | 5-10 | 97% |
| Reload plugin | 150+ | 5 | 97% |
| Find error solution | 200+ | 10 | 95% |
| Check console | 100+ | 5 | 95% |

### 🧠 Knowledge Base Quick Access

```bash
# Common solutions by category
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/

# Categories:
# - adobe-apis/     # ExtendScript, CEP, QE
# - debugging/      # Common errors & fixes
# - ui-patterns/    # UI/UX implementations
# - automation/     # Workflow scripts
# - performance/    # Optimizations
```

### 🌐 Shared MultiPluginSystem (Centralized)

All Adobe plugins now share a single MultiPluginSystem at:
`/Users/richardtran/Documents/Code/MultiPluginSystem-Central`

This folder is symlinked from each project, so all Claude sessions read/write the same knowledge base.

**Important:** 
- Any updates to the knowledge base are immediately available to ALL projects!
- When one Claude session discovers something, ALL sessions benefit
- The MultiPluginSystem folder in this project is actually a symlink to the central location

**Verify the symlink:**
```bash
ls -la AI-SFX-Bolt/ | grep MultiPluginSystem
# Should show: MultiPluginSystem -> /Users/richardtran/Documents/Code/MultiPluginSystem-Central
```

### 🤖 MANDATORY: Check Knowledge Base BEFORE Solving Problems

**ALWAYS check the knowledge base FIRST when encountering any issue:**

```bash
# 1. Search for existing solutions
grep -r "your error or topic" AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/

# 2. Use Python knowledge engine for smart search
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "your specific issue"

# 3. Check specific categories
ls AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/ | grep -i "your-topic"
```

### ✍️ MANDATORY: Add New Discoveries to Knowledge Base

**When you solve a problem, IMMEDIATELY add it to the knowledge base:**

```bash
# Quick add (one-liner)
echo "Your solution here" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/[category]/[descriptive-name].md

# Example: Fixed timeline detection
echo "Solution: Use parseFloat() on sequence.getInPoint().seconds" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-parsefloat-fix.md
```

**Knowledge File Format:**
```markdown
# Problem Title

## Problem
Brief description of the issue

## Solution
Step-by-step solution

## Code Example
```code
// Example code
```

## Date: YYYY-MM-DD
## Plugin: AI SFX Generator
```

### 🔄 Knowledge Base Workflow

1. **Before starting any task**: Search knowledge base
2. **When encountering an error**: Search knowledge base
3. **After solving a problem**: Add to knowledge base
4. **When solution works**: Update existing knowledge file

**This is NOT optional - it's how all Claude sessions learn from each other!**

### 💡 Pro Tips for Low Token Development

1. **Use Automation First**
   ```bash
   # Instead of: "Open Chrome, navigate to localhost:9230, check console..."
   python3 /Users/richardtran/Desktop/quick-debug.py test
   ```

2. **Batch Operations**
   ```bash
   # Check everything at once
   python3 AI-SFX-Bolt/autonomous_dev_starter.py --check-all
   ```

3. **Let AI Fix Errors**
   - System detects console errors
   - Searches knowledge base
   - Applies fixes automatically
   - You just review results

### 🔧 Emergency Commands

```bash
# If hot reload stops
pkill -f "npm run watch" && python3 AI-SFX-Bolt/pure_python_plugin_restart.py

# If plugin crashes
python3 AI-SFX-Bolt/safe_plugin_restart.py

# Full reset (nuclear option)
pkill -f "Adobe Premiere Pro" && python3 AI-SFX-Bolt/autonomous_dev_starter.py
```

### 📝 Session Handoff Protocol

When ending a session, run:
```bash
# Save current state and discoveries
python3 AI-SFX-Bolt/MultiPluginSystem/sync_knowledge.py --save-session

# Generate handoff notes
echo "Session complete. Knowledge saved. Next session: run autonomous_dev_starter.py" > SESSION_STATUS.md
```

### 🧠 Updating Shared Knowledge (Keep Files Small!)

**Add discoveries immediately:**
```bash
# Quick add (one-liner)
echo "Your solution here" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/your-fix-name.md

# With category
echo "Timeline fix: use parseFloat()" > AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-parseFloat-fix.md
```

**Rules:**
- Max 100 lines per file (~500 tokens)
- One topic per file
- Descriptive names: `timeline-detection-fix.md` not `fix1.md`

**Categories:**
```bash
adobe-apis/    # ExtendScript, CEP, APIs
debugging/     # Errors & fixes
ui-patterns/   # UI/UX code
automation/    # Scripts & workflows
performance/   # Optimizations
```

**Check before adding:**
```bash
grep -r "your topic" AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/
```

## Important Instructions

### URL References
- **Always include clickable URLs** when mentioning ports or web addresses
- Example: "Open Chrome DevTools at http://localhost:9230" (not just "port 9230")
- This allows immediate clicking instead of manual URL construction

## Project Overview
Plugin: AI SFX Generator - Adobe Premiere Pro CEP plugin for AI-powered sound effects
Knowledge Base: AI-SFX-Bolt/MultiPluginSystem/knowledge-base

## Essential Knowledge Access
```python
# To get knowledge for your current task:
from AI-SFX-Bolt.MultiPluginSystem.knowledge_engine import KnowledgeEngine
ke = KnowledgeEngine()
knowledge = ke.get_knowledge_for_task('ai-sfx-plugin', 'your task description')
```

## Quick Knowledge Retrieval Commands
```bash
# Get debugging help
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "debug timeline issue"

# Get UI/UX patterns  
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "glass effects UI"

# Get API integration help
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "Eleven Labs API"
```

## Core Quick References

### Bolt Development Workflow
- **NEVER restart Premiere** for code changes - Bolt has hot reloading!
- **Development mode**: `npm run watch` (enables hot reloading)
- **Production build**: `npm run build` (single build, no watch)
- **Quick dev start**: `/Users/richardtran/Desktop/start_bolt_dev.sh`

### Debug Port Discovery
- **Find active ports**: `python3 /Users/richardtran/Desktop/check_debug_ports.py`
- **AI SFX Plugin**: http://localhost:9230
- **Port mapping reference**: See MultiPluginSystem/shared-knowledge/debugging/localhost-port-mapping.md

### CEP Setup (if needed)
- Symlink to: `/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator`
- Debug URL: http://localhost:9230 (as configured in .debug file)
- Enable unsigned: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`

### Critical Patterns
- ExtendScript: Use static methods only (`TimelineManager.executeScript()`)
- Timeline: `seq.getInPoint().seconds` works directly
- Events: `onProjectChanged` fires for in/out changes

## Knowledge Categories Available
- **core/** - Adobe APIs, ExtendScript, CEP architecture
- **ui-ux/** - Design patterns, components, styling  
- **debugging/** - Common issues, breakthroughs
- **automation/** - Scripts, testing, workflows
- **api-integration/** - External APIs, auth, files
- **performance/** - Optimization, caching, memory

## Contributing Knowledge
When you discover something new:
```bash
echo "Your discovery" | python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py add "ai-sfx" "category" "topic"
```

## Current Plugin State
- ✅ Timeline detection working
- ✅ In/Out points detecting correctly
- ✅ Audio file generation via Eleven Labs
- 🚧 Professional UI upgrade needed
- 🚧 Audio preview before placement

## 🧠 Shared Knowledge System

Access proven solutions from other Adobe plugin development:

### 🚨 CRITICAL - READ THIS FIRST
```bash
# NEVER restart Premiere with Bolt - use hot reloading instead!
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/bolt-hot-reloading-workflow.md

# Know which localhost port is which project:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/localhost-port-mapping.md

# When working on UI/UX - Use Stagewise for AI-powered UI development:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/stagewise-setup-guide.md
```

### Quick Commands
```bash
# When debugging timeline issues:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-detection-breakthrough.md

# When setting up CEP debugging:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/cep-debugging-setup.md

# When implementing glass UI effects:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/glass-effect-ui.md

# When fixing ExtendScript communication:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/extendscript-static-methods.md

# When automating plugin reload:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/plugin-reload-automation.md
```

### Browse All Available Knowledge
```bash
# See all categories:
ls ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/

# Debugging solutions:
ls ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/

# UI/UX patterns:
ls ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/

# Adobe API patterns:
ls ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/

# Automation scripts:
ls ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/automation/
```

### Search for Specific Topics
```bash
# Search all shared knowledge:
grep -r "your search term" ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/
```

### Available Knowledge Includes:
- ✅ **Timeline Detection** - onProjectChanged events, parseFloat() fix
- ✅ **ExtendScript Patterns** - Static methods, string/number conversion
- ✅ **CEP Debugging** - Complete Chrome DevTools setup, unique ports
- ✅ **QE API** - Undocumented track creation with app.enableQE()
- ✅ **UI Patterns** - Glass effects, clean horizontal design
- ✅ **Smart Track Placement** - Collision detection for audio clips
- ✅ **Automation** - 97% token reduction with Python scripts
- ✅ **Eleven Labs API** - Sound generation integration
- ✅ **Bin Organization** - Project structure management

### Contributing New Discoveries
When this plugin discovers something useful for all Adobe plugins:
```bash
# Save to appropriate category:
echo "Your new discovery content" > ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/[category]/[descriptive-name].md
```

### 📏 Knowledge Rules (Keep Files Small!)
- **Max 100 lines per file** (~500 tokens)
- **One topic per file** (split large discoveries)
- **Descriptive names**: `timeline-in-out-detection.md` not `fix1.md`
- **Check before adding**: `grep -r "topic" shared-knowledge/`

If a discovery is large, split it:
```bash
# Bad: One huge file
echo "500 lines of content" > debugging/everything.md ❌

# Good: Split into specific files
echo "Part 1" > debugging/timeline-detection-events.md ✅
echo "Part 2" > debugging/timeline-detection-api.md ✅
echo "Index" > debugging/timeline-detection-INDEX.md ✅
```