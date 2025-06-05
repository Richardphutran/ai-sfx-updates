# 📏 Quick Knowledge Rules

## File Limits
- **100 lines max** per file (~500 tokens)
- **One topic** per file
- **Split large discoveries**

## Before Adding
```bash
# 1. Check if exists
grep -r "your topic" .

# 2. Check file size
wc -l existing-file.md

# 3. If > 100 lines, split it!
```

## Good File Names
✅ `timeline-in-out-detection.md`
✅ `glass-button-hover-effect.md`
❌ `fix1.md`
❌ `my-discovery.md`

## Quick Add Template
```bash
cat > category/specific-topic.md << 'EOF'
# Specific Topic Name

**Status:** ✅ WORKING
**Tokens:** ~50

## Problem
One line description

## Solution
```javascript
// Your code
```

## When to Use
Specific scenario
EOF
```

## Check Knowledge Health
```bash
# Run maintenance check
python3 ../knowledge_maintainer.py check

# Auto-split oversized files
python3 ../knowledge_maintainer.py organize
```