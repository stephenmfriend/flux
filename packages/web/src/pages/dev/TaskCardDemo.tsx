import type { JSX } from 'preact'
import { AppLayout, DraggableTaskCard } from '../../components'
import type { TaskWithBlocked } from '../../stores'

const sample: TaskWithBlocked = {
  id: 'FLX-102',
  title: 'Evaluate tech stack for Q3 migration',
  status: 'planning',
  depends_on: [],
  comments: [{ id: 'c1', body: 'Assess performance metrics and developer experience for the new framework options.', author: 'user', created_at: new Date().toISOString() }],
  project_id: 'demo',
  blocked: false,
}

export function TaskCardDemo(): JSX.Element {
  return (
    <AppLayout currentPath="/dev/taskcard" breadcrumbs={[{ label: 'Dev', path: '/' }, { label: 'Task Card', active: true }]}>
      <div className="p-6">
        <div style={{ maxWidth: 420 }}>
          <DraggableTaskCard task={sample} epicTitle="Demo" epicColor="#3b82f6" />
        </div>
      </div>
    </AppLayout>
  )
}

