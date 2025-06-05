# Clean Horizontal UI Design System

**Status:** ✅ WORKING
**Tokens:** ~75

## Problem
Need professional, space-efficient UI for Adobe plugins

## Solution
```css
:root {
    /* Professional dark theme */
    --primary-blue: #0099ff;
    --bg-primary: #2a2a2a;
    --bg-secondary: #3a3a3a;
    --border-color: #555555;
    --text-inactive: #888888;
    --text-active: #cccccc;
    
    /* Responsive fonts with clamp() */
    --font-xs: clamp(9px, 2.5vw, 10px);
    --font-md: clamp(12px, 3.5vw, 14px);
}

/* Compact grid layout */
.plugin-container {
    display: grid;
    grid-template-rows: 1fr auto auto;
    height: 100vh;
    max-height: 80px;
    min-height: 60px;
}

/* Prevent text selection */
* {
    user-select: none;
}
```

## When to Use
Creating space-efficient Adobe plugin UIs that look professional