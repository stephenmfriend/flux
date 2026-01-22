# Testing Status & Troubleshooting

## ✅ What's Working

### 1. Manual QA Testing in Storybook
**Status:** Fully functional

```bash
bun run dev  # Opens http://localhost:6006
```

- All stories render correctly
- Actions panel captures all events
- Controls panel allows interactive prop changes
- Interaction tests execute and display results in UI

### 2. Interaction Tests in Storybook UI
**Status:** Fully functional

Navigate to any story with a `play()` function (e.g., `Atoms/Button → AutomatedInteractionTest`) and the Interactions panel shows:
- Test execution status
- Each assertion (pass/fail)
- Step-by-step breakdown

## ⚠️ What's Not Working

### Headless Test Automation (Vitest)
**Status:** Configured but blocked by system dependencies

**Error:**
```
error while loading shared libraries: libnspr4.so: cannot open shared object file
```

**Root Cause:**
Playwright's bundled Chromium requires system libraries not installed in WSL2.

**Attempted Fixes:**
1. ❌ Using system Chrome (`/opt/google/chrome/chrome`) - Path resolution issue
2. ❌ Using snap Chromium - Snap has filesystem restrictions

## 🔧 Solutions

### Option 1: Install Missing Libraries (Recommended)

**Quick Fix - Run this script:**

```bash
./install-test-deps.sh
```

This will install all required system libraries for Playwright. Then run:

```bash
bun run test:run
```

**Manual Installation:**
```bash
sudo apt-get update && sudo apt-get install -y \
  libnspr4 libnss3 libx11-6 libxcomposite1 libxdamage1 \
  libxext6 libxfixes3 libxrandr2 libgbm1 libgtk-3-0 \
  libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libpango-1.0-0 libcairo2
```

### Option 2: Use Docker for Tests

Create `.devcontainer/devcontainer.json`:
```json
{
  "name": "Storybook Testing",
  "image": "mcr.microsoft.com/playwright:v1.57.0-jammy",
  "postCreateCommand": "bun install",
  "customizations": {
    "vscode": {
      "extensions": ["ms-playwright.playwright"]
    }
  }
}
```

Run tests in container:
```bash
docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.57.0-jammy bun test:run
```

### Option 3: Use CI/CD Only

Skip local headless testing and rely on GitHub Actions:

`.github/workflows/test.yml`:
```yaml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build-storybook
      - run: bun run test:run
```

### Option 4: Manual Testing Only

Current workflow that **works perfectly**:

1. **Development:**
   ```bash
   bun run dev
   ```

2. **Manual QA:**
   - Navigate to http://localhost:6006
   - Use Actions panel to verify events
   - Use Controls panel to test variants
   - Watch Interactions panel for play() test results

3. **Visual Review:**
   - Compare components side-by-side with mockups
   - Check all variants, sizes, and states
   - Verify accessibility (keyboard nav, focus states)

4. **Documentation:**
   - Use QA guides in `QA_ACTIONS_GUIDE.md`
   - Follow checklists in `QA_QUICK_REFERENCE.md`

## Current Configuration

**Installed Packages:**
- `vitest@4.0.17`
- `@vitest/browser@4.0.17`
- `@vitest/browser-playwright@4.0.17`
- `@storybook/experimental-addon-test@8.6.14`
- `playwright@1.57.0`

**Config Files:**
- `vitest.config.ts` - Vitest + Playwright browser config
- `.storybook/vitest.setup.ts` - Test setup
- `.storybook/main.ts` - Includes `@storybook/experimental-addon-test`

**Scripts:**
- `bun run dev` - Start Storybook (port 6006) ✅
- `bun run test` - Run Vitest in watch mode ❌ (needs libraries)
- `bun run test:run` - Run Vitest once ❌ (needs libraries)
- `bun run test:ui` - Run Vitest UI ❌ (needs libraries)

## Recommendation

For now, use **Manual QA Testing** (Option 4) which is fully functional and provides excellent visibility into component behavior. The Storybook UI with Actions and Interactions panels gives you everything needed for thorough testing without headless automation.

When ready to enable headless testing, use **Option 1** (install libraries) or **Option 3** (CI/CD only).

## Testing Checklist

### For Every Component

- [ ] Story renders without errors in Storybook
- [ ] All variants display correctly
- [ ] All sizes display correctly
- [ ] Actions fire for all user interactions
- [ ] Interaction tests pass in Storybook UI
- [ ] Disabled state prevents interactions
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Matches mockup design pixel-perfect

### Before Committing

- [ ] All stories render in Storybook (`bun run dev`)
- [ ] No console errors or warnings
- [ ] Storybook builds successfully (`bun run build-storybook`)
- [ ] Design system package builds (`bun run build`)

### Before Release

- [ ] Full QA pass on all components
- [ ] Visual regression review (manual screenshot comparison)
- [ ] Accessibility audit (keyboard nav, ARIA attributes)
- [ ] Cross-browser testing (if needed)
