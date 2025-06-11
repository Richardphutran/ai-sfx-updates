# Terminal Commands for AI SFX Plugin

## 🚀 COPY AND PASTE THESE COMMANDS:

### 1. Navigate to Plugin Directory
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
```

### 2. Start Development Server (KEEP THIS TERMINAL OPEN!)
```bash
npm run dev
```

### 3. Alternative if npm fails:
```bash
yarn dev
```

### 4. If you need to install dependencies first:
```bash
npm install
```

## 📝 What You'll See:
- Port number (usually 3030 or 3031)
- "CEP Panels Served at: http://localhost:PORT/main/"
- Live compilation messages
- Hot reload notifications

## 🔗 Plugin URLs (after terminal shows ready):
- **Main Plugin**: http://localhost:3030/main/ (or 3031)
- **Debug**: chrome://inspect → Configure → localhost:9230

## ⚡ Quick Fix Command (if server won't start):
```bash
python3 smart_helper.py
```

## 🛑 To Stop Server:
Press `Ctrl + C` in the terminal

## 🔧 FIX CONNECTION REFUSED ISSUE:
The symlink is pointing to wrong directory. Run this in Terminal:

```bash
sudo rm "/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator"
sudo ln -s "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt/dist/cep" "/Library/Application Support/Adobe/CEP/extensions/AI-SFX-Generator"
```

Then restart Premiere Pro and try: **http://localhost:3030/main/**