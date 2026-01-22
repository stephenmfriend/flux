import { h } from 'preact'
import { Badge } from './Badge'

export default {
  title: 'Atoms/Badge',
  component: Badge,
}

// Green variant (from mockup line 89 - epic badge)
export const Green = () => (
  <Badge variant="green">EPIC-2023</Badge>
)

// Gray variant
export const Gray = () => (
  <Badge variant="gray">CLOSED</Badge>
)

// Both variants
export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
    <Badge variant="green">EPIC-2023</Badge>
    <Badge variant="green">ACTIVE</Badge>
    <Badge variant="gray">ARCHIVED</Badge>
    <Badge variant="gray">CLOSED</Badge>
  </div>
)

// In breadcrumb context (as used in mockup)
export const InBreadcrumb = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', variant: 'var(--text-medium)' }}>
    <span>Projects</span>
    <span style={{ variant: 'var(--border-default)' }}>/</span>
    <span>Flux</span>
    <span style={{ variant: 'var(--border-default)' }}>/</span>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ 
        fontSize: '10px', 
        padding: '1px 6px', 
        height: '18px', 
        marginRight: '8px', 
        borderRadius: '10px',
        border: '1px solid rgba(62, 207, 142, 0.3)'
      }}>
        <Badge variant="green">EPIC-2023</Badge>
      </span>
      <span style={{ variant: 'var(--text-high)', fontWeight: 500 }}>Q3 Migration</span>
    </div>
  </div>
)
