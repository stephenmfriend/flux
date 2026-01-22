import { useDroppable } from '@dnd-kit/core'
import { ComponentChildren, JSX } from 'preact'
import './DroppableColumn.css'

interface DroppableColumnProps {
  id: string
  children: ComponentChildren
  isEmpty?: boolean
  role?: JSX.AriaRole
  'aria-label'?: string
}

export function DroppableColumn({ id, children, isEmpty = false, role, 'aria-label': ariaLabel }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  const columnClass = `droppable-column ${
    isOver ? 'droppable-column-over' : isEmpty ? 'droppable-column-empty' : ''
  }`

  return (
    <div ref={setNodeRef} className={columnClass} {...(role !== undefined ? { role } : {})} aria-label={ariaLabel}>
      {isEmpty ? (
        <div className="droppable-column-empty-state">
          <span className="droppable-column-empty-text">No tasks</span>
        </div>
      ) : (
        <div className="droppable-column-tasks">
          {children}
        </div>
      )}
    </div>
  )
}
