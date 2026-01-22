import { h } from 'preact'
import './Header.css'

export interface BreadcrumbItem {
  label: string
  badge?: { text: string; color: 'green' | 'gray' }
}

export interface HeaderProps {
  breadcrumbs: BreadcrumbItem[]
  onFeedbackClick?: () => void
  onAvatarClick?: () => void
}

export function Header({ breadcrumbs, onFeedbackClick, onAvatarClick }: HeaderProps) {
  return (
    <header className="top-header">
      <div className="breadcrumbs">
        {breadcrumbs.map((item, index) => (
          <>
            {index > 0 && <span className="slash">/</span>}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {item.badge && (
                <span 
                  className={`badge badge-${item.badge.color}`}
                  style={{ 
                    fontSize: '10px', 
                    padding: '1px 6px', 
                    height: '18px', 
                    marginRight: '8px', 
                    borderRadius: '10px',
                    border: item.badge.color === 'green' ? '1px solid rgba(62, 207, 142, 0.3)' : undefined
                  }}
                >
                  {item.badge.text}
                </span>
              )}
              <span className={index === breadcrumbs.length - 1 ? 'current-page' : ''}>
                {item.label}
              </span>
            </div>
          </>
        ))}
      </div>

      <div className="header-actions">
        <div 
          className="btn-secondary" 
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '99px', cursor: 'pointer' }}
          onClick={onFeedbackClick}
        >
          Feedback
        </div>
        <div className="avatar" onClick={onAvatarClick} style={{ cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    </header>
  )
}
