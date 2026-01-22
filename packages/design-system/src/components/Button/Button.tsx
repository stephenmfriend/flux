import { h, ComponentChildren } from 'preact'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-primary text-black hover:bg-brand-primary-dark',
        destructive:
          'bg-destructive text-white hover:bg-destructive-hover',
        outline:
          'border border-border-default bg-transparent text-text-high hover:bg-bg-surface-hover',
        secondary:
          'bg-bg-surface text-text-high border border-border-default hover:bg-bg-surface-hover',
        ghost:
          'border border-dashed border-border-default bg-transparent text-text-medium hover:border-text-medium hover:text-text-high hover:bg-white/[0.02]',
        link:
          'bg-transparent text-brand-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-4 text-sm',      // 32px height, 16px padding, 16px text
        default: 'h-10 px-4 text-base', // 40px height, 16px padding, 16px text
        lg: 'h-12 px-6 text-base',   // 48px height, 24px padding, 16px text
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ComponentChildren
  onClick?: (e?: any) => void
  onMouseEnter?: (e?: any) => void
  onMouseLeave?: (e?: any) => void
  onFocus?: (e?: any) => void
  onBlur?: (e?: any) => void
  onMouseDown?: (e?: any) => void
  onMouseUp?: (e?: any) => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export function Button({
  variant,
  size,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onMouseDown,
  onMouseUp,
  children,
  type = 'button',
  disabled = false,
  className,
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
