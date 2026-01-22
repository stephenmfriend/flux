import { h } from 'preact'
import { KanbanBoard } from './KanbanBoard'
import { KanbanColumn } from '../KanbanColumn'
import { TaskCard } from '../TaskCard'

export default {
  title: 'Kanban/KanbanBoard',
  component: KanbanBoard,
}

export const FullBoard = () => (
  <div style={{ background: 'var(--bg-base)', padding: '20px' }}>
    <KanbanBoard>
      <KanbanColumn
        status="planning"
        label="Planning"
        count={1}
        onAddTask={() => {}}
      >
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
      </KanbanColumn>

      <KanbanColumn
        status="todo"
        label="To Do"
        count={2}
        onAddTask={() => {}}
      >
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
        <TaskCard
          title="Create design tokens for color palette"
          description="Define semantic colors for surface, overlay, and text hierarchy."
          progress={{ completed: 1, total: 3 }}
          avatars={[
            { initials: 'M', color: '#d97706' },
            { initials: 'S', color: '#5c6b7f' }
          ]}
          tags={[{ label: 'Design', color: 'purple' }]}
          comments={1}
        />
      </KanbanColumn>

      <KanbanColumn
        status="in_progress"
        label="In Progress"
        count={2}
        onAddTask={() => {}}
      >
        <TaskCard
          title="Fix responsive layout on mobile"
          avatars={[{ initials: 'S', color: '#5c6b7f' }]}
          tags={[
            { label: 'Bug', color: 'red' },
            { label: 'Mobile', color: 'green' }
          ]}
        />
        <TaskCard
          title="Optimize database queries"
          avatars={[{ initials: 'J', color: '#059669' }]}
          tags={[
            { label: 'Backend', color: 'green' },
            { label: 'DB', color: 'blue' }
          ]}
          comments={2}
        />
      </KanbanColumn>

      <KanbanColumn
        status="done"
        label="Done"
        count={5}
        onAddTask={() => {}}
      >
        <TaskCard
          title="Setup CI/CD pipeline"
          avatars={[{ initials: 'S', color: '#5c6b7f' }]}
          tags={[{ label: 'Setup', color: 'orange' }]}
        />
      </KanbanColumn>
    </KanbanBoard>
  </div>
)

export const EmptyBoard = () => (
  <div style={{ background: 'var(--bg-base)', padding: '20px' }}>
    <KanbanBoard>
      <KanbanColumn status="planning" label="Planning" count={0} />
      <KanbanColumn status="todo" label="To Do" count={0} />
      <KanbanColumn status="in_progress" label="In Progress" count={0} />
      <KanbanColumn status="done" label="Done" count={0} />
    </KanbanBoard>
  </div>
)
