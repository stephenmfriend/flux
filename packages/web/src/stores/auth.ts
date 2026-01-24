import { useAuth } from '@clerk/clerk-react'

const TOKEN_KEY = 'flux_auth_token'

// Check if Clerk is configured
export function isClerkEnabled(): boolean {
  return !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
}

/**
 * Get stored API key token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Store API key token in localStorage
 */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    console.error('Failed to save auth token')
  }
}

/**
 * Clear stored API key token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore
  }
}

/**
 * Check if user has API key stored
 */
export function hasToken(): boolean {
  return getToken() !== null
}

/**
 * Hook to get auth token (supports both Clerk and API key)
 * Returns a function that gets the token asynchronously
 */
export function useFluxAuth() {
  // Only use Clerk hook if Clerk is enabled
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkAuth = isClerkEnabled() ? useAuth() : null
  const apiKeyToken = getToken()

  const isAuthenticated = clerkAuth?.isSignedIn || !!apiKeyToken
  const isClerkUser = !!clerkAuth?.isSignedIn

  const getAuthToken = async (): Promise<string | null> => {
    if (clerkAuth?.isSignedIn) {
      return await clerkAuth.getToken()
    }
    return apiKeyToken
  }

  return {
    isAuthenticated,
    isClerkUser,
    getAuthToken,
    // Expose clerk auth for sign out etc
    clerkAuth,
  }
}
