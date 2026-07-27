import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[InfraSight UI ErrorBoundary]', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#1e293b', color: '#f8fafc', fontFamily: 'sans-serif', borderRadius: '8px', margin: '2rem' }}>
          <h2>Something went wrong in the InfraSight UI</h2>
          <p style={{ color: '#f87171' }}>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
