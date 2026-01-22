import { h } from 'preact'
import { useState } from 'preact/hooks'
import { SearchInput } from './SearchInput'

export default {
  title: 'Atoms/SearchInput',
  component: SearchInput,
}

// Default (from mockup line 119)
export const Default = () => (
  <SearchInput placeholder="Search tasks..." />
)

// With value
export const WithValue = () => {
  const [value, setValue] = useState('authentication')
  
  return (
    <SearchInput 
      value={value} 
      onChange={setValue}
      placeholder="Search tasks..." 
    />
  )
}

// Different placeholder
export const CustomPlaceholder = () => (
  <SearchInput placeholder="Find a project..." />
)

// Focus state demo
export const FocusState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-medium)' }}>Default state</div>
      <SearchInput placeholder="Search tasks..." />
    </div>
    <div>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-medium)' }}>Focus state (green border)</div>
      <SearchInput placeholder="Click to see focus state" />
    </div>
  </div>
)
