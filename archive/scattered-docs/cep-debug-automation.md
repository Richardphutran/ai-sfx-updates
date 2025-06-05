# CEP Debug Automation Scripts

**Status:** ✅ 97% TOKEN REDUCTION
**Tokens:** ~85

## Problem
Manual debugging wastes hundreds of tokens per cycle

## Solution
Python automation scripts for one-line debugging:

```bash
# Get timeline values instantly
python3 ~/Desktop/quick-debug.py timeline
# Output: IN: 30.5s, OUT: 65.2s, DURATION: 34.7s

# Test plugin health
python3 ~/Desktop/quick-debug.py test

# Reload plugin
python3 ~/Desktop/quick-debug.py reload

# Execute JavaScript
python3 ~/Desktop/quick-debug.py js "getTimelineValues()"

# Full development cycle
python3 ~/Desktop/cep-debug-automation.py cycle
```

## Token Efficiency
- Manual: 275+ tokens per debug cycle
- Automated: 5-10 tokens
- **97% reduction**

## When to Use
Every CEP plugin debugging session - saves massive tokens and time