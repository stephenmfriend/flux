import Router from 'preact-router'
import { ProjectCreate, ProjectList, Board } from './pages'
import { ThemeProvider } from './components'

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <ProjectList path="/" />
        <ProjectCreate path="/new" />
        <Board path="/board/:projectId" />
      </Router>
    </ThemeProvider>
  )
}
