import { useState, useEffect, useRef } from 'preact/hooks'
import { route, RoutableProps } from 'preact-router'
import { SignIn, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { completeCliAuth, getAuthStatus, getProjects, getMyApiKeys, createApiKey, deleteApiKey, type ProjectWithStats, type ApiKeyInfo } from '../stores/api'
import { setToken, clearToken, isClerkEnabled, useFluxAuth } from '../stores/auth'

interface AuthProps extends RoutableProps {
  token?: string
}

function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const { isClerkUser } = useFluxAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [keysData, projectsData] = await Promise.all([
        getMyApiKeys(),
        getProjects(),
      ])
      setKeys(keysData)
      setProjects(projectsData)
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: Event) => {
    e.preventDefault()
    if (!newKeyName.trim() || creating) return
    setCreating(true)
    try {
      const result = await createApiKey(newKeyName.trim(), selectedProjects.length > 0 ? selectedProjects : undefined)
      setNewKey(result.key)
      setNewKeyName('')
      setSelectedProjects([])
      loadData()
    } catch {
      // Ignore
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key?')) return
    await deleteApiKey(id)
    loadData()
  }

  if (loading) {
    return <span class="loading loading-spinner loading-sm"></span>
  }

  return (
    <div class="space-y-4">
      <h3 class="font-semibold">Your API Keys</h3>

      {newKey && (
        <div class="alert alert-success">
          <div>
            <p class="font-semibold">API Key Created</p>
            <p class="text-xs opacity-70">Copy this key now - you won't see it again!</p>
            <code class="block mt-2 p-2 bg-base-200 rounded text-xs break-all">{newKey}</code>
          </div>
          <button class="btn btn-sm btn-ghost" onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      {keys.length > 0 ? (
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Scope</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td><code class="text-xs">{k.prefix}...</code></td>
                  <td>{k.scope.type === 'server' ? 'Server' : `${k.scope.project_ids.length} projects`}</td>
                  <td class="text-xs opacity-70">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-xs btn-ghost btn-error" onClick={() => handleDelete(k.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p class="text-sm opacity-70">No API keys yet.</p>
      )}

      <form onSubmit={handleCreate} class="space-y-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">New Key Name</span>
          </label>
          <input
            type="text"
            placeholder="My CLI Key"
            class="input input-bordered input-sm w-full"
            value={newKeyName}
            onInput={(e) => setNewKeyName((e.target as HTMLInputElement).value)}
          />
        </div>

        {isClerkUser && projects.length > 0 && (
          <div class="form-control">
            <label class="label">
              <span class="label-text">Limit to Projects (optional)</span>
            </label>
            <div class="max-h-32 overflow-y-auto border rounded-lg p-2">
              {projects.map((p) => (
                <label key={p.id} class="flex items-center gap-2 p-1 cursor-pointer hover:bg-base-200 rounded">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={selectedProjects.includes(p.id)}
                    onChange={(e) => {
                      const checked = (e.target as HTMLInputElement).checked
                      setSelectedProjects(
                        checked
                          ? [...selectedProjects, p.id]
                          : selectedProjects.filter((id) => id !== p.id)
                      )
                    }}
                  />
                  <span class="text-sm">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          class="btn btn-sm btn-primary"
          disabled={!newKeyName.trim() || creating}
        >
          {creating ? <span class="loading loading-spinner loading-xs"></span> : 'Create Key'}
        </button>
      </form>
    </div>
  )
}

export function Auth({ token: urlToken }: AuthProps) {
  const clerkEnabled = isClerkEnabled()
  // Store token in ref to persist after URL clear
  const tokenRef = useRef(urlToken)
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'server' | 'project'>('server')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = clerkEnabled ? useUser() : { user: null }

  // Clear token from URL to prevent leakage via history/referrer
  useEffect(() => {
    if (urlToken && window.history.replaceState) {
      window.history.replaceState({}, '', '/auth')
    }
  }, [urlToken])

  useEffect(() => {
    checkAuth()
    loadProjects()
  }, [])

  const checkAuth = async () => {
    try {
      const status = await getAuthStatus()
      setAuthenticated(status.authenticated)
    } catch {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const p = await getProjects()
      setProjects(p)
    } catch {
      // Projects may not be accessible without auth
    }
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    const token = tokenRef.current
    if (!token) {
      setError('No auth token provided')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const projectIds = scope === 'project' ? selectedProjects : undefined
      const result = await completeCliAuth(token, name.trim(), projectIds)
      if (result.success) {
        setSuccess(true)
      } else {
        setError('Failed to complete authentication')
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = (e: Event) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const tokenInput = form.elements.namedItem('apiKey') as HTMLInputElement
    if (tokenInput?.value) {
      setToken(tokenInput.value)
      setAuthenticated(true)
      if (tokenRef.current) {
        // CLI auth flow - refresh to re-check auth
        window.location.reload()
      } else {
        // Standalone login - go to dashboard
        route('/')
      }
    }
  }

  if (loading) {
    return (
      <div class="min-h-screen bg-base-200 flex items-center justify-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Success state for CLI auth
  if (success) {
    return (
      <div class="min-h-screen bg-base-200 flex items-center justify-center">
        <div class="card w-96 bg-base-100 shadow-xl">
          <div class="card-body text-center">
            <div class="text-6xl mb-4">✓</div>
            <h2 class="card-title text-2xl justify-center mb-4">Authorized!</h2>
            <p class="opacity-70">
              The CLI has been authorized. You can close this window.
            </p>
            <div class="card-actions justify-center mt-4">
              <button class="btn btn-ghost" onClick={() => route('/')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CLI auth flow with token
  if (tokenRef.current) {
    // If Clerk is enabled and user is signed in, show CLI auth form
    if (clerkEnabled) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <SignedIn>
            <div class="card w-96 bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="card-title text-2xl">Authorize CLI</h2>
                  <UserButton />
                </div>
                <p class="text-sm opacity-70 mb-4">
                  Create an API key for the Flux CLI.
                </p>

                {error && (
                  <div class="alert alert-error mb-4">
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div class="form-control mb-4">
                    <label class="label">
                      <span class="label-text">Key Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="My CLI Key"
                      class="input input-bordered w-full"
                      value={name}
                      onInput={(e) => setName((e.target as HTMLInputElement).value)}
                      required
                    />
                  </div>

                  <div class="form-control mb-4">
                    <label class="label">
                      <span class="label-text">Access Scope</span>
                    </label>
                    <select
                      class="select select-bordered w-full"
                      value={scope}
                      onChange={(e) => setScope((e.target as HTMLSelectElement).value as 'server' | 'project')}
                    >
                      <option value="server">Full Access (Server Key)</option>
                      <option value="project">Limited to Specific Projects</option>
                    </select>
                  </div>

                  {scope === 'project' && (
                    <div class="form-control mb-4">
                      <label class="label">
                        <span class="label-text">Select Projects</span>
                      </label>
                      <div class="max-h-40 overflow-y-auto border rounded-lg p-2">
                        {projects.length === 0 ? (
                          <p class="text-sm opacity-50 p-2">No projects available</p>
                        ) : (
                          projects.map((p) => (
                            <label key={p.id} class="flex items-center gap-2 p-1 cursor-pointer hover:bg-base-200 rounded">
                              <input
                                type="checkbox"
                                class="checkbox checkbox-sm"
                                checked={selectedProjects.includes(p.id)}
                                onChange={(e) => {
                                  const checked = (e.target as HTMLInputElement).checked
                                  setSelectedProjects(
                                    checked
                                      ? [...selectedProjects, p.id]
                                      : selectedProjects.filter((id) => id !== p.id)
                                  )
                                }}
                              />
                              <span class="text-sm">{p.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div class="card-actions justify-end">
                    <button type="button" class="btn btn-ghost" onClick={() => window.close()}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      disabled={!name.trim() || submitting || (scope === 'project' && selectedProjects.length === 0)}
                    >
                      {submitting ? <span class="loading loading-spinner loading-sm"></span> : 'Authorize'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <div class="card w-96 bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-2xl mb-4">Sign In to Authorize CLI</h2>
                <SignIn routing="hash" />
              </div>
            </div>
          </SignedOut>
        </div>
      )
    }

    // API key auth for CLI (no Clerk)
    if (!authenticated) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <div class="card w-96 bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">Login Required</h2>
              <p class="text-sm opacity-70 mb-4">
                Enter your API key to authorize this CLI session.
              </p>
              <form onSubmit={handleLogin}>
                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text">API Key</span>
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    placeholder="flx_..."
                    class="input input-bordered w-full"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary w-full">
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      )
    }

    // Authenticated with API key, show CLI auth form
    return (
      <div class="min-h-screen bg-base-200 flex items-center justify-center">
        <div class="card w-96 bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">Authorize CLI</h2>
            <p class="text-sm opacity-70 mb-4">
              Create an API key for the Flux CLI.
            </p>

            {error && (
              <div class="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Key Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="My CLI Key"
                  class="input input-bordered w-full"
                  value={name}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Access Scope</span>
                </label>
                <select
                  class="select select-bordered w-full"
                  value={scope}
                  onChange={(e) => setScope((e.target as HTMLSelectElement).value as 'server' | 'project')}
                >
                  <option value="server">Full Access (Server Key)</option>
                  <option value="project">Limited to Specific Projects</option>
                </select>
              </div>

              {scope === 'project' && (
                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text">Select Projects</span>
                  </label>
                  <div class="max-h-40 overflow-y-auto border rounded-lg p-2">
                    {projects.length === 0 ? (
                      <p class="text-sm opacity-50 p-2">No projects available</p>
                    ) : (
                      projects.map((p) => (
                        <label key={p.id} class="flex items-center gap-2 p-1 cursor-pointer hover:bg-base-200 rounded">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-sm"
                            checked={selectedProjects.includes(p.id)}
                            onChange={(e) => {
                              const checked = (e.target as HTMLInputElement).checked
                              setSelectedProjects(
                                checked
                                  ? [...selectedProjects, p.id]
                                  : selectedProjects.filter((id) => id !== p.id)
                              )
                            }}
                          />
                          <span class="text-sm">{p.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div class="card-actions justify-end">
                <button type="button" class="btn btn-ghost" onClick={() => window.close()}>
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={!name.trim() || submitting || (scope === 'project' && selectedProjects.length === 0)}
                >
                  {submitting ? <span class="loading loading-spinner loading-sm"></span> : 'Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // No CLI token - show login/profile page
  if (clerkEnabled) {
    return (
      <div class="min-h-screen bg-base-200 flex items-center justify-center">
        <SignedIn>
          <div class="card w-[28rem] bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title text-2xl">Account</h2>
                <UserButton />
              </div>
              {user && (
                <p class="text-sm opacity-70 mb-4">
                  Signed in as {user.primaryEmailAddress?.emailAddress}
                </p>
              )}
              <ApiKeyManager />
              <div class="divider"></div>
              <div class="card-actions justify-between">
                <button class="btn btn-ghost" onClick={() => route('/')}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <div class="card w-96 bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">Sign In</h2>
              <SignIn routing="hash" />
              <div class="divider">OR</div>
              <p class="text-sm opacity-50 text-center">
                Use an API key instead
              </p>
              <form onSubmit={handleLogin}>
                <div class="form-control mb-4">
                  <input
                    type="password"
                    name="apiKey"
                    placeholder="flx_..."
                    class="input input-bordered input-sm w-full"
                  />
                </div>
                <button type="submit" class="btn btn-sm btn-outline w-full">
                  Login with API Key
                </button>
              </form>
              <div class="card-actions justify-center mt-2">
                <button class="btn btn-ghost btn-sm" onClick={() => route('/')}>
                  Continue without login
                </button>
              </div>
            </div>
          </div>
        </SignedOut>
      </div>
    )
  }

  // No Clerk - API key only flow
  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">Login</h2>

          {authenticated ? (
            <>
              <p class="text-sm opacity-70 mb-4">You are logged in.</p>
              <div class="card-actions justify-between">
                <button class="btn btn-ghost" onClick={() => route('/')}>
                  Go to Dashboard
                </button>
                <button
                  class="btn btn-outline btn-error"
                  onClick={() => {
                    clearToken()
                    window.location.reload()
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <p class="text-sm opacity-70 mb-4">
                Enter your API key to access the dashboard.
              </p>
              <form onSubmit={handleLogin}>
                <div class="form-control mb-4">
                  <input
                    type="password"
                    name="apiKey"
                    placeholder="flx_..."
                    class="input input-bordered w-full"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary w-full">
                  Login
                </button>
              </form>
              <div class="divider">OR</div>
              <p class="text-sm opacity-50 text-center">
                Run <code class="bg-base-200 px-1 rounded">flux auth</code> from CLI
              </p>
              <div class="card-actions justify-center mt-2">
                <button class="btn btn-ghost btn-sm" onClick={() => route('/')}>
                  Continue without login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
