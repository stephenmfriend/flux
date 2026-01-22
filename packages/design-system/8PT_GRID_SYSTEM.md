# 8pt Grid System - Enforcement Guide

## Rule: All sizes must be divisible by 8 with 0 remainder

Valid values: 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 128, etc.

## Automated Enforcement (3 Layers)

### ✅ Layer 1: Tailwind Config (Restrictive)
**File:** `tailwind.config.js`

Spacing scale only allows 8pt-grid values:
```js
spacing: {
  0: '0px',
  2: '0.5rem',   // 8px ✅
  4: '1rem',     // 16px ✅
  6: '1.5rem',   // 24px ✅
  8: '2rem',     // 32px ✅
  10: '2.5rem',  // 40px ✅
  12: '3rem',    // 48px ✅
  // ... only even numbers
}
```

**Removed:** `1, 3, 5, 7, 9, 11, 13, 15` (non-8pt values)

**Result:** Classes like `px-3`, `m-5`, `gap-7` won't exist/compile

### ✅ Layer 2: ESLint (Static Analysis)
**File:** `eslint.config.js`

```bash
bun run lint
```

Warns about:
- Invalid Tailwind classes
- Classes not in config
- Classname ordering issues

### ✅ Layer 3: Custom Validator (Deep Check)
**File:** `scripts/validate-8pt-grid.js`

```bash
bun run validate:8pt
```

Scans all `.tsx/.jsx` files for:
- Invalid spacing classes (`px-3`, `m-5`, etc.)
- Arbitrary values not divisible by 8 (`h-[37px]`, `text-[13px]`)

**Example output:**
```
❌ 8pt Grid Violations Found:

  src/components/Button/Button.tsx:12
    Class: px-3
    Reason: Not divisible by 8 (3 * 4px = 12px)
```

## Usage in Components

### ✅ Correct (8pt grid)
```tsx
'h-8'      // 32px
'h-10'     // 40px
'h-12'     // 48px
'px-4'     // 16px
'px-6'     // 24px
'gap-2'    // 8px
'gap-4'    // 16px
'text-base'  // 16px
'text-2xl'   // 24px
```

### ❌ Wrong (not 8pt grid)
```tsx
'h-9'      // 36px - NOT divisible by 8
'px-3'     // 12px - NOT divisible by 8
'gap-5'    // 20px - NOT divisible by 8
'text-[13px]' // 13px - NOT divisible by 8
```

## Font Size Exceptions

Some font sizes are close but not exact:
- `text-sm` = 14px (exception - close to 16px)
- `text-lg` = 18px (exception - close to 16px)
- `text-xl` = 20px (exception - close to 24px)

**Preferred:** Use `text-base` (16px), `text-2xl` (24px), `text-3xl` (32px), etc.

## Pre-Commit Hook Integration

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
cd packages/design-system
bun run validate:8pt
bun run lint
bun run test:run
```

This runs automatically before every commit.

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
- name: Validate 8pt Grid
  run: bun run validate:8pt
  working-directory: packages/design-system
```

## Tailwind Scale Reference

| Class | Pixels | 8pt? |
|-------|--------|------|
| `0` | 0px | ✅ |
| `px` | 1px | ⚠️ |
| `2` | 8px | ✅ |
| `4` | 16px | ✅ |
| `6` | 24px | ✅ |
| `8` | 32px | ✅ |
| `10` | 40px | ✅ |
| `12` | 48px | ✅ |
| `14` | 56px | ✅ |
| `16` | 64px | ✅ |
| `20` | 80px | ✅ |
| `24` | 96px | ✅ |
| `32` | 128px | ✅ |
| `40` | 160px | ✅ |
| `48` | 192px | ✅ |
| `64` | 256px | ✅ |

## Quick Reference

**Available spacing classes:**
```
w-*, h-*, p-*, m-*, gap-*, space-*
```

**Available sizes:**
```
0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
```

## Run All Validations

```bash
bun run precommit
```

This runs:
1. 8pt grid validation
2. ESLint
3. Unit tests

All must pass before committing.
