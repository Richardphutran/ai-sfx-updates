# AI SFX Generator | PORT: 3030
**USE smart_helper_v2.py FIRST** → Full context, auto-fixes, complete workflow

## Core
AI sound effects generation with ElevenLabs | com.ai.sfx.generator

## Stack
React + TypeScript + Vite | CEP Panel → ExtendScript → Premiere API

## Key Files
- `src/main/main.tsx` → Minimal UI (NEVER add buttons)
- `src/jsx/ppro/ppro.ts` → Timeline integration
- `cep.config.ts` → Port 3030

## Commands
```bash
yarn build && yarn dev  # Build + serve
yarn package           # Production .zxp
```

## Rules
- PRESERVE minimal UI design
- Smart timeline placement
- Collision detection for audio
- Test in Premiere immediately

## Debug
Console → http://localhost:3030
CEP HTML Test Tool → Reload panel