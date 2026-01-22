import { h } from 'preact'
import './StatusDot.css'

export interface StatusDotProps {
  status: 'planning' | 'todo' | 'in_progress' | 'done'
}

export function StatusDot({ status }: StatusDotProps) {
  const statusClass = status === 'in_progress' ? 'progress' : status
  return <span className={`dot dot-${statusClass}`}></span>
}
