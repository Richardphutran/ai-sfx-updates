# 🚀 AI SFX Generator (Bolt) - Daily Workflow

## 🎯 Quick Start (Every Development Session)

```bash
# 1. Navigate to Bolt project
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"

# 2. Start development server (Hot Module Reload)
yarn dev
```

**✅ Now you're ready! Changes auto-reload in Premiere Pro.**

## 📁 Key Files to Edit

### 🎨 **UI Development**
- **`src/js/main/main.tsx`** - Main React component (AI SFX Generator interface)
- **`src/js/main/main.scss`** - Styling and theme

### 🔧 **Timeline Functions**  
- **`src/jsx/ppro/ppro.ts`** - ExtendScript functions (timeline manipulation)
- **`src/jsx/ppro/ppro-utils.ts`** - Utility functions

### ⚙️ **Configuration**
- **`cep.config.ts`** - Plugin settings (name, ports, permissions)
- **`src/shared/universals.d.ts`** - TypeScript interfaces

## 🔄 Development Process

1. **Edit Files** → Save → **Auto-reload in Premiere Pro**
2. **Check Console** → Chrome DevTools at `localhost:9230`
3. **Test Features** → Compare with original plugin
4. **Build Production** → `yarn build` when ready

## 🛠️ Useful Commands

```bash
# Development (most common)
yarn dev                 # Start development server

# Building
yarn build              # Build production version
yarn clean && yarn build # Clean build

# Symlink management
yarn symlink            # Create/update symlink

# TypeScript
yarn type-check         # Check types without building
```

## 🐛 Debugging

### Chrome DevTools
- **URL**: `http://localhost:9230`
- **Console**: Shows plugin logs and errors
- **Network**: Monitor API calls to Eleven Labs

### Plugin Console
- Open both plugins side-by-side
- Compare behavior between original and Bolt versions
- Check timeline detection differences

## 📝 File Differentiation Strategy

### ✅ **No Confusion - Clear Separation:**

```
📁 Ai SFX/ (Main workspace)
├── 🎯 AI-SFX-Bolt/        # ACTIVE: Modern Bolt development
│   ├── src/js/main/main.tsx    # Edit this for UI changes
│   ├── src/jsx/ppro/ppro.ts    # Edit this for timeline features
│   └── yarn dev                # Always use this for development
│
├── 📦 CEP-Plugin/         # BACKUP: Original stable version
│   └── (Don't edit - keep as reference)
│
└── 📚 Documentation files
```

### 🎯 **Development Focus:**
- **Work ONLY in AI-SFX-Bolt/** folder
- **Use `yarn dev`** for all development
- **Original CEP-Plugin/** stays untouched as backup

## 🔥 Pro Tips

### Instant Feedback Loop
1. **Save file** → Plugin reloads in ~1 second
2. **No build step** needed during development
3. **TypeScript errors** show in terminal immediately

### Feature Development
1. **Start with UI** in `main.tsx`
2. **Add timeline functions** in `ppro.ts`  
3. **Test immediately** in Premiere Pro
4. **Compare with original** plugin for accuracy

### Best Practices
- **One terminal** running `yarn dev` always
- **Edit files** in your favorite editor
- **Test frequently** in Premiere Pro
- **Use Chrome DevTools** for debugging

## 🎉 Benefits Over Original

✅ **Instant reloading** - No more restart Premiere Pro  
✅ **TypeScript safety** - Catch errors before runtime  
✅ **Modern React** - Component-based architecture  
✅ **Professional build** - Optimized production builds  
✅ **Better debugging** - Chrome DevTools integration