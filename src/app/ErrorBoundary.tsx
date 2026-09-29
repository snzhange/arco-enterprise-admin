import type { ErrorInfo, ReactNode } from 'react'
import type { RecoveryErrorKind } from '@/app/RecoveryErrorState'

import { Component, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDiagnosticId, isChunkLoadError, requestChunkRetry } from '@/app/error-recovery'
import { RecoveryErrorState } from '@/app/RecoveryErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
  kind: RecoveryErrorKind
  retryRoute?: string
  onBackToWorkplace: () => void
  reload?: () => void
}

interface ErrorBoundaryState {
  error: unknown
  retryKey: number
}

export function reloadCurrentPage(): void {
  if (typeof window !== 'undefined')
    window.location.reload()
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, retryKey: 0 }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(_error: unknown, _errorInfo: ErrorInfo): void {
    // React requires this lifecycle for side-effect hooks around caught errors.
  }

  private handleRetry = (): void => {
    const { error } = this.state
    if (this.props.kind === 'root') {
      try {
        (this.props.reload ?? reloadCurrentPage)()
      }
      catch {
        this.setState(state => ({ error: null, retryKey: state.retryKey + 1 }))
      }
      return
    }

    if (isChunkLoadError(error) && requestChunkRetry(this.props.retryRoute)) {
      try {
        (this.props.reload ?? reloadCurrentPage)()
      }
      catch {
        this.setState(state => ({ error: null, retryKey: state.retryKey + 1 }))
      }
      return
    }

    this.setState(state => ({ error: null, retryKey: state.retryKey + 1 }))
  }

  render() {
    const { error, retryKey } = this.state
    if (error) {
      return (
        <RecoveryErrorState
          kind={isChunkLoadError(error) ? 'chunk' : this.props.kind}
          diagnosticId={getDiagnosticId(error)}
          onRetry={this.handleRetry}
          onBackToWorkplace={this.props.onBackToWorkplace}
        />
      )
    }

    return <Fragment key={retryKey}>{this.props.children}</Fragment>
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const routeKey = `${location.pathname}${location.search}${location.hash}`

  return (
    <ErrorBoundary
      key={routeKey}
      kind="route"
      retryRoute={routeKey}
      onBackToWorkplace={() => navigate('/dashboard/workplace', { replace: true })}
    >
      {children}
    </ErrorBoundary>
  )
}

export function RootErrorBoundary({ children, reload }: { children: ReactNode, reload?: () => void }) {
  return (
    <ErrorBoundary
      kind="root"
      reload={reload}
      onBackToWorkplace={() => {
        if (typeof window !== 'undefined')
          window.location.assign('/dashboard/workplace')
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
