import type { TaskWithBlocked } from '../stores'
import { TASK_TYPE_CONFIG } from '@flux/shared'
import { getTaskTypeIcon, getTaskTypeBadgeClass } from '../utils/taskHelpers'
import './TaskCard.css'

interface TaskCardProps {
  task: TaskWithBlocked
  onClick?: () => void
  compact?: boolean
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const taskType = task.type ?? 'task'
  const typeConfig = TASK_TYPE_CONFIG[taskType]
  const TypeIcon = getTaskTypeIcon(taskType)
  const badgeClass = `task-card-type-badge ${getTaskTypeBadgeClass(typeConfig.color)}`
  const cardClass = compact ? 'task-card task-card-compact' : 'task-card'

  return (
    <div className={cardClass} onClick={onClick}>
      <div className="task-card-header">
        <div className="task-card-title-row">
          <h4 className="task-card-title">{task.title}</h4>
          <span className={badgeClass} title={typeConfig.label}>
            <TypeIcon className="task-card-type-badge-icon" />
          </span>
        </div>
        {task.blocked && (
          <span className="task-card-blocked-badge" title={task.blocked_reason ?? undefined}>
            {task.blocked_reason !== undefined && task.blocked_reason !== "" ? 'Waiting' : 'Blocked'}
          </span>
        )}
      </div>
      {task.blocked_reason !== undefined && task.blocked_reason !== "" && (
        <div className="task-card-blocked-reason">
          ⏳ {task.blocked_reason}
        </div>
      )}
      {task.comments !== undefined && task.comments.length > 0 && (task.blocked_reason === undefined || task.blocked_reason === '') && (
        <p className="task-card-comment">
          {task.comments[task.comments.length - 1]?.body}
        </p>
      )}
      {task.blocked && (task.blocked_reason === undefined || task.blocked_reason === "") && task.depends_on.length > 0 && (
        <div className="task-card-deps-message task-card-deps-message-incomplete">
          {task.depends_on.length} incomplete dep{task.depends_on.length > 1 ? 's' : ''}
        </div>
      )}
      {!task.blocked && task.depends_on.length > 0 && (
        <div className="task-card-deps-message task-card-deps-message-complete">
          All {task.depends_on.length} dep{task.depends_on.length > 1 ? 's' : ''} done
        </div>
      )}
      {task.status === 'in_progress' && (
        <div className="task-card-in-progress">
          <span className="task-card-spinner" />
          In progress
        </div>
      )}
    </div>
  )
}
