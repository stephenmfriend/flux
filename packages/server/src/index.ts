import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, watchFile, statSync, readFileSync } from 'fs';
import {
  setStorageAdapter,
  initStore,
  resetStore,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getEpics,
  getEpic,
  createEpic,
  updateEpic,
  deleteEpic,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  deleteTaskComment,
  isTaskBlocked,
  getReadyTasks,
  cleanupProject,
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  setWebhookEventHandler,
  triggerWebhooks,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  createCliAuthRequest,
  completeCliAuthRequest,
  pollCliAuthRequest,
  cleanupExpiredAuthRequests,
  setAuthFunctions,
  type WebhookEventType,
  type KeyScope,
} from '@flux/shared';
import { generateKey, generateTempToken, validateKey, encrypt, decrypt } from '@flux/shared/auth';
import { findFluxDir, loadEnvLocal, readConfig, resolveDataPath } from '@flux/shared/config';
import { createAdapter } from '@flux/shared/adapters';
import { handleWebhookEvent, testWebhookDelivery } from './webhook-service.js';
import { authMiddleware, filterProjects, canReadProject, canWriteProject, type AuthContext } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const buildInfo = {
  sha: process.env.BUILD_SHA ?? process.env.GIT_SHA ?? 'dev',
  time: process.env.BUILD_TIME?.trim() || new Date().toISOString(),
};

// Initialize storage - use same config resolution as CLI
const fluxDir = findFluxDir();
loadEnvLocal(fluxDir);
const config = readConfig(fluxDir);
const DATA_FILE = resolveDataPath(fluxDir, config);

const adapter = createAdapter(DATA_FILE);
setStorageAdapter(adapter);
setAuthFunctions({ generateKey, generateTempToken, validateKey, encrypt, decrypt });
initStore();

console.log(`Flux server using: ${DATA_FILE}`);

// Set up webhook event handler
setWebhookEventHandler(handleWebhookEvent);

// Validate task fields (acceptance_criteria, guardrails)
function validateTaskFields(body: Record<string, unknown>): { error?: string } {
  if (body.acceptance_criteria !== undefined) {
    if (!Array.isArray(body.acceptance_criteria)) {
      return { error: 'acceptance_criteria must be an array' };
    }
    if (body.acceptance_criteria.some((c: unknown) => typeof c !== 'string' || !(c as string).trim())) {
      return { error: 'acceptance_criteria must contain non-empty strings' };
    }
  }
  if (body.guardrails !== undefined) {
    if (!Array.isArray(body.guardrails)) {
      return { error: 'guardrails must be an array' };
    }
    for (const g of body.guardrails as unknown[]) {
      const gr = g as Record<string, unknown>;
      if (typeof gr.number !== 'number' || gr.number <= 0 || !Number.isInteger(gr.number)) {
        return { error: 'guardrail number must be a positive integer' };
      }
      if (typeof gr.text !== 'string' || !gr.text.trim()) {
        return { error: 'guardrail text must be a non-empty string' };
      }
    }
  }
  return {};
}

// Create Hono app with auth context
const app = new Hono<{ Variables: { auth: AuthContext } }>();

// Enable CORS for development
app.use('*', cors());

// Auth middleware (readonly public, writes require FLUX_API_KEY)
app.use('/api/*', authMiddleware);

// Health check endpoint (for load balancers/monitoring)
app.get('/health', (c) => c.json({ status: 'ok' }));

// ============ Live Update Events (SSE) ============
const sseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const sseEncoder = new TextEncoder();
let heartbeatInterval: NodeJS.Timeout | null = null;
let fileChangeTimeout: NodeJS.Timeout | null = null;

const broadcastSse = (event: string, data: unknown) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = sseEncoder.encode(payload);
  for (const controller of sseClients) {
    try {
      controller.enqueue(encoded);
    } catch {
      sseClients.delete(controller);
    }
  }
};

const startHeartbeat = () => {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    const payload = sseEncoder.encode(': keep-alive\n\n');
    for (const controller of sseClients) {
      try {
        controller.enqueue(payload);
      } catch {
        sseClients.delete(controller);
      }
    }
    if (sseClients.size === 0 && heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }, 20000);
};

const notifyDataChange = () => {
  if (fileChangeTimeout) {
    clearTimeout(fileChangeTimeout);
  }
  fileChangeTimeout = setTimeout(() => {
    broadcastSse('data-changed', { ts: Date.now() });
  }, 75);
};

// Watch JSON file for external changes (e.g., CLI updates)
const getMtime = (filePath: string): number => {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
};

let lastMtime = getMtime(DATA_FILE);
let lastWalMtime = getMtime(DATA_FILE + '-wal');

const handleFileChange = () => {
  const nextMtime = getMtime(DATA_FILE);
  const nextWalMtime = getMtime(DATA_FILE + '-wal');
  if (nextMtime !== lastMtime || nextWalMtime !== lastWalMtime) {
    lastMtime = nextMtime;
    lastWalMtime = nextWalMtime;
    adapter.read();
    notifyDataChange();
  }
};

watchFile(DATA_FILE, { interval: 100 }, handleFileChange);
// Also watch SQLite WAL file for changes (WAL mode writes here first)
watchFile(DATA_FILE + '-wal', { interval: 100 }, handleFileChange);

app.get('/api/events', () => {
  let clientController: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clientController = controller;
      sseClients.add(controller);
      controller.enqueue(sseEncoder.encode('event: connected\ndata: "ok"\n\n'));
      startHeartbeat();
    },
    cancel() {
      if (clientController) {
        sseClients.delete(clientController);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

// ============ API Routes ============
app.get('/version', (c) => {
  return c.json(buildInfo);
});

// Projects
app.get('/api/projects', (c) => {
  const auth = c.get('auth');
  const projects = filterProjects(auth).map(p => ({
    ...p,
    stats: getProjectStats(p.id),
  }));
  return c.json(projects);
});

app.get('/api/projects/:id', (c) => {
  const auth = c.get('auth');
  const projectId = c.req.param('id');
  const project = getProject(projectId);
  // Return 404 for both non-existent and private projects (hide existence)
  if (!project || !canReadProject(auth, projectId)) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json({ ...project, stats: getProjectStats(project.id) });
});

app.post('/api/projects', async (c) => {
  const body = await c.req.json();
  const project = createProject(body.name, body.description, body.visibility);
  // Trigger webhook
  triggerWebhooks('project.created', { project });
  return c.json(project, 201);
});

app.patch('/api/projects/:id', async (c) => {
  const body = await c.req.json();
  const previous = getProject(c.req.param('id'));
  const project = updateProject(c.req.param('id'), body);
  if (!project) return c.json({ error: 'Project not found' }, 404);
  // Trigger webhook
  triggerWebhooks('project.updated', { project, previous }, project.id);
  return c.json(project);
});

app.delete('/api/projects/:id', (c) => {
  const project = getProject(c.req.param('id'));
  deleteProject(c.req.param('id'));
  // Trigger webhook
  if (project) {
    triggerWebhooks('project.deleted', { project }, project.id);
  }
  return c.json({ success: true });
});

// Epics
app.get('/api/projects/:projectId/epics', (c) => {
  const epics = getEpics(c.req.param('projectId'));
  return c.json(epics);
});

app.get('/api/epics/:id', (c) => {
  const epic = getEpic(c.req.param('id'));
  if (!epic) return c.json({ error: 'Epic not found' }, 404);
  return c.json(epic);
});

app.post('/api/projects/:projectId/epics', async (c) => {
  const body = await c.req.json();
  const projectId = c.req.param('projectId');
  const epic = createEpic(projectId, body.title, body.notes, body.auto);
  // Trigger webhook
  triggerWebhooks('epic.created', { epic }, projectId);
  return c.json(epic, 201);
});

app.patch('/api/epics/:id', async (c) => {
  const auth = c.get('auth');
  const epicId = c.req.param('id');
  const previous = getEpic(epicId);
  if (!previous) return c.json({ error: 'Epic not found' }, 404);
  if (!canWriteProject(auth, previous.project_id)) {
    return c.json({ error: 'Epic not found' }, 404); // Hide existence
  }
  const body = await c.req.json();
  const epic = updateEpic(epicId, body);
  if (!epic) return c.json({ error: 'Epic not found' }, 404);
  triggerWebhooks('epic.updated', { epic, previous }, epic.project_id);
  return c.json(epic);
});

app.delete('/api/epics/:id', (c) => {
  const auth = c.get('auth');
  const epicId = c.req.param('id');
  const epic = getEpic(epicId);
  if (!epic) return c.json({ error: 'Epic not found' }, 404);
  if (!canWriteProject(auth, epic.project_id)) {
    return c.json({ error: 'Epic not found' }, 404);
  }
  const success = deleteEpic(epicId);
  if (!success) return c.json({ error: 'Epic not found' }, 404);
  triggerWebhooks('epic.deleted', { epic }, epic.project_id);
  return c.json({ success: true });
});

// Tasks
app.get('/api/projects/:projectId/tasks', (c) => {
  const tasks = getTasks(c.req.param('projectId')).map(t => ({
    ...t,
    blocked: isTaskBlocked(t.id),
  }));
  return c.json(tasks);
});

app.get('/api/tasks/:id', (c) => {
  const task = getTask(c.req.param('id'));
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ ...task, blocked: isTaskBlocked(task.id) });
});

app.post('/api/tasks/:id/comments', async (c) => {
  const auth = c.get('auth');
  const taskId = c.req.param('id');
  const task = getTask(taskId);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  if (!canWriteProject(auth, task.project_id)) {
    return c.json({ error: 'Task not found' }, 404);
  }
  const body = await c.req.json().catch(() => null);
  const commentBody = typeof body?.body === 'string' ? body.body.trim() : '';
  if (!commentBody) return c.json({ error: 'Comment body required' }, 400);
  const author = body?.author === 'mcp' ? 'mcp' : 'user';
  const comment = addTaskComment(taskId, commentBody, author);
  if (!comment) return c.json({ error: 'Task not found' }, 404);
  return c.json(comment, 201);
});

app.delete('/api/tasks/:id/comments/:commentId', (c) => {
  const auth = c.get('auth');
  const taskId = c.req.param('id');
  const task = getTask(taskId);
  if (!task) return c.json({ error: 'Comment not found' }, 404);
  if (!canWriteProject(auth, task.project_id)) {
    return c.json({ error: 'Comment not found' }, 404);
  }
  const commentId = c.req.param('commentId');
  const deleted = deleteTaskComment(taskId, commentId);
  if (!deleted) return c.json({ error: 'Comment not found' }, 404);
  return c.json({ success: true });
});

app.post('/api/projects/:projectId/tasks', async (c) => {
  const body = await c.req.json();
  const validation = validateTaskFields(body);
  if (validation.error) return c.json({ error: validation.error }, 400);
  const projectId = c.req.param('projectId');
  const task = createTask(projectId, body.title, body.epic_id, {
    priority: body.priority,
    depends_on: body.depends_on,
    acceptance_criteria: body.acceptance_criteria,
    guardrails: body.guardrails,
  });
  // Trigger webhook
  triggerWebhooks('task.created', { task }, projectId);
  return c.json(task, 201);
});

app.patch('/api/tasks/:id', async (c) => {
  const auth = c.get('auth');
  const taskId = c.req.param('id');
  const previous = getTask(taskId);
  if (!previous) return c.json({ error: 'Task not found' }, 404);
  if (!canWriteProject(auth, previous.project_id)) {
    return c.json({ error: 'Task not found' }, 404);
  }
  const body = await c.req.json();
  const validation = validateTaskFields(body);
  if (validation.error) return c.json({ error: validation.error }, 400);
  const task = updateTask(taskId, body);
  if (!task) return c.json({ error: 'Task not found' }, 404);

  // Determine which webhook events to trigger
  const events: WebhookEventType[] = ['task.updated'];
  if (body.status && previous.status !== body.status) {
    events.push('task.status_changed');
  }
  if (body.archived === true && !previous.archived) {
    events.push('task.archived');
  }
  for (const event of events) {
    triggerWebhooks(event, { task, previous }, task.project_id);
  }

  return c.json({ ...task, blocked: isTaskBlocked(task.id) });
});

app.delete('/api/tasks/:id', (c) => {
  const auth = c.get('auth');
  const taskId = c.req.param('id');
  const task = getTask(taskId);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  if (!canWriteProject(auth, task.project_id)) {
    return c.json({ error: 'Task not found' }, 404);
  }
  const success = deleteTask(taskId);
  if (!success) return c.json({ error: 'Task not found' }, 404);
  triggerWebhooks('task.deleted', { task }, task.project_id);
  return c.json({ success: true });
});

// Ready tasks (unblocked, not done, sorted by priority)
app.get('/api/tasks/ready', (c) => {
  const projectId = c.req.query('project_id');
  const tasks = getReadyTasks(projectId);
  return c.json(tasks);
});

// Cleanup project (archive done tasks and/or delete empty epics)
app.post('/api/projects/:projectId/cleanup', async (c) => {
  const body = await c.req.json();
  const result = cleanupProject(
    c.req.param('projectId'),
    body.archiveTasks ?? true,
    body.archiveEpics ?? true
  );
  return c.json({ success: true, ...result });
});

// Reset database (wipe all data)
app.post('/api/reset', (c) => {
  resetStore();
  return c.json({ success: true });
});

// ============ Webhook Routes ============

// List all webhooks
app.get('/api/webhooks', (c) => {
  const webhooks = getWebhooks();
  return c.json(webhooks);
});

// Get a single webhook
app.get('/api/webhooks/:id', (c) => {
  const webhook = getWebhook(c.req.param('id'));
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404);
  return c.json(webhook);
});

// Create a webhook
app.post('/api/webhooks', async (c) => {
  const body = await c.req.json();
  if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
    return c.json({ error: 'Missing required fields: name, url, events' }, 400);
  }
  const webhook = createWebhook(body.name, body.url, body.events, {
    secret: body.secret,
    project_id: body.project_id,
    enabled: body.enabled,
  });
  return c.json(webhook, 201);
});

// Update a webhook
app.patch('/api/webhooks/:id', async (c) => {
  const body = await c.req.json();
  const webhook = updateWebhook(c.req.param('id'), body);
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404);
  return c.json(webhook);
});

// Delete a webhook
app.delete('/api/webhooks/:id', (c) => {
  const success = deleteWebhook(c.req.param('id'));
  if (!success) return c.json({ error: 'Webhook not found' }, 404);
  return c.json({ success: true });
});

// Test a webhook
app.post('/api/webhooks/:id/test', async (c) => {
  const webhook = getWebhook(c.req.param('id'));
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404);

  const result = await testWebhookDelivery(webhook);
  return c.json({
    success: result.success,
    status_code: result.statusCode,
    response: result.body,
    error: result.error,
  });
});

// Get webhook deliveries
app.get('/api/webhooks/:id/deliveries', (c) => {
  const webhookId = c.req.param('id');
  const webhook = getWebhook(webhookId);
  if (!webhook) return c.json({ error: 'Webhook not found' }, 404);

  const limit = parseInt(c.req.query('limit') || '50');
  const deliveries = getWebhookDeliveries(webhookId, limit);
  return c.json(deliveries);
});

// Get all recent deliveries (admin view)
app.get('/api/webhook-deliveries', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const deliveries = getWebhookDeliveries(undefined, limit);
  return c.json(deliveries);
});

// ============ Auth Routes ============

// Rate limit auth endpoints: 10 requests per minute for init/poll, 5 for key creation
const authRateLimit = rateLimit({ windowMs: 60000, maxRequests: 10 });
const keyCreateRateLimit = rateLimit({ windowMs: 60000, maxRequests: 5 });

// Check if auth is required (for web UI to show login prompt)
app.get('/api/auth/status', (c) => {
  const auth = c.get('auth');
  return c.json({
    authenticated: auth.keyType !== 'anonymous',
    keyType: auth.keyType,
    projectIds: auth.projectIds,
  });
});

// List API keys (server/env key required)
app.get('/api/auth/keys', (c) => {
  const auth = c.get('auth');
  if (auth.keyType !== 'env' && auth.keyType !== 'server') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  // Return keys without hash (security)
  const keys = getApiKeys().map(k => ({
    id: k.id,
    prefix: k.prefix,
    name: k.name,
    scope: k.scope,
    created_at: k.created_at,
    last_used_at: k.last_used_at,
  }));
  return c.json(keys);
});

// Create API key (server/env key required)
app.post('/api/auth/keys', keyCreateRateLimit, async (c) => {
  const auth = c.get('auth');
  if (auth.keyType !== 'env' && auth.keyType !== 'server') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ error: 'Name required' }, 400);
  }
  const scope: KeyScope = body.project_ids
    ? { type: 'project', project_ids: body.project_ids }
    : { type: 'server' };
  const { rawKey, apiKey } = createApiKey(body.name, scope);
  return c.json({
    key: rawKey,  // Only shown once!
    id: apiKey.id,
    prefix: apiKey.prefix,
    name: apiKey.name,
    scope: apiKey.scope,
    created_at: apiKey.created_at,
  }, 201);
});

// Delete API key (server/env key required)
app.delete('/api/auth/keys/:id', (c) => {
  const auth = c.get('auth');
  if (auth.keyType !== 'env' && auth.keyType !== 'server') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const success = deleteApiKey(c.req.param('id'));
  if (!success) return c.json({ error: 'Key not found' }, 404);
  return c.json({ success: true });
});

// CLI auth flow: Start auth request
app.post('/api/auth/cli-init', authRateLimit, (c) => {
  cleanupExpiredAuthRequests();
  const request = createCliAuthRequest();
  return c.json({ token: request.token, expires_at: request.expires_at });
});

// CLI auth flow: Poll for completion
app.post('/api/auth/cli-poll', authRateLimit, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.token) return c.json({ error: 'Token required' }, 400);
  const result = pollCliAuthRequest(body.token);
  return c.json(result);
});

// CLI auth flow: Complete from web (requires existing auth)
app.post('/api/auth/cli-complete', async (c) => {
  const auth = c.get('auth');
  if (auth.keyType === 'anonymous') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const body = await c.req.json();
  if (!body.token || !body.name) {
    return c.json({ error: 'Token and name required' }, 400);
  }
  const scope: KeyScope = body.project_ids
    ? { type: 'project', project_ids: body.project_ids }
    : { type: 'server' };
  const result = completeCliAuthRequest(body.token, body.name, scope);
  if (!result) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }
  return c.json({ success: true });
});

// API 404 handler - must be before SPA fallback
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

// Serve static files from web build (production)
const webDistPath = join(__dirname, '../../web/dist');
if (existsSync(webDistPath)) {
  const indexPath = join(webDistPath, 'index.html');
  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf-8') : null;
  // Hoist serveStatic handler outside request loop for performance
  const staticHandler = serveStatic({ root: webDistPath });
  // Whitelist of known static file extensions (avoid false positives like /projects/v2.0)
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map|json|webp|webm|mp4|mp3|pdf)$/i;

  // Custom SPA-aware static file serving
  // Check if file exists before serving, otherwise fall through to SPA handler
  app.use('/*', async (c, next) => {
    const path = c.req.path;

    // Skip API routes (already handled above)
    if (path.startsWith('/api/')) {
      return next();
    }

    // Check if this is a request for a static file (has known extension)
    if (staticExtensions.test(path)) {
      const filePath = join(webDistPath, path);
      // Security: prevent path traversal attacks
      if (!filePath.startsWith(webDistPath + '/')) {
        return c.notFound();
      }
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        return staticHandler(c, next);
      }
      // File with extension not found - return 404
      return c.notFound();
    }

    // No static extension - this is a SPA route, serve index.html
    if (indexHtml) {
      return c.html(indexHtml);
    }

    return next();
  });
}

// Start server
const port = parseInt(process.env.PORT || '3000');
console.log(`Flux server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
