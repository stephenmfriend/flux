# Button QA Testing with Storybook Actions

## What Are Actions?

Actions are **event loggers** that capture and display all user interactions in real-time. They provide visual confirmation that event handlers are wired correctly - critical for QA validation.

## Available Actions (All Button Events)

| Action | Trigger | What It Tests |
|--------|---------|---------------|
| **clicked** | Click the button | Primary interaction works |
| **mouse-enter** | Hover over button | Hover state triggers |
| **mouse-leave** | Mouse exits button | Hover cleanup works |
| **focused** | Tab to button or click | Keyboard navigation works |
| **blurred** | Tab away or click elsewhere | Focus management works |
| **mouse-down** | Press mouse button | Press state triggers |
| **mouse-up** | Release mouse button | Press cleanup works |

## QA Testing Workflow

### 1. Open QA Test Story

1. Navigate to: **http://localhost:6006**
2. Click: **Atoms/Button → QAInteractionTest**
3. Bottom panel: Open **Actions** tab

### 2. Run Interaction Tests

**Test 1: Click**
- ✅ Click the button
- 🔍 Actions panel shows: `clicked`

**Test 2: Hover**
- ✅ Move mouse over button
- 🔍 Actions panel shows: `mouse-enter`
- ✅ Move mouse away
- 🔍 Actions panel shows: `mouse-leave`

**Test 3: Keyboard Focus**
- ✅ Press `Tab` to focus button
- 🔍 Actions panel shows: `focused`
- ✅ Press `Tab` again to blur
- 🔍 Actions panel shows: `blurred`

**Test 4: Press/Release**
- ✅ Press mouse button down (don't release)
- 🔍 Actions panel shows: `mouse-down`
- ✅ Release mouse button
- 🔍 Actions panel shows: `mouse-up`

**Test 5: Full Interaction Sequence**
- ✅ Hover → Focus → Press → Release → Click
- 🔍 Actions panel shows ALL events in order:
  ```
  mouse-enter
  focused
  mouse-down
  mouse-up
  clicked
  ```

### 3. Test Different Variants

**Test all 6 variants:**
1. Change `variant` control to "destructive"
2. Repeat interaction tests
3. Verify all actions still fire
4. Repeat for: outline, secondary, ghost, link

**Expected:** All variants should fire all actions.

### 4. Test Different Sizes

**Test all 3 sizes:**
1. Change `size` control to "sm"
2. Repeat interaction tests
3. Verify all actions still fire
4. Repeat for: default, lg

**Expected:** All sizes should fire all actions.

### 5. Test Disabled State

1. Toggle `disabled` control to `true`
2. Try clicking, hovering, focusing
3. 🔍 Actions panel should show: **NO events**

**Expected:** Disabled buttons don't fire any actions.

## Reading the Actions Panel

### Action Log Entry Example
```
clicked
└─ arguments: [SyntheticEvent]
   ├─ target: <button class="btn">
   ├─ type: "click"
   ├─ timeStamp: 1234567
   └─ ... (event details)
```

### What to Look For

✅ **Good:**
- Action appears immediately after interaction
- Action name matches the interaction
- Event details look correct

❌ **Bad:**
- No action appears (handler not wired)
- Wrong action fires (wrong event)
- Action fires multiple times (duplicate handlers)
- Action fires late (performance issue)

## Common Issues to Catch

### Issue 1: Missing Handler
**Symptom:** Click button, no `clicked` action
**Cause:** onClick prop not passed to component
**Fix:** Add `onClick={onClick}` to button element

### Issue 2: Duplicate Events
**Symptom:** One click shows `clicked` twice
**Cause:** Handler bound multiple times
**Fix:** Check for duplicate event bindings

### Issue 3: Event Bubbling
**Symptom:** Click shows multiple `clicked` actions
**Cause:** Parent also has click handler
**Fix:** Call `e.stopPropagation()` if needed

### Issue 4: Disabled Not Working
**Symptom:** Disabled button still fires `clicked`
**Cause:** CSS-only disable, not HTML disabled
**Fix:** Ensure `disabled` attribute on button element

## Regression Testing Checklist

Before marking Button as "done", verify:

- [ ] **Click** - `clicked` fires on all variants/sizes
- [ ] **Hover** - `mouse-enter` and `mouse-leave` fire
- [ ] **Focus** - `focused` fires on Tab key
- [ ] **Blur** - `blurred` fires on Tab away
- [ ] **Press** - `mouse-down` fires on press
- [ ] **Release** - `mouse-up` fires on release
- [ ] **Disabled** - NO actions fire when disabled=true
- [ ] **Keyboard** - Spacebar/Enter trigger `clicked`
- [ ] **All Variants** - Every variant fires all actions
- [ ] **All Sizes** - Every size fires all actions

## Automated Testing

Actions can be asserted in automated tests:

```tsx
import { expect } from '@storybook/test'

test('button fires click action', async ({ canvasElement }) => {
  const button = canvasElement.querySelector('button')
  await userEvent.click(button)
  await expect(actions.clicked).toHaveBeenCalled()
})
```

## For Non-Technical QA

**Simple checklist:**

1. Open: http://localhost:6006
2. Find: Atoms/Button → QAInteractionTest
3. Bottom: Click "Actions" tab
4. Test: Click, hover, Tab key
5. Check: Actions panel shows events
6. Report: Any missing events = bug

**What "working" looks like:**
- Every interaction shows an action
- Actions appear instantly
- No duplicate actions
- Disabled buttons show no actions

## Tips

- **Clear button** in Actions panel - Resets log for clean testing
- **Copy button** - Copy action log to clipboard for bug reports
- **Timestamps** - Check event timing/order
- **Event details** - Expand to see full event object
- **Filter** - Search actions by name

## Why This Matters

**For Developers:**
- Confirms event wiring is correct
- Catches prop forwarding bugs
- Validates accessibility (keyboard events)

**For QA:**
- Visual confirmation without code inspection
- Easy to reproduce and document bugs
- Non-technical team members can verify

**For Designers:**
- Verify interaction behaviors match specs
- Confirm hover/focus states trigger
- Validate button feels responsive

Actions turn invisible event handlers into **visible, testable, documentable behavior**.
