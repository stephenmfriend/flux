import { render } from 'preact'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { App } from './app.tsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const app = clerkKey ? (
  <ClerkProvider publishableKey={clerkKey}>
    <App />
  </ClerkProvider>
) : (
  <App />
)

render(app, document.getElementById('app')!)
