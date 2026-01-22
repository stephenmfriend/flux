import { h, ComponentChildren } from 'preact'
import './Badge.css'

export interface BadgeProps {
  children: ComponentChildren
  variant: 'green' | 'gray'
  className?: string
}

export function Badge({ children, variant, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  )
}
