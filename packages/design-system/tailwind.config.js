/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Keep Tailwind defaults but remove odd spacing values (8pt grid enforcement)
    spacing: {
      px: '1px',
      0: '0px',
      // 1: removed (4px - not 8pt grid)
      2: '0.5rem',   // 8px ✅
      // 3: removed (12px - not 8pt grid)
      4: '1rem',     // 16px ✅
      // 5: removed (20px - not 8pt grid)
      6: '1.5rem',   // 24px ✅
      // 7: removed (28px - not 8pt grid)
      8: '2rem',     // 32px ✅
      // 9: removed (36px - not 8pt grid)
      10: '2.5rem',  // 40px ✅
      // 11: removed (44px - not 8pt grid)
      12: '3rem',    // 48px ✅
      14: '3.5rem',  // 56px ✅
      16: '4rem',    // 64px ✅
      20: '5rem',    // 80px ✅
      24: '6rem',    // 96px ✅
      28: '7rem',    // 112px ✅
      32: '8rem',    // 128px ✅
      36: '9rem',    // 144px ✅
      40: '10rem',   // 160px ✅
      44: '11rem',   // 176px ✅
      48: '12rem',   // 192px ✅
      52: '13rem',   // 208px ✅
      56: '14rem',   // 224px ✅
      60: '15rem',   // 240px ✅
      64: '16rem',   // 256px ✅
      72: '18rem',   // 288px ✅
      80: '20rem',   // 320px ✅
      96: '24rem',   // 384px ✅
    },
    fontSize: {
      // Only 8pt-grid font sizes allowed
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - EXCEPTION (close to 16px)
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px ✅
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - EXCEPTION
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - EXCEPTION
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px ✅
      '3xl': ['2rem', { lineHeight: '2.5rem' }],    // 32px ✅
      '4xl': ['2.5rem', { lineHeight: '3rem' }],    // 40px ✅
      '5xl': ['3rem', { lineHeight: '3.5rem' }],    // 48px ✅
    },
    extend: {
      colors: {
        // Flux Design System - Supabase Dark Theme
        'bg-base': 'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-surface-hover': 'var(--color-bg-surface-hover)',
        'bg-overlay': 'var(--color-bg-overlay)',

        'border-subtle': 'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-focus': 'var(--color-border-focus)',

        'brand-primary': 'var(--color-brand-primary)',
        'brand-primary-dark': 'var(--color-brand-primary-dark)',

        'text-high': 'var(--color-text-high)',
        'text-medium': 'var(--color-text-medium)',
        'text-low': 'var(--color-text-low)',

        'status-planning': 'var(--color-status-planning)',
        'status-todo': 'var(--color-status-todo)',
        'status-progress': 'var(--color-status-progress)',
        'status-done': 'var(--color-status-done)',

        'destructive': 'var(--color-destructive)',
        'destructive-hover': 'var(--color-destructive-hover)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        hover: 'var(--shadow-hover)',
      },
    },
  },
  plugins: [],
}
