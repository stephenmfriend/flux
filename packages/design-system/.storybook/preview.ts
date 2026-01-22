import '../src/styles/design-system.css'

export const parameters = {
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'dark', value: '#161616' },
      { name: 'surface', value: '#1c1c1c' }
    ]
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}
