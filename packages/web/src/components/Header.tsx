import type { JSX } from 'preact'
import './Header.css'
import './Breadcrumb.css'

interface BreadcrumbItem {
  label: string
  active?: boolean
  badge?: string
  path?: string
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  userInitials?: string
  onFeedbackClick?: () => void
  onAvatarClick?: () => void
}

export function Header({
  breadcrumbs = [{ label: 'Projects', active: true }],
  onFeedbackClick,
  onAvatarClick,
}: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <nav className="header-breadcrumbs breadcrumb" aria-label="Breadcrumb">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="header-breadcrumb-item-wrapper">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {item.active === true ? (
              <span className="breadcrumb-item-current">
                {item.badge && <span className="breadcrumb-slug breadcrumb-slug-current">{item.badge}</span>}
                <span>{item.label}</span>
              </span>
            ) : (
              <a className="breadcrumb-item" href={item.path ?? '#'}>
                {item.badge && <span className="breadcrumb-slug">{item.badge}</span>}
                <span>{item.label}</span>
              </a>
            )}
          </div>
        ))}
      </nav>

      <div className="header-actions">
        <button
          className="header-feedback-button"
          onClick={onFeedbackClick}
          type="button"
        >
          Feedback
        </button>

        <div className="header-avatar" onClick={onAvatarClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    </header>
  )
}
