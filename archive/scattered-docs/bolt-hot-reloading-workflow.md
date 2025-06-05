# Bolt CEP Hot Reloading - NO PREMIERE RESTARTS NEEDED!

**Status:** ✅ CRITICAL - READ THIS FIRST
**Tokens:** ~75

## 🚨 IMPORTANT FOR OTHER CLAUDE SESSIONS

**NEVER restart Premiere Pro when using Bolt framework!** 
This breaks WebSocket connections between Claude sessions.

## ✅ UPDATED: The Right Way - Build Method (PROVEN WORKING)

### Development Mode (Use This!)
```bash
# TypeScript hot reload broken - use build method instead:
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build

# Check plugin status:
curl -s http://localhost:9230 && echo "✅ Working" || echo "❌ Dead"
```

### Legacy Method (Currently Broken)
```bash
# DON'T USE - TypeScript errors prevent this from working:
npm run watch  # ❌ BROKEN
```

### Updated Development Process
1. Make code changes in editor
2. Run `npm run build` (2 seconds)
3. Changes appear in Premiere (no restart!)
4. Debug at: http://localhost:9230

### When TO Use Build Command
✅ Use: `npm run build` after every code change
✅ Works better than watch mode (more reliable)
✅ TypeScript errors don't break the build
❌ Don't restart Premiere for code changes
❌ Don't break WebSocket connections

## Quick Check: Is Plugin Working?
```bash
# Check if plugin is responding:
curl -s http://localhost:9230 && echo "✅ Plugin alive" || echo "❌ Plugin dead"

# If dead, restart:
cd "/path/to/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```

## When to Use This
- Bolt CEP plugin development
- Any code changes to React/TypeScript
- UI updates and styling changes
- When you want to preserve WebSocket connections