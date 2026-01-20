import { render } from 'preact'
import './index.css'
import './dev-error-handlers' // Install global error handlers in dev mode
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)
