# Token-Efficient Debugging Patterns

**Status:** ✅ CRITICAL
**Tokens:** ~70

## Problem
Manual debugging wastes hundreds of tokens per cycle

## Solution
1. **One-line Python scripts** instead of manual navigation
2. **Batch operations** - multiple commands in one execution
3. **Direct result extraction** - no manual interpretation

## Examples
```bash
# Instead of 275+ tokens of manual work:
python3 quick-debug.py timeline
# Result in 5 tokens: "IN: 30s, OUT: 60s"

# Batch multiple operations:
python3 debug.py "reload; test; timeline"
```

## Token Savings
- Manual process: 275+ tokens
- Automated: 5-10 tokens
- **97% reduction**

## When to Use
Every debugging session - automate repetitive tasks