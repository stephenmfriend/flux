# Flux Design System

This document outlines the consistent design patterns used across all pages in the Flux application, extracted from the mockup HTML files.

## Overview

All UI components follow an 8px grid system and use consistent spacing, colors, and typography from the CSS custom properties defined in `theme.css`.

## CSS File Structure

- `src/styles/theme.css` - CSS custom properties (colors, spacing, shadows, etc.)
- `src/styles/design-system.css` - Reusable component classes
- `src/index.css` - Imports design system and Tailwind config

## Design Tokens

### Spacing (8px grid)
- 8px, 16px, 24px, 32px, 48px
- Content area padding: `24px`
- Gap between toolbar items: `12px`
- Gap between sections: `24px`

### Common Components Usage

**Page Header:**
```tsx
<div className="page-header">
  <div className="page-title">
    <h1>Page Title</h1>
    <div className="page-title-divider"></div>
  </div>
</div>
```

**Buttons:**
- Primary: `<button className="btn">Text</button>`
- Secondary: `<button className="btn-secondary">Text</button>`
- Icon: `<button className="btn-icon">Icon</button>`

**Search:** `<input className="search-input" />`

See source file for complete documentation.
