/**
 * Theme utility for toggling between light and dark modes
 */

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'flux-theme'

/**
 * Get the current theme from DOM or localStorage
 */
export function getTheme(): Theme {
  // Check data-theme attribute first
  const htmlTheme = document.documentElement.getAttribute('data-theme')
  if (htmlTheme === 'light' || htmlTheme === 'dark') {
    return htmlTheme
  }

  // Check localStorage
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  // Default to dark
  return 'dark'
}

/**
 * Set the theme and persist to localStorage
 */
export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): Theme {
  const current = getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/**
 * Initialize theme from localStorage on page load
 */
export function initTheme(): void {
  const theme = getTheme()
  setTheme(theme)
}
