import { h } from 'preact'
import './SearchInput.css'

export interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchInput({ placeholder = 'Search tasks...', value, onChange }: SearchInputProps) {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    onChange?.(target.value)
  }
  
  return (
    <input 
      type="text" 
      className="search-input" 
      placeholder={placeholder}
      value={value}
      onInput={handleInput}
    />
  )
}
