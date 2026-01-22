import { h } from 'preact'
import { ColumnHeader } from './ColumnHeader'
import { StatusDot } from '../StatusDot'

export default {
  title: 'Kanban/ColumnHeader',
  component: ColumnHeader,
}

export const Planning = () => (
  <ColumnHeader count={1}>
    <StatusDot status="planning" />
    Planning
  </ColumnHeader>
)

export const Todo = () => (
  <ColumnHeader count={2}>
    <StatusDot status="todo" />
    To Do
  </ColumnHeader>
)

export const InProgress = () => (
  <ColumnHeader count={2}>
    <StatusDot status="in_progress" />
    In Progress
  </ColumnHeader>
)

export const Done = () => (
  <ColumnHeader count={5}>
    <StatusDot status="done" />
    Done
  </ColumnHeader>
)

export const AllColumns = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '20px', background: 'var(--bg-base)' }}>
    <div>
      <ColumnHeader count={1}>
        <StatusDot status="planning" />
        Planning
      </ColumnHeader>
    </div>
    <div>
      <ColumnHeader count={2}>
        <StatusDot status="todo" />
        To Do
      </ColumnHeader>
    </div>
    <div>
      <ColumnHeader count={2}>
        <StatusDot status="in_progress" />
        In Progress
      </ColumnHeader>
    </div>
    <div>
      <ColumnHeader count={5}>
        <StatusDot status="done" />
        Done
      </ColumnHeader>
    </div>
  </div>
)
