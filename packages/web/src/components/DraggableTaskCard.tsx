import type { JSX } from 'preact'
import { ArrowDownIcon, CheckCircleIcon, ShieldCheckIcon, ChatBubbleLeftIcon, LinkIcon } from '@heroicons/react/24/outline'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { TaskWithBlocked } from '../stores'
import { TASK_TYPE_CONFIG } from '@flux/shared'
import { getTaskTypeIcon, getTaskTypeColor, getPriorityConfig } from '../utils/taskHelpers'
import './TaskCard.css'

interface DraggableTaskCardProps {
  task: TaskWithBlocked
  epicColor?: string
  epicTitle?: string
  taskNumber?: number
  onClick?: () => void
  condensed?: boolean
}

export function DraggableTaskCard({
  task,
  epicColor = '#9ca3af',
  epicTitle = 'Unassigned',
  taskNumber,
  onClick,
  condensed = false,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  // Extract attributes without role to avoid type conflict
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...restAttributes } = attributes

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (): void => {
    if (!isDragging && onClick !== undefined) {
      onClick()
    }
  }

  // Shared indicator badges for acceptance criteria and guardrails
  const renderMetaIndicators = (compact = false): JSX.Element => (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {task.acceptance_criteria !== undefined && task.acceptance_criteria !== null && task.acceptance_criteria.length > 0 && (
        <div class={`flex items-center ${compact ? 'gap-0.5 flex-shrink-0' : 'gap-1'} text-xs text-success/70`} title="Acceptance criteria">
          <CheckCircleIcon className="h-3.5 w-3.5" />
          <span>{task.acceptance_criteria.length}</span>
        </div>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {task.guardrails !== undefined && task.guardrails !== null && task.guardrails.length > 0 && (
        <div class={`flex items-center ${compact ? 'gap-0.5 flex-shrink-0' : 'gap-1'} text-xs text-info/70`} title="Guardrails">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          <span>{task.guardrails.length}</span>
        </div>
      )}
    </>
  )

  // Condensed view
  if (condensed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        class={`task-card condensed cursor-grab active:cursor-grabbing touch-none ${task.blocked ? 'blocked' : ''}`}
        onClick={handleClick}
        {...listeners}
        {...restAttributes}
      >
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: epicColor }}
          />
          <span class="font-medium text-sm truncate flex-1">{task.title}</span>
          {(() => {
            const taskType = task.type ?? 'task'
            const typeConfig = TASK_TYPE_CONFIG[taskType]
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
            if (!typeConfig) return null
            const TypeIcon = getTaskTypeIcon(taskType)
            return (
              <span class={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getTaskTypeColor(typeConfig.color)}`} title={typeConfig.label}>
                <TypeIcon className="h-3 w-3" />
              </span>
            )
          })()}
          {typeof task.priority === 'number' && (() => {
            const priorityConfig = getPriorityConfig(task.priority)
            if (!priorityConfig) return null
            return (
              <span
                class="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                style={{
                  backgroundColor: `${priorityConfig.color}20`,
                  color: priorityConfig.color
                }}
              >
                {priorityConfig.label}
              </span>
            )
          })()}
          {task.blocked && (
            <span class="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Blocked
            </span>
          )}
          {renderMetaIndicators(true)}
          {task.status === 'planning' && (
            <progress class="progress progress-secondary w-8 flex-shrink-0" value={0} max={100} />
          )}
          {task.status === 'todo' && (
            <progress class="progress w-8 flex-shrink-0" value={0} max={100} />
          )}
          {task.status === 'in_progress' && (
            <progress class="progress progress-warning w-8 flex-shrink-0" />
          )}
          {task.status === 'done' && (
            <progress class="progress progress-success w-8 flex-shrink-0" value={100} max={100} />
          )}
        </div>
      </div>
    )
  }

  // Normal view aligned with mockui/flux.html
  const typeColor = (TASK_TYPE_CONFIG[(task.type ?? 'task')]).color
  const tagClass = typeColor === 'red' ? 'tag-red' : typeColor === 'purple' ? 'tag-purple' : typeColor === 'blue' ? 'tag-blue' : typeColor === 'green' ? 'tag-green' : typeColor === 'amber' ? 'tag-orange' : 'tag-blue'
  const totalSegments = 4
  const filled = task.status === 'done' ? 4 : task.status === 'in_progress' ? 2 : task.status === 'todo' ? 1 : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      class={`task-card cursor-grab active:cursor-grabbing touch-none ${task.blocked ? 'blocked' : ''}`}
      onClick={handleClick}
      {...listeners}
      {...restAttributes}
    >
      <div class="task-header">
        <button class="task-menu-btn" aria-label="Task menu">•••</button>
      </div>

      <h3 class="task-title">{task.title}</h3>
      {task.comments !== undefined && task.comments !== null && task.comments.length > 0 && (
        <p class="task-description">{task.comments[task.comments.length - 1]?.body}</p>
      )}

      <div class="task-progress">
        <div class="progress-header">
          <span>Progress</span>
          <span>{filled}/{totalSegments}</span>
        </div>
        <div class="progress-bar">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div key={i} class={`progress-segment ${i < filled ? 'filled' : ''}`}></div>
          ))}
        </div>
      </div>

      <div class="task-footer">
        <div class="footer-right">
          <div class="footer-meta">
            {task.depends_on.length > 0 && (
              <div class="meta-item"><LinkIcon className="w-3.5 h-3.5" /> {task.depends_on.length}</div>
            )}
            {((task.comments?.length ?? 0) > 0) && (
              <div class="meta-item"><ChatBubbleLeftIcon className="w-3.5 h-3.5" /> {task.comments!.length}</div>
            )}
            <span class="task-id">#{task.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
