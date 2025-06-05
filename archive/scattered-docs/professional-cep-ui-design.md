# Professional CEP UI Design Patterns

## Design System Variables
```css
:root {
    /* Professional Dark Theme */
    --bg-primary: #2a2a2a;
    --bg-secondary: #3a3a3a;
    --border-color: #555555;
    --text-inactive: #888888;
    --text-active: #cccccc;
    --text-white: #ffffff;
    --accent-blue: #0099ff;
    --success-green: #00cc66;
    --error-red: #ff4444;
    
    /* Spacing Scale */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    
    /* Responsive Font Sizes */
    --font-xs: clamp(9px, 2.5vw, 10px);
    --font-sm: clamp(10px, 3vw, 12px);
    --font-md: clamp(12px, 3.5vw, 14px);
    --font-lg: clamp(14px, 4vw, 16px);
}
```

## Professional UI Patterns
```css
/* No text selection for app-like feel */
* {
    user-select: none;
    box-sizing: border-box;
}

/* Custom scrollbars */
::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 10px;
}

/* Glass effect for overlays */
.glass-overlay {
    background: rgba(50, 50, 50, 0.25);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Professional button styling */
.pro-button {
    background: var(--accent-blue);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    color: white;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
}

.pro-button:hover {
    background: #00aaff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 153, 255, 0.3);
}

.pro-button:active {
    transform: translateY(0);
}
```

## Compact Panel Layout
```css
/* Horizontal layout for limited space */
.plugin-container {
    display: grid;
    grid-template-rows: 1fr auto auto;
    height: 100vh;
    padding: var(--space-sm);
    gap: var(--space-xs);
    max-height: 80px;
    min-height: 60px;
}

.input-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-sm);
}
```

## Token Savings
~100 tokens by reusing professional design patterns