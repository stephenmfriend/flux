import Router from 'preact-router'
import { ProjectCreate, ProjectList, Board, Webhooks } from './pages'
import { Bet } from './pages/Bet'
import { BuildInfoFooter, ThemeProvider } from './components'
import { TaskCardDemo } from './pages/dev/TaskCardDemo'

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <ProjectList path="/" />
        <ProjectCreate path="/new" />
        <Board path="/board/:projectId" />
        <Bet path="/bet/:projectId/:epicId" />
        <Webhooks path="/webhooks" />
        <TaskCardDemo path="/dev/taskcard" />
      </Router>
      <BuildInfoFooter />
    </ThemeProvider>
  )
}
