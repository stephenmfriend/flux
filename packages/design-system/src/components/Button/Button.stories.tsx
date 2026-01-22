import { h } from 'preact'
import { Button } from './Button'
import type { Meta, StoryObj } from '@storybook/preact'
import { expect, userEvent, within, fn } from '@storybook/test'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button visual style',
    },
    size: {
      control: 'radio',
      options: ['sm', 'default', 'lg'],
      description: 'Button size (t-shirt sizing)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    onClick: {
      action: 'clicked',
      description: 'Fires when button is clicked',
    },
    onMouseEnter: {
      action: 'mouse-enter',
      description: 'Fires when mouse enters button',
    },
    onMouseLeave: {
      action: 'mouse-leave',
      description: 'Fires when mouse leaves button',
    },
    onFocus: {
      action: 'focused',
      description: 'Fires when button receives focus',
    },
    onBlur: {
      action: 'blurred',
      description: 'Fires when button loses focus',
    },
    onMouseDown: {
      action: 'mouse-down',
      description: 'Fires when mouse button pressed',
    },
    onMouseUp: {
      action: 'mouse-up',
      description: 'Fires when mouse button released',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type',
    },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    disabled: false,
    type: 'button',
  },
}

export default meta
type Story = StoryObj<typeof Button>

// Primary story with controls
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

// Variant examples
export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Action',
    size: "sm"
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

// Size examples
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

// With icon
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    children: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
  },
}

// State examples
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Loading...
      </>
    ),
  },
}

// QA Testing Story - Shows all actions firing
export const QAInteractionTest: Story = {
  args: {
    children: 'Interact with me!',
  },
  parameters: {
    docs: {
      description: {
        story: 'For QA: Hover, focus, click, and interact with this button. Check the Actions panel below to see all events firing.',
      },
    },
  },
}

// Automated Interaction Test - Runs automatically in Storybook
export const AutomatedInteractionTest: Story = {
  args: {
    children: 'Automated Test Button',
    onClick: fn(),
    onMouseEnter: fn(),
    onMouseLeave: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /automated test button/i })

    // Test 1: Button is rendered
    await expect(button).toBeInTheDocument()

    // Test 2: Button has correct text
    await expect(button).toHaveTextContent('Automated Test Button')

    // Test 3: Button is not disabled
    await expect(button).not.toBeDisabled()

    // Test 4: Button has correct variant class
    await expect(button).toHaveClass('btn-default')

    // Test 5: Click interaction
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)

    // Test 6: Hover interaction
    await userEvent.hover(button)
    await expect(args.onMouseEnter).toHaveBeenCalled()

    // Test 7: Unhover interaction
    await userEvent.unhover(button)
    await expect(args.onMouseLeave).toHaveBeenCalled()
  },
  parameters: {
    docs: {
      description: {
        story: 'Automated test that runs in Storybook Interactions panel. Validates rendering, click, and hover interactions.',
      },
    },
  },
}

// Visual comparison grids (non-interactive)
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px' }}>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const SizeVariantMatrix: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-medium)' }}>Default variant</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="default" size="sm">Small</Button>
          <Button variant="default" size="default">Default</Button>
          <Button variant="default" size="lg">Large</Button>
        </div>
      </div>
      
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-medium)' }}>Outline variant</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="outline" size="sm">Small</Button>
          <Button variant="outline" size="default">Default</Button>
          <Button variant="outline" size="lg">Large</Button>
        </div>
      </div>
      
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-medium)' }}>Ghost variant</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="ghost" size="sm">Small</Button>
          <Button variant="ghost" size="default">Default</Button>
          <Button variant="ghost" size="lg">Large</Button>
        </div>
      </div>
    </div>
  ),
}
