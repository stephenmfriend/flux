import { h, ComponentChildren } from 'preact'
import './Tag.css'

export interface TagProps {
  children: ComponentChildren
  color: 'purple' | 'blue' | 'orange' | 'green' | 'red'
}

export function Tag({ children, color }: TagProps) {
  return <span className={`tag tag-${color}`}>{children}</span>
}
