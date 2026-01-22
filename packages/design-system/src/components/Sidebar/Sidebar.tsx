import { h } from 'preact'
import './Sidebar.css'

export interface NavItem {
  label: string
  icon: string
  active?: boolean
  onClick?: () => void
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface SidebarProps {
  brandText?: string
  groups: NavGroup[]
}

const icons: Record<string, any> = {
  projects: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  tasks: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  inbox: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  team: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M17 21v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a2 2 0 0 0-2-2-3-3 0 0 0-3-3"></path>
      <circle cx="16" cy="3.13" r="4"></circle>
    </svg>
  ),
  settings: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6m0 6v6m5.196-14.196l-4.242 4.242m0 6l-4.242 4.242M1 12h6m6 0h6M6.804 6.804l4.242 4.242m0 6l4.242 4.242"></path>
    </svg>
  )
}

export function Sidebar({ brandText = 'Flux', groups }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>{brandText}</span>
      </div>

      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="nav-group">
          <div className="nav-label">{group.label}</div>
          {group.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className={`nav-item${item.active ? ' active' : ''}`}
              onClick={item.onClick}
            >
              {icons[item.icon]}
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
