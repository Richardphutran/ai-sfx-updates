# 🚨 CRITICAL: READ THIS FIRST - Other Claude Sessions

## Bolt CEP Development - NO PREMIERE RESTARTS!

If you're working on Adobe plugins and considering restarting Premiere Pro:

**❌ DON'T DO IT!** 

### Why?
- Breaks WebSocket connections between Claude sessions
- Bolt framework has hot reloading - restarts are unnecessary
- Disrupts development workflow

### Instead Use:
```bash
# Start hot reloading (do this once)
/Users/richardtran/Desktop/start_bolt_dev.sh

# Debug at:
# http://localhost:9230
```

### Full Knowledge System Available:
```bash
# Access all shared plugin development knowledge:
cat ~/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem/PASTE_THIS_IN_OTHER_SESSION.md
```

---
**Created:** June 2, 2025  
**Purpose:** Prevent disruption of WebSocket connections during plugin development