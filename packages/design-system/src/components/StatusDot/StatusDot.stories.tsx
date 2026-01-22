import { h } from 'preact'
import { StatusDot } from './StatusDot'

export default {
  title: 'Atoms/StatusDot',
  component: StatusDot,
}

export const Planning = () => <StatusDot status="planning" />
export const Todo = () => <StatusDot status="todo" />
export const InProgress = () => <StatusDot status="in_progress" />
export const Done = () => <StatusDot status="done" />

export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusDot status="planning" />
      <span style={{ color: 'var(--text-high)' }}>Planning</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusDot status="todo" />
      <span style={{ color: 'var(--text-high)' }}>To Do</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusDot status="in_progress" />
      <span style={{ color: 'var(--text-high)' }}>In Progress</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusDot status="done" />
      <span style={{ color: 'var(--text-high)' }}>Done</span>
    </div>
  </div>
)
