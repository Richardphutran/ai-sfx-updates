# AI SFX Generator - Product Requirements Document

## Product Overview

The AI SFX Generator is a Premiere Pro CEP plugin that enables editors to instantly generate and place AI-created sound effects directly onto their timeline. The plugin combines AI audio generation with intelligent file organization and smart timeline placement, creating a seamless workflow for adding sound effects during the editing process.

## Core Purpose

To eliminate the traditional workflow of:
1. Searching for sound effects in external libraries
2. Downloading and organizing files
3. Importing into Premiere
4. Manually placing on timeline

Instead, users simply:
1. Type what they want
2. Press Generate
3. SFX appears perfectly placed on their timeline

### Continuous Workflow
The plugin supports uninterrupted creative flow - users can type their next SFX prompt and reposition the playhead while the current SFX is still generating. This eliminates dead time and keeps editors in their creative zone.

## Key Features

### 1. AI Sound Generation
- **Input**: Text prompt describing desired sound effect
- **Process**: Eleven Labs API generates audio based on prompt
- **Output**: High-quality MP3 audio file (up to 22 seconds)
- **Prompt Influence**: Adjustable slider (0.0-1.0) to control AI interpretation
- **Continuous Input**: Text field remains active during generation for uninterrupted workflow

### 2. Smart File Organization

#### File System Structure
```
[Premiere Project Directory]/
├── [Project File].prproj
├── AI SFX/                    <-- Auto-created folder
│   ├── explosion_20250605_123456.mp3
│   ├── whoosh_20250605_123501.mp3
│   └── [timestamp-based filenames]
└── [Other project assets]/
```

#### Premiere Bin Structure
```
Project Panel (root)
├── AI SFX                     <-- Auto-created bin
│   ├── explosion_20250605_123456.mp3
│   ├── whoosh_20250605_123501.mp3
│   └── [All generated sounds organized here]
├── SFX                        <-- User's existing SFX (if any)
└── [Other user bins/assets]
```

### 3. Spacebar Search Feature

#### Search Scope
The spacebar triggers a search for existing SFX files in:

1. **Project Bins**: Any bin named "SFX" or containing "SFX" in the name
   - Searches recursively through all child bins
   - Case-insensitive matching

2. **File System**: Project directory's "SFX" folder and subdirectories
   - Includes the "AI SFX" folder for previously generated sounds
   - Supports common audio formats: .mp3, .wav, .aiff, .m4a

#### Search Results Display
- Floating search window appears on spacebar press
- Real-time filtering as user types
- Shows both project bin items and file system results
- Numbered results (1-9) for quick selection
- File names include location indicator (bin vs. disk)

### 4. Timeline Placement Logic

#### Placement Modes

**1. Auto Mode (Default)**
- Places SFX at current playhead position
- Captures playhead position at moment of generation/selection
- Ensures precise placement where editor is working

**2. In/Out Point Mode**
- Activated when user sets in/out points on timeline
- Places SFX at the in-point position
- Duration adjusted to match in/out range (max 22 seconds)
- Visual indicator shows when in/out points are active

#### Smart Track Placement Algorithm

**CRITICAL: NEVER OVERRIDE EXISTING AUDIO**

```
1. Start with user's preferred track (default: Audio 1)
2. Check for conflicts at EXACT target time position
3. If ANY conflict exists on a track:
   - IMMEDIATELY skip to next audio track
   - NEVER place over existing audio
4. If ALL existing tracks have conflicts:
   - ALWAYS create new audio track at bottom
   - Place SFX on new empty track
5. Move playhead to placed clip for visual confirmation
```

#### Collision Detection Rules
- **MANDATORY**: Check if existing audio clips overlap target position
- **BUFFER**: Include 0.1 second buffer to prevent edge conflicts  
- **ZERO TOLERANCE**: ANY overlap = skip track completely
- **GUARANTEE**: Ensures 100% clean, non-overlapping placement
- **FALLBACK**: If all tracks busy, CREATE NEW TRACK automatically

#### File Organization Rules
- **DESTINATION**: ALL generated SFX files MUST go to "AI SFX" bin
- **NEVER**: Save to currently active bin or any other location
- **AUTO-CREATE**: If "AI SFX" bin doesn't exist, create it automatically
- **ORGANIZE**: Move imported files from default location to "AI SFX" bin
- **VERIFY**: Confirm file is in correct bin after placement

## Workflow Scenarios

### Scenario 1: Generate New SFX
1. Editor working on explosion scene
2. Types "big explosion with debris"
3. Adjusts duration slider to 3 seconds
4. Clicks Generate
5. SFX created, saved to "AI SFX" folder, imported to "AI SFX" bin, placed at playhead

### Scenario 2: Reuse Existing SFX
1. Editor needs another explosion later in timeline
2. Presses spacebar
3. Types "explo" - sees previous explosions
4. Presses "1" to select first result
5. SFX placed at current playhead position

### Scenario 3: Precise Timing with In/Out Points
1. Editor marks specific 2-second gap in timeline
2. Sets in-point at gap start, out-point at gap end
3. Generates "whoosh transition"
4. SFX created at exact 2-second length, placed at in-point

### Scenario 4: Continuous Workflow (Rapid Fire)
1. Editor types "explosion" → hits Enter
2. While explosion generates, immediately types "glass shatter"
3. Moves playhead to next scene needing SFX
4. First SFX completes and places at original position
5. Hits Enter again to generate glass shatter at new playhead position
6. No waiting, no downtime - continuous creative flow

## File Management Logic

### Generated Files
- **Naming**: `[description]_[YYYYMMDD]_[HHMMSS].mp3`
- **Location**: `[Project Directory]/AI SFX/`
- **Organization**: All generated files auto-organized into "AI SFX" bin
- **Persistence**: Files remain with project for future use

### File Lookup Hierarchy
1. Check project bins first (already imported)
2. Then check file system (needs import)
3. Prefer project bin items to avoid duplicates
4. Import file system items only when selected

### Import Prevention
- Never import files already in project
- Check by filename match before importing
- Prevents duplicate media in project bin

## Technical Implementation Details

### ExtendScript Integration
- **Import**: `app.project.importFiles([path])`
- **Bin Creation**: `rootItem.createBin("AI SFX")`
- **Organization**: `projectItem.moveBin(targetBin)`
- **Placement**: `audioTrack.insertClip(projectItem, timeInSeconds)`

### Timeline Interaction
- **Playhead Capture**: Stored at generation/selection time
- **Track Access**: `sequence.audioTracks[index]`
- **Collision Check**: Iterate through `track.clips` array
- **Track Creation**: QE API `addTracks()` method

### Performance Optimizations
- Lazy loading of file system search
- Capped search results at 20 items
- Debounced search input (200ms)
- Cached project bin structure

## User Interface Principles

### Minimal Design Philosophy
- Single-purpose interface
- No unnecessary buttons or options
- Clean, uncluttered layout
- Every pixel has purpose

### Visual Feedback
- Status messages for each operation
- Progress indication during generation (orange border)
- Error messages with actionable solutions
- Subtle animations for state changes
- Input remains active during generation for continuous workflow

## Error Handling

### Project Not Saved
- Detect missing project path
- Show clear message: "Please save your project first (Cmd+S)"
- Prevent generation until resolved

### No Active Sequence
- Check for timeline before operations
- Guide user: "Please open a sequence first"

### API Key Missing
- Prompt for Eleven Labs API key
- Secure storage in extension preferences
- One-time setup process

## Success Metrics

1. **Time Saved**: From idea to timeline < 10 seconds
2. **Organization**: 100% of generated files in correct bin
3. **Reliability**: Successful placement on first attempt > 95%
4. **Discoverability**: Users finding spacebar search within first session

## Future Considerations

- Preset prompt templates
- Batch generation capabilities
- Integration with other AI providers
- Waveform preview before generation
- Undo/redo support for placements