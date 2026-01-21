import { ComponentChildren } from 'preact'
import './Timeline.css'

export type TimelineNodeType = 'default' | 'start' | 'milestone' | 'cut' | 'info'

export interface TimelineItemProps {
  date: string
  title: string
  description?: string
  nodeType?: TimelineNodeType
  badge?: {
    label: string
    icon?: any
  }
  avatar?: string
  children?: ComponentChildren
}

export function TimelineItem({
  date,
  title,
  description,
  nodeType = 'default',
  badge,
  avatar,
  children,
}: TimelineItemProps) {
  const nodeClass = nodeType === 'default' ? 'timeline-node' : `timeline-node timeline-node-${nodeType}`

  return (
    <div className="timeline-item">
      <div className={nodeClass} />
      <div className="timeline-content">
        <div className="timeline-date">{date}</div>
        <div className="timeline-title">{title}</div>
        {description && <div className="timeline-description">{description}</div>}
        {(badge || avatar || children) && (
          <div className="timeline-meta">
            {badge && (
              <div className="timeline-badge">
                {badge.icon && <span className="timeline-badge-icon">{badge.icon}</span>}
                {badge.label}
              </div>
            )}
            {avatar && (
              <div className="timeline-avatar">
                {avatar}
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export interface TimelineProps {
  children: ComponentChildren
  className?: string
}

export function Timeline({ children, className = '' }: TimelineProps) {
  return <div className={`timeline ${className}`}>{children}</div>
}
