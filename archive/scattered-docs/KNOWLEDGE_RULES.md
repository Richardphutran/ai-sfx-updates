# 📏 Knowledge Management Rules & Guidelines

## File Size Limits

### Maximum File Sizes
- **Individual knowledge files**: 100 lines max (~500 tokens)
- **CLAUDE.md files**: 300 lines max (~1,500 tokens)
- **Category index files**: 50 lines max (~250 tokens)

### When to Split Files

**Split when:**
- File exceeds 100 lines
- Multiple distinct solutions in one file
- Different versions/approaches to same problem

**Example Split:**
```
❌ timeline-detection.md (200 lines, multiple methods)

✅ Split into:
- timeline-detection-basics.md (50 lines)
- timeline-detection-event-method.md (50 lines)
- timeline-detection-direct-api.md (50 lines)
- timeline-detection-index.md (20 lines, links to all)
```

## File Naming Conventions

### Format: `category/specific-topic-aspect.md`

**Good Names:**
- `debugging/timeline-in-out-detection.md`
- `ui-patterns/glass-button-hover.md`
- `adobe-apis/extendscript-json-parsing.md`

**Bad Names:**
- `debugging/fix1.md` ❌ (not descriptive)
- `debugging/timeline.md` ❌ (too broad)
- `debugging/my-timeline-fix-that-worked-june-2025.md` ❌ (too long)

## Content Structure Rules

### Required Sections (Keep It Brief!)

```markdown
# [Specific Topic Name]

**Status:** [✅ WORKING | ⚠️ PARTIAL | ❌ DEPRECATED]
**Tokens:** ~[estimated count]
**Related:** [link-to-related.md]

## Problem (1-2 lines)
[What specific issue this solves]

## Solution (< 50 lines)
[Code or steps - be concise!]

## When to Use (1-2 lines)
[Specific scenario]
```

### Token-Saving Tips

**DO:**
- Use code comments instead of paragraphs
- Link to related files instead of repeating
- One solution per file
- Skip obvious explanations

**DON'T:**
- Include long backstories
- Repeat information available elsewhere
- Add unnecessary formatting
- Include multiple solutions in one file

## Category Limits

### Maximum Files Per Category
- **debugging/**: 20 files max → create subcategories
- **ui-patterns/**: 15 files max
- **adobe-apis/**: 15 files max
- **automation/**: 10 files max
- **performance/**: 10 files max

### When to Create Subcategories

```
debugging/ (20 files) →
debugging/
├── timeline/
│   ├── detection.md
│   ├── manipulation.md
│   └── events.md
├── extendscript/
│   ├── communication.md
│   └── errors.md
└── devtools/
    ├── setup.md
    └── connection.md
```

## Index Files

### Create Index When > 5 Related Files

`debugging/timeline/INDEX.md`:
```markdown
# Timeline Debugging Index

## Detection Issues
- [In/Out Points](./in-out-detection.md) ~100 tokens
- [Event Handling](./event-handling.md) ~80 tokens

## Manipulation
- [Clip Placement](./clip-placement.md) ~120 tokens
- [Track Access](./track-access.md) ~90 tokens

**Total Category:** ~390 tokens
```

## Automatic Cleanup Rules

### Archive Old Knowledge
- Not accessed in 6 months → move to `archive/`
- Deprecated by new method → move to `deprecated/`
- Proven wrong → delete (keep note in index)

### Consolidation Rules
- Similar files < 30 lines each → combine
- Multiple fixes for same issue → create "best-practices" file
- Repeated patterns → extract to "common-patterns"

## Contributing Guidelines

### Before Adding New Knowledge

1. **Check if exists**: `grep -r "your topic" shared-knowledge/`
2. **Check file size**: `wc -l existing-file.md`
3. **Estimate tokens**: ~5 tokens per line
4. **Split if needed**: Create specific aspect files

### Template for New Knowledge

```bash
# Quick add (auto-formats):
cat > shared-knowledge/category/new-topic.md << 'EOF'
# New Topic Name

**Status:** ✅ WORKING
**Tokens:** ~50
**Related:** none

## Problem
[1 line description]

## Solution
```javascript
// Your code here
```

## When to Use
[1 line scenario]
EOF
```

## Token Budget Guide

### Per-Session Token Budget
- **CLAUDE.md**: 1,500 tokens max
- **Per task knowledge load**: 500 tokens max
- **Total context**: Aim for < 3,000 tokens

### How to Check Token Usage

```bash
# Rough token estimate for a file
echo "File: $filename"
echo "Lines: $(wc -l < $filename)"
echo "Tokens: ~$(( $(wc -l < $filename) * 5 ))"

# Check category total
for f in shared-knowledge/debugging/*.md; do
  wc -l "$f"
done | tail -1
```

## Maintenance Schedule

### Weekly
- Check for files > 100 lines
- Consolidate similar small files
- Update index files

### Monthly
- Archive unused knowledge
- Create subcategories if needed
- Update token counts

### Per Discovery
- Immediately split if > 100 lines
- Update related files list
- Check category isn't getting too large

## Example: Good vs Bad

### ❌ Bad: Large Monolithic File
`debugging/everything-timeline.md` (500 lines, 2500 tokens)

### ✅ Good: Organized Specific Files
```
debugging/timeline/
├── INDEX.md (50 tokens - quick overview)
├── detection-basics.md (200 tokens)
├── event-method.md (150 tokens)
├── direct-api-method.md (150 tokens)
└── common-errors.md (100 tokens)
Total: 650 tokens (load only what's needed)
```

## Enforcement

Add to your CLAUDE.md:
```markdown
## Knowledge Contribution Rules
- Max 100 lines per file
- One topic per file
- Check existing files first
- Split large discoveries
- See: ~/MultiPluginSystem/KNOWLEDGE_RULES.md
```