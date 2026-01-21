import { useDroppable } from '@dnd-kit/core'
import { ComponentChildren } from 'preact'
import './DroppableColumn.css'

interface DroppableColumnProps {
  id: string
  children: ComponentChildren
  isEmpty?: boolean
}

export function DroppableColumn({ id, children, isEmpty = false }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  const columnClass = `droppable-column ${
    isOver ? 'droppable-column-over' : isEmpty ? 'droppable-column-empty' : ''
  }`

  return (
    <div ref={setNodeRef} className={columnClass}>
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
