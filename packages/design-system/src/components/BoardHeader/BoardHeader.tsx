import { h } from 'preact'
import './BoardHeader.css'
import { SearchInput } from '../SearchInput'
import { Button } from '../Button'

export interface BoardHeaderProps {
  title: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  onFilterClick?: () => void
  onSyncClick?: () => void
  syncTime?: string
  children?: any
}

export function BoardHeader({ 
  title, 
  searchValue, 
  onSearchChange, 
  viewMode = 'grid',
  onViewModeChange,
  onFilterClick,
  onSyncClick,
  syncTime,
  children
}: BoardHeaderProps) {
  return (
    <div className="board-header">
      <div className="board-title">
        <h1>{title}</h1>
      </div>
      <div className="board-actions">
        <div className="search-group">
          <SearchInput
            placeholder="Search tasks..."
            value={searchValue}
            onChange={onSearchChange}
          />
          <button className="btn btn-secondary" style={{ padding: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        <div 
          className="view-toggle"
          style={{ 
            display: 'flex', 
            background: 'var(--bg-surface)', 
            padding: '2px', 
            borderRadius: '6px', 
            border: '1px solid var(--border-subtle)' 
          }}
        >
          <button 
            className={`btn-icon${viewMode === 'grid' ? ' active' : ''}`}
            style={{ 
              padding: '4px 8px', 
              border: 'none', 
              background: viewMode === 'grid' ? 'var(--bg-surface-hover)' : 'transparent', 
              borderRadius: '4px', 
              color: viewMode === 'grid' ? 'var(--text-high)' : 'var(--text-medium)', 
              cursor: 'pointer' 
            }}
            onClick={() => onViewModeChange?.('grid')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button 
            className={`btn-icon${viewMode === 'list' ? ' active' : ''}`}
            style={{ 
              padding: '4px 8px', 
              border: 'none', 
              background: viewMode === 'list' ? 'var(--bg-surface-hover)' : 'transparent', 
              borderRadius: '4px', 
              color: viewMode === 'list' ? 'var(--text-high)' : 'var(--text-medium)', 
              cursor: 'pointer' 
            }}
            onClick={() => onViewModeChange?.('list')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        <Button onClick={onFilterClick}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18M3 18h18"></path>
          </svg>
          Filter
        </Button>
        <Button onClick={onSyncClick}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Sync
          {syncTime && <span style={{ opacity: 0.5, fontSize: '11px', marginLeft: '4px' }}>{syncTime}</span>}
        </Button>
        {children}
      </div>
    </div>
  )
}
