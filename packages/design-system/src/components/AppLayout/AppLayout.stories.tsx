import { h } from 'preact'
import { AppLayout } from './AppLayout'
import { BoardHeader } from '../BoardHeader'
import { BetControlStrip } from '../BetControlStrip'

export default {
  title: 'Templates/AppLayout',
  component: AppLayout,
}

// With breadcrumbs
export const WithBreadcrumbs = () => (
  <AppLayout 
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' },
      { label: 'Q3 Migration', badge: { text: 'EPIC-2023', color: 'green' } }
    ]}
  >
    <BoardHeader title="Q3 Migration" />
    <p style={{ color: 'var(--text-medium)' }}>Content goes here...</p>
  </AppLayout>
)

// Full example with bet strip
export const FullExample = () => (
  <AppLayout
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' },
      { label: 'Q3 Migration', badge: { text: 'EPIC-2023', color: 'green' } }
    ]}
  >
    <BoardHeader title="Q3 Migration" />
    <BetControlStrip
      betScope="Bet: Q3 Migration"
      scopeCutBadges={[]}
      appetite="4 weeks"
      currentDay={8}
      totalDays={20}
      hillState={35}
      scopeCutsCount={0}
    />
    <div style={{ padding: '20px', color: 'var(--text-medium)' }}>
      <p>Kanban board would go here...</p>
    </div>
  </AppLayout>
)

// Minimal without breadcrumbs
export const Minimal = () => (
  <AppLayout>
    <h1 style={{ color: 'var(--text-high)' }}>Page content</h1>
    <p style={{ color: 'var(--text-medium)' }}>This layout has no header, just sidebar and content.</p>
  </AppLayout>
)
