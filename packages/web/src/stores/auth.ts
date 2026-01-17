const TOKEN_KEY = 'flux_auth_token';

/**
 * Get stored auth token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store auth token in localStorage
 */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.error('Failed to save auth token');
  }
}

/**
 * Clear stored auth token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Check if user is authenticated (has token stored)
 */
export function hasToken(): boolean {
  return getToken() !== null;
}
