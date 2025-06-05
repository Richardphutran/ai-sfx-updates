# 🧠 Multi-Plugin Knowledge System

## Quick Start

### For New Plugin Sessions

1. Copy the contents of `PASTE_THIS_IN_OTHER_SESSION.md`
2. Paste into your new Claude session
3. Access shared knowledge instantly!

### Available Knowledge

Browse what's available:
```bash
ls shared-knowledge/
```

Categories:
- **debugging/** - Timeline detection, CEP setup, common fixes
- **adobe-apis/** - ExtendScript, QE API, timeline manipulation
- **ui-patterns/** - Glass effects, professional designs
- **automation/** - Token-saving scripts
- **api-integration/** - Eleven Labs, file handling
- **performance/** - Optimization patterns

### Contributing Knowledge

When you discover something useful:
```bash
echo "Your discovery" > shared-knowledge/category/topic-name.md
```

Keep files under 100 lines!

### Tools

- `knowledge_engine.py` - Search and retrieve knowledge
- `knowledge_maintainer.py` - Check file sizes, organize
- `sync_knowledge.py` - Sync discoveries between plugins

### Quick Reference

See `shared-knowledge/INDEX.md` for the most important discoveries.