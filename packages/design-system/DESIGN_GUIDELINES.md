# Design System Guidelines

## Atomic Design Methodology

This design system follows **Atomic Design** principles with strict component hierarchy rules.

## Component Categories

### 1. Atoms (Primitives)

**Definition:** Smallest UI elements with ZERO custom component dependencies.

**Rules:**
- ✅ Can use HTML elements only (div, span, button, input, svg)
- ✅ Can import own CSS file
- ✅ Can use Preact hooks (useState, useEffect)
- ❌ CANNOT import other custom components
- ❌ CANNOT have complex business logic
- ❌ CANNOT make API calls

**Examples:**
- `Button` - Base button with variants (primary/secondary)
- `StatusDot` - 8px colored dot indicator
- `Badge` - Pill-shaped label (green/gray)
- `SearchInput` - Text input with search styling
- `Tag` - Small colored label for categories

**File Structure:**
```
src/components/Button/
├── Button.tsx         // Component code
├── Button.css         // Scoped styles
├── Button.stories.tsx // Storybook stories
└── index.ts          // Exports
```

**Story Title:** `'Atoms/ComponentName'`

**Story Requirements:**
```tsx
export default {
  title: 'Atoms/Button',
  component: Button,
}

// Show ALL variants
export const Primary = () => <Button variant="primary">Save</Button>
export const Secondary = () => <Button variant="secondary">Cancel</Button>
export const Disabled = () => <Button disabled>Disabled</Button>
export const WithIcon = () => (
  <Button>
    <Icon />
    Text
  </Button>
)

// Show all states together
export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '16px' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button disabled>Disabled</Button>
  </div>
)
```

---

### 2. Molecules (Composites)

**Definition:** Components built by combining 2+ atoms or simple HTML patterns.

**Rules:**
- ✅ Can import and use Atoms
- ✅ Can import other Molecules (carefully - avoid deep nesting)
- ✅ Add layout/arrangement logic
- ✅ Can have simple interaction logic
- ❌ CANNOT import Organisms or Templates
- ❌ CANNOT have complex state management
- ❌ CANNOT make API calls

**Examples:**
- `ColumnHeader` = StatusDot + text + count badge
- `TaskCard` = TaskProgress + AvatarStack + Tag + buttons
- `BoardHeader` = SearchInput + Button + view toggle
- `KanbanColumn` = ColumnHeader + AddTaskButton + task list

**Dependency Check:**
```tsx
// ✅ GOOD - Molecule uses Atoms
import { Button } from '../Button'
import { SearchInput } from '../SearchInput'

export function BoardHeader() {
  return (
    <div>
      <SearchInput />
      <Button>Filter</Button>
    </div>
  )
}

// ❌ BAD - Atom importing Molecule
// In Button.tsx
import { BoardHeader } from '../BoardHeader' // ❌ WRONG DIRECTION
```

**Story Title:** `'Molecules/ComponentName'`

**Story Requirements:**
```tsx
export default {
  title: 'Molecules/TaskCard',
  component: TaskCard,
}

// Show component with different data
export const Default = () => (
  <TaskCard 
    title="Implement authentication"
    description="Add OAuth2 login flow"
    progress={{ completed: 2, total: 4 }}
    tags={['Backend', 'Security']}
  />
)

// Show different states
export const NoProgress = () => <TaskCard title="Simple task" />
export const WithTags = () => <TaskCard title="Task" tags={['UX', 'Frontend']} />

// Show with real data
export const AllStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
    <TaskCard {...defaultProps} />
    <TaskCard {...noProgressProps} />
    <TaskCard {...withTagsProps} />
  </div>
)
```

---

### 3. Organisms (Sections)

**Definition:** Complex UI sections that form distinct parts of a page.

**Rules:**
- ✅ Can import Atoms and Molecules
- ✅ Can have complex interaction logic
- ✅ Can manage local state
- ✅ Can handle form submission
- ❌ CANNOT make direct API calls (use props/callbacks)
- ❌ Should not be deeply nested

**Examples:**
- `KanbanBoard` = Multiple KanbanColumns arranged
- `Sidebar` = Navigation with groups and items
- `Header` = Top header with breadcrumbs and actions
- `TaskModal` = Full modal with form and actions

**Story Title:** `'Organisms/ComponentName'`

**Story Requirements:**
```tsx
export default {
  title: 'Organisms/KanbanBoard',
  component: KanbanBoard,
}

// Show organism in context
export const WithTasks = () => (
  <KanbanBoard>
    <KanbanColumn status="todo" label="To Do" count={3}>
      <TaskCard {...task1} />
      <TaskCard {...task2} />
    </KanbanColumn>
    <KanbanColumn status="in_progress" label="In Progress" count={2}>
      <TaskCard {...task3} />
    </KanbanColumn>
  </KanbanBoard>
)

// Show empty state
export const Empty = () => (
  <KanbanBoard>
    <KanbanColumn status="todo" label="To Do" count={0} />
  </KanbanBoard>
)
```

---

### 4. Templates (Layouts)

**Definition:** Page-level layouts that arrange organisms, molecules, and atoms.

**Rules:**
- ✅ Can import any lower-level components
- ✅ Define page structure and spacing
- ✅ Handle routing concerns
- ✅ Can manage global state (via context/props)
- ✅ Define responsive breakpoints

**Examples:**
- `AppLayout` = Sidebar + Header + content wrapper
- `DashboardLayout` = Layout for dashboard pages
- `AuthLayout` = Layout for login/signup pages

**Story Title:** `'Templates/ComponentName'`

**Story Requirements:**
```tsx
export default {
  title: 'Templates/AppLayout',
  component: AppLayout,
}

// Show full layout with content
export const Default = () => (
  <AppLayout 
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' }
    ]}
  >
    <BoardHeader title="Project Name" />
    <p>Page content goes here...</p>
  </AppLayout>
)

// Show different page types
export const WithBetStrip = () => (
  <AppLayout breadcrumbs={[...]}>
    <BoardHeader title="Epic" />
    <BetControlStrip {...betData} />
    <KanbanBoard>...</KanbanBoard>
  </AppLayout>
)
```

---

## Dependency Rules (CRITICAL)

### The One-Way Flow Rule

**Dependencies ONLY flow downward, NEVER upward:**

```
Templates
   ↓ (can import)
Organisms
   ↓ (can import)
Molecules
   ↓ (can import)
   Atoms
   ↓ (can ONLY import)
HTML/CSS
```

### Violations (Auto-Fail Code Review)

```tsx
// ❌ WRONG: Atom importing Molecule
// In StatusDot.tsx
import { ColumnHeader } from '../ColumnHeader' // ❌ FAILS

// ❌ WRONG: Molecule importing Organism
// In TaskCard.tsx
import { KanbanBoard } from '../KanbanBoard' // ❌ FAILS

// ❌ WRONG: Creating unnecessary variants
// FilterButton.tsx (separate component)
export function FilterButton() { ... } // ❌ Use Button with props instead

// ✅ CORRECT: Use base component with composition
<Button onClick={handleFilter}>
  <FilterIcon />
  Filter
</Button>
```

---

## Storybook Organization

### Sidebar Structure
```
📁 Atoms
  ├── Badge
  ├── Button
  ├── SearchInput
  ├── StatusDot
  └── Tag
📁 Molecules
  ├── BoardHeader
  ├── ColumnHeader
  ├── TaskCard
  └── TaskProgress
📁 Organisms
  ├── Header
  ├── KanbanBoard
  └── Sidebar
📁 Templates
  └── AppLayout
```

### Story Naming Conventions

```tsx
// ✅ GOOD: Descriptive, shows state/variant
export const Primary = () => ...
export const WithIcon = () => ...
export const AllVariants = () => ...

// ❌ BAD: Generic, unclear
export const Test = () => ...
export const Example = () => ...
export const Story1 = () => ...
```

---

## CSS Guidelines

### Scoped Styles

Each component has its own CSS file:

```css
/* Button.css */
.btn {
  /* Base styles - EXACT from mockup */
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--brand-primary);
  color: #000;
}

.btn-primary:hover {
  background: var(--brand-primary-dark);
}
```

### CSS Variable Usage

Always use CSS custom properties, never hardcoded values:

```css
/* ❌ BAD */
.card {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  padding: 20px;
}

/* ✅ GOOD */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: var(--space-lg);
}
```

### No Inline Styles (Exception: Dynamic Values)

```tsx
// ❌ BAD: Static styles inline
<div style={{ padding: '20px', background: '#1c1c1c' }}>

// ✅ GOOD: Use CSS classes
<div className="card">

// ✅ OK: Dynamic values only
<div style={{ width: `${progress}%` }}>
<div style={{ background: avatarColor }}>
```

---

## Component Development Workflow

### 1. Identify Atomic vs Composite

**Ask these questions:**
- Does it import other custom components? → Not an Atom
- Could it be reused in different contexts? → Probably Atom or Molecule
- Does it represent a page section? → Organism
- Does it define page layout? → Template

### 2. Find Mockup Reference

```bash
# Find HTML structure
grep -n "class="component-name"" mockui/flux.html

# Find CSS styles
grep -n ".component-name" mockui/flux_supabase.css -A 10
```

### 3. Copy EXACT Values

**DO:**
- Copy padding, margins, colors, font sizes EXACTLY
- Use exact border-radius values
- Copy exact box-shadow values
- Keep exact transition timings

**DON'T:**
- Round values (8px stays 8px, not 10px)
- Substitute colors (#2e2e2e stays #2e2e2e, not #333)
- Add extra spacing/padding
- Change font weights

### 4. Create All Files

```bash
ComponentName/
├── ComponentName.tsx       # Component logic
├── ComponentName.css       # Exact mockup styles
├── ComponentName.stories.tsx # All variants
└── index.ts               # Exports
```

### 5. Write Stories BEFORE Integration

- Build component in isolation
- Verify visual match to mockup in Storybook
- Test all props/variants
- Only then export and use in app

### 6. Export from index.ts

```typescript
// src/components/index.ts
export * from './Button'
export * from './StatusDot'
// ... etc
```

---

## Testing Checklist

Before marking component as done:

- [ ] Component renders in Storybook without errors
- [ ] All variants have stories
- [ ] Visual comparison to mockup is pixel-perfect
- [ ] CSS values match mockup exactly (no rounding)
- [ ] Component is in correct category (Atom/Molecule/Organism/Template)
- [ ] No dependency rule violations
- [ ] No inline styles (except dynamic values)
- [ ] Uses CSS custom properties
- [ ] TypeScript types are correct
- [ ] Build passes: `bun run build`

---

## Anti-Patterns to Avoid

### ❌ Creating Specific Button Variants

```tsx
// ❌ DON'T create separate components
export function FilterButton() { ... }
export function SyncButton() { ... }
export function SaveButton() { ... }

// ✅ DO use base component with composition
<Button onClick={handleFilter}>
  <FilterIcon />
  Filter
</Button>

<Button onClick={handleSync}>
  <SyncIcon />
  Sync
</Button>
```

### ❌ Deep Component Nesting

```tsx
// ❌ Too deep (4+ levels)
Component A imports B imports C imports D imports E

// ✅ Flat composition
Component A imports B, C, D directly
```

### ❌ Business Logic in Atoms

```tsx
// ❌ In Button.tsx (Atom)
export function Button({ onClick }) {
  const handleClick = async () => {
    const data = await fetch('/api/tasks') // ❌ NO API calls
    updateGlobalState(data) // ❌ NO state management
  }
  
  return <button onClick={handleClick}>...</button>
}

// ✅ Pass handlers via props
export function Button({ onClick }) {
  return <button onClick={onClick}>...</button>
}
```

### ❌ Importing Mockup Files

```tsx
// ❌ NEVER import from mockui
import styles from '../../../mockui/flux_supabase.css'

// ✅ Copy CSS to component file
import './Button.css'
```

---

## Quick Reference

| Category | Imports | Example | Story Title |
|----------|---------|---------|-------------|
| Atom | HTML only | Button, Badge | `Atoms/Button` |
| Molecule | Atoms, Molecules | TaskCard, ColumnHeader | `Molecules/TaskCard` |
| Organism | Atoms, Molecules | KanbanBoard, Sidebar | `Organisms/KanbanBoard` |
| Template | Any below | AppLayout | `Templates/AppLayout` |

---

## Review Criteria

**Automatic rejection if:**
- Component imports upward in hierarchy
- Inline styles for static values
- Hardcoded colors/spacing (not CSS vars)
- Missing Storybook stories
- Wrong category in Storybook
- CSS values don't match mockup

**Approval requires:**
- Pixel-perfect visual match
- All variants documented in stories
- Clean dependency graph
- TypeScript compilation succeeds
- No console errors in Storybook

---

*Last updated: 2026-01-23*
*Design system version: 0.1.0*
