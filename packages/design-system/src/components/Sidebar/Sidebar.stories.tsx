import { h } from 'preact'
import { Sidebar } from './Sidebar'

export default {
  title: 'Organisms/Sidebar',
  component: Sidebar,
}

export const Default = () => (
  <div style={{ height: '100vh', background: 'var(--bg-base)' }}>
    <Sidebar
      groups={[
        {
          label: 'Platform',
          items: [
            { label: 'Projects', icon: 'projects', active: true },
            { label: 'My Tasks', icon: 'tasks' },
            { label: 'Inbox', icon: 'inbox' }
          ]
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Team Members', icon: 'team' },
            { label: 'Settings', icon: 'settings' }
          ]
        }
      ]}
    />
  </div>
)

export const WithClickHandlers = () => (
  <div style={{ height: '100vh', background: 'var(--bg-base)' }}>
    <Sidebar
      groups={[
        {
          label: 'Platform',
          items: [
            { label: 'Projects', icon: 'projects', active: true, onClick: () => console.log('Projects clicked') },
            { label: 'My Tasks', icon: 'tasks', onClick: () => console.log('Tasks clicked') },
            { label: 'Inbox', icon: 'inbox', onClick: () => console.log('Inbox clicked') }
          ]
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Team Members', icon: 'team', onClick: () => console.log('Team clicked') },
            { label: 'Settings', icon: 'settings', onClick: () => console.log('Settings clicked') }
          ]
        }
      ]}
    />
  </div>
)

export const CustomBrandText = () => (
  <div style={{ height: '100vh', background: 'var(--bg-base)' }}>
    <Sidebar
      brandText="My App"
      groups={[
        {
          label: 'Platform',
          items: [
            { label: 'Projects', icon: 'projects' },
            { label: 'My Tasks', icon: 'tasks' },
            { label: 'Inbox', icon: 'inbox' }
          ]
        }
      ]}
    />
  </div>
)
