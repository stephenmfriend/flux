import { h } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import { route, RoutableProps } from "preact-router";
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";
import {
  getProjects,
  resetDatabase,
  updateProject,
  type ProjectWithStats,
} from "../stores";
import {
  ConfirmModal,
  Modal,
  AppLayout,
  WebhooksPanel,
  PageHeader,
  StandardPageHeader,
  StandardSearchBar,
  StandardViewToggle,
  StandardButton,
  Spinner,
  type ProjectWithMeta,
  type ProjectMeta
} from "../components";

// Helper to generate consistent mock meta data based on project ID
function generateMockMeta(project: ProjectWithStats): ProjectMeta {
  // Simple hash function for consistency
  const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const aiStatuses: ProjectMeta['aiStatus'][] = ['Idle', 'Running', 'Blocked', 'Failing'];
  const risks: ProjectMeta['risk'][] = ['Green', 'Amber', 'Red'];
  const phases: ('Shaping' | 'Betting' | 'Active' | 'Shipped')[] = ['Shaping', 'Betting', 'Active', 'Shipped'];

  const aiStatus = aiStatuses[hash % 4];
  const risk = risks[hash % 3];
  const primaryPhase = phases[hash % 4];

  return {
    aiStatus,
    risk,
    primaryPhase,
    lanes: {
      shaping: (hash * 3) % 5,
      betting: (hash * 2) % 3,
      active: (hash * 7) % 4,
      shipped: (hash * 5) % 10,
    },
    activeBets: (hash * 2) % 3,
    lastEvent: ['Scope cut 2h ago', 'Shipped 19 01 2026', '6 failures in 30m', 'Blocked 10m ago', 'Merged 3 PRs today'][hash % 5],
    thrash: {
      cuts: (hash * 4) % 4,
      retries: (hash * 6) % 25,
    },
    blockers: {
      count: aiStatus === 'Blocked' || aiStatus === 'Failing' ? 1 : 0,
      reason: aiStatus === 'Blocked' ? 'missing fixture' : aiStatus === 'Failing' ? 'dependency' : undefined
    }
  };
}

export function ProjectList(_props: RoutableProps) {
  // Add h usage to ensure import is used (though jsx uses it implicitly)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _jsx = h;

  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Existing state
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"configuration" | "webhooks" | "reset">("configuration");
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "unknown">("unknown");
  const [sseStatus, setSseStatus] = useState<"online" | "offline" | "unknown">("unknown");
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    refreshProjects();
  }, []);

  const refreshProjects = async () => {
    setLoading(true);
    setApiStatus("unknown");
    try {
      const allProjects = await getProjects();
      // Enrich with mock meta
      const enrichedProjects = allProjects.map(p => ({
        ...p,
        meta: generateMockMeta(p)
      }));
      setProjects(enrichedProjects);
      setApiStatus("online");
    } catch {
      setProjects([]);
      setApiStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project: ProjectWithStats) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
  };

  const closeEditModal = (force = false) => {
    if (saving && !force) return;
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
  };

  const openSettings = () => {
    setSettingsSection("configuration");
    setSettingsOpen(true);
  };

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetDatabase();
      await refreshProjects();
    } finally {
      setResetting(false);
      setResetConfirmOpen(false);
    }
  };

  const handleEditSubmit = async (e: Event) => {
    e.preventDefault();
    if (!editingProject || !editName.trim() || saving) return;

    setSaving(true);
    let didSave = false;
    try {
      await updateProject(editingProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      await refreshProjects();
      didSave = true;
    } finally {
      setSaving(false);
      if (didSave) {
        closeEditModal(true);
      }
    }
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }, [projects, searchQuery]);

  // Group projects by phase
  const groupedProjects = useMemo(() => {
    const groups: Record<string, ProjectWithMeta[]> = {
      'Shaping': [],
      'Betting': [],
      'Active': [],
      'Shipped': []
    };

    filteredProjects.forEach(p => {
      const phase = (p.meta as any)?.primaryPhase || 'Shaping';
      if (groups[phase]) {
        groups[phase].push(p);
      }
    });

    return groups;
  }, [filteredProjects]);

  const phases = ['Shaping', 'Betting', 'Active', 'Shipped'];

  // Status helpers from existing code
  const apiOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const apiLocation = import.meta.env.DEV ? "http://localhost:3000/api" : `${apiOrigin}/api`;
  const sseLocation = import.meta.env.DEV ? "http://localhost:3000/api/events" : `${apiOrigin}/api/events`;
  const statusLabel = (status: "online" | "offline" | "unknown") => {
    if (status === "online") return "Online";
    if (status === "offline") return "Offline";
    return "Checking";
  };
  const statusDotClass = (status: "online" | "offline" | "unknown") => {
    if (status === "online") return "bg-success";
    if (status === "offline") return "bg-error";
    return "bg-base-content/30";
  };

  // Settings Menu Config
  const settingsSections = [
    { id: "configuration", title: "Configuration", subtitle: "API endpoints and realtime status" },
    { id: "webhooks", title: "Webhooks", subtitle: "Outbound events and delivery history" },
    { id: "reset", title: "Reset", subtitle: "Wipe data and start fresh" },
  ] as const;

  if (loading) {
    return (
      <AppLayout currentPath="/" breadcrumbs={[{ label: 'Projects', active: true }]}>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout
        currentPath="/"
        breadcrumbs={[{ label: 'Projects', active: true }]}
        userInitials="U"
        onFeedbackClick={openSettings}
      >
        <div className="p-6">

          {/* Page Header with Description */}
          <StandardPageHeader
            title="Projects"
            subtitle="Organize work into self-contained projects."
            toolbar={
              <>
                <StandardSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search projects..."
                />
                <StandardViewToggle
                  value={viewMode}
                  onChange={(mode) => setViewMode(mode)}
                  options={[
                    {
                      value: 'grid',
                      icon: (
                        <svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                          <rect x='3' y='3' width='7' height='7'></rect>
                          <rect x='14' y='3' width='7' height='7'></rect>
                          <rect x='14' y='14' width='7' height='7'></rect>
                          <rect x='3' y='14' width='7' height='7'></rect>
                        </svg>
                      )
                    },
                    {
                      value: 'table',
                      icon: (
                        <svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                          <path d="M3 12h18M3 6h18M3 18h18"></path>
                        </svg>
                      )
                    }
                  ]}
                />
                <StandardButton icon={
                  <svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path d='M3 6h18M3 12h18M3 18h18' />
                  </svg>
                }>
                  Filter
                </StandardButton>
                <StandardButton onClick={refreshProjects} icon={
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                }>
                  Sync
                </StandardButton>
                <StandardButton variant="primary" onClick={() => route('/new')} icon={
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }>
                  New Project
                </StandardButton>
              </>
            }
          />

          {/* Legend Section - Grouped using Gestalt Proximity */}
          <div className="info-strip mb-6 py-3">
            <div className="info-group">
              <span className="info-label">AI State</span>
              <div className="flex gap-4">
                <span className="badge badge-gray">Idle</span>
                <span className="badge badge-green">Running</span>
                <span className="badge badge-yellow">Blocked</span>
                <span className="badge badge-red">Failing</span>
              </div>
            </div>

            <div className="info-separator h-6"></div>

            <div className="info-group">
              <span className="info-label">Risk Level</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-2">
                  <div className="status-dot status-dot-green"></div>
                  <span className="info-value">Green</span>
                </span>
                <span className="flex items-center gap-2">
                  <div className="status-dot status-dot-yellow"></div>
                  <span className="info-value">Amber</span>
                </span>
                <span className="flex items-center gap-2">
                  <div className="status-dot status-dot-red"></div>
                  <span className="info-value">Red</span>
                </span>
              </div>
            </div>

            <div className="info-separator h-6"></div>

            <div className="info-group">
              <span className="info-label">Progress</span>
              <div className="flex items-center gap-4">
                <div className="flex gap-[1px]">
                  <div className="w-2 h-2 rounded-[1px] bg-[#3ecf8e]"></div>
                  <div className="w-2 h-2 rounded-[1px] border border-text-low/30"></div>
                  <div className="w-2 h-2 rounded-[1px] border border-text-low/30"></div>
                </div>
                <span className="info-value">Active Bets</span>
              </div>
            </div>

            <div className="info-separator h-6"></div>

            <div className="info-group">
              <span className="info-label">Thrash</span>
              <span className="info-value">Cuts / Retries</span>
            </div>
          </div>

          {/* Project Content Section */}
          <section className="mt-6">
            {/* Section Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-high tracking-tight">
                  All Projects
                </h2>
                <p className="text-xs text-text-medium mt-1">
                  {filteredProjects.length} projects sorted by workflow phase
                </p>
              </div>
            </div>

            <div className="min-w-[800px] overflow-x-auto">
              {/* List Header */}
              <div className="grid grid-cols-[200px_100px_100px_80px_180px_100px_100px] gap-4 px-4 py-2 text-[10px] font-bold text-text-low uppercase tracking-widest border-b border-border-default mb-4 bg-bg-base z-10">
                <div>Name</div>
                <div>AI State</div>
                <div>Risk</div>
                <div>Active</div>
                <div>Last Event</div>
                <div>Blockers</div>
                <div>Thrash</div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">No projects found</div>
                  <div className="empty-state-description">
                    {projects.length === 0
                      ? 'Get started by creating your first project'
                      : 'Try adjusting your search or filters'}
                  </div>
                  {projects.length === 0 && (
                    <button className="btn mt-4" onClick={() => route('/new')}>Create First Project</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-8 pb-20">
                  {phases.map(phase => {
                    const phaseProjects = groupedProjects[phase];
                    if (!phaseProjects || phaseProjects.length === 0) return null;

                    return (
                      <div key={phase} className="rounded-xl border border-border-subtle bg-bg-surface/30 overflow-hidden">
                        {/* Phase Group Header */}
                        <div className="flex items-center px-4 py-3 bg-bg-surface border-b border-border-subtle">
                          <div className={`status-dot mr-3 ${phase === 'Shaping' ? 'status-dot-gray' :
                            phase === 'Betting' ? 'status-dot-yellow' :
                              phase === 'Active' ? 'status-dot-green' :
                                'status-dot-purple'
                            }`}></div>
                          <h3 className="text-sm font-semibold text-text-high">{phase}</h3>
                          <span className="text-text-medium text-xs ml-2">
                            {phaseProjects.length}
                          </span>
                        </div>

                        {/* Phase Projects */}
                        <div className="divide-y divide-border-subtle/30">
                          {phaseProjects.map((project) => (
                            <div key={project.id} className="group hover:bg-bg-surface-hover/30 transition-colors">
                              {/* Main Project Row */}
                              <div className="grid grid-cols-[200px_100px_100px_80px_180px_100px_100px] gap-4 px-4 py-3 items-center">
                                <div className="font-bold text-text-high cursor-pointer hover:text-[#3ecf8e] transition-colors" onClick={() => route(`/board/${project.id}`)}>
                                  {project.name}
                                </div>

                                <div className={`text-xs font-bold uppercase tracking-wider ${project.meta?.aiStatus === 'Running' ? 'text-brand-primary' :
                                  project.meta?.aiStatus === 'Blocked' ? 'text-amber-500' :
                                    project.meta?.aiStatus === 'Failing' ? 'text-red-500' :
                                      'text-text-medium'
                                  }`}>
                                  {project.meta?.aiStatus}
                                </div>

                                <div className={`text-xs font-bold uppercase tracking-wider ${project.meta?.risk === 'Green' ? 'text-[#3ecf8e]' :
                                  project.meta?.risk === 'Amber' ? 'text-amber-500' :
                                    'text-red-500'
                                  }`}>
                                  {project.meta?.risk}
                                </div>

                                <div className="text-sm font-mono text-text-high ml-4">
                                  {project.meta?.activeBets}
                                </div>

                                <div className="text-xs text-text-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                  {project.meta?.lastEvent}
                                </div>

                                <div className={`text-sm font-mono ml-6 ${project.meta?.blockers?.count ? 'text-red-500 font-bold' : 'text-text-medium'}`}>
                                  {project.meta?.blockers?.count}
                                </div>

                                <div className="text-sm font-mono text-text-medium">
                                  {project.meta?.thrash?.cuts} / {project.meta?.thrash?.retries}
                                </div>
                              </div>

                              {/* Phases Sub-rows */}
                              <div className="relative ml-8 pb-3 space-y-0.5">
                                <div className="absolute left-[-12px] top-0 bottom-4 w-px bg-border-subtle/40"></div>
                                {[
                                  { label: 'Shaping', val: project.meta?.lanes?.shaping || 0 },
                                  { label: 'Betting', val: project.meta?.lanes?.betting || 0 },
                                  { label: 'Active', val: project.meta?.lanes?.active || 0 },
                                  { label: 'Shipped', val: project.meta?.lanes?.shipped || 0 }
                                ].map((p, i) => (
                                  <div key={p.label} className="relative flex items-center gap-4 py-0.5 h-5">
                                    <div className="absolute left-[-12px] w-3 h-px bg-border-subtle/40"></div>
                                    <div className="w-[80px] text-[10px] text-text-medium/60 font-medium pl-1">
                                      {p.label}
                                    </div>
                                    <div className="flex gap-[3px]">
                                      {[1, 2, 3, 4, 5].map(k => (
                                        <div key={k} className={`w-1.5 h-1.5 rounded-[1px] ${k <= p.val
                                          ? (p.val >= 4 ? 'bg-[#3ecf8e]' : 'bg-text-high')
                                          : 'bg-bg-surface-hover/50'
                                          }`}></div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Project Button */}
              <div className="mt-6 border-t border-dashed border-border-subtle pt-6 pb-20">
                <button
                  onClick={() => route('/new')}
                  className="btn-dashed-add"
                >
                  <span className="text-lg leading-none">+</span> New Project
                </button>
              </div>
            </div>
          </section>
        </div>
      </AppLayout>

      {/* Settings Modal (kept same as before) */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        boxClassName="!w-[80vw] !h-[80vh] !max-w-none !max-h-none overflow-y-auto"
      >
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="bg-base-200 rounded-box p-0">
            <ul className="menu">
              {settingsSections.map((section) => {
                const isActive = settingsSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      className={`rounded-none flex flex-col items-start gap-0.5 ${isActive
                        ? "bg-base-300 border-l-4 border-primary"
                        : ""
                        }`}
                      onClick={() => setSettingsSection(section.id)}
                    >
                      <span className="font-medium">{section.title}</span>
                      <span className="text-xs text-base-content/60">
                        {section.subtitle}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-base-100 rounded-box border border-base-200 p-4 min-h-[360px]">
            {settingsSection === "configuration" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">Configuration</h4>
                  <p className="text-sm text-base-content/60">
                    Read-only diagnostics for your Flux instance.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-base-200 p-3">
                    <div className="text-xs uppercase tracking-wide text-base-content/60">
                      API Location
                    </div>
                    <div className="mt-1 font-mono text-xs">{apiLocation}</div>
                  </div>
                  <div className="rounded-lg border border-base-200 p-3">
                    <div className="text-xs uppercase tracking-wide text-base-content/60">
                      Events Stream
                    </div>
                    <div className="mt-1 font-mono text-xs">{sseLocation}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-base-200 p-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusDotClass(
                        apiStatus
                      )}`}
                    ></span>
                    <div>
                      <div className="text-sm font-medium">API Status</div>
                      <div className="text-xs text-base-content/60">
                        {statusLabel(apiStatus)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-base-200 p-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusDotClass(
                        sseStatus
                      )}`}
                    ></span>
                    <div>
                      <div className="text-sm font-medium">SSE Updates</div>
                      <div className="text-xs text-base-content/60">
                        {statusLabel(sseStatus)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === "webhooks" && (
              <div className="space-y-4">
                <WebhooksPanel />
              </div>
            )}

            {settingsSection === "reset" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">Reset Database</h4>
                  <p className="text-sm text-base-content/60">
                    This will wipe all projects, tasks, epics, and webhooks.
                  </p>
                </div>
                <div className="alert alert-warning">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>
                    This action is permanent. You cannot undo a reset.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={resetting}
                >
                  {resetting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Reset Database"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal >

      <Modal
        isOpen={!!editingProject}
        onClose={closeEditModal}
        title="Edit Project"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Project Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={editName}
              onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={editDescription}
              onInput={(e) =>
                setEditDescription((e.target as HTMLTextAreaElement).value)
              }
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => closeEditModal()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!editName.trim() || saving}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={resetConfirmOpen}
        title="Reset Database?"
        description="This will wipe all projects, tasks, epics, and webhooks. This action cannot be undone."
        confirmLabel="Reset"
        confirmClassName="btn-error"
        onConfirm={handleReset}
        onClose={() => {
          if (!resetting) setResetConfirmOpen(false);
        }}
        isLoading={resetting}
      />
    </>
  );
}
