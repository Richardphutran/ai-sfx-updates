# AI SFX Generator (Bolt) - Development Guide

## 🚀 Quick Start

### Development Mode (Live Reloading)
```bash
cd "/Users/richardtran/Documents/Code/Personal Projects/Premiere Plugins/Ai SFX/AI-SFX-Bolt"
yarn dev
```
- Opens development server on `localhost:3001`
- Hot Module Replacement (HMR) for instant updates
- Plugin reloads automatically when you save changes

### Production Build
```bash
yarn build
```
- Builds optimized production version
- Updates symlink automatically
- Ready for distribution

## 📁 Key Development Files

### Primary Development
- `src/js/main/main.tsx` - Main React component (AI SFX Generator UI)
- `src/js/main/main.scss` - Main styling
- `src/jsx/ppro/ppro.ts` - ExtendScript functions (timeline manipulation)

### Configuration
- `cep.config.ts` - Plugin configuration (name, ID, ports)
- `package.json` - Dependencies and scripts
- `src/shared/universals.d.ts` - TypeScript interfaces

### Build Output
- `dist/cep/` - Built plugin (symlinked to Premiere Pro)
- `dist/cep/.debug` - Debug configuration

## 🔧 Development Commands

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Create/update symlink
yarn symlink

# Type checking
yarn type-check

# Clean build
yarn clean
```

## 🎯 Development Tips

### Making Changes
1. **Edit files** in `src/` directory
2. **Save** - changes reload automatically in Premiere Pro
3. **Check console** in Chrome DevTools at `localhost:9230`

### Debugging
- **Chrome DevTools**: Access via debug port 9230
- **Console logs**: Show in both Chrome DevTools and plugin console
- **Network tab**: Monitor API calls to Eleven Labs

### Plugin Testing
- **Two versions available**: Original vs Bolt
- **Compare side-by-side** to ensure feature parity
- **Test all modes**: Auto, Manual, In-N-Out point detection

### TypeScript Benefits
- **Type safety** for ExtendScript communication
- **IntelliSense** for better development experience
- **Compile-time error checking**

## 🏗️ Architecture

### Modern Stack
- **Vite** - Fast build tool with HMR
- **React** - Component-based UI
- **TypeScript** - Type safety
- **SCSS** - Advanced styling

### ExtendScript Integration
- **Type-safe** communication via `evalTS()`
- **Async/await** patterns for timeline operations
- **Error handling** with proper TypeScript types

## 🔄 Workflow

1. **Development**: Use `yarn dev` for live reloading
2. **Testing**: Test in Premiere Pro with live changes
3. **Production**: Use `yarn build` for final version
4. **Distribution**: Built files in `dist/cep/` ready for sharing

## 📝 Notes

- **Original plugin** (`CEP-Plugin`) remains as stable backup
- **Bolt version** (`AI-SFX-Bolt`) is for active development
- **Both plugins** can run simultaneously for comparison
- **All changes** are tracked in the main project git repository