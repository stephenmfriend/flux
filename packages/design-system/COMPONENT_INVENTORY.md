# Design System Component Inventory

## Current Structure (Atomic Design Compliant)

### Atoms (8 components)
Primitives with NO custom component dependencies.

| Component | Purpose | Props | Mockup Reference |
|-----------|---------|-------|------------------|
| **StatusDot** | 8px colored status indicator | `status: 'planning' | 'todo' | 'in_progress' | 'done'` | flux_supabase.css:382-406 |
| **AddTaskButton** | Dashed ghost button for adding tasks | `onClick?: () => void` | flux_supabase.css:409-437 |
| **TaskProgress** | Progress bar with segments | `completed: number, total: number` | flux_supabase.css:563-603 |
| **Tag** | Small colored category label | `color: 'purple' | 'blue' | 'orange' | 'green' | 'red'` | flux_supabase.css:491-522 |
| **AvatarStack** | Overlapping avatar circles | `avatars: Avatar[]` | flux_supabase.css:631-647 |
| **Button** | Base button component | `variant?: 'primary' | 'secondary'` | flux_supabase.css:288-319 |
| **SearchInput** | Search text input with focus states | `value?: string, onChange?: (value: string) => void` | flux_supabase.css:268-286 |
| **Badge** | Pill-shaped badge | `color: 'green' | 'gray'` | flux_supabase.css:82-102 |

### Molecules (5 components)
Composite components built from atoms.

| Component | Uses | Purpose | Mockup Reference |
|-----------|------|---------|------------------|
| **ColumnHeader** | StatusDot | Kanban column header with dot, label, count | flux_supabase.css:343-379 |
| **BetControlStrip** | - | Bet control strip with scope, appetite, hill slider | flux.html:171-267 |
| **TaskCard** | TaskProgress, AvatarStack, Tag | Full task card with all details | flux_supabase.css:450-667 |
| **BoardHeader** | SearchInput, Button | Page header with search and actions | flux_supabase.css:234-261 |
| **KanbanColumn** | ColumnHeader, AddTaskButton | Kanban column container | flux.html:273-338 |

### Organisms (3 components)
Complex sections combining molecules and atoms.

| Component | Uses | Purpose | Mockup Reference |
|-----------|------|---------|------------------|
| **KanbanBoard** | KanbanColumn | Flex container for kanban columns | flux_supabase.css:322-328 |
| **Sidebar** | - | Navigation sidebar with brand and groups | flux_supabase.css:105-165 |
| **Header** | Badge | Glass-effect header with breadcrumbs | flux_supabase.css:176-223 |

### Templates (1 component)
Page-level layout structures.

| Component | Uses | Purpose | Mockup Reference |
|-----------|------|---------|------------------|
| **AppLayout** | Sidebar, Header | Main app layout wrapper | flux_supabase.css:48-231 |

---

## Storybook Structure

When you run `bun run dev` in the design-system package, you'll see:

```
📁 Atoms (8)
  ├── AddTaskButton     - Dashed add button
  ├── AvatarStack       - Overlapping avatars
  ├── Badge             - Green/gray pills
  ├── Button            - Primary/secondary buttons
  ├── SearchInput       - Search text field
  ├── StatusDot         - Colored status dots
  ├── Tag               - Category labels
  └── TaskProgress      - Progress bar segments

📁 Molecules (5)
  ├── BetControlStrip   - Bet control panel
  ├── BoardHeader       - Page header with actions
  ├── ColumnHeader      - Kanban column header
  ├── KanbanColumn      - Column with tasks
  └── TaskCard          - Full task card

📁 Organisms (3)
  ├── Header            - Top app header
  ├── KanbanBoard       - Full kanban board
  └── Sidebar           - Navigation sidebar

📁 Templates (1)
  └── AppLayout         - Main layout wrapper
```

---

## Dependency Graph

```
AppLayout (Template)
├── Sidebar (Organism)
├── Header (Organism)
│   └── Badge (Atom)
└── [Content Children]
    ├── BoardHeader (Molecule)
    │   ├── SearchInput (Atom)
    │   └── Button (Atom)
    ├── BetControlStrip (Molecule)
    └── KanbanBoard (Organism)
        └── KanbanColumn (Molecule)
            ├── ColumnHeader (Molecule)
            │   └── StatusDot (Atom)
            ├── AddTaskButton (Atom)
            └── TaskCard (Molecule)
                ├── TaskProgress (Atom)
                ├── AvatarStack (Atom)
                └── Tag (Atom)
```

**✅ All dependencies flow downward only - NO circular dependencies**

---

## Build Output

```bash
dist/
├── index.js       # 20.14 kB (4.22 kB gzipped)
├── index.d.ts     # TypeScript definitions
└── style.css      # 9.39 kB (2.32 kB gzipped)
```

---

## Usage in App

```tsx
// Import from design system package
import {
  // Atoms
  Button,
  StatusDot,
  Badge,
  SearchInput,
  Tag,
  TaskProgress,
  AvatarStack,
  AddTaskButton,
  
  // Molecules
  ColumnHeader,
  BoardHeader,
  TaskCard,
  KanbanColumn,
  BetControlStrip,
  
  // Organisms
  KanbanBoard,
  Sidebar,
  Header,
  
  // Templates
  AppLayout
} from '@flux/design-system'

// Use in pages
export function BetPage() {
  return (
    <AppLayout breadcrumbs={[...]}>
      <BoardHeader title="Q3 Migration" />
      <BetControlStrip {...betData} />
      <KanbanBoard>
        <KanbanColumn status="todo" label="To Do" count={3}>
          <TaskCard {...task1} />
          <TaskCard {...task2} />
        </KanbanColumn>
      </KanbanBoard>
    </AppLayout>
  )
}
```

---

## Compliance Checklist

- ✅ All atoms have NO custom component dependencies
- ✅ All molecules import only atoms or other molecules
- ✅ All organisms import atoms and molecules only
- ✅ Templates can import any lower-level components
- ✅ NO upward dependencies (atom importing molecule, etc.)
- ✅ All CSS values copied EXACTLY from mockup
- ✅ All components have Storybook stories
- ✅ All components organized by Atomic Design category
- ✅ Build passes with no TypeScript errors
- ✅ Design guidelines documented in DESIGN_GUIDELINES.md

---

## Next Steps

1. **View in Storybook:**
   ```bash
   cd packages/design-system
   bun run dev  # Opens on http://localhost:6006
   ```

2. **Build Design System:**
   ```bash
   cd packages/design-system
   bun run build
   ```

3. **Use in Web App:**
   ```tsx
   import { AppLayout, BoardHeader, KanbanBoard } from '@flux/design-system'
   ```

4. **Add New Components:**
   - Read DESIGN_GUIDELINES.md first
   - Follow brick-by-brick extraction from mockup
   - Categorize correctly (Atom/Molecule/Organism/Template)
   - Build in Storybook BEFORE app integration

---

*Generated: Fri Jan 23 01:02:23 AEST 2026*
*Design System Version: 0.1.0*
