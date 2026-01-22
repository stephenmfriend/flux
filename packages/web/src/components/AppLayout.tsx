import { ComponentChildren } from 'preact'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import './AppLayout.css'

interface BreadcrumbItem {
  label: string
  active?: boolean
  badge?: string
}

interface AppLayoutProps {
  children: ComponentChildren
  currentPath?: string
  breadcrumbs?: BreadcrumbItem[]
  userInitials?: string
  onFeedbackClick?: () => void
  onAvatarClick?: () => void
  showSidebar?: boolean
}

export function AppLayout({
  children,
  currentPath = '/',
  breadcrumbs,
  userInitials,
  onFeedbackClick,
  onAvatarClick,
  showSidebar = true,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      {showSidebar && <Sidebar currentPath={currentPath} />}
      <div className="app-layout-main-wrapper">
        <Header
          breadcrumbs={breadcrumbs}
          userInitials={userInitials}
          onFeedbackClick={onFeedbackClick}
          onAvatarClick={onAvatarClick}
        />
        <main className="app-layout-content">{children}</main>
      </div>
    </div>
  )
}
