import { h, ComponentChildren } from 'preact'
import './KanbanBoard.css'

export interface KanbanBoardProps {
  children: ComponentChildren
}

export function KanbanBoard({ children }: KanbanBoardProps) {
  return (
    <div className="kanban-container">
      {children}
    </div>
  )
}
