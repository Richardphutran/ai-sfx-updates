# 🔥 HOT RELOADING FOR OTHER CLAUDE SESSIONS

**COPY AND PASTE THIS INTO YOUR OTHER CLAUDE SESSION**

## 🚨 CRITICAL - READ THIS FIRST

**NEVER restart Premiere Pro when working with Bolt plugins!** 
Hot reloading handles all code changes automatically.

## 🚀 HOW TO START HOT RELOADING

### Method 1: Quick Start Script
```bash
/Users/richardtran/Desktop/start_bolt_dev.sh
```

### Method 2: Manual Start
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run watch
```

### Method 3: From MultiPlugin System
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 -c "
import subprocess
import os
os.chdir('/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt')
subprocess.run(['npm', 'run', 'watch'])
"
```

## 🔥 WHAT HOT RELOADING DOES

When you run `npm run watch`:
1. **Watches all source files** (TypeScript, React, SCSS)
2. **Auto-rebuilds** when you save changes
3. **Instantly updates** the plugin in Premiere
4. **No Premiere restart** needed
5. **Preserves plugin state** and WebSocket connections

## 💻 DEVELOPMENT WORKFLOW

### Step 1: Start Hot Reloading (ONCE)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run watch
```
**You'll see:** `watching for file changes...` in terminal

### Step 2: Make Code Changes
- Edit files in `src/js/main/main.tsx` (React components)
- Edit files in `src/js/main/main.scss` (styles) 
- Edit files in `src/jsx/ppro/` (ExtendScript)

### Step 3: Save File
- Changes appear **instantly** in Premiere plugin
- Check console at: http://localhost:9230

### Step 4: Debug if Needed
```bash
# Check if plugin is responding
curl -s http://localhost:9230 && echo "✅ Plugin alive" || echo "❌ Plugin dead"

# View console logs
open http://localhost:9230
```

## 🔍 HOW TO CHECK IF HOT RELOADING IS ACTIVE

### Method 1: Check Terminal Output
Look for:
```
vite v5.x.x building for development...
watching for file changes...
✓ built in XXXms
```

### Method 2: Check Process
```bash
ps aux | grep "npm run watch"
# OR
ps aux | grep "vite.*watch"
```

### Method 3: Test a Change
1. Edit a file (add a comment)
2. Save it
3. Should see rebuild message instantly

## 🛠️ COMMON COMMANDS FOR OTHER SESSIONS

### Start Hot Reloading
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt" && npm run watch
```

### Check Plugin Status
```bash
curl -s http://localhost:9230 >/dev/null && echo "✅ AI SFX Plugin alive" || echo "❌ Plugin not responding"
```

### Stop Hot Reloading
```bash
# In the terminal where npm run watch is running:
Ctrl + C
```

### Production Build (When Done Developing)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build
```

## 🚫 WHAT NOT TO DO

❌ **Don't restart Premiere** for code changes
❌ **Don't use `npm run build`** during development  
❌ **Don't run multiple `npm run watch`** sessions
❌ **Don't edit dist/ files** (they get overwritten)

## ✅ WHAT TO DO

✅ **Use `npm run watch`** for all development
✅ **Edit source files** in `src/` directory
✅ **Check http://localhost:9230** for console logs
✅ **Save files** to trigger auto-rebuild
✅ **Keep terminal open** while developing

## 🔧 IF HOT RELOADING STOPS WORKING

### Quick Fix
```bash
# Stop current watch (Ctrl+C)
# Then restart:
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run watch
```

### Nuclear Option (Last Resort)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
# Then restart hot reloading
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run watch
```

## 📊 BENEFITS OF HOT RELOADING

- ⚡ **Instant feedback** (changes appear in <2 seconds)
- 🔄 **No manual reloads** needed
- 💾 **Preserves plugin state** 
- 🔗 **Maintains WebSocket connections**
- 🚀 **Professional development experience**

## 🎯 FOR CLAUDE SESSIONS WORKING ON OTHER PLUGINS

If you're working on a different plugin, adapt the paths:
```bash
cd "/path/to/your/plugin"
npm run watch  # If it supports hot reloading
```

Or register your plugin in the multi-plugin system:
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py register your-plugin 9231 3002 "Your Plugin Name"
```

---

**Remember: Hot reloading is your friend. Premiere restarting is the enemy! 🔥**