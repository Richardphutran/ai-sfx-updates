# Localhost Port Mapping - Know Your Debug URLs

**Status:** ✅ ACTIVE REFERENCE
**Tokens:** ~60

## 🌐 Chrome DevTools Debug URLs

### AI SFX Plugin (Bolt CEP)
- **URL:** http://localhost:9230
- **Project:** AI SFX Generator (Bolt)
- **Framework:** Bolt CEP with React
- **Location:** `/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt`

### Other Common Ports (Add as needed)
- **Port 7002** - Traditional CEP plugins
- **Port 8080** - Vite dev server
- **Port 3000** - React dev server
- **Port 5173** - Vite default port

## 🔍 Quick Port Discovery
```bash
# Use the automated port checker (recommended)
python3 /Users/richardtran/Desktop/check_debug_ports.py

# Manual checks
lsof -i :9230  # Check specific port
lsof -i tcp | grep LISTEN | grep localhost  # All localhost servers

# Check Chrome DevTools targets
curl -s http://localhost:9230/json | jq '.[].title'  # If jq available
curl -s http://localhost:9230/json  # Raw JSON
```

## 📋 Port Assignment Rules
- **9230** - AI SFX Bolt plugin (current project)
- **92XX** - Reserved for other Bolt plugins
- **70XX** - Traditional CEP plugins
- **80XX** - Web dev servers

## When to Use Which URL
- **Plugin debugging:** http://localhost:9230
- **Console access:** Use Python scripts for automation
- **Network inspection:** Chrome DevTools for API calls