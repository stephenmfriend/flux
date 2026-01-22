import { h, ComponentChildren } from 'preact'
import './ColumnHeader.css'

export interface ColumnHeaderProps {
  children: ComponentChildren
  count: number
}

export function ColumnHeader({ children, count }: ColumnHeaderProps) {
  return (
    <div className="column-header">
      <div className="column-title">
        {children}
        <span className="column-count">{count}</span>
      </div>
    </div>
  )
}
