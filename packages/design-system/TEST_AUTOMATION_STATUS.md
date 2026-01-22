# Test Automation - Current Status

## ✅ Fully Working

### Unit Testing with Testing Library + jsdom

```bash
npm run test        # Watch mode
npm run test:run    # Run once
npm run test:ui     # Vitest UI
```

**Status:** ✅ **All 26 tests passing**

**Test Coverage:**
- ✅ **Button** (13 tests) - Variants, sizes, events, disabled state
- ✅ **Badge** (5 tests) - Variants, className, base class
- ✅ **StatusDot** (5 tests) - All status variants
- ✅ **Tag** (3 tests) - All color variants

**Technology Stack:**
- **Vitest 4.0.17** - Test framework with jsdom environment
- **@testing-library/preact 3.2.4** - Preact testing utilities
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **@testing-library/jest-dom 6.9.1** - Custom DOM matchers
- **jsdom 27.4.0** - DOM implementation for Node.js

**Example Test:**
```typescript
it('handles click events', async () => {
  const handleClick = vi.fn()
  const user = userEvent.setup()
  render(<Button onClick={handleClick}>Click me</Button>)
  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

### Storybook Manual QA

```bash
bun run dev  # or: npm run dev
# Opens http://localhost:6006
```

**Capabilities:**
- ✅ All components render correctly
- ✅ **Actions Panel** - Logs all events (click, hover, focus, blur, etc.)
- ✅ **Controls Panel** - Interactive prop testing for all variants/sizes
- ✅ **Interactions Panel** - Shows automated test execution
- ✅ Visual comparison with mockups
- ✅ Accessibility testing (keyboard nav, focus states)

## 📋 Test Development Workflow

### 1. Create Component Test

```typescript
// src/components/MyComponent/MyComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders children text', () => {
    render(<MyComponent>Hello</MyComponent>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    const { container } = render(<MyComponent variant="primary">Test</MyComponent>)
    expect(container.firstChild).toHaveClass('my-component-primary')
  })
})
```

### 2. Run Tests

```bash
npm run test        # Watch mode (recommended during development)
npm run test:run    # Single run
```

### 3. Verify in Storybook

```bash
bun run dev
# Open http://localhost:6006
# Visual QA + manual interaction testing
```

## 📊 Test Coverage Status

| Component | Unit Tests | Storybook Story | Status |
|-----------|-----------|----------------|--------|
| Button | ✅ 13 tests | ✅ | Complete |
| Badge | ✅ 5 tests | ✅ | Complete |
| StatusDot | ✅ 5 tests | ✅ | Complete |
| Tag | ✅ 3 tests | ✅ | Complete |
| TaskProgress | ❌ | ✅ | Needs tests |
| ColumnHeader | ❌ | ✅ | Needs tests |
| TaskCard | ❌ | ✅ | Needs tests |
| BetControlStrip | ❌ | ✅ | Needs tests |
| Sidebar | ❌ | ✅ | Needs tests |
| Header | ❌ | ✅ | Needs tests |
| BoardHeader | ❌ | ✅ | Needs tests |
| AppLayout | ❌ | ✅ | Needs tests |
| KanbanColumn | ❌ | ❌ | Needs story + tests |
| KanbanBoard | ❌ | ❌ | Needs story + tests |
| AvatarStack | ❌ | ❌ | Needs story + tests |
| AddTaskButton | ❌ | ❌ | Needs story + tests |
| SearchInput | ❌ | ❌ | Needs story + tests |

## 🎯 Testing Best Practices

### What to Test

**✅ Do Test:**
- Component renders without crashing
- Props are applied correctly (classes, attributes)
- User interactions fire correct events
- Conditional rendering works
- All variants/states render correctly
- Accessibility attributes are present

**❌ Don't Test:**
- Exact CSS styling (use visual QA in Storybook)
- Implementation details
- Third-party library internals

### Example Patterns

**Testing Class Application:**
```typescript
it('applies variant class', () => {
  const { container } = render(<Button variant="primary">Click</Button>)
  expect(container.firstChild).toHaveClass('btn-primary')
})
```

**Testing User Interactions:**
```typescript
it('handles click events', async () => {
  const handleClick = vi.fn()
  const user = userEvent.setup()
  render(<Button onClick={handleClick}>Click</Button>)
  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

**Testing Multiple Variants:**
```typescript
it('renders all variants correctly', () => {
  const variants = ['default', 'destructive', 'outline'] as const
  variants.forEach((variant) => {
    const { unmount } = render(<Button variant={variant}>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass(`btn-${variant}`)
    unmount()
  })
})
```

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm install
        working-directory: packages/design-system

      - name: Run tests
        run: npm run test:run
        working-directory: packages/design-system

      - name: Build Storybook
        run: npm run build-storybook
        working-directory: packages/design-system
```

## 🛠️ Troubleshooting

### Tests Fail with "Cannot find module"

**Solution:** Ensure you're in the correct directory
```bash
cd /mnt/c/code/github/flux/packages/design-system
npm run test
```

### Tests Hang or Don't Exit

**Solution:** Use `test:run` for single execution
```bash
npm run test:run
```

### JSX/TSX Syntax Errors

**Solution:** Verify vitest.config.ts has preact plugin
```typescript
import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

## 📈 Next Steps

### Immediate Priorities

1. **Add tests for remaining atomic components:**
   - TaskProgress
   - AvatarStack
   - AddTaskButton

2. **Add tests for composed components:**
   - ColumnHeader (uses StatusDot)
   - TaskCard (uses multiple atomics)

3. **Add coverage reporting:**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
       }
     }
   })
   ```

4. **Document test patterns** for complex interactions

### Future Enhancements

- Visual regression testing with Chromatic
- Accessibility testing automation with axe-core
- Performance benchmarking
- Integration tests for full page compositions

## 🔗 Documentation

- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [README.md](./README.md) - Package overview with test status

## 📞 Support

**All tests passing?** Yes! ✅ 26/26 tests pass

**Need to add tests?** See the test patterns above and existing test files in `src/components/*/`

**Issues?** Check the Troubleshooting section above
