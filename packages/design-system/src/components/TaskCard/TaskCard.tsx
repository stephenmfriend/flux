import { h } from 'preact'
import { TaskProgress } from '../TaskProgress'
import { AvatarStack, Avatar } from '../AvatarStack'
import { Tag } from '../Tag'
import './TaskCard.css'

export interface TaskCardProps {
  title: string
  description?: string
  progress?: { completed: number; total: number }
  avatars?: Avatar[]
  tags?: Array<{ label: string; color: 'purple' | 'blue' | 'orange' | 'green' | 'red' }>
  attachments?: number
  comments?: number
  onMenuClick?: () => void
  onClick?: () => void
}

export function TaskCard({
  title,
  description,
  progress,
  avatars = [],
  tags = [],
  attachments,
  comments,
  onMenuClick,
  onClick
}: TaskCardProps) {
  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-header">
        <button className="task-menu-btn" onClick={(e) => { e.stopPropagation(); onMenuClick?.(); }}>
          •••
        </button>
      </div>
      <h3 className="task-title">{title}</h3>
      {description && <p className="task-description">{description}</p>}
      {progress && <TaskProgress completed={progress.completed} total={progress.total} />}
      <div className="task-footer">
        <div className="footer-avatars">
          <AvatarStack avatars={avatars} />
        </div>
        <div className="footer-right">
          {tags.length > 0 && (
            <div className="task-tags">
              {tags.map((tag, i) => (
                <Tag key={i} color={tag.color}>{tag.label}</Tag>
              ))}
            </div>
          )}
          <div className="footer-meta">
            {attachments !== undefined && attachments > 0 && (
              <div className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                {attachments}
              </div>
            )}
            {comments !== undefined && comments > 0 && (
              <div className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                {comments}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
