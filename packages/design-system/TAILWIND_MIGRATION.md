# Tailwind CSS Foundation - Complete

## What Was Done

### 1. Installed Tailwind v3 Stable + Utilities
```bash
tailwindcss@3.4.19        # Stable, production-proven
postcss@8.5.6             # CSS processor
autoprefixer@10.4.23      # Browser prefixes
class-variance-authority  # CVA for variant management
clsx                      # Conditional classes
tailwind-merge            # Merge conflicting classes
```

### 2. Created Tailwind Config with Flux Design Tokens
**File:** `tailwind.config.js`

All Flux CSS custom properties mapped to Tailwind utilities:
- `bg-brand-primary` → `var(--color-brand-primary)`
- `text-high` → `var(--color-text-high)`
- `border-default` → `var(--color-border-default)`
- etc.

### 3. Created CSS Foundation
**File:** `src/styles/tailwind.css`

- Tailwind base, components, utilities layers
- All Flux design tokens in `:root`
- Global styles (scrollbar hiding, font smoothing)
- Dark theme by default

### 4. Converted Button to shadcn/Tailwind Pattern
**File:** `src/components/Button/Button.tsx`

**Before (Custom CSS):**
```tsx
<button className="btn btn-default btn-lg">
```

**After (Tailwind + CVA):**
```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 ...',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary text-black hover:bg-brand-primary-dark',
        destructive: 'bg-destructive text-white ...',
        // ...
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
  }
)
```

### 5. Created Utility Helper
**File:** `src/lib/utils.ts`

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Handles:
- Conditional classes: `cn('btn', isActive && 'bg-active')`
- Tailwind conflicts: `cn('px-4', className)` - className wins

### 6. Updated Tests
Changed from checking custom class names to checking Tailwind utilities:
- `toHaveClass('btn-default')` → `toHaveClass('bg-brand-primary')`
- ✅ All 26 tests passing

## Architecture Benefits

### ✅ No Inline Calc() or Overrides
All values are static or reference CSS custom properties:
```tsx
// ✅ Clean
'h-8 px-3'

// ❌ NOT used
'h-[calc(2rem + 3px)]'
```

### ✅ CSS Custom Properties + Tailwind
Best of both worlds:
- **Tailwind utilities** for layout, spacing, typography
- **CSS variables** for themeable colors, shadows, radii
- **Change theme** by updating `:root` variables

### ✅ shadcn/ui Pattern
Using industry-standard patterns:
- **CVA** for variant management
- **cn()** for class merging
- **Composable** - easy to extend

### ✅ Framework Agnostic
Design system can be used with:
- Preact (current)
- React
- Vue
- Svelte
- Any framework that supports utility classes

## Usage for New Components

### Pattern to Follow:

```tsx
import { h } from 'preact'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const componentVariants = cva(
  // Base classes - always applied
  'flex items-center gap-2',
  {
    variants: {
      variant: {
        default: 'bg-bg-surface text-text-high',
        primary: 'bg-brand-primary text-black',
      },
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface MyComponentProps extends VariantProps<typeof componentVariants> {
  children: ComponentChildren
  className?: string
}

export function MyComponent({ variant, size, className, children }: MyComponentProps) {
  return (
    <div className={cn(componentVariants({ variant, size }), className)}>
      {children}
    </div>
  )
}
```

## Available Tailwind Classes

### Colors
- `bg-brand-primary` `bg-brand-primary-dark`
- `bg-bg-base` `bg-bg-surface` `bg-bg-surface-hover`
- `text-text-high` `text-text-medium` `text-text-low`
- `border-border-subtle` `border-border-default` `border-border-focus`
- `bg-destructive` `bg-destructive-hover`
- `bg-status-planning` `bg-status-todo` `bg-status-progress` `bg-status-done`

### Border Radius
- `rounded-sm` `rounded-md` `rounded-lg` `rounded-xl`

### Shadows
- `shadow-card` `shadow-hover`

### Font Family
- `font-sans` - Already configured as Inter

## Testing Pattern

Check for Tailwind utility classes instead of custom classes:

```tsx
it('applies variant classes', () => {
  render(<Button variant="destructive">Delete</Button>)
  const button = screen.getByRole('button')
  expect(button).toHaveClass('bg-destructive')
  expect(button).toHaveClass('text-white')
})
```

## Next Steps

### Immediate:
1. Convert remaining components to Tailwind pattern:
   - Badge
   - StatusDot
   - Tag
   - (all others follow)

2. Remove old CSS files as components are converted

3. Document component patterns

### Future:
1. Add Tailwind plugins if needed:
   - `@tailwindcss/forms` for form components
   - `@tailwindcss/typography` for rich text

2. Consider Tailwind v4 when stable (better CSS var support)

3. Set up Storybook Tailwind addon for class inspection

## Verification

✅ Tailwind CSS compiling
✅ Storybook rendering with Tailwind
✅ Button using shadcn/CVA pattern
✅ All 26 tests passing
✅ No calc() or inline overrides
✅ CSS custom properties working
✅ Design tokens from Flux mockup

## Commands

All commands use `bun` as the package manager:

```bash
# Run Storybook dev server
bun run dev

# Run tests
bun run test
bun run test:run  # Once without watch
bun run test:ui   # With UI

# Validate 8pt grid
bun run validate:8pt

# Lint
bun run lint

# Pre-commit (runs all checks)
bun run precommit
```

## Status: FOUNDATION COMPLETE ✅

The design system now has a strong Tailwind + shadcn foundation that can be shaped to match the Flux design system while maintaining flexibility and industry best practices.
