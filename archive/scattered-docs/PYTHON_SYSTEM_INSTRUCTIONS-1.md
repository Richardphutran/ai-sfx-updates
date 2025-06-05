# Python System Instructions for Adobe Plugin Development

## Quick Start for Other Claude Sessions

### 1. Hot Reload System (Never Restart Premiere!)
```bash
# Start development with automatic reloading
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai\ SFX/AI-SFX-Bolt/pure_python_plugin_restart.py

# Or use the desktop shortcut
/Users/richardtran/Desktop/start_bolt_dev.sh
```

### 2. Debug Port Discovery
```bash
# Find which plugin is on which port
python3 /Users/richardtran/Desktop/check_debug_ports.py

# Common ports:
# - AI SFX Plugin: http://localhost:9230
# - Text-Based Editing: http://localhost:9231
# - Other plugins: Check with the script
```

### 3. Knowledge System Access

#### Quick Knowledge Retrieval
```bash
# Get debugging help
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "debug timeline issue"

# Get UI patterns
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "glass effects UI"

# Get API help
python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py get "ai-sfx" "Eleven Labs API"
```

#### Add New Discoveries
```bash
# When you discover something new
echo "Your discovery" | python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py add "ai-sfx" "category" "topic"
```

### 4. Multi-Plugin Development System
```bash
# For managing multiple Adobe plugins simultaneously
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai\ SFX/AI-SFX-Bolt/multi_plugin_autonomous.py

# Configuration file
AI-SFX-Bolt/multi_plugin_config.json
```

### 5. Automated Testing & Development
```bash
# Test plugin connection
python3 test_plugin_connection.py

# Safe plugin restart (if needed)
python3 safe_plugin_restart.py
```

## Key Python Scripts

1. **pure_python_plugin_restart.py** - Main hot reload system
   - Watches for file changes
   - Automatically refreshes plugin in Premiere
   - No Premiere restart needed!

2. **check_debug_ports.py** - Port discovery
   - Finds all active CEP debug ports
   - Maps ports to plugin names
   - Shows clickable URLs

3. **knowledge_engine.py** - Knowledge management
   - Access shared solutions
   - Add new discoveries
   - Search across all plugins

4. **multi_plugin_autonomous.py** - Multi-plugin manager
   - Manage multiple plugins
   - Share knowledge between projects
   - Automated workflows

## Important Notes

- **NEVER restart Premiere** - Use the Python hot reload system
- **Always check ports** - Each plugin has its own debug port
- **Use knowledge system** - Don't rediscover solved problems
- **Share discoveries** - Add new findings to help future sessions

## Example Workflow

```bash
# 1. Start development
python3 /Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai\ SFX/AI-SFX-Bolt/pure_python_plugin_restart.py

# 2. Find debug port
python3 /Users/richardtran/Desktop/check_debug_ports.py

# 3. Open Chrome DevTools at the URL shown (e.g., http://localhost:9230)

# 4. Make changes - they auto-reload!

# 5. If you discover something useful
echo "Timeline detection works with onProjectChanged event" | python3 AI-SFX-Bolt/MultiPluginSystem/knowledge_engine.py add "ai-sfx" "debugging" "timeline-events"
```

## Troubleshooting

If hot reload stops working:
1. Check if `npm run watch` is still running
2. Restart the Python script
3. Check Chrome DevTools console for errors

If you can't find the debug port:
1. Run the port discovery script
2. Check `.debug` file in plugin folder
3. Ensure CEP debugging is enabled