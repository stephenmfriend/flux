import { h } from 'preact'
import { TaskCard } from './TaskCard'

export default {
  title: 'Task/TaskCard',
  component: TaskCard,
}

export const FullCard = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '20px' }}>
    <TaskCard
      title="Evaluate tech stack for Q3 migration"
      description="Assess performance metrics and developer experience for the new framework options."
      progress={{ completed: 0, total: 4 }}
      avatars={[
        { initials: 'A', color: '#5c6b7f' },
        { initials: 'M', color: '#d97706' }
      ]}
      tags={[
        { label: 'UX', color: 'purple' },
        { label: 'Research', color: 'orange' }
      ]}
      attachments={2}
      comments={3}
      onMenuClick={() => console.log('Menu clicked')}
      onClick={() => console.log('Card clicked')}
    />
  </div>
)

export const WithProgress = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '20px' }}>
    <TaskCard
      title="Implement authentication flow using Supabase Auth"
      description="Building user account creation system with secure authentication providers."
      progress={{ completed: 2, total: 4 }}
      avatars={[{ initials: 'S', color: '#5c6b7f' }]}
      tags={[
        { label: 'Frontend', color: 'green' },
        { label: 'Auth', color: 'blue' }
      ]}
      attachments={5}
      comments={8}
    />
  </div>
)

export const MinimalCard = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '20px' }}>
    <TaskCard
      title="Fix responsive layout on mobile"
      avatars={[{ initials: 'S', color: '#5c6b7f' }]}
      tags={[{ label: 'Bug', color: 'red' }]}
    />
  </div>
)

export const NoProgress = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '20px' }}>
    <TaskCard
      title="Create design tokens for color palette"
      description="Define semantic colors for surface, overlay, and text hierarchy."
      avatars={[
        { initials: 'M', color: '#d97706' },
        { initials: 'S', color: '#5c6b7f' }
      ]}
      tags={[{ label: 'Design', color: 'purple' }]}
      comments={1}
    />
  </div>
)

export const MultipleCards = () => (
  <div style={{ width: '280px', background: 'var(--bg-base)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <TaskCard
      title="Evaluate tech stack for Q3 migration"
      description="Assess performance metrics and developer experience for the new framework options."
      progress={{ completed: 0, total: 4 }}
      avatars={[
        { initials: 'A', color: '#5c6b7f' },
        { initials: 'M', color: '#d97706' }
      ]}
      tags={[
        { label: 'UX', color: 'purple' },
        { label: 'Research', color: 'orange' }
      ]}
      attachments={2}
      comments={3}
    />
    <TaskCard
      title="Implement authentication flow"
      progress={{ completed: 2, total: 4 }}
      avatars={[{ initials: 'S', color: '#5c6b7f' }]}
      tags={[{ label: 'Auth', color: 'blue' }]}
      comments={5}
    />
    <TaskCard
      title="Fix mobile layout"
      avatars={[{ initials: 'J', color: '#059669' }]}
      tags={[{ label: 'Bug', color: 'red' }]}
    />
  </div>
)
