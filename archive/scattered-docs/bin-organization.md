# Project Bin Organization

**Status:** ✅ WORKING
**Tokens:** ~70

## Problem
Need to organize imported clips into bins for better project management

## Solution
```javascript
// Find or create bin
var rootItem = app.project.rootItem;
var targetBin = null;

// Check if bin exists
for (var i = 0; i < rootItem.children.numItems; i++) {
    var child = rootItem.children[i];
    if (child.type === ProjectItemType.BIN && child.name === "AI SFX") {
        targetBin = child;
        break;
    }
}

// Create if doesn't exist
if (!targetBin) {
    targetBin = rootItem.createBin("AI SFX");
}

// Move item to bin
importedItem.moveBin(targetBin);
```

## When to Use
Organizing imported assets into project bins for cleaner project structure