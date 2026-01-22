import { h } from 'preact'
import './AddTaskButton.css'

export interface AddTaskButtonProps {
  onClick?: () => void
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <button className="add-task-ghost" onClick={onClick}>
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add new task
    </button>
  )
}
