import Router from 'preact-router'
import { useEffect } from 'preact/hooks'
import { ProjectCreate, ProjectList, Board, Webhooks, Auth } from './pages'
import { BuildInfoFooter, ThemeProvider } from './components'
import { useFluxAuth, isClerkEnabled } from './stores/auth'
import { setAsyncTokenGetter } from './stores/api'

function AuthSetup({ children }: { children: preact.ComponentChildren }) {
  const { getAuthToken } = useFluxAuth()

  useEffect(() => {
    // Set up async token getter for API calls
    setAsyncTokenGetter(getAuthToken)
    return () => setAsyncTokenGetter(null)
  }, [getAuthToken])

  return <>{children}</>
}

function AppContent() {
  return (
    <Router>
      <ProjectList path="/" />
      <ProjectCreate path="/new" />
      <Board path="/board/:projectId" />
      <Webhooks path="/webhooks" />
      <Auth path="/auth" />
    </Router>
  )
}

export function App() {
  // If Clerk is enabled, wrap with AuthSetup to set up token getter
  const content = isClerkEnabled() ? (
    <AuthSetup>
      <AppContent />
    </AuthSetup>
  ) : (
    <AppContent />
  )

  return (
    <ThemeProvider>
      {content}
      <BuildInfoFooter />
    </ThemeProvider>
  )
}
