# Design System Build Progress - Next Steps

## ✅ COMPLETED

### Phase 0: Package Setup
- ✅ Created `@flux/design-system` package
- ✅ Configured Storybook 8.0 with Preact
- ✅ Set up Vite build configuration
- ✅ Copied complete CSS from `mockui/flux_supabase.css`
- ✅ Added workspace dependency to web app

### Kanban Components (12 components)
- ✅ StatusDot - Status indicators with glowing effects
- ✅ AddTaskButton - Dashed ghost button for adding tasks
- ✅ ProgressBar - Segmented progress display
- ✅ Tag - Translucent colored tags
- ✅ AvatarStack - Overlapping avatar circles
- ✅ ColumnHeader - Column header with status dot, label, count
- ✅ TaskCard - Complete task card with all sections
- ✅ TaskHeader - Menu button section
- ✅ TaskProgress - Progress section using ProgressBar
- ✅ TaskFooter - Avatars, tags, meta section
- ✅ KanbanColumn - Full column with header, add button, task list
- ✅ KanbanBoard - Container for 4 columns

### Documentation
- ✅ Created COMPONENT_CATALOG.md with all 124 components identified
- ✅ All components mapped to line numbers in flux.html
- ✅ Build phases prioritized

## ✅ JUST COMPLETED

### Sidebar Component
- ✅ Sidebar.tsx - COMPLETE (created via Node.js script)
- ✅ Sidebar.css - COMPLETE
- ✅ Sidebar.stories.tsx - COMPLETE (5 story variants)
- ✅ index.ts - COMPLETE
- ✅ Exported from components/index.ts

**Resolution**: Used Node.js script to bypass shell heredoc issues with template literals

**Ready for testing in Storybook!**

## 📋 NEXT TO BUILD (Priority Order)

### Phase 1: Core Layout & Navigation (HIGH)

1. **Sidebar** (BLOCKED - file issue)
   - Location: `packages/design-system/src/components/Sidebar/`
   - Status: CSS + Stories done, TSX blocked
   - Lines: flux.html 16-75

2. **Header**
   - Glass-effect header with breadcrumbs
   - Lines: flux.html 79-106
   - Components: Header, Breadcrumb, Avatar

3. **BoardHeader**
   - Title + SearchBar + ViewToggle + Filter/Sync buttons
   - Lines: flux.html 111-167
   - Components: BoardHeader, SearchBar, ViewToggle, FilterButton, SyncButton

### Phase 2: Bet Control Strip (HIGH - Complex Component)

4. **BetControlStrip** (Parent container)
   - Lines: flux.html 170-267
   - Sub-components needed:
     - BetInfoGroup (scope, appetite sections)
     - HillSlider (draggable progress slider)
     - ScopeCutsCounter
     - Action buttons (History, Cut Scope, Edit Bet)

### Phase 3: Form & Input Foundation (HIGH - Reusable)

5. **Button Variants**
   - PrimaryButton, SecondaryButton, GhostButton, DangerButton
   - IconButton, CloseButton
   - Lines: Throughout flux.html

6. **Form Inputs**
   - Input, Textarea, Select, Checkbox, Radio
   - Lines: Modal sections (1100-1400)

7. **Advanced Inputs**
   - Chips/ChipSelector
   - RadioGroup
   - CheckboxList
   - Lines: Edit Bet Modal (1295-1332)

### Phase 4: Modal System (HIGH)

8. **Base Modal Components**
   - Modal, ModalOverlay, ModalWindow
   - ModalHeader, ModalBody, ModalFooter
   - Lines: 1074-1234, 1237-1440

9. **Edit Task Modal**
   - TaskPanelTabs, CriteriaList, GuardrailItem
   - Lines: 1090-1175

10. **Edit Bet Modal**
    - StateSwitcher, RadioGroup, Chips
    - Lines: 1242-1422

### Phase 5: Side Panel System (MEDIUM)

11. **SidePanel**
    - SidePanel, PanelOverlay, PanelHeader, PanelContent, PanelFooter
    - Lines: 691-1071

12. **Tabs System**
    - Tabs, TabButton, TabContent
    - Lines: 746-771

### Phase 6: Rich Content Components (MEDIUM)

13. **Log Viewer**
    - LogViewer, LogItem, LogIcon, LogContent
    - Lines: 774-844

14. **Diff Viewer**
    - DiffViewer, DiffHeader, DiffFileBlock, DiffLine
    - Lines: 847-925

15. **Comments System**
    - CommentThread, Comment, CommentBubble
    - RichInput, InputActions, SendButton
    - Lines: 931-1056

### Phase 7-9: Specialized Components (LOW-MEDIUM)

- Timeline & History Panel
- Checklists
- Form validation components

## 🎯 IMMEDIATE ACTION ITEMS

1. **Fix Sidebar.tsx file creation issue**
   - Option A: Manual creation via IDE/text editor
   - Option B: Use different file write method
   - Option C: Create from WSL native path vs Windows mounted path

2. **Export Sidebar from components/index.ts**
   ```typescript
   export * from './Sidebar'
   ```

3. **Test in Storybook**
   - Run `cd packages/design-system && bun run dev`
   - Verify Sidebar renders correctly
   - Check all 5 story variants

4. **Continue with Header component** once Sidebar is complete

## 📊 PROGRESS METRICS

- **Total Components Identified**: 124
- **Components Complete**: 12 (10%)
- **Components In Progress**: 1 (Sidebar)
- **Components Remaining**: 111 (90%)

**Estimated Completion by Phase**:
- Phase 1 (Layout): 9 components → 21 total
- Phase 2 (Bet Control): 4 components → 25 total
- Phase 3 (Forms): 12 components → 37 total
- Phase 4 (Modals): 15 components → 52 total
- Phase 5 (Side Panel): 12 components → 64 total
- Phase 6 (Rich Content): 25 components → 89 total
- Phases 7-9 (Specialized): 35 components → 124 total

## 🔄 WORKFLOW PER COMPONENT

1. Create component folder: `components/ComponentName/`
2. Create `.tsx` file with Preact component
3. Create `.css` file (copy exact CSS from design-system.css)
4. Create `.stories.tsx` with ALL variants
5. Create `index.ts` export file
6. Export from `components/index.ts`
7. Build: `bun run build`
8. Test in Storybook: `bun run dev`
9. Verify pixel-perfect match to mockup
10. Move to next component

## 📝 NOTES

- **DO NOT integrate into app yet** - user wants all components in Storybook first for review
- User will do "nitpicks" once all components are in Storybook
- Pixel-perfect CSS extraction is critical
- Every component needs comprehensive Storybook stories
- Focus on foundation components (forms, buttons) before complex compositions
