# UXP Responsive Design & UI Patterns

## 🎯 Flexbox-First Responsive Design

**Critical Rule**: Adobe panels are constantly resized by users. Use flexbox for everything!

```css
/* Base container - ALWAYS flexbox */
.plugin-container {
    display: flex;
    flex-direction: column;
    height: 100vh; /* Full panel height */
    min-width: 300px; /* Prevent too narrow */
    background: var(--uxp-host-background-color);
    color: var(--uxp-host-text-color);
}

/* Scrollable content area */
.content-area {
    flex: 1; /* Takes all available space */
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
}

/* Fixed footer/controls */
.bottom-controls {
    flex-shrink: 0; /* Never shrink */
    padding: 16px;
    border-top: 1px solid var(--uxp-host-border-color);
}

/* Header that stays visible */
.header {
    flex-shrink: 0;
    padding: 16px;
    border-bottom: 1px solid var(--uxp-host-border-color);
}
```

## 🎯 Glass Morphism for Modern UI

**Professional glass effect that works in UXP**:
```css
/* Glass morphism card */
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

.glass-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Glass button */
.glass-button {
    background: rgba(95, 175, 251, 0.2);
    border: 1px solid rgba(95, 175, 251, 0.3);
    backdrop-filter: blur(4px);
    border-radius: 8px;
    padding: 8px 16px;
    color: #5FAFFB;
    transition: all 0.2s ease;
    cursor: pointer;
}

.glass-button:hover {
    background: rgba(95, 175, 251, 0.3);
    border-color: rgba(95, 175, 251, 0.5);
    transform: translateY(-1px);
}

.glass-button:active {
    transform: translateY(0);
}
```

## 🎯 Spectrum Web Components Best Practices

**Use Adobe's official components for consistency**:
```html
<!-- Buttons -->
<sp-button variant="cta" size="m">Primary Action</sp-button>
<sp-button variant="secondary">Secondary</sp-button>
<sp-button variant="negative" quiet>Delete</sp-button>

<!-- Text inputs -->
<sp-textfield placeholder="Enter text..."></sp-textfield>
<sp-textfield type="password" placeholder="API Key"></sp-textfield>

<!-- Dropdowns -->
<sp-dropdown>
    <sp-option>Option 1</sp-option>
    <sp-option selected>Option 2</sp-option>
</sp-dropdown>

<!-- Progress indicators -->
<sp-progressbar indeterminate>
    <sp-label slot="label">Processing...</sp-label>
</sp-progressbar>

<!-- Icons -->
<sp-action-button quiet>
    <sp-icon name="ui:Settings" size="m"></sp-icon>
</sp-action-button>
```

## 🎯 Chat Interface Pattern

**Clean chat UI that works in UXP**:
```css
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.chat-bubble {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 16px;
    white-space: pre-wrap; /* Preserves line breaks */
    word-wrap: break-word;
}

.chat-bubble.user {
    align-self: flex-end;
    background: rgba(95, 175, 251, 0.2);
    border: 1px solid rgba(95, 175, 251, 0.3);
}

.chat-bubble.assistant {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input-container {
    flex-shrink: 0;
    padding: 16px;
    border-top: 1px solid var(--uxp-host-border-color);
}
```

## 🎯 Multi-View Architecture

**Professional plugin with multiple screens**:
```javascript
// View manager pattern
class ViewManager {
    constructor() {
        this.views = {
            setup: document.getElementById('setupView'),
            main: document.getElementById('mainView'),
            settings: document.getElementById('settingsView')
        };
        this.currentView = 'setup';
    }
    
    showView(viewName) {
        // Hide all views
        Object.values(this.views).forEach(view => {
            view.style.display = 'none';
        });
        
        // Show requested view
        if (this.views[viewName]) {
            this.views[viewName].style.display = 'flex';
            this.currentView = viewName;
        }
    }
    
    // Smooth transitions
    async transitionTo(viewName) {
        const currentView = this.views[this.currentView];
        const nextView = this.views[viewName];
        
        // Fade out current
        currentView.style.opacity = '0';
        await new Promise(r => setTimeout(r, 200));
        currentView.style.display = 'none';
        
        // Fade in next
        nextView.style.display = 'flex';
        nextView.style.opacity = '0';
        await new Promise(r => setTimeout(r, 10));
        nextView.style.opacity = '1';
        
        this.currentView = viewName;
    }
}
```

## 🎯 Status Indicators & Feedback

**File detection status**:
```html
<div class="file-status-item">
    <div class="status-icon" data-status="found">✓</div>
    <div class="status-text">
        <div class="file-name">captions.srt</div>
        <div class="file-info">1,247 captions • 45:30</div>
    </div>
</div>
```

```css
.status-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}

.status-icon[data-status="found"] {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.5);
    color: #4CAF50;
}

.status-icon[data-status="missing"] {
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.5);
    color: #F44336;
}

.status-icon[data-status="processing"] {
    background: rgba(255, 152, 0, 0.2);
    border: 1px solid rgba(255, 152, 0, 0.5);
    color: #FF9800;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

## 🎯 Responsive Typography

**Scale text properly for different panel sizes**:
```css
/* Base font sizing */
:root {
    --base-font-size: 13px;
    --small-font-size: 11px;
    --large-font-size: 15px;
}

/* Use rem units for scalability */
body {
    font-size: var(--base-font-size);
    font-family: adobe-clean, "Source Sans Pro", -apple-system, sans-serif;
}

h1 { font-size: 1.5rem; }
h2 { font-size: 1.3rem; }
h3 { font-size: 1.15rem; }

.small-text { font-size: var(--small-font-size); }
.large-text { font-size: var(--large-font-size); }

/* Responsive adjustments */
@media (max-width: 400px) {
    :root {
        --base-font-size: 12px;
    }
}
```

## 🎯 Dark Theme Variables

**Always use CSS variables for theming**:
```css
:root {
    /* Adobe host colors */
    --uxp-host-background-color: #262626;
    --uxp-host-text-color: #ffffff;
    --uxp-host-border-color: rgba(255, 255, 255, 0.1);
    
    /* Custom theme colors */
    --primary-color: #5FAFFB;
    --primary-hover: #7fc1ff;
    --success-color: #4CAF50;
    --error-color: #F44336;
    --warning-color: #FF9800;
    
    /* Glass effect colors */
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-hover: rgba(255, 255, 255, 0.08);
}
```

## 🎯 Keyboard Shortcuts

**Essential keyboard handling**:
```javascript
// Global shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to go back
    if (e.key === 'Escape') {
        if (viewManager.currentView !== 'main') {
            viewManager.showView('main');
        }
    }
    
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'TEXTAREA') {
            // Submit form or process
            handleSubmit();
        }
    }
    
    // Ctrl/Cmd + S to save settings
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveSettings();
    }
});

// Chat input handling
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
    // Shift+Enter allows new lines
});
```

## 🎯 Loading States

**Never leave users wondering**:
```javascript
function showLoading(message = 'Processing...') {
    const loader = document.getElementById('loadingOverlay');
    const text = loader.querySelector('.loading-text');
    text.textContent = message;
    loader.style.display = 'flex';
}

function updateLoadingProgress(percent, message) {
    const progress = document.querySelector('.loading-progress');
    const text = document.querySelector('.loading-text');
    progress.style.width = `${percent}%`;
    text.textContent = message;
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    loader.style.display = 'none';
}
```

## 🎯 Key Takeaways

1. **Always use flexbox** - Panels resize constantly
2. **Glass morphism** - Modern, professional look
3. **Spectrum components** - Consistency with Adobe
4. **CSS variables** - Easy theming and maintenance
5. **Responsive units** - rem/% instead of fixed px
6. **Loading feedback** - Never leave users waiting
7. **Keyboard shortcuts** - Power user features
8. **Multi-view pattern** - Clean navigation between screens

These patterns create professional, responsive UXP plugins that feel native to Adobe's ecosystem.