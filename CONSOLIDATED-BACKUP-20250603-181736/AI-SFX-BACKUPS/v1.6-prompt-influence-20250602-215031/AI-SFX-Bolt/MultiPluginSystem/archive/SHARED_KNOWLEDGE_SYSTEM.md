# 🧠 Shared Knowledge System (Preserving Individual CLAUDE.md)

## Architecture

Each plugin keeps its own CLAUDE.md with plugin-specific info, but can access shared knowledge:

```
Your-Plugin/
├── CLAUDE.md                    # Plugin-specific (NOT TOUCHED)
└── shared-knowledge-access.md   # How to access shared knowledge

MultiPluginSystem/
├── shared-knowledge/            # Shared discoveries
│   ├── debugging/
│   ├── ui-patterns/
│   ├── adobe-apis/
│   └── automation/
├── shared_knowledge.py          # Access shared knowledge
└── contribute_knowledge.py      # Add discoveries
```

## How It Works

### 1. Each Plugin Keeps Its CLAUDE.md
- Contains plugin-specific context
- Never modified by the system
- Includes a reference to shared knowledge

### 2. Shared Knowledge Lives Separately
- Common patterns, debugging solutions
- UI/UX discoveries
- API integration patterns
- Automation scripts

### 3. Access Pattern

In your CLAUDE.md, just add this section:
```markdown
## Shared Knowledge Access
When you need common Adobe plugin knowledge:
```bash
# Get debugging help
cat ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-detection.md

# Get UI patterns
cat ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/glass-effects.md

# Or use the helper:
python3 ~/AI-SFX-Bolt/MultiPluginSystem/shared_knowledge.py get "timeline detection"
```
```

## Setting Up in Your Other Session

### Step 1: Add to Other Plugin's CLAUDE.md

Add this section to your other plugin's existing CLAUDE.md:

```markdown
## Shared Knowledge System

Access shared discoveries from other Adobe plugins:

### Quick Access
- Debugging: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/`
- UI Patterns: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/`
- Adobe APIs: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/`

### Get Specific Knowledge
```bash
# Example: Get timeline detection breakthroughs
cat ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/timeline-detection.md

# Example: Get glass UI effects
cat ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/glass-effects.md
```

### Contribute New Discoveries
```bash
# When you discover something useful for all plugins:
echo "Your discovery" > ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/category/topic.md
```
```

### Step 2: What to Share vs Keep Private

**Share These** (in shared-knowledge/):
- ExtendScript patterns that work
- Timeline manipulation techniques
- Event system discoveries
- UI/UX patterns (glass effects, themes)
- Debugging breakthroughs
- Chrome DevTools tips
- Performance optimizations

**Keep Plugin-Specific** (in CLAUDE.md):
- Plugin's specific purpose/features
- API keys and endpoints unique to plugin
- Plugin-specific file structure
- Business logic unique to plugin
- Plugin's current development state

## Implementation

### Create Shared Knowledge Structure

```bash
cd /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem

# Create shared knowledge directories
mkdir -p shared-knowledge/{debugging,ui-patterns,adobe-apis,automation,performance}

# Move relevant discoveries from your knowledge-base
cp knowledge-base/debugging/timeline-detection.md shared-knowledge/debugging/
cp knowledge-base/debugging/event-handling.md shared-knowledge/debugging/
cp knowledge-base/ui-ux/glass-effects.md shared-knowledge/ui-patterns/
cp knowledge-base/core/extendscript-communication-working-pattern.md shared-knowledge/adobe-apis/
# etc...
```

### Simple Access Script

```python
#!/usr/bin/env python3
# shared_knowledge.py
import sys
import os
from pathlib import Path

def search_shared_knowledge(query):
    base = Path(__file__).parent / "shared-knowledge"
    results = []
    
    for category in base.iterdir():
        if category.is_dir():
            for file in category.glob("*.md"):
                if query.lower() in file.read_text().lower():
                    results.append(file)
                    
    return results

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        results = search_shared_knowledge(query)
        
        if results:
            print(f"Found {len(results)} matches for '{query}':\n")
            for r in results:
                print(f"📄 {r.relative_to(r.parent.parent)}")
                print(f"   cat {r}")
                print()
        else:
            print(f"No matches found for '{query}'")
    else:
        print("Usage: python3 shared_knowledge.py <search query>")
```

## Moving Forward

### For Your Current Session (AI SFX):

1. Keep your CLAUDE.md as is
2. Extract shareable discoveries to shared-knowledge/

### For Your Other Session:

Tell Claude in the other session:

> "I have a shared knowledge system set up at ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ that contains debugging breakthroughs, UI patterns, and Adobe API discoveries from other plugins. 
> 
> When I need help with common Adobe plugin issues, you can check:
> - Debugging solutions: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/debugging/`
> - UI patterns: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/ui-patterns/`
> - Adobe APIs: `ls ~/AI-SFX-Bolt/MultiPluginSystem/shared-knowledge/adobe-apis/`
>
> Please add a 'Shared Knowledge Access' section to this plugin's CLAUDE.md that references this system."

This way:
- Each plugin's CLAUDE.md remains unique and specific
- Common knowledge is shared but accessed on-demand
- No automatic modifications to existing files
- Simple, explicit sharing model