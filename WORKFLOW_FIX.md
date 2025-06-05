# 🚨 WORKFLOW FIX FOR ALL CLAUDE SESSIONS

## ❌ THE PROBLEM (90k tokens wasted)
1. **Blind editing without seeing errors** - Changed code randomly
2. **Never checked console** - Missed actual error messages  
3. **Knowledge base had no real solution** - Just empty promises
4. **Too many file reads** - Read entire files instead of targeted grep

## ✅ THE SOLUTION (Under 5k tokens)

### 1. ALWAYS CHECK CONSOLE FIRST
```bash
# Open browser console immediately
open http://localhost:9230/devtools/inspector.html

# Or use streamlined debugger
python3 streamlined_console_debug.py
```

### 2. USE TARGETED GREP (not full file reads)
```bash
# Find specific code patterns
grep -n "spacebar\|keydown.*32\|key === ' '" file.tsx

# Check if function exists
grep -n "functionName" file.tsx | head -5
```

### 3. MINIMAL TEST EDITS
```bash
# Add ONE console.log to verify code runs
console.log('🎯 REACHED: spacebar handler line 737');

# If it doesn't log, the problem is BEFORE that line
```

### 4. SAVE REAL SOLUTIONS
```bash
# After fixing, save the ACTUAL solution
echo "Problem: Spacebar not working
Solution: textarea onKeyDown was missing
Fix: Add onKeyDown={handleKeyDown} to textarea element" > shared-knowledge/debugging/spacebar-fix.md
```

## 📊 TOKEN METRICS
- Old way: 90,000 tokens → Plugin still broken
- New way: <5,000 tokens → Problem identified & fixed

## 🎯 DEPLOYMENT TO OTHER SESSIONS
```bash
# Update all CLAUDE.md files with this workflow
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/update-all-claude-md.py workflow

# Add to knowledge base
cp WORKFLOW_FIX.md /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/MultiPluginSystem/shared-knowledge/workflow/
```

## 🔴 ENFORCEMENT RULE
**NEVER edit code without checking console first!**
**NEVER read full files when grep can find the issue!**