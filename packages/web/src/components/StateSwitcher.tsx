import './StateSwitcher.css'

export interface StateSwitcherOption {
  value: string
  label: string
}

export interface StateSwitcherProps {
  options: StateSwitcherOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function StateSwitcher({
  options,
  value,
  onChange,
  className = '',
}: StateSwitcherProps) {
  return (
    <div className={`state-switcher ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`state-switcher-button ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
