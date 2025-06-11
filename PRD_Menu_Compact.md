# AI SFX Generator - Compact Menu Design (525x130px)

## 🎯 Design Overview
Ultra-compact settings menu designed for typical CEP panel size (525x130px), prioritizing horizontal space and minimal popup overlays.

## 📐 Micro-UI Layout Structure

### Main UI with Settings Bar
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ In: --:--:-- Out: 00:01:09  Length: 10s [Auto]  Influence: 0.5  │
├─ Quick Settings (appears when ⚙️ clicked) ─────────────────────┤
│ Vol: ━━●━━ -6dB │ Track: [A3▼] │ Key: [●] │ [🔧] [❓] [🔍] [🔄] │
└─────────────────────────────────────────────────────────────────┘
```

### API Setup Modal (400x200px popup)
```
┌─────────────────────────────────────────┐
│ 🔑 API Configuration               [×] │
├─────────────────────────────────────────┤
│ ElevenLabs: [●]  Usage: 47/1000        │
│ [••••••••••••••••••••] [Test] [Save]   │
│                                         │
│ Save Folder:                            │
│ [/Users/name/Projects/SFX/    ] [📁]   │
│ Files: 124 (2.1GB)            [🗑️]     │
│                                         │
│ [Cancel]              [Apply Settings] │
└─────────────────────────────────────────┘
```

### Help Tooltip (300x120px popup)
```
┌─────────────────────────────────────────┐
│ ❓ Quick Help                      [×] │
├─────────────────────────────────────────┤
│ • Type SFX description (e.g. "whoosh") │
│ • Press Enter or spacebar to generate  │
│ • SFX auto-places on timeline          │
│                                         │
│ [📧 Email Support] [🐛 Report Bug]     │
└─────────────────────────────────────────┘
```

### Debug Modal (350x160px popup)
```
┌─────────────────────────────────────────┐
│ 🔍 Debug Information               [×] │
├─────────────────────────────────────────┤
│ Plugin: v1.0.0    │ CEP: 11.1.0        │
│ Generated: 47     │ Last Gen: 2.3s     │
│ Storage: 2.1GB    │ Cache: 67%         │
│                                         │
│ [📋 Copy] [🗑️ Clear] [📄 Logs] [🔄 Reset] │
│                                         │
│ Console: http://localhost:3030          │
└─────────────────────────────────────────┘
```

## 🎨 Micro-UI Design System

### Ultra-Compact Sizing
```scss
:root {
  // Micro dimensions for 525x130px constraint
  --micro-font: 10px;
  --micro-icon: 12px;
  --micro-button: 20px;
  --micro-input: 24px;
  --micro-spacing: 4px;
  --micro-radius: 3px;
  --micro-popup-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
```

### Typography Hierarchy
- **Icons**: 12px (primary interaction)
- **Body text**: 10px 
- **Button text**: 9px
- **Captions**: 8px
- **Tooltips**: 9px

### Color System (Dark Theme)
```scss
:root {
  --micro-bg: #1e1e1e;
  --micro-surface: #2a2a2a;
  --micro-accent: #0099ff;
  --micro-success: #00cc66;
  --micro-text: #ffffff;
  --micro-text-dim: #888888;
  --micro-border: #444444;
}
```

## 🔄 Interaction Logic

### Settings Bar Toggle
```javascript
const toggleQuickSettings = () => {
  setShowSettings(!showSettings);
  // Animate slide down/up (150ms)
  gsap.to('.quick-settings', {
    height: showSettings ? 'auto' : 0,
    duration: 0.15
  });
};
```

### Modal Management
```javascript
const modalState = {
  activeModal: null, // 'api', 'help', 'debug'
  
  openModal(type) {
    this.activeModal = type;
    // Center modal over plugin
    positionModal(type);
  },
  
  closeModal() {
    this.activeModal = null;
  }
};
```

### Quick Controls State
```javascript
const quickSettings = {
  volume: -6,        // -12 to 0 dB
  track: 'A3',       // A1, A2, A3, Auto
  spacebarEnabled: true,
  
  updateVolume(value) {
    this.volume = value;
    persistSettings();
  }
};
```

## 🎯 Space-Efficient Features

### Icon-First Design
- **🔧** = API Setup
- **❓** = Help
- **🔍** = Debug  
- **🔄** = Reset
- **📁** = Files
- **⚙️** = Settings Toggle

### Horizontal Priority Layout
- Primary controls in main UI row
- Secondary controls in collapsible bar
- Complex settings in focused modals
- No nested menus or sub-screens

### Smart Defaults
- Volume: -6dB (broadcast standard)
- Track: A3 (dedicated SFX track)
- Length: Auto-detect from timeline
- Spacebar: Enabled for quick generation

## 📱 Touch & Accessibility

### Minimum Target Sizes
- Buttons: 20px × 20px minimum
- Sliders: 12px handle, 24px touch area
- Toggle switches: 24px × 12px
- Text inputs: 24px height

### Keyboard Navigation
- Tab order: Input → Settings → Modals
- Enter: Generate SFX
- Escape: Close modals
- Space: Quick generate (when focused)

### Screen Reader Support
- ARIA labels on all controls
- Live regions for status updates
- Semantic HTML structure
- High contrast mode support

## 🚀 Implementation Strategy

### Phase 1: Core Settings Bar
```javascript
// Essential horizontal controls
<div className="quick-settings">
  <VolumeSlider value={volume} onChange={setVolume} />
  <TrackSelector value={track} onChange={setTrack} />
  <Toggle label="Spacebar" checked={spacebar} />
  <IconButton icon="🔧" onClick={openApiModal} />
</div>
```

### Phase 2: Modal System
```javascript
// Reusable modal component
<Modal 
  isOpen={modalState.activeModal === 'api'}
  onClose={closeModal}
  size="small" // 400x200px
>
  <ApiSetupForm />
</Modal>
```

### Phase 3: Advanced Features
- Usage analytics in debug modal
- Bulk file management
- Preset prompt library
- Keyboard shortcuts panel

## 🎨 Visual Polish

### Animations (Ultra-Fast)
- Settings bar: 150ms slide
- Modals: 200ms fade + scale
- Buttons: 100ms color transition
- Sliders: Real-time smooth dragging

### Micro-Interactions
- Hover states on all clickable elements
- Active/pressed states for feedback
- Loading spinners for API calls
- Success checkmarks for confirmations

### Responsive Behavior
- Graceful degradation at < 500px width
- Stack controls vertically if needed
- Reduce font sizes at extreme scales
- Maintain 20px touch targets always

This micro-UI approach maximizes functionality within the 525x130px constraint while maintaining professional aesthetics and usability!