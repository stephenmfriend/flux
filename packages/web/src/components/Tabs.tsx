import { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import './Tabs.css'

export interface TabItem {
  id: string
  label: string
  icon?: any
  badge?: string | number
  content: ComponentChildren
}

export interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, defaultTab, onTabChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              className={`tab-button ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {Icon && (
                <span className="tab-icon">
                  <Icon style={{ width: '100%', height: '100%' }} />
                </span>
              )}
              {tab.label}
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="tabs-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-panel ${tab.id === activeTab ? 'active' : ''}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
