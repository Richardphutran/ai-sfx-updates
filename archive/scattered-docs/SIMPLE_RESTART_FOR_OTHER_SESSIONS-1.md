# Simple Plugin Restart Methods for Other Claude Sessions

## ✅ WORKING METHODS (Safe & Tested)

### 1. **Multi-Plugin Hard Restart** (WORKING but kills Premiere)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard
```
**Result:** Kills Premiere, restarts it, plugin comes back online in ~30 seconds

### 2. **Test Plugin Connection** (SAFE - No restart)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
python3 test_plugin_connection.py
```
**Result:** Just checks if plugin is alive, shows DevTools info

### 3. **Hot Reloading** (RECOMMENDED - Use this instead!)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
npm run watch
```
**Result:** Automatically reloads plugin on code changes. NEVER restart Premiere with Bolt!

## 🚫 AVOID THESE

- **Soft restart via DevTools** - Endpoints not working properly
- **Multiple restart attempts** - Can crash Premiere
- **Manual Premiere restart** - Hot reloading is faster

## 📋 FOR OTHER CLAUDE SESSIONS

### Quick Status Check
```bash
curl -s http://localhost:9230 >/dev/null && echo "✅ AI SFX Plugin is alive" || echo "❌ Plugin not responding"
```

### Register Your Plugin in Multi-System
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"

# Register your plugin (change ports for your plugin)
python3 multi_plugin_autonomous.py register your-plugin-name 9231 3002 "Your Plugin Name"

# Check all registered plugins
python3 multi_plugin_autonomous.py status

# Test your plugin
python3 multi_plugin_autonomous.py test your-plugin-name
```

### Emergency Plugin Recovery
If plugin becomes unresponsive:
```bash
# Step 1: Check if still alive
curl -s http://localhost:9230 && echo "Still alive" || echo "Dead"

# Step 2: If dead, use hard restart (kills Premiere)
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/MultiPluginSystem"
python3 multi_plugin_autonomous.py restart ai-sfx-generator --hard

# Step 3: Wait for it to come back
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
python3 test_plugin_connection.py
```

## 🎯 BEST PRACTICE FOR DEVELOPMENT

1. **Use `npm run watch`** for development (hot reloading)
2. **Avoid restarting Premiere** during development  
3. **Use hard restart only** when plugin completely crashes
4. **Test connection first** before attempting restart
5. **Register your plugin** in the multi-plugin system for monitoring

## 📊 Plugin Ports Map
- **AI SFX Generator:** 9230 (debug), 3001 (dev)
- **Other plugins:** 9231+, 3002+ (register in system)

## ⚠️ LESSONS LEARNED
- Soft restart via DevTools API not reliable on CEP plugins
- Hard restart works but kills entire Premiere session
- Hot reloading (`npm run watch`) is the best development method
- Always test connection before attempting restart operations