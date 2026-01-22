import { h } from 'preact'
import './TaskProgress.css'

export interface TaskProgressProps {
  completed: number
  total: number
}

export function TaskProgress({ completed, total }: TaskProgressProps) {
  const segments = Array.from({ length: total }, (_, i) => i < completed)
  
  return (
    <div className="task-progress">
      <div className="progress-header">
        <span>Progress</span>
        <span>{completed}/{total}</span>
      </div>
      <div className="progress-bar">
        {segments.map((filled, i) => (
          <div key={i} className={`progress-segment${filled ? ' filled' : ''}`}></div>
        ))}
      </div>
    </div>
  )
}
