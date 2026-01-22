# Button Storybook Controls Guide

## Interactive Controls

Now when you click on **Atoms/Button → Default**, you'll see interactive controls in the bottom panel:

### Available Controls

| Control | Type | Options | Description |
|---------|------|---------|-------------|
| **variant** | Select dropdown | default, destructive, outline, secondary, ghost, link | Change button style |
| **size** | Radio buttons | sm, default, lg | Change button size (t-shirt) |
| **children** | Text input | Any text | Change button label |
| **disabled** | Boolean toggle | true/false | Toggle disabled state |
| **type** | Select dropdown | button, submit, reset | HTML button type |

### Actions Panel

Click the button and you'll see `onClick` fire in the **Actions** tab showing:
```
clicked
```

## How to Use

1. **Open Storybook:** http://localhost:6006
2. **Navigate:** Atoms/Button → Default
3. **Bottom Panel:** Click "Controls" tab
4. **Experiment:**
   - Change variant from "default" to "destructive"
   - Toggle size between sm/default/lg
   - Edit children text to "Click Me"
   - Toggle disabled on/off
5. **Watch Live:** Button updates instantly as you change controls
6. **Actions Tab:** Click the button, see the action logged

## Story Examples

### Interactive Stories (with controls):
- **Default** - Start here! All controls available
- **Primary** - Pre-set to default variant
- **Destructive** - Pre-set to destructive variant
- **Outline** - Pre-set to outline variant
- **Secondary** - Pre-set to secondary variant
- **Ghost** - Pre-set to ghost variant
- **Link** - Pre-set to link variant
- **Small** - Pre-set to sm size
- **Large** - Pre-set to lg size
- **WithIcon** - Shows icon + text
- **IconOnly** - Shows just icon
- **Disabled** - Pre-disabled state
- **Loading** - Shows loading spinner

### Visual Comparison Stories (non-interactive):
- **AllSizes** - Side-by-side size comparison
- **AllVariants** - Grid of all 6 variants
- **SizeVariantMatrix** - Every size × variant combination

## Why This is Better

**Before:**
- 15+ separate stories
- No interactivity
- Had to click through each story to see variants

**After:**
- 1 main interactive story (Default)
- Live controls to test all combinations
- Named examples for quick reference
- Action logging to test onClick behavior

## Testing Workflow

1. Click **Default** story
2. Use controls to test your specific variant + size combo
3. Click button → verify action fires
4. Toggle disabled → verify styling
5. Check **AllVariants** → verify consistency across variants
6. Check **SizeVariantMatrix** → verify sizing consistency

## For Developers

When consuming the Button:
```tsx
import { Button } from '@flux/design-system'

// Play with controls to find your combo, then copy:
<Button variant="outline" size="lg" onClick={handleClick}>
  Large Outline Button
</Button>
```

The controls help you **discover** the API without reading docs!
