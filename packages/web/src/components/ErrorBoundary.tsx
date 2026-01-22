import { Component, ComponentChildren } from 'preact'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import './ErrorBoundary.css'

export interface ErrorBoundaryProps {
  children: ComponentChildren
  fallback?: (error: Error, errorInfo: string) => ComponentChildren
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    const stackInfo = errorInfo.componentStack !== undefined && errorInfo.componentStack !== ''
      ? errorInfo.componentStack
      : 'No additional error info available'
    this.setState({
      hasError: true,
      error,
      errorInfo: stackInfo,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ComponentChildren {
    if (this.state.hasError && this.state.error !== null) {
      if (this.props.fallback !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const errorInfo = this.state.errorInfo !== null && this.state.errorInfo !== ''
          ? this.state.errorInfo
          : 'No additional error info available'
        return this.props.fallback(this.state.error, errorInfo)
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <ExclamationTriangleIcon />
            </div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              The application encountered an unexpected error. Please reload the page to continue.
            </p>
            <div className="error-boundary-details">
              <details>
                <summary>Error details</summary>
                <div className="error-boundary-stack">
                  <strong>{this.state.error.toString()}</strong>
                  {this.state.errorInfo !== null && (
                    <pre>{this.state.errorInfo}</pre>
                  )}
                </div>
              </details>
            </div>
            <div className="error-boundary-actions">
              <Button variant="primary" onClick={this.handleReload}>
                Reload
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
