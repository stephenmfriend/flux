import type { JSX } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import { route, RoutableProps } from "preact-router";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  getProject,
  getTasks,
  getEpics,
  updateEpic,
  updateTask,
  cleanupProject,
  type TaskWithBlocked,
} from "../stores";
import type { Epic } from "@flux/shared";
import { STATUSES, STATUS_CONFIG, EPIC_COLORS } from "@flux/shared";
import {
  TaskForm,
  EpicForm,
  BetCard,
  DraggableTaskCard,
  DroppableColumn,
  AppLayout,
  StandardPageHeader,
  StandardSearchBar,
  StandardViewToggle,
  StandardButton,
  BetControlStrip,
} from "../components";
import './Board.css';
import { useBoardPreferences } from "../hooks/useBoardPreferences";
import {
  Bars3BottomLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

interface BoardProps extends RoutableProps {
  projectId?: string;
}

// Get color for epic based on index
function getEpicColor(epicId: string, epics: Epic[]): string {
  const index = epics.findIndex((e) => e.id === epicId);
  return EPIC_COLORS[index % EPIC_COLORS.length] ?? EPIC_COLORS[0] ?? '#9ca3af';
}

export function Board({ projectId }: BoardProps): JSX.Element {
  const [tasks, setTasks] = useState<TaskWithBlocked[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [epicFormOpen, setEpicFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithBlocked | undefined>(
    undefined
  );
  const [editingEpic, setEditingEpic] = useState<Epic | undefined>(undefined);
  const [defaultEpicId, setDefaultEpicId] = useState<string | undefined>(
    undefined
  );

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEpicId, setFilterEpicId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Cleanup dialog state
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupArchiveTasks, setCleanupArchiveTasks] = useState(true);
  const [cleanupArchiveEpics, setCleanupArchiveEpics] = useState(true);

  // Board preferences (persisted to localStorage)
  const { } = useBoardPreferences(projectId ?? "");

  // Configure sensors with activation constraint to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (projectId === undefined) {
      route("/");
      return;
    }
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (projectId === undefined) return;
    const eventsBase = import.meta.env.DEV ? "http://localhost:3000" : "";
    let source: EventSource | null = null;
    let refreshTimeout: number | null = null;
    let reconnectTimeout: number | null = null;
    let isMounted = true;

    const scheduleRefresh = (): void => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
      refreshTimeout = window.setTimeout(() => {
        void refreshData();
      }, 100);
    };

    const connect = (): void => {
      if (!isMounted) return;

      source = new EventSource(`${eventsBase}/api/events`);

      source.addEventListener("data-changed", scheduleRefresh);

      source.addEventListener("connected", () => {
        // Refresh data on reconnect to catch any missed updates
        scheduleRefresh();
      });

      source.onerror = () => {
        source?.close();
        // Reconnect after 2 seconds
        if (isMounted) {
          reconnectTimeout = window.setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
      if (reconnectTimeout !== null) {
        window.clearTimeout(reconnectTimeout);
      }
      source?.close();
    };
  }, [projectId]);

  const loadProject = async (): Promise<void> => {
    if (projectId === undefined) return;
    setLoading(true);
    const project = await getProject(projectId);
    if (project === null) {
      route("/");
      return;
    }
    setProjectName(project.name);
    await refreshData();
    setLoading(false);
  };

  const refreshData = async (): Promise<void> => {
    if (projectId === undefined) return;
    const [tasksData, epicsData] = await Promise.all([
      getTasks(projectId),
      getEpics(projectId),
    ]);
    setTasks(tasksData);
    setEpics(epicsData);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (over === null) return;

    const taskId = active.id as string;
    const dropZoneId = over.id as string;
    const [newStatus, epicPart] = dropZoneId.split(":");
    const newEpicId = epicPart === "unassigned" ? undefined : epicPart;

    const task = tasks.find((t) => t.id === taskId);
    if (task === undefined) return;

    if (task.status !== newStatus || task.epic_id !== newEpicId) {
      await updateTask(taskId, {
        status: newStatus,
        epic_id: newEpicId,
      });
      await refreshData();
    }
  };

  // Task form handlers
  const openNewTask = (epicId?: string): void => {
    setEditingTask(undefined);
    setDefaultEpicId(epicId);
    setTaskFormOpen(true);
  };

  const toggleEpicAuto = async (epic: Epic, auto: boolean): Promise<void> => {
    const updated = await updateEpic(epic.id, { auto });
    if (updated !== null) {
      setEpics((prev) => prev.map((item) => (item.id === epic.id ? updated : item)));
    }
  };

  const openEditTask = (task: TaskWithBlocked): void => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const closeTaskForm = (): void => {
    setTaskFormOpen(false);
    setEditingTask(undefined);
    setDefaultEpicId(undefined);
  };

  // Epic form handlers
  const openNewEpic = (): void => {
    setEditingEpic(undefined);
    setEpicFormOpen(true);
  };

  const closeEpicForm = (): void => {
    setEpicFormOpen(false);
    setEditingEpic(undefined);
  };

  // Cleanup handlers
  const handleCleanup = async (): Promise<void> => {
    if (projectId === undefined) return;
    await cleanupProject(projectId, cleanupArchiveTasks, cleanupArchiveEpics);
    setCleanupDialogOpen(false);
    setCleanupArchiveTasks(true);
    setCleanupArchiveEpics(true);
    await refreshData();
  };

  // Memoized filter function
  const filterTask = useMemo(() => {
    return (task: TaskWithBlocked): boolean => {
      if (searchQuery !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const commentsText = task.comments?.map(c => c.body).join(" ") ?? "";
        const matchesComments = commentsText.toLowerCase().includes(query);
        if (!matchesTitle && !matchesComments) return false;
      }
      if (filterStatus !== "all" && task.status !== filterStatus) return false;
      return true;
    };
  }, [searchQuery, filterStatus]);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(filterTask);
  }, [tasks, filterTask]);

  // Derived epic stats
  const epicStats = useMemo(() => {
    const map = new Map<string | undefined, { total: number; done: number }>();
    for (const t of filteredTasks) {
      const key = t.epic_id;
      const stats = map.get(key) ?? { total: 0, done: 0 };
      stats.total += 1;
      if (t.status === 'done') stats.done += 1;
      map.set(key, stats);
    }
    return map;
  }, [filteredTasks]);

  const epicLaneStats = useMemo(() => {
    const map = new Map<string, { planning: number; todo: number; in_progress: number; done: number }>();
    for (const t of filteredTasks) {
      if (!t.epic_id) continue;
      const s = map.get(t.epic_id) ?? { planning: 0, todo: 0, in_progress: 0, done: 0 };
      if (t.status === 'planning') s.planning++;
      else if (t.status === 'todo') s.todo++;
      else if (t.status === 'in_progress') s.in_progress++;
      else if (t.status === 'done') s.done++;
      map.set(t.epic_id, s);
    }
    return map;
  }, [filteredTasks]);

  // Memoized getColumnTasks function
  const getColumnTasks = useMemo(() => {
    return (status: string, epicId: string | undefined): TaskWithBlocked[] =>
      filteredTasks.filter((t) => t.epic_id === epicId && t.status === status);
  }, [filteredTasks]);

  // Memoized getEpicTaskCount function
  const getEpicTaskCount = useMemo(() => {
    return (epicId: string | undefined): number =>
      filteredTasks.filter((t) => t.epic_id === epicId).length;
  }, [filteredTasks]);

  // Get count of done tasks (for archive button) - memoized
  const doneTaskCount = useMemo(() => {
    return tasks.filter((t) => t.status === "done").length;
  }, [tasks]);

  // Generate drop zone ID
  const getDropZoneId = (status: string, epicId: string | undefined): string =>
    `${status}:${epicId ?? "unassigned"}`;

  if (loading) {
    return (
      <AppLayout
        currentPath={`/board/${projectId}`}
        breadcrumbs={[{ label: 'Loading...', active: true }]}
      >
        <div class="flex items-center justify-center" style="min-height: 80vh;">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Projects', path: '/', active: false },
    { label: projectName, badge: projectId ?? '', active: true },
  ];

  // Bets-only overview (no tasks on this page)
  return (
    <AppLayout currentPath={`/board/${projectId}`} breadcrumbs={breadcrumbs} userInitials="U">
      <div className="p-6">
          <StandardPageHeader
            title="Bets"
            subtitle={<span className="text-sm text-text-medium">{projectName}</span>}
            toolbar={
              <>
                <StandardSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search bets..." aria-label="Search bets" />
                <StandardViewToggle<'grid' | 'table'>
                  value={viewMode}
                  onChange={setViewMode}
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
                  aria-label="Toggle bets view"
                />
                <StandardButton icon={
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 6h18M3 12h18M3 18h18"></path>
                  </svg>
                }>
                  Filter
                </StandardButton>
                <StandardButton onClick={() => void refreshData()} icon={
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                }>
                  Sync <span className="opacity-50 text-[11px] ml-1 font-normal">Just now</span>
                </StandardButton>
                <div className="relative">
                  <select
                    className="h-9 pl-3 pr-8 bg-bg-surface border border-border-subtle rounded-md text-sm text-text-medium outline-none focus:border-text-medium/30 appearance-none cursor-pointer hover:text-text-high hover:border-text-medium/30 transition-colors"
                    value={filterEpicId}
                    onChange={(e) => setFilterEpicId((e.target as HTMLSelectElement).value)}
                  >
                    <option value="all">All Bets</option>
                    {epics.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                {(searchQuery !== '' || filterEpicId !== 'all') && (
                  <StandardButton onClick={() => { setSearchQuery(''); setFilterEpicId('all') }} aria-label="Clear filters">Clear</StandardButton>
                )}
                <div className="w-px h-4 bg-border-subtle mx-1" />
                <StandardButton onClick={() => setCleanupDialogOpen(true)} aria-label="Clean up board">Clean Up</StandardButton>
                <div className="w-px h-4 bg-border-subtle mx-1" />
                <StandardButton onClick={openNewEpic} aria-label="Create new epic">New Epic</StandardButton>
              </>
            }
          />
        <section className="mt-6">
        {viewMode === 'grid' ? (
          <>
          <div class="grid gap-6 pb-20" style="grid-template-columns: repeat(auto-fill, 340px)">
            {epics
              .filter((e) => filterEpicId === 'all' || filterEpicId === e.id)
              .map((e) => {
                const statsSimple = epicStats.get(e.id) ?? { total: 0, done: 0 }
                const colorIndex = epics.findIndex(x => x.id === e.id) % 5
                const colorMap = ['blue','green','orange','purple','red'] as const
                const color = colorMap[colorIndex]
                return (
                  <div key={e.id} onClick={() => route(`/bet/${projectId}/${e.id}`)}>
                    <BetCard
                      projectId={projectId ?? ''}
                      epicId={e.id}
                      epicTitle={e.title}
                      status={e.status}
                      auto={Boolean((e as any).auto)}
                      stats={epicLaneStats.get(e.id) ?? { planning: 0, todo: 0, in_progress: 0, done: statsSimple.done }}
                      lastEvent={(tasks
                        .filter(t => t.epic_id === e.id)
                        .map(t => t.updated_at ?? t.created_at)
                        .filter(Boolean)
                        .sort()
                        .slice(-1)[0]) as string | undefined}
                    />
                  </div>
                )
              })}

            {/* Add New Bet Card */}
            <button
              onClick={openNewEpic}
              className="group relative flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-border-subtle bg-[#1A1A1A]/50 hover:bg-[#1A1A1A] hover:border-[#3ecf8e]/50 cursor-pointer transition-all duration-300 min-h-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-border-subtle">
                <span className="text-2xl text-text-medium group-hover:text-[#3ecf8e] transition-colors">+</span>
              </div>
              <h3 className="text-base font-semibold text-text-high group-hover:text-[#3ecf8e] transition-colors">Create New Bet</h3>
              <p className="text-xs text-text-medium mt-1">Add a new epic</p>
            </button>
          </div>

          {/* Toolbar (Shape Up strip) */}
          <div className="px-6">
            <BetControlStrip
              betScope={`Bets in ${projectName}`}
              scopeCuts={[{ text: 'All projects visible', timestamp: '' }]}
              appetite="4 weeks"
              currentDay={8}
              totalDays={20}
              hillState={35}
              scopeCutsCount={3}
            />
          </div>
          </>
        ) : (
          <div className="flex flex-col pb-20">
            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#1A1A1A]">
              <div className="grid grid-cols-[minmax(200px,2fr)_120px_100px_100px_1fr_48px] gap-4 px-6 py-3 border-b border-white/10 bg-[#1A1A1A] text-xs font-mono font-medium text-text-medium uppercase tracking-wider">
                <div className="flex items-center gap-2">BET</div>
                <div>STATUS</div>
                <div>TASKS</div>
                <div>AUTO</div>
                <div className="text-right">LAST ACTIVITY</div>
                <div></div>
              </div>
              <div className="bg-bg-surface">
                {epics
                  .filter((e) => filterEpicId === 'all' || filterEpicId === e.id)
                  .map((e, index) => {
                    const stats = epicStats.get(e.id) ?? { total: 0, done: 0 }
                    const lastEvent = (tasks
                      .filter(t => t.epic_id === e.id)
                      .map(t => t.updated_at ?? t.created_at)
                      .filter(Boolean)
                      .sort()
                      .slice(-1)[0]) as string | undefined
                    return (
                      <div
                        key={e.id}
                        onClick={() => route(`/bet/${projectId}/${e.id}`)}
                        className={`grid grid-cols-[minmax(200px,2fr)_120px_100px_100px_1fr_48px] gap-4 px-6 py-4 hover:bg-bg-surface-hover cursor-pointer transition-colors items-center border-l-2 border-transparent ${index !== epics.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-text-high truncate">{e.title}</span>
                        </div>
                        <div className="text-sm text-text-medium font-medium">{e.status.replace('_', ' ')}</div>
                        <div className="text-sm text-text-medium font-mono">{stats.done}/{stats.total}</div>
                        <div className="text-sm text-text-medium">{e.auto ? 'On' : 'Off'}</div>
                        <div className="text-right text-xs text-text-medium font-mono">{lastEvent ?? '—'}</div>
                        <div className="flex justify-end">
                          <button
                            onClick={(ev) => { ev.stopPropagation(); /* future: open bet settings */ }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-white/5 bg-white/5 hover:bg-white/10 text-text-medium transition-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 12h.01M12 6h.01M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
        </section>

        {projectId !== undefined && (
          <>
            <TaskForm isOpen={taskFormOpen} onClose={closeTaskForm} onSave={refreshData} task={editingTask} projectId={projectId} defaultEpicId={defaultEpicId} />
            <EpicForm isOpen={epicFormOpen} onClose={closeEpicForm} onSave={refreshData} epic={editingEpic} projectId={projectId} />
          </>
        )}

        {cleanupDialogOpen && (
          <div class="modal modal-open" role="dialog" aria-labelledby="cleanup-dialog-title" aria-modal="true">
            <div class="modal-box">
              <h3 id="cleanup-dialog-title" class="font-bold text-lg">Clean Up Board</h3>
              <div class="py-4 space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="checkbox" checked={cleanupArchiveTasks} onChange={(e) => setCleanupArchiveTasks((e.target as HTMLInputElement).checked)} aria-label="Archive done tasks" />
                  <span>Archive Done Tasks</span>
                  {doneTaskCount > 0 && (<span class="text-base-content/50 text-sm">({doneTaskCount} task{doneTaskCount !== 1 ? 's' : ''})</span>)}
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="checkbox" checked={cleanupArchiveEpics} onChange={(e) => setCleanupArchiveEpics((e.target as HTMLInputElement).checked)} aria-label="Archive empty epics" />
                  <span>Archive Empty Epics</span>
                </label>
              </div>
              <div class="modal-action">
                <button class="btn btn-ghost" onClick={() => { setCleanupDialogOpen(false); setCleanupArchiveTasks(true); setCleanupArchiveEpics(true); }} aria-label="Cancel cleanup">Cancel</button>
                <button class="btn btn-primary" onClick={() => void handleCleanup()} disabled={!cleanupArchiveTasks && !cleanupArchiveEpics} aria-label="Confirm cleanup">Clean</button>
              </div>
            </div>
            <div class="modal-backdrop bg-black/50" onClick={() => { setCleanupDialogOpen(false); setCleanupArchiveTasks(true); setCleanupArchiveEpics(true); }} aria-hidden="true" />
          </div>
        )}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout
      currentPath={`/board/${projectId}`}
      breadcrumbs={breadcrumbs}
      userInitials="U"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div class="min-h-screen bg-base-200">
          <div className="px-6 pt-6">
            <StandardPageHeader
              title={projectName}
              subtitle={
                <div className="flex gap-2 text-sm text-text-medium">
                  <span>•</span>
                  <span>{breadcrumbs[0]?.label ?? 'Projects'}</span>
                </div>
              }
              toolbar={
                <>
                  <StandardSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                  />

                  {/* Epic Filter */}
                  <div className="relative">
                    <select
                      className="h-9 pl-3 pr-8 bg-bg-surface border border-border-subtle rounded-md text-sm text-text-medium outline-none focus:border-text-medium/30 appearance-none cursor-pointer hover:text-text-high hover:border-text-medium/30 transition-colors"
                      value={filterEpicId}
                      onChange={(e) =>
                        setFilterEpicId((e.target as HTMLSelectElement).value)
                      }
                      aria-label="Filter by epic"
                    >
                      <option value="all">All Epics</option>
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.id}>
                          {epic.title}
                        </option>
                      ))}
                      <option value="unassigned">Unassigned</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-medium" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      className="h-9 pl-3 pr-8 bg-bg-surface border border-border-subtle rounded-md text-sm text-text-medium outline-none focus:border-text-medium/30 appearance-none cursor-pointer hover:text-text-high hover:border-text-medium/30 transition-colors"
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus((e.target as HTMLSelectElement).value)
                      }
                      aria-label="Filter by status"
                    >
                      <option value="all">All Statuses</option>
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_CONFIG[status].label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-medium" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {(searchQuery !== "" ||
                    filterEpicId !== "all" ||
                    filterStatus !== "all") && (
                      <StandardButton
                        onClick={() => {
                          setSearchQuery("");
                          setFilterEpicId("all");
                          setFilterStatus("all");
                        }}
                        aria-label="Clear all filters"
                      >
                        Clear Buttons
                      </StandardButton>
                    )}

                  <div className="w-px h-4 bg-border-subtle mx-1" />

                  <StandardButton
                    onClick={() => setCleanupDialogOpen(true)}
                    title="Clean up board"
                    aria-label="Clean up board"
                  >
                    Clean Up
                  </StandardButton>

                  <StandardViewToggle<"condensed" | "normal">
                    value={viewMode}
                    onChange={setViewMode}
                    options={[
                      {
                        value: "normal",
                        icon: <ViewColumnsIcon className="h-4 w-4" />,
                        label: "Normal view",
                      },
                      {
                        value: "condensed",
                        icon: <Bars3BottomLeftIcon className="h-4 w-4" />,
                        label: "Condensed view",
                      },
                    ]}
                    aria-label="Toggle view mode"
                  />

                  <StandardButton
                    onClick={() => setPlanningCollapsed(!planningCollapsed)}
                    title={planningCollapsed ? "Show Planning column" : "Hide Planning column"}
                    aria-label={planningCollapsed ? "Show Planning column" : "Hide Planning column"}
                    aria-expanded={!planningCollapsed}
                    icon={planningCollapsed ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  >
                    {/* Icon only for space, or keeping text? Old one had text "Show Planning". Let's keep icon + tooltip mostly for density, or maybe just icon. The Linear style leans dense. */}
                  </StandardButton>

                  <div className="w-px h-4 bg-border-subtle mx-1" />

                  <StandardButton onClick={openNewEpic} aria-label="Create new epic">
                    New Epic
                  </StandardButton>

                  <StandardButton
                    variant="primary"
                    onClick={() => openNewTask()}
                    icon={<PlusIcon className="h-4 w-4" />}
                    aria-label="Create new task"
                  >
                    New Task
                  </StandardButton>
                </>
              }
            />
          </div>

          

          {/* Swimlanes */}
          <div class="px-6 pb-6 space-y-4">
            {/* Epic Swimlanes */}
            {epics
              .filter(
                (epic) => filterEpicId === "all" || filterEpicId === epic.id
              )
              .map((epic) => {
                const isCollapsed = collapsedEpics.has(epic.id);
                const epicColor = getEpicColor(epic.id, epics);
                const taskCount = getEpicTaskCount(epic.id);

                return (
                  <div
                    key={epic.id}
                    class="bg-base-100 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Epic Header */}
                    <div
                      class="p-4 flex items-center gap-3 cursor-pointer hover:bg-base-200 transition-colors"
                      onClick={() => toggleEpicCollapse(epic.id)}
                      role="button"
                      aria-expanded={!isCollapsed}
                      aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} epic: ${epic.title}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleEpicCollapse(epic.id);
                        }
                      }}
                    >
                      <ChevronRightIcon
                        className={`h-5 w-5 text-base-content/40 transition-transform ${isCollapsed ? "" : "rotate-90"
                          }`}
                        aria-hidden="true"
                      />
                      <span
                        class="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: epicColor }}
                        aria-hidden="true"
                      />
                      <span class="font-semibold">{epic.title}</span>
                      <span class="text-base-content/40 text-sm bg-base-200 px-2 py-0.5 rounded">
                        {taskCount} task{taskCount !== 1 ? "s" : ""}
                      </span>
                      <div class="ml-auto flex items-center gap-3">
                        <div
                          class="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label class="flex items-center gap-2 text-xs text-base-content/60">
                            {epic.auto && (
                              <span class="loading loading-infinity loading-xs text-warning" aria-hidden="true" />
                            )}
                            <span>Auto</span>
                            <input
                              type="checkbox"
                              class="toggle toggle-xs"
                              checked={epic.auto}
                              onChange={(e) =>
                                void toggleEpicAuto(
                                  epic,
                                  (e.target as HTMLInputElement).checked
                                )
                              }
                              aria-label={`Toggle auto mode for ${epic.title}`}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Epic Content */}
                    {!isCollapsed && (
                      <div class="px-4 pb-4">
                        <div class="flex gap-4">
                          {/* Collapsed Planning Column */}
                          {planningCollapsed && (
                            <div
                              class="w-8 min-h-[100px] bg-base-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-base-300 transition-colors relative"
                              onClick={() => setPlanningCollapsed(false)}
                              role="button"
                              aria-label="Show Planning column"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setPlanningCollapsed(false);
                                }
                              }}
                              title="Show Planning column"
                            >
                              <div class="absolute inset-0 flex items-center justify-center">
                                <span
                                  class="text-xs font-medium text-base-content/60 whitespace-nowrap"
                                  style={{ transform: "rotate(-90deg)" }}
                                >
                                  Planning (
                                  {getColumnTasks("planning", epic.id).length})
                                </span>
                              </div>
                              <EyeSlashIcon className="h-4 w-4 text-base-content/40 absolute top-2" aria-hidden="true" />
                            </div>
                          )}

                          {/* Main Columns Container */}
                          <div class="flex-1">
                            {/* Column Headers */}
                            <div
                              className={`kanban-columns-grid ${planningCollapsed ? "kanban-columns-grid-3" : "kanban-columns-grid-4"
                                }`}
                              style={{ marginBottom: '12px' }}
                            >
                              {STATUSES.filter(
                                (s) => !planningCollapsed || s !== "planning"
                              ).map((status) => {
                                const config = STATUS_CONFIG[status];
                                const count = getColumnTasks(
                                  status,
                                  epic.id
                                ).length;
                                const statusDotClass = `column-header-status-dot column-header-status-dot-${status}`;
                                return (
                                  <div key={status} className="column-header">
                                    <span className={statusDotClass} aria-hidden="true" />
                                    <span className="column-header-label">
                                      {config.label}
                                    </span>
                                    <span className="column-header-count">
                                      {count}
                                    </span>
                                    {status === "planning" && (
                                      <button
                                        className="column-header-add-button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openNewTask(epic.id);
                                        }}
                                        title="Add task to this epic"
                                        aria-label={`Add task to ${epic.title}`}
                                        type="button"
                                      >
                                        <PlusIcon className="column-header-add-button-icon" aria-hidden="true" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Columns */}
                            <div
                              className={`kanban-columns-grid ${planningCollapsed ? "kanban-columns-grid-3" : "kanban-columns-grid-4"
                                }`}
                            >
                              {STATUSES.filter(
                                (s) => !planningCollapsed || s !== "planning"
                              ).map((status) => (
                                <DroppableColumn
                                  key={getDropZoneId(status, epic.id)}
                                  id={getDropZoneId(status, epic.id)}
                                  isEmpty={
                                    getColumnTasks(status, epic.id).length === 0
                                  }
                                  role="region"
                                  aria-label={`${STATUS_CONFIG[status].label} tasks for ${epic.title}`}
                                >
                                  {getColumnTasks(status, epic.id).map(
                                    (task, taskIndex) => (
                                      <DraggableTaskCard
                                        key={task.id}
                                        task={task}
                                        epicColor={epicColor}
                                        epicTitle={epic.title}
                                        taskNumber={taskIndex + 1}
                                        onClick={() => openEditTask(task)}
                                        condensed={viewMode === "condensed"}
                                      />
                                    )
                                  )}
                                </DroppableColumn>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Unassigned Lane */}
            {(filterEpicId === "all" || filterEpicId === "unassigned") && (
              <div class="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                <div
                  class="p-4 flex items-center gap-3 cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => toggleEpicCollapse("unassigned")}
                  role="button"
                  aria-expanded={!collapsedEpics.has("unassigned")}
                  aria-label={`${collapsedEpics.has("unassigned") ? 'Expand' : 'Collapse'} unassigned tasks`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleEpicCollapse("unassigned");
                    }
                  }}
                >
                  <ChevronRightIcon
                    className={`h-5 w-5 text-base-content/40 transition-transform ${collapsedEpics.has("unassigned") ? "" : "rotate-90"
                      }`}
                    aria-hidden="true"
                  />
                  <span class="w-3 h-3 rounded-full bg-base-content/40 flex-shrink-0" aria-hidden="true" />
                  <span class="font-semibold">Unassigned</span>
                  <span class="text-base-content/40 text-sm bg-base-200 px-2 py-0.5 rounded">
                    {getEpicTaskCount(undefined)} task
                    {getEpicTaskCount(undefined) !== 1 ? "s" : ""}
                  </span>
                </div>

                {!collapsedEpics.has("unassigned") && (
                  <div class="px-4 pb-4">
                    <div class="flex gap-4">
                      {/* Collapsed Planning Column */}
                      {planningCollapsed && (
                        <div
                          class="w-8 min-h-[100px] bg-base-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-base-300 transition-colors relative"
                          onClick={() => setPlanningCollapsed(false)}
                          role="button"
                          aria-label="Show Planning column"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setPlanningCollapsed(false);
                            }
                          }}
                          title="Show Planning column"
                        >
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span
                              class="text-xs font-medium text-base-content/60 whitespace-nowrap"
                              style={{ transform: "rotate(-90deg)" }}
                            >
                              Planning (
                              {getColumnTasks("planning", undefined).length})
                            </span>
                          </div>
                          <EyeSlashIcon className="h-4 w-4 text-base-content/40 absolute top-2" aria-hidden="true" />
                        </div>
                      )}

                      {/* Main Columns Container */}
                      <div class="flex-1">
                        <div
                          className={`kanban-columns-grid ${planningCollapsed ? "kanban-columns-grid-3" : "kanban-columns-grid-4"
                            }`}
                          style={{ marginBottom: '12px' }}
                        >
                          {STATUSES.filter(
                            (s) => !planningCollapsed || s !== "planning"
                          ).map((status) => {
                            const config = STATUS_CONFIG[status];
                            const count = getColumnTasks(
                              status,
                              undefined
                            ).length;
                            const statusDotClass = `column-header-status-dot column-header-status-dot-${status}`;
                            return (
                              <div key={status} className="column-header">
                                <span className={statusDotClass} aria-hidden="true" />
                                <span className="column-header-label">
                                  {config.label}
                                </span>
                                <span className="column-header-count">
                                  {count}
                                </span>
                                {status === "planning" && (
                                  <button
                                    className="column-header-add-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openNewTask(undefined);
                                    }}
                                    title="Add unassigned task"
                                    aria-label="Add unassigned task"
                                    type="button"
                                  >
                                    <PlusIcon className="column-header-add-button-icon" aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className={`kanban-columns-grid ${planningCollapsed ? "kanban-columns-grid-3" : "kanban-columns-grid-4"
                            }`}
                        >
                          {STATUSES.filter(
                            (s) => !planningCollapsed || s !== "planning"
                          ).map((status) => (
                            <DroppableColumn
                              key={getDropZoneId(status, undefined)}
                              id={getDropZoneId(status, undefined)}
                              isEmpty={
                                getColumnTasks(status, undefined).length === 0
                              }
                              role="region"
                              aria-label={`${STATUS_CONFIG[status].label} unassigned tasks`}
                            >
                              {getColumnTasks(status, undefined).map(
                                (task, taskIndex) => (
                                  <DraggableTaskCard
                                    key={task.id}
                                    task={task}
                                    epicColor="#9ca3af"
                                    epicTitle="Unassigned"
                                    taskNumber={taskIndex + 1}
                                    onClick={() => openEditTask(task)}
                                    condensed={viewMode === "condensed"}
                                  />
                                )
                              )}
                            </DroppableColumn>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modals */}
          {projectId !== undefined && (
            <>
              <TaskForm
                isOpen={taskFormOpen}
                onClose={closeTaskForm}
                onSave={refreshData}
                task={editingTask}
                projectId={projectId}
                defaultEpicId={defaultEpicId}
              />
              <EpicForm
                isOpen={epicFormOpen}
                onClose={closeEpicForm}
                onSave={refreshData}
                epic={editingEpic}
                projectId={projectId}
              />
            </>
          )}

          {/* Cleanup Dialog */}
          {cleanupDialogOpen && (
            <div class="modal modal-open" role="dialog" aria-labelledby="cleanup-dialog-title" aria-modal="true">
              <div class="modal-box">
                <h3 id="cleanup-dialog-title" class="font-bold text-lg">Clean Up Board</h3>
                <div class="py-4 space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      class="checkbox"
                      checked={cleanupArchiveTasks}
                      onChange={(e) =>
                        setCleanupArchiveTasks(
                          (e.target as HTMLInputElement).checked
                        )
                      }
                      aria-label="Archive done tasks"
                    />
                    <span>Archive Done Tasks</span>
                    {doneTaskCount > 0 && (
                      <span class="text-base-content/50 text-sm">
                        ({doneTaskCount} task{doneTaskCount !== 1 ? "s" : ""})
                      </span>
                    )}
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      class="checkbox"
                      checked={cleanupArchiveEpics}
                      onChange={(e) =>
                        setCleanupArchiveEpics(
                          (e.target as HTMLInputElement).checked
                        )
                      }
                      aria-label="Archive empty epics"
                    />
                    <span>Archive Empty Epics</span>
                  </label>
                </div>
                <div class="modal-action">
                  <button
                    class="btn btn-ghost"
                    onClick={() => {
                      setCleanupDialogOpen(false);
                      setCleanupArchiveTasks(true);
                      setCleanupArchiveEpics(true);
                    }}
                    aria-label="Cancel cleanup"
                  >
                    Cancel
                  </button>
                  <button
                    class="btn btn-primary"
                    onClick={() => void handleCleanup()}
                    disabled={!cleanupArchiveTasks && !cleanupArchiveEpics}
                    aria-label="Confirm cleanup"
                  >
                    Clean
                  </button>
                </div>
              </div>
              <div
                class="modal-backdrop bg-black/50"
                onClick={() => {
                  setCleanupDialogOpen(false);
                  setCleanupArchiveTasks(true);
                  setCleanupArchiveEpics(true);
                }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </DndContext>
    </AppLayout>
  );
}
