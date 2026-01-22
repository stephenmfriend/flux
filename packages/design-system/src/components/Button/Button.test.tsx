import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies default variant classes', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-brand-primary')
    expect(button).toHaveClass('text-black')
  })

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
    expect(button).toHaveClass('text-white')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')
    expect(screen.getByRole('button')).toHaveClass('px-4')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-12')
    expect(screen.getByRole('button')).toHaveClass('px-6')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles mouse enter/leave events', async () => {
    const handleMouseEnter = vi.fn()
    const handleMouseLeave = vi.fn()
    const user = userEvent.setup()

    render(
      <Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        Hover me
      </Button>
    )

    const button = screen.getByRole('button')
    await user.hover(button)
    expect(handleMouseEnter).toHaveBeenCalledTimes(1)

    await user.unhover(button)
    expect(handleMouseLeave).toHaveBeenCalledTimes(1)
  })

  it('handles focus/blur events', async () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    const user = userEvent.setup()

    render(
      <Button onFocus={handleFocus} onBlur={handleBlur}>
        Focus me
      </Button>
    )

    const button = screen.getByRole('button')
    await user.tab()
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('sets button type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders all variants correctly', () => {
    const variants = [
      { name: 'default', class: 'bg-brand-primary' },
      { name: 'destructive', class: 'bg-destructive' },
      { name: 'outline', class: 'border-border-default' },
      { name: 'secondary', class: 'bg-bg-surface' },
      { name: 'ghost', class: 'border-dashed' },
      { name: 'link', class: 'text-brand-primary' },
    ] as const

    variants.forEach(({ name, class: className }) => {
      const { unmount } = render(<Button variant={name}>{name}</Button>)
      expect(screen.getByRole('button')).toHaveClass(className)
      unmount()
    })
  })

  it('renders all sizes correctly', () => {
    const sizes = [
      { name: 'sm', class: 'h-8' },
      { name: 'default', class: 'h-10' },
      { name: 'lg', class: 'h-12' },
    ] as const

    sizes.forEach(({ name, class: className }) => {
      const { unmount } = render(<Button size={name}>{name}</Button>)
      expect(screen.getByRole('button')).toHaveClass(className)
      unmount()
    })
  })
})
