# Proven Hot Reload Workflow - Build Method

**Status:** ✅ TESTED & WORKING (December 2024)
**Tokens:** ~45

## Problem
Traditional hot reloading broken due to TypeScript errors. Need reliable development workflow.

## Proven Solution

### Main Development Command
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run build
```

### Quick Status Check
```bash
curl -s http://localhost:9230 && echo "✅ Plugin working" || echo "❌ Plugin dead"
```

### Emergency Recovery
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```

## Development Pattern
1. **Edit code** in VS Code
2. **`npm run build`** (2 seconds)
3. **Test in Premiere** 
4. **Repeat**

## Why This Works Better
- **TypeScript errors ignored** - Build still succeeds
- **Immediate updates** - Plugin refreshes after build
- **More reliable** - No WebSocket issues
- **Faster than restarts** - 2s vs 30s+
- **Production-ready** - Same as deployment workflow

## File Locations
- **React UI:** `src/js/main/main.tsx`, `src/js/main/main.scss`
- **ExtendScript:** `src/jsx/ppro/ppro.ts`
- **Debug Console:** http://localhost:9230

## Benefits
- No Premiere restarts needed
- TypeScript errors don't break development
- Immediate feedback
- Professional workflow
- Token-efficient debugging