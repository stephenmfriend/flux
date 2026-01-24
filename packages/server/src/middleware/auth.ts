import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'crypto';
import { verifyToken } from '@clerk/backend';
import {
  validateApiKey,
  hasApiKeys,
  getProject,
  getProjects,
  getUser,
  createUser,
  hasAnyUsers,
  getUserProjectAccess,
  getProjectsForUser,
} from '@flux/shared';
import type { ApiKey, UserRole, ProjectAccess } from '@flux/shared';

// Read env vars dynamically to support testing
const getEnvKey = () => process.env.FLUX_API_KEY;
const getClerkSecretKey = () => process.env.CLERK_SECRET_KEY;
const getAdminClerkId = () => process.env.FLUX_ADMIN_CLERK_ID;

// Auth context attached to requests
export type AuthContext = {
  keyType: 'server' | 'project' | 'env' | 'anonymous' | 'clerk';
  projectIds?: string[];       // For project-scoped keys
  apiKey?: ApiKey;             // The validated key record
  clerkUserId?: string;        // Clerk user ID (if clerk auth)
  clerkUserRole?: UserRole;    // Server-level role (if clerk auth)
};

// Timing-safe string comparison
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Auth middleware for Flux server.
 *
 * Access levels:
 * - Clerk JWT: User-level access (if CLERK_SECRET_KEY configured)
 * - FLUX_API_KEY env var: Full access (backwards compat)
 * - Stored server keys: Full access
 * - Stored project keys: Access to specific projects
 * - Anonymous: Read public projects only
 *
 * Dev mode (no keys configured, no Clerk): All access allowed
 */
export const authMiddleware = createMiddleware<{ Variables: { auth: AuthContext } }>(async (c, next) => {
  const hasStoredKeys = hasApiKeys();
  const envKey = getEnvKey();
  const clerkSecretKey = getClerkSecretKey();

  // Dev mode: no API keys configured (Clerk being set doesn't disable dev mode)
  if (!hasStoredKeys && !envKey) {
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

  // Check if token looks like a Flux API key (starts with flx_)
  if (token.startsWith('flx_')) {
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
  }

  // Check env key (backwards compat)
  if (envKey && safeCompare(token, envKey)) {
    c.set('auth', { keyType: 'env' });
    return next();
  }

  // Try Clerk JWT verification if configured
  if (clerkSecretKey) {
    try {
      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });
      if (payload?.sub) {
        const clerkUserId = payload.sub;
        // Get or create user record
        let user = getUser(clerkUserId);
        if (!user) {
          // First user bootstrap: make them admin
          const isFirstUser = !hasAnyUsers();
          const adminClerkId = getAdminClerkId();
          const shouldBeAdmin = isFirstUser || adminClerkId === clerkUserId;
          user = createUser(clerkUserId, shouldBeAdmin ? 'admin' : 'user');
        }
        c.set('auth', {
          keyType: 'clerk',
          clerkUserId,
          clerkUserRole: user.role,
        });
        return next();
      }
    } catch {
      // JWT verification failed, fall through
    }
  }

  // Check stored API keys (non-flx_ prefix, legacy support)
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
  if (!isAuthRequired()) return true;
  if (auth.keyType === 'env' || auth.keyType === 'server') return true;
  if (auth.keyType === 'project' && auth.projectIds) {
    return auth.projectIds.includes(projectId);
  }
  if (auth.keyType === 'clerk' && auth.clerkUserId) {
    // Server admins can write anything
    if (auth.clerkUserRole === 'admin') return true;
    // Check project-level access
    const access = getUserProjectAccess(auth.clerkUserId, projectId);
    return access?.access === 'write' || access?.access === 'admin';
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

  // Clerk users
  if (auth.keyType === 'clerk' && auth.clerkUserId) {
    // Server admins can read anything
    if (auth.clerkUserRole === 'admin') return true;
    // Check if user has any access to this project
    const access = getUserProjectAccess(auth.clerkUserId, projectId);
    if (access) return true;
  }

  // Anyone can read public projects (but not non-existent ones)
  const project = getProject(projectId);
  if (!project) return false;
  return project.visibility !== 'private';
}

/**
 * Check if auth context can admin a project (manage settings, invite users)
 */
export function canAdminProject(auth: AuthContext, projectId: string): boolean {
  if (!isAuthRequired()) return true;
  if (auth.keyType === 'env' || auth.keyType === 'server') return true;
  if (auth.keyType === 'clerk' && auth.clerkUserId) {
    if (auth.clerkUserRole === 'admin') return true;
    const access = getUserProjectAccess(auth.clerkUserId, projectId);
    return access?.access === 'admin';
  }
  return false;
}

/**
 * Filter projects list based on auth context
 * Hides private projects from anonymous users
 */
export function filterProjects(auth: AuthContext): ReturnType<typeof getProjects> {
  const projects = getProjects();

  // Server/env keys see everything
  if (auth.keyType === 'env' || auth.keyType === 'server') return projects;

  // Clerk admin sees everything
  if (auth.keyType === 'clerk' && auth.clerkUserRole === 'admin') return projects;

  // Clerk users see their projects + public projects
  if (auth.keyType === 'clerk' && auth.clerkUserId) {
    const userAccess = getProjectsForUser(auth.clerkUserId);
    const accessibleIds = new Set(userAccess.map(a => a.project_id));
    return projects.filter(p =>
      accessibleIds.has(p.id) || p.visibility !== 'private'
    );
  }

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
 * Check if auth is required (API keys configured)
 * Note: Clerk being configured doesn't require auth - it just enables it as an option
 */
export function isAuthRequired(): boolean {
  return !!getEnvKey() || hasApiKeys();
}

/**
 * Check if Clerk is configured
 */
export function isClerkConfigured(): boolean {
  return !!getClerkSecretKey();
}

/**
 * Check if auth context has server-level access
 * In dev mode (no auth configured), always returns true
 */
export function hasServerAccess(auth: AuthContext): boolean {
  if (!isAuthRequired()) return true;
  if (auth.keyType === 'env' || auth.keyType === 'server') return true;
  if (auth.keyType === 'clerk' && auth.clerkUserRole === 'admin') return true;
  return false;
}

/**
 * Middleware that requires server-level access
 * Use: app.post('/route', requireServerAccess, handler)
 */
export const requireServerAccess = createMiddleware<{ Variables: { auth: AuthContext } }>(async (c, next) => {
  const auth = c.get('auth');
  if (!hasServerAccess(auth)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});
