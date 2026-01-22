import type { JSX } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { route, type RoutableProps } from 'preact-router'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { AppLayout, DroppableColumn, DraggableTaskCard, StandardPageHeader, StandardSearchBar, StandardViewToggle, StandardButton, TaskForm } from '../components'
import { getProject, getTasks, getEpics, updateTask, type TaskWithBlocked } from '../stores'
import type { Epic } from '@flux/shared'
import { STATUSES, STATUS_CONFIG, EPIC_COLORS } from '@flux/shared'
import './Kanban.css'
import '../components/BetControlStrip.css'

interface BetProps extends RoutableProps {
  projectId?: string
  epicId?: string
}

function getEpicColor(epicId: string, epics: Epic[]): string {
  const index = epics.findIndex((e) => e.id === epicId)
  return EPIC_COLORS[index % EPIC_COLORS.length] ?? EPIC_COLORS[0] ?? '#9ca3af'
}

export function Bet({ projectId, epicId }: BetProps): JSX.Element {
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TaskWithBlocked[]>([])
  const [epic, setEpic] = useState<Epic | null>(null)
  const [epics, setEpics] = useState<Epic[]>([])
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'detail' | 'compact'>('detail')

  // No view toggles or planning collapse in flux.html; keep layout fixed

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    if (!projectId || !epicId) {
      route('/')
      return
    }
    void loadData()
  }, [projectId, epicId])

  const loadData = async (): Promise<void> => {
    if (!projectId || !epicId) return
    setLoading(true)
    const [proj, allTasks, allEpics] = await Promise.all([
      getProject(projectId),
      getTasks(projectId),
      getEpics(projectId),
    ])
    if (proj === null) {
      route('/')
      return
    }
    setProjectName(proj.name)
    setEpics(allEpics)
    setEpic(allEpics.find(e => e.id === epicId) ?? null)
    setTasks(allTasks.filter(t => t.epic_id === epicId))
    setLoading(false)
  }

  const refreshTasks = async (): Promise<void> => {
    if (!projectId || !epicId) return
    const all = await getTasks(projectId)
    setTasks(all.filter(t => t.epic_id === epicId))
  }

  const openNewTask = (): void => {
    setTaskFormOpen(true)
  }
  const closeTaskForm = (): void => {
    setTaskFormOpen(false)
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = String(over.id)
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    if (task.status !== newStatus) {
      await updateTask(taskId, { status: newStatus })
      await refreshTasks()
    }
  }

  const getColumnTasks = useMemo(() => {
    return (status: string): TaskWithBlocked[] => tasks.filter(t => t.status === status)
  }, [tasks])

  if (loading || epic === null) {
    return (
      <AppLayout currentPath={`/bet/${projectId}/${epicId}`} breadcrumbs={[{ label: 'Loading...', active: true }]}>
        <div class="flex items-center justify-center" style="min-height: 80vh;">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </AppLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Projects', path: '/' },
    { label: projectName, path: `/board/${projectId}`, badge: projectId },
    { label: epic.title, active: true, badge: epic.id },
  ]

  const epicColor = getEpicColor(epic.id, epics)

  return (
    <AppLayout currentPath={`/bet/${projectId}/${epicId}`} breadcrumbs={breadcrumbs}>
      <div className="px-6 pt-6">
        <StandardPageHeader
          title={epic.title}
          subtitle={<span className="text-sm text-text-medium">Bet detail</span>}
          toolbar={
            <>
              <StandardSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
              <StandardViewToggle<'detail' | 'compact'>
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: 'detail',
                    icon: (
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    ),
                    label: 'Detail view',
                  },
                  {
                    value: 'compact',
                    icon: (
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                    ),
                    label: 'Compact view',
                  },
                ]}
                aria-label="Toggle view mode"
              />
              <StandardButton aria-label="Filter tasks">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M3 12h18M3 18h18"></path>
                </svg>
                Filter
              </StandardButton>
              <StandardButton aria-label="Sync tasks">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Sync
              </StandardButton>
            </>
          }
        />
      </div>

      <div className="px-6">
        <div className="bet-control-strip">
          <div className="bet-info-group" style={{ flex: 1 }}>
            <div className="bet-label">Bet Scope</div>
            <div className="bet-scope-text">
              {`Bet: ${epic.title}`}
              <span className="scope-cut-badge" style={{ marginLeft: '4px' }}>No UI redesign.</span>
              <span className="scope-cut-badge" style={{ marginLeft: '2px' }}>No role model changes.</span>
            </div>
          </div>
          <div className="bet-separator" />
          <div className="bet-info-group" style={{ minWidth: '140px' }}>
            <div className="bet-label">Appetite</div>
            <div className="bet-value">4 weeks <span style={{ color: 'var(--text-medium)', marginLeft: '4px', fontWeight: 400, fontSize: '12px' }}>| Day 8 of 20</span></div>
          </div>
          <div className="bet-separator" />
          <div className="bet-info-group" style={{ minWidth: '200px' }}>
            <div className="bet-label">Hill State</div>
            <div className="hill-slider-container">
              <span style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Figuring out</span>
              <div style={{ flex: 1, height: '4px', background: 'var(--border-default)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `35%`, background: 'var(--brand-primary)', borderRadius: '2px' }} />
                <div style={{ position: 'absolute', left: `35%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: 'var(--text-high)', border: '2px solid var(--brand-primary)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Executing</span>
            </div>
          </div>
          <div className="bet-separator" />
          <div className="bet-info-group">
            <div className="bet-label">Scope cuts</div>
            <div className="bet-value">3</div>
          </div>
          <button className="button-with-icon" type="button" aria-label="View history">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            History
          </button>
          <div style={{ flex: 1 }} />
          <button className="button-with-icon" type="button" aria-label="Cut scope">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 3v12" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            Cut Scope
          </button>
          <button className="button-with-icon" type="button" aria-label="Edit bet">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Bet
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="px-6 pb-6">
          <div className="kanban-container">
            {STATUSES.map((status) => {
              const count = getColumnTasks(status).length
              const dotClass = status === 'planning' ? 'dot-planning' : status === 'todo' ? 'dot-todo' : status === 'in_progress' ? 'dot-progress' : 'dot-done'
              return (
                <div key={status} className="kanban-column">
                  <div className="column-header">
                    <div className="column-title">
                      <span className={`dot ${dotClass}`}></span>
                      {STATUS_CONFIG[status].label}
                      <span className="column-count">{count}</span>
                    </div>
                  </div>
                  <button className="add-task-ghost" type="button" onClick={openNewTask}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add new task
                  </button>
                  <div className="task-list">
                    <DroppableColumn key={status} id={status} isEmpty={count === 0}>
                      {getColumnTasks(status).map((task, idx) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          epicColor={epicColor}
                          epicTitle={epic.title}
                          taskNumber={idx + 1}
                          
                        />
                      ))}
                    </DroppableColumn>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DndContext>
      {projectId && epic && (
        <TaskForm
          isOpen={taskFormOpen}
          onClose={closeTaskForm}
          onSave={refreshTasks}
          projectId={projectId}
          defaultEpicId={epic.id}
        />
      )}
    </AppLayout>
  )
}
