import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'crypto';
import { validateApiKey, hasApiKeys, getProject, getProjects } from '@flux/shared';
import type { ApiKey, KeyScope } from '@flux/shared';

const FLUX_API_KEY = process.env.FLUX_API_KEY;

// Auth context attached to requests
export type AuthContext = {
  keyType: 'server' | 'project' | 'env' | 'anonymous';
  projectIds?: string[];  // For project-scoped keys
  apiKey?: ApiKey;        // The validated key record
};

// Timing-safe string comparison
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Extract project ID from request path
function extractProjectId(path: string): string | undefined {
  // /api/projects/:id, /api/projects/:id/tasks, /api/projects/:id/epics, etc.
  const projectsMatch = path.match(/^\/api\/projects\/([^\/]+)/);
  if (projectsMatch) return projectsMatch[1];

  // /api/tasks/:id - need to look up task to get project
  // /api/epics/:id - need to look up epic to get project
  // These are handled separately in the route handlers
  return undefined;
}

// Check if a key scope allows access to a project
function scopeAllowsProject(scope: KeyScope, projectId: string): boolean {
  if (scope.type === 'server') return true;
  return scope.project_ids.includes(projectId);
}

/**
 * Auth middleware for Flux server.
 *
 * Access levels:
 * - FLUX_API_KEY env var: Full access (backwards compat)
 * - Stored server keys: Full access
 * - Stored project keys: Access to specific projects
 * - Anonymous: Read public projects only
 *
 * Dev mode (no keys configured): All access allowed
 */
export const authMiddleware = createMiddleware<{ Variables: { auth: AuthContext } }>(async (c, next) => {
  const hasStoredKeys = hasApiKeys();
  const hasEnvKey = !!FLUX_API_KEY;

  // Dev mode: no keys configured at all
  if (!hasStoredKeys && !hasEnvKey) {
    c.set('auth', { keyType: 'anonymous' });
    return next();
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // No token provided
  if (!token) {
    // GET/HEAD allowed for public projects (handled in route)
    if (c.req.method === 'GET' || c.req.method === 'HEAD') {
      c.set('auth', { keyType: 'anonymous' });
      return next();
    }
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check env key first (backwards compat)
  if (hasEnvKey && safeCompare(token, FLUX_API_KEY!)) {
    c.set('auth', { keyType: 'env' });
    return next();
  }

  // Check stored keys
  const apiKey = validateApiKey(token);
  if (apiKey) {
    if (apiKey.scope.type === 'server') {
      c.set('auth', { keyType: 'server', apiKey });
    } else {
      c.set('auth', {
        keyType: 'project',
        projectIds: apiKey.scope.project_ids,
        apiKey
      });
    }
    return next();
  }

  return c.json({ error: 'Unauthorized' }, 401);
});

/**
 * Check if the current auth context allows write access to a project
 */
export function canWriteProject(auth: AuthContext, projectId: string): boolean {
  if (auth.keyType === 'env' || auth.keyType === 'server') return true;
  if (auth.keyType === 'project' && auth.projectIds) {
    return auth.projectIds.includes(projectId);
  }
  return false;
}

/**
 * Check if the current auth context allows read access to a project
 * Public projects can be read by anyone, private requires key access
 */
export function canReadProject(auth: AuthContext, projectId: string): boolean {
  // Server/env keys can read anything
  if (auth.keyType === 'env' || auth.keyType === 'server') return true;

  // Project keys can read their projects
  if (auth.keyType === 'project' && auth.projectIds) {
    if (auth.projectIds.includes(projectId)) return true;
  }

  // Anonymous can read public projects
  const project = getProject(projectId);
  return project?.visibility !== 'private';
}

/**
 * Filter projects list based on auth context
 * Hides private projects from anonymous users
 */
export function filterProjects(auth: AuthContext): ReturnType<typeof getProjects> {
  const projects = getProjects();

  // Server/env keys see everything
  if (auth.keyType === 'env' || auth.keyType === 'server') return projects;

  // Project keys see their projects + public projects
  if (auth.keyType === 'project' && auth.projectIds) {
    return projects.filter(p =>
      auth.projectIds!.includes(p.id) || p.visibility !== 'private'
    );
  }

  // Anonymous sees only public projects
  return projects.filter(p => p.visibility !== 'private');
}

/**
 * Check if auth is required (any keys configured)
 */
export function isAuthRequired(): boolean {
  return !!FLUX_API_KEY || hasApiKeys();
}

/**
 * Check if auth context has server-level access
 * In dev mode (no auth configured), always returns true
 */
export function hasServerAccess(auth: AuthContext): boolean {
  if (!isAuthRequired()) return true;
  return auth.keyType === 'env' || auth.keyType === 'server';
}
