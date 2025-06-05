# Symlink Development Workflow for CEP

## Problem
CEP development requires copying files to system directories and restarting Premiere for every change.

## Solution
Use symlinks for instant updates without copying or restarting.

## Setup
```bash
# Remove any existing plugin copy
sudo rm -rf "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"

# Create symlink to development folder
sudo ln -s "/path/to/your/CEP-Plugin" "/Library/Application Support/Adobe/CEP/extensions/YourPlugin"
```

## Benefits
- ✅ Edit files directly in project folder
- ✅ No sudo copying required for changes
- ✅ Version control friendly
- ✅ Faster iteration (instant updates)
- ✅ No file permission issues

## Enhanced Workflow
```bash
# Enable CEP live reload
defaults write com.adobe.CSXS.11 CEPHtmlEngine "chromium"
defaults write com.adobe.CSXS.11 CEPEnableExtensionReload 1

# Enhanced debugging
defaults write com.adobe.CSXS.11 LogLevel 6
defaults write com.adobe.CSXS.11 CSXSAllowUnsignedExtensions 1
```

## Critical Hidden File Issue
```bash
# The .debug file may not be visible/copied
# If "No debug port file found" error:
sudo cp "/path/to/your/CEP-Plugin/.debug" "/Library/Application Support/Adobe/CEP/extensions/YourPlugin/.debug"
```

## .debug File Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.yourcompany.yourplugin" Port="7002"/>
</ExtensionList>
```

## Complete Development Cycle
1. Create symlink once
2. Edit files in your project
3. Reload plugin with Cmd+R in Premiere
4. Debug at http://localhost:7002

## Token Savings
~200 tokens per development session by avoiding file system issues