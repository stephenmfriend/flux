# Button Component (Shadcn Pattern)

## Overview

The Button component follows Shadcn's design pattern with **6 variants** and **3 t-shirt sizes**.

## Props

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'default' | 'lg'
  onClick?: () => void
  children: ComponentChildren
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}
```

## Variants

| Variant | Use Case | Appearance |
|---------|----------|------------|
| `default` | Primary actions | Green background, black text |
| `destructive` | Delete, remove actions | Red background, white text |
| `outline` | Secondary actions | Transparent with border |
| `secondary` | Tertiary actions | Gray background |
| `ghost` | Minimal emphasis | Transparent, hover effect |
| `link` | Text links | Underlined text style |

## Sizes (T-Shirt)

| Size | Height | Padding | Font Size | Use Case |
|------|--------|---------|-----------|----------|
| `sm` | 32px | 0 12px | 13px | Compact spaces, tables |
| `default` | 40px | 0 16px | 14px | Standard forms, actions |
| `lg` | 48px | 0 24px | 16px | Hero CTAs, emphasis |

## Usage Examples

### Basic
```tsx
import { Button } from '@flux/design-system'

<Button>Click me</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small button</Button>
```

### With Icons
```tsx
<Button>
  <DownloadIcon />
  Download
</Button>

<Button variant="outline" size="sm">
  <SearchIcon />
</Button>
```

### All Size Variants
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### All Visual Variants
```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Disabled
```tsx
<Button disabled>Can't click</Button>
```

## Storybook

View all variants and sizes in Storybook:

```bash
cd packages/design-system
bun run dev
# Navigate to Atoms/Button
```

**Available stories:**
- `Default` - Default variant
- `Destructive` - Red delete button
- `Outline` - Outlined style
- `Secondary` - Gray background
- `Ghost` - Transparent style
- `Link` - Text link style
- `Small` - Small size
- `DefaultSize` - Default size
- `Large` - Large size
- `WithIcon` - Icon + text
- `IconOnly` - Just icon
- `Disabled` - Disabled state
- `AllSizes` - Size comparison
- `AllVariants` - Variant grid
- `VariantSizeCombos` - All combinations
- `Loading` - Loading spinner state

## Design Tokens

Uses CSS custom properties:
- `--brand-primary` - Default button background
- `--brand-primary-dark` - Default button hover
- `--bg-surface` - Secondary button background
- `--bg-surface-hover` - Hover backgrounds
- `--border-default` - Border colors
- `--text-high` - Primary text
- `--text-medium` - Secondary text

## Migration from Old Button

**Before:**
```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

**After:**
```tsx
<Button variant="default">Save</Button>
<Button variant="outline">Cancel</Button>
```

## Future Iteration

This is using Shadcn pattern as a starting point. Will be iterated to match exact mockup design:
- Exact padding values from mockui/flux_supabase.css
- Exact color values
- Exact hover states
- Any mockup-specific variants

## Related Components

- `SearchInput` - For search fields
- `Badge` - For labels/tags
- `Tag` - For categories
