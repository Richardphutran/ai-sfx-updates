# AI SFX Generator - Realistic Menu Design (525x130px)

## 🎯 Design Reality Check
ALL menus must fit within our actual UI size: 525x130 pixels. No popups, no overlays - everything transforms within this exact space.

## 📐 Menu States (REAL 525x130px dimensions)

### State 1: Normal UI
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ In: --:--:-- Out: 00:01:09  Length: 10s [Auto]  Influence: 0.5  │
└─────────────────────────────────────────────────────────────────┘
```

### State 2: Settings Menu (⚙️ clicked)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ Vol: ━━●━━ -6dB │ Target: [●][A5*▼] │ API: [●] │ [🔧] │ [❓] │ [📁] │
└─────────────────────────────────────────────────────────────────┘
```

### State 2b: Track Targeting OFF
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ Vol: ━━●━━ -6dB │ Target: [○][Auto] │ API: [●] │ [🔧] │ [❓] │ [📁] │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Only 3 Essential Menu Options

### 1. API Setup (🔧 clicked - replaces bottom row completely)
```
┌─────────────────────────────────────────────────────────────────┐
│ API Key: [••••••••••••••••••••••••••••••••••] [Test] [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Status: ✅ Connected │ Usage: 47/1000 │ Folder: [/SFX/] [📁] │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Help (❓ clicked - replaces bottom row completely)  
```
┌─────────────────────────────────────────────────────────────────┐
│ Quick Help: Type description → Enter → SFX generated   [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Issues? [Email Support] │ Spacebar = Quick generate │ v1.0.0 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Files (📁 clicked - replaces bottom row completely)
```
┌─────────────────────────────────────────────────────────────────┐
│ SFX Library: 47 files (2.1GB)                          [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Location: [/Users/name/SFX/] [Change] │ [Open] │ [Clean] │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Micro-UI Design Constraints

### Exact Dimensions:
- **Total UI**: 525px × 130px
- **Row 1**: 525px × 65px (main input area)
- **Row 2**: 525px × 65px (controls/menu area)
- **Fonts**: 10px max (readable at this size)
- **Buttons**: 20px height max
- **Icons**: 12px max

### Typography Scale:
```scss
.micro-ui {
  --font-tiny: 8px;     // Status text
  --font-small: 9px;    // Button labels  
  --font-normal: 10px;  // Main text
  --font-large: 11px;   // Headers only
}
```

### Color System (High Contrast):
```scss
:root {
  --bg-main: #1e1e1e;
  --bg-secondary: #2a2a2a;
  --accent: #0099ff;
  --success: #00cc66;
  --text: #ffffff;
  --text-dim: #888888;
  --border: #444444;
}
```

## 🔄 Navigation Flow

### Simple State Machine:
```
NORMAL ⟷ [⚙️] ⟷ SETTINGS
                    ↓ [🔧]
                   API
                    ↓ [❓]  
                   HELP
                    ↓ [📁]
                  FILES
```

### State Management:
```javascript
const uiState = {
  mode: 'normal', // 'normal' | 'settings' | 'api' | 'help' | 'files'
  
  // Toggle between normal and settings
  toggleSettings() {
    this.mode = this.mode === 'normal' ? 'settings' : 'normal';
  },
  
  // Open specific menu (from settings)
  openMenu(type) {
    this.mode = type;
  },
  
  // Always go back to settings (not normal)
  goBack() {
    this.mode = 'settings';
  }
};
```

## 📱 Component Design

### Settings Bar (fits in 525x65px):
```javascript
<div className="settings-row">
  <VolumeSlider width={80} value={-6} />
  <TrackTargetToggle 
    width={90} 
    enabled={true} 
    value="A5*" 
    options={['A3', 'A4', 'A5*', 'A6', 'A7']}
    onToggle={setTrackTargeting}
  />
  <ApiStatus width={50} connected={true} />
  <IconButton size={20} icon="🔧" onClick={() => openMenu('api')} />
  <IconButton size={20} icon="❓" onClick={() => openMenu('help')} />
  <IconButton size={20} icon="📁" onClick={() => openMenu('files')} />
</div>
```

### API Setup (fits in 525x65px):
```javascript
<div className="api-row">
  <Input 
    width={300} 
    type="password" 
    placeholder="ElevenLabs API Key"
  />
  <Button width={40}>Test</Button>
  <Button width={40}>Back</Button>
</div>
<div className="status-row">
  <Status text="✅ Connected" />
  <Usage text="47/1000" />
  <FolderPath text="/SFX/" />
  <Button size={20} icon="📁" />
</div>
```

## 🎯 Removed Features (Too Big)

### What We DON'T Include:
- ❌ **Multiple menu sections** (no space)
- ❌ **Sub-sub-menus** (too complex)  
- ❌ **Long descriptions** (no room)
- ❌ **Large forms** (doesn't fit)
- ❌ **Multiple settings pages** (confusing)
- ❌ **About/Debug/Support pages** (not essential)

### What We Keep:
- ✅ **API key entry** (essential)
- ✅ **Volume/Track targeting** (daily use)
- ✅ **Quick help** (one line)
- ✅ **File location** (important)
- ✅ **Status indicators** (feedback)

## 🚀 Implementation Strategy

### Phase 1: Core Toggle
```javascript
// Just the settings gear that shows/hides bottom row
function SettingsToggle() {
  return (
    <button onClick={toggleSettings}>
      ⚙️
    </button>
  );
}
```

### Phase 2: Settings Bar
```javascript
// Horizontal controls that fit in 525px
function SettingsBar() {
  return (
    <div className="settings-bar">
      <VolumeControl />
      <TrackSelector />
      <ApiStatus />
      <MenuButtons />
    </div>
  );
}
```

### Phase 3: Menu Replacements
```javascript
// Each menu completely replaces the settings bar
function ApiSetup() {
  return (
    <div className="menu-replacement">
      <ApiKeyInput />
      <TestButton />
      <BackButton />
    </div>
  );
}
```

## 💡 UX Principles

### Micro-UI Rules:
1. **One thing at a time** - no multi-panel layouts
2. **Essential only** - remove anything non-critical  
3. **Icons over text** - save horizontal space
4. **Instant feedback** - no loading states
5. **Touch-friendly** - 20px minimum targets

### Visual Hierarchy:
- **Most important**: Volume, Track targeting, API status
- **Secondary**: Help, file management
- **Tertiary**: Settings access

## 🎯 Track Targeting System

### Smart Track Selection Logic:
```javascript
const trackTargeting = {
  enabled: true, // Toggle feature on/off
  
  // Auto-detect available audio tracks
  getAvailableTracks() {
    const sequence = app.project.activeSequence;
    const audioTracks = sequence.audioTracks;
    
    // Return tracks with * indicating currently targeted
    return audioTracks.map((track, index) => ({
      id: `A${index + 1}`,
      name: track.name || `Audio ${index + 1}`,
      isTargeted: track.isTargeted(),
      display: track.isTargeted() ? `A${index + 1}*` : `A${index + 1}`
    }));
  },
  
  // Use targeted track, or fall back to smart placement
  getPlacementTrack() {
    if (!this.enabled) {
      // When disabled, use smart auto-placement
      return this.getSmartTrack();
    }
    
    const tracks = this.getAvailableTracks();
    const targeted = tracks.find(t => t.isTargeted);
    
    return targeted || this.getSmartTrack();
  },
  
  // Smart auto-placement when targeting is disabled
  getSmartTrack() {
    const tracks = this.getAvailableTracks();
    // Use first available track or create new one
    return tracks.find(t => !t.hasContent) || tracks[0];
  }
};
```

### Track Dropdown Behavior:
- **[●][A5*]** = Targeting ON, Track 5 is targeted (will place here)
- **[○][Auto]** = Targeting OFF, uses smart auto-placement
- **[●][A3]** = Targeting ON, Track 3 available but not targeted
- Click toggle to switch: **[●] → [○]** or **[○] → [●]**

### Use Cases:
**When Targeting is ON [●]:**
- **Dedicated SFX track**: Target A5 for all whooshes
- **Ambience track**: Target A6 for all background sounds  
- **Dialog enhancement**: Target A4 for mouth sounds
- **Music layer**: Target A7 for musical stingers

**When Targeting is OFF [○]:**
- **Smart auto-placement**: Finds first available track
- **Simple workflow**: No track management needed
- **Beginner-friendly**: Just generate and place

This design actually respects our 525x130px constraint and provides essential functionality with smart track targeting! 🎵