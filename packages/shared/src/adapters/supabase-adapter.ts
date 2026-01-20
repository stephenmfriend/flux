import type { Store } from '../types.js';
import type { StorageAdapter } from '../store.js';

const defaultData: Store = {
  projects: [],
  epics: [],
  tasks: [],
};

/**
 * Supabase Storage Adapter - Relational Schema
 *
 * Implements the UNIVERSAL SCHEMA pattern using proper relational tables:
 * - projects table
 * - epics table
 * - tasks table
 *
 * This is the standard schema all storage providers should implement.
 *
 * Features:
 * - Proper normalized relational database design
 * - Efficient indexing and queries
 * - Per-row locking for better concurrency
 * - Realtime subscriptions for multi-user sync
 * - PostgreSQL ACID transactions
 * - Automatic backups via Supabase
 *
 * Maintains StorageAdapter interface compatibility by:
 * - Loading all data from tables into memory on read()
 * - Syncing changes back to tables on write()
 *
 * @param url Supabase project URL (e.g., https://xxx.supabase.co)
 * @param key Supabase anon/service key
 * @param options Optional configuration (realtime, etc.)
 */
export function createSupabaseAdapter(
  url: string,
  key: string,
  options?: { realtime?: boolean }
): StorageAdapter {
  let _data: Store = { ...defaultData };
  let _client: any = null;
  let _initialized = false;
  let _initialReadComplete = false;
  let _initialReadPromise: Promise<void> | null = null;
  let _isWriting = false; // Prevent write-triggered reads from triggering more writes
  let _pendingWriteTimeout: NodeJS.Timeout | null = null;

  // Lazy initialization
  const initialize = async () => {
    if (_initialized) return;

    try {
      // Dynamic import to avoid bundling issues
      // @ts-ignore - Optional dependency, will fail at runtime if not installed
      const { createClient } = await import('@supabase/supabase-js');
      _client = createClient(url, key);

      // Setup realtime subscriptions if enabled
      if (options?.realtime) {
        // Subscribe to all three tables
        _client
          .channel('flux-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleRealtimeChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'epics' }, handleRealtimeChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleRealtimeChange)
          .subscribe();
      }

      _initialized = true;
    } catch (error) {
      console.error('[SupabaseAdapter] Initialization failed:', error);
      throw new Error(
        'Supabase client library not found. Install with: bun add @supabase/supabase-js'
      );
    }
  };

  const handleRealtimeChange = (payload: any) => {
    // Ignore changes we caused ourselves
    if (_isWriting) {
      return;
    }

    console.log(`[SupabaseAdapter] Remote change detected: ${payload.table} ${payload.eventType}`);

    // Debounce reads - only refresh after changes stop for 500ms
    if (_pendingWriteTimeout) {
      clearTimeout(_pendingWriteTimeout);
    }

    _pendingWriteTimeout = setTimeout(() => {
      readFromDb()
        .then(data => {
          _data = data;
        })
        .catch(err => {
          console.error('[SupabaseAdapter] Failed to refresh after remote change:', err);
        });
    }, 500);
  };

  const readFromDb = async (): Promise<Store> => {
    await initialize();

    try {
      // Load all data from relational tables in parallel
      const [projectsResult, epicsResult, tasksResult] = await Promise.all([
        _client.from('projects').select('*').order('created_at', { ascending: true }),
        _client.from('epics').select('*').order('created_at', { ascending: true }),
        _client.from('tasks').select('*').order('created_at', { ascending: true }),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (epicsResult.error) throw epicsResult.error;
      if (tasksResult.error) throw tasksResult.error;

      return {
        projects: projectsResult.data || [],
        epics: epicsResult.data || [],
        tasks: tasksResult.data || [],
      };
    } catch (error) {
      console.error('[SupabaseAdapter] Read failed:', error);
      return { ...defaultData };
    }
  };

  const writeToDb = async (store: Store): Promise<void> => {
    await initialize();

    // Set writing flag to prevent realtime loop
    _isWriting = true;

    try {
      // Get current state from database
      const [projectsResult, epicsResult, tasksResult] = await Promise.all([
        _client.from('projects').select('id'),
        _client.from('epics').select('id'),
        _client.from('tasks').select('id'),
      ]);

      if (projectsResult.error) throw new Error(`Failed to fetch projects: ${projectsResult.error.message}`);
      if (epicsResult.error) throw new Error(`Failed to fetch epics: ${epicsResult.error.message}`);
      if (tasksResult.error) throw new Error(`Failed to fetch tasks: ${tasksResult.error.message}`);

      const dbProjectIds = new Set<string>((projectsResult.data || []).map((p: any) => p.id as string));
      const dbEpicIds = new Set<string>((epicsResult.data || []).map((e: any) => e.id as string));
      const dbTaskIds = new Set<string>((tasksResult.data || []).map((t: any) => t.id as string));

      const storeProjectIds = new Set<string>(store.projects.map(p => p.id));
      const storeEpicIds = new Set<string>(store.epics.map(e => e.id));
      const storeTaskIds = new Set<string>(store.tasks.map(t => t.id));

      // Find deletions
      const projectsToDelete = [...dbProjectIds].filter(id => !storeProjectIds.has(id));
      const epicsToDelete = [...dbEpicIds].filter(id => !storeEpicIds.has(id));
      const tasksToDelete = [...dbTaskIds].filter(id => !storeTaskIds.has(id));

      // Execute all operations with detailed error tracking
      const operations: Array<{ type: string; promise: Promise<any> }> = [];

      // Upsert all current data
      if (store.projects.length > 0) {
        operations.push({ type: 'upsert projects', promise: _client.from('projects').upsert(store.projects) });
      }
      if (store.epics.length > 0) {
        operations.push({ type: 'upsert epics', promise: _client.from('epics').upsert(store.epics) });
      }
      if (store.tasks.length > 0) {
        operations.push({ type: 'upsert tasks', promise: _client.from('tasks').upsert(store.tasks) });
      }

      // Delete removed items
      if (projectsToDelete.length > 0) {
        operations.push({ type: 'delete projects', promise: _client.from('projects').delete().in('id', projectsToDelete) });
      }
      if (epicsToDelete.length > 0) {
        operations.push({ type: 'delete epics', promise: _client.from('epics').delete().in('id', epicsToDelete) });
      }
      if (tasksToDelete.length > 0) {
        operations.push({ type: 'delete tasks', promise: _client.from('tasks').delete().in('id', tasksToDelete) });
      }

      const results = await Promise.all(operations.map(op => op.promise));

      // Check for errors with operation context
      for (let i = 0; i < results.length; i++) {
        if (results[i].error) {
          const error = results[i].error;
          throw new Error(`Failed to ${operations[i].type}: ${error.message} (code: ${error.code})`);
        }
      }

      console.log('[SupabaseAdapter] Write successful:', {
        projects: store.projects.length,
        epics: store.epics.length,
        tasks: store.tasks.length,
        deleted: {
          projects: projectsToDelete.length,
          epics: epicsToDelete.length,
          tasks: tasksToDelete.length,
        }
      });
    } catch (error: any) {
      console.error('[SupabaseAdapter] Write failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    } finally {
      // Always clear writing flag, even on error
      setTimeout(() => {
        _isWriting = false;
      }, 1000); // Keep flag set for 1s to avoid immediate realtime callbacks
    }
  };

  return {
    read() {
      // Fire-and-forget async read (loads in background)
      // BUT capture the initial read promise to prevent premature writes
      if (!_initialReadPromise) {
        _initialReadPromise = readFromDb()
          .then(data => {
            _data = data;
            _initialReadComplete = true;
          })
          .catch(err => {
            console.error('[SupabaseAdapter] Initial read failed:', err);
            _initialReadComplete = true; // Allow writes even if read failed
          });
      } else {
        // Subsequent reads
        readFromDb()
          .then(data => {
            _data = data;
          })
          .catch(err => {
            console.error('[SupabaseAdapter] Background read failed:', err);
          });
      }
    },

    write() {
      // Fire-and-forget async write (saves in background)
      // BUT wait for initial read to complete to prevent data loss
      const doWrite = async (retryCount = 0) => {
        try {
          // Wait for initial read to complete
          if (!_initialReadComplete && _initialReadPromise) {
            await _initialReadPromise;
          }

          await writeToDb(_data);
        } catch (err: any) {
          console.error('[SupabaseAdapter] Background write failed:', {
            attempt: retryCount + 1,
            error: err.message,
          });

          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`[SupabaseAdapter] Retrying write in ${delay}ms...`);
            setTimeout(() => {
              doWrite(retryCount + 1);
            }, delay);
          } else {
            console.error('[SupabaseAdapter] Write failed after 3 retries. Data may be lost.');
            // TODO: Could implement a write queue here to persist failed writes
          }
        }
      };

      doWrite();
    },

    get data() {
      return _data;
    },

    isTest: false,
  };
}
