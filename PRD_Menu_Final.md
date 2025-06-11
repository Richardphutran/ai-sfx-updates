# AI SFX Generator - Minimal Menu Design (525x130px)

## 🎯 Design Philosophy
Ultra-minimal menu that expands within our exact UI dimensions. No popups, no extra windows - everything fits in 525x130px.

## 📐 Menu States (All within 525x130px)

### State 1: Normal UI
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ In: --:--:-- Out: 00:01:09  Length: 10s [Auto]  Influence: 0.5  │
└─────────────────────────────────────────────────────────────────┘
```

### State 2: Settings Menu (⚙️ clicked - replaces bottom row)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Describe your SFX                                    ] [⚙️] [×] │
├─────────────────────────────────────────────────────────────────┤
│ Vol: ━━●━━ -6dB │ Track: [A3▼] │ API: [●] │ [📁] │ [❓] │ [🔧] │
└─────────────────────────────────────────────────────────────────┘
```

### State 3: API Setup (🔧 clicked - expands in place)
```
┌─────────────────────────────────────────────────────────────────┐
│ API Key: [••••••••••••••••••••••••••••••••••] [Test] [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Status: ✅ Connected │ Usage: 47/1000 │ Folder: [/SFX/] [📁] │
└─────────────────────────────────────────────────────────────────┘
```

### State 4: Help (❓ clicked - expands in place)
```
┌─────────────────────────────────────────────────────────────────┐
│ Quick Help                                            [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Type description → Enter → SFX generated │ Issues? [Email] │
└─────────────────────────────────────────────────────────────────┘
```

### State 5: Files (📁 clicked - expands in place)
```
┌─────────────────────────────────────────────────────────────────┐
│ SFX Library: 47 files (2.1GB)                        [Back] │
├─────────────────────────────────────────────────────────────────┤
│ Location: [/Users/name/SFX/] [Change] │ [Open] │ [Clean] │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Simplified Menu System

### Only 4 Essential Menus:
1. **🔧 API** - ElevenLabs setup
2. **📁 Files** - SFX library location 
3. **❓ Help** - Quick usage guide
4. **Settings Bar** - Volume, Track, API status

### No More:
- ❌ Keys/Hotkeys (spacebar just works)
- ❌ Reset (not needed)
- ❌ Test (built into API)
- ❌ Save (auto-saves)
- ❌ Debug (dev-only)
- ❌ About (not essential)

## 🔄 Interaction Flow

### Navigation Logic:
```
Normal UI → [⚙️] → Settings Bar
Settings Bar → [🔧] → API Setup
Settings Bar → [📁] → Files
Settings Bar → [❓] → Help
Any Menu → [Back] → Settings Bar → [⚙️] → Normal UI
```

### State Management:
```javascript
const menuState = {
  mode: 'normal', // 'normal', 'settings', 'api', 'files', 'help'
  
  toggleSettings() {
    this.mode = this.mode === 'normal' ? 'settings' : 'normal';
  },
  
  openSubmenu(type) {
    this.mode = type; // 'api', 'files', 'help'
  },
  
  goBack() {
    this.mode = 'settings';
  }
};
```

## 📱 Layout Components

### Settings Bar (35px height)
```javascript
<div className="settings-bar">
  <VolumeControl value={-6} max={0} min={-12} />
  <TrackSelector options={['A1','A2','A3','Auto']} value="A3" />
  <ApiStatus connected={true} />
  <IconButton icon="📁" onClick={() => openSubmenu('files')} />
  <IconButton icon="❓" onClick={() => openSubmenu('help')} />
  <IconButton icon="🔧" onClick={() => openSubmenu('api')} />
</div>
```

### API Setup (2-row form)
```javascript
<div className="api-setup">
  <div className="row-1">
    <Input type="password" placeholder="ElevenLabs API Key" />
    <Button>Test</Button>
    <Button>Back</Button>
  </div>
  <div className="row-2">
    <StatusIndicator status="connected" />
    <UsageDisplay current={47} total={1000} />
    <FolderSelector path="/SFX/" />
  </div>
</div>
```

### Files Manager (2-row layout)
```javascript
<div className="files-manager">
  <div className="row-1">
    <Label>SFX Library: 47 files (2.1GB)</Label>
    <Button>Back</Button>
  </div>
  <div className="row-2">
    <FolderInput value="/Users/name/SFX/" />
    <Button>Change</Button>
    <Button>Open</Button>
    <Button>Clean</Button>
  </div>
</div>
```

### Help Guide (2-row minimal)
```javascript
<div className="help-guide">
  <div className="row-1">
    <Label>Quick Help</Label>
    <Button>Back</Button>
  </div>
  <div className="row-2">
    <HelpText>Type description → Enter → SFX generated</HelpText>
    <Button>Email Support</Button>
  </div>
</div>
```

## 🎯 Visual Design

### Consistent Heights:
- **Row 1**: 65px (input + button area)
- **Row 2**: 35px (info + controls area)
- **Total**: 100px (fits in 130px with padding)

### Typography:
- **Labels**: 11px semibold
- **Inputs**: 10px regular
- **Buttons**: 9px medium
- **Status**: 8px regular

### Color States:
```scss
.settings-bar {
  background: rgba(42, 42, 42, 0.95);
  border-top: 1px solid #444;
}

.submenu {
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid #555;
}

.api-status {
  &.connected { color: #00cc66; }
  &.error { color: #ff4444; }
  &.testing { color: #ff9500; }
}
```

## 🚀 Implementation Priority

### Phase 1: Settings Toggle
- Settings gear toggles bottom row
- Volume slider + track dropdown
- API status indicator

### Phase 2: API Setup  
- In-place API key entry
- Test connection button
- Folder selection

### Phase 3: Files & Help
- Library management
- Quick help text
- Email support link

## 🎨 Micro-Interactions

### Smooth Transitions:
```scss
.menu-transition {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up {
  transform: translateY(0);
  opacity: 1;
}

.slide-down {
  transform: translateY(10px);
  opacity: 0;
}
```

### Visual Feedback:
- **Hover**: Subtle background change
- **Active**: Blue accent border  
- **Success**: Green checkmark
- **Error**: Red warning icon

This design keeps everything simple, functional, and contained within our exact UI dimensions! 🎵