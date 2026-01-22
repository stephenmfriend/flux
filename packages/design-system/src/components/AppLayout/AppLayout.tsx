import { h, ComponentChildren } from 'preact'
import './AppLayout.css'
import { Sidebar } from '../Sidebar'
import { Header, BreadcrumbItem } from '../Header'

export interface AppLayoutProps {
  children: ComponentChildren
  breadcrumbs?: BreadcrumbItem[]
  onFeedbackClick?: () => void
  onAvatarClick?: () => void
}

export function AppLayout({ children, breadcrumbs, onFeedbackClick, onAvatarClick }: AppLayoutProps) {
  return (
    <>
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
      <div className="main-wrapper">
        {breadcrumbs && (
          <Header 
            breadcrumbs={breadcrumbs}
            onFeedbackClick={onFeedbackClick}
            onAvatarClick={onAvatarClick}
          />
        )}
        <main className="content-area">
          {children}
        </main>
      </div>
    </>
  )
}
