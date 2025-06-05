# Premiere Pro File Organization Pattern

## Problem
Imported files appear in root, need organized bin structure.

## Solution
Automated bin creation and file organization during import.

## Implementation
```javascript
function organizeImportedFile(importedItem, binName) {
    var rootItem = app.project.rootItem;
    var targetBin = null;
    
    // Check if bin exists
    for (var i = 0; i < rootItem.children.numItems; i++) {
        var child = rootItem.children[i];
        if (child.type === 2 && child.name === binName) { // type 2 = bin
            targetBin = child;
            break;
        }
    }
    
    // Create bin if doesn't exist
    if (!targetBin) {
        targetBin = rootItem.createBin(binName);
    }
    
    // Move imported item to bin
    if (targetBin && importedItem) {
        importedItem.moveBin(targetBin);
    }
    
    return targetBin;
}

// Usage
var importedItems = app.project.importFiles([filePath]);
if (importedItems && importedItems.length > 0) {
    var importedItem = importedItems[0];
    organizeImportedFile(importedItem, "AI Generated SFX");
}
```

## Advanced Pattern - Date-based Organization
```javascript
function getDateBinName() {
    var date = new Date();
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    return "SFX_" + date.getFullYear() + "-" + month + "-" + day;
}

// Creates bins like: SFX_2025-06-02
var dateBin = organizeImportedFile(item, getDateBinName());
```

## Benefits
- Clean project organization
- Easy to find generated files
- Professional workflow

## Token Savings
~50 tokens by reusing pattern