import { test, expect } from '@playwright/test'
import { join } from 'path'

// Utility to pull a set of computed styles from an element
async function getStyles(page, selector: string, props: string[]) {
  const handle = await page.waitForSelector(selector)
  return await handle.evaluate((el, props) => {
    const cs = getComputedStyle(el as HTMLElement)
    const out: Record<string,string> = {}
    for (const p of props as string[]) out[p] = cs.getPropertyValue(p)
    return out
  }, props)
}

test.describe('Task card style parity', () => {
  const props = [
    'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'border-radius', 'background-color', 'box-shadow', 'gap',
  ]
  const titleProps = ['font-size', 'font-weight', 'line-height', 'margin-top', 'margin-bottom']

  test('mock html vs app component', async ({ page }) => {
    // 1) Load mock task card
    const mockPath = 'file://' + join(process.cwd(), 'mockui', 'flux.html')
    await page.goto(mockPath)
    const mockStyles = await getStyles(page, '.task-card', props)
    const mockTitle = await getStyles(page, '.task-card .task-title', titleProps)

    // 2) Load app demo task card (ensure dev server is running on :5173)
    await page.goto('http://localhost:5173/dev/taskcard')
    const appStyles = await getStyles(page, '.task-card', props)
    const appTitle = await getStyles(page, '.task-card .task-title', titleProps)

    expect(appStyles).toEqual(mockStyles)
    expect(appTitle).toEqual(mockTitle)
  })
})

