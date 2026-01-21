import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { SearchInput } from './Input'
import { Button } from './Button'
import './BoardHeader.css'

export interface BoardHeaderProps {
  title: string
  onSearch?: (query: string) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  onFilter?: () => void
  onSync?: () => void
  onNewTask?: () => void
}

export function BoardHeader({
  title,
  onSearch,
  viewMode = 'grid',
  onViewModeChange,
  onFilter,
  onSync,
  onNewTask,
}: BoardHeaderProps) {
  return (
    <div className="board-header">
      <div className="board-header-left">
        <h1 className="board-header-title">{title}</h1>
      </div>

      <div className="board-header-actions">
        <div className="board-header-search-group">
          <SearchInput
            placeholder="Search tasks..."
            onChange={(value) => onSearch?.(value)}
          />
          <button className="board-header-search-button" aria-label="Search">
            <MagnifyingGlassIcon />
          </button>
        </div>

        <div className="board-header-view-toggle">
          <button
            className={`board-header-view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange?.('grid')}
            aria-label="Grid view"
          >
            <Squares2X2Icon />
          </button>
          <button
            className={`board-header-view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange?.('list')}
            aria-label="List view"
          >
            <ListBulletIcon />
          </button>
        </div>

        <Button variant="secondary" size="small" onClick={onFilter}>
          <FunnelIcon style={{ width: '14px', height: '14px' }} />
          Filter
        </Button>

        <Button variant="secondary" size="small" onClick={onSync}>
          <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
          Sync
        </Button>

        <Button variant="primary" size="small" onClick={onNewTask}>
          <PlusIcon style={{ width: '14px', height: '14px' }} />
          New Task
        </Button>
      </div>
    </div>
  )
}
