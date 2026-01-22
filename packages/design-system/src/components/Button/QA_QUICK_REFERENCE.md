# Button QA Quick Reference Card

## 🚀 Quick Start

1. Open: **http://localhost:6006**
2. Navigate: **Atoms/Button → QAInteractionTest**
3. Open: **Actions tab** (bottom panel)
4. Interact: Click, hover, Tab key
5. Verify: Actions appear in panel

## ✅ Expected Actions

| You Do This | Actions Panel Shows |
|-------------|---------------------|
| 🖱️ Hover over button | `mouse-enter` |
| 🖱️ Mouse leaves button | `mouse-leave` |
| ⌨️ Press Tab (focus) | `focused` |
| ⌨️ Press Tab again (blur) | `blurred` |
| 🖱️ Press mouse down | `mouse-down` |
| 🖱️ Release mouse | `mouse-up` |
| 🖱️ Click button | `clicked` |
| ⌨️ Press Enter/Space | `clicked` |

## 🧪 Test Cases

### ✅ Pass Criteria
- Every interaction fires expected action
- Actions appear **instantly** (< 100ms)
- No duplicate actions
- Events appear in correct order

### ❌ Fail Criteria
- Interaction fires no action (handler missing)
- Action appears late (> 500ms)
- Same action fires twice (duplicate handler)
- Wrong action fires (event mismatch)

## 🎯 QA Checklist

### Basic Tests
- [ ] Click button → see `clicked`
- [ ] Hover button → see `mouse-enter` and `mouse-leave`
- [ ] Tab to button → see `focused`
- [ ] Tab away → see `blurred`

### Variant Tests (test each)
- [ ] Default variant - all actions work
- [ ] Destructive variant - all actions work
- [ ] Outline variant - all actions work
- [ ] Secondary variant - all actions work
- [ ] Ghost variant - all actions work
- [ ] Link variant - all actions work

### Size Tests (test each)
- [ ] Small (sm) - all actions work
- [ ] Default - all actions work
- [ ] Large (lg) - all actions work

### State Tests
- [ ] Disabled button - **NO** actions fire
- [ ] Loading button - **NO** actions fire

## 🐛 Bug Reporting Template

```
Component: Button
Story: [Story name]
Variant: [default/destructive/etc]
Size: [sm/default/lg]

Expected: [action name] fires on [interaction]
Actual: [no action / wrong action / duplicate]

Steps to Reproduce:
1. Open http://localhost:6006
2. Navigate to Atoms/Button → [story]
3. Set variant to [variant]
4. [interaction]
5. Check Actions panel

Screenshot: [paste screenshot]
```

## 💡 Tips

- **Clear Actions** - Click trash icon to reset log
- **Copy Log** - Click copy icon to paste in bug report
- **Expand Event** - Click arrow to see event details
- **Watch Order** - Events should appear in sequence
- **Check Timing** - Timestamps show performance

## 🚨 Red Flags

| Problem | What It Means |
|---------|---------------|
| No action on click | onClick handler missing |
| Action fires twice | Duplicate event binding |
| Action delayed > 1s | Performance issue |
| Random order | Race condition |
| Wrong action name | Handler on wrong event |

## 📞 Need Help?

- Read full guide: `QA_ACTIONS_GUIDE.md`
- Ask developer: "Actions not firing on [interaction]"
- Include: Screenshot of Actions panel + Controls settings

---

**Remember:** If you can't see the action, it's not wired up! 🔴
