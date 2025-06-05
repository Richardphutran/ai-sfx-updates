# Symlink Development Setup

**Status:** ✅ ESSENTIAL
**Tokens:** ~60

## Problem
Copying plugin files to system directory for every change is slow

## Solution
```bash
# Remove any existing plugin copy
sudo rm -rf "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"

# Create symlink to development folder
sudo ln -s "/path/to/your/plugin/folder" "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"
```

## Benefits
- Edit files directly in project
- No sudo copying needed
- Changes reflect immediately
- Version control friendly

## When to Use
Always for CEP plugin development - massive time saver