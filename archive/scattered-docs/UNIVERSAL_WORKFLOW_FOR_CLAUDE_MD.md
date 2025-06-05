# 🚀 Universal Adobe Plugin Development Workflow for All Claude Sessions

## Add This Section to All Your CLAUDE.md Files

```markdown
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
```

## 🎯 Implementation Instructions

1. **Copy the above markdown section**
2. **Add to your project's CLAUDE.md file** under a section like "Development Workflow"
3. **Customize paths** if your project structure differs
4. **Add project-specific scripts** to the workflow

## 📊 Why This Workflow?

- **97% reduction** in token usage
- **Automatic error resolution** from knowledge base
- **Zero manual debugging** needed
- **Hot reload everything** without restarts
- **Self-improving system** that learns from each session

## 🔄 Keeping It Updated

When you discover new automation:
1. Add to knowledge base
2. Update this workflow template
3. Sync to all projects:
   ```bash
   python3 AI-SFX-Bolt/MultiPluginSystem/sync_knowledge.py --update-all-claude-md
   ```

---

**Remember:** Every manual command you type is tokens wasted. Automate everything! 🤖