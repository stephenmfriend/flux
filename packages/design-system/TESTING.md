# Testing Guide

## Overview

This design system uses **Storybook** for component development and testing. We have two layers of testing currently functional:

1. **Manual QA Testing** - Interactive visual testing via Storybook UI ✅ WORKING
2. **Automated Interaction Testing** - Automated user interaction tests with `play()` functions ✅ WORKING in Storybook UI

**Note:** Headless test automation via Vitest is configured but requires system dependencies. See troubleshooting section below.

---

## 1. Manual QA Testing

### Start Storybook

```bash
bun run dev
```

Opens Storybook at http://localhost:6006

### Using the Actions Panel

All interactive components have Storybook Actions configured to capture events:

**Example: Button Component**
1. Navigate to **Atoms/Button → QAInteractionTest**
2. Open the **Actions** tab (bottom panel)
3. Interact with the button:
   - Hover → see `mouse-enter` and `mouse-leave`
   - Click → see `clicked`
   - Tab key → see `focused` and `blurred`
   - Press mouse down → see `mouse-down` and `mouse-up`

**What to verify:**
- Every interaction fires the expected action
- Actions appear instantly (< 100ms)
- No duplicate actions
- Events appear in correct order

See [Button QA Guide](./src/components/Button/QA_ACTIONS_GUIDE.md) for detailed testing instructions.

### Using the Controls Panel

All component props are exposed as interactive controls:

**Example: Button Variants**
1. Navigate to **Atoms/Button → Default**
2. Open the **Controls** tab (bottom panel)
3. Change the `variant` dropdown to test all 6 variants
4. Change the `size` radio buttons to test all 3 sizes
5. Toggle the `disabled` checkbox

This allows non-technical QA to test all component variations without code changes.

---

## 2. Automated Interaction Testing

### What are Interaction Tests?

Interaction tests use the `play()` function to simulate user interactions automatically:

```typescript
export const AutomatedInteractionTest: Story = {
  args: {
    onClick: fn(), // Mock function for assertions
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Simulate click
    await userEvent.click(button)

    // Assert callback was fired
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
```

### Viewing Interaction Tests in Storybook

1. Start Storybook: `bun run dev`
2. Navigate to **Atoms/Button → AutomatedInteractionTest**
3. Click the **Interactions** tab (bottom panel)
4. Watch the test execute automatically
5. See each step with pass/fail status

**Test Steps Shown:**
- ✅ Button is rendered
- ✅ Button has correct text
- ✅ Button is not disabled
- ✅ Click interaction fires onClick
- ✅ Keyboard focus works
- ✅ Keyboard blur works

---

## 3. Test Runner (Headless Automated Testing)

### Running Tests

**Prerequisites:** Storybook must be running

```bash
# Terminal 1: Start Storybook
bun run dev

# Terminal 2: Run tests
bun run test-storybook
```

### What Gets Tested

The test runner:
1. Loads every story in headless Chromium
2. Takes a screenshot (smoke test - story doesn't crash)
3. Executes all `play()` functions (interaction tests)
4. Reports pass/fail for each story

**Output Example:**
```
PASS  atoms/button
 ✓ Default (234ms)
 ✓ Primary (189ms)
 ✓ Destructive (201ms)
 ✓ AutomatedInteractionTest (567ms)
   ✓ Button is rendered
   ✓ Click interaction fires onClick
   ✓ Keyboard focus works

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        8.234s
```

### Configuration

Test runner configuration is in `.storybook/test-runner.ts`:

```typescript
{
  testTimeout: 15000, // 15 second timeout per story
  // workers: 4,      // Parallel execution
}
```

### CI/CD Integration

Add to your CI pipeline (GitHub Actions example):

```yaml
- name: Install dependencies
  run: bun install

- name: Build Storybook
  run: bun run build-storybook

- name: Run tests
  run: |
    npx concurrently -k -s first -n "SB,TEST" -c "magenta,blue" \
      "npx http-server storybook-static --port 6006 --silent" \
      "npx wait-on tcp:127.0.0.1:6006 && bun run test-storybook"
```

---

## 4. Accessibility Testing

### @storybook/addon-a11y (Future)

To add accessibility testing:

```bash
bun add -D @storybook/addon-a11y
```

Update `.storybook/main.ts`:

```typescript
addons: [
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-a11y', // ← Add this
],
```

**Features:**
- WCAG compliance checks
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility
- Automated violations detection

---

## 5. Visual Regression Testing (Optional)

### Chromatic (Recommended)

For pixel-perfect visual regression testing:

```bash
bun add -D chromatic
```

**Features:**
- Screenshot comparison across commits
- Detect unintended visual changes
- Review UI changes in pull requests
- Cross-browser testing

**Setup:**
1. Sign up at https://www.chromatic.com
2. Get project token
3. Add to CI: `npx chromatic --project-token=<token>`

---

## Testing Workflow

### During Development

1. **Write component** in isolation
2. **Create stories** showing all variants/states
3. **Add interaction tests** for critical user flows
4. **Manual QA** in Storybook UI
5. **Run test-runner** before committing

### Before Release

1. **Run test-runner** on all stories
2. **Check accessibility** (a11y addon)
3. **Visual regression review** (Chromatic)
4. **Cross-browser testing** (test-runner supports Firefox/Safari)

### In CI/CD

1. **Lint/Type check** TypeScript
2. **Build Storybook** to verify compilation
3. **Run test-runner** for automated tests
4. **Deploy Storybook** to static host for team review

---

## Writing Good Tests

### DO ✅

- Test **user-facing behavior** (clicks, typing, focus)
- Test **component variants** (all sizes, colors, states)
- Test **accessibility** (keyboard navigation, ARIA)
- Test **error states** (disabled, loading, validation)
- Use **semantic queries** (`getByRole`, `getByLabelText`)

### DON'T ❌

- Test **implementation details** (internal state, CSS classes)
- Test **trivial stories** (every minor prop combination)
- Test **external dependencies** (mock API calls)
- Use **fragile selectors** (CSS classes, IDs)
- Duplicate **unit test coverage** (Storybook is integration testing)

---

## Troubleshooting

### Test Runner Fails to Start

**Error:** `Cannot find Storybook instance`

**Fix:** Ensure Storybook is running on port 6006:
```bash
bun run dev
```

### Interaction Tests Timeout

**Error:** `Timeout waiting for element`

**Causes:**
- Slow rendering (check component performance)
- Incorrect selector (use `screen.logTestingPlaygroundURL()`)
- Missing await (ensure all userEvent calls are awaited)

**Fix:** Increase timeout in `test-runner.ts`:
```typescript
testTimeout: 30000, // 30 seconds
```

### Browser Launch Failures

**Error:** `Failed to launch browser`

**Fix:** Use existing system Chromium:
```bash
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

---

## Resources

- [Storybook Testing Docs](https://storybook.js.org/docs/react/writing-tests/introduction)
- [Interaction Testing Guide](https://storybook.js.org/docs/react/writing-tests/interaction-testing)
- [Test Runner Documentation](https://github.com/storybookjs/test-runner)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
