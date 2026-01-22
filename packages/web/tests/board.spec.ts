import { test, expect } from '@playwright/test'

test.describe('Board Page', () => {
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleErrors = []

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(error.message)
    })
  })

  test('should load without runtime errors', async ({ page }) => {
    await page.goto('/board/sok5ezu')

    // Wait for the board to render
    await page.waitForSelector('.board-container', { timeout: 10000 })

    // Check for specific TypeError we were seeing
    const hasTypeError = consoleErrors.some(error =>
      error.includes('Cannot read properties of undefined') ||
      error.includes('Cannot read properties of null')
    )

    expect(hasTypeError, `Found runtime errors: ${consoleErrors.join(', ')}`).toBe(false)
    expect(consoleErrors.length, `Console errors found: ${consoleErrors.join(', ')}`).toBe(0)
  })

  test('should render status dots with correct colors', async ({ page }) => {
    await page.goto('/board/sok5ezu')
    await page.waitForSelector('.column-header-status-dot', { timeout: 10000 })

    // Check planning status dot color (should be purple #A855F7)
    const planningDot = page.locator('.column-header-status-dot-planning').first()
    if (await planningDot.count() > 0) {
      const bgColor = await planningDot.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      // rgb(168, 85, 247) is #A855F7
      expect(bgColor).toBe('rgb(168, 85, 247)')
    }

    // Check done status dot color (should be brand green #3ECF8E)
    const doneDot = page.locator('.column-header-status-dot-done').first()
    if (await doneDot.count() > 0) {
      const bgColor = await doneDot.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      // rgb(62, 207, 142) is #3ECF8E
      expect(bgColor).toBe('rgb(62, 207, 142)')
    }
  })

  test('should render task cards without crashing', async ({ page }) => {
    await page.goto('/board/sok5ezu')

    // Wait for tasks to load
    await page.waitForSelector('.draggable-task-card, .task-card', { timeout: 10000 })

    // Verify at least one task card rendered
    const taskCards = page.locator('.draggable-task-card, .task-card')
    const count = await taskCards.count()
    expect(count).toBeGreaterThan(0)

    // Verify no console errors during rendering
    expect(consoleErrors.length, `Console errors during task render: ${consoleErrors.join(', ')}`).toBe(0)
  })

  test('should handle tasks with missing type config gracefully', async ({ page }) => {
    await page.goto('/board/sok5ezu')
    await page.waitForSelector('.board-container', { timeout: 10000 })

    // Wait a bit for all tasks to render
    await page.waitForTimeout(2000)

    // Check that no typeConfig errors occurred
    const hasTypeConfigError = consoleErrors.some(error =>
      error.includes("Cannot read properties of undefined (reading 'color')")
    )

    expect(hasTypeConfigError, `TypeConfig error found: ${consoleErrors.join(', ')}`).toBe(false)
  })

  test('should handle null arrays gracefully', async ({ page }) => {
    await page.goto('/board/sok5ezu')
    await page.waitForSelector('.board-container', { timeout: 10000 })

    // Wait for tasks to fully render
    await page.waitForTimeout(2000)

    // Check that no null array errors occurred
    const hasNullArrayError = consoleErrors.some(error =>
      error.includes("Cannot read properties of null (reading 'length')")
    )

    expect(hasNullArrayError, `Null array error found: ${consoleErrors.join(', ')}`).toBe(false)
  })
})
