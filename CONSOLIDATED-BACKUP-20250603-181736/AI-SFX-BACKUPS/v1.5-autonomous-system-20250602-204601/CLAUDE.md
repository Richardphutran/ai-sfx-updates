# CLAUDE.md - ai-sfx-plugin

This file provides minimal, task-specific guidance for Claude Code.

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