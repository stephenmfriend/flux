import { ComponentChildren } from 'preact'
import './Badge.css'

export interface BadgeProps {
  variant?: 'primary' | 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  size?: 'small' | 'standard' | 'large'
  dot?: boolean
  children: ComponentChildren
  className?: string
}

export function Badge({
  variant = 'gray',
  size = 'standard',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  const badgeClass = [
    'badge',
    `badge-${variant}`,
    size === 'small' ? 'badge-small' : size === 'large' ? 'badge-large' : '',
    dot ? 'badge-dot' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={badgeClass}>{children}</span>
}

export interface PriorityBadgeProps {
  priority: 0 | 1 | 2
  className?: string
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const labels = {
    0: 'P0',
    1: 'P1',
    2: 'P2',
  }

  return (
    <span className={`badge badge-priority badge-priority-${priority} ${className}`}>
      {labels[priority]}
    </span>
  )
}
