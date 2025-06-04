# Enhanced SFX Search Implementation

## Overview
The plugin now searches for sound effects in multiple locations and supports various audio formats.

## Search Locations

### File System Search
- **Project directory** and all subdirectories (up to 3 levels deep)
- **Parent directory** of project (up to 2 levels deep)
- **Desktop** folders (up to 2 levels deep)
- **Documents** folders (up to 2 levels deep)

### Folder Name Matching
Searches for any folder containing:
- 'sfx' (case insensitive)
- 'ai sfx'
- 'sound'
- 'ai'
- 'audio'

### Premiere Pro Bins
Searches bins with names containing:
- 'sfx'
- 'sound'
- 'audio'
- 'ai sfx'
- 'ai_sfx'
- 'aisfx'

## Supported Audio Formats
- MP3
- WAV
- AAC
- M4A
- FLAC
- OGG
- AIFF/AIF

## Implementation Details

### TypeScript (main.tsx)
```typescript
// Enhanced folder search function
const findSFXFolders = (basePath: string, maxDepth: number = 2, currentDepth: number = 0): string[] => {
  // Recursively searches for folders containing SFX-related keywords
}

// Support for multiple audio formats
const isAudioFile = lowerItem.endsWith('.mp3') || 
                  lowerItem.endsWith('.wav') || 
                  lowerItem.endsWith('.aac') || 
                  lowerItem.endsWith('.m4a') || 
                  lowerItem.endsWith('.flac') || 
                  lowerItem.endsWith('.ogg') ||
                  lowerItem.endsWith('.aiff') ||
                  lowerItem.endsWith('.aif');
```

### ExtendScript (ppro.ts)
```typescript
// Enhanced bin matching
const matchesBin = binName.includes('sfx') || 
                 binName.includes('sound') ||
                 binName.includes('audio') ||
                 binName.includes('ai sfx') || 
                 binName.includes('ai_sfx') ||
                 binName.includes('aisfx');
```

## Benefits
- Accommodates different user workflows
- Finds SFX regardless of organization method
- Supports professional audio formats
- Searches both file system and Premiere bins
