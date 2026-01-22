# Flux Design System

A design system built with Preact, Storybook, and Vite, following Atomic Design methodology.

## Quick Start

```bash
# Install dependencies
bun install

# Start Storybook (development)
bun run dev
# Opens http://localhost:6006

# Build design system library
bun run build

# Build Storybook (static)
bun run build-storybook
```

## Testing

### Automated Unit Tests ✅

```bash
npm run test        # Watch mode
npm run test:run    # Run once
npm run test:ui     # Vitest UI
```

**Status:** ✅ **All 26 tests passing**

**Coverage:**
- Button (13 tests)
- Badge (5 tests)
- StatusDot (5 tests)
- Tag (3 tests)

**Technology:**
- Vitest + jsdom
- @testing-library/preact
- @testing-library/user-event

See [TEST_AUTOMATION_STATUS.md](./TEST_AUTOMATION_STATUS.md) for test patterns and examples.

### Manual QA Testing (Storybook)

```bash
bun run dev
# Opens http://localhost:6006
```

**Use for:**
- Visual validation against mockups
- Interactive prop testing (Controls panel)
- Event verification (Actions panel)
- Accessibility testing

## Project Structure

```
packages/design-system/
├── src/
│   ├── components/          # All components
│   │   ├── Button/          # Example component
│   │   │   ├── Button.tsx   # Component implementation
│   │   │   ├── Button.css   # Component styles
│   │   │   ├── Button.stories.tsx  # Storybook stories
│   │   │   ├── QA_ACTIONS_GUIDE.md # QA testing guide
│   │   │   └── QA_QUICK_REFERENCE.md
│   │   └── index.ts         # Component exports
│   ├── styles/
│   │   └── design-system.css  # Global design tokens
│   └── index.ts             # Main entry point
├── .storybook/              # Storybook configuration
├── vitest.config.ts         # Vitest test configuration
├── DESIGN_GUIDELINES.md     # Design system rules
├── COMPONENT_INVENTORY.md   # Component catalog
├── TESTING.md               # Testing guide
└── TESTING_STATUS.md        # Current test status
```

## Component Organization (Atomic Design)

```
Atoms/          # Basic building blocks (Button, Input, Badge)
Molecules/      # Simple compositions (ColumnHeader, TaskProgress)
Organisms/      # Complex compositions (Sidebar, KanbanBoard)
Templates/      # Page layouts (AppLayout)
```

**Dependency Rule:** Components can only import from lower levels (never upward).

## Adding New Components

1. **Create component directory:**
   ```
   src/components/MyComponent/
   ├── MyComponent.tsx
   ├── MyComponent.css
   └── MyComponent.stories.tsx
   ```

2. **Follow the template:**
   ```tsx
   import { h } from 'preact'
   import './MyComponent.css'

   export interface MyComponentProps {
     variant?: 'default' | 'primary'
     children: ComponentChildren
   }

   export function MyComponent({ variant = 'default', children }: MyComponentProps) {
     return <div className={`my-component my-component-${variant}`}>{children}</div>
   }
   ```

3. **Create stories with controls:**
   ```tsx
   import { h } from 'preact'
   import { MyComponent } from './MyComponent'
   import type { Meta, StoryObj } from '@storybook/preact'

   const meta: Meta<typeof MyComponent> = {
     title: 'Atoms/MyComponent',  // Use correct Atomic Design category
     component: MyComponent,
     argTypes: {
       variant: {
         control: 'select',
         options: ['default', 'primary'],
       },
     },
   }

   export default meta
   type Story = StoryObj<typeof MyComponent>

   export const Default: Story = {}
   ```

4. **Export from index:**
   ```tsx
   // src/components/index.ts
   export * from './MyComponent/MyComponent'
   ```

## Design Guidelines

See [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) for:
- Atomic Design rules
- CSS conventions
- Component development workflow
- Anti-patterns to avoid

## Usage in Apps

```tsx
// Install design system
bun add @flux/design-system

// Import components
import { Button, Input, Badge } from '@flux/design-system'

// Import styles (in your main file)
import '@flux/design-system/styles'

// Use components
<Button variant="default" size="lg">Click Me</Button>
```

## Documentation

- [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) - Design system methodology
- [COMPONENT_INVENTORY.md](./COMPONENT_INVENTORY.md) - All available components
- [TESTING.md](./TESTING.md) - Full testing guide
- [TESTING_STATUS.md](./TESTING_STATUS.md) - Current test status & troubleshooting
- [Button QA Guide](./src/components/Button/QA_ACTIONS_GUIDE.md) - Example QA workflow

## Contributing

1. Read [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)
2. Create component following Atomic Design principles
3. Add Storybook stories with Actions and Controls
4. Test manually in Storybook UI
5. Ensure pixel-perfect match to mockup
6. Submit PR with screenshots

## Tech Stack

- **Preact 10.24.3** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 5.4** - Build tool
- **Storybook 8.6** - Component development & documentation
- **Vitest 4.0** - Test framework with jsdom
- **Testing Library** - Component testing utilities
- **CSS Custom Properties** - Design tokens from mockui/flux_supabase.css
