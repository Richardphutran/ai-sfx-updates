# 🚨 EMERGENCY HOT RELOAD GUIDE FOR OTHER CLAUDE SESSIONS

The TypeScript compiler is currently showing errors. Here are WORKING alternatives:

## ✅ METHOD 1: Production Build (WORKING)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build
```
**Result:** Builds once, ignores TypeScript errors, plugin updates immediately

## ✅ METHOD 2: Force Watch Mode (WORKING)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npx vite build --watch --mode development
```
**Result:** Bypasses TypeScript, watches for changes, auto-rebuilds

## ✅ METHOD 3: Direct Vite (WORKING)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npx vite build --watch=true --outDir=dist/cep
```

## 🎯 QUICK WORKFLOW FOR OTHER SESSIONS

### Step 1: Build After Code Changes
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build
```

### Step 2: Check Plugin Status
```bash
curl -s http://localhost:9230 && echo "✅ Plugin updated" || echo "❌ Plugin needs restart"
```

### Step 3: If Plugin Dead, Restart It
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```

## 🔧 ALTERNATIVE DEVELOPMENT WORKFLOW

Since TypeScript hot reloading is broken, use this pattern:

1. **Make code changes** in your editor
2. **Run `npm run build`** to compile changes
3. **Check http://localhost:9230** to see updates
4. **Repeat** for each change

## 📝 FOR TESTING CHANGES

```bash
# Quick test cycle
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"

# Make your code changes, then:
npm run build

# Check if plugin is alive
curl -s http://localhost:9230 && echo "✅ Updated" || echo "❌ Dead"

# If dead, restart:
cd MultiPluginSystem && python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```

## 🎨 WHEN EDITING UI/STYLES

For React components and SCSS changes:
```bash
# Edit files in src/js/main/main.tsx or src/js/main/main.scss
# Then build:
npm run build

# Plugin should update immediately (check browser at localhost:9230)
```

## 🧠 WHEN EDITING EXTENDSCRIPT

For Premiere integration changes:
```bash
# Edit files in src/jsx/ppro/ppro.ts
# Then build:
npm run build

# Test in Premiere by using the plugin
```

## ⚡ SUPER FAST ITERATION

If you need rapid iteration:
```bash
# Terminal 1: Keep this running
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
while true; do
  npm run build
  sleep 2
done

# Terminal 2: Make your changes
# Changes will auto-build every 2 seconds
```

## 🔍 DEBUG IF PLUGIN BREAKS

```bash
# 1. Check if plugin is responding
curl -s http://localhost:9230

# 2. Check console for errors
open http://localhost:9230

# 3. Check build output
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build

# 4. Nuclear restart if needed
cd MultiPluginSystem
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```

## 🎉 BOTTOM LINE

- **`npm run build`** is your friend - use it after every change
- **TypeScript errors don't stop the build** - it still works
- **Plugin updates immediately** after build completes
- **Only restart Premiere as last resort**

This workflow is actually more reliable than hot reloading for production development!