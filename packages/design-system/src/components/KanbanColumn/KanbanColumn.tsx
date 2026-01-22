import { h, ComponentChildren } from 'preact'
import { ColumnHeader } from '../ColumnHeader'
import { AddTaskButton } from '../AddTaskButton'
import { StatusDot } from '../StatusDot'
import './KanbanColumn.css'

export interface KanbanColumnProps {
  status: 'planning' | 'todo' | 'in_progress' | 'done'
  label: string
  count: number
  onAddTask?: () => void
  children?: ComponentChildren
}

export function KanbanColumn({ status, label, count, onAddTask, children }: KanbanColumnProps) {
  return (
    <div className="kanban-column">
      <ColumnHeader count={count}>
        <StatusDot status={status} />
        {label}
      </ColumnHeader>
      <AddTaskButton onClick={onAddTask} />
      <div className="task-list">
        {children}
      </div>
    </div>
  )
}
