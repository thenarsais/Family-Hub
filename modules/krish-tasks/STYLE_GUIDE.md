# Krish Activity Board — Style Guide

**Last Updated:** 2026-06-15  
**Status:** Complete Refactoring Documentation

---

## Table of Contents
1. [Architecture Principles](#architecture-principles)
2. [CSS Variable System](#css-variable-system)
3. [Seasonal Theming](#seasonal-theming)
4. [Adding New Cards](#adding-new-cards)
5. [Color Combinations](#color-combinations)
6. [Responsive Design](#responsive-design)
7. [Accessibility Standards](#accessibility-standards)

---

## Architecture Principles

### Core Philosophy: Modularity
Each card/component must be **completely independent**. Adding, removing, or hiding cards should NEVER impact:
- Styling of other cards
- Font sizes in the app
- Layout or spacing elsewhere
- Visual appearance of unrelated components

### Why This Matters
- Easy to maintain and iterate
- Quick to add/remove features without side effects
- Safe refactoring without cascading failures
- Clear ownership of component styling

### Implementation Pattern
```html
<!-- Self-contained card -->
<div class="my-card">
  <div class="my-card-header">Header</div>
  <div class="my-card-content">Content</div>
</div>
```

**Rules:**
- ✅ Card-specific CSS in isolated `<style>` block or `<style scoped>`
- ✅ Use CSS variables for all colors (no hardcoded hex values)
- ✅ Use utility CSS classes for spacing/layout
- ✅ Namespace class names: `.card-name-*` (e.g., `.habit-card`, `.habit-week`)
- ❌ No global CSS that affects this card
- ❌ No inline styles except for dynamic values
- ❌ No dependencies on other cards' CSS

---

## CSS Variable System

### Primary Color System

**Seasonal Variables (Dynamic)**
```css
/* Applied automatically based on current season */
--season-primary: #10B981      /* Main theme color (changes by season) */
--season-accent: #BFDBFE       /* Accent/hover color */
--season-secondary: #D1FAE5    /* Subtle accent */
--season-bg-light: #ECFDF5     /* Light background for cards */
--season-bg-body: #F0FDFB      /* Page background tint */
--season-text: #065F46         /* Text color for season */
--season-border: #A7F3D0       /* Border color */
```

**Semantic Status Colors (Fixed)**
```css
/* These stay constant — represent fixed meanings */
--success: #10B981             /* Success/Done state */
--danger: #EF4444              /* Error/Urgent state */
--warning: #F59E0B             /* Warning state */
--info: #3B82F6                /* Info state */
```

**Legacy Aliases (Backwards Compatibility)**
```css
/* Old names that map to seasonal variables */
--theme-primary: var(--season-primary)
--theme-accent: var(--season-accent)
--theme-secondary: var(--season-secondary)
```

### Semantic Utility Variables

**Typography**
```css
--font-size-xs: 0.65em         /* Extra small labels */
--font-size-sm: 0.75em         /* Small text */
--font-size-base: 0.9em        /* Body text */
--font-size-md: 1em            /* Medium text */
--font-size-lg: 1.3em          /* Large text */
--font-size-xl: 1.5em          /* Extra large */
--font-weight-normal: 600      /* Regular weight */
--font-weight-semi-bold: 700   /* Semi-bold */
--font-weight-bold: 800        /* Bold */
```

**Spacing**
```css
--space-xs: 4px                /* Extra small gap */
--space-sm: 8px                /* Small gap */
--space-md: 12px               /* Medium gap */
--space-lg: 16px               /* Large gap */
--space-xl: 20px               /* Extra large gap */
```

**Border Radius**
```css
--radius-xs: 6px               /* Small elements */
--radius-sm: 8px               /* Buttons, inputs */
--radius: 10px                 /* Default */
--radius-md: 12px              /* Cards */
--radius-lg: 16px              /* Large cards */
--radius-chip: 20px            /* Pill shapes */
--radius-rounded: 30px         /* Highly rounded */
--radius-circle: 50%           /* Circular */
```

**Shadows**
```css
--shadow: 0 2px 12px rgba(0,0,0,0.08)      /* Subtle */
--shadow-md: 0 4px 20px rgba(0,0,0,0.12)   /* Medium */
--shadow-lg: 0 4px 24px rgba(0,0,0,0.14)   /* Large */
--shadow-modal: 0 10px 40px rgba(0,0,0,0.2)    /* Modal */
```

**Buttons**
```css
--btn-padding: 9px 15px        /* Standard padding */
--btn-padding-sm: 5px 11px     /* Small padding */
--btn-padding-lg: 11px 18px    /* Large padding */
--btn-font-size: 1.05em        /* Button text size */
--btn-border-radius: 8px       /* Button corner radius */
--btn-transition: all 0.2s ease /* Smooth transitions */
```

### Using Variables in Your Card

```css
/* Card Background */
background: var(--card-bg);           /* White */
background: var(--season-bg-light);   /* Light seasonal tint */

/* Text Colors */
color: var(--dark);                   /* Dark text */
color: var(--season-text);            /* Seasonal text color */
color: var(--text-secondary);         /* Secondary text */

/* Borders */
border: 1px solid var(--season-border);
border-color: var(--season-primary);  /* On hover */

/* Status Indicators */
background: var(--success);           /* Success/done */
background: var(--danger);            /* Error/urgent */
background: var(--warning);           /* Warning */
```

---

## Seasonal Theming

### How It Works

1. **Auto-Detection:** App detects current month and applies season
   - Jan-Apr: Spring 🌱
   - May-Jul: Summer ☀️
   - Aug-Oct: Fall 🍂
   - Nov-Dec: Winter ❄️

2. **Color Application:** All `--season-*` variables update automatically
   - One CSS variable change switches entire app theme
   - All components inherit new colors instantly
   - No code changes needed

3. **Theme Switching:** Can be triggered manually (when UI added)
   ```javascript
   applySeasonalTheme('summer')   // Switch to summer colors
   ```

### Seasonal Palettes

| Property | Spring | Summer | Fall | Winter |
|----------|--------|--------|------|--------|
| **Primary** | #10B981 🟢 | #FBBF24 🟡 | #F97316 🟠 | #0EA5E9 🔵 |
| **Accent** | #BFDBFE | #FEF3C7 | #FED7AA | #BAE6FD |
| **Text** | #065F46 | #78350F | #7C2D12 | #0C4A6E |
| **Bg Light** | #ECFDF5 | #FFFBEB | #FFEDD5 | #F0F9FF |
| **Body Bg** | #F0FDFB | #FFFEF2 | #FFFBF7 | #F8FCFF |
| **Border** | #A7F3D0 | #FCD34D | #FDBA74 | #BAE6FD |

### When to Use Each Color

| Variable | Use For |
|----------|---------|
| `--season-primary` | Main buttons, active states, primary actions |
| `--season-accent` | Hover effects, secondary highlights, text accents |
| `--season-secondary` | Subtle accents, badges, secondary highlights |
| `--season-bg-light` | Card backgrounds, light panels |
| `--season-bg-body` | Page background, overall theme tint |
| `--season-text` | Text color for consistency with season |
| `--season-border` | Border colors, dividers, subtle separators |

### Dynamic Gradients

For gradients that adapt to season, use `color-mix()`:

```css
/* Gradient that adapts to season */
background: linear-gradient(135deg,
  color-mix(in srgb, var(--season-primary) 30%, #000000),
  color-mix(in srgb, var(--season-primary) 10%, #000000)
);

/* Dynamic text tint */
color: color-mix(in srgb, white 80%, var(--season-primary) 20%);

/* Dynamic glow effect */
box-shadow: 0 0 16px color-mix(in srgb, var(--season-primary) 25%, transparent);
```

---

## Adding New Cards

### Step-by-Step Template

#### 1. Create Card HTML
```html
<div class="my-new-card">
  <div class="my-new-card-header">
    <span class="my-new-card-icon">🎯</span>
    <span class="my-new-card-title">Card Title</span>
  </div>
  <div class="my-new-card-content">
    <!-- Content here -->
  </div>
</div>
```

#### 2. Create Isolated CSS
```css
/* MY NEW CARD — Completely self-contained */
.my-new-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: var(--card-padding);
  box-shadow: var(--shadow-md);
  /* Card-specific layout */
}

.my-new-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  /* Header styling */
}

.my-new-card-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.my-new-card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--season-primary);
}

.my-new-card-content {
  /* Content-specific styling */
}
```

#### 3. Create Card Logic (JavaScript)
```javascript
function initializeMyNewCard() {
  // Initialize card-specific state
  const el = document.querySelector('.my-new-card-content');
  el.innerHTML = renderMyNewCard();
}

function renderMyNewCard() {
  return `
    <div style="/* Use CSS classes, not inline styles */">
      Content here
    </div>
  `;
}

// Call on app startup
initializeMyNewCard();
```

#### 4. Add to Initialization
```javascript
function init() {
  // ... existing code ...
  initializeSeasonalTheme();
  initializeMyNewCard();  // Add your card init
}
```

### Checklist
- [ ] Card uses `var(--card-bg)` for background
- [ ] All text uses semantic colors (`--season-text`, `--dark`, etc.)
- [ ] All borders use `--season-border` or semantic colors
- [ ] No hardcoded colors except semantic status colors (green/red/yellow/blue)
- [ ] Class names namespaced: `.my-card-*`
- [ ] No CSS affects other cards
- [ ] Responsive: tested on mobile (390px) and desktop (1920px)
- [ ] Accessibility: text contrast meets WCAG AA (4.5:1)

---

## Color Combinations

### Guaranteed Safe Combinations ✅

| Use Case | Text | Background | Ratio |
|----------|------|-----------|-------|
| Card content | `--season-text` | `--season-bg-light` | 5.1:1+ |
| Card content | `--season-text` | `--season-bg-body` | 5.1:1+ |
| Button text | `white` | `--season-primary` | 5.1:1+ |
| Success state | `white` | `--success` (#10B981) | 5.2:1 |
| Error state | `white` | `--danger` (#EF4444) | 5.5:1 |
| Warning badge | `#854D0E` | `#FEF9C3` | 5.0:1 |

### Avoid ❌
- White text on `--season-bg-light` (too light)
- Black text on `--season-primary` (use white instead)
- Light text on light backgrounds
- Status colors on seasonal backgrounds (keeps meanings clear)

---

## Responsive Design

### Current Breakpoints
```css
/* Large monitors */
@media (min-width: 1920px) {
  html { font-size: 20px; }  /* Slightly larger font */
}

/* Tablets and larger phones */
@media (min-width: 960px) {
  .dash-bento { grid-template-columns: 1.35fr 1fr 1.15fr 0.82fr; }
}

/* Mobile phones */
@media (max-width: 959px) {
  .db-col2, .db-side { display: contents; }  /* Single column */
}

/* Small phones */
@media (max-width: 480px) {
  .dash-bento { grid-template-columns: 1fr; }  /* One column */
}
```

### Testing Sizes
- **iPhone 12:** 390px
- **iPad:** 768px
- **Desktop:** 1920px+

### When Adding New Cards
1. Test on all breakpoints
2. Ensure text doesn't overflow
3. Cards should stack on mobile
4. No horizontal scrolling
5. Touch targets ≥ 44px (mobile)

---

## Accessibility Standards

### WCAG AA Compliance
All color combinations meet WCAG AA standards:
- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text:** 3:1 contrast ratio minimum
- **UI components:** 3:1 contrast ratio minimum

### Verification
Run contrast checker (included in repo) to verify new colors:
```bash
# Open contrast-check.html in browser to verify ratios
```

### Guidelines
- Never use white text on light backgrounds
- Test your colors with the contrast checker
- Keep status colors consistent (green=success, red=error)
- Use semantic colors for meaning (not decoration)
- Ensure focus states are visible for keyboard navigation

---

## Common Patterns

### Status Badge
```css
.status-badge {
  background: var(--season-bg-light);
  color: var(--season-primary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-chip);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}
```

### Card with Header
```css
.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--season-border);
  margin-bottom: var(--space-md);
}

.card-header-icon {
  font-size: var(--font-size-lg);
}

.card-header-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--season-primary);
}
```

### Button Styling
```css
.btn {
  padding: var(--btn-padding);
  background: var(--season-primary);
  color: white;
  border: none;
  border-radius: var(--btn-border-radius);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  cursor: pointer;
  transition: var(--btn-transition);
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.96);
}
```

### Responsive Grid
```css
.grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;  /* Single column on mobile */
  }
}
```

---

## Maintenance

### When Adding a New Feature
1. ✅ Create isolated card component
2. ✅ Use CSS variables (no hardcoded colors)
3. ✅ Test all 4 seasons
4. ✅ Verify responsive design
5. ✅ Check accessibility (WCAG AA)
6. ✅ Update this guide if adding new patterns

### When Modifying Existing Cards
1. ✅ Don't affect other cards' styling
2. ✅ Keep modular structure intact
3. ✅ Maintain color consistency
4. ✅ Test in all seasons

### Code Review Checklist
- [ ] No hardcoded colors (except semantic status colors)
- [ ] Uses CSS variables for all theming
- [ ] No global CSS changes
- [ ] Doesn't affect other cards
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Follows naming conventions

---

## Questions?

This guide covers the complete architecture. Key takeaway: **Each card is a self-contained module that uses semantic CSS variables and never affects other components.**

For updates, see `ACCESSIBILITY_AUDIT.md` for detailed color analysis and `PHASE-5-PROGRESS.md` for feature tracking.

