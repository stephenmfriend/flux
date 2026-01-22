import { h } from 'preact'
import { TaskProgress } from './TaskProgress'

export default {
  title: 'Atoms/TaskProgress',
  component: TaskProgress,
}

export const Empty = () => <TaskProgress completed={0} total={4} />
export const Quarter = () => <TaskProgress completed={1} total={4} />
export const Half = () => <TaskProgress completed={2} total={4} />
export const ThreeQuarters = () => <TaskProgress completed={3} total={4} />
export const Complete = () => <TaskProgress completed={4} total={4} />

export const ThreeSegments = () => <TaskProgress completed={1} total={3} />
export const FiveSegments = () => <TaskProgress completed={3} total={5} />

export const AllStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px', padding: '20px' }}>
    <TaskProgress completed={0} total={4} />
    <TaskProgress completed={1} total={4} />
    <TaskProgress completed={2} total={4} />
    <TaskProgress completed={3} total={4} />
    <TaskProgress completed={4} total={4} />
  </div>
)
