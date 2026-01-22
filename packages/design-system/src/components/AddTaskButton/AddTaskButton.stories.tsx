import { h } from 'preact'
import { AddTaskButton } from './AddTaskButton'

export default {
  title: 'Atoms/AddTaskButton',
  component: AddTaskButton,
}

export const Default = () => <AddTaskButton onClick={() => alert('Add task clicked')} />

export const InColumn = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '16px' }}>
    <AddTaskButton onClick={() => {}} />
  </div>
)
