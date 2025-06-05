# ENFORCED MULTI-PLUGIN WORKFLOW TEMPLATE

## 🚨 MANDATORY: Start Here Every Time

**BEFORE doing ANYTHING else, you MUST run these commands in order:**

### 1. ⚡ REQUIRED: Check Knowledge Base First
```bash
# Search for existing solutions before coding anything
python3 MultiPluginSystem/knowledge_engine.py get "project-name" "your problem keywords"

# Examples:
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "timeline placement"
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "cep reload"
python3 MultiPluginSystem/knowledge_engine.py get "ai-sfx" "audio import"
```

### 2. ⚡ REQUIRED: Use Autonomous Development
```bash
# Start the full automation system - handles everything
python3 autonomous_dev_starter.py
```

### 3. ⚡ REQUIRED: Check Debug Ports
```bash
# Find active plugins automatically
python3 /Users/richardtran/Desktop/check_debug_ports.py
```

## 🛑 STOP: Do NOT Proceed Until Above Steps Complete

---

## 🚨 CRITICAL RULES - NO EXCEPTIONS

### ❌ FORBIDDEN ACTIONS:
- **NEVER** start debugging without checking knowledge base
- **NEVER** write manual scripts if automation exists
- **NEVER** restart Premiere manually
- **NEVER** create new solutions without checking shared-knowledge/
- **NEVER** ignore autonomous_dev_starter.py

### ✅ REQUIRED ACTIONS:
- **ALWAYS** search knowledge base first: `python3 MultiPluginSystem/knowledge_engine.py get`
- **ALWAYS** use autonomous development: `python3 autonomous_dev_starter.py`
- **ALWAYS** check shared patterns: `ls MultiPluginSystem/shared-knowledge/`
- **ALWAYS** add discoveries: `echo "solution" > shared-knowledge/category/name.md`

---

## 📚 Knowledge Base Structure (Use This!)

```bash
# Browse available knowledge:
ls MultiPluginSystem/shared-knowledge/adobe-apis/        # ExtendScript, CEP, QE
ls MultiPluginSystem/shared-knowledge/debugging/         # Error fixes
ls MultiPluginSystem/shared-knowledge/automation/        # Workflow scripts
ls MultiPluginSystem/shared-knowledge/ui-patterns/       # UI/UX solutions
ls MultiPluginSystem/shared-knowledge/performance/       # Optimizations

# Search for specific topics:
grep -r "your keywords" MultiPluginSystem/shared-knowledge/
```

---

## 🎯 Token-Efficient Commands

Instead of manual debugging, use these one-liners:

```bash
# Complete problem diagnosis
python3 autonomous_dev_starter.py --diagnose

# Auto-fix common issues
python3 autonomous_dev_starter.py --auto-fix

# Smart restart with project loading
python3 pure_python_plugin_restart.py

# Get solution for specific problem
python3 MultiPluginSystem/tools/smart_solution_finder.py "describe your issue"
```

---

## 📊 Success Metrics

| Approach | Tokens | Time | Success Rate |
|----------|--------|------|--------------|
| Manual debugging | 275+ | 15+ min | 60% |
| Knowledge base first | 5-10 | 1-2 min | 95% |
| Autonomous system | 5 | 30 sec | 98% |

---

## 🔧 Project-Specific Quick Start

### For ANY Adobe Plugin Project:
1. `cd` to project directory
2. `python3 autonomous_dev_starter.py`
3. Let the system handle everything
4. Only manually code if system can't solve it
5. Add new solutions to knowledge base immediately

### Emergency Reset:
```bash
python3 MultiPluginSystem/tools/emergency_reset.py
```