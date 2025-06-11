# AI SFX Generator - UI/UX Design Document

## 🎯 UI Overview
Clean, minimal interface for AI-powered SFX generation with text prompts and intelligent defaults.

## 📐 Panel Layout (Current Implementation)

```
┌─────────────────────────────────────────────┐
│  AI SFX Generator (Bolt)              ☰ ≫  │
├─────────────────────────────────────────────┤
│                                             │
│  [Describe your SFX                 ] [⚙️] │
│                                             │
│  In: --:--:--  Out: --:--:--              │
│  Duration: --:--:--                        │
│  Length: [     10s    ] [Auto]            │
│                                             │
│  Prompt Influence: ━━━━━━━●━━━━━━━  0.5   │
│                                             │
└─────────────────────────────────────────────┘
```

## 🎨 Design Elements

### Text Input Field
- **Primary focus**: Natural language SFX description
- **Placeholder**: "Describe your SFX"
- **Examples**: "door slam", "whoosh transition", "impact sound"
- **Enter key**: Trigger generation

### Settings Button (⚙️)
- Access to API configuration
- Advanced generation settings
- Audio preferences

### Timeline Integration
- **In/Out Points**: Auto-detected from timeline selection
- **Duration**: Calculated from in/out points
- **Length**: Manual override (default 10s) or Auto mode

### Prompt Influence Slider
- **Range**: 0.0 to 1.0
- **Default**: 0.5 (balanced)
- **Low (0.0)**: More generic sounds
- **High (1.0)**: Highly specific to prompt

## 🔄 User Flow

### Primary Workflow (Text Prompt)
1. User sets in/out points in timeline (or uses playhead)
2. Types SFX description (e.g., "cinematic whoosh")
3. Hits Enter or Generate button
4. AI generates SFX based on prompt
5. Places on timeline at specified location
6. Shows completion status

### Spacebar Workflow (Enhanced)
1. User positions playhead in timeline
2. Presses spacebar (with panel focus)
3. Quick prompt field appears or uses last prompt
4. Generates and places SFX instantly

## 🎯 UX Principles

### Minimal Friction
- Single key press = complete action
- No dialogs or confirmations
- Smart defaults for everything

### Visual Feedback
- Clear status at all times
- Animated spacebar on press
- Progress during generation
- Success/error notifications

### Professional Feel
- Dark theme matching Premiere
- Subtle gradients and shadows
- Smooth animations (not bouncy)
- Clear typography

## 📱 Responsive States

### Expanded View (With Active Generation)
```
┌─────────────────────────────────────────────┐
│  AI SFX Generator (Bolt)              ☰ ≫  │
├─────────────────────────────────────────────┤
│                                             │
│  [door slam                         ] [⚙️] │
│                                             │
│  In: 00:01:23  Out: 00:01:25              │
│  Duration: 00:00:02  Target: [A5*▼]       │
│  Length: [      2s     ] [Auto]            │
│                                             │
│  Prompt Influence: ━━━━━━━●━━━━━━━  0.5   │
│                                             │
│  Status: Generating SFX...                 │
│  [████████░░░░░░░░░░] 45%                 │
└─────────────────────────────────────────────┘
```

### Settings Panel (⚙️ clicked)
```
┌─────────────────────────────────────────────┐
│  AI SFX Settings                      [X]   │
├─────────────────────────────────────────────┤
│                                             │
│  ElevenLabs API Key:                       │
│  [•••••••••••••••••••••] [Test]           │
│                                             │
│  Default Track: [A3 - SFX ▼]              │
│  Default Length: [10s]                     │
│  Auto-place on timeline: [✓]               │
│                                             │
│  Usage: 47/1000 generations               │
│                                             │
│  [Save Settings]                           │
└─────────────────────────────────────────────┘
```

## 🎯 Current Features

### Core Functionality
- Natural language SFX generation
- Timeline-aware placement
- In/Out point detection
- Prompt influence control
- Auto length detection

### Planned Enhancements
- Spacebar quick-generation
- Preset prompt library
- Batch generation for cuts
- Context-aware suggestions
- Generation history panel

## 🎯 Key Interactions

### Text Input Behavior
- Auto-focus on panel activation
- Enter key triggers generation
- Clear button appears when filled
- History of recent prompts (arrow keys)

### Spacebar Integration
- Global hotkey when panel has focus
- Uses current timeline selection
- Falls back to playhead position
- Quick re-generate last SFX

### API Integration
- ElevenLabs API for generation
- Secure key storage in preferences
- Real-time usage tracking
- Error handling with clear messages

### Timeline Placement
- Respects in/out points
- Uses targeted audio track (A5* = Track 5 targeted)
- Smart collision detection
- Groups with associated video clips
- Full undo/redo support
- Dedicated track workflows (whoosh track, ambience track, etc.)