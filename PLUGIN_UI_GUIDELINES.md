# AI SFX Generator - UI Guidelines & Design System

## Overview
The AI SFX Generator sets the standard for all plugin UI design. Its minimal, efficient interface maximizes functionality while maintaining a beautiful, professional aesthetic. All other plugins should follow these guidelines to ensure visual coherence across the plugin ecosystem.

## Core Design Philosophy

### 1. **Minimal is Beautiful**
- Every pixel has purpose
- No decorative elements without function
- Clean, uncluttered interface
- Maximum screen real estate efficiency

### 2. **Content First**
- Interface disappears when not needed
- Focus on the user's content, not the UI
- Subtle, non-intrusive controls

### 3. **Instant Feedback**
- Visual states for every interaction
- Smooth transitions and animations
- Clear status communication

## Color Palette

```scss
/* Primary Colors */
--primary-blue: #0099ff;        // Primary actions, focus states
--primary-blue-dark: #0077cc;   // Hover states
--primary-blue-light: #33aaff;  // Active states

/* Background Hierarchy */
--bg-primary: #1e1e1e;          // Main background
--bg-secondary: #2a2a2a;        // Input fields, secondary surfaces
--bg-tertiary: #3a3a3a;         // Elevated elements

/* Border & Dividers */
--border-color: #444444;        // Default borders
--border-light: #555555;        // Hover borders

/* Text Hierarchy */
--text-white: #ffffff;          // Primary text
--text-active: #cccccc;         // Active/important text
--text-inactive: #888888;       // Placeholder/inactive text

/* Semantic Colors */
--success-green: #00cc66;       // Success states, active indicators
--error-red: #ff4444;           // Error states
--warning-orange: #ffa500;      // Loading/processing states
```

## Typography

```scss
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Font Sizes */
--font-xs: 10px;   // Subtle labels, hints
--font-sm: 11px;   // Secondary text, controls
--font-md: 12px;   // Primary text, inputs
--font-lg: 14px;   // Headers (rarely used)

/* Font Weights */
font-weight: 400;  // Normal text
font-weight: 500;  // Emphasized values
font-weight: 600;  // Critical warnings only
```

## Spacing System

```scss
/* Consistent Spacing Scale */
--space-xs: 4px;   // Tight grouping
--space-sm: 8px;   // Default spacing
--space-md: 16px;  // Section spacing
--space-lg: 24px;  // Major sections

/* Usage */
padding: var(--space-sm);
gap: var(--space-xs);
margin-bottom: var(--space-md);
```

## Border Radius

```scss
/* Rounded Corners */
--radius-sm: 4px;   // Buttons, small elements
--radius-md: 8px;   // Cards, dropdowns
--radius-lg: 12px;  // Input fields, major containers

/* Usage */
border-radius: var(--radius-sm);  // Sharp, professional
border-radius: 50%;               // Circular buttons only
```

## Component Patterns

### Input Fields

```scss
.input-field {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  font-size: var(--font-md);
  color: var(--text-white);
  transition: all 0.3s ease;
  
  &:focus {
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.2);
  }
  
  &::placeholder {
    color: var(--text-inactive);
  }
}
```

### Buttons

```scss
/* Primary Action Button */
.btn-primary {
  background: var(--primary-blue);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--primary-blue-dark);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* Secondary Button */
.btn-secondary {
  background: linear-gradient(to bottom, var(--bg-tertiary), var(--bg-secondary));
  border: 1px solid var(--border-color);
  color: var(--text-inactive);
  
  &:hover {
    border-color: var(--text-active);
    color: var(--text-white);
  }
}
```

### Sliders

```scss
.slider {
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--primary-blue);
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
}
```

## Visual Effects

### Shadows & Elevation

```scss
/* Elevation Levels */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.4);

/* Glow Effects */
--glow-blue: 0 0 0 2px rgba(0, 153, 255, 0.2);
--glow-green: 0 0 0 2px rgba(0, 204, 102, 0.2);
```

### Glass Morphism

```scss
.glass-element {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Animation Guidelines

### Timing Functions

```scss
/* Standard Curves */
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Durations */
--duration-fast: 150ms;    // Hover states
--duration-normal: 300ms;  // Standard transitions
--duration-slow: 500ms;    // Complex animations
```

### Standard Animations

```scss
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading Shimmer */
@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 200%; }
}
```

## State Management

### Loading States

```scss
.loading {
  border-color: var(--warning-orange) !important;
  background: rgba(255, 165, 0, 0.1) !important;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: var(--warning-orange);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}
```

### Focus States

- Always visible focus indicators
- 2px outline with primary color
- 2px offset for breathing room

### Hover States

- Subtle color shifts
- Small transform: `translateY(-1px)`
- Smooth transitions (300ms)

## Layout Principles

### Flexible Container

```scss
.plugin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  padding: var(--space-sm);
  gap: var(--space-xs);
}
```

### Responsive Behavior

- Min width: 240px
- Min height: 160px
- Content reflows gracefully
- Controls stack vertically when needed

## User Experience Patterns

### Generation Flow

1. **Input State**: Clean, focused text input
2. **Processing**: Orange border, shimmer effect, spinning indicator
3. **Success**: Brief green flash, then return to normal
4. **Error**: Red border with clear error message

### Visual Feedback Timeline

```
User Action → Immediate Response (50ms) → Process (variable) → Result (300ms fade)
```

### Interaction Guidelines

- **Click targets**: Minimum 32x32px
- **Hover delay**: None (instant feedback)
- **Disabled states**: 60% opacity
- **Error messages**: Below input, red text, auto-dismiss after 5s

## Flexible & Responsive CSS Techniques

### Using CSS `clamp()` for Fluid Typography & Spacing

The `clamp()` function enables truly responsive values that scale smoothly between minimum and maximum limits without media queries.

```scss
/* Syntax: clamp(minimum, preferred, maximum) */

/* Fluid Typography */
.dynamic-text {
  font-size: clamp(10px, 2vw, 14px);  // Scales with viewport
  // Min: 10px, Max: 14px, Preferred: 2% of viewport width
}

/* Fluid Spacing */
.responsive-padding {
  padding: clamp(4px, 1vw, 16px);     // Responsive padding
  gap: clamp(2px, 0.5vw, 8px);        // Responsive gap
}

/* Fluid Component Sizing */
.flexible-button {
  height: clamp(28px, 5vh, 40px);     // Min 28px, max 40px
  width: clamp(80px, 20vw, 160px);    // Responsive width
  font-size: clamp(10px, 1.5vw, 12px);
}

/* Practical Plugin Examples */
.sfx-input {
  min-height: clamp(28px, 8vh, 48px); // Adapts to panel height
  font-size: clamp(11px, 1.2vw, 14px);
  padding: clamp(6px, 1vw, 12px);
}

.timeline-section {
  gap: clamp(4px, 1vw, 12px);         // Responsive spacing
  font-size: clamp(9px, 1vw, 11px);   // Scales with panel
}
```

### Container Queries (Modern Alternative)

For component-based responsiveness independent of viewport:

```scss
/* Define container */
.plugin-container {
  container-type: inline-size;
  container-name: plugin;
}

/* Respond to container size, not viewport */
@container plugin (max-width: 300px) {
  .timeline-section {
    flex-direction: column;
  }
  
  .controls-section {
    font-size: 9px;
  }
}

@container plugin (min-width: 400px) {
  .input-section {
    gap: var(--space-md);
  }
}
```

### Flexible Box & Grid Techniques

```scss
/* Flexible with minimum sizes */
.control-row {
  display: flex;
  gap: clamp(2px, 0.5vw, 8px);
  
  > * {
    flex: 1 1 auto;
    min-width: 0;  // Allow shrinking below content
  }
}

/* Auto-fit grid for dynamic layouts */
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: clamp(4px, 1vw, 8px);
}

/* Aspect ratio preservation */
.square-button {
  aspect-ratio: 1;
  width: clamp(32px, 10vw, 48px);
}
```

### CSS Custom Properties for Dynamic Theming

```scss
:root {
  /* Dynamic spacing based on container */
  --dynamic-space: clamp(4px, 1vw, 8px);
  --dynamic-font: clamp(10px, 1.2vw, 12px);
  
  /* Calculated values */
  --panel-padding: max(8px, 2%);
  --safe-area: max(env(safe-area-inset-left), 8px);
}

/* Usage */
.plugin-content {
  padding: var(--panel-padding);
  font-size: var(--dynamic-font);
  gap: calc(var(--dynamic-space) * 2);
}
```

### Responsive Without Media Queries

```scss
/* Text that scales with container */
.adaptive-text {
  font-size: clamp(
    0.875rem,                    // 14px minimum
    2vw + 0.5rem,               // Fluid calculation
    1.125rem                    // 18px maximum
  );
  line-height: 1.5;
}

/* Responsive margins using min/max */
.section {
  margin-block: min(2vh, 16px);
  padding-inline: max(2%, 8px);
}

/* Dynamic border radius */
.rounded-element {
  border-radius: clamp(4px, 1vw, 12px);
}
```

### Performance-Optimized Flexible Layouts

```scss
/* Use logical properties for better internationalization */
.flex-container {
  display: flex;
  padding-inline: clamp(8px, 2vw, 24px);
  padding-block: clamp(4px, 1vh, 16px);
  gap: clamp(4px, 1vw, 12px);
}

/* Prevent layout shift with aspect-ratio */
.stable-element {
  aspect-ratio: 16 / 9;
  width: 100%;
  max-width: clamp(200px, 50vw, 400px);
}

/* Smooth transitions for responsive changes */
.smooth-resize {
  transition: font-size 0.3s ease,
              padding 0.3s ease,
              gap 0.3s ease;
}
```

### Complete Responsive Component Example

```scss
.responsive-card {
  /* Flexible sizing */
  width: clamp(240px, 80vw, 480px);
  padding: clamp(12px, 3vw, 24px);
  
  /* Fluid typography */
  font-size: clamp(11px, 1.5vw, 14px);
  
  /* Dynamic spacing */
  gap: clamp(8px, 2vw, 16px);
  
  /* Responsive borders */
  border-radius: clamp(8px, 2vw, 16px);
  border-width: clamp(1px, 0.2vw, 2px);
  
  /* Smooth transitions */
  transition: all 0.3s var(--ease-out);
  
  /* Nested responsive elements */
  .card-title {
    font-size: clamp(14px, 2vw, 18px);
    margin-bottom: clamp(4px, 1vw, 12px);
  }
  
  .card-button {
    height: clamp(28px, 8vh, 40px);
    font-size: clamp(10px, 1.2vw, 12px);
    padding-inline: clamp(12px, 3vw, 24px);
  }
}
```

## Implementation Tips

### CSS Architecture

```scss
/* Use CSS Custom Properties for theming */
:root {
  /* Define all variables here */
}

/* Component-based structure */
.component {
  /* Base styles */
  
  &__element {
    /* Element styles */
  }
  
  &--modifier {
    /* Variations */
  }
}
```

### Performance Optimizations

```scss
/* Use transform instead of position */
transform: translateX(10px); /* Good */
left: 10px; /* Avoid */

/* Hardware acceleration */
will-change: transform;
transform: translateZ(0);

/* Efficient animations */
animation: fadeIn 0.3s ease-out forwards;
```

### Accessibility

- Keyboard navigation for all controls
- High contrast ratios (WCAG AA minimum)
- Clear focus indicators
- Screen reader friendly labels

## Plugin Coherence Checklist

- [ ] Uses exact color palette
- [ ] Follows spacing system
- [ ] Implements standard animations
- [ ] Maintains minimal aesthetic
- [ ] Responsive at all sizes
- [ ] Smooth state transitions
- [ ] Clear visual hierarchy
- [ ] Consistent typography
- [ ] Proper focus management
- [ ] Efficient screen usage

## Example Implementation

```tsx
// Button component following guidelines
const Button = ({ primary, children, onClick }) => (
  <button 
    className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Input with proper states
const Input = ({ value, onChange, loading, error }) => (
  <input
    className={`input-field ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
    value={value}
    onChange={onChange}
    placeholder="Describe your sound effect..."
  />
);
```

## Final Notes

The AI SFX Generator UI is intentionally minimal and functional. When implementing these guidelines:

1. **Question every pixel** - If it doesn't serve a function, remove it
2. **Respect the user's workspace** - The plugin should enhance, not dominate
3. **Prioritize speed** - Fast interactions feel professional
4. **Maintain consistency** - Small deviations break the illusion

Remember: The best UI is one the user doesn't notice because it just works.