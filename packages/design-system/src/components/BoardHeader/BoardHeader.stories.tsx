import { h } from 'preact'
import { useState } from 'preact/hooks'
import { BoardHeader } from './BoardHeader'

export default {
  title: 'Molecules/BoardHeader',
  component: BoardHeader,
}

// Default from mockup line 112
export const Default = () => {
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  return (
    <BoardHeader 
      title="Q3 Migration"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      syncTime="2m ago"
    />
  )
}

// With search value
export const WithSearch = () => {
  const [searchValue, setSearchValue] = useState('authentication')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  return (
    <BoardHeader 
      title="Q3 Migration"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      syncTime="2m ago"
    />
  )
}

// List view mode
export const ListView = () => {
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  return (
    <BoardHeader 
      title="Q3 Migration"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      syncTime="2m ago"
    />
  )
}

// Different title
export const DifferentTitle = () => {
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  return (
    <BoardHeader 
      title="Backend Services"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      syncTime="5m ago"
    />
  )
}
